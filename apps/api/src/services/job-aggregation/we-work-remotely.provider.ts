import { extractCanonicalSkills } from '../job-intelligence';
import { publicSourceHttp } from './public-source-http';
import { JobDto, JobProvider, ProviderCompanyConfig } from './types';

interface WwrJob { title: string; region: string; country: string; state: string; skills: string; category: string; type: string; description: string; pubDate: string; expiresAt: string; guid: string; link: string; }

const decodeXml = (value = ''): string => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
  .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&apos;|&#39;/gi, "'").replace(/&amp;/gi, '&').trim();
const cleanHtml = (value = ''): string => decodeXml(value).replace(/<br\s*\/?>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const tag = (xml: string, name: string): string => decodeXml(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');
const normalizeJobType = (value = ''): JobDto['jobType'] => /intern/i.test(value) ? 'internship' : /part/i.test(value) ? 'part-time' : /contract|temporary/i.test(value) ? 'contract' : 'full-time';
const salary = (value: string): JobDto['salary'] => {
  const match = value.match(/(USD|INR|EUR|GBP|[$₹€£])\s*([\d,]{2,})(?:\.\d+)?\s*(?:-|to|–|—)\s*(?:USD|INR|EUR|GBP|[$₹€£])?\s*([\d,]{2,})/i);
  if (!match) return { min: 0, max: 0, currency: 'USD', negotiable: true };
  const currency = ({ '$': 'USD', '₹': 'INR', '€': 'EUR', '£': 'GBP' } as Record<string, string>)[match[1].toUpperCase()] || match[1].toUpperCase();
  return { min: Number(match[2].replace(/,/g, '')), max: Number(match[3].replace(/,/g, '')), currency, negotiable: false };
};

export class WeWorkRemotelyProvider implements JobProvider<WwrJob> {
  readonly name = 'weworkremotely' as const;

  async fetchJobs(_company: ProviderCompanyConfig): Promise<WwrJob[]> {
    const response = await publicSourceHttp.get<string>('https://weworkremotely.com/remote-jobs.rss', { checkRobots: true, responseType: 'text', timeout: 30000, headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
    return Array.from(response.data.matchAll(/<item>([\s\S]*?)<\/item>/gi)).map(match => {
      const item = match[1];
      return { title: tag(item, 'title'), region: tag(item, 'region'), country: tag(item, 'country'), state: tag(item, 'state'), skills: tag(item, 'skills'), category: tag(item, 'category'), type: tag(item, 'type'), description: tag(item, 'description'), pubDate: tag(item, 'pubDate'), expiresAt: tag(item, 'expires_at'), guid: tag(item, 'guid'), link: tag(item, 'link') };
    });
  }

  mapJob(raw: WwrJob, company: ProviderCompanyConfig): JobDto {
    if (!raw.guid || !raw.title) throw new Error('We Work Remotely job is missing required fields');
    const separator = raw.title.indexOf(':'); const companyName = separator > 0 ? raw.title.slice(0, separator).trim() : 'Remote Employer'; const title = separator > 0 ? raw.title.slice(separator + 1).trim() : raw.title;
    const description = cleanHtml(raw.description) || `${title} opportunity at ${companyName}.`;
    const listedSkills = raw.skills.split(/,|\band\b/i).map(value => value.trim()).filter(Boolean); const skills = Array.from(new Set([...extractCanonicalSkills(description), ...listedSkills])).slice(0, 25);
    const range = description.match(/\b(\d{1,2})\s*(?:\+|[-–—]\s*(\d{1,2}))?\s+years?\b/i); const minExperience = Number(range?.[1] || 0); const maxExperience = range?.[2] ? Number(range[2]) : undefined;
    const postedAt = new Date(raw.pubDate || Date.now()); const deadline = new Date(raw.expiresAt || Date.now() + 30 * 86400000);
    return {
      source: 'job_board', sourceProvider: 'weworkremotely', sourceCompanySlug: company.companySlug, sourceExternalId: raw.guid, sourceUrl: raw.link,
      attributionName: 'We Work Remotely', attributionUrl: raw.link || 'https://weworkremotely.com', title, companyName, description, jobType: normalizeJobType(raw.type), department: raw.category || 'General',
      locations: [{ city: 'Remote', state: raw.state || 'Remote', country: raw.country.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim() || raw.region || 'Worldwide', isRemote: true, hybrid: false }], workMode: 'remote',
      requirements: skills.map(skill => ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })), requiredSkills: skills,
      experienceLevel: /lead|principal|staff/i.test(title) ? 'lead' : /senior|sr\.?\b/i.test(title) || minExperience >= 5 ? 'senior' : minExperience >= 2 ? 'mid' : 'entry', minExperience, maxExperience,
      educationRequirements: [], salary: salary(description), benefits: [], applicationDeadline: Number.isNaN(deadline.getTime()) ? new Date(Date.now() + 30 * 86400000) : deadline, totalPositions: 1,
      interviewProcess: { rounds: [], duration: 'Not specified', mode: 'online' }, postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt, matchingKeywords: skills
    };
  }
}
