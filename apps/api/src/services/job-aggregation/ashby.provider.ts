import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface AshbyJob {
  id: string; title: string; department?: string; team?: string; employmentType?: string;
  location?: string; publishedAt?: string; isListed?: boolean; isRemote?: boolean;
  workplaceType?: string; jobUrl?: string; applyUrl?: string; descriptionHtml?: string;
  descriptionPlain?: string;
  secondaryLocations?: Array<{ location?: string; address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } }>;
  address?: { postalAddress?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } };
  compensation?: {
    compensationTierSummary?: string;
    scrapeableCompensationSalarySummary?: string;
    summaryComponents?: Array<{ compensationType?: string; interval?: string; currencyCode?: string; minValue?: number | null; maxValue?: number | null }>;
  };
}

const clean = (value = '') => value.replace(/<br\s*\/?>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const jobType = (value = '', title = ''): JobDto['jobType'] => /intern/i.test(`${value} ${title}`) ? 'internship' : /part/i.test(value) ? 'part-time' : /contract|temporary/i.test(value) ? 'contract' : 'full-time';
const salary = (value: string): JobDto['salary'] => {
  const match = value.match(/(USD|INR|EUR|GBP|[$₹€£])\s*([\d,]{4,})(?:\.\d+)?\s*(?:-|to|–|—)\s*(?:USD|INR|EUR|GBP|[$₹€£])?\s*([\d,]{4,})/i);
  if (!match) return { min: 0, max: 0, currency: 'INR', negotiable: true };
  const currency = ({ '$': 'USD', '₹': 'INR', '€': 'EUR', '£': 'GBP' } as Record<string, string>)[match[1].toUpperCase()] || match[1].toUpperCase();
  return { min: Number(match[2].replace(/,/g, '')), max: Number(match[3].replace(/,/g, '')), currency, negotiable: false };
};

export class AshbyProvider implements JobProvider<AshbyJob> {
  readonly name = 'ashby' as const;

  async fetchJobs(company: ProviderCompanyConfig): Promise<AshbyJob[]> {
    const response = await publicSourceHttp.get<{ jobs?: AshbyJob[] }>(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company.companySlug)}`, {
      checkRobots: true,
      params: { includeCompensation: true },
      timeout: 30000
    });
    return (response.data.jobs || []).filter(job => job.isListed !== false);
  }

  mapJob(raw: AshbyJob, company: ProviderCompanyConfig): JobDto {
    if (!raw.id || !raw.title) throw new Error('Ashby job is missing id or title');
    const description = clean(raw.descriptionPlain || raw.descriptionHtml) || `${raw.title} opportunity at ${company.companyName}.`;
    const range = description.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i);
    const minExperience = Number(range?.[1] || 0); const maxExperience = range?.[2] ? Number(range[2]) : undefined;
    const skills = extractCanonicalSkills(description); const address = raw.address?.postalAddress || {};
    const remote = Boolean(raw.isRemote || /remote/i.test(`${raw.workplaceType} ${raw.location}`)); const hybrid = /hybrid/i.test(`${raw.workplaceType} ${raw.location}`);
    const postedAt = new Date(raw.publishedAt || Date.now());
    const locations: JobDto['locations'] = [{
      city: remote ? 'Remote' : address.addressLocality || raw.location || 'Not specified',
      state: remote ? 'Remote' : address.addressRegion || 'Not specified',
      country: address.addressCountry || 'Not specified',
      isRemote: remote,
      hybrid
    }, ...(raw.secondaryLocations || []).map(item => ({
      city: item.address?.addressLocality || item.location || 'Not specified',
      state: item.address?.addressRegion || 'Not specified',
      country: item.address?.addressCountry || 'Not specified',
      isRemote: remote,
      hybrid
    }))];
    const salaryComponent = raw.compensation?.summaryComponents?.find(component =>
      component.compensationType === 'Salary' && (component.minValue != null || component.maxValue != null)
    );
    const mappedSalary = salaryComponent ? {
      min: Number(salaryComponent.minValue ?? salaryComponent.maxValue ?? 0),
      max: Number(salaryComponent.maxValue ?? salaryComponent.minValue ?? 0),
      currency: salaryComponent.currencyCode || 'USD',
      negotiable: false
    } : salary(`${raw.compensation?.compensationTierSummary || ''} ${raw.compensation?.scrapeableCompensationSalarySummary || ''} ${description}`);
    return {
      source: company.sourceType, sourceProvider: 'ashby', sourceCompanySlug: company.companySlug, sourceExternalId: raw.id, sourceUrl: raw.jobUrl || raw.applyUrl,
      title: raw.title.trim(), companyName: company.companyName, description, jobType: jobType(raw.employmentType, raw.title), department: raw.department || raw.team || 'General',
      locations,
      workMode: remote ? 'remote' : hybrid ? 'hybrid' : 'onsite', requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })), requiredSkills: skills,
      experienceLevel: /chief|vice president|\bvp\b/i.test(raw.title) ? 'executive' : /lead|principal|staff/i.test(raw.title) ? 'lead' : /senior|sr\.?\b/i.test(raw.title) || minExperience >= 5 ? 'senior' : minExperience >= 2 ? 'mid' : 'entry', minExperience, maxExperience,
      educationRequirements: [], salary: mappedSalary, benefits: [], applicationDeadline: new Date(Date.now() + 30 * 86400000), totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: remote ? 'online' : hybrid ? 'hybrid' : 'offline' },
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt, matchingKeywords: skills
    };
  }
}
