import express from 'express';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { Student } from '../models/Student';
import { User } from '../models/User';
import authMiddleware from '../middleware/auth';
import { checkRecruiterAccess } from '../middleware/entityAccess';
import { sendApplicationStatusNotification } from '../services/notifications';
import ApplicationSubmissionService from '../services/application-submission';

const router = express.Router();

router.get('/', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        const statusParam = String(req.query.status || '').trim();
        const query: any = { userId };
        if (statusParam) query.status = { $in: statusParam.split(',').map(status => status.trim()).filter(Boolean) };
        const applications = await Application.find(query)
            .populate('jobId', 'title companyName location locations workMode salary atsPlatform description requiredSkills jobType experienceLevel totalPositions')
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: applications });
    } catch (error) {
        console.error('Error fetching applications:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch applications' });
    }
});

router.patch('/auto-apply-settings', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        const updates: any = {};
        if (req.body.autoApplyThreshold !== undefined) {
            const threshold = Number(req.body.autoApplyThreshold);
            if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
                return res.status(400).json({ success: false, message: 'autoApplyThreshold must be between 0 and 1' });
            }
            updates.autoApplyThreshold = threshold;
        }
        if (req.body.requireReview !== undefined) updates.requireReview = Boolean(req.body.requireReview);
        const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('autoApplyThreshold requireReview');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error updating auto-apply settings:', error);
        return res.status(500).json({ success: false, message: 'Failed to update auto-apply settings' });
    }
});

router.get('/pending-review', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        const applications = await Application.find({ userId, status: 'pending_review' })
            .populate('jobId', 'title companyName location remoteType salaryBand atsPlatform')
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: applications });
    } catch (error) {
        console.error('Error fetching pending review applications:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch pending review applications' });
    }
});

router.post('/:applicationId/approve', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id || req.user?.userId;
        const application = await ApplicationSubmissionService.approveApplication(req.params.applicationId, userId);
        return res.json({ success: true, data: application });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to approve application';
        const status = /not found/i.test(message) ? 404 : /belong|pending review/i.test(message) ? 400 : 500;
        console.error('Error approving application:', error);
        return res.status(status).json({ success: false, message });
    }
});

// Route to get all applications for a recruiter across all their jobs
router.get('/my-applications', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first, then get applications
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        // Get all applications for this recruiter
        const applications = await Application.find({ recruiterId: recruiter._id })
            .populate('studentId', 'firstName lastName email phoneNumber')
            .populate('jobId', 'title companyName location')
            .sort({ appliedAt: -1 });
            
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching recruiter applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to update application status
router.patch('/:applicationId/status', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const userId = req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        // Find the application and verify it belongs to this recruiter
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        if (!application.recruiterId || application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        application.currentStatus = status;
        application.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy: userId,
            notes: `Status updated to ${status}`
        });
        await application.save();

        try {
            const studentRecord = await Student.findById(application.studentId).populate('userId', '_id');
            const job = await Job.findById(application.jobId).select('title').lean();
            const studentUser = studentRecord?.userId as any;

            if (!studentUser?._id) {
                throw new Error('Student user profile not found');
            }

            await sendApplicationStatusNotification(
                String(studentUser._id),
                String(application._id),
                status,
                job?.title,
                String(application.jobId)
            );
        } catch (notificationError) {
            console.error('Error creating application status notification:', notificationError);
        }
        
        res.status(200).json(application);
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to delete application (reject and delete)
router.delete('/:applicationId', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const { applicationId } = req.params;
        const userId = req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        // Find the application and verify it belongs to this recruiter
        const application = await Application.findById(applicationId)
            .populate('studentId', 'email firstName lastName')
            .populate('jobId', 'title companyName');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        if (!application.recruiterId || application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Delete the application
        await Application.findByIdAndDelete(applicationId);

        try {
            const studentRecord = await Student.findById(application.studentId).populate('userId', '_id');
            const studentUser = studentRecord?.userId as any;

            if (!studentUser?._id) {
                throw new Error('Student user profile not found');
            }

            await sendApplicationStatusNotification(
                String(studentUser._id),
                String(application._id),
                'rejected',
                (application.jobId as any)?.title,
                String(application.jobId)
            );
        } catch (notificationError) {
            console.error('Error sending rejection notification:', notificationError);
        }
        
        res.status(200).json({ message: 'Application rejected and deleted successfully' });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
