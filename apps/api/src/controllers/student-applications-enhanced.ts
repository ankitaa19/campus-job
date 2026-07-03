import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Student } from '../models/Student';
import { Application } from '../models/Application';
import { ResumeJobAnalysis } from '../models/ResumeJobAnalysis';

/**
 * Get all applications for the authenticated student with real-time status and enhanced details
 * GET /api/students/applications/enhanced
 */
export const getEnhancedStudentApplications = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?._id || user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    console.log('🔍 Enhanced student applications request:', { userId, userEmail: user?.email });
    
    // Find the student by userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        debug: { userId, userEmail: user?.email }
      });
    }

    console.log('📋 Student found:', `${student.firstName} ${student.lastName}`);

    // Get all applications for this student with comprehensive details
    const applications = await Application.find({ 
      studentId: student._id 
    })
    .populate('jobId', 'title companyName applicationDeadline status location workMode salary requirements')
    .populate('recruiterId', 'companyName contactInfo')
    .sort({ appliedAt: -1 })
    .lean();

    // If no applications found, return empty array with status breakdown
    if (!applications || applications.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No applications found',
        totalCount: 0,
        statusBreakdown: {
          applied: 0,
          under_review: 0,
          interview_scheduled: 0,
          interviewed: 0,
          selected: 0,
          rejected: 0,
          withdrawn: 0
        },
        lastUpdated: new Date(),
        realTimeData: true
      });
    }

    // Transform applications to include comprehensive details and real-time status
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app: any) => {
        try {
          // Get matching analysis from ResumeJobAnalysis
          const matchAnalysis = await ResumeJobAnalysis.findOne({
            studentId: student._id,
            jobId: app.jobId?._id || app.jobId,
            applicationId: app._id
          }).lean();

          // Get status history - handle both array and non-array cases
          const statusHistory = Array.isArray(app.statusHistory) ? app.statusHistory : [];
          const latestStatus = statusHistory.length > 0 
            ? statusHistory[statusHistory.length - 1] 
            : { 
                status: app.currentStatus || 'applied', 
                updatedAt: app.appliedAt || new Date(),
                notes: 'Application submitted'
              };

          // Format job details safely
          const jobDetails = app.jobId || {};
          const recruiterDetails = app.recruiterId || {};

          // Calculate time since application
          const appliedDate = app.appliedAt || app.createdAt || new Date();
          const daysSinceApplied = Math.floor((Date.now() - new Date(appliedDate).getTime()) / (1000 * 60 * 60 * 24));

          return {
            _id: app._id,
            jobId: jobDetails._id || app.jobId,
            jobTitle: jobDetails.title || 'Job Title',
            companyName: jobDetails.companyName || recruiterDetails.companyName || 'Company',
            appliedDate: appliedDate,
            status: app.currentStatus || 'applied',
            
            // Enhanced real-time tracking details
            lastUpdated: latestStatus.updatedAt || appliedDate,
            daysSinceApplied,
            statusHistory: statusHistory.slice(-5), // Last 5 status changes
            currentStage: app.currentStatus || 'applied',
            
            // Match analysis and scoring
            matchScore: matchAnalysis?.matchScore || app.matchScore || null,
            matchAnalysis: matchAnalysis ? {
              overallMatch: matchAnalysis.matchScore,
              explanation: matchAnalysis.explanation,
              skillsMatched: matchAnalysis.skillsMatched || [],
              skillsGap: matchAnalysis.skillsGap || [],
              suggestions: matchAnalysis.suggestions || []
            } : null,
            
            // Application metadata
            applicationNotes: app.shortlistReason || app.rejectionReason || '',
            coverLetter: app.coverLetter || '',
            
            // Job-specific details
            jobLocation: jobDetails.location || 'Not specified',
            workMode: jobDetails.workMode || 'Not specified',
            salary: jobDetails.salary || null,
            applicationDeadline: jobDetails.applicationDeadline,
            jobRequirements: jobDetails.requirements || [],
            
            // Communication and notification status
            whatsappNotificationSent: app.whatsappNotificationSent || false,
            emailNotificationSent: app.emailNotificationSent || false,
            recruiterViewed: app.recruiterViewed || false,
            lastRecruiterView: app.lastRecruiterView || null,
            
            // Real-time status indicators
            isUrgent: daysSinceApplied > 14 && ['applied', 'under_review'].includes(app.currentStatus || 'applied'),
            isRecent: daysSinceApplied <= 3,
            canWithdraw: ['applied', 'under_review'].includes(app.currentStatus || 'applied'),
            requiresAction: app.currentStatus === 'interview_scheduled' && !app.interviewConfirmed,
            
            // Interview information
            interviews: app.interviews || [],
            upcomingInterview: app.interviews?.find((i: any) => new Date(i.scheduledDate) > new Date()) || null,
            
            // Feedback and communication
            recruiterFeedback: app.recruiterFeedback || '',
            internalNotes: app.internalNotes || '',
            rejectionReason: app.rejectionReason || '',
            nextSteps: app.nextSteps || '',
            
            // Additional metadata for enhanced dashboard
            priority: app.currentStatus === 'selected' ? 'high' : 
                     app.currentStatus === 'interview_scheduled' ? 'medium' : 'normal',
            tags: [
              ...(app.matchScore >= 80 ? ['high-match'] : []),
              ...(daysSinceApplied <= 3 ? ['recent'] : []),
              ...(app.whatsappNotificationSent ? ['notified'] : []),
              ...(app.recruiterViewed ? ['viewed'] : [])
            ]
          };
        } catch (error) {
          console.error('Error processing application:', app._id, error);
          return {
            _id: app._id,
            jobId: app.jobId,
            jobTitle: 'Error loading job details',
            companyName: 'Unknown',
            appliedDate: app.appliedAt || new Date(),
            status: app.currentStatus || 'applied',
            error: 'Failed to load application details',
            hasError: true
          };
        }
      })
    );

    // Calculate comprehensive status breakdown for analytics
    const statusBreakdown = applicationsWithDetails.reduce((acc: Record<string, number>, app: any) => {
      const status = app.status || 'applied';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all status types are present
    const allStatuses = ['applied', 'under_review', 'interview_scheduled', 'interviewed', 'selected', 'rejected', 'withdrawn'];
    allStatuses.forEach(status => {
      if (!statusBreakdown[status]) {
        statusBreakdown[status] = 0;
      }
    });

    // Calculate additional analytics
    const analytics = {
      totalApplications: applicationsWithDetails.length,
      activeApplications: applicationsWithDetails.filter((app: any) => 
        ['applied', 'under_review', 'interview_scheduled'].includes(app.status)
      ).length,
      successfulApplications: statusBreakdown.selected || 0,
      pendingInterviews: statusBreakdown.interview_scheduled || 0,
      averageMatchScore: applicationsWithDetails
        .filter((app: any) => app.matchScore)
        .reduce((sum: number, app: any) => sum + (app.matchScore || 0), 0) / 
        applicationsWithDetails.filter((app: any) => app.matchScore).length || 0,
      recentActivity: applicationsWithDetails.filter((app: any) => app.isRecent).length,
      requiresAttention: applicationsWithDetails.filter((app: any) => app.requiresAction).length
    };

    console.log('✅ Successfully retrieved enhanced applications:', {
      studentName: `${student.firstName} ${student.lastName}`,
      totalApplications: applicationsWithDetails.length,
      statusBreakdown,
      analytics
    });

    res.json({
      success: true,
      data: applicationsWithDetails,
      message: `Found ${applicationsWithDetails.length} applications with enhanced details`,
      totalCount: applicationsWithDetails.length,
      statusBreakdown,
      analytics,
      lastUpdated: new Date(),
      realTimeData: true,
      enhanced: true
    });

  } catch (error) {
    console.error('Error fetching enhanced student applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update application status (for testing real-time updates)
 * PATCH /api/students/applications/:applicationId/status
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const user = req.user as any;
    
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status and add to history
    application.currentStatus = status;
    if (!application.statusHistory) {
      application.statusHistory = [];
    }
    application.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: user._id || user.userId,
      notes: notes || `Status updated to ${status}`
    });

    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId: application._id,
        newStatus: status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
};
