import { FilterQuery, Types } from 'mongoose';
import { IJob, Job } from '../../models/Job';
import { JobDto, ProviderCompanyConfig } from './types';
import JobQueryBuilder from './job-query-builder';
import { enrichJob, freshnessCutoff, fuzzyJobSimilarity } from '../job-intelligence';

export interface JobsQuery {
  search?: string;
  jobType?: string;
  workMode?: string;
  location?: string;
  source?: string;
  provider?: string;
  recruiterId?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'deadline';
  minSalary?: number;
  maxSalary?: number;
  minExperience?: number;
  maxExperience?: number;
  industry?: string;
  company?: string;
  skills?: string;
  education?: string;
  postedWithinDays?: number;
  noticePeriodDays?: number;
  includeRemote?: boolean | string;
}

export interface CompanyJobGroup {
  companyName: string;
  jobs: IJob[];
  jobCount: number;
}

class JobsRepository {
  async refreshIntelligence(limit = 5000): Promise<number> {
    const jobs = await Job.find({
      status: 'active',
      postedAt: { $gte: freshnessCutoff() },
      normalizationVersion: { $ne: 5 }
    }).limit(Math.min(10000, Math.max(1, limit))).lean();
    if (!jobs.length) return 0;
    const operations = jobs.map(job => {
      const intelligence = enrichJob(job);
      return {
        updateOne: {
          filter: { _id: job._id },
          update: { $set: intelligence }
        }
      };
    });
    const result = await Job.bulkWrite(operations, { ordered: false });
    return result.modifiedCount;
  }

  async exists(source: JobDto['source'], sourceExternalId: string): Promise<boolean> {
    return Boolean(await Job.exists({ source, sourceExternalId }));
  }

