import { Types } from 'mongoose';
import { Job } from '../models/Job';
import { JobMatch } from '../models/JobMatch';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { ProviderCompany } from '../models/ProviderCompany';
import { buildStudentStructuredFields } from './profile-normalization';
import { canonicalSkill, cleanJobText, cosineSimilarity, enrichJob, freshnessCutoff } from './job-intelligence';
import JobQueryBuilder from './job-aggregation/job-query-builder';
import type { JobsQuery } from './job-aggregation/jobs.repository';
import { generateCohereEmbedding, isCohereRateLimited, COHERE_EMBEDDING_DIMENSIONS } from './cohere-client';
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
  needsYouCount: number;
  unsupportedCount: number;
  totalMatchedAboveThreshold: number;
  /** Explains an empty selection so the UI does not imply the catalogue was unsuitable. */
  diagnostics: {
    scanned: number;
    threshold: number;
    bestScore: number;
    scoredWithoutSemantics: number;
    withoutSkillEvidence: number;
    semanticScoringUnavailable: boolean;
  };
}

const normalize = (value: unknown): string => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const skillSet = (values: unknown[] = []): Set<string> => new Set(values.map(canonicalSkill).map(normalize).filter(Boolean));
const hasCohereEmbedding = (vector: unknown): vector is number[] => Array.isArray(vector) && vector.length === COHERE_EMBEDDING_DIMENSIONS;

/**
 * Runs an async mapper over a list with bounded parallelism. Embedding calls
 * previously fanned out one request per job, which exhausted the provider's
 * per-minute quota in a single burst.
 */
