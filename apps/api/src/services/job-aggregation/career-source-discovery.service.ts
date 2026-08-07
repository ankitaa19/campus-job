import { ProviderCompany } from '../../models/ProviderCompany';
import ProviderCompaniesService from './provider-companies.service';
import { publicSourceHttp } from './public-source-http';
import { ProviderName } from './types';

interface DiscoveryResult {
  companySlug: string;
  pageUrl: string;
  status: 'verified' | 'unsupported' | 'failed';
  provider?: ProviderName;
  providerSlug?: string;
  error?: string;
}

const normalizeHtml = (value: string): string => value
  .replace(/\\\//g, '/')
  .replace(/&amp;/gi, '&')
  .replace(/&#x2F;|&#47;/gi, '/');

const detectProvider = (html: string, finalUrl: string): { provider: ProviderName; slug: string } | undefined => {
  const haystack = `${finalUrl}\n${normalizeHtml(html)}`;
  const patterns: Array<{ provider: ProviderName; regex: RegExp }> = [
    { provider: 'greenhouse', regex: /(?:boards|job-boards)\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9_-]+)/i },
    { provider: 'lever', regex: /jobs\.lever\.co\/([a-z0-9_-]+)/i },
    { provider: 'ashby', regex: /jobs\.ashbyhq\.com\/([a-z0-9_-]+)/i },
    { provider: 'smartrecruiters', regex: /careers\.smartrecruiters\.com\/([a-z0-9_-]+)/i }
  ];
  for (const item of patterns) {
    const slug = haystack.match(item.regex)?.[1]?.toLowerCase();
    if (slug && /^[a-z0-9][a-z0-9_-]*$/.test(slug)) return { provider: item.provider, slug };
  }
  const workday = haystack.match(/https?:\/\/([a-z0-9-]+\.(?:wd\d+|wd\d+impl)\.myworkdayjobs\.com)\/(?:[a-z]{2}-[A-Z]{2}\/)?([a-z0-9_-]+)/i);
  if (workday) return { provider: 'workday', slug: `${workday[1].split('.')[0]}-${workday[2]}`.toLowerCase() };
  return undefined;
};

class CareerSourceDiscoveryService {
  private running = false;

  async discoverPending(limit = Number(process.env.CAREER_DIRECTORY_DISCOVERY_BATCH || 75)): Promise<DiscoveryResult[]> {
    if (this.running) return [];
    this.running = true;
    try {
      await ProviderCompaniesService.seedFromEnvironment();
      const cappedLimit = Math.min(100, Math.max(1, limit));
      const retryBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const sources = await ProviderCompany.find({
        provider: 'career_page',
        directoryManaged: true,
        isActive: false,
        pageUrl: /^https:\/\//i,
        $or: [
          { discoveryStatus: 'pending' },
          { discoveryStatus: 'failed', lastDiscoveredAt: { $lt: retryBefore } },
          { discoveryStatus: { $exists: false } }
        ]
      }).sort({ lastDiscoveredAt: 1, companySlug: 1 }).limit(cappedLimit).lean();

      const results: DiscoveryResult[] = [];
      let cursor = 0;
      const worker = async (): Promise<void> => {
        while (cursor < sources.length) {
          const source = sources[cursor++];
          results.push(await this.discoverSource(source as any));
        }
      };
      const concurrency = Math.min(5, Math.max(1, Number(process.env.CAREER_DIRECTORY_DISCOVERY_CONCURRENCY || 4)));
      await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, () => worker()));
      return results;
    } finally {
      this.running = false;
    }
  }

  private async discoverSource(source: { _id: unknown; companySlug: string; companyName: string; pageUrl: string }): Promise<DiscoveryResult> {
    const base = { companySlug: source.companySlug, pageUrl: source.pageUrl };
    try {
      const response = await publicSourceHttp.get<string>(source.pageUrl, {
        checkRobots: true,
        timeout: 20000,
        maxRedirects: 5,
        maxContentLength: 3 * 1024 * 1024,
        responseType: 'text',
        headers: { 'User-Agent': 'CampusPeJobDiscoveryBot/1.0 (+https://campuspe.com)' }
      });
      const html = typeof response.data === 'string' ? response.data : String(response.data || '');
      const finalUrl = (response.request as any)?.res?.responseUrl || source.pageUrl;
      const detected = detectProvider(html, finalUrl);
      const hasJobPostingJsonLd = /["']@type["']\s*:\s*["']JobPosting["']/i.test(html);

      if (detected) {
        const workdayUrl = detected.provider === 'workday'
          ? `${finalUrl}\n${normalizeHtml(html)}`.match(/https?:\/\/[a-z0-9-]+\.(?:wd\d+|wd\d+impl)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?[a-z0-9_-]+/i)?.[0]
          : undefined;
        await ProviderCompany.findOneAndUpdate(
          { provider: detected.provider, companySlug: detected.slug },
          {
            $set: { companyName: source.companyName, sourceType: 'company_careers', isActive: true, ...(workdayUrl ? { pageUrl: workdayUrl } : {}) },
            $setOnInsert: { apiRegion: 'global', lastSyncStatus: 'never' }
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
        await ProviderCompany.findByIdAndUpdate(source._id, {
          $set: { discoveryStatus: 'verified', lastDiscoveredAt: new Date(), lastError: null }
        });
        return { ...base, status: 'verified', provider: detected.provider, providerSlug: detected.slug };
      }

      if (hasJobPostingJsonLd) {
        await ProviderCompany.findByIdAndUpdate(source._id, {
          $set: { isActive: true, discoveryStatus: 'verified', lastDiscoveredAt: new Date(), lastError: null }
        });
        return { ...base, status: 'verified', provider: 'career_page', providerSlug: source.companySlug };
      }

      await ProviderCompany.findByIdAndUpdate(source._id, {
        $set: { discoveryStatus: 'unsupported', lastDiscoveredAt: new Date(), lastError: 'No supported public ATS or JobPosting feed was detected' }
      });
      return { ...base, status: 'unsupported' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ProviderCompany.findByIdAndUpdate(source._id, {
        $set: { discoveryStatus: 'failed', lastDiscoveredAt: new Date(), lastError: message.slice(0, 1000) }
      });
      return { ...base, status: 'failed', error: message };
    }
  }

}

export default new CareerSourceDiscoveryService();