  async upsertJob(dto: JobDto, company: ProviderCompanyConfig): Promise<{ job: IJob | null; created: boolean; skipped?: 'stale' | 'duplicate' }> {
    const existing = await Job.exists({ source: dto.source, sourceExternalId: dto.sourceExternalId });
    const intelligence = enrichJob(dto);

    // Provider IDs catch exact duplicates. This second pass catches the same
    // vacancy copied across multiple boards with slightly different text.
    if (!existing) {
      const fingerprint = String(intelligence.dedupFingerprint || '');
      const fingerprintDuplicate = fingerprint ? await Job.findOne({ status: 'active', dedupFingerprint: fingerprint }).select('_id').lean() : null;
      if (fingerprintDuplicate) return { job: fingerprintDuplicate as unknown as IJob, created: false, skipped: 'duplicate' };
      const normalizedTitle = String(intelligence.normalizedTitle || '');
      const candidates = await Job.find({
        status: 'active', postedAt: { $gte: freshnessCutoff() },
        $or: [{ normalizedTitle }, { companyName: new RegExp(`^${dto.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }]
      }).select('title companyName locations description requiredSkills').limit(50).lean();
      const duplicate = candidates.find(candidate => fuzzyJobSimilarity(dto, candidate) >= 0.82);
      if (duplicate) return { job: duplicate as unknown as IJob, created: false, skipped: 'duplicate' };
    }
    const update: Record<string, unknown> = {
      ...dto,
      ...intelligence,
      providerCompanyId: company._id,
      importedAt: new Date(),
      status: 'active',
      sourceLifecycleStatus: 'active',
      lastVerifiedAt: new Date(),
      missingSourceCount: 0,
      isPublic: true,
      allowDirectApplications: true,
      lastModified: new Date()
    };
    if (company.recruiterId) update.recruiterId = company.recruiterId;

    const job = await Job.findOneAndUpdate(
      { source: dto.source, sourceExternalId: dto.sourceExternalId },
      {
        $set: update,
        $unset: { firstMissingAt: 1, lastMissingAt: 1, nextSourceRecheckAt: 1 },
        $setOnInsert: { views: 0, applications: [], filledPositions: 0, isUrgent: false }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    if (!job) throw new Error(`Failed to persist job ${dto.sourceExternalId}`);
    return { job, created: !existing };
  }

  async closeMissingJobs(company: ProviderCompanyConfig, activeExternalIds: string[]): Promise<number> {
    const baseFilter: FilterQuery<IJob> = {
      sourceProvider: company.provider,
      sourceCompanySlug: company.companySlug,
      source: { $ne: 'campuspe' }
    };
    if (activeExternalIds.length) baseFilter.sourceExternalId = { $nin: activeExternalIds };
    const now = new Date();
    const firstMissing = await Job.updateMany(
      { ...baseFilter, status: 'active', $or: [{ sourceLifecycleStatus: 'active' }, { sourceLifecycleStatus: { $exists: false } }] },
      { $set: {
        status: 'paused', isPublic: false, sourceLifecycleStatus: 'missing_on_source', missingSourceCount: 1,
        firstMissingAt: now, lastMissingAt: now, nextSourceRecheckAt: new Date(now.getTime() + 60 * 60 * 1000), lastModified: now
      } }
    );
    const recheck = await Job.updateMany(
      { ...baseFilter, sourceLifecycleStatus: 'missing_on_source', lastMissingAt: { $lt: now } },
      {
        $set: { status: 'paused', isPublic: false, sourceLifecycleStatus: 'recheck', lastMissingAt: now, nextSourceRecheckAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), lastModified: now },
        $inc: { missingSourceCount: 1 }
      }
    );
    const expired = await Job.updateMany(
      { ...baseFilter, sourceLifecycleStatus: 'recheck', lastMissingAt: { $lt: now } },
      {
        $set: { status: 'expired', isPublic: false, sourceLifecycleStatus: 'expired', lastMissingAt: now, applicationDeadline: now, lastModified: now },
        $unset: { nextSourceRecheckAt: 1 },
        $inc: { missingSourceCount: 1 }
      }
    );
    return firstMissing.modifiedCount + recheck.modifiedCount + expired.modifiedCount;
  }

  async findAll(query: JobsQuery = {}, publicOnly = true): Promise<{ jobs: IJob[]; total: number; page: number; limit: number }> {
    const { filter, page, limit, sort } = JobQueryBuilder.build(query, publicOnly);
    const shouldBalanceCompanies = publicOnly && !query.provider && !query.source;
    if (shouldBalanceCompanies) {
      const [candidates, total] = await Promise.all([
        Job.find(filter).populate('recruiterId', 'companyInfo.name companyInfo.logo').sort(sort).limit(5000),
        Job.countDocuments(filter)
      ]);
      const companyGroups = new Map<string, IJob[]>();
      candidates.forEach(job => {
        const companyKey = String(job.companyName || 'Company not specified').trim().toLocaleLowerCase();
        companyGroups.set(companyKey, [...(companyGroups.get(companyKey) || []), job]);
      });
      // Return one vacancy per company per pass. The frontend combines those
      // vacancies into company cards without allowing one large employer to
      // occupy the complete first page.
      const balanced: IJob[] = [];
      while ([...companyGroups.values()].some(items => items.length)) {
        for (const items of companyGroups.values()) {
          const job = items.shift();
          if (job) balanced.push(job);
        }
      }
      return { jobs: balanced.slice((page - 1) * limit, page * limit), total, page, limit };
    }
    const [jobs, total] = await Promise.all([
      Job.find(filter).populate('recruiterId', 'companyInfo.name companyInfo.logo').sort(sort).skip((page - 1) * limit).limit(limit),
      Job.countDocuments(filter)
    ]);
    return { jobs, total, page, limit };
  }

  async findCompanyGroups(query: JobsQuery = {}, publicOnly = true): Promise<{
    groups: CompanyJobGroup[];
    totalCompanies: number;
    totalJobs: number;
    page: number;
    limit: number;
  }> {
    const requestedPage = Math.max(1, Number(query.page) || 1);
    const requestedLimit = Math.min(60, Math.max(1, Number(query.limit) || 12));
    const { filter, sort } = JobQueryBuilder.build({ ...query, page: 1, limit: 200 }, publicOnly);
    const start = (requestedPage - 1) * requestedLimit;

    // Do not load the entire catalogue just to build one page of company
    // cards.  Populating thousands of recruiters made this public endpoint
    // exceed the browser's 20-second timeout.  First select the requested
    // employers using only MongoDB fields, then fetch up to 20 vacancies for
    // each selected employer.
    const companyKey = {
      $toLower: {
        $trim: { input: { $ifNull: ['$companyName', 'Company not specified'] } }
      }
    };
    const [companies, totalJobs] = await Promise.all([
      Job.aggregate<{ _id: string; companyName: string; jobCount: number }>([
        { $match: filter },
        { $sort: sort },
        { $group: { _id: companyKey, companyName: { $first: '$companyName' }, jobCount: { $sum: 1 } } },
        { $skip: start },
        { $limit: requestedLimit }
      ]),
      Job.countDocuments(filter)
    ]);

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const groups = await Promise.all(companies.map(async company => {
      const companyName = String(company.companyName || 'Company not specified').trim() || 'Company not specified';
      const jobs = await Job.find({
        ...filter,
        companyName: new RegExp(`^${escapeRegex(companyName)}$`, 'i')
      })
        .populate('recruiterId', 'companyInfo.name companyInfo.logo')
        .sort(sort)
        .limit(20);
      return { companyName, jobs, jobCount: company.jobCount };
    }));

    return {
      groups,
      // The query only needs the number of companies represented in the
      // catalogue; derive it without returning every job document.
      totalCompanies: await Job.aggregate([{ $match: filter }, { $group: { _id: companyKey } }, { $count: 'count' }])
        .then(result => result[0]?.count || 0),
      totalJobs,
      page: requestedPage,
      limit: requestedLimit
    };
  }

  async findPublicById(jobId: string): Promise<IJob | null> {
    if (!Types.ObjectId.isValid(jobId)) return null;
    return Job.findOne({
      _id: jobId,
      status: 'active',
      isPublic: true,
      allowDirectApplications: true,
      applicationDeadline: { $gte: new Date() },
      $or: [{ source: 'campuspe' }, { sourceLifecycleStatus: 'active' }]
    }).populate('recruiterId', 'companyInfo.name companyInfo.logo');
  }
}

export default new JobsRepository();
