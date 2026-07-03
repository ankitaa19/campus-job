import express from 'express';
import { 
    getAllJobs, 
    getJobById, 
    createJob, 
    updateJob, 
    deleteJob,
    publishJob,
    getJobMatchingStats,
    findMatchingStudents,
    triggerJobAlerts,
    sendWhatsAppToStudents,
    getJobNotificationHistory
} from '../controllers/jobs';
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

const router = express.Router();

// Route to get all jobs
router.get('/', getAllJobs);

// Route to get public jobs (no auth required) - used by /jobs public page and student dashboard
router.get('/public', async (req: any, res: any) => {
    try {
        const jobs = await Job.find({ 
            isPublic: true,
            status: 'active'
        })
        .populate('recruiterId', 'companyInfo.name')
        .sort({ postedAt: -1 });
        
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching public jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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

// Route to get job by ID
router.get('/:jobId', getJobById);

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

// Get job matches with query parameters
router.get('/matches', authMiddleware, async (req: any, res: any) => {
    try {
        const { studentId, limit = 8 } = req.query;
        
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const { Student } = require('../models/Student');
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Build match criteria
        const matchCriteria: any = {
            status: 'active'
        };

        // Match by skills if available
        if (student.skills && student.skills.length > 0) {
            matchCriteria.requiredSkills = { $in: student.skills };
        }

        const jobs = await Job.find(matchCriteria)
            .populate('recruiterId', 'name companyName')
            .populate('collegeId', 'name')
            .limit(parseInt(limit as string))
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: jobs,
            matches: jobs // For compatibility with frontend
        });
    } catch (error) {
        console.error('Error fetching job matches:', error);
        res.status(500).json({ message: 'Failed to fetch job matches' });
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

export default router;
