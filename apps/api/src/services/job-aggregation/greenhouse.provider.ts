import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface GreenhouseJob {
  id: number; title: string; content?: string; absolute_url?: string; updated_at?: string;
  first_published?: string; application_deadline?: string | null; company_name?: string;
  location?: { name?: string }; departments?: Array<{ name?: string }>;
}

const decode = (value = ''): string => value
  .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ').trim();

const experience = (text: string): Pick<JobDto, 'experienceLevel' | 'minExperience' | 'maxExperience'> => {
  const match = text.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i);
  const minExperience = Number(match?.[1] || 0); const maxExperience = match?.[2] ? Number(match[2]) : undefined;
  return { minExperience, maxExperience, experienceLevel: /chief|vice president|\bvp\b/i.test(text) ? 'executive' : /lead|principal|staff/i.test(text) ? 'lead' : /senior|sr\.?\b/i.test(text) || minExperience >= 5 ? 'senior' : minExperience >= 2 ? 'mid' : 'entry' };
};

const salary = (value: string): JobDto['salary'] => {
  const match = value.match(/(USD|INR|EUR|GBP|[$₹€£])\s*([\d,]{4,})(?:\.\d+)?\s*(?:-|to|–|—)\s*(?:USD|INR|EUR|GBP|[$₹€£])?\s*([\d,]{4,})/i);
  if (!match) return { min: 0, max: 0, currency: 'INR', negotiable: true };
  const currency = ({ '$': 'USD', '₹': 'INR', '€': 'EUR', '£': 'GBP' } as Record<string, string>)[match[1].toUpperCase()] || match[1].toUpperCase();
  return { min: Number(match[2].replace(/,/g, '')), max: Number(match[3].replace(/,/g, '')), currency, negotiable: false };
};

export class GreenhouseProvider implements JobProvider<GreenhouseJob> {
  readonly name = 'greenhouse' as const;

  async fetchJobs(company: ProviderCompanyConfig): Promise<GreenhouseJob[]> {
    const response = await publicSourceHttp.get<{ jobs?: GreenhouseJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.companySlug)}/jobs`, { checkRobots: true, params: { content: true }, timeout: 30000 });
    return response.data.jobs || [];
  }

  mapJob(raw: GreenhouseJob, company: ProviderCompanyConfig): JobDto {
    if (!raw.id || !raw.title) throw new Error('Greenhouse job is missing id or title');
    const description = decode(raw.content) || `${raw.title} opportunity at ${company.companyName}.`;
    const locationText = raw.location?.name || 'Not specified'; const remote = /remote|anywhere/i.test(locationText);
    const hybrid = /hybrid/i.test(locationText); const parts = locationText.split(',').map(item => item.trim()).filter(Boolean);
    const skills = extractCanonicalSkills([
      raw.title,
      description,
      ...(raw.departments || []).map(department => department.name || '')
    ].join('\n')); const exp = experience(`${raw.title} ${description}`);
    const postedAt = new Date(raw.first_published || raw.updated_at || Date.now());
    return {
      source: company.sourceType, sourceProvider: 'greenhouse', sourceCompanySlug: company.companySlug, sourceExternalId: String(raw.id), sourceUrl: raw.absolute_url,
      title: raw.title.trim(), companyName: raw.company_name || company.companyName, description, jobType: /intern/i.test(raw.title) ? 'internship' : 'full-time',
      department: raw.departments?.[0]?.name || 'General', locations: [{ city: remote ? 'Remote' : parts[0] || 'Not specified', state: remote ? 'Remote' : parts[1] || 'Not specified', country: parts[parts.length - 1] || 'Not specified', isRemote: remote, hybrid }],
      workMode: remote ? 'remote' : hybrid ? 'hybrid' : 'onsite', requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })), requiredSkills: skills, ...exp,
      educationRequirements: [], salary: salary(description), benefits: [],
      applicationDeadline: raw.application_deadline ? new Date(raw.application_deadline) : new Date(Date.now() + 30 * 86400000), totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: remote ? 'online' : hybrid ? 'hybrid' : 'offline' },
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt, matchingKeywords: skills
    };
  }
}
