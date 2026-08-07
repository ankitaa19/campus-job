import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface AdzunaJob {
  id: string;
  title: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  contract_type?: string;
  company?: { display_name?: string };
  category?: { label?: string; tag?: string };
  location?: { display_name?: string; area?: string[] };
}

interface AdzunaResponse {
  count?: number;
  results?: AdzunaJob[];
}

const clean = (value = ''): string => value
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();

const jobType = (raw: AdzunaJob): JobDto['jobType'] => {
  const text = `${raw.contract_time || ''} ${raw.contract_type || ''} ${raw.title || ''}`;
  if (/intern|apprentice|trainee/i.test(text)) return 'internship';
  if (/part[_ -]?time/i.test(text)) return 'part-time';
  if (/freelance/i.test(text)) return 'freelance';
  if (/contract|temporary/i.test(text)) return 'contract';
  return 'full-time';
};

export class AdzunaProvider implements JobProvider<AdzunaJob> {
  readonly name = 'adzuna' as const;
  private readonly completeSnapshots = new Map<string, boolean>();

  async fetchJobs(company: ProviderCompanyConfig): Promise<AdzunaJob[]> {
    const appId = process.env.ADZUNA_APP_ID?.trim();
    const appKey = process.env.ADZUNA_APP_KEY?.trim();
    if (!appId || !appKey) throw new Error('Adzuna requires ADZUNA_APP_ID and ADZUNA_APP_KEY');

    const country = company.companySlug.toLowerCase();
    if (!/^[a-z]{2}$/.test(country)) throw new Error('Adzuna companySlug must be a two-letter country code');
    const resultsPerPage = Math.min(50, Math.max(10, Number(process.env.ADZUNA_RESULTS_PER_PAGE || 50)));
    const maxPages = Math.min(100, Math.max(1, Number(process.env.ADZUNA_MAX_PAGES || 20)));
    const jobs: AdzunaJob[] = [];
    let reportedTotal = Number.POSITIVE_INFINITY;

    for (let page = 1; page <= maxPages && jobs.length < reportedTotal; page += 1) {
      const response = await publicSourceHttp.get<AdzunaResponse>(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
        {
          params: {
            app_id: appId,
            app_key: appKey,
            results_per_page: resultsPerPage,
            sort_by: 'date',
            max_days_old: Math.min(90, Math.max(1, Number(process.env.ADZUNA_MAX_DAYS_OLD || 30))),
            'content-type': 'application/json'
          },
          headers: { Accept: 'application/json' },
          timeout: 30000
        }
      );
      const pageJobs = response.data.results || [];
      reportedTotal = Number(response.data.count ?? jobs.length + pageJobs.length);
      jobs.push(...pageJobs);
      if (pageJobs.length < resultsPerPage) break;
    }

    // Search APIs can be capped. Never expire records from an incomplete page
    // window; authoritative removal is enabled only for a complete snapshot.
    this.completeSnapshots.set(country, jobs.length >= reportedTotal);
    return jobs;
  }

  isAuthoritativeSnapshot(company: ProviderCompanyConfig): boolean {
    return this.completeSnapshots.get(company.companySlug.toLowerCase()) === true;
  }

  mapJob(raw: AdzunaJob, company: ProviderCompanyConfig): JobDto {
    if (!raw.id || !raw.title) throw new Error('Adzuna job is missing id or title');
    const description = clean(raw.description) || `${raw.title} opportunity.`;
    const companyName = clean(raw.company?.display_name) || 'Employer not disclosed';
    const locationName = clean(raw.location?.display_name);
    const area = (raw.location?.area || []).map(clean).filter(Boolean);
    const remote = /remote|work from home|anywhere/i.test(`${locationName} ${raw.title} ${description}`);
    const hybrid = /hybrid/i.test(`${locationName} ${description}`);
    const skills = extractCanonicalSkills(`${raw.title}\n${description}\n${raw.category?.label || ''}`);
    const experience = description.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i);
    const minExperience = Number(experience?.[1] || 0);
    const maxExperience = experience?.[2] ? Number(experience[2]) : undefined;
    const postedAt = new Date(raw.created || Date.now());
    const minSalary = Number(raw.salary_min || 0);
    const maxSalary = Number(raw.salary_max || minSalary);

    return {
      source: 'job_board',
      sourceProvider: 'adzuna',
      sourceCompanySlug: company.companySlug,
      sourceExternalId: String(raw.id),
      sourceUrl: raw.redirect_url,
      attributionName: 'Adzuna',
      attributionUrl: 'https://www.adzuna.com',
      title: clean(raw.title),
      companyName,
      description,
      jobType: jobType(raw),
      department: raw.category?.label || 'General',
      locations: [{
        city: remote ? 'Remote' : area[area.length - 1] || locationName || 'Not specified',
        state: remote ? 'Remote' : area.length > 2 ? area[area.length - 2] : 'Not specified',
        country: area[0] || company.companySlug.toUpperCase(),
        isRemote: remote,
        hybrid
      }],
      workMode: remote ? 'remote' : hybrid ? 'hybrid' : 'onsite',
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })),
      requiredSkills: skills,
      experienceLevel: /chief|vice president|\bvp\b/i.test(raw.title) ? 'executive'
        : /lead|principal|staff|director/i.test(raw.title) ? 'lead'
          : /senior|sr\.?\b/i.test(raw.title) || minExperience >= 5 ? 'senior'
            : minExperience >= 2 ? 'mid' : 'entry',
      minExperience,
      maxExperience,
      educationRequirements: [],
      salary: { min: minSalary, max: Math.max(minSalary, maxSalary), currency: countryCurrency(company.companySlug), negotiable: !minSalary },
      benefits: [],
      applicationDeadline: new Date(Date.now() + 30 * 86400000),
      totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: remote ? 'online' : hybrid ? 'hybrid' : 'offline' },
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt,
      matchingKeywords: skills
    };
  }
}

const countryCurrency = (country: string): string => ({
  in: 'INR', gb: 'GBP', us: 'USD', au: 'AUD', ca: 'CAD', de: 'EUR', fr: 'EUR', nl: 'EUR'
}[country.toLowerCase()] || 'USD');
