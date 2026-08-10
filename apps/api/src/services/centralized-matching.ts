import { Types } from 'mongoose';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import { ResumeJobAnalysis, IResumeJobAnalysis } from '../models/ResumeJobAnalysis';
import AIResumeMatchingService from './ai-resume-matching';
import HybridResumeMatchingService, { AtsEvaluation, DimensionScore, MatchDimension, toDisplayMatchScore } from './hybrid-resume-matching';
import JobBehaviorService from './job-behavior';
import { freshnessCutoff } from './job-intelligence';

/**
 * Centralized Job Matching Service
 * 
 * This service ensures consistency across all job matching scenarios:
 * 1. Student job search (GET /job-matches)
 * 2. Job application process (POST /apply)
 * 3. Resume upload analysis
 * 4. Career alerts
 * 
 * Key Features:
 * - Single source of truth for all matching logic
 * - Database storage of all match results
 * - Cache management to avoid recalculation
 * - Consistent scoring algorithm
 * - Version tracking for resume changes
 */

export interface MatchResult {
  studentId: Types.ObjectId;
  jobId: Types.ObjectId;
  matchScore: number; // 0-100
  explanation: string;
  suggestions: string[];
  skillsMatched: string[];
  skillsGap: string[];
  
  // Enhanced matching details
  finalMatchScore: number;
  skillMatch: number;
  toolMatch: number;
  categoryMatch: number;
  workModeMatch: number;
  semanticSimilarity: number;
  matchedSkills: string[];
  matchedTools: string[];
  matchingModel: 'hybrid-ai-v2' | 'hybrid-local-v2';
  displayMatchScore?: number;
  behaviorAdjustment: number;
  ruleBasedScore: number;
  aiScore: number;
  scoreBreakdown: Record<MatchDimension, DimensionScore>;
  atsEvaluation?: AtsEvaluation;
  
  // Metadata
  jobTitle: string;
  companyName: string;
  workMode: string;
  cached: boolean;
  analyzedAt: Date;
}

export interface BulkMatchResult {
  studentId: Types.ObjectId;
  matches: MatchResult[];
  totalJobs: number;
  matchCount: number;
  threshold: number;
  processingTime: number;
}

class CentralizedMatchingService {
  private readonly CACHE_EXPIRY_HOURS = 24; // Cache matches for 24 hours
  private readonly DEFAULT_THRESHOLD = 0.3; // 30% default threshold
  
