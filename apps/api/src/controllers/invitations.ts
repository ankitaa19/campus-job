import { Request, Response } from 'express';
import { Invitation } from '../models/Invitation';
import { Job } from '../models/Job';
import { College } from '../models/College';
import { Recruiter } from '../models/Recruiter';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

/**
 * Debug endpoint to test invitation creation
 */
export const debugCreateInvitation = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    console.log('=== DEBUG INVITATION CREATION ===');
    console.log('User:', user);
    
    // Find recruiter
    const recruiter = await Recruiter.findOne({ userId: user._id });
    console.log('Recruiter found:', !!recruiter, recruiter?._id);
    
    // Find any job by this recruiter
    const job = await Job.findOne({ recruiterId: recruiter?._id });
    console.log('Job found:', !!job, job?._id, job?.title);
    
    // Find colleges
    const colleges = await College.find({ isActive: true }).limit(3);
    console.log('Colleges found:', colleges.length);
    
    res.json({
      success: true,
      debug: {
        user: user.email,
        recruiterId: recruiter?._id,
        jobId: job?._id,
        jobTitle: job?.title,
        collegesCount: colleges.length
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Create and send invitations to colleges for a job
 * POST /api/jobs/:jobId/invitations or POST /api/invitations
 */
export const createJobInvitations = async (req: Request, res: Response) => {
  try {
    // Get jobId from params or body (for compatibility with frontend)
    const jobId = req.params.jobId || req.body.jobId;
    const {
      targetColleges,
      collegeId, // Single college ID for simple invitation
      proposedDates,
      invitationMessage,
      message, // Alternative field name
      expiresInDays = 7
    } = req.body;
    
    console.log('=== CREATE INVITATION REQUEST ===');
    console.log('JobId from params:', req.params.jobId);
    console.log('JobId from body:', req.body.jobId);
    console.log('Final jobId:', jobId);
    console.log('Body:', req.body);
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required (provide jobId in params or body)'
      });
    }
    
    const user = req.user as any;
    console.log('User object in createJobInvitations:', {
      userId: user._id,
      userRole: user.role,
      userEmail: user.email
    });
    
    // Find the recruiter profile based on user ID
    const recruiterProfile = await Recruiter.findOne({ userId: user._id });
    console.log('Found recruiter profile:', {
      recruiterId: recruiterProfile?._id,
      companyName: recruiterProfile?.companyInfo?.name,
      approvalStatus: recruiterProfile?.approvalStatus
    });
    
    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter profile not found. Please complete your company profile first.'
      });
    }
    
    const recruiterId = recruiterProfile._id;
    
    // Validate job exists and belongs to recruiter
    const job = await Job.findById(jobId);
    console.log('Job ownership check:', {
      jobId: job?._id,
      jobRecruiterId: job?.recruiterId?.toString(),
      currentRecruiterId: recruiterId.toString(),
      match: job?.recruiterId?.toString() === recruiterId.toString(),
      jobTitle: job?.title,
      companyName: job?.companyName
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if job has recruiterId and user has permission
    if (!job.recruiterId || job.recruiterId.toString() !== recruiterId.toString()) {
      console.log('Authorization failed - detailed debug:', {
        jobRecruiterId: job.recruiterId,
        jobRecruiterIdString: job.recruiterId?.toString(),
        currentRecruiterId: recruiterId,
        currentRecruiterIdString: recruiterId.toString(),
        userRole: user.role,
        match: job.recruiterId?.toString() === recruiterId.toString()
      });
      
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to invite colleges for this job. This job does not belong to your account.',
        debug: {
          jobRecruiterId: job.recruiterId?.toString(),
          currentRecruiterId: recruiterId.toString(),
          userRole: user.role
        }
      });
    }
    
    // Handle both single collegeId and array of targetColleges for frontend compatibility
    let collegeIds: string[];
    if (collegeId) {
      // Single college invitation (from frontend)
      collegeIds = [collegeId];
    } else if (targetColleges && Array.isArray(targetColleges)) {
      // Multiple colleges (batch invitation)
      collegeIds = targetColleges;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either collegeId or targetColleges array is required'
      });
    }
    
    console.log('Processing invitation for colleges:', collegeIds);
    
    // Validate colleges exist
    const colleges = await College.find({
      _id: { $in: collegeIds },
      isActive: true,
      approvalStatus: 'approved'
    });
    
    if (colleges.length !== collegeIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some colleges not found or not approved'
      });
    }
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    
    const invitations = [];
    const notifications = [];
    
    // Use the final invitation message
    const finalMessage = invitationMessage || message || `Invitation for ${job.title} position at ${job.companyName}`;
    
    for (const collegeId of collegeIds) {
      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        jobId: new Types.ObjectId(jobId),
        collegeId: new Types.ObjectId(collegeId)
      });
      
      if (existingInvitation) {
        continue; // Skip duplicate invitation
      }
      
      // Create invitation
      const invitation = new Invitation({
        jobId: new Types.ObjectId(jobId),
        collegeId: new Types.ObjectId(collegeId),
        recruiterId: new Types.ObjectId(recruiterId),
        status: 'pending',
        invitationMessage: finalMessage,
        proposedDates,
        expiresAt: expirationDate,
        negotiationHistory: [{
          timestamp: new Date(),
          actor: 'recruiter',
          action: 'proposed',
          details: invitationMessage || 'Initial invitation sent'
        }],
        isActive: true,
        lastUpdated: new Date(),
        updatedBy: new Types.ObjectId(user._id)
      });
      
      const savedInvitation = await invitation.save();
      invitations.push(savedInvitation);
      
      // Find college TPO for notification
      const college = await College.findById(collegeId).populate('userId');
      if (college && college.userId) {
        const notification = new Notification({
          recipientId: college.userId._id,
          recipientType: 'college',
          senderId: user._id,
          title: `New Job Invitation: ${job.title}`,
          message: `${job.companyName} has invited your college for campus recruitment. Please review and respond to the invitation.`,
          notificationType: 'system',
          relatedJobId: new Types.ObjectId(jobId),
          relatedEntityId: savedInvitation._id,
          priority: 'high',
          channels: {
            platform: true,
            email: true,
            whatsapp: true,
            push: true
          },
          deliveryStatus: {
            platform: 'pending',
            email: 'pending',
            whatsapp: 'pending',
            push: 'pending'
          },
          actionRequired: true,
          actionUrl: `/invitations/${savedInvitation._id}`,
          actionText: 'View Invitation',
          personalizationData: {
            jobTitle: job.title,
            companyName: job.companyName,
            expiresAt: expirationDate,
            proposedDates
          }
        });
        
        notifications.push(await notification.save());
      }
    }
    
    // Update job status to indicate invitations sent
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        'metadata.invitationsSent': true,
        'metadata.invitationsSentAt': new Date(),
        'metadata.totalInvitationsSent': invitations.length
      }
    });
    
    res.status(201).json({
      success: true,
      message: `${invitations.length} invitations sent successfully`,
      _id: invitations[0]?._id,
      targetCollege: invitations[0]?.collegeId,
      status: invitations[0]?.status,
      data: {
        invitations: invitations.map(inv => ({
          id: inv._id,
          collegeId: inv.collegeId,
          status: inv.status,
          sentAt: inv.sentAt,
          expiresAt: inv.expiresAt
        })),
        notificationsSent: notifications.length
      }
    });
    
  } catch (error) {
    console.error('Error creating job invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all invitations for a job (Recruiter view)
 * GET /api/jobs/:jobId/invitations
 */
export const getJobInvitations = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;
    
    const filter: any = { jobId: new Types.ObjectId(jobId), isActive: true };
    if (status) {
      filter.status = status;
    }
    
    const invitations = await Invitation.find(filter)
      .populate('collegeId', 'name shortName address.city address.state placementContact')
      .populate('recruiterId', 'companyInfo.name recruiterProfile.firstName recruiterProfile.lastName')
      .sort({ sentAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        total: invitations.length,
        invitations: invitations.map(inv => ({
          id: inv._id,
          college: {
            id: inv.collegeId._id,
            name: (inv.collegeId as any).name,
            shortName: (inv.collegeId as any).shortName,
            location: `${(inv.collegeId as any).address.city}, ${(inv.collegeId as any).address.state}`,
            placementContact: (inv.collegeId as any).placementContact
          },
          status: inv.status,
          sentAt: inv.sentAt,
          respondedAt: inv.respondedAt,
          expiresAt: inv.expiresAt,
          proposedDates: inv.proposedDates,
          campusVisitWindow: inv.campusVisitWindow,
          tpoResponse: inv.tpoResponse,
          negotiationHistory: inv.negotiationHistory
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching job invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all invitations for a college (TPO view)
 * GET /api/colleges/invitations
 */
export const getCollegeInvitations = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { status, limit = 20, page = 1 } = req.query;
    
    // Find college by user ID
    const college = await College.findOne({ userId: user._id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found'
      });
    }
    
    const filter: any = { collegeId: college._id, isActive: true };
    if (status) {
      filter.status = status;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const invitations = await Invitation.find(filter)
      .populate('jobId', 'title companyName description salary applicationDeadline locations type experience requirements')
      .populate('recruiterId', 'companyInfo profile user')
      .populate('collegeId', 'name shortName location')
      .sort({ sentAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Invitation.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
        invitations: invitations.map(inv => ({
          id: inv._id,
          job: {
            id: inv.jobId._id,
            title: (inv.jobId as any).title,
            companyName: (inv.jobId as any).companyName,
            description: (inv.jobId as any).description,
            salary: (inv.jobId as any).salary,
            applicationDeadline: (inv.jobId as any).applicationDeadline,
            locations: (inv.jobId as any).locations,
            type: (inv.jobId as any).type,
            experience: (inv.jobId as any).experience,
            requirements: (inv.jobId as any).requirements
          },
          recruiter: {
            id: inv.recruiterId._id,
            companyInfo: (inv.recruiterId as any).companyInfo,
            profile: (inv.recruiterId as any).profile,
            user: (inv.recruiterId as any).user
          },
          college: {
            id: inv.collegeId?._id,
            name: (inv.collegeId as any)?.name,
            shortName: (inv.collegeId as any)?.shortName,
            location: (inv.collegeId as any)?.location
          },
          status: inv.status,
          sentAt: inv.sentAt,
          respondedAt: inv.respondedAt,
          expiresAt: inv.expiresAt,
          proposedDates: inv.proposedDates,
          campusVisitWindow: inv.campusVisitWindow,
          tpoResponse: inv.tpoResponse,
          invitationMessage: inv.invitationMessage,
          negotiationHistory: inv.negotiationHistory
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching college invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch college invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Accept an invitation (TPO action)
 * POST /api/invitations/:invitationId/accept
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const {
      campusVisitWindow,
      tpoMessage,
      additionalRequirements
    } = req.body;
    
    const user = req.user as any;
    
    // Find and validate invitation
    const invitation = await Invitation.findById(invitationId)
      .populate('collegeId')
      .populate('jobId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Verify user is authorized (is TPO of the college)
    const college = invitation.collegeId as any;
    if (college.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'pending' && invitation.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'Invitation cannot be accepted in current status'
      });
    }
    
    // Accept the invitation
    // Manual accept logic
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    invitation.campusVisitWindow = campusVisitWindow;
    
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'tpo',
      action: 'accepted',
      details: tpoMessage || 'Invitation accepted'
    });
    
    await invitation.save(); // acceptInvitation(campusVisitWindow, tpoMessage);
    
    // Update job status to active if this is the first acceptance
    const job = invitation.jobId as any;
    if (job.status === 'draft') {
      await Job.findByIdAndUpdate(job._id, {
        status: 'active',
        'metadata.firstAcceptanceAt': new Date()
      });
    }
    
    // Notify recruiter
    const notification = new Notification({
      recipientId: invitation.recruiterId,
      recipientType: 'recruiter',
      senderId: user._id,
      title: `Invitation Accepted: ${job.title}`,
      message: `${college.name} has accepted your job invitation and confirmed campus visit dates.`,
      notificationType: 'system',
      relatedJobId: job._id,
      relatedEntityId: invitation._id,
      priority: 'high',
      channels: {
        platform: true,
        email: true,
        whatsapp: true,
        push: true
      },
      deliveryStatus: {
        platform: 'pending',
        email: 'pending',
        whatsapp: 'pending',
        push: 'pending'
      },
      actionRequired: false,
      personalizationData: {
        collegeName: college.name,
        campusVisitWindow,
        tpoMessage
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          campusVisitWindow: invitation.campusVisitWindow,
          respondedAt: invitation.respondedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Decline an invitation (TPO action)
 * POST /api/invitations/:invitationId/decline
 */
export const declineInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { reason } = req.body;
    
    const user = req.user as any;
    
    const invitation = await Invitation.findById(invitationId)
      .populate('collegeId')
      .populate('jobId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const college = invitation.collegeId as any;
    if (college.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'pending' && invitation.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'Invitation cannot be declined in current status'
      });
    }
    
    // Manual decline logic
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    invitation.tpoResponse = {
      responseDate: new Date(),
      responseMessage: reason
    };
    
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'tpo',
      action: 'declined',
      details: reason || 'Invitation declined'
    });
    
    await invitation.save();
    
    // Notify recruiter
    const job = invitation.jobId as any;
    const notification = new Notification({
      recipientId: invitation.recruiterId,
      senderId: user._id,
      title: `Invitation Declined: ${job.title}`,
      message: `${college.name} has declined your job invitation.`,
      notificationType: 'invitation_declined',
      relatedJobId: job._id,
      relatedEntityId: invitation._id,
      priority: 'medium',
      channels: ['email'],
      metadata: {
        collegeName: college.name,
        reason
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Invitation declined successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          respondedAt: invitation.respondedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Propose counter dates (TPO action)
 * POST /api/invitations/:invitationId/counter-propose
 */
export const proposeCounterDates = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { alternativeDates, message } = req.body;
    
    const user = req.user as any;
    
    const invitation = await Invitation.findById(invitationId)
      .populate('collegeId')
      .populate('jobId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const college = invitation.collegeId as any;
    if (college.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot propose counter dates for this invitation'
      });
    }
    
    // Manual counter proposal logic
    invitation.status = 'negotiating';
    invitation.respondedAt = new Date();
    invitation.tpoResponse = {
      responseDate: new Date(),
      responseMessage: message,
      counterProposal: {
        alternativeDates,
        additionalRequirements: message
      }
    };
    
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'tpo',
      action: 'counter_proposed',
      details: message || 'Counter proposal submitted',
      proposedDates: alternativeDates
    });
    
    await invitation.save();
    
    // Notify recruiter
    const job = invitation.jobId as any;
    const notification = new Notification({
      recipientId: invitation.recruiterId,
      senderId: user._id,
      title: `Counter Proposal: ${job.title}`,
      message: `${college.name} has proposed alternative dates for campus visit.`,
      notificationType: 'invitation_counter_proposal',
      relatedJobId: job._id,
      relatedEntityId: invitation._id,
      priority: 'high',
      channels: ['email', 'whatsapp'],
      metadata: {
        collegeName: college.name,
        alternativeDates,
        message
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Counter proposal submitted successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          tpoResponse: invitation.tpoResponse,
          respondedAt: invitation.respondedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error proposing counter dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to propose counter dates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation statistics for admin/recruiter dashboard
 * GET /api/invitations/stats
 */
export const getInvitationStats = async (req: Request, res: Response) => {
  try {
    const { jobId, recruiterId, timeRange = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(timeRange));
    
    const filter: any = {
      sentAt: { $gte: startDate },
      isActive: true
    };
    
    if (jobId) filter.jobId = new Types.ObjectId(jobId as string);
    if (recruiterId) filter.recruiterId = new Types.ObjectId(recruiterId as string);
    
    const stats = await Invitation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$respondedAt', null] },
                { $subtract: ['$respondedAt', '$sentAt'] },
                null
              ]
            }
          }
        }
      }
    ]);
    
    const totalInvitations = await Invitation.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        totalInvitations,
        statusBreakdown: stats,
        responseRate: stats
          .filter(s => ['accepted', 'declined'].includes(s._id))
          .reduce((sum, s) => sum + s.count, 0) / totalInvitations * 100
      }
    });
    
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation by ID
 * GET /api/invitations/:invitationId
 */
export const getInvitationById = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findById(invitationId)
      .populate('jobId', 'title companyName description requirements salary location type experience applicationDeadline')
      .populate('collegeId', 'name shortName location')
      .populate('recruiterId', 'companyInfo profile user');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { invitation }
    });
    
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Respond to counter proposal (Recruiters only)
 * POST /api/invitations/:invitationId/counter-response
 */
export const respondToCounterProposal = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { accept, finalDates, message } = req.body;
    
    const user = req.user as any;
    const recruiterId = user.recruiterId || user._id;
    
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    if (invitation.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'No counter proposal to respond to'
      });
    }
    
    if (accept) {
      // Accept the counter proposal
      invitation.status = 'accepted';
      invitation.campusVisitWindow = {
        confirmedStartDate: finalDates.startDate,
        confirmedEndDate: finalDates.endDate,
        visitMode: 'physical',
        maxStudents: 100,
      };
      
      invitation.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'recruiter',
        action: 'accepted',
        details: message || 'Counter proposal accepted'
      });
      
    } else {
      // Decline the counter proposal
      invitation.status = 'declined';
      invitation.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'recruiter',
        action: 'declined',
        details: message || 'Counter proposal declined'
      });
    }
    
    await invitation.save();
    
    // Send notification to TPO
    const notification = new Notification({
      recipientId: invitation.collegeId,
      senderId: new Types.ObjectId(recruiterId),
      title: `Counter Proposal ${accept ? 'Accepted' : 'Declined'}`,
      message: accept ? 
        'Your counter proposal has been accepted. Campus visit scheduled.' :
        'Your counter proposal has been declined.',
      notificationType: accept ? 'invitation_accepted' : 'invitation_declined',
      relatedJobId: invitation.jobId,
      relatedEntityId: invitation._id,
      priority: 'high',
      channels: ['email', 'whatsapp'],
      metadata: {
        invitationId: invitation._id,
        finalStatus: invitation.status,
        message
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: `Counter proposal ${accept ? 'accepted' : 'declined'} successfully`,
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          campusVisitWindow: invitation.campusVisitWindow,
          negotiationHistory: invitation.negotiationHistory
        }
      }
    });
    
  } catch (error) {
    console.error('Error responding to counter proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to counter proposal',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update invitation (Admin only)
 * PUT /api/invitations/:invitationId
 */
export const updateInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const updates = req.body;
    
    const invitation = await Invitation.findByIdAndUpdate(
      invitationId,
      { 
        ...updates,
        lastModifiedBy: new Types.ObjectId(req.user._id),
        lastModifiedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Invitation updated successfully',
      data: { invitation }
    });
    
  } catch (error) {
    console.error('Error updating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation history/timeline
 * GET /api/invitations/:invitationId/history
 */
export const getInvitationHistory = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findById(invitationId)
      .select('negotiationHistory status createdAt sentAt respondedAt')
      .populate('jobId', 'title companyName')
      .populate('collegeId', 'name');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const timeline = [
      {
        timestamp: invitation.sentAt,
        actor: 'recruiter',
        action: 'created',
        details: 'Invitation created and sent to college'
      },
      ...invitation.negotiationHistory.map(entry => ({
        timestamp: entry.timestamp,
        actor: entry.actor,
        action: entry.action,
        details: entry.details,
        proposedDates: entry.proposedDates
      }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    res.status(200).json({
      success: true,
      data: {
        invitation: {
          id: invitation._id,
          currentStatus: invitation.status,
          timeline
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching invitation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Resend invitation (Recruiter action)
 * POST /api/invitations/:invitationId/resend
 */
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { newMessage, newProposedDates, expiresInDays = 7 } = req.body;
    
    const user = req.user as any;
    
    // Find the invitation and validate permissions
    const invitation = await Invitation.findById(invitationId)
      .populate('jobId', 'title companyName recruiterId')
      .populate('collegeId', 'name userId')
      .populate('recruiterId', 'userId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Check if user is the recruiter who owns this invitation
    const recruiterProfile = await Recruiter.findOne({ userId: user._id });
    if (!recruiterProfile || invitation.recruiterId._id.toString() !== recruiterProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to resend this invitation'
      });
    }
    
    // Only allow resending declined or expired invitations
    if (!['declined', 'expired'].includes(invitation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invitation can only be resent if it was declined or expired',
        currentStatus: invitation.status
      });
    }
    
    // Update invitation details
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    
    invitation.status = 'pending';
    invitation.invitationMessage = newMessage || invitation.invitationMessage;
    invitation.proposedDates = newProposedDates || invitation.proposedDates;
    invitation.expiresAt = expirationDate;
    invitation.sentAt = new Date();
    invitation.respondedAt = undefined;
    invitation.lastUpdated = new Date();
    invitation.updatedBy = user._id;
    
    // Add to negotiation history
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'recruiter',
      action: 'resent',
      details: 'Invitation resent with updated details',
      proposedDates: newProposedDates
    });
    
    await invitation.save();
    
    // Send notification to college TPO
    const college = invitation.collegeId as any;
    const job = invitation.jobId as any;
    
    if (college.userId) {
      const notification = new Notification({
        recipientId: college.userId,
        recipientType: 'college',
        senderId: user._id,
        title: `Re-invitation: ${job.title}`,
        message: `${job.companyName} has sent you a new invitation for campus recruitment. Please review the updated details.`,
        notificationType: 'system',
        relatedJobId: job._id,
        relatedEntityId: invitation._id,
        priority: 'high',
        channels: {
          platform: true,
          email: true,
          whatsapp: true,
          push: true
        },
        deliveryStatus: {
          platform: 'pending',
          email: 'pending',
          whatsapp: 'pending',
          push: 'pending'
        },
        actionRequired: true,
        actionUrl: `/invitations/${invitation._id}`,
        actionText: 'View Re-invitation',
        personalizationData: {
          jobTitle: job.title,
          companyName: job.companyName,
          expiresAt: expirationDate,
          proposedDates: newProposedDates || invitation.proposedDates,
          resendReason: 'Updated invitation details'
        }
      });
      
      await notification.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          sentAt: invitation.sentAt,
          expiresAt: invitation.expiresAt,
          proposedDates: invitation.proposedDates,
          invitationMessage: invitation.invitationMessage
        }
      }
    });
    
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
