import express from 'express';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import authMiddleware from '../middleware/auth';
import { checkRecruiterAccess } from '../middleware/entityAccess';

const router = express.Router();

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
        
        if (application.recruiterId.toString() !== recruiter._id.toString()) {
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
        
        if (application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Send notification to student before deleting
        try {
            const { Notification } = require('../models/Notification');
            await Notification.create({
                userId: application.studentId._id,
                type: 'application_rejected',
                title: 'Application Status Update',
                message: `Your application has been rejected and removed from our system.`,
                data: {
                    applicationId: application._id,
                    jobTitle: (application.jobId as any)?.title || 'Unknown Job'
                },
                createdAt: new Date()
            });
        } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // Continue with deletion even if notification fails
        }
        
        // Delete the application
        await Application.findByIdAndDelete(applicationId);
        
        res.status(200).json({ message: 'Application rejected and deleted successfully' });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
