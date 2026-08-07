import { ProviderCompany } from '../../models/ProviderCompany';
import { Types } from 'mongoose';
import { ProviderCompanyConfig, ProviderName } from './types';
import indiaCareerDirectory from '../../config/india-career-sources.json';
import attachedCareerDirectory from '../../config/attached-career-sources.json';

type DirectorySource = {
  slug: string;
  name: string;
  url: string;
  sourceKind: string;
};

const canonicalSourceUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return value.trim().toLowerCase();
  }
};

const displayNameFromSlug = (slug: string): string => slug
  .split(/[-_]/)
  .filter(Boolean)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

class ProviderCompaniesService {
  async seedFromEnvironment(): Promise<void> {
    await this.seedIndiaCareerDirectoryCatalog();
    await this.seedJobPortalCatalog();
    await this.seedAuthorizedSeleniumSources();
    const raw = process.env.LEVER_COMPANIES?.trim();
    const greenhouseRaw = process.env.GREENHOUSE_COMPANIES?.trim();
    const ashbyRaw = process.env.ASHBY_COMPANIES?.trim();
    const smartRecruitersRaw = process.env.SMARTRECRUITERS_COMPANIES?.trim();
    const workdayRaw = process.env.WORKDAY_COMPANIES?.trim();
    const careerPageRaw = process.env.CAREER_PAGE_COMPANIES?.trim();
    const adzunaEnabled = Boolean(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim());
    const useDefaults = !raw && !greenhouseRaw && !ashbyRaw && !smartRecruitersRaw && !workdayRaw && !careerPageRaw && process.env.JOB_SYNC_SEED_DEFAULTS !== 'false';

    let companies: Array<{ slug: string; name?: string; region?: 'global' | 'eu'; sourceType?: 'company_careers' | 'job_board'; recruiterId?: string }> = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) companies = parsed;
      } catch {
        companies = raw.split(',').map(slug => ({ slug: slug.trim() })).filter(company => company.slug);
      }
    }

    // Keep a fresh public jobs experience out of the box. Deployments can
    // disable this starter source or replace it with their own provider list.
    if (useDefaults) {
      companies = [
        { slug: 'omnisend', name: 'Omnisend', region: 'global', sourceType: 'company_careers' },
        { slug: 'palantir', name: 'Palantir', region: 'global', sourceType: 'company_careers' }
      ];
    }

    for (const company of companies) {
      const slug = company.slug?.trim().toLowerCase();
      if (!slug) continue;
      const recruiterId = company.recruiterId && Types.ObjectId.isValid(company.recruiterId)
        ? new Types.ObjectId(company.recruiterId)
        : undefined;
      await ProviderCompany.findOneAndUpdate(
        { provider: 'lever', companySlug: slug },
        {
          $set: {
            companyName: company.name?.trim() || displayNameFromSlug(slug),
            apiRegion: company.region || 'global',
            sourceType: company.sourceType || 'company_careers',
            ...(recruiterId ? { recruiterId } : {}),
            isActive: true
          },
          $setOnInsert: { lastSyncStatus: 'never' }
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    await this.seedSimpleProvider('greenhouse', greenhouseRaw, useDefaults ? [
      { slug: 'stripe', name: 'Stripe' },
      { slug: 'figma', name: 'Figma' },
      { slug: 'discord', name: 'Discord' },
      { slug: 'amplitude', name: 'Amplitude' },
      { slug: 'launchdarkly', name: 'LaunchDarkly' },
      { slug: 'marqeta', name: 'Marqeta' },
      { slug: 'razorpaysoftwareprivatelimited', name: 'Razorpay' },
      { slug: 'vercel', name: 'Vercel' },
      { slug: 'inflectionai', name: 'Inflection AI' }
    ] : []);
    await this.seedSimpleProvider('ashby', ashbyRaw, useDefaults ? [
      { slug: 'ramp', name: 'Ramp' },
      { slug: 'notion', name: 'Notion' },
      { slug: 'cognition', name: 'Cognition (Devin)' },
      { slug: 'cohere', name: 'Cohere' },
      { slug: 'linear', name: 'Linear' },
      { slug: 'runway-ml', name: 'Runway' },
      { slug: 'sentry', name: 'Sentry' },
      { slug: 'sierra', name: 'Sierra' }
    ] : []);
    // SmartRecruiters is supported when explicitly configured, but it is not
    // seeded by default because its API robots policy currently disallows the
    // automated requests used by this connector.
    await this.seedSimpleProvider('smartrecruiters', smartRecruitersRaw, []);
    await this.seedSimpleProvider('workday', workdayRaw, []);
    if (adzunaEnabled) {
      const countries = String(process.env.ADZUNA_COUNTRIES || 'in')
        .split(',').map(value => value.trim().toLowerCase()).filter(value => /^[a-z]{2}$/.test(value));
      await this.seedSimpleProvider('adzuna', undefined, countries.map(country => ({
        slug: country,
        name: `Adzuna ${country.toUpperCase()}`,
        sourceType: 'job_board' as const
      })));
    }
    const publicRemoteFeedsEnabled = process.env.PUBLIC_REMOTE_FEEDS_ENABLED === 'true'
      || (useDefaults && process.env.PUBLIC_REMOTE_FEEDS_ENABLED !== 'false');
    if (publicRemoteFeedsEnabled) {
      await this.seedSimpleProvider('himalayas', undefined, [{ slug: 'global', name: 'Himalayas' }]);
      await this.seedSimpleProvider('weworkremotely', undefined, [{ slug: 'global', name: 'We Work Remotely' }]);
    }

    if (careerPageRaw) {
      let pages: Array<{ slug: string; name: string; url: string; sourceType?: 'company_careers' | 'job_board'; recruiterId?: string }> = [];
      try { const parsed = JSON.parse(careerPageRaw); if (Array.isArray(parsed)) pages = parsed; } catch {}
      for (const page of pages) {
        const slug = page.slug?.trim().toLowerCase();
        if (!slug || !page.url || !/^https:\/\//i.test(page.url)) continue;
        const recruiterId = page.recruiterId && Types.ObjectId.isValid(page.recruiterId) ? new Types.ObjectId(page.recruiterId) : undefined;
        await ProviderCompany.findOneAndUpdate(
          { provider: 'career_page', companySlug: slug },
          { $set: { companyName: page.name || displayNameFromSlug(slug), pageUrl: page.url, sourceType: page.sourceType || 'company_careers', isActive: true, ...(recruiterId ? { recruiterId } : {}) }, $setOnInsert: { lastSyncStatus: 'never' } },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }
  }

  private async seedIndiaCareerDirectoryCatalog(): Promise<void> {
    if (process.env.INDIA_CAREER_DIRECTORY_CATALOG_ENABLED === 'false') return;
    const candidates = [
      ...(indiaCareerDirectory.sources || []),
      ...(attachedCareerDirectory.sources || [])
    ] as DirectorySource[];
    const seenUrls = new Set<string>();
    const seenSlugs = new Set<string>();
    const sources = candidates.filter(source => {
      if (source.sourceKind !== 'company_career' || !/^https:\/\//i.test(source.url)) return false;
      const urlKey = canonicalSourceUrl(source.url);
      const slugKey = source.slug.trim().toLowerCase();
      if (!urlKey || !slugKey || seenUrls.has(urlKey) || seenSlugs.has(slugKey)) return false;
      seenUrls.add(urlKey);
      seenSlugs.add(slugKey);
      return true;
    });
    if (!sources.length) return;
    await ProviderCompany.bulkWrite(sources.map(source => ({
      updateOne: {
        filter: { provider: 'career_page', companySlug: source.slug },
        update: {
          $setOnInsert: {
            companyName: source.name,
            sourceType: 'company_careers',
            apiRegion: 'global',
            pageUrl: source.url,
            isActive: false,
            directoryManaged: true,
            discoveryStatus: 'pending',
            lastSyncStatus: 'never'
          }
        },
        upsert: true
      }
    })), { ordered: false });
  }

  private async seedJobPortalCatalog(): Promise<void> {
    const sources = (indiaCareerDirectory.sources || []).filter(source =>
      source.sourceKind === 'job_portal' && /^https:\/\//i.test(source.url)
    );
    if (!sources.length) return;
    await ProviderCompany.bulkWrite(sources.map(source => ({
      updateOne: {
        filter: { provider: 'selenium_page', companySlug: source.slug },
        update: {
          $set: {
            companyName: source.name,
            sourceType: 'job_board',
            apiRegion: 'global',
            pageUrl: source.url,
            automationPermission: 'not_granted',
            isActive: false,
            directoryManaged: true,
            discoveryStatus: 'unsupported',
            lastError: 'Official API/licence or written automated-access permission is required before activation'
          },
          $setOnInsert: { lastSyncStatus: 'never', lastFetchedCount: 0, lastCreatedCount: 0, lastUpdatedCount: 0 }
        },
        upsert: true
      }
    })), { ordered: false });
  }

  private async seedAuthorizedSeleniumSources(): Promise<void> {
    const raw = process.env.SELENIUM_JOB_SOURCES?.trim();
    if (!raw) return;
    const allowedDomains = new Set(String(process.env.SELENIUM_JOB_ALLOWED_DOMAINS || '')
      .split(',').map(value => value.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean));
    let sources: Array<{ slug: string; name: string; url: string; permission: 'written_permission' | 'public_terms_allow'; jobLinkSelector?: string; maxJobsPerSync?: number }> = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) sources = parsed;
    } catch {
      throw new Error('SELENIUM_JOB_SOURCES must be a JSON array');
    }
    for (const source of sources) {
      const slug = source.slug?.trim().toLowerCase();
      if (!slug || !/^https:\/\//i.test(source.url) || !['written_permission', 'public_terms_allow'].includes(source.permission)) continue;
      const hostname = new URL(source.url).hostname.toLowerCase().replace(/^www\./, '');
      if (!allowedDomains.has(hostname)) {
        console.warn(`Skipping Selenium source ${source.name}: ${hostname} is not in SELENIUM_JOB_ALLOWED_DOMAINS`);
        continue;
      }
      await ProviderCompany.findOneAndUpdate(
        { provider: 'selenium_page', companySlug: slug },
        { $set: {
          companyName: source.name,
          sourceType: 'job_board',
          pageUrl: source.url,
          automationPermission: source.permission,
          jobLinkSelector: source.jobLinkSelector,
          maxJobsPerSync: Math.min(100, Math.max(1, Number(source.maxJobsPerSync || 30))),
          isActive: true,
          directoryManaged: true,
          discoveryStatus: 'verified',
          lastError: null
        }, $setOnInsert: { apiRegion: 'global', lastSyncStatus: 'never' } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }

  private async seedSimpleProvider(
    provider: 'adzuna' | 'greenhouse' | 'ashby' | 'smartrecruiters' | 'workday' | 'himalayas' | 'weworkremotely',
    raw: string | undefined,
    defaults: Array<{ slug: string; name?: string }>
  ): Promise<void> {
    let companies: Array<{ slug: string; name?: string; url?: string; sourceType?: 'company_careers' | 'job_board'; recruiterId?: string }> = defaults;
    if (raw) {
      try { const parsed = JSON.parse(raw); companies = Array.isArray(parsed) ? parsed : []; }
      catch { companies = raw.split(',').map(slug => ({ slug: slug.trim() })).filter(item => item.slug); }
    }
    for (const company of companies) {
      const slug = company.slug?.trim().toLowerCase(); if (!slug) continue;
      const recruiterId = company.recruiterId && Types.ObjectId.isValid(company.recruiterId) ? new Types.ObjectId(company.recruiterId) : undefined;
      await ProviderCompany.findOneAndUpdate(
        { provider, companySlug: slug },
        { $set: { companyName: company.name?.trim() || displayNameFromSlug(slug), sourceType: company.sourceType || 'company_careers', isActive: true, ...(company.url && /^https:\/\//i.test(company.url) ? { pageUrl: company.url } : {}), ...(recruiterId ? { recruiterId } : {}) }, $setOnInsert: { lastSyncStatus: 'never', apiRegion: 'global' } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }

  async getActive(provider?: ProviderName): Promise<ProviderCompanyConfig[]> {
    const query: any = { isActive: true };
    if (provider) query.provider = provider;
    return ProviderCompany.find(query).sort({ provider: 1, companySlug: 1 }).lean() as unknown as ProviderCompanyConfig[];
  }

  async getOrCreate(provider: ProviderName, companySlug: string): Promise<ProviderCompanyConfig> {
    const slug = companySlug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) throw new Error('Invalid provider company slug');
    if (provider === 'selenium_page') {
      throw new Error('Selenium sources must be configured with an authorized URL and exact-domain allowlist before synchronization');
    }
    return ProviderCompany.findOneAndUpdate(
      { provider, companySlug: slug },
      {
        $setOnInsert: {
          companyName: displayNameFromSlug(slug),
          sourceType: 'company_careers',
          apiRegion: 'global',
          isActive: true,
          lastSyncStatus: 'never'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as unknown as ProviderCompanyConfig;
  }

  async updateSyncResult(companyId: unknown, values: Record<string, unknown>): Promise<void> {
    await ProviderCompany.findByIdAndUpdate(companyId, { $set: values });
  }
}

export default new ProviderCompaniesService();
