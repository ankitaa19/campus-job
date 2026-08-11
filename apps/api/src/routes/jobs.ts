import express from 'express';
import { 
    getAllJobs, 
    getJobById, 
    createJob, 
    importJob,
    updateJob, 
    deleteJob,
    publishJob,
    getJobMatchingStats,
    findMatchingStudents,
    triggerJobAlerts,
    sendWhatsAppToStudents,
    getJobNotificationHistory
} from '../controllers/jobs';
import { discoverCareerSources, getJobAggregationStatus, syncAllJobs, syncProviderCompanyJobs, syncProviderJobs } from '../controllers/job-sync';
import JobsRepository from '../services/job-aggregation/jobs.repository';
import JobQueryBuilder from '../services/job-aggregation/job-query-builder';
import {
    applyForJob,
    getResumeImprovementSuggestions,
    getJobApplications,
    getResumeAnalysis,
    getCurrentUserResumeAnalysis,
    analyzeResumeOnly
} from '../controllers/job-applications';
import {
    createJobInvitations,
    getJobInvitations
} from '../controllers/invitations';
import { Job } from '../models/Job';
import authMiddleware from '../middleware/auth';
import { checkRecruiterAccess } from '../middleware/entityAccess';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Types } from 'mongoose';
import JobBehaviorService from '../services/job-behavior';
import { freshnessCutoff } from '../services/job-intelligence';
import JobMatchingRagService from '../services/job-matching-rag';
import AutoApplyService from '../services/auto-apply';
import BulkAutoApplyService, { BulkAutoApplyStartDependencyError } from '../services/bulk-auto-apply';
import { MATCH_VISIBILITY_THRESHOLD } from '../services/hybrid-resume-matching';
import { sanitizeForLog } from '../utils/safe-logging';
import { withApplicationCapability } from '../services/ats/application-capability';
import ProductEventService from '../services/product-events';
import axios from 'axios';

const router = express.Router();
const reverseGeocodeCache = new Map<string, { city: string; state: string; country: string; displayName: string }>();

const isMongoWriteFailure = (error: any): boolean => {
    if (error instanceof BulkAutoApplyStartDependencyError && error.code === 'BULK_AUTO_APPLY_MONGO_UNAVAILABLE') return true;
    const name = String(error?.name || error?.originalError?.name || '');
    const message = String(error?.message || error?.originalError?.message || '');
    return /Mongo|Mongoose|E11000|quota|not master|primary|write/i.test(`${name} ${message}`);
};

const isOpenAIFailure = (error: any): boolean => {
    if (error instanceof BulkAutoApplyStartDependencyError && error.code === 'BULK_AUTO_APPLY_OPENAI_UNAVAILABLE') return true;
    const url = String(error?.config?.url || error?.originalError?.config?.url || '');
    const message = String(error?.message || error?.originalError?.message || '');
    return /api\.openai\.com/i.test(url) || /OpenAI/i.test(message);
};

const isRateLimitFailure = (error: any): boolean => {
    const status = Number(error?.response?.status || error?.status || 0);
    return status === 429 || error?.name === 'OpenAIRateLimitError' || /rate limit/i.test(String(error?.message || ''));
};

const isCohereFailure = (error: any): boolean => {
    if (error instanceof BulkAutoApplyStartDependencyError && error.code === 'BULK_AUTO_APPLY_COHERE_UNAVAILABLE') return true;
    const url = String(error?.config?.url || error?.originalError?.config?.url || '');
    const message = String(error?.message || error?.originalError?.message || '');
    return /api\.cohere\.com/i.test(url) || /Cohere/i.test(message);
};