const mapWithConcurrency = async <TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>
): Promise<TOutput[]> => {
  const results = new Array<TOutput>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

interface EmbeddingBudget {
  remaining: number;
}

export type ScoringMode = 'semantic' | 'skill_only' | 'no_evidence';

/**
 * Skill overlap for a job whose requirements could not be extracted. Treating
 * that as a perfect match previously produced 100% scores for unrelated roles,
 * so absent evidence is reported explicitly instead of as agreement.
 */
const skillOverlap = (resumeSkills: Set<string>, jobSkills: string[]): { ratio: number; matched: string[]; hasEvidence: boolean } => {
  const matched = jobSkills.filter(skill => resumeSkills.has(skill));
  if (!jobSkills.length) return { ratio: 0, matched, hasEvidence: false };
  return { ratio: matched.length / jobSkills.length, matched, hasEvidence: true };
};

class JobMatchingRagService {
  private readonly embeddingWeight = 0.7;
  private readonly skillWeight = 0.3;

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

  async annotateJobsForUser(
    userId: string | Types.ObjectId,
    jobs: any[],
    options: { embeddingBudget?: EmbeddingBudget } = {}
  ): Promise<any[]> {
    if (!jobs.length) return jobs;
    const objectUserId = new Types.ObjectId(userId);
    const student = await Student.findOne({ userId: objectUserId }).select('+profileFeatureVector').lean();
    if (!student) return jobs;
    const refreshedStudent = await this.buildScoringStudent(student);
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

    // Jobs missing a cached vector are embedded only within the caller's budget;
    // the rest score on skills so one request cannot drain the provider quota.
    const embeddingBudget = options.embeddingBudget
      || { remaining: Math.max(0, Number(process.env.MATCH_EMBEDDING_BUDGET_PER_REQUEST || 12)) };
    const concurrency = Math.max(1, Math.min(8, Number(process.env.MATCH_EMBEDDING_CONCURRENCY || 4)));

    const annotated = await mapWithConcurrency(jobs, concurrency, async job => {
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

      const computed = await this.computeDisplayScore(refreshedStudent, job, embeddingBudget);
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
    const user = await User.findById(objectUserId).select('autoApplyThreshold').lean();
    if (!user) throw new Error('User not found');
    const thresholdValue = Number(user.autoApplyThreshold);
    const threshold = Number.isFinite(thresholdValue) ? (thresholdValue > 1 ? thresholdValue / 100 : thresholdValue) : 0.85;
    const existingJobIds = await Application.distinct('jobId', { userId: objectUserId });
    const { filter, sort } = JobQueryBuilder.build({ ...filters, page: 1, limit: 1, balanced: false }, true);
    const jobs = await Job.find({ ...filter, _id: { $nin: existingJobIds } })
      .select('+featureVector +applyUrl title companyName description requiredSkills canonicalSkills requirements minExperience maxExperience experienceLevel seniority locations location workMode remoteType salary salaryBand atsPlatform atsJobId applyUrl applicationDeadline postedAt source sourceProvider sourceCompanySlug sourceExternalId providerCompanyId')
      .sort(sort)
      .limit(10000)
      .lean();
    const providerCompanyIds = jobs.map(job => job.providerCompanyId).filter(Boolean);
    const authorizedProviderCompanies = providerCompanyIds.length
      ? await ProviderCompany.find({
          _id: { $in: providerCompanyIds },
          automationPermission: { $in: ['written_permission', 'public_terms_allow'] }
        }).select('_id').lean()
      : [];
    const authorizedIds = new Set(authorizedProviderCompanies.map(company => String(company._id)));
    jobs.forEach(job => {
      (job as any).browserAutomationAuthorized = authorizedIds.has(String(job.providerCompanyId || ''));
    });

    const student = await Student.findOne({ userId: objectUserId }).select('+profileFeatureVector').lean();
    if (!student) throw new Error('Student profile not found');
    const scoringStudent = await this.buildScoringStudent(student);
    const resumeSkills = skillSet([
      ...(scoringStudent.skills || []).map((item: any) => typeof item === 'string' ? item : item?.name),
      ...(scoringStudent.resumeAnalysis?.skills || [])
    ]);

    // Rank on cached data first so the embedding budget is spent on the
    // strongest candidates instead of whichever jobs happen to be newest.
    const prescored = jobs.map(job => {
      const jobSkills = [...skillSet([
        ...(job.requiredSkills || []),
        ...(job.canonicalSkills || []),
        ...(job.requirements || []).map((item: any) => item?.skill)
      ])];
      const overlap = skillOverlap(resumeSkills, jobSkills);
      return { job, overlap, hasCachedVector: hasCohereEmbedding((job as any).featureVector) };
    });
    const withoutSkillEvidence = prescored.filter(item => !item.overlap.hasEvidence).length;
    const candidates = prescored
      .filter(item => item.overlap.hasEvidence && item.overlap.ratio > 0)
      .sort((left, right) => (Number(right.hasCachedVector) - Number(left.hasCachedVector)) || (right.overlap.ratio - left.overlap.ratio));

    const embeddingBudget: EmbeddingBudget = {
      remaining: Math.max(0, Number(process.env.BULK_AUTO_APPLY_EMBEDDING_BUDGET || 25))
    };
    const concurrency = Math.max(1, Math.min(8, Number(process.env.MATCH_EMBEDDING_CONCURRENCY || 4)));
    const considered = candidates.slice(0, Math.max(0, Number(process.env.BULK_AUTO_APPLY_MAX_CANDIDATES || 500)));

    const matched: BulkMatchedJob[] = [];
    let needsYouCount = 0;
    let unsupportedCount = 0;
    let totalMatchedAboveThreshold = 0;
    let scoredWithoutSemantics = 0;
    let bestScore = 0;

    const scored = await mapWithConcurrency(considered, concurrency, async candidate => ({
      job: candidate.job,
      result: await this.computeDisplayScore(scoringStudent, candidate.job, embeddingBudget)
    }));

    scored.forEach(({ job, result }) => {
      if (!result) return;
      if (result.scoringMode !== 'semantic') scoredWithoutSemantics += 1;
      bestScore = Math.max(bestScore, result.score);
      if (result.score < threshold) return;
      // Auto Apply submits real applications, so it requires semantic evidence
      // rather than skill-string overlap alone.
      if (result.scoringMode !== 'semantic') {
        needsYouCount += 1;
        totalMatchedAboveThreshold += 1;
        return;
      }
      totalMatchedAboveThreshold += 1;
      const capability = classifyApplicationCapability(job);
      if (capability === 'auto_apply') matched.push({ job, score: result.score });
      if (capability === 'needs_you') needsYouCount += 1;
      if (capability === 'unsupported') unsupportedCount += 1;
    });

    return {
      matches: matched,
      needsYouCount,
      unsupportedCount,
      totalMatchedAboveThreshold,
      diagnostics: {
        scanned: jobs.length,
        threshold,
        bestScore: Math.round(bestScore * 10000) / 10000,
        scoredWithoutSemantics,
        withoutSkillEvidence,
        semanticScoringUnavailable: isCohereRateLimited() || !hasCohereEmbedding(scoringStudent.profileFeatureVector)
      }
    };
  }

  async findBulkAutoApplyMatches(userId: string | Types.ObjectId, filters: JobsQuery = {}): Promise<BulkMatchedJob[]> {
    return (await this.findBulkAutoApplySelection(userId, filters)).matches;
  }

  private async buildScoringStudent(student: any) {
    const structured = buildStudentStructuredFields(student);
    let profileFeatureVector: number[] = hasCohereEmbedding(student.profileFeatureVector)
      ? student.profileFeatureVector
      : [];
    if (!profileFeatureVector.length) {
      try {
        // One call per student, so it may briefly wait out a cooldown.
        profileFeatureVector = await generateCohereEmbedding(this.resumeEmbeddingText(student, structured), 'search_query', {
          serviceName: 'resume profile embedding',
          waitForCooldown: true,
          maxCooldownWaitMs: 5_000
        });
      } catch {
        // Throttling is reported by the Cohere client; matching falls back to
        // skill overlap until the profile vector can be built.
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
    const hasStudentEmbedding = hasCohereEmbedding(student.profileFeatureVector);
    const embeddingBudget: EmbeddingBudget = {
      remaining: Math.max(0, Number(process.env.MATCH_EMBEDDING_BUDGET_PER_REQUEST || 12))
    };
    const concurrency = Math.max(1, Math.min(8, Number(process.env.MATCH_EMBEDDING_CONCURRENCY || 4)));
    const scored = await mapWithConcurrency(jobs, concurrency, async job => {
      if (!hasStudentEmbedding) return { ...job, embeddingSimilarity: 0 };
      try {
        const { vector, update } = await this.ensureJobEmbedding(job, embeddingBudget);
        if (!vector.length) return { ...job, embeddingSimilarity: 0 };
        if (update) operations.push({ updateOne: { filter: { _id: job._id }, update: { $set: update } } });
        return { ...job, featureVector: vector, embeddingSimilarity: cosineSimilarity(student.profileFeatureVector, vector) };
      } catch {
        // Rate limits and provider faults are reported by the Cohere client.
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

    const resumeSkills = skillSet([
      ...(student.skills || []).map((item: any) => typeof item === 'string' ? item : item?.name),
      ...(student.resumeAnalysis?.skills || [])
    ]);
    const jobSkills = [...skillSet([
      ...(job.requiredSkills || []),
      ...(job.canonicalSkills || []),
      ...(job.requirements || []).map((item: any) => item?.skill)
    ])];
    const { ratio: skillOverlapRatio, matched: matchedSkills } = skillOverlap(resumeSkills, jobSkills);
    const embeddingSimilarity = Math.max(0, Math.min(1, Number(job.embeddingSimilarity || 0)));
    const score = Math.round((hasCohereEmbedding(student.profileFeatureVector)
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

  private async computeDisplayScore(student: any, job: any, embeddingBudget?: EmbeddingBudget) {
    let vector: number[] = [];
    let update: Record<string, unknown> | undefined;
    if (hasCohereEmbedding(student.profileFeatureVector)) {
      try {
        const ensured = await this.ensureJobEmbedding(job, embeddingBudget);
        vector = ensured.vector;
        update = ensured.update;
        if (update) {
          Job.updateOne({ _id: job._id }, { $set: update }).catch(error => {
            console.warn('Skipping job embedding cache update:', error instanceof Error ? error.message : error);
          });
        }
      } catch {
        // The Cohere client reports throttling once per window; scoring
        // continues on skill overlap alone.
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
    const { ratio: skillOverlapRatio, matched: matchedSkills, hasEvidence } = skillOverlap(resumeSkills, jobSkills);
    const embeddingSimilarity = vector.length ? Math.max(0, Math.min(1, cosineSimilarity(student.profileFeatureVector, vector))) : 0;
    const scoringMode: ScoringMode = vector.length ? 'semantic' : hasEvidence ? 'skill_only' : 'no_evidence';
    // Scores from different modes are not interchangeable, so the mode travels
    // with the score and consumers threshold accordingly.
    const score = Math.round((scoringMode === 'semantic'
      ? ((embeddingSimilarity * this.embeddingWeight) + (skillOverlapRatio * this.skillWeight))
      : skillOverlapRatio
    ) * 10000) / 10000;
    return { score, embeddingSimilarity, skillOverlapRatio, matchedSkills, scoringMode };
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

  /**
   * Returns the cached vector when present. Generating a new one consumes the
   * caller's budget, so a large scan degrades to skill-only scoring instead of
   * issuing thousands of embedding calls.
   */
  private async ensureJobEmbedding(job: any, embeddingBudget?: EmbeddingBudget): Promise<{ vector: number[]; update?: Record<string, unknown> }> {
    if (hasCohereEmbedding(job.featureVector)) return { vector: job.featureVector };
    if (embeddingBudget) {
      if (embeddingBudget.remaining <= 0 || isCohereRateLimited()) return { vector: [] };
      embeddingBudget.remaining -= 1;
    }
    const intelligence = enrichJob(job);
    const vector = await generateCohereEmbedding(this.jobEmbeddingText(job, intelligence), 'search_document', 'job embedding');
    return { vector, update: { ...intelligence, featureVector: vector } };
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
