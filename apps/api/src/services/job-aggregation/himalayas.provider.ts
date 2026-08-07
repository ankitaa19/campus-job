import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface HimalayasJob {
  title: string;
  excerpt?: string;
  companyName?: string;
  companySlug?: string;
  company?: string | { name?: string; title?: string; slug?: string };
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string;
  seniority?: string[];
  currency?: string;
  locationRestrictions?: Array<string | { name?: string; alpha2?: string; slug?: string }>;
  categories?: string[];
  parentCategories?: string[];
  description?: string;
  pubDate?: number | string;
  expiryDate?: number | string;
  applicationLink?: string;
  guid: string;
}

interface HimalayasResponse { jobs?: HimalayasJob[]; totalCount?: number; }

const cleanHtml = (value = ''): string => value
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();

const parseDate = (value: number | string | undefined, fallback: Date): Date => {
  if (typeof value === 'number') {
    const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? fallback : date;
  }
  const date = new Date(value || fallback);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const normalizeSalary = (raw: HimalayasJob): JobDto['salary'] => {
  let min = Number(raw.minSalary || 0); let max = Number(raw.maxSalary || min);
  const multiplier = raw.salaryPeriod === 'hourly' ? 2080 : raw.salaryPeriod === 'weekly' ? 52 : raw.salaryPeriod === 'fortnightly' ? 26 : raw.salaryPeriod === 'monthly' ? 12 : 1;
  min = Math.round(min * multiplier); max = Math.round(max * multiplier);
  return { min, max: Math.max(min, max), currency: raw.currency || 'USD', negotiable: !min };
};

const normalizeJobType = (value = ''): JobDto['jobType'] => /intern/i.test(value) ? 'internship'
  : /part/i.test(value) ? 'part-time' : /freelance/i.test(value) ? 'freelance'
    : /contract|contractor|temporary/i.test(value) ? 'contract' : 'full-time';

const companyNameFrom = (raw: HimalayasJob): string => {
  const nested = typeof raw.company === 'string' ? raw.company : raw.company?.name || raw.company?.title;
  return cleanHtml(raw.companyName || nested || '').trim();
};

const categoryText = (values: string[] = []): string => values
  .map(value => decodeURIComponent(String(value)).replace(/[-_]+/g, ' '))
  .join(' ');

export class HimalayasProvider implements JobProvider<HimalayasJob> {
  readonly name = 'himalayas' as const;
  private completeSnapshot = false;

  async fetchJobs(_company: ProviderCompanyConfig): Promise<HimalayasJob[]> {
    const requested = Number(process.env.HIMALAYAS_MAX_JOBS || 1000);
    const maximumJobs = Math.min(30000, Math.max(20, Number.isFinite(requested) ? requested : 1000));
    const jobs: HimalayasJob[] = []; const limit = 20;
    let reportedTotal = Number.POSITIVE_INFINITY;
    for (let offset = 0; offset < maximumJobs; offset += limit) {
      let response;
      try {
        response = await publicSourceHttp.get<HimalayasResponse>('https://himalayas.app/jobs/api', { checkRobots: true, params: { offset, limit }, timeout: 30000 });
      } catch (error: any) {
        if (error?.response?.status !== 429) throw error;
        const retrySeconds = Math.min(60, Math.max(2, Number(error.response.headers?.['retry-after'] || 5)));
        await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
        response = await publicSourceHttp.get<HimalayasResponse>('https://himalayas.app/jobs/api', { checkRobots: true, params: { offset, limit }, timeout: 30000 });
      }
      const page = response.data.jobs || [];
      reportedTotal = Number(response.data.totalCount ?? jobs.length + page.length);
      jobs.push(...page);
      if (page.length < limit || jobs.length >= reportedTotal) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.completeSnapshot = jobs.length >= reportedTotal;
    return jobs;
  }

  isAuthoritativeSnapshot(): boolean {
    return this.completeSnapshot;
  }

  mapJob(raw: HimalayasJob, company: ProviderCompanyConfig): JobDto {
    const companyName = companyNameFrom(raw);
    if (!raw.guid || !raw.title || !companyName) throw new Error('Himalayas job is missing required fields');
    const description = cleanHtml(raw.description || raw.excerpt) || `${raw.title} opportunity at ${companyName}.`;
    // Himalayas categories are URL-style slugs (for example Lead-Generation).
    // Convert them back to words so the shared skill dictionary can recognize
    // the actual capability instead of showing a malformed category slug.
    const skills = extractCanonicalSkills([
      raw.title,
      description,
      categoryText(raw.categories),
      categoryText(raw.parentCategories)
    ].join('\n'));
    const countries = (raw.locationRestrictions || []).map(item => typeof item === 'string' ? item : item.name || item.alpha2 || item.slug || '').filter(Boolean);
    const seniority = (raw.seniority || []).join(' '); const range = description.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i);
    const minExperience = Number(range?.[1] || 0); const maxExperience = range?.[2] ? Number(range[2]) : undefined;
    const postedAt = parseDate(raw.pubDate, new Date()); const deadline = parseDate(raw.expiryDate, new Date(Date.now() + 30 * 86400000));
    return {
      source: 'job_board', sourceProvider: 'himalayas', sourceCompanySlug: company.companySlug, sourceExternalId: raw.guid, sourceUrl: raw.applicationLink,
      attributionName: 'Himalayas', attributionUrl: raw.applicationLink || 'https://himalayas.app', title: raw.title.trim(), companyName, description,
      jobType: normalizeJobType(raw.employmentType), department: raw.parentCategories?.[0] || raw.categories?.[0] || 'General',
      locations: [{ city: 'Remote', state: 'Remote', country: countries.join(', ') || 'Worldwide', isRemote: true, hybrid: false }], workMode: 'remote',
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })), requiredSkills: skills,
      experienceLevel: /executive|director/i.test(seniority) ? 'executive' : /manager|lead/i.test(seniority) ? 'lead' : /senior/i.test(seniority) || minExperience >= 5 ? 'senior' : /mid/i.test(seniority) || minExperience >= 2 ? 'mid' : 'entry',
      minExperience, maxExperience, educationRequirements: [], salary: normalizeSalary(raw), benefits: [], applicationDeadline: deadline, totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: 'online' }, postedAt, matchingKeywords: skills
    };
  }
}
