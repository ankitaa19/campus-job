import crypto from 'crypto';
import { cleanJobText, extractCanonicalSkills, inferExperienceRequirements } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface WorkdaySummary {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
}

interface WorkdayJob extends WorkdaySummary {
  detail?: {
    title?: string;
    jobDescription?: string;
    location?: string;
    additionalLocations?: string[];
    jobReqId?: string;
    jobPostingId?: string;
    postedOn?: string;
    timeType?: string;
    workerType?: string;
    remoteType?: string;
    externalUrl?: string;
  };
}

interface WorkdayConfig { origin: string; tenant: string; site: string }

const parseConfig = (pageUrl = ''): WorkdayConfig => {
  const url = new URL(pageUrl);
  if (!/\.(?:wd\d+|wd\d+impl)\.myworkdayjobs\.com$/i.test(url.hostname)) throw new Error('A valid public Workday career-site URL is required');
  const tenant = url.hostname.split('.')[0];
  const parts = url.pathname.split('/').filter(Boolean);
  const site = /^[a-z]{2}-[A-Z]{2}$/.test(parts[0] || '') ? parts[1] : parts[0];
  if (!tenant || !site) throw new Error('Workday URL must include its tenant and career-site name');
  return { origin: url.origin, tenant, site };
};

const clean = (value = ''): string => cleanJobText(value).replace(/\s+/g, ' ').trim();

const postedDate = (value = ''): Date => {
  if (/today/i.test(value)) return new Date();
  const days = Number(value.match(/(\d+)\s+days?/i)?.[1] || 0);
  if (days) return new Date(Date.now() - days * 86400000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const mapWithConcurrency = async <T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> => {
  const output: R[] = new Array(items.length); let cursor = 0;
  const worker = async () => { while (cursor < items.length) { const index = cursor++; output[index] = await mapper(items[index]); } };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return output;
};

export class WorkdayProvider implements JobProvider<WorkdayJob> {
  readonly name = 'workday' as const;
  private readonly completeSnapshots = new Map<string, boolean>();

  async fetchJobs(company: ProviderCompanyConfig): Promise<WorkdayJob[]> {
    const config = parseConfig(company.pageUrl);
    const endpoint = `${config.origin}/wday/cxs/${encodeURIComponent(config.tenant)}/${encodeURIComponent(config.site)}/jobs`;
    const maximumJobs = Math.min(2000, Math.max(1, Number(process.env.WORKDAY_MAX_JOBS || 500)));
    const summaries: WorkdaySummary[] = [];
    let offset = 0; let total = 0;
    do {
      const limit = Math.min(20, maximumJobs - summaries.length);
      const response = await publicSourceHttp.post<{ total?: number; jobPostings?: WorkdaySummary[] }>(endpoint, {
        appliedFacets: {}, limit, offset, searchText: ''
      }, { checkRobots: true, timeout: 30000, headers: { 'Content-Type': 'application/json' } });
      const page = response.data.jobPostings || [];
      summaries.push(...page); total = Number(response.data.total || summaries.length); offset += page.length;
      if (!page.length) break;
    } while (offset < total && summaries.length < maximumJobs);
    this.completeSnapshots.set(company.companySlug, summaries.length >= total);

    // Workday occasionally emits placeholder rows without a title or path.
    // They are not jobs and must not become partial-sync errors or dummy cards.
    const validSummaries = summaries.filter(summary => Boolean(summary.title?.trim() && summary.externalPath?.trim()));
    return mapWithConcurrency(validSummaries, 5, async summary => {
      try {
        const response = await publicSourceHttp.get<{ jobPostingInfo?: WorkdayJob['detail'] }>(`${config.origin}/wday/cxs/${encodeURIComponent(config.tenant)}/${encodeURIComponent(config.site)}${summary.externalPath}`, { checkRobots: true, timeout: 30000 });
        return { ...summary, detail: response.data.jobPostingInfo };
      } catch { return summary; }
    });
  }

  isAuthoritativeSnapshot(company: ProviderCompanyConfig): boolean {
    return this.completeSnapshots.get(company.companySlug) === true;
  }

  mapJob(raw: WorkdayJob, company: ProviderCompanyConfig): JobDto {
    const title = clean(raw.detail?.title || raw.title);
    if (!title || !raw.externalPath) throw new Error('Workday job is missing title or external path');
    const description = clean(raw.detail?.jobDescription) || `${title} opportunity at ${company.companyName}.`;
    const locationText = raw.detail?.location || raw.locationsText || raw.detail?.additionalLocations?.join(', ') || 'Not specified';
    const remote = /remote|home[- ]?based/i.test(`${raw.detail?.remoteType || ''} ${locationText}`);
    const hybrid = /hybrid/i.test(`${raw.detail?.remoteType || ''} ${locationText}`);
    const parts = locationText.split(',').map(item => item.trim()).filter(Boolean);
    const skills = extractCanonicalSkills(description);
    const experience = inferExperienceRequirements(title, description);
    const sourceExternalId = raw.detail?.jobPostingId || raw.detail?.jobReqId || crypto.createHash('sha256').update(raw.externalPath).digest('hex');
    return {
      source: company.sourceType, sourceProvider: 'workday', sourceCompanySlug: company.companySlug, sourceExternalId,
      sourceUrl: raw.detail?.externalUrl || (company.pageUrl ? `${company.pageUrl.replace(/\/$/, '')}${raw.externalPath}` : undefined),
      attributionName: company.companyName, attributionUrl: company.pageUrl,
      title, companyName: company.companyName, description,
      jobType: /intern|trainee|apprentice/i.test(`${title} ${raw.detail?.workerType}`) ? 'internship' : /part[- ]?time/i.test(raw.detail?.timeType || '') ? 'part-time' : /contract|temporary/i.test(raw.detail?.workerType || '') ? 'contract' : 'full-time',
      department: 'General',
      locations: [{ city: remote ? 'Remote' : parts[0] || 'Not specified', state: remote ? 'Remote' : parts[1] || 'Not specified', country: parts[parts.length - 1] || 'Not specified', isRemote: remote, hybrid }],
      workMode: remote ? 'remote' : hybrid ? 'hybrid' : 'onsite',
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })), requiredSkills: skills,
      experienceLevel: experience.experienceLevel,
      minExperience: experience.minExperience, maxExperience: experience.maxExperience,
      educationRequirements: [], salary: { min: 0, max: 0, currency: 'INR', negotiable: true }, benefits: [],
      applicationDeadline: new Date(Date.now() + 30 * 86400000), totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: remote ? 'online' : hybrid ? 'hybrid' : 'offline' },
      postedAt: postedDate(raw.detail?.postedOn || raw.postedOn), matchingKeywords: skills
    };
  }
}
