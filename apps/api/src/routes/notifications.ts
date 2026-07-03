import express from 'express';
import { Notification } from '../models/Notification';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Get user notifications (alias for my-notifications)
router.get('/', authMiddleware, async (req: any, res: any) => {
    try {
        const user = req.user;
        const notifications = await Notification.find({ 
            recipientId: user._id 
        })
        .sort({ createdAt: -1 })
        .limit(50);
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Send notification
router.post('/send', authMiddleware, async (req: any, res: any) => {
    try {
        const { type, applicationId, message, studentId } = req.body;
        const user = req.user;
        
        let targetUserId = studentId;
        
        // If applicationId is provided, find the student from the application
        if (applicationId && !targetUserId) {
            const { Application } = require('../models/Application');
            const application = await Application.findById(applicationId).populate('studentId');
            if (application && application.studentId) {
                targetUserId = application.studentId._id;
            }
        }
        
        if (!targetUserId) {
            return res.status(400).json({ message: 'Target user not found' });
        }
        
        const notification = await Notification.create({
            userId: targetUserId,
            type: type || 'general',
            title: getNotificationTitle(type),
            message: message || 'You have a new notification',
            data: {
                applicationId,
                senderId: user._id,
                senderRole: user.role
            },
            createdAt: new Date()
        });
        
        res.status(201).json({ message: 'Notification sent successfully', notification });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user notifications
router.get('/my-notifications', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user._id;
        
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', authMiddleware, async (req: any, res: any) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.status(200).json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

function getNotificationTitle(type: string): string {
    switch (type) {
        case 'job_selection':
        case 'application_accepted':
            return 'Application Accepted!';
        case 'application_rejected':
            return 'Application Status Update';
        case 'interview_scheduled':
            return 'Interview Scheduled';
        case 'job_match':
            return 'New Job Match Found';
        default:
            return 'Notification';
    }
}

// ==== NEW ENDPOINTS FOR UI SCREENS ====

// Mark notification as read
router.patch('/:notificationId/read', authMiddleware, async (req: any, res: any) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { 
                _id: notificationId, 
                userId: userId 
            },
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { 
                userId: userId,
                isRead: false
            },
            { 
                isRead: true, 
                readAt: new Date() 
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user._id;
        
        const count = await Notification.countDocuments({
            userId: userId,
            isRead: false
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notification
router.delete('/:notificationId', authMiddleware, async (req: any, res: any) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId: userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