const bulkAutoApplyErrorResponse = (error: unknown) => {
    const detailedError = error instanceof BulkAutoApplyStartDependencyError ? error.originalError : error;
    if (isRateLimitFailure(detailedError)) {
        console.warn('[INFRA][BULK_AUTO_APPLY][RATE_LIMIT] AI provider quota exhausted:', sanitizeForLog(detailedError));
        return {
            status: 429,
            body: {
                success: false,
                code: 'BULK_AUTO_APPLY_RATE_LIMITED',
                message: 'AI usage limit reached. Auto Apply will be available again in a few minutes.'
            }
        };
    }
    if (isMongoWriteFailure(error)) {
        console.error('[INFRA][BULK_AUTO_APPLY][MONGO_WRITE] Unable to create bulk auto-apply run:', sanitizeForLog(detailedError));
        return {
            status: 503,
            body: {
                success: false,
                code: 'BULK_AUTO_APPLY_MONGO_UNAVAILABLE',
                message: 'Unable to save data right now — please try again shortly.'
            }
        };
    }
    if (isOpenAIFailure(error)) {
        console.error('[INFRA][BULK_AUTO_APPLY][OPENAI] Unable to create bulk auto-apply run:', sanitizeForLog(detailedError));
        return {
            status: 503,
            body: {
                success: false,
                code: 'BULK_AUTO_APPLY_OPENAI_UNAVAILABLE',
                message: 'AI matching is temporarily unavailable — please try again shortly.'
            }
        };
    }
    if (isCohereFailure(error)) {
        console.error('[INFRA][BULK_AUTO_APPLY][COHERE] Unable to create bulk auto-apply run:', sanitizeForLog(detailedError));
        return {
            status: 503,
            body: {
                success: false,
                code: 'BULK_AUTO_APPLY_COHERE_UNAVAILABLE',
                message: 'AI matching is temporarily unavailable — please try again shortly.'
            }
        };
    }
    const message = error instanceof Error ? error.message : 'Failed to start bulk auto-apply';
    console.error('[APP][BULK_AUTO_APPLY] Bulk auto-apply start failed:', sanitizeForLog(error));
    return { status: 500, body: { success: false, code: 'BULK_AUTO_APPLY_START_FAILED', message } };
};

const withFallbackTimeout = async <T>(promise: Promise<T>, fallback: T, timeoutMs: number, label: string): Promise<T> => {
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            console.warn(`${label} exceeded ${timeoutMs}ms; returning unannotated jobs`);
            resolve(fallback);
        }, timeoutMs);
        promise
            .then(value => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch(error => {
                clearTimeout(timer);
                console.warn(`${label} failed; returning unannotated jobs:`, error instanceof Error ? error.message : error);
                resolve(fallback);
            });
    });
};

const plainJob = (job: any): any => typeof job?.toObject === 'function' ? job.toObject() : job;
const addApplicationCapabilities = (jobs: any[]): any[] => jobs.map(job => withApplicationCapability(plainJob(job)));

// Route to get all jobs
router.get('/', getAllJobs);

