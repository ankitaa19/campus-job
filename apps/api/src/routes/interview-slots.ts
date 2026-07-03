import express from 'express';
import {
  createInterviewSlots,
  publishInterviewSlot,
  getJobInterviewSlots,
  confirmAttendance,
  markAttendance,
  getUpcomingInterviewSlots
} from '../controllers/interview-slots';
import authMiddleware from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Create interview slots for a job (Recruiters only)
router.post(
  '/jobs/:jobId/interview-slots',
  authMiddleware,
  roleMiddleware(['recruiter']),
  createInterviewSlots
);

// Publish interview slot and trigger auto-assignment (Recruiters only)
router.post(
  '/interview-slots/:slotId/publish',
  authMiddleware,
  roleMiddleware(['recruiter']),
  publishInterviewSlot
);

// Get all interview slots for a job
router.get(
  '/jobs/:jobId/interview-slots',
  authMiddleware,
  getJobInterviewSlots
);

// Confirm attendance for interview slot (Students)
router.post(
  '/interview-slots/:slotId/confirm/:studentId',
  authMiddleware,
  roleMiddleware(['student']),
  confirmAttendance
);

// Mark candidate attendance (Recruiters/HR)
router.post(
  '/interview-slots/:slotId/attendance/:studentId',
  authMiddleware,
  roleMiddleware(['recruiter', 'admin']),
  markAttendance
);

// Get upcoming interview slots for reminders
router.get(
  '/interview-slots/upcoming',
  authMiddleware,
  getUpcomingInterviewSlots
);

// Get interview assignments for a student
router.get(
  '/student/assignments',
  authMiddleware,
  roleMiddleware(['student']),
  async (req: any, res: any) => {
    try {
      const studentId = req.user?.studentId || req.user?.id;
      if (!studentId) {
        return res.status(401).json({ message: 'Student not found' });
      }
      
      // For now, return empty array as this feature is being developed
      res.status(200).json([]);
    } catch (error) {
      console.error('Error fetching student interview assignments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Route to get interviews for authenticated recruiter
router.get("/my-interviews", authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Find recruiter first
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        // Get applications with interviews scheduled for this recruiter
        const { Application } = require('../models/Application');
        
        const applications = await Application.find({ 
            recruiterId: recruiter._id, 
            currentStatus: { $in: ['interview_scheduled', 'interview_completed'] }
        })
        .populate('studentId', 'firstName lastName email phoneNumber')
        .populate('jobId', 'title companyName')
        .sort({ 'interviews.0.scheduledAt': 1 });
        
        // Transform to interview format
        const interviews = applications.flatMap((app: any) => 
            app.interviews?.map((interview: any) => ({
                _id: interview._id || new (require('mongoose')).Types.ObjectId(),
                jobId: app.jobId._id,
                jobTitle: app.jobId.title,
                applicationId: app._id,
                studentId: app.studentId._id,
                studentName: `${app.studentId.firstName} ${app.studentId.lastName}`,
                studentEmail: app.studentId.email,
                interviewDate: interview.scheduledAt,
                interviewTime: interview.scheduledAt,
                duration: interview.duration || 60,
                type: interview.mode === 'online' ? 'online' : 'offline',
                meetingLink: interview.meetingLink,
                location: interview.location,
                status: interview.status,
                feedback: interview.feedback,
                interviewerName: interview.interviewers?.join(', ') || '',
                round: 1,
                notes: interview.feedback
            })) || []
        );
        
        res.status(200).json(interviews);
    } catch (error) {
        console.error('Error fetching recruiter interviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
