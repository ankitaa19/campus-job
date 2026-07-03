import { Request, Response } from 'express';
import { InterviewSlot } from '../models/InterviewSlot';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { Student } from '../models/Student';
import { Invitation } from '../models/Invitation';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

/**
 * Create interview slots for a job
 * POST /api/jobs/:jobId/interview-slots
 */
export const createInterviewSlots = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const {
      title,
      description,
      scheduledDate,
      startTime,
      endTime,
      duration,
      totalCapacity,
      mode,
      location,
      virtualMeetingDetails,
      eligibilityCriteria,
      autoAssignmentSettings,
      interviewers,
      candidateInstructions
    } = req.body;
    
    const user = req.user as any;
    const recruiterId = user.recruiterId || user._id;
    
    // Validate job exists and belongs to recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create interview slots for this job'
      });
    }
    
    // Check if job has accepted invitations
    const acceptedInvitations = await Invitation.find({
      jobId: new Types.ObjectId(jobId),
      status: 'accepted',
      isActive: true
    });
    
    if (acceptedInvitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create interview slots. No colleges have accepted invitations yet.'
      });
    }
    
    // Create interview slots for each college
    const createdSlots = [];
    
    for (const invitation of acceptedInvitations) {
      const interviewSlot = new InterviewSlot({
        jobId: new Types.ObjectId(jobId),
        recruiterId: new Types.ObjectId(recruiterId),
        collegeId: invitation.collegeId,
        title,
        description,
        scheduledDate: new Date(scheduledDate),
        startTime,
        endTime,
        duration,
        totalCapacity,
        availableSlots: totalCapacity,
        assignedCandidates: [],
        waitlistCandidates: [],
        mode,
        location,
        virtualMeetingDetails,
        eligibilityCriteria,
        autoAssignmentSettings,
        status: 'draft',
        interviewers,
        candidateInstructions,
        notifications: [],
        createdBy: new Types.ObjectId(user._id),
        lastModifiedBy: new Types.ObjectId(user._id),
        isActive: true
      });
      
      const savedSlot = await interviewSlot.save();
      createdSlots.push(savedSlot);
    }
    
    res.status(201).json({
      success: true,
      message: `${createdSlots.length} interview slots created successfully`,
      data: {
        slots: createdSlots.map(slot => ({
          id: slot._id,
          collegeId: slot.collegeId,
          scheduledDate: slot.scheduledDate,
          totalCapacity: slot.totalCapacity,
          status: slot.status
        }))
      }
    });
    
  } catch (error) {
    console.error('Error creating interview slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create interview slots',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Publish interview slots and trigger auto-assignment
 * POST /api/interview-slots/:slotId/publish
 */
export const publishInterviewSlot = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { minimumApplicants = 5 } = req.body;
    
    const user = req.user as any;
    
    const slot = await InterviewSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Interview slot not found'
      });
    }
    
    if (slot.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Interview slot cannot be published in current status'
      });
    }
    
    // Check minimum applicants requirement
    const applicantCount = await Application.countDocuments({
      jobId: slot.jobId,
      currentStatus: 'applied'
    });
    
    if (applicantCount < minimumApplicants) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${minimumApplicants} applicants required. Currently have ${applicantCount}.`
      });
    }
    
    // Update slot status
    slot.status = 'published';
    slot.publishedAt = new Date();
    slot.lastModifiedBy = new Types.ObjectId(user._id);
    
    await slot.save();
    
    // Trigger auto-assignment if enabled
    if (slot.autoAssignmentSettings.isEnabled) {
      await autoAssignCandidates(slot);
    }
    
    res.status(200).json({
      success: true,
      message: 'Interview slot published successfully',
      data: {
        slot: {
          id: slot._id,
          status: slot.status,
          publishedAt: slot.publishedAt,
          assignedCandidates: slot.assignedCandidates.length,
          waitlistCandidates: slot.waitlistCandidates.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error publishing interview slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish interview slot',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Auto-assign candidates to interview slots
 */
async function autoAssignCandidates(slot: any) {
  try {
    const { jobId, collegeId, totalCapacity, autoAssignmentSettings, eligibilityCriteria } = slot;
    
    // Get eligible applications
    const applications = await Application.find({
      jobId,
      currentStatus: 'applied'
    }).populate({
      path: 'studentId',
      match: {
        collegeId,
        graduationYear: eligibilityCriteria.graduationYear,
        ...(eligibilityCriteria.minCGPA && { 'academicInfo.cgpa': { $gte: eligibilityCriteria.minCGPA } })
      }
    });
    
    // Filter out null students (didn't match criteria)
    const eligibleApplications = applications.filter(app => app.studentId != null);
    
    // Sort based on assignment algorithm
    let sortedApplications = [];
    
    switch (autoAssignmentSettings.assignmentAlgorithm) {
      case 'score_based':
        sortedApplications = eligibleApplications
          .filter(app => !autoAssignmentSettings.minimumScore || 
                        (app.matchScore || 0) >= autoAssignmentSettings.minimumScore)
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        break;
        
      case 'first_come_first_serve':
        sortedApplications = eligibleApplications.sort((a, b) => 
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
        );
        break;
        
      case 'random':
        sortedApplications = eligibleApplications.sort(() => Math.random() - 0.5);
        break;
        
      default:
        sortedApplications = eligibleApplications;
    }
    
    // Assign top candidates
    const assignedCount = Math.min(totalCapacity, sortedApplications.length);
    const assigned: string[] = [];
    const waitlisted: string[] = [];
    
    for (let i = 0; i < sortedApplications.length; i++) {
      const application = sortedApplications[i];
      
      if (i < assignedCount) {
        try {
          // Manual assignment logic since method doesn't exist
          const timeSlot = `${Math.floor(i / 4) + 9}:${(i % 4) * 15}0-${Math.floor(i / 4) + 9}:${((i % 4) + 1) * 15}0`;
          
          slot.assignedCandidates.push({
            studentId: application.studentId._id,
            timeSlot,
            status: 'assigned',
            assignedAt: new Date()
          });
          
          slot.availableSlots -= 1;
          assigned.push(application.studentId._id.toString());
          
          // Update application status
          await Application.findByIdAndUpdate(application._id, {
            currentStatus: 'interview_scheduled',
            $push: {
              statusHistory: {
                status: 'interview_scheduled',
                updatedAt: new Date(),
                updatedBy: slot.createdBy,
                notes: 'Auto-assigned to interview slot'
              }
            }
          });
          
        } catch (error) {
          console.error('Error assigning candidate:', error);
        }
      } else {
        // Add to waitlist
        try {
          slot.waitlistCandidates.push({
            studentId: application.studentId._id,
            waitlistedAt: new Date(),
            position: waitlisted.length + 1
          });
          waitlisted.push(application.studentId._id.toString());
        } catch (error) {
          console.error('Error adding to waitlist:', error);
        }
      }
    }
    
    await slot.save();
    
    // Send notifications to assigned candidates
    await sendInterviewAssignmentNotifications(slot, assigned);
    
    console.log(`Auto-assignment completed: ${assigned.length} assigned, ${waitlisted.length} waitlisted`);
    
  } catch (error) {
    console.error('Error in auto-assignment:', error);
  }
}

/**
 * Send notifications to assigned candidates
 */
async function sendInterviewAssignmentNotifications(slot: any, assignedStudentIds: string[]) {
  try {
    const students = await Student.find({
      _id: { $in: assignedStudentIds }
    }).populate('userId', 'email phone whatsappNumber');
    
    const job = await Job.findById(slot.jobId);
    
    for (const student of students) {
      const assignedCandidate = slot.assignedCandidates.find(
        (c: any) => c.studentId.toString() === student._id.toString()
      );
      
      if (assignedCandidate && student.userId) {
        const notification = new Notification({
          recipientId: student.userId._id,
          senderId: slot.createdBy,
          title: `Interview Scheduled: ${job?.title}`,
          message: `You have been scheduled for an interview on ${slot.scheduledDate.toDateString()} at ${assignedCandidate.timeSlot}`,
          notificationType: 'interview_assigned',
          relatedJobId: slot.jobId,
          relatedEntityId: slot._id,
          priority: 'high',
          channels: ['email', 'whatsapp', 'push'],
          metadata: {
            jobTitle: job?.title,
            companyName: job?.companyName,
            scheduledDate: slot.scheduledDate,
            timeSlot: assignedCandidate.timeSlot,
            mode: slot.mode,
            location: slot.location,
            virtualMeetingDetails: slot.virtualMeetingDetails,
            candidateInstructions: slot.candidateInstructions
          }
        });
        
        await notification.save();
      }
    }
    
    // Update slot notifications record
    slot.notifications.push({
      sent: true,
      sentAt: new Date(),
      type: 'assignment',
      recipients: assignedStudentIds.map(id => new Types.ObjectId(id))
    });
    
    await slot.save();
    
  } catch (error) {
    console.error('Error sending interview assignment notifications:', error);
  }
}

/**
 * Get interview slots for a job
 * GET /api/jobs/:jobId/interview-slots
 */
export const getJobInterviewSlots = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status, collegeId } = req.query;
    
    const filter: any = { jobId: new Types.ObjectId(jobId), isActive: true };
    if (status) filter.status = status;
    if (collegeId) filter.collegeId = new Types.ObjectId(collegeId as string);
    
    const slots = await InterviewSlot.find(filter)
      .populate('collegeId', 'name shortName')
      .populate('assignedCandidates.studentId', 'firstName lastName email collegeId')
      .populate('waitlistCandidates.studentId', 'firstName lastName email collegeId')
      .sort({ scheduledDate: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        total: slots.length,
        slots: slots.map((slot: any) => ({
          id: slot._id,
          title: slot.title,
          college: slot.collegeId,
          scheduledDate: slot.scheduledDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          totalCapacity: slot.totalCapacity,
          availableSlots: slot.availableSlots,
          mode: slot.mode,
          status: slot.status,
          assignedCandidates: slot.assignedCandidates,
          waitlistCandidates: slot.waitlistCandidates,
          location: slot.location,
          virtualMeetingDetails: slot.virtualMeetingDetails,
          interviewers: slot.interviewers
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching interview slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview slots',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Confirm attendance for interview slot
 * POST /api/interview-slots/:slotId/confirm/:studentId
 */
export const confirmAttendance = async (req: Request, res: Response) => {
  try {
    const { slotId, studentId } = req.params;
    
    const slot = await InterviewSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Interview slot not found'
      });
    }
    
    // Manual confirmation logic
    const candidate = slot.assignedCandidates.find(
      (c: any) => c.studentId.toString() === studentId
    );
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found in assigned list'
      });
    }
    
    candidate.status = 'confirmed';
    candidate.confirmedAt = new Date();
    await slot.save();
    
    // Send confirmation notification
    const student = await Student.findById(studentId).populate('userId');
    const job = await Job.findById(slot.jobId);
    
    if (student && student.userId) {
      const notification = new Notification({
        recipientId: student.userId._id,
        senderId: slot.createdBy,
        title: `Interview Confirmed: ${job?.title}`,
        message: 'Your interview attendance has been confirmed. Please arrive on time.',
        notificationType: 'interview_confirmed',
        relatedJobId: slot.jobId,
        relatedEntityId: slot._id,
        priority: 'medium',
        channels: ['email', 'whatsapp']
      });
      
      await notification.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance confirmed successfully'
    });
    
  } catch (error) {
    console.error('Error confirming attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Mark candidate as attended/no-show
 * POST /api/interview-slots/:slotId/attendance/:studentId
 */
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { slotId, studentId } = req.params;
    const { attended, notes } = req.body;
    
    const slot = await InterviewSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Interview slot not found'
      });
    }
    
    // Manual attendance marking
    const candidate = slot.assignedCandidates.find(
      (c: any) => c.studentId.toString() === studentId
    );
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found in assigned list'
      });
    }
    
    candidate.status = attended ? 'attended' : 'cancelled';
    await slot.save();
    
    // Update application status
    const application = await Application.findOne({
      jobId: slot.jobId,
      studentId: new Types.ObjectId(studentId)
    });
    
    if (application) {
      application.currentStatus = attended ? 'interview_completed' : 'withdrawn';
      application.statusHistory.push({
        status: attended ? 'interview_completed' : 'withdrawn',
        updatedAt: new Date(),
        updatedBy: new Types.ObjectId(req.user._id),
        notes: notes || (attended ? 'Interview completed' : 'Candidate did not show up')
      });
      await application.save();
    }
    
    res.status(200).json({
      success: true,
      message: `Attendance marked as ${attended ? 'attended' : 'no-show'}`
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get upcoming interview slots for reminders
 * GET /api/interview-slots/upcoming
 */
export const getUpcomingInterviewSlots = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + Number(days));
    
    const slots = await InterviewSlot.find({
      scheduledDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['published', 'in_progress'] },
      isActive: true
    }).sort({ scheduledDate: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        total: slots.length,
        slots: slots.map((slot: any) => ({
          id: slot._id,
          jobId: slot.jobId,
          title: slot.title,
          scheduledDate: slot.scheduledDate,
          assignedCandidates: slot.assignedCandidates.length,
          status: slot.status
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching upcoming slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming interview slots',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