// Route to get public jobs (no auth required) - used by /jobs public page and student dashboard
router.get('/public', async (req: any, res: any) => {
    try {
        const result = await JobsRepository.findAll(req.query, true);
        res.setHeader('X-Total-Count', String(result.total));
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
        res.status(200).json(addApplicationCapabilities(result.jobs));
    } catch (error) {
        console.error('Error fetching public jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Company-grouped catalogue endpoint. Each page contains a balanced set of
// employers and all current vacancies needed by that employer's carousel.
router.get('/public/companies', async (req: any, res: any) => {
    try {
        const result = await JobsRepository.findCompanyGroups(req.query, true);
        res.setHeader('X-Total-Count', String(result.totalJobs));
        res.setHeader('X-Total-Companies', String(result.totalCompanies));
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Total-Companies');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching public company jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Convert browser coordinates into a human-readable search location. Keeping
// this server-side avoids exposing a third-party geocoding call in the browser.
router.get('/location/reverse', async (req: any, res: any) => {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
    }

    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = reverseGeocodeCache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { format: 'jsonv2', lat: latitude, lon: longitude, zoom: 10, addressdetails: 1 },
            headers: { 'User-Agent': 'CampusPe/1.0 (https://campuspe.com)', Accept: 'application/json' },
            timeout: 8000
        });
        const address = response.data?.address || {};
        const result = {
            city: address.city || address.town || address.village || address.municipality || address.county || '',
            state: address.state || '',
            country: address.country || '',
            displayName: response.data?.display_name || ''
        };
        if (!result.city && !result.state && !result.country) throw new Error('No location found for coordinates');
        reverseGeocodeCache.set(cacheKey, result);
        return res.json({ success: true, data: result });
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return res.status(502).json({ success: false, message: 'Unable to identify your location right now' });
    }
});

// Manual synchronization is admin-only. These routes must be declared before
// the dynamic job ID route.
router.get('/sync', authMiddleware, roleMiddleware(['admin']), syncAllJobs);
router.get('/sync/status', authMiddleware, roleMiddleware(['admin']), getJobAggregationStatus);
router.post('/sync/discover-career-sources', authMiddleware, roleMiddleware(['admin']), discoverCareerSources);
router.get('/sync/:provider', authMiddleware, roleMiddleware(['admin']), syncProviderJobs);
router.get('/sync/:provider/:companySlug', authMiddleware, roleMiddleware(['admin']), syncProviderCompanyJobs);

// Recommendations must be declared before /:jobId so "recommendations" is
// never interpreted as a Mongo ObjectId.
router.get('/recommendations', authMiddleware, async (req: any, res: any) => {
    try {
        const { Student } = require('../models/Student');
        const CentralizedMatchingService = require('../services/centralized-matching').default;
        const student = await Student.findOne({ userId: req.user?._id || req.user?.userId });
        if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

        const minimumScore = Math.max(MATCH_VISIBILITY_THRESHOLD, Math.min(100, Number(req.query.minimumScore ?? MATCH_VISIBILITY_THRESHOLD)));
        const result = await CentralizedMatchingService.getStudentJobMatches(student._id, {
            threshold: minimumScore / 100,
            limit: Math.min(500, Math.max(1, Number(req.query.limit ?? 20))),
            includeApplied: true
        });
        const jobIds = result.matches.map((match: any) => match.jobId);
        const { filter: recommendationFilter, sort } = JobQueryBuilder.build(req.query, true);
        const jobs = await Job.find({ ...recommendationFilter, _id: { $in: jobIds }, postedAt: { $gte: freshnessCutoff() } }).sort(sort).lean();
        const matchesByJobId = new Map(result.matches.map((match: any) => [match.jobId.toString(), match]));
        const recommendationData = jobs.map((job: any) => {
            const match: any = matchesByJobId.get(job._id.toString());
            if (!match) return null;
            return {
                ...job,
                matchScore: match.displayMatchScore,
                matchedSkills: match.skillsMatched,
                skillsGap: match.skillsGap,
                matchingModel: match.matchingModel,
                ruleBasedScore: match.ruleBasedScore,
                aiScore: match.aiScore,
                behaviorAdjustment: match.behaviorAdjustment,
                scoreBreakdown: match.scoreBreakdown,
                atsEvaluation: match.atsEvaluation
            };
        }).filter(Boolean);
        ProductEventService.recordMany(recommendationData.map((job: any, rank: number) => ({
            name: 'recommendation_generated',
            actorUserId: req.user?._id || req.user?.userId,
            studentId: student._id,
            jobId: job._id,
            sessionId: String(req.get('x-session-id') || ''),
            modelVersion: job.matchingModel || 'hybrid-local-v2',
            rank,
            candidateSetSize: result.totalJobs,
            scores: {
                match: Number(job.matchScore || 0) / 100,
                rules: Number(job.ruleBasedScore || 0) / 100,
                semantic: Number(job.aiScore || 0) / 100
            },
            jobVersion: String(job.normalizationVersion || 1),
            sourceProvider: job.sourceProvider
        }))).catch(() => undefined);
        return res.json({
            success: true,
            minimumScore,
            data: recommendationData
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
    }
});

router.get('/matches', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        if (!userId || !Types.ObjectId.isValid(String(userId))) {
            return res.status(401).json({ success: false, message: 'Authenticated user is required' });
        }
        const result = await JobsRepository.findAll({ ...req.query, balanced: false }, true);
        const plainJobs = addApplicationCapabilities(result.jobs);
        const jobs = await withFallbackTimeout(
            JobMatchingRagService.annotateJobsForUser(userId, plainJobs),
            plainJobs,
            1500,
            'Job match annotation'
        );
        res.setHeader('X-Total-Count', String(result.total));
        res.setHeader('X-Page', String(result.page));
        res.setHeader('X-Page-Size', String(result.limit));
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page, X-Page-Size');
        return res.json({
            success: true,
            total: result.total,
            page: result.page,
            limit: result.limit,
            data: jobs
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch jobs with match scores';
        const status = message === 'Student profile not found' ? 404 : 500;
        console.error('Error fetching jobs with match scores:', error);
        return res.status(status).json({ success: false, message });
    }
});

router.get('/auto-apply/preview-count', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        if (!userId || !Types.ObjectId.isValid(String(userId))) {
            return res.status(401).json({ success: false, message: 'Authenticated user is required' });
        }
        const result = await BulkAutoApplyService.previewCount(userId, req.query);
        return res.json({ success: true, ...result });
    } catch (error) {
        if (isCohereFailure(error) || isOpenAIFailure(error)) {
            console.error('[INFRA][BULK_AUTO_APPLY][AI_PROVIDER] Bulk auto-apply preview failed:', sanitizeForLog(error));
            return res.status(503).json({
                success: false,
                code: isCohereFailure(error) ? 'BULK_AUTO_APPLY_COHERE_UNAVAILABLE' : 'BULK_AUTO_APPLY_OPENAI_UNAVAILABLE',
                message: 'AI matching is temporarily unavailable — please try again shortly.'
            });
        }
        const message = error instanceof Error ? error.message : 'Failed to calculate bulk auto-apply preview';
        console.error('Bulk auto-apply preview failed:', sanitizeForLog(error));
        return res.status(/not found/i.test(message) ? 404 : 500).json({ success: false, message });
    }
});

router.post('/auto-apply/bulk', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        if (!userId || !Types.ObjectId.isValid(String(userId))) {
            return res.status(401).json({ success: false, message: 'Authenticated user is required' });
        }
        await BulkAutoApplyService.assertStartDependencies();
        const run = await BulkAutoApplyService.createRun(userId, req.body?.filters || {});
        return res.status(202).json({ success: true, runId: run._id });
    } catch (error) {
        const response = bulkAutoApplyErrorResponse(error);
        return res.status(response.status).json(response.body);
    }
});

router.get('/auto-apply/runs/:runId', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        if (!userId || !Types.ObjectId.isValid(String(userId)) || !Types.ObjectId.isValid(req.params.runId)) {
            return res.status(400).json({ success: false, message: 'Valid user and run ID are required' });
        }
        const run = await BulkAutoApplyService.getRunForUser(req.params.runId, userId);
        if (!run) return res.status(404).json({ success: false, message: 'Bulk auto-apply run not found' });
        return res.json({ success: true, data: run });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch bulk auto-apply run';
        console.error('Bulk auto-apply run fetch failed:', sanitizeForLog(error));
        return res.status(500).json({ success: false, message });
    }
});

