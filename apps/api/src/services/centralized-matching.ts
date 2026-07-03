import { Types } from 'mongoose';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import { ResumeJobAnalysis, IResumeJobAnalysis } from '../models/ResumeJobAnalysis';
import AIResumeMatchingService from './ai-resume-matching';
import AIMatchingService from './ai-matching';

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
      // 1. Get student and validate
      const student = await Student.findById(objStudentId).lean();
      if (!student) {
        throw new Error('Student not found');
      }

      // 2. Get all active jobs
      const jobQuery: any = { 
        status: 'active',
        applicationDeadline: { $gt: new Date() }
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

      const activeJobs = await Job.find(jobQuery).lean();
      console.log(`   💼 Found ${activeJobs.length} active jobs to analyze`);

      // 3. Process matches (with caching)
      const matches: MatchResult[] = [];
      
      for (const job of activeJobs) {
        try {
          const match = await this.getOrCalculateMatch(
            objStudentId, 
            job._id, 
            forceRefresh
          );
          
          if (match && match.finalMatchScore >= threshold) {
            // Add job details
            match.jobTitle = job.title;
            match.companyName = job.companyName || 'Unknown Company';
            match.workMode = job.workMode || 'Not specified';
            
            matches.push(match);
          }
        } catch (matchError) {
          console.error(`❌ Error calculating match for job ${job._id}:`, matchError);
        }
      }

      // 4. Sort by match score
      matches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
      
      // 5. Apply limit
      const limitedMatches = matches.slice(0, limit);
      
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
        analyzedAt: { $gt: cacheExpiry }
      }).lean();

      if (cachedAnalysis) {
        console.log(`💾 [CACHE HIT] Using cached match: ${cachedAnalysis.matchScore}%`);
        
        return {
          studentId,
          jobId,
          matchScore: cachedAnalysis.matchScore,
          explanation: cachedAnalysis.explanation,
          suggestions: cachedAnalysis.suggestions,
          skillsMatched: cachedAnalysis.skillsMatched,
          skillsGap: cachedAnalysis.skillsGap,
          finalMatchScore: cachedAnalysis.matchScore / 100, // Convert to 0-1 scale
          skillMatch: 0, // Legacy fields - could be enhanced
          toolMatch: 0,
          categoryMatch: 0,
          workModeMatch: 0,
          semanticSimilarity: 0,
          matchedSkills: cachedAnalysis.skillsMatched,
          matchedTools: [],
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
      
      // 3. Use the enhanced AI matching service
      const advancedMatch = await AIMatchingService.calculateAdvancedMatch(studentId, jobId);
      
      // 4. Also get detailed AI analysis
      const aiAnalysis = await AIResumeMatchingService.analyzeResumeMatch(
        resumeContent,
        job.description
      );

      // 5. Combine results
      const finalMatchScore = Math.max(advancedMatch.finalMatchScore, aiAnalysis.matchScore / 100);
      
      // 6. Store in database
      const analysisData = {
        studentId,
        jobId,
        matchScore: Math.round(finalMatchScore * 100),
        explanation: aiAnalysis.explanation,
        suggestions: aiAnalysis.suggestions,
        skillsMatched: [...new Set([...advancedMatch.matchedSkills, ...aiAnalysis.skillsMatched])],
        skillsGap: aiAnalysis.skillsGap,
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

      console.log(`💾 [STORED] Match analysis: ${Math.round(finalMatchScore * 100)}% for ${job.title}`);

      // 7. Return unified result
      return {
        studentId,
        jobId,
        matchScore: Math.round(finalMatchScore * 100),
        explanation: aiAnalysis.explanation,
        suggestions: aiAnalysis.suggestions,
        skillsMatched: analysisData.skillsMatched,
        skillsGap: aiAnalysis.skillsGap,
        finalMatchScore,
        skillMatch: advancedMatch.skillMatch,
        toolMatch: advancedMatch.toolMatch,
        categoryMatch: advancedMatch.categoryMatch,
        workModeMatch: advancedMatch.workModeMatch,
        semanticSimilarity: advancedMatch.semanticSimilarity,
        matchedSkills: advancedMatch.matchedSkills,
        matchedTools: advancedMatch.matchedTools,
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
    let content = '';
    
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

    // Use stored resume text if available
    if (student.resumeText) {
      content = student.resumeText;
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
