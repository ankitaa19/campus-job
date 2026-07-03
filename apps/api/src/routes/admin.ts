import {
    getPendingApprovals,
    approveCollege,
    rejectCollege,
    reverifyCollege,
    approveRecruiter,
    rejectRecruiter,
    reverifyRecruiter,
    getDashboardStats,
    getCollegeDetails,
    getRecruiterDetails,
    getAdminProfile,
    handleDocumentUpload,
    getAllColleges,
    getAllRecruiters,
    deactivateCollege,
    activateCollege,
    reactivateCollege,
    deactivateRecruiter,
    activateRecruiter,
    reactivateRecruiter,
    suspendCollege,
    suspendRecruiter,
    sendMessageToCollege,
    sendMessageToRecruiter,
    sendBroadcastToColleges,
    sendBroadcastToRecruiters
} from '../controllers/admin';
import express from 'express';
import authMiddleware from '../middleware/auth';
import { adminMiddleware, checkPermission } from '../middleware/adminAuth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard statistics
router.get('/dashboard/stats', checkPermission('view_analytics'), getDashboardStats);

// Get pending approvals
router.get('/pending-approvals', getPendingApprovals);

// Get all entities
router.get('/colleges', getAllColleges);
router.get('/recruiters', getAllRecruiters);

// College approval routes
router.get('/colleges/:collegeId', getCollegeDetails);
router.post('/colleges/:collegeId/approve', checkPermission('approve_colleges'), approveCollege);
router.post('/colleges/:collegeId/reject', checkPermission('approve_colleges'), rejectCollege);
router.post('/colleges/:collegeId/reverify', checkPermission('approve_colleges'), reverifyCollege);
router.post('/colleges/:collegeId/deactivate', checkPermission('manage_users'), deactivateCollege);
router.post('/colleges/:collegeId/activate', checkPermission('manage_users'), activateCollege);
router.post('/colleges/:collegeId/reactivate', checkPermission('manage_users'), reactivateCollege);
router.post('/colleges/:collegeId/suspend', checkPermission('manage_users'), suspendCollege);

// Recruiter approval routes
router.get('/recruiters/:recruiterId', getRecruiterDetails);
router.post('/recruiters/:recruiterId/approve', checkPermission('approve_recruiters'), approveRecruiter);
router.post('/recruiters/:recruiterId/reject', checkPermission('approve_recruiters'), rejectRecruiter);
router.post('/recruiters/:recruiterId/reverify', checkPermission('approve_recruiters'), reverifyRecruiter);
router.post('/recruiters/:recruiterId/deactivate', checkPermission('manage_users'), deactivateRecruiter);
router.post('/recruiters/:recruiterId/activate', checkPermission('manage_users'), activateRecruiter);
router.post('/recruiters/:recruiterId/reactivate', checkPermission('manage_users'), reactivateRecruiter);
router.post('/recruiters/:recruiterId/suspend', checkPermission('manage_users'), suspendRecruiter);

// Admin profile
router.get('/profile/:userId', getAdminProfile);

// Document upload for resubmission
router.post('/documents/:entityType/:entityId', handleDocumentUpload);

// Messaging routes
router.post('/colleges/:collegeId/message', checkPermission('send_messages'), sendMessageToCollege);
router.post('/recruiters/:recruiterId/message', checkPermission('send_messages'), sendMessageToRecruiter);
router.post('/broadcast/colleges', checkPermission('send_broadcasts'), sendBroadcastToColleges);
router.post('/broadcast/recruiters', checkPermission('send_broadcasts'), sendBroadcastToRecruiters);

export default router;