router.post('/auto-apply/runs/:runId/cancel', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        if (!userId || !Types.ObjectId.isValid(String(userId)) || !Types.ObjectId.isValid(req.params.runId)) {
            return res.status(400).json({ success: false, message: 'Valid user and run ID are required' });
        }
        const run = await BulkAutoApplyService.cancelRun(req.params.runId, userId);
        if (!run) return res.status(404).json({ success: false, message: 'Bulk auto-apply run not found' });
        return res.json({ success: true, data: run });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel bulk auto-apply run';
        console.error('Bulk auto-apply cancel failed:', sanitizeForLog(error));
        return res.status(500).json({ success: false, message });
    }
});

router.post('/:jobId/auto-apply', authMiddleware, async (req: any, res: any) => {
    try {
        if (!Types.ObjectId.isValid(req.params.jobId)) {
            return res.status(400).json({ success: false, message: 'Invalid job ID' });
        }
        const userId = req.user?._id || req.user?.userId;
        if (!userId || !Types.ObjectId.isValid(String(userId))) {
            return res.status(401).json({ success: false, message: 'Authenticated user is required' });
        }
        let score = Number(req.body.score ?? req.body.matchScore);
        if (!Number.isFinite(score)) {
            const job = await Job.findById(req.params.jobId)
                .select('+featureVector +applyUrl title companyName description requiredSkills canonicalSkills requirements minExperience maxExperience experienceLevel seniority locations location workMode remoteType salary salaryBand atsPlatform atsJobId applyUrl applicationDeadline postedAt source sourceProvider sourceCompanySlug sourceExternalId')
                .lean();
            if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
            const [annotatedJob] = await JobMatchingRagService.annotateJobsForUser(userId, [job]);
            score = Number(annotatedJob?.score ?? (Number(annotatedJob?.matchScore) / 100));
            if (!Number.isFinite(score)) score = 0;
        }
        const result = await AutoApplyService.handleMatchedJob(userId, req.params.jobId, score);
        return res.status(result.action === 'submitted' ? 201 : 202).json({ success: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Auto-apply failed';
        console.error('Auto-apply failed:', sanitizeForLog(error));
        const status = /not found/i.test(message)
            ? 404
            : /complete your profile|missing|not implemented|required/i.test(message)
                ? 400
                : 500;
        return res.status(status).json({ success: false, message });
    }
});

router.post('/:jobId/interactions', authMiddleware, async (req: any, res: any) => {
    try {
        const allowed = ['view', 'click', 'save', 'dismiss', 'apply', 'abandon'] as const;
        if (!Types.ObjectId.isValid(req.params.jobId) || !allowed.includes(req.body?.type)) {
            return res.status(400).json({ success: false, message: 'Invalid job interaction' });
        }
        await JobBehaviorService.record(
            new Types.ObjectId(req.user?._id || req.user?.userId),
            new Types.ObjectId(req.params.jobId),
            req.body.type,
            req.body.metadata
        );
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error recording job interaction:', error);
        return res.status(500).json({ success: false, message: 'Failed to record interaction' });
    }
});

router.post('/imports', authMiddleware, checkRecruiterAccess, importJob);

// Route to get jobs for authenticated recruiter
router.get('/recruiter-jobs', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first, then get jobs
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        const jobs = await Job.find({ recruiterId: recruiter._id })
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
            
        // Calculate applications count for each job
        const { Application } = require('../models/Application');
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicantsCount = await Application.countDocuments({ jobId: job._id });
            return {
                ...job.toJSON(),
                applicantsCount
            };
        }));
            
        res.status(200).json(jobsWithCounts);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Alias route for my-jobs (used by frontend)
