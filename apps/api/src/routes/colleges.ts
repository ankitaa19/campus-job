import express from 'express';
import multer from 'multer';
import {
    getColleges,
    getCollegeById,
    getCollegeByUserId,
    createCollege,
    updateCollege,
    updateCollegeByUserId,
    updateCollegeProfile,
    deleteCollege,
    manageRecruiterApproval,
    getCollegeStats,
    getCollegeProfile,
    getCollegeStudents,
    getCollegeJobs,
    getCollegePlacements,
    getCollegeEvents,
    searchColleges,
    resubmitCollege,
    getCollegeConnections,
    uploadCollegeLogo,
    uploadCollegeBanner,
    uploadCollegeGalleryImage,
    getCollegeGallery,
    deleteCollegeGalleryImage,
    getCollegeFacilities,
    addCollegeFacility,
    updateCollegeFacility,
    updateCollegeFacilities,
    deleteCollegeFacility,
    updateCampusDescription,
    getCollegeAchievements,
    addCollegeAchievement,
    updateCollegeAchievement,
    deleteCollegeAchievement,
    uploadAchievementPhoto,
    getCollegeAlumni,
    addCollegeAlumni,
    updateCollegeAlumni,
    deleteCollegeAlumni,
    uploadAlumniImage,
    getCollegeVirtualTours,
    addCollegeVirtualTour,
    updateCollegeVirtualTour,
    deleteCollegeVirtualTour,
    togglePreviewVideo,
    uploadVirtualTourVideo,
    cleanupVirtualTours,
    uploadCollegeBrochure,
    deleteCollegeBrochure
} from '../controllers/colleges';
import { getStudentsByCollege } from '../controllers/students';
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

// Configure multer for video uploads
const videoUpload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Allow various video formats
    const allowedVideoTypes = [
      'video/mp4',
      'video/avi', 
      'video/mov',
      'video/quicktime', // for .mov files
      'video/wmv',
      'video/x-ms-wmv', // alternative MIME for WMV
      'video/x-flv',
      'video/webm',
      'video/x-matroska', // for .mkv files
      'video/3gpp', // for .3gp files
      'video/x-m4v', // for .m4v files
      'video/mpeg',
      'video/mp2t', // for .ts files
      'video/x-msvideo' // alternative MIME for AVI
    ];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V, MPG, MPEG'));
    }
  }
});

const router = express.Router();

// College Dashboard Routes (authenticated)
router.get('/profile', authMiddleware, getCollegeProfile);
router.put('/profile', authMiddleware, updateCollegeProfile);
router.get('/stats', authMiddleware, getCollegeStats);
router.get('/students', authMiddleware, getCollegeStudents);

// File upload routes
router.post('/upload-logo', authMiddleware, upload.single('logo'), uploadCollegeLogo);
router.post('/upload-banner', authMiddleware, upload.single('banner'), uploadCollegeBanner);
router.post('/upload/achievement-photo', authMiddleware, upload.single('file'), uploadAchievementPhoto);

// Gallery routes
router.post('/upload-gallery-image', authMiddleware, upload.single('image'), uploadCollegeGalleryImage);
router.get('/gallery', authMiddleware, getCollegeGallery);
router.delete('/gallery-image', authMiddleware, deleteCollegeGalleryImage);

// Facilities routes
router.get('/facilities', authMiddleware, getCollegeFacilities);
router.put('/facilities', authMiddleware, updateCollegeFacilities);
router.post('/facilities', authMiddleware, addCollegeFacility);
router.put('/facilities/:facilityId', authMiddleware, updateCollegeFacility);
router.delete('/facilities/:facilityId', authMiddleware, deleteCollegeFacility);
router.put('/campus-description', authMiddleware, updateCampusDescription);

// Achievement routes
router.get('/achievements', authMiddleware, getCollegeAchievements);
router.post('/achievements', authMiddleware, addCollegeAchievement);
router.put('/achievements/:achievementId', authMiddleware, updateCollegeAchievement);
router.delete('/achievements/:achievementId', authMiddleware, deleteCollegeAchievement);

// Alumni routes
router.get('/alumni', authMiddleware, getCollegeAlumni);
router.post('/alumni', authMiddleware, addCollegeAlumni);
router.put('/alumni/:alumniId', authMiddleware, updateCollegeAlumni);
router.delete('/alumni/:alumniId', authMiddleware, deleteCollegeAlumni);
router.post('/upload-alumni-image', authMiddleware, upload.single('image'), uploadAlumniImage);

// Virtual Tour routes
router.get('/virtual-tours', authMiddleware, getCollegeVirtualTours);
router.post('/virtual-tours', authMiddleware, addCollegeVirtualTour);
router.put('/virtual-tours/:tourId', authMiddleware, updateCollegeVirtualTour);
router.delete('/virtual-tours/:tourId', authMiddleware, deleteCollegeVirtualTour);
router.put('/virtual-tours/:tourId/toggle-preview', authMiddleware, togglePreviewVideo);
router.post('/upload-virtual-tour-video', authMiddleware, videoUpload.single('video'), uploadVirtualTourVideo);
router.post('/cleanup-virtual-tours', authMiddleware, cleanupVirtualTours);

// Brochure routes
router.post('/upload-brochure', authMiddleware, upload.single('brochure'), uploadCollegeBrochure);
router.delete('/delete-brochure', authMiddleware, deleteCollegeBrochure);

router.get('/jobs', authMiddleware, getCollegeJobs);
router.get('/placements', authMiddleware, getCollegePlacements);
router.get('/events', authMiddleware, getCollegeEvents);

// Import invitation functions
import { getCollegeInvitations, acceptInvitation, declineInvitation, proposeCounterDates } from '../controllers/invitations';

// Add invitation routes for college dashboard
router.get('/invitations', authMiddleware, getCollegeInvitations);
router.post('/invitations/:invitationId/accept', authMiddleware, acceptInvitation);
router.post('/invitations/:invitationId/decline', authMiddleware, declineInvitation);
router.post('/invitations/:invitationId/counter', authMiddleware, proposeCounterDates);

// Search colleges
router.get('/search', searchColleges);

// Get public colleges list (for connections)
router.get('/public', getColleges);

// Get college statistics
router.get('/:id/stats', authMiddleware, getCollegeStats);

// Get all colleges
router.get('/', getColleges);

// Get college by user ID
router.get('/user/:userId', getCollegeByUserId);

// Get college profile by ID (public route)
router.get('/:id/profile', getCollegeById);

// Get college by ID
router.get('/:id', getCollegeById);

// Get college connections
router.get('/:collegeId/connections', getCollegeConnections);

// Create new college
router.post('/', createCollege);

// Manage recruiter approval/rejection
router.patch('/:collegeId/recruiters/:recruiterId', manageRecruiterApproval);

// Update college by user ID
router.put('/user/:userId', updateCollegeByUserId);

// Update college
router.put('/:id', updateCollege);

// Resubmit college application
router.post('/resubmit', authMiddleware, upload.array('supportingDocuments', 10), resubmitCollege);

// Delete college
router.delete('/:id', deleteCollege);


router.get('/', getStudentsByCollege);

export default router;
