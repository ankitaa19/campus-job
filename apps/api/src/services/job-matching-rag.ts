import { Types } from 'mongoose';
import { Job } from '../models/Job';
import { JobMatch } from '../models/JobMatch';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { buildStudentStructuredFields } from './profile-normalization';
import { canonicalSkill, cleanJobText, cosineSimilarity, enrichJob, freshnessCutoff } from './job-intelligence';
import JobQueryBuilder from './job-aggregation/job-query-builder';
import type { JobsQuery } from './job-aggregation/jobs.repository';
import { generateOpenAIEmbedding, isOpenAIRateLimitError, OPENAI_EMBEDDING_DIMENSIONS } from './openai-client';
import { classifyApplicationCapability } from './ats/application-capability';

export interface RankedJobMatch {
  job: any;
  score: number;
  embeddingSimilarity: number;
  skillOverlapRatio: number;
  matchedSkills: string[];
  createdAt: Date;
}

export interface BulkMatchedJob {
  job: any;
  score: number;
}

export interface BulkAutoApplySelection {
  matches: BulkMatchedJob[];
  needsYouMatches: BulkMatchedJob[];
  needsYouCount: number;
  unsupportedCount: number;
  totalConsideredJobs: number;
  totalMatchedAboveThreshold: number;
}

interface AnnotationOptions {
  allowEmbeddingGeneration?: boolean;
}

const normalize = (value: unknown): string => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const skillSet = (values: unknown[] = []): Set<string> => new Set(values.map(canonicalSkill).map(normalize).filter(Boolean));
const hasOpenAIEmbedding = (vector: unknown): vector is number[] => Array.isArray(vector) && vector.length === OPENAI_EMBEDDING_DIMENSIONS;
const includesAllFetchedJobs = (filters: JobsQuery): boolean => filters.autoApplyScope !== 'matched' && filters.includeAllJobs !== false && filters.includeAllJobs !== 'false';
const EMBEDDING_COOLDOWN_MS = Number(process.env.OPENAI_EMBEDDING_COOLDOWN_MS || 2 * 60 * 1000);
const EMBEDDING_CONCURRENCY = Math.min(5, Math.max(1, Number(process.env.OPENAI_EMBEDDING_CONCURRENCY || 3)));

const mapWithConcurrency = async <T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> => {
  const output = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return output;
};

class JobMatchingRagService {
  private readonly embeddingWeight = 0.7;
  private readonly skillWeight = 0.3;
  private embeddingDisabledUntil = 0;
  private lastEmbeddingWarningAt = 0;

  async getMatches(userId: string | Types.ObjectId, limit = 20): Promise<RankedJobMatch[]> {
    const objectUserId = new Types.ObjectId(userId);
    const student = await Student.findOne({ userId: objectUserId });
    if (!student) throw new Error('Student profile not found');

    await this.ensureResumeEmbedding(student);
    const refreshedStudent = await Student.findById(student._id).select('+profileFeatureVector').lean();
    if (!refreshedStudent) return [];

    const candidateLimit = Math.min(1000, Math.max(50, limit * 10));
    const candidates = await this.retrieveCandidates(refreshedStudent, candidateLimit);
    const filtered = candidates
      .map(candidate => this.scoreCandidate(refreshedStudent, candidate))
      .filter((match): match is NonNullable<typeof match> => Boolean(match))
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.max(1, limit));