  /**
   * Main entry point for all job matching
   * Checks cache first, then calculates if needed
   */
  async getStudentJobMatches(
    studentId: string | Types.ObjectId, 
    options: {
      threshold?: number;
      limit?: number;
      forceRefresh?: boolean;
      includeApplied?: boolean;
    } = {}
  ): Promise<BulkMatchResult> {
    const startTime = Date.now();
    const objStudentId = new Types.ObjectId(studentId);
    
    const {
      threshold = this.DEFAULT_THRESHOLD,
      limit = 20,
      forceRefresh = false,
      includeApplied = false
    } = options;

    console.log(`🔍 [CENTRALIZED MATCHING] Getting matches for student ${studentId}`);
    console.log(`   📊 Threshold: ${Math.round(threshold * 100)}%, Limit: ${limit}, Refresh: ${forceRefresh}`);

    try {
      // A dashboard needs a concise, high-quality set of suggestions, not an
      // exhaustive score for every vacancy in the catalogue.  Scoring every
      // full job document made a login request exceed Express' 30 second
      // response timeout once the imported catalogue grew beyond a few
      // thousand jobs.
      const resultLimit = Math.min(100, Math.max(1, Number(limit) || 20));
      const candidateLimit = Math.min(800, Math.max(100, resultLimit * 8));

      // 1. Get student and validate
      const student = await Student.findById(objStudentId).lean();
      if (!student) {
        throw new Error('Student not found');
      }

      // 2. Get all active jobs
      const jobQuery: any = { 
        status: 'active',
        isPublic: true,
        allowDirectApplications: true,
        applicationDeadline: { $gt: new Date() },
        postedAt: { $gte: freshnessCutoff() }
      };

      // Optionally exclude already applied jobs
      if (!includeApplied) {
        const { Application } = require('../models/Application');
        const appliedJobIds = await Application.find({
          studentId: objStudentId
        }).distinct('jobId');
        
        if (appliedJobIds.length > 0) {
          jobQuery._id = { $nin: appliedJobIds };
        }
      }

      const activeJobs = await Job.find(jobQuery)
        .select([
          'title', 'companyName', 'description', 'requirements',
          'requiredSkills', 'canonicalSkills', 'featureVector', 'industry',
          'department', 'jobType', 'workMode', 'locations', 'minExperience',
          'maxExperience', 'experienceLevel', 'educationRequirements',
          'certifications', 'salary', 'postedAt', 'applicationDeadline',
          'source', 'sourceLifecycleStatus', 'isPublic', 'allowDirectApplications'
        ].join(' '))
        .sort({ postedAt: -1 })
        .limit(candidateLimit)
        .lean();
      console.log(`   💼 Found ${activeJobs.length} active jobs to analyze`);

      // 3. Read the complete cache in one query. Missing rows receive the
      // deterministic hybrid score in memory and are persisted asynchronously.
      // The recommendation request must never wait for one AI/database round
      // trip per active job.
      const matches: MatchResult[] = [];
      const cacheExpiry = new Date(Date.now() - this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
      const cachedAnalyses = forceRefresh ? [] : await ResumeJobAnalysis.find({
        studentId: objStudentId,
        jobId: { $in: activeJobs.map(job => job._id) },
        isActive: true,
        matchingModel: { $in: ['hybrid-ai-v2', 'hybrid-local-v2'] },
        analyzedAt: { $gt: cacheExpiry }
      }).select('jobId matchScore ruleBasedScore aiScore explanation suggestions skillsMatched skillsGap matchingModel scoreBreakdown atsEvaluation analyzedAt').lean();
      const cacheByJob = new Map(cachedAnalyses.map(analysis => [analysis.jobId.toString(), analysis]));
      const behaviorAdjustments = await Promise.all(activeJobs.map(job => JobBehaviorService.adjustment(objStudentId, job)));
      const resumeContent = this.buildResumeContent(student);
      const pendingWrites: any[] = [];

      activeJobs.forEach((job, index) => {
        const cached = cacheByJob.get(job._id.toString());
        const behaviorAdjustment = behaviorAdjustments[index] || 0;
        let match: MatchResult;
        if (cached) {
          const atsScore = cached.ruleBasedScore ?? cached.matchScore;
          match = {
            studentId: objStudentId, jobId: job._id, matchScore: atsScore,
            explanation: cached.explanation, suggestions: cached.suggestions || [], skillsMatched: cached.skillsMatched || [], skillsGap: cached.skillsGap || [],
            finalMatchScore: atsScore / 100, skillMatch: 0, toolMatch: 0, categoryMatch: 0, workModeMatch: 0, semanticSimilarity: 0,
            matchedSkills: cached.skillsMatched || [], matchedTools: [], matchingModel: (cached.matchingModel as 'hybrid-ai-v2' | 'hybrid-local-v2') || 'hybrid-local-v2',
            displayMatchScore: toDisplayMatchScore(atsScore), behaviorAdjustment,
            ruleBasedScore: cached.ruleBasedScore ?? cached.matchScore, aiScore: cached.aiScore ?? cached.matchScore,
            scoreBreakdown: (cached.scoreBreakdown || {}) as Record<MatchDimension, DimensionScore>,
            atsEvaluation: cached.atsEvaluation as AtsEvaluation | undefined,
            jobTitle: job.title, companyName: job.companyName || 'Unknown Company', workMode: job.workMode || 'Not specified', cached: true, analyzedAt: cached.analyzedAt
          };
        } else {
          const local = HybridResumeMatchingService.calculate(student, job);
          match = {
            studentId: objStudentId, jobId: job._id, matchScore: local.matchScore,
            explanation: local.explanation, suggestions: local.suggestions, skillsMatched: local.skillsMatched, skillsGap: local.skillsGap,
            finalMatchScore: local.matchScore / 100,
            skillMatch: local.scoreBreakdown.semanticSkills.score / 100,
            toolMatch: local.scoreBreakdown.educationCertifications.score / 100,
            categoryMatch: local.scoreBreakdown.industry.score / 100,
            workModeMatch: local.scoreBreakdown.location.score / 100,
            semanticSimilarity: local.aiScore / 100, matchedSkills: local.skillsMatched,
            matchedTools: local.scoreBreakdown.educationCertifications.matched,
            matchingModel: 'hybrid-local-v2', displayMatchScore: toDisplayMatchScore(local.matchScore), behaviorAdjustment,
            ruleBasedScore: local.ruleBasedScore, aiScore: local.aiScore, scoreBreakdown: local.scoreBreakdown,
            atsEvaluation: local.atsEvaluation,
            jobTitle: job.title, companyName: job.companyName || 'Unknown Company', workMode: job.workMode || 'Not specified', cached: false, analyzedAt: new Date()
          };
          pendingWrites.push({
            updateOne: {
              filter: { studentId: objStudentId, jobId: job._id },
              update: { $set: {
                studentId: objStudentId, jobId: job._id, matchScore: local.matchScore,
                explanation: local.explanation, suggestions: local.suggestions, skillsMatched: local.skillsMatched, skillsGap: local.skillsGap,
                matchingModel: 'hybrid-local-v2', displayMatchScore: toDisplayMatchScore(local.matchScore), behaviorAdjustment,
                ruleBasedScore: local.ruleBasedScore, aiScore: local.aiScore, scoreBreakdown: local.scoreBreakdown,
                atsEvaluation: local.atsEvaluation,
                resumeText: resumeContent, resumeVersion: 1, jobTitle: job.title, jobDescription: job.description,
                companyName: job.companyName || 'Unknown Company', isActive: true, analyzedAt: new Date()
              } },
              upsert: true
            }
          });
        }
        if (match.finalMatchScore >= threshold) matches.push(match);
      });

      if (pendingWrites.length) {
        setImmediate(() => ResumeJobAnalysis.bulkWrite(pendingWrites, { ordered: false }).catch(error =>
          console.error('Failed to persist bulk recommendation scores:', error)
        ));
      }

      // 4. Sort by match score
      matches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
      
      // 5. Apply limit
      const limitedMatches = matches.slice(0, resultLimit);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ [CENTRALIZED MATCHING] Completed: ${limitedMatches.length}/${matches.length} matches (${processingTime}ms)`);

      return {
        studentId: objStudentId,
        matches: limitedMatches,
        totalJobs: activeJobs.length,
        matchCount: matches.length,
        threshold,
        processingTime
      };

    } catch (error) {
      console.error('❌ [CENTRALIZED MATCHING] Error:', error);
      throw error;
    }
  }

  /**
   * Get or calculate a single student-job match
   * Uses database cache with expiry logic
   */
  async getOrCalculateMatch(
    studentId: Types.ObjectId,
    jobId: Types.ObjectId,
    forceRefresh: boolean = false
  ): Promise<MatchResult | null> {
    
    // 1. Check for cached result (if not forcing refresh)
    if (!forceRefresh) {
      const cachedMatch = await this.getCachedMatch(studentId, jobId);
      if (cachedMatch) {
        return cachedMatch;
      }
    }

    // 2. Calculate new match
    console.log(`🧮 [CENTRALIZED MATCHING] Calculating new match: Student ${studentId} x Job ${jobId}`);
    
    return await this.calculateAndStoreMatch(studentId, jobId);
  }

  /**
   * Check for valid cached match in database
   */
  private async getCachedMatch(
    studentId: Types.ObjectId,
    jobId: Types.ObjectId
  ): Promise<MatchResult | null> {
    
    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() - this.CACHE_EXPIRY_HOURS);

    try {
      const cachedAnalysis = await ResumeJobAnalysis.findOne({
        studentId,
        jobId,
        isActive: true,
        matchingModel: { $in: ['hybrid-ai-v2', 'hybrid-local-v2'] },
        analyzedAt: { $gt: cacheExpiry }
      }).lean();

      if (cachedAnalysis) {
        const cachedJob = await Job.findById(jobId).select('industry normalizedTitle title canonicalSkills requiredSkills').lean();
        const behaviorAdjustment = cachedJob ? await JobBehaviorService.adjustment(studentId, cachedJob) : 0;
        const atsScore = cachedAnalysis.ruleBasedScore ?? cachedAnalysis.matchScore;
        console.log(`💾 [CACHE HIT] Using cached ATS match: ${atsScore}%`);
        
        return {
          studentId,
          jobId,
          matchScore: atsScore,
          explanation: cachedAnalysis.explanation,
          suggestions: cachedAnalysis.suggestions,
          skillsMatched: cachedAnalysis.skillsMatched,
          skillsGap: cachedAnalysis.skillsGap,
          finalMatchScore: atsScore / 100,
          skillMatch: 0, // Legacy fields - could be enhanced
          toolMatch: 0,
          categoryMatch: 0,
          workModeMatch: 0,
          semanticSimilarity: 0,
          matchedSkills: cachedAnalysis.skillsMatched,
          matchedTools: [],
          matchingModel: (cachedAnalysis.matchingModel as 'hybrid-ai-v2' | 'hybrid-local-v2') || 'hybrid-local-v2',
          displayMatchScore: toDisplayMatchScore(atsScore),
          behaviorAdjustment,
          ruleBasedScore: cachedAnalysis.ruleBasedScore ?? cachedAnalysis.matchScore,
          aiScore: cachedAnalysis.aiScore ?? cachedAnalysis.matchScore,
          scoreBreakdown: (cachedAnalysis.scoreBreakdown || {}) as Record<MatchDimension, DimensionScore>,
          atsEvaluation: cachedAnalysis.atsEvaluation as AtsEvaluation | undefined,
          jobTitle: cachedAnalysis.jobTitle,
          companyName: cachedAnalysis.companyName,
          workMode: 'Unknown',
          cached: true,
          analyzedAt: cachedAnalysis.analyzedAt
        };
      }
    } catch (error) {
      console.error('Error checking cache:', error);
    }

    return null;
  }

  /**
   * Calculate new match using AI and store in database
   */
  private async calculateAndStoreMatch(
    studentId: Types.ObjectId,
    jobId: Types.ObjectId
  ): Promise<MatchResult | null> {
    
    try {
      // 1. Get student and job data
      const [student, job] = await Promise.all([
        Student.findById(studentId).lean(),
        Job.findById(jobId).lean()
      ]);

      if (!student || !job) {
        console.error(`Missing data: Student ${!student ? 'not found' : 'found'}, Job ${!job ? 'not found' : 'found'}`);
        return null;
      }

      // 2. Build resume content
      const resumeContent = this.buildResumeContent(student);
      
      // 3. Get semantic/AI analysis. The service has a deterministic fallback
      // when no provider key is configured.
      const aiAnalysis = await AIResumeMatchingService.analyzeResumeMatch(
        resumeContent,
        job.description
      );

      // 4. Calculate the strict 40/30/30 ATS score.
      const hybridMatch = HybridResumeMatchingService.calculate(student, job, aiAnalysis);
      const behaviorAdjustment = await JobBehaviorService.adjustment(studentId, job);
      // Behavior remains recommendation metadata and never changes ATS suitability.
      const finalMatchScore = hybridMatch.matchScore / 100;
      
      // 6. Store in database
      const analysisData = {
        studentId,
        jobId,
        matchScore: hybridMatch.matchScore,
        explanation: hybridMatch.explanation,
        suggestions: hybridMatch.suggestions,
        skillsMatched: hybridMatch.skillsMatched,
        skillsGap: hybridMatch.skillsGap,
        matchingModel: hybridMatch.matchingModel,
        displayMatchScore: hybridMatch.displayMatchScore,
        behaviorAdjustment,
        ruleBasedScore: hybridMatch.ruleBasedScore,
        aiScore: hybridMatch.aiScore,
        scoreBreakdown: hybridMatch.scoreBreakdown,
        atsEvaluation: hybridMatch.atsEvaluation,
        resumeText: resumeContent,
        resumeVersion: 1, // Could be enhanced to track versions
        jobTitle: job.title,
        jobDescription: job.description,
        companyName: job.companyName || 'Unknown Company',
        isActive: true,
        analyzedAt: new Date()
      };

      // Use upsert to handle duplicates
      await ResumeJobAnalysis.findOneAndUpdate(
        { studentId, jobId },
        analysisData,
        { upsert: true, new: true }
      );

      console.log(`💾 [STORED] ${hybridMatch.matchingModel} analysis: ${hybridMatch.matchScore}% for ${job.title}`);

      // 7. Return unified result
      return {
        studentId,
        jobId,
        matchScore: hybridMatch.matchScore,
        explanation: hybridMatch.explanation,
        suggestions: hybridMatch.suggestions,
        skillsMatched: analysisData.skillsMatched,
        skillsGap: hybridMatch.skillsGap,
        finalMatchScore,
        skillMatch: hybridMatch.scoreBreakdown.semanticSkills.score / 100,
        toolMatch: hybridMatch.scoreBreakdown.educationCertifications.score / 100,
        categoryMatch: hybridMatch.scoreBreakdown.industry.score / 100,
        workModeMatch: hybridMatch.scoreBreakdown.location.score / 100,
        semanticSimilarity: hybridMatch.aiScore / 100,
        matchedSkills: hybridMatch.skillsMatched,
        matchedTools: hybridMatch.scoreBreakdown.educationCertifications.matched,
        matchingModel: hybridMatch.matchingModel,
        displayMatchScore: hybridMatch.displayMatchScore,
        behaviorAdjustment,
        ruleBasedScore: hybridMatch.ruleBasedScore,
        aiScore: hybridMatch.aiScore,
        scoreBreakdown: hybridMatch.scoreBreakdown,
        atsEvaluation: hybridMatch.atsEvaluation,
        jobTitle: job.title,
        companyName: analysisData.companyName,
        workMode: job.workMode || 'Not specified',
        cached: false,
        analyzedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error calculating match:', error);
      return null;
    }
  }

  /**
   * Build resume content from student profile
   */
  private buildResumeContent(student: any): string {
    let content = student.resumeText ? `${student.resumeText}\n\n` : '';

    // Basic info
    if (student.firstName && student.lastName) {
      content += `${student.firstName} ${student.lastName}\n\n`;
    }
    
    // Skills
    if (student.skills && Array.isArray(student.skills)) {
      content += 'Skills: ' + student.skills.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name
      ).join(', ') + '\n\n';
    }
    
    // Experience
    if (student.experience && Array.isArray(student.experience)) {
      content += 'Experience:\n';
      student.experience.forEach((exp: any) => {
        content += `${exp.title || exp.position} at ${exp.company}. ${exp.description || ''}\n`;
      });
      content += '\n';
    }
    
    // Education
    if (student.education && Array.isArray(student.education)) {
      content += 'Education:\n';
      student.education.forEach((edu: any) => {
        content += `${edu.degree} in ${edu.field} from ${edu.institution}\n`;
      });
    }

    const extracted = student.resumeAnalysis?.extractedDetails;
    if (extracted?.certifications?.length) {
      content += `\nCertifications: ${extracted.certifications.map((item: any) => item.name).filter(Boolean).join(', ')}\n`;
    }
    if (extracted?.projects?.length) {
      content += `\nProjects:\n${extracted.projects.map((item: any) => `${item.name || ''} ${item.description || ''} ${(item.technologies || []).join(' ')}`).join('\n')}\n`;
    }
    if (student.jobPreferences) {
      content += `\nPreferences: ${(student.jobPreferences.jobTypes || []).join(', ')}; ${student.jobPreferences.workMode || 'any'}; ${(student.jobPreferences.preferredLocations || []).join(', ')}\n`;
    }
    return content || 'No resume information available';
  }

  /**
   * Get stored matches for a student
   */
  async getStoredMatches(
    studentId: Types.ObjectId,
    options: {
      threshold?: number;
      limit?: number;
      sortBy?: 'matchScore' | 'analyzedAt';
      includeInactive?: boolean;
    } = {}
  ) {
    const {
      threshold = 0,
      limit = 50,
      sortBy = 'matchScore',
      includeInactive = false
    } = options;

    const query: any = { studentId };
    
    if (!includeInactive) {
      query.isActive = true;
    }
    
    if (threshold > 0) {
      query.matchScore = { $gte: Math.round(threshold * 100) };
    }

    return await ResumeJobAnalysis.find(query)
      .sort(sortBy === 'matchScore' ? '-matchScore' : '-analyzedAt')
      .limit(limit)
      .populate('jobId', 'title companyName workMode status')
      .lean();
  }

  /**
   * Invalidate cache for a student (e.g., when profile is updated)
   */
  async invalidateStudentCache(studentId: Types.ObjectId) {
    console.log(`🗑️ [CACHE INVALIDATE] Clearing matches for student ${studentId}`);
    
    await ResumeJobAnalysis.updateMany(
      { studentId },
      { isActive: false }
    );
  }

  /**
   * Invalidate cache for a job (e.g., when job is updated)
   */
  async invalidateJobCache(jobId: Types.ObjectId) {
    console.log(`🗑️ [CACHE INVALIDATE] Clearing matches for job ${jobId}`);
    
    await ResumeJobAnalysis.updateMany(
      { jobId },
      { isActive: false }
    );
  }

  /**
   * Get match statistics
   */
  async getMatchStatistics(studentId: Types.ObjectId) {
    const stats = await ResumeJobAnalysis.aggregate([
      { $match: { studentId, isActive: true } },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          averageScore: { $avg: '$matchScore' },
          maxScore: { $max: '$matchScore' },
          highMatches: {
            $sum: { $cond: [{ $gte: ['$matchScore', 70] }, 1, 0] }
          },
          mediumMatches: {
            $sum: { $cond: [{ $and: [{ $gte: ['$matchScore', 40] }, { $lt: ['$matchScore', 70] }] }, 1, 0] }
          },
          lowMatches: {
            $sum: { $cond: [{ $lt: ['$matchScore', 40] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      totalMatches: 0,
      averageScore: 0,
      maxScore: 0,
      highMatches: 0,
      mediumMatches: 0,
      lowMatches: 0
    };
  }
}

export default new CentralizedMatchingService();
