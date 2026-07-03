import express from 'express';
import multer from 'multer';
import {
    createRecruiter,
    getAllRecruiters,
    getRecruiterById,
    getRecruiterByUserId,
    getRecruiterProfile,
    getRecruiterStats,
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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for supporting documents
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

const router = express.Router();

// Authenticated recruiter routes
router.get('/profile', authMiddleware, getRecruiterProfile);
router.get('/stats', authMiddleware, getRecruiterStats);

// Search recruiters
router.get('/search', searchRecruiters);

// Get approved recruiters only
router.get('/approved', getAllRecruiters);

// Get public recruiters/companies list (for connections)
router.get('/public', getAllRecruiters);

// Get recruiters by industry
router.get('/industry/:industry', getRecruitersByIndustry);

// Get all recruiters
router.get('/', getAllRecruiters);

// Get recruiter by user ID
router.get('/user/:userId', getRecruiterByUserId);

// Get recruiter profile by ID (public route)
router.get('/:id/profile', getRecruiterById);

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
router.post('/resubmit', authMiddleware, upload.array('supportingDocuments', 10), resubmitRecruiter);

// Update recruiter by user ID
router.put('/user/:userId', updateRecruiterByUserId);

// Update recruiter
router.put('/:id', updateRecruiter);

// Delete recruiter
router.delete('/:id', deleteRecruiter);

// Route to get recruiter stats
router.get("/stats", authMiddleware, async (req: any, res: any) => {
    try {
        const recruiterId = req.user?.id;
        if (!recruiterId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
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