router.get('/my-jobs', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first, then get jobs
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        const jobs = await Job.find({ recruiterId: recruiter._id })
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
            
        // Calculate applications count for each job
        const { Application } = require('../models/Application');
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicantsCount = await Application.countDocuments({ jobId: job._id });
            return {
                ...job.toJSON(),
                applicantsCount
            };
        }));
            
        res.status(200).json(jobsWithCounts);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to get job matching statistics
router.get('/:jobId/stats', getJobMatchingStats);

// Route to find matching students for a job
router.get('/:jobId/matches', findMatchingStudents);

// Route to create a new job
router.post('/', authMiddleware, checkRecruiterAccess, createJob);

// Route to publish job and trigger matching
router.post('/:jobId/publish', publishJob);

// Route to manually trigger job alerts
router.post('/:jobId/alerts', triggerJobAlerts);

// Route to send WhatsApp messages to selected students
router.post('/:jobId/whatsapp', authMiddleware, checkRecruiterAccess, sendWhatsAppToStudents);

// Route to get WhatsApp notification history
router.get('/:jobId/notifications', authMiddleware, getJobNotificationHistory);

// Invitation routes for jobs
router.post('/:jobId/invitations', authMiddleware, checkRecruiterAccess, createJobInvitations);
router.get('/:jobId/invitations', authMiddleware, checkRecruiterAccess, getJobInvitations);

