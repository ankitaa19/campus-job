import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface SmartRecruitersPosting {
  id: string;
  uuid?: string;
  name: string;
  releasedDate?: string;
  postingUrl?: string;
  applyUrl?: string;
  company?: { identifier?: string; name?: string };
  location?: { city?: string; region?: string; country?: string; remote?: boolean };
  department?: { label?: string };
  typeOfEmployment?: { label?: string };
  experienceLevel?: { label?: string };
  ref?: string;
  jobAd?: {
    sections?: {
      companyDescription?: { text?: string };
      jobDescription?: { text?: string };
      qualifications?: { text?: string };
      additionalInformation?: { text?: string };
    };
  };
  compensation?: {
    currency?: string;
    min?: number;
    max?: number;
  };
}

const clean = (value = ''): string => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/li>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const employmentType = (value = '', title = ''): JobDto['jobType'] => {
  const text = `${value} ${title}`;
  if (/intern|trainee|apprentice/i.test(text)) return 'internship';
  if (/part[- ]?time/i.test(text)) return 'part-time';
  if (/freelance/i.test(text)) return 'freelance';
  if (/contract|temporary|fixed term/i.test(text)) return 'contract';
  return 'full-time';
};

const experience = (title: string, description: string, label = ''): Pick<JobDto, 'experienceLevel' | 'minExperience' | 'maxExperience'> => {
  const text = `${title} ${label} ${description}`;
  const range = text.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i);
  const minExperience = Number(range?.[1] || 0);
  const maxExperience = range?.[2] ? Number(range[2]) : undefined;
  const experienceLevel: JobDto['experienceLevel'] = /chief|vice president|\bvp\b|executive/i.test(text)
    ? 'executive'
    : /lead|principal|staff|director|manager/i.test(text)
      ? 'lead'
      : /senior|sr\.?\b/i.test(text) || minExperience >= 5
        ? 'senior'
        : /mid|associate/i.test(label) || minExperience >= 2
          ? 'mid'
          : 'entry';
  return { experienceLevel, minExperience, maxExperience };
};

const mapWithConcurrency = async <T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> => {
  const output: R[] = new Array(items.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await mapper(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return output;
};

export class SmartRecruitersProvider implements JobProvider<SmartRecruitersPosting> {
  readonly name = 'smartrecruiters' as const;
  private readonly completeSnapshots = new Map<string, boolean>();

  async fetchJobs(company: ProviderCompanyConfig): Promise<SmartRecruitersPosting[]> {
    const baseUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company.companySlug)}/postings`;
    const summaries: SmartRecruitersPosting[] = [];
    const limit = 100;
    const maximumJobs = Math.min(2000, Math.max(1, Number(process.env.SMARTRECRUITERS_MAX_JOBS || 500)));
    const country = (process.env.SMARTRECRUITERS_COUNTRY || 'in').trim();
    let offset = 0;
    let total = 0;

    do {
      const response = await publicSourceHttp.get<{ content?: SmartRecruitersPosting[]; totalFound?: number }>(baseUrl, {
        checkRobots: true,
        params: { limit: Math.min(limit, maximumJobs - summaries.length), offset, destination: 'PUBLIC', ...(country && country.toLowerCase() !== 'all' ? { country } : {}) },
        timeout: 30000
      });
      const page = response.data.content || [];
      summaries.push(...page);
      total = Number(response.data.totalFound || summaries.length);
      offset += page.length;
      if (!page.length) break;
    } while (offset < total && summaries.length < maximumJobs);

    this.completeSnapshots.set(company.companySlug, summaries.length >= total);

    return mapWithConcurrency(summaries, 5, async summary => {
      try {
        const response = await publicSourceHttp.get<SmartRecruitersPosting>(`${baseUrl}/${encodeURIComponent(summary.id)}`, { checkRobots: true, timeout: 30000 });
        return { ...summary, ...response.data };
      } catch {
        return summary;
      }
    });
  }

  isAuthoritativeSnapshot(company: ProviderCompanyConfig): boolean {
    return this.completeSnapshots.get(company.companySlug) === true;
  }

  mapJob(raw: SmartRecruitersPosting, company: ProviderCompanyConfig): JobDto {
    if (!raw.id || !raw.name) throw new Error('SmartRecruiters job is missing id or title');
    const sections = raw.jobAd?.sections;
    const description = clean([
      sections?.companyDescription?.text,
      sections?.jobDescription?.text,
      sections?.qualifications?.text,
      sections?.additionalInformation?.text
    ].filter(Boolean).join('\n')) || `${raw.name} opportunity at ${raw.company?.name || company.companyName}.`;
    const location = raw.location || {};
    const locationText = [location.city, location.region, location.country].filter(Boolean).join(', ');
    const remote = Boolean(location.remote || /remote|anywhere/i.test(locationText));
    const hybrid = /hybrid/i.test(`${locationText} ${description}`);
    const skills = extractCanonicalSkills(description);
    const exp = experience(raw.name, description, raw.experienceLevel?.label);
    const postedAt = new Date(raw.releasedDate || Date.now());
    const salary: JobDto['salary'] = raw.compensation?.min || raw.compensation?.max
      ? {
          min: Number(raw.compensation.min || raw.compensation.max || 0),
          max: Number(raw.compensation.max || raw.compensation.min || 0),
          currency: raw.compensation.currency || 'INR',
          negotiable: false
        }
      : { min: 0, max: 0, currency: 'INR', negotiable: true };

    return {
      source: company.sourceType,
      sourceProvider: 'smartrecruiters',
      sourceCompanySlug: company.companySlug,
      sourceExternalId: raw.uuid || raw.id,
      sourceUrl: raw.postingUrl || raw.ref || raw.applyUrl,
      attributionName: raw.company?.name || company.companyName,
      attributionUrl: raw.postingUrl || raw.ref,
      title: raw.name.trim(),
      companyName: raw.company?.name || company.companyName,
      description,
      jobType: employmentType(raw.typeOfEmployment?.label, raw.name),
      department: raw.department?.label || 'General',
      locations: [{
        city: remote ? 'Remote' : location.city || 'Not specified',
        state: remote ? 'Remote' : location.region || 'Not specified',
        country: location.country || 'Not specified',
        isRemote: remote,
        hybrid
      }],
      workMode: remote ? 'remote' : hybrid ? 'hybrid' : 'onsite',
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })),
      requiredSkills: skills,
      ...exp,
      educationRequirements: [],
      salary,
      benefits: [],
      applicationDeadline: new Date(Date.now() + 30 * 86400000),
      totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: remote ? 'online' : hybrid ? 'hybrid' : 'offline' },
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt,
      matchingKeywords: skills
    };
  }
}
