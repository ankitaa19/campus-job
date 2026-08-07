import { FilterQuery, Types } from 'mongoose';
import { IJob } from '../../models/Job';
import type { JobsQuery } from './jobs.repository';
import { expandSemanticTerms, freshnessCutoff } from '../job-intelligence';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeJobType = (value?: string): string | undefined => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (!normalized || normalized === 'all' || normalized === 'all-types') return undefined;
  const aliases: Record<string, string> = {
    fulltime: 'full-time',
    'full-time': 'full-time',
    parttime: 'part-time',
    'part-time': 'part-time',
    internship: 'internship',
    intern: 'internship',
    freelance: 'freelance',
    'freelance-jobs': 'freelance',
    contract: 'contract',
    gig: 'contract',
    flexible: 'contract',
    'gig-flexible': 'contract',
    'gig/flexible': 'contract'
  };
  return aliases[normalized];
};

class JobQueryBuilder {
  build(query: JobsQuery = {}, publicOnly = true): {
    filter: FilterQuery<IJob>;
    page: number;
    limit: number;
    sort: Record<string, 1 | -1>;
  } {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(500, Math.max(1, Number(query.limit || 25)));
    const filter: FilterQuery<IJob> = publicOnly
      ? {
          status: 'active', isPublic: true, allowDirectApplications: true, applicationDeadline: { $gte: new Date() },
          $and: [{ $or: [{ source: 'campuspe' }, { sourceLifecycleStatus: 'active' }] }]
        }
      : {};
    const jobType = normalizeJobType(query.jobType);
    if (jobType) filter.jobType = jobType;
    if (query.workMode) filter.workMode = query.workMode;
    if (query.source) filter.source = query.source;
    if (query.provider) filter.sourceProvider = query.provider.toLowerCase();
    if (query.industry) filter.industry = new RegExp(escapeRegex(query.industry), 'i');
    if (query.company) filter.companyName = new RegExp(escapeRegex(query.company), 'i');
    if (query.minSalary != null) filter['salary.max'] = { $gte: Number(query.minSalary) };
    if (query.maxSalary != null) filter['salary.min'] = { $lte: Number(query.maxSalary) };
    if (query.minExperience != null) {
      const minimum = Number(query.minExperience);
      filter.$and = [...(filter.$and || []), {
        $or: [
          { maxExperience: { $gte: minimum } },
          { maxExperience: { $exists: false }, minExperience: { $gte: minimum } }
        ]
      }];
    }
    if (query.maxExperience != null) filter.minExperience = { $lte: Number(query.maxExperience) };
    if (query.education) filter['educationRequirements.degree'] = new RegExp(escapeRegex(query.education), 'i');
    if (query.noticePeriodDays != null) filter.noticePeriodDays = { $lte: Number(query.noticePeriodDays) };
    if (query.skills) {
      const skillTerms = expandSemanticTerms(query.skills).map(term => new RegExp(escapeRegex(term), 'i'));
      filter.$and = [...(filter.$and || []), { $or: [{ requiredSkills: { $in: skillTerms } }, { canonicalSkills: { $in: skillTerms } }] }];
    }
    if (query.postedWithinDays != null) {
      const days = Math.min(15, Math.max(1, Number(query.postedWithinDays)));
      filter.postedAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    if (!publicOnly && query.recruiterId && Types.ObjectId.isValid(query.recruiterId)) {
      filter.recruiterId = new Types.ObjectId(query.recruiterId);
    }
    if (query.location) {
      const location = new RegExp(escapeRegex(query.location), 'i');
      const locationConditions: FilterQuery<IJob>[] = [
        { 'locations.city': location },
        { 'locations.state': location },
        { 'locations.country': location }
      ];
      // Browser-detected location can include remote work. A location typed by
      // the user is strict and must not return unrelated worldwide remote jobs.
      if (query.includeRemote === true || query.includeRemote === 'true') locationConditions.push({ workMode: 'remote' });
      filter.$and = [...(filter.$and || []), { $or: locationConditions }];
    }
    if (query.search) {
      const semanticTerms = expandSemanticTerms(query.search).slice(0, 20).map(term => new RegExp(escapeRegex(term), 'i'));
      const searchConditions = semanticTerms.flatMap(search => [
        { title: search }, { normalizedTitle: search }, { companyName: search },
        { description: search }, { requiredSkills: search }, { canonicalSkills: search }, { industry: search }
      ]);
      filter.$and = [...(filter.$and || []), { $or: searchConditions }];
    }
    const sort: Record<string, 1 | -1> = query.sort === 'oldest' ? { postedAt: 1 }
      : query.sort === 'deadline' ? { applicationDeadline: 1 }
        : { postedAt: -1 };
    return { filter, page, limit, sort };
  }
}

export default new JobQueryBuilder();
