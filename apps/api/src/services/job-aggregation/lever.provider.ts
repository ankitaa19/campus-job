import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface LeverPosting {
  id: string;
  text?: string;
  categories?: {
    location?: string;
    allLocations?: string[];
    commitment?: string;
    team?: string;
    department?: string;
    level?: string;
  };
  country?: string | null;
  description?: string;
  descriptionPlain?: string;
  openingPlain?: string;
  lists?: Array<{ text?: string; content?: string }>;
  additionalPlain?: string;
  hostedUrl?: string;
  applyUrl?: string;
  workplaceType?: 'unspecified' | 'on-site' | 'remote' | 'hybrid';
  salaryRange?: { currency?: string; interval?: string; min?: number; max?: number };
  salaryDescriptionPlain?: string;
  createdAt?: number;
}

const decodeHtml = (value = ''): string => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/li>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s+/g, '\n')
  .trim();

const normalizeJobType = (commitment = ''): JobDto['jobType'] => {
  const value = commitment.toLowerCase();
  if (value.includes('intern')) return 'internship';
  if (value.includes('part')) return 'part-time';
  if (value.includes('freelance')) return 'freelance';
  if (value.includes('contract') || value.includes('temporary')) return 'contract';
  return 'full-time';
};

const normalizeWorkMode = (posting: LeverPosting): JobDto['workMode'] => {
  if (posting.workplaceType === 'remote') return 'remote';
  if (posting.workplaceType === 'hybrid') return 'hybrid';
  if (/remote/i.test(posting.categories?.location || '')) return 'remote';
  return 'onsite';
};

const normalizeExperience = (text: string): Pick<JobDto, 'experienceLevel' | 'minExperience' | 'maxExperience'> => {
  const range = text.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i);
  const minExperience = range ? Number(range[1]) : 0;
  const maxExperience = range?.[2] ? Number(range[2]) : undefined;
  const lower = text.toLowerCase();
  const experienceLevel: JobDto['experienceLevel'] = /chief|vp|vice president|executive/.test(lower)
    ? 'executive'
    : /lead|principal|staff/.test(lower)
      ? 'lead'
      : /senior|sr\.?\b/.test(lower) || minExperience >= 5
        ? 'senior'
        : minExperience >= 2
          ? 'mid'
          : 'entry';
  return { experienceLevel, minExperience, maxExperience };
};

const normalizeLocation = (rawLocation: string, country: string, workMode: JobDto['workMode']): JobDto['locations'][number] => {
  if (workMode === 'remote' || /remote/i.test(rawLocation)) {
    return { city: 'Remote', state: 'Remote', country: country || 'Not specified', isRemote: true, hybrid: false };
  }
  const parts = rawLocation.split(',').map(part => part.trim()).filter(Boolean);
  return {
    city: parts[0] || 'Not specified',
    state: parts.length > 2 ? parts[1] : 'Not specified',
    country: parts.length > 1 ? parts[parts.length - 1] : (country || 'Not specified'),
    isRemote: false,
    hybrid: workMode === 'hybrid'
  };
};

export class LeverProvider implements JobProvider<LeverPosting> {
  readonly name = 'lever' as const;

  async fetchJobs(company: ProviderCompanyConfig): Promise<LeverPosting[]> {
    const baseUrl = company.apiRegion === 'eu' ? 'https://api.eu.lever.co' : 'https://api.lever.co';
    const jobs: LeverPosting[] = [];
    const limit = 100;
    for (let skip = 0; ; skip += limit) {
      const response = await publicSourceHttp.get<LeverPosting[]>(
        `${baseUrl}/v0/postings/${encodeURIComponent(company.companySlug)}`,
        { checkRobots: true, params: { mode: 'json', skip, limit }, timeout: 20000, headers: { Accept: 'application/json' } }
      );
      const page = Array.isArray(response.data) ? response.data : [];
      jobs.push(...page);
      if (page.length < limit) break;
    }
    return jobs;
  }

  mapJob(raw: LeverPosting, company: ProviderCompanyConfig): JobDto {
    if (!raw.id || !raw.text) throw new Error('Lever posting is missing id or title');
    const listText = (raw.lists || []).map(list => {
      const content = decodeHtml(list.content);
      return [list.text?.trim(), content].filter(Boolean).join('\n');
    }).filter(Boolean).join('\n\n');
    const description = [raw.descriptionPlain || raw.openingPlain || decodeHtml(raw.description), listText, raw.additionalPlain]
      .filter(Boolean).join('\n\n').trim();
    const workMode = normalizeWorkMode(raw);
    const rawLocations = raw.categories?.allLocations?.length
      ? raw.categories.allLocations
      : [raw.categories?.location || (workMode === 'remote' ? 'Remote' : 'Not specified')];
    const skills = extractCanonicalSkills([
      raw.text,
      description,
      raw.categories?.team,
      raw.categories?.department,
      raw.categories?.level
    ].filter(Boolean).join('\n'));
    const experience = normalizeExperience(`${raw.text}\n${description}\n${raw.categories?.level || ''}`);
    const salaryMin = Number(raw.salaryRange?.min || 0);
    const salaryMax = Number(raw.salaryRange?.max || salaryMin);
    const postedAt = raw.createdAt && Number.isFinite(raw.createdAt) ? new Date(raw.createdAt) : new Date();

    const locations = rawLocations
      .map(location => normalizeLocation(location, raw.country || '', workMode))
      .filter((location, index, items) => items.findIndex(other =>
        other.city === location.city && other.state === location.state && other.country === location.country
      ) === index);

    return {
      source: company.sourceType,
      sourceProvider: 'lever',
      sourceCompanySlug: company.companySlug,
      sourceExternalId: raw.id,
      sourceUrl: raw.hostedUrl || raw.applyUrl,
      title: raw.text.trim(),
      companyName: company.companyName,
      description: description || `${raw.text} opportunity at ${company.companyName}.`,
      jobType: normalizeJobType(raw.categories?.commitment),
      department: raw.categories?.department || raw.categories?.team || 'General',
      locations,
      workMode,
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })),
      requiredSkills: skills,
      ...experience,
      educationRequirements: [],
      salary: {
        min: salaryMin,
        max: Math.max(salaryMin, salaryMax),
        currency: raw.salaryRange?.currency || 'INR',
        negotiable: !raw.salaryRange
      },
      benefits: [],
      applicationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      totalPositions: 1,
      interviewProcess: {
        rounds: [],
        duration: 'Not specified',
        mode: workMode === 'onsite' ? 'offline' : workMode === 'remote' ? 'online' : 'hybrid'
      },
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt,
      matchingKeywords: skills
    };
  }
}