    await this.persistMatches(objectUserId, refreshedStudent._id, filtered);
    return filtered.map(match => ({
      job: match.job,
      score: match.score,
      embeddingSimilarity: match.embeddingSimilarity,
      skillOverlapRatio: match.skillOverlapRatio,
      matchedSkills: match.matchedSkills,
      createdAt: new Date()
    }));
  }

  async annotateJobsForUser(userId: string | Types.ObjectId, jobs: any[], options: AnnotationOptions = {}): Promise<any[]> {
    if (!jobs.length) return jobs;
    const allowEmbeddingGeneration = options.allowEmbeddingGeneration !== false;
    const objectUserId = new Types.ObjectId(userId);
    const student = await Student.findOne({ userId: objectUserId }).select('+profileFeatureVector').lean();
    if (!student) return jobs;
    const refreshedStudent = await this.buildScoringStudent(student, { allowEmbeddingGeneration });
    this.persistResumeEmbedding(student._id, refreshedStudent).catch(error => {
      console.warn('Skipping profile embedding cache update for job listing:', error instanceof Error ? error.message : error);
    });
    const jobIds = jobs.map(job => job._id).filter(Boolean);
    let existingMatches: any[] = [];
    try {
      existingMatches = await JobMatch.find({ userId: objectUserId, jobId: { $in: jobIds } }).maxTimeMS(1500).lean();
    } catch (error) {
      console.warn('Skipping cached match lookup for job listing:', error instanceof Error ? error.message : error);
    }
    const matchByJobId = new Map(existingMatches.map(match => [String(match.jobId), match]));
    const writes: any[] = [];

    const annotated = await mapWithConcurrency(jobs, EMBEDDING_CONCURRENCY, async job => {
      const cached = matchByJobId.get(String(job._id));
      if (cached) {
        return {
          ...job,
          matchScore: Math.round(cached.score * 100),
          score: cached.score,
          embeddingSimilarity: cached.embeddingSimilarity,
          skillOverlapRatio: cached.skillOverlapRatio,
          matchedSkills: cached.matchedSkills
        };
      }

      const computed = await this.computeDisplayScore(refreshedStudent, job, { allowEmbeddingGeneration });
      if (!computed) return job;
      writes.push({
        updateOne: {
          filter: { userId: objectUserId, jobId: job._id },
          update: {
            $set: {
              userId: objectUserId,
              studentId: refreshedStudent._id,
              jobId: job._id,
              score: computed.score,
              embeddingSimilarity: computed.embeddingSimilarity,
              skillOverlapRatio: computed.skillOverlapRatio,
              matchedSkills: computed.matchedSkills,
              filterReasons: []
            }
          },
          upsert: true
        }
      });
      return {
        ...job,
        matchScore: Math.round(computed.score * 100),
        score: computed.score,
        embeddingSimilarity: computed.embeddingSimilarity,
        skillOverlapRatio: computed.skillOverlapRatio,
        matchedSkills: computed.matchedSkills
      };
    });

    if (writes.length) {
      JobMatch.bulkWrite(writes, { ordered: false }).catch(error => {
        console.warn('Skipping job match cache write for job listing:', error instanceof Error ? error.message : error);
      });
    }
    return annotated;
  }

  async findBulkAutoApplySelection(userId: string | Types.ObjectId, filters: JobsQuery = {}): Promise<BulkAutoApplySelection> {
    const objectUserId = new Types.ObjectId(userId);
    const [user, student] = await Promise.all([
      User.findById(objectUserId).select('autoApplyThreshold').lean(),
      Student.findOne({ userId: objectUserId })
        .select('skills resumeAnalysis.skills resumeAnalysis.extractedDetails experience education jobPreferences yearsExperience years_experience locations collegeName workAuthorization')
        .lean()
    ]);
    if (!user) throw new Error('User not found');
    if (!student) throw new Error('Student profile not found');
    const thresholdValue = Number(user.autoApplyThreshold);
    const threshold = Number.isFinite(thresholdValue) ? (thresholdValue > 1 ? thresholdValue / 100 : thresholdValue) : 0.85;
    const includeAllFetched = includesAllFetchedJobs(filters);
    const existingApplications = await Application.find({ userId: objectUserId }).select('jobId status').lean();
    const pendingReviewJobIds = new Set(existingApplications
      .filter(application => application.status === 'pending_review')
      .map(application => String(application.jobId)));
    const excludedJobIds = existingApplications
      .filter(application => application.status !== 'pending_review')
      .map(application => application.jobId);
    const { filter, sort } = JobQueryBuilder.build({ ...filters, page: 1, limit: 1, balanced: false }, true);
    const jobs = await Job.find({ ...filter, _id: { $nin: excludedJobIds } })
      .select('+applyUrl +sourceUrl title companyName requiredSkills canonicalSkills requirements minExperience maxExperience experienceLevel seniority locations location workMode remoteType salary salaryBand atsPlatform atsJobId applicationDeadline postedAt source sourceProvider sourceCompanySlug sourceExternalId greenhouseBoardToken allowDirectApplications')
      .sort(sort)
      .limit(10000)
      .lean();

    const scoringStudent = await this.buildScoringStudent(student, { allowEmbeddingGeneration: false });
    const cachedMatches = await JobMatch.find({
      userId: objectUserId,
      jobId: { $in: jobs.map(job => job._id) }
    }).select('jobId score embeddingSimilarity skillOverlapRatio matchedSkills filterReasons').lean();
    const cachedByJobId = new Map(cachedMatches.map(match => [String(match.jobId), match]));
    const matched: BulkMatchedJob[] = [];
    const needsYouMatches: BulkMatchedJob[] = [];
    let needsYouCount = 0;
    let unsupportedCount = 0;
    let totalMatchedAboveThreshold = 0;
    const totalConsideredJobs = jobs.length;

    for (const job of jobs) {
      const cached = cachedByJobId.get(String(job._id));
      const scored = cached
        ? {
            score: Number(cached.score),
            matchedSkills: cached.matchedSkills || [],
            embeddingSimilarity: Number(cached.embeddingSimilarity || 0),
            skillOverlapRatio: Number(cached.skillOverlapRatio || 0)
          }
        : includeAllFetched
          ? this.scoreCandidateWithoutHardFilters(scoringStudent, { ...job, embeddingSimilarity: 0 })
          : this.scoreCandidate(scoringStudent, { ...job, embeddingSimilarity: 0 });
      const score = Number(scored?.score);
      if (!Number.isFinite(score)) continue;
      if (score >= threshold) totalMatchedAboveThreshold += 1;
      if (!includeAllFetched && score < threshold) continue;
      const capability = classifyApplicationCapability(job);
      const hasPendingReviewApplication = pendingReviewJobIds.has(String(job._id));
      if (hasPendingReviewApplication && capability !== 'auto_apply') continue;
      const jobWithScore = {
        ...job,
        score,
        matchScore: Math.round(score * 100),
        matchedSkills: scored?.matchedSkills || [],
        embeddingSimilarity: scored?.embeddingSimilarity || 0,
        skillOverlapRatio: scored?.skillOverlapRatio || 0
      };
      if (capability === 'auto_apply') matched.push({ job: jobWithScore, score });
      if (capability === 'needs_you') {
        needsYouCount += 1;
        needsYouMatches.push({ job: jobWithScore, score });
      }
      if (capability === 'unsupported') unsupportedCount += 1;
    }
    return { matches: matched, needsYouMatches, needsYouCount, unsupportedCount, totalConsideredJobs, totalMatchedAboveThreshold };
  }

  async findBulkAutoApplyMatches(userId: string | Types.ObjectId, filters: JobsQuery = {}): Promise<BulkMatchedJob[]> {
    return (await this.findBulkAutoApplySelection(userId, filters)).matches;
  }

  private async buildScoringStudent(student: any, options: AnnotationOptions = {}) {
    const allowEmbeddingGeneration = options.allowEmbeddingGeneration !== false;
    const structured = buildStudentStructuredFields(student, {
      includeProfileFeatureVector: allowEmbeddingGeneration || hasOpenAIEmbedding(student.profileFeatureVector)
    });
    let profileFeatureVector: number[] = hasOpenAIEmbedding(student.profileFeatureVector)
      ? student.profileFeatureVector
      : [];
    if (!profileFeatureVector.length && allowEmbeddingGeneration && this.embeddingAvailable()) {
      try {
        profileFeatureVector = await generateOpenAIEmbedding(this.resumeEmbeddingText(student, structured), 'resume profile embedding');
      } catch (error) {
        this.noteEmbeddingFailure(error, 'resume profile embedding');
      }
    }
    return {
      ...student,
      titles: structured.titles,
      yearsExperience: structured.yearsExperience,
      locations: structured.locations,
      salaryExpectation: structured.salaryExpectation,
      structuredResumeUpdatedAt: structured.structuredResumeUpdatedAt,
      profileFeatureVector
    };
  }

  private async persistResumeEmbedding(studentId: Types.ObjectId, structured: any): Promise<void> {
    await Student.updateOne(
      { _id: studentId },
      {
        $set: {
          titles: structured.titles,
          yearsExperience: structured.yearsExperience,
          locations: structured.locations,
          salaryExpectation: structured.salaryExpectation,
          structuredResumeUpdatedAt: structured.structuredResumeUpdatedAt,
          profileFeatureVector: structured.profileFeatureVector
        }
      }
    );
  }

  private async ensureResumeEmbedding(student: any): Promise<void> {
    await this.persistResumeEmbedding(student._id, await this.buildScoringStudent(student));
  }

  private async retrieveCandidates(student: any, limit: number): Promise<any[]> {
    const jobs = await Job.find({
      status: 'active',
      isPublic: true,
      allowDirectApplications: true,
      applicationDeadline: { $gt: new Date() },
      postedAt: { $gte: freshnessCutoff() }
    })
      .select('+featureVector +applyUrl title companyName description requiredSkills canonicalSkills requirements minExperience maxExperience experienceLevel seniority locations location workMode remoteType salary salaryBand atsPlatform atsJobId applyUrl applicationDeadline postedAt')
      .lean();

    const operations: any[] = [];
    const hasStudentEmbedding = hasOpenAIEmbedding(student.profileFeatureVector) && this.embeddingAvailable();
    const scored = await mapWithConcurrency(jobs, EMBEDDING_CONCURRENCY, async job => {
      if (!hasStudentEmbedding) return { ...job, embeddingSimilarity: 0 };
      try {
        const { vector, update } = await this.ensureJobEmbedding(job);
        if (update) operations.push({ updateOne: { filter: { _id: job._id }, update: { $set: update } } });
        return { ...job, featureVector: vector, embeddingSimilarity: cosineSimilarity(student.profileFeatureVector, vector) };
      } catch (error) {
        this.noteEmbeddingFailure(error, 'candidate job embedding');
        return { ...job, embeddingSimilarity: 0 };
      }
    });

    if (operations.length) {
      await Job.bulkWrite(operations, { ordered: false });
    }

    return scored.sort((left, right) => right.embeddingSimilarity - left.embeddingSimilarity).slice(0, limit);
  }

  private scoreCandidate(student: any, job: any) {
    const filterReasons = this.filterReasons(student, job);
    if (filterReasons.length) return null;
    return this.scoreCandidateWithoutHardFilters(student, job, filterReasons);
  }

  private scoreCandidateWithoutHardFilters(student: any, job: any, filterReasons: string[] = []) {
    const resumeSkills = skillSet([
      ...(student.skills || []).map((item: any) => typeof item === 'string' ? item : item?.name),
      ...(student.resumeAnalysis?.skills || [])
    ]);
    const jobSkills = [...skillSet([
      ...(job.requiredSkills || []),
      ...(job.canonicalSkills || []),
      ...(job.requirements || []).map((item: any) => item?.skill)
    ])];
    const matchedSkills = jobSkills.filter(skill => resumeSkills.has(skill));
    const skillOverlapRatio = jobSkills.length ? matchedSkills.length / jobSkills.length : 1;
    const embeddingSimilarity = Math.max(0, Math.min(1, Number(job.embeddingSimilarity || 0)));
    const score = Math.round((hasOpenAIEmbedding(student.profileFeatureVector)
      ? ((embeddingSimilarity * this.embeddingWeight) + (skillOverlapRatio * this.skillWeight))
      : skillOverlapRatio
    ) * 10000) / 10000;

    return {
      job,
      score,
      embeddingSimilarity,
      skillOverlapRatio,
      matchedSkills,
      filterReasons
    };
  }

  private async computeDisplayScore(student: any, job: any, options: AnnotationOptions = {}) {
    const allowEmbeddingGeneration = options.allowEmbeddingGeneration !== false;
    let vector: number[] = [];
    let update: Record<string, unknown> | undefined;
    if (hasOpenAIEmbedding(student.profileFeatureVector) && this.embeddingAvailable()) {
      try {
        const ensured = await this.ensureJobEmbedding(job, { allowEmbeddingGeneration });
        vector = ensured.vector;
        update = ensured.update;
        if (update) {
          Job.updateOne({ _id: job._id }, { $set: update }).catch(error => {
            console.warn('Skipping job embedding cache update:', error instanceof Error ? error.message : error);
          });
        }
      } catch (error) {
        this.noteEmbeddingFailure(error, 'display job embedding');
      }
    }
    const resumeSkills = skillSet([
      ...(student.skills || []).map((item: any) => typeof item === 'string' ? item : item?.name),
      ...(student.resumeAnalysis?.skills || [])
    ]);
    const jobSkills = [...skillSet([
      ...(job.requiredSkills || []),
      ...(job.canonicalSkills || []),
      ...(job.requirements || []).map((item: any) => item?.skill)
    ])];
    const matchedSkills = jobSkills.filter(skill => resumeSkills.has(skill));
    const skillOverlapRatio = jobSkills.length ? matchedSkills.length / jobSkills.length : 1;
    const embeddingSimilarity = vector.length ? Math.max(0, Math.min(1, cosineSimilarity(student.profileFeatureVector, vector))) : 0;
    const score = Math.round((vector.length
      ? ((embeddingSimilarity * this.embeddingWeight) + (skillOverlapRatio * this.skillWeight))
      : skillOverlapRatio
    ) * 10000) / 10000;
    return { score, embeddingSimilarity, skillOverlapRatio, matchedSkills };
  }

  private resumeEmbeddingText(student: any, structured: any): string {
    return [
      student?.resumeText || student?.resumeAnalysis?.resumeText || '',
      (structured.titles || []).join(' '),
      (student.skills || []).map((item: any) => typeof item === 'string' ? item : item?.name).join(' '),
      (student.resumeAnalysis?.skills || []).join(' '),
      (structured.education || []).map((item: any) => `${item?.degree || ''} ${item?.field || ''} ${item?.institution || ''}`).join(' '),
      (structured.locations || []).join(' ')
    ].join('\n').replace(/\s+/g, ' ').trim();
  }

  private jobEmbeddingText(job: any, enriched: any = {}): string {
    const requiredSkills = [...(job.requiredSkills || []), ...(enriched.requiredSkills || []), ...(job.canonicalSkills || []), ...(enriched.canonicalSkills || [])];
    return [
      job.title,
      job.companyName,
      enriched.normalizedTitle || job.normalizedTitle,
      cleanJobText(enriched.description || job.description || ''),
      requiredSkills.join(' '),
      enriched.industry || job.industry,
      enriched.seniority || job.seniority || job.experienceLevel,
      job.location || (job.locations || []).map((item: any) => `${item.city || ''} ${item.state || ''} ${item.country || ''}`).join(' ')
    ].join('\n').replace(/\s+/g, ' ').trim();
  }

  private async ensureJobEmbedding(job: any, options: AnnotationOptions = {}): Promise<{ vector: number[]; update?: Record<string, unknown> }> {
    if (hasOpenAIEmbedding(job.featureVector)) return { vector: job.featureVector };
    if (options.allowEmbeddingGeneration === false) {
      throw new Error('OpenAI embedding generation disabled for this request');
    }
    if (!this.embeddingAvailable()) throw new Error('OpenAI embeddings are temporarily rate-limited');
    const intelligence = enrichJob(job);
    const vector = await generateOpenAIEmbedding(this.jobEmbeddingText(job, intelligence), 'job embedding');
    return { vector, update: { ...intelligence, featureVector: vector } };
  }

  private embeddingAvailable(): boolean {
    return Date.now() >= this.embeddingDisabledUntil;
  }

  private noteEmbeddingFailure(error: unknown, label: string): void {
    if (isOpenAIRateLimitError(error)) {
      this.embeddingDisabledUntil = Date.now() + EMBEDDING_COOLDOWN_MS;
    }
    const now = Date.now();
    if (now - this.lastEmbeddingWarningAt < 30_000) return;
    this.lastEmbeddingWarningAt = now;
    const suffix = isOpenAIRateLimitError(error)
      ? `; using skill-only matching for ${Math.ceil(EMBEDDING_COOLDOWN_MS / 1000)}s cooldown`
      : '; using skill-only matching';
    console.warn(`OpenAI ${label} unavailable${suffix}:`, error instanceof Error ? error.message : error);
  }

  private filterReasons(student: any, job: any): string[] {
    const reasons: string[] = [];
    const resumeSkills = skillSet([
      ...(student.skills || []).map((item: any) => typeof item === 'string' ? item : item?.name),
      ...(student.resumeAnalysis?.skills || [])
    ]);
    const requiredSkills = [...skillSet(job.requiredSkills || [])];
    const missingSkills = requiredSkills.filter(skill => !resumeSkills.has(skill));
    if (missingSkills.length) reasons.push(`missing_required_skills:${missingSkills.join(',')}`);

    const yearsExperience = Number(student.yearsExperience || 0);
    if (Number(job.minExperience || 0) > yearsExperience) reasons.push('insufficient_experience');

    const preferredLocations = (student.locations?.length ? student.locations : student.jobPreferences?.preferredLocations || []).map(normalize).filter(Boolean);
    const jobLocationText = normalize(job.location || (job.locations || []).map((item: any) => `${item.city} ${item.state} ${item.country}`).join(' '));
    const remoteType = normalize(job.remoteType || job.workMode);
    if (preferredLocations.length && remoteType !== 'remote') {
      const locationMatch = preferredLocations.some((location: string) => jobLocationText.includes(location) || location.includes(jobLocationText));
      if (!locationMatch) reasons.push('location_mismatch');
    }

    const preferredWorkMode = normalize(student.jobPreferences?.workMode || 'any');
    if (preferredWorkMode && preferredWorkMode !== 'any' && remoteType && remoteType !== preferredWorkMode) {
      if (!(preferredWorkMode === 'remote' && remoteType === 'hybrid')) reasons.push('remote_constraint_mismatch');
    }

    const studentWorkAuthorization = (student.workAuthorization || []).map(normalize).filter(Boolean);
    const jobWorkAuthorization = (job.workAuthorization || job.visaRequirements || []).map(normalize).filter(Boolean);
    if (jobWorkAuthorization.length && studentWorkAuthorization.length) {
      const visaMatch = jobWorkAuthorization.some((value: string) => studentWorkAuthorization.includes(value));
      if (!visaMatch) reasons.push('visa_constraint_mismatch');
    }

    return reasons;
  }

  private async persistMatches(userId: Types.ObjectId, studentId: Types.ObjectId, matches: Array<ReturnType<JobMatchingRagService['scoreCandidate']> & object>): Promise<void> {
    if (!matches.length) return;
    await JobMatch.bulkWrite(matches.map((match: any) => ({
      updateOne: {
        filter: { userId, jobId: match.job._id },
        update: {
          $set: {
            userId,
            studentId,
            jobId: match.job._id,
            score: match.score,
            embeddingSimilarity: match.embeddingSimilarity,
            skillOverlapRatio: match.skillOverlapRatio,
            matchedSkills: match.matchedSkills,
            filterReasons: match.filterReasons
          }
        },
        upsert: true
      }
    })), { ordered: false });
  }
}

export default new JobMatchingRagService();
