import { Builder, Browser, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import puppeteer from 'puppeteer';
import { extractJobPostingJsonLd, CareerPageProvider } from './career-page.provider';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

type SeleniumJob = ReturnType<typeof extractJobPostingJsonLd>[number];

const MAX_PAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_JOB_LINK_SELECTOR = 'a[href*="/job"],a[href*="/career"],a[href*="/position"],a[href*="/vacan"]';
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const allowedDomains = (): Set<string> => new Set(String(process.env.SELENIUM_JOB_ALLOWED_DOMAINS || '')
  .split(',').map(value => value.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean));

const normalizedHost = (value: string): string => new URL(value).hostname.toLowerCase().replace(/^www\./, '');

const assertAllowedSource = (company: ProviderCompanyConfig): void => {
  if (!company.pageUrl || !/^https:\/\//i.test(company.pageUrl)) throw new Error('A public HTTPS Selenium source URL is required');
  if (!['written_permission', 'public_terms_allow'].includes(company.automationPermission || '')) {
    throw new Error('Selenium source is disabled until written permission or public terms explicitly allow automated access');
  }
  const host = normalizedHost(company.pageUrl);
  if (!allowedDomains().has(host)) throw new Error(`${host} is not present in SELENIUM_JOB_ALLOWED_DOMAINS`);
};

const assertNoAccessBarrier = async (driver: WebDriver): Promise<void> => {
  const currentUrl = await driver.getCurrentUrl();
  if (/\/(?:login|signin|auth|captcha|challenge)(?:[/?#]|$)/i.test(currentUrl)) {
    throw new Error('Selenium stopped because the source redirected to an authentication or challenge page');
  }
  const source = (await driver.getPageSource()).slice(0, 250_000);
  if (/g-recaptcha|hcaptcha|cf-chl-|verify you are human|access denied/i.test(source)) {
    throw new Error('Selenium stopped because CAPTCHA, bot challenge, or access denial was detected');
  }
};

const buildDriver = async (): Promise<WebDriver> => {
  const options = new chrome.Options();
  const userAgent = process.env.JOB_SOURCE_USER_AGENT
    || 'CampusPeJobDiscoveryBot/1.0 (+https://campuspe.com; contact: support@campuspe.com)';
  options.addArguments('--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--window-size=1440,1200', `--user-agent=${userAgent}`);
  options.setUserPreferences({ 'profile.default_content_setting_values.notifications': 2 });
  const binary = process.env.SELENIUM_CHROME_BINARY?.trim() || puppeteer.executablePath();
  if (binary) options.setBinaryPath(binary);
  const remote = process.env.SELENIUM_REMOTE_URL?.trim();
  let builder = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options);
  if (remote) builder = builder.usingServer(remote);
  return builder.build();
};

export class SeleniumPageProvider implements JobProvider<SeleniumJob> {
  readonly name = 'selenium_page' as const;
  private readonly mapper = new CareerPageProvider();

  isAuthoritativeSnapshot(): boolean {
    // Rendered pages may use lazy loading or pagination. Their bounded result
    // set is suitable for ingestion but never for authoritative deletion.
    return false;
  }

  async fetchJobs(company: ProviderCompanyConfig): Promise<SeleniumJob[]> {
    assertAllowedSource(company);
    const startUrl = company.pageUrl!;
    await publicSourceHttp.assertRobotsAllowedStrict(startUrl);
    const driver = await buildDriver();
    const jobs: SeleniumJob[] = [];
    try {
      await driver.manage().setTimeouts({ pageLoad: 25_000, script: 10_000, implicit: 0 });
      await driver.get(startUrl);
      await assertNoAccessBarrier(driver);
      await driver.executeScript('window.scrollTo(0, Math.min(document.body.scrollHeight, 2500));');
      await sleep(Math.max(750, Number(process.env.SELENIUM_JOB_DELAY_MS || 1200)));
      const listingHtml = await driver.getPageSource();
      if (Buffer.byteLength(listingHtml) > MAX_PAGE_BYTES) throw new Error('Rendered source page exceeded the safe size limit');
      jobs.push(...extractJobPostingJsonLd(listingHtml));

      const selector = company.jobLinkSelector || DEFAULT_JOB_LINK_SELECTOR;
      const rawLinks = await driver.executeScript<string[]>(`
        return Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
          .map(node => node.href).filter(Boolean);
      `);
      const sourceHost = normalizedHost(startUrl);
      const links = [...new Set(rawLinks)].filter(link => {
        try {
          const url = new URL(link);
          return url.protocol === 'https:' && normalizedHost(link) === sourceHost
            && url.toString() !== new URL(startUrl).toString()
            && !/\/(?:login|signin|auth|captcha|challenge)(?:[/?#]|$)/i.test(url.pathname);
        } catch { return false; }
      }).slice(0, Math.min(100, Math.max(1, company.maxJobsPerSync || 30)));

      for (const link of links) {
        await publicSourceHttp.assertRobotsAllowedStrict(link);
        await sleep(Math.max(750, Number(process.env.SELENIUM_JOB_DELAY_MS || 1200)));
        await driver.get(link);
        await assertNoAccessBarrier(driver);
        const html = await driver.getPageSource();
        if (Buffer.byteLength(html) <= MAX_PAGE_BYTES) jobs.push(...extractJobPostingJsonLd(html));
      }
    } finally {
      await driver.quit().catch(() => undefined);
    }
    const seen = new Set<string>();
    return jobs.filter(job => {
      const identifier = typeof job.identifier === 'string' ? job.identifier : job.identifier?.value;
      const key = String(identifier || job.url || `${job.title}|${job.datePosted}`).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  mapJob(raw: SeleniumJob, company: ProviderCompanyConfig): JobDto {
    return {
      ...this.mapper.mapJob(raw, company),
      source: 'job_board',
      sourceProvider: 'selenium_page',
      sourceCompanySlug: company.companySlug,
      attributionName: company.companyName,
      attributionUrl: company.pageUrl
    };
  }
}