// Route to update a job
router.put('/:jobId', updateJob);

// Route to delete a job
router.delete('/:jobId', deleteJob);

// Job Application Routes (with AI Resume Matching)

// Route for students to apply for a job with AI analysis
router.post('/:jobId/apply', authMiddleware, applyForJob);

// Route for students to analyze resume without applying
router.post('/:jobId/analyze-resume', authMiddleware, analyzeResumeOnly);

// Route for students to get resume improvement suggestions
router.post('/:jobId/improve-resume', authMiddleware, getResumeImprovementSuggestions);

// Route for recruiters to get all applications for a job (sorted by match score)
router.get('/:jobId/applications', authMiddleware, getJobApplications);

// Route to get resume analysis for current authenticated user and specific job (must come before parameterized route)
router.get('/:jobId/resume-analysis/current', authMiddleware, getCurrentUserResumeAnalysis);

// Route to get detailed resume analysis for a specific student-job combination
router.get('/:jobId/resume-analysis/:studentId', authMiddleware, getResumeAnalysis);

// ==== NEW ENDPOINTS FOR UI SCREENS ====

// Get job recommendations for a specific student
router.get('/recommendations/:studentId', authMiddleware, async (req: any, res: any) => {
    try {
        const { studentId } = req.params;
        const limit = parseInt(req.query.limit as string) || 8;
        
        const { Student } = require('../models/Student');
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Build match criteria based on student profile
        const matchCriteria: any = {
            status: 'active'
        };

        // Add location preference matching
        if (student.locationPreferences && student.locationPreferences.length > 0) {
            matchCriteria.location = { $in: student.locationPreferences };
        }

        // Find matching jobs
        const jobs = await Job.find(matchCriteria)
            .populate('recruiterId', 'name companyName')
            .populate('collegeId', 'name')
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: jobs,
            count: jobs.length
        });
    } catch (error) {
        console.error('Error fetching job recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch job recommendations' });
    }
});

// Get trending/popular jobs
router.get('/trending', authMiddleware, async (req: any, res: any) => {
    try {
        const limit = parseInt(req.query.limit as string) || 8;
        
        // Get jobs with most applications as trending
        const { Application } = require('../models/Application');
        const jobApplicationCounts = await Application.aggregate([
            {
                $group: {
                    _id: '$jobId',
                    applicationCount: { $sum: 1 }
                }
            },
            {
                $sort: { applicationCount: -1 }
            },
            {
                $limit: limit
            }
        ]);

        const jobIds = jobApplicationCounts.map((item: any) => item._id);
        
        // Find trending jobs by application count
        const trendingJobs = await Job.find({
            _id: { $in: jobIds },
            status: 'active'
        })
        .populate('recruiterId', 'name companyName')
        .populate('collegeId', 'name');

        res.json({
            success: true,
            data: trendingJobs,
            count: trendingJobs.length
        });
    } catch (error) {
        console.error('Error fetching trending jobs:', error);
        res.status(500).json({ message: 'Failed to fetch trending jobs' });
    }
});

// Keep the single-job lookup after every named route so names such as
// "trending", "matches", and "recommendations" are never treated as IDs.
router.get('/:jobId', getJobById);

export default router;
