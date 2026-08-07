import crypto from 'crypto';
import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface JsonLdJob {
  '@type'?: string; title?: string; description?: string; datePosted?: string; validThrough?: string;
  employmentType?: string | string[]; url?: string; identifier?: { value?: string } | string;
  jobLocation?: any; jobLocationType?: string; baseSalary?: any; hiringOrganization?: { name?: string };
}

const text = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;/g, ' ').replace(/\s+/g, ' ').trim();
const type = (value: unknown): JobDto['jobType'] => {
  const input = String(Array.isArray(value) ? value.join(' ') : value || '').toLowerCase();
  return input.includes('intern') || input.includes('apprentice') ? 'internship'
    : input.includes('part') ? 'part-time'
      : input.includes('freelance') ? 'freelance'
        : input.includes('contract') || input.includes('temporary') || input.includes('gig') || input.includes('flexible') ? 'contract'
          : 'full-time';
};

export const extractJobPostingJsonLd = (html: string): JsonLdJob[] => {
  const output: JsonLdJob[] = [];
  const visit = (value: any): void => {
    if (!value) return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value !== 'object') return;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some((item: unknown) => String(item).toLowerCase() === 'jobposting')) output.push(value as JsonLdJob);
    if (value['@graph']) visit(value['@graph']);
  };
  const scriptPattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const payload = match[1].trim().replace(/^<!--|-->$/g, '').trim();
    if (!payload) continue;
    try { visit(JSON.parse(payload)); } catch { /* A malformed block must not discard valid blocks. */ }
  }
  return output;
};

export class CareerPageProvider implements JobProvider<JsonLdJob> {
  readonly name = 'career_page' as const;

  async fetchJobs(company: ProviderCompanyConfig): Promise<JsonLdJob[]> {
    if (!company.pageUrl || !/^https:\/\//i.test(company.pageUrl)) throw new Error('A public HTTPS career page URL is required');
    const response = await publicSourceHttp.get<string>(company.pageUrl, { checkRobots: true, responseType: 'text', timeout: 20_000 });
    const jobs = extractJobPostingJsonLd(String(response.data || ''));
    if (!jobs.length) throw new Error('No public JobPosting JSON-LD was found in the raw career page HTML');
    return jobs;
  }

  mapJob(raw: JsonLdJob, company: ProviderCompanyConfig): JobDto {
    if (!raw.title || !raw.description) throw new Error('JSON-LD JobPosting requires title and description');
    const description = text(raw.description); const remote = /telecommute|remote/i.test(`${raw.jobLocationType || ''} ${description}`);
    const address = raw.jobLocation?.address || raw.jobLocation?.[0]?.address || {};
    const skills = extractCanonicalSkills(description);
    const range = description.match(/\b(\d{1,2})\s*(?:\+|[-–]\s*(\d{1,2}))?\s+years?\b/i);
    const salaryValue = raw.baseSalary?.value || {}; const min = Number(salaryValue.minValue || salaryValue.value || 0); const max = Number(salaryValue.maxValue || min);
    const postedAt = raw.datePosted ? new Date(raw.datePosted) : new Date();
    const external = typeof raw.identifier === 'string' ? raw.identifier : raw.identifier?.value;
    return {
      source: company.sourceType, sourceProvider: 'career_page', sourceCompanySlug: company.companySlug,
      sourceExternalId: external || crypto.createHash('sha256').update(`${raw.url || company.pageUrl}|${raw.title}`).digest('hex'), sourceUrl: raw.url || company.pageUrl,
      title: text(raw.title), companyName: raw.hiringOrganization?.name || company.companyName, description,
      jobType: type(raw.employmentType), department: 'General', workMode: remote ? 'remote' : 'onsite',
      locations: [{ city: remote ? 'Remote' : address.addressLocality || 'Not specified', state: remote ? 'Remote' : address.addressRegion || 'Not specified', country: address.addressCountry?.name || address.addressCountry || 'Not specified', isRemote: remote, hybrid: false }],
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })), requiredSkills: skills,
      experienceLevel: Number(range?.[1] || 0) >= 5 ? 'senior' : Number(range?.[1] || 0) >= 2 ? 'mid' : 'entry', minExperience: Number(range?.[1] || 0), maxExperience: range?.[2] ? Number(range[2]) : undefined,
      educationRequirements: [], salary: { min, max: Math.max(min, max), currency: raw.baseSalary?.currency || 'INR', negotiable: !raw.baseSalary }, benefits: [],
      applicationDeadline: raw.validThrough ? new Date(raw.validThrough) : new Date(Date.now() + 30 * 86400000), totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: remote ? 'online' : 'offline' },
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt, matchingKeywords: skills
    };
  }
}
