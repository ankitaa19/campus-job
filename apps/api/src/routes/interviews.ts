import express from 'express';
import { InterviewSlot } from '../models/InterviewSlot';
import { Application } from '../models/Application';
import { Notification } from '../models/Notification';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Get student's interview assignments
router.get('/student/assignments', authMiddleware, async (req: any, res: any) => {
    try {
        const user = req.user;
        
        // Find student
        const { Student } = require('../models/Student');
        const student = await Student.findOne({ userId: user._id });
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }
        
        // Find interview assignments for this student
        const interviews = await InterviewSlot.find({ studentId: student._id })
            .populate('jobId', 'title companyName')
            .populate('recruiterId', 'companyInfo')
            .populate('applicationId')
            .sort({ createdAt: -1 });
        
        // Format for frontend
        const formattedInterviews = interviews.map(interview => ({
            _id: interview._id,
            jobTitle: (interview.jobId as any)?.title || 'Unknown Job',
            companyName: (interview.jobId as any)?.companyName || (interview.recruiterId as any)?.companyInfo?.name || 'Unknown Company',
            interviewDate: interview.scheduledDate || new Date(),
            interviewTime: interview.startTime || '10:00 AM',
            status: interview.status,
            type: interview.mode || 'virtual',
            duration: interview.duration || 30,
            meetingLink: interview.virtualMeetingDetails?.meetingId,
            location: interview.location?.venue,
            studentEmail: user.email
        }));
        
        res.json(formattedInterviews);
    } catch (error) {
        console.error('Error fetching student interviews:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Create interview from application
router.post('/create-from-application', authMiddleware, async (req: any, res: any) => {
    try {
        const { applicationId } = req.body;
        const user = req.user;
        
        // Find the application
        const application = await Application.findById(applicationId)
            .populate('studentId', 'firstName lastName email')
            .populate('jobId', 'title companyName');
            
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        // Find recruiter
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        // Verify ownership
        if (application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Create interview slot
        const interview = await InterviewSlot.create({
            jobId: application.jobId._id,
            recruiterId: recruiter._id,
            studentId: application.studentId._id,
            applicationId: application._id,
            status: 'scheduled',
            type: 'initial_screening',
            duration: 30,
            isActive: true,
            createdAt: new Date()
        });
        
        // Send notification to student
        await Notification.create({
            userId: application.studentId._id,
            type: 'interview_scheduled',
            title: 'Interview Scheduled',
            message: `An interview has been scheduled for your application to ${(application.jobId as any)?.title || 'the position'}.`,
            data: {
                applicationId: application._id,
                interviewId: interview._id,
                jobTitle: (application.jobId as any)?.title || 'Unknown Job'
            },
            createdAt: new Date()
        });
        
        res.status(201).json({ 
            message: 'Interview created successfully',
            interview 
        });
    } catch (error) {
        console.error('Error creating interview from application:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get interviews for recruiter
router.get('/my-interviews', authMiddleware, async (req: any, res: any) => {
    try {
        const user = req.user;
        
        // Find recruiter
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        const interviews = await InterviewSlot.find({ recruiterId: recruiter._id })
            .populate('studentId', 'firstName lastName email')
            .populate('jobId', 'title companyName')
            .sort({ createdAt: -1 });
            
        res.status(200).json(interviews);
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
