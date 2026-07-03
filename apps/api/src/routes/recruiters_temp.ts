import express from 'express';
import {
    createRecruiter,
    getAllRecruiters,
    getRecruiterById,
    getRecruiterByUserId,
    updateRecruiter,
    updateRecruiterByUserId,
    deleteRecruiter,
    getRecruitersByIndustry,
    searchRecruiters,
    verifyRecruiter,
    requestCollegeApproval,
    notifyStudents,
    resubmitRecruiter
} from '../controllers/recruiters';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Search recruiters
router.get('/search', searchRecruiters);

// Get recruiters by industry
router.get('/industry/:industry', getRecruitersByIndustry);

// Get all recruiters
router.get('/', getAllRecruiters);

// Get recruiter by user ID
router.get('/user/:userId', getRecruiterByUserId);

// Get recruiter by ID
router.get('/:id', getRecruiterById);

// Create new recruiter
router.post('/', createRecruiter);

// Verify/approve recruiter
router.patch('/:id/verify', verifyRecruiter);

// Request college approval
router.post('/:recruiterId/request-approval', requestCollegeApproval);

// Notify students about job
router.post('/notify-students', notifyStudents);

// Resubmit recruiter application
router.post('/resubmit', authMiddleware, resubmitRecruiter);

// Update recruiter by user ID
router.put('/user/:userId', updateRecruiterByUserId);

// Update recruiter
router.put('/:id', updateRecruiter);

// Delete recruiter
router.delete('/:id', deleteRecruiter);

// Route to get recruiter stats
router.get('/:id/stats', async (req, res) => {
    try {
        // Return mock stats for now - this endpoint needs to be implemented
        // based on your requirements
        const stats = {
            totalJobs: 0,
            activeJobs: 0,
            totalApplications: 0,
            newApplications: 0,
            totalInterviews: 0,
            upcomingInterviews: 0
        };
        
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching recruiter stats:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
