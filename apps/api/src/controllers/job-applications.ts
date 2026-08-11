import { Request, Response } from 'express';
import crypto from 'crypto';
import { Application } from '../models/Application';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import { Recruiter } from '../models/Recruiter';
import { ResumeJobAnalysis } from '../models/ResumeJobAnalysis';
import { Types } from 'mongoose';
import AIResumeMatchingService from '../services/ai-resume-matching';
import { recordNotification, sendRecruiterApplicationNotification } from '../services/notifications';
import { toDisplayMatchScore } from '../services/hybrid-resume-matching';
import ProductEventService from '../services/product-events';

/**
 * Apply for a job with AI resume matching
 * POST /api/jobs/:jobId/apply
 */
export const applyForJob = async (req: Request, res: Response) => {
  try {
    const minimumAlertScore = Number(process.env.JOB_ALERT_MIN_MATCH_SCORE ?? 70);
    const { jobId } = req.params;
    const { skipNotification = false, coverLetter, portfolioLinks } = req.body;
    const user = req.user as any; // Auth middleware sets req.user to the full user object
    const userId = user._id || user.userId; // Handle both formats
    
    console.log('Apply for job - User ID:', userId);
    console.log('Apply for job - Job ID:', jobId);
    console.log('Apply for job - Request body:', req.body);
    console.log('Apply for job - Skip notification:', skipNotification);
    
    // Find student by userId
    const student = await Student.findOne({ userId });
    console.log('Apply for job - Student found:', student ? `${student.firstName} ${student.lastName}` : 'No student profile');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        debug: `User ID: ${userId}, User email: ${user.email}`
      });
    }

    // Check if student has resume text or analysis
    let resumeContent = student.resumeText || 
      (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
    
    if (!resumeContent) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume to CampusPe before applying'
      });
    }

    // Find the job
    const job = await Job.findById(jobId).populate('recruiterId');
    console.log('Apply for job - Job found:', job ? job.title : 'No job found');
    console.log('Apply for job - Job recruiterId:', job && job.recruiterId ? job.recruiterId : 'No recruiterId');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    if (job.status !== 'active' || !job.isPublic || !job.allowDirectApplications || job.applicationDeadline < new Date()) {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      studentId: student._id,
      jobId: new Types.ObjectId(jobId)
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Calculate the same hybrid score used by recommendations and alerts.
    let matchResult;
    try {
      const CentralizedMatchingService = require('../services/centralized-matching').default;
      matchResult = await CentralizedMatchingService.getOrCalculateMatch(student._id, job._id, true);
      if (!matchResult) throw new Error('Hybrid match calculation returned no result');
    } catch (aiError) {
      console.error('AIResumeMatchingService error:', aiError);
      return res.status(500).json({
        success: false,
        message: 'AI resume analysis failed. Please try again later.',
        error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
      });
    }

    const linkedRecruiterId = (job.recruiterId as any)?._id || job.recruiterId || null;
    const employerDeliveryStatus = linkedRecruiterId
      ? 'delivered_to_campuspe_employer'
      : 'awaiting_employer_connection';

    // Create the application. Imported source URLs remain audit metadata on
    // the Job only; CampusPe never submits or redirects externally here.
    let application;
    try {
      application = new Application({
        userId: new Types.ObjectId(userId),
        studentId: student._id,
        jobId: new Types.ObjectId(jobId),
        recruiterId: linkedRecruiterId,
        collegeId: student.collegeId,
        coverLetter: typeof coverLetter === 'string' ? coverLetter.trim() : undefined,
        coverLetterUsed: typeof coverLetter === 'string' ? coverLetter.trim() : undefined,
        portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks : [],
        resumeFile: student.resumeFile,
        resumeVersionUsed: {
          file: student.resumeFile,
          uploadedAt: student.resumeAnalysis?.uploadDate,
          analysisVersion: 1
        },
        sourcePlatform: job.sourceProvider || job.source || 'campuspe',
        status: 'confirmed',
        workflowState: 'confirmed',
        idempotencyKey: crypto.createHash('sha256').update(`${userId}:${job._id}:v1`).digest('hex'),
        submittedVia: 'this_portal',
        submissionChannel: 'campuspe',
        employerDeliveryStatus,
        externalSubmissionAttempted: false,
        ...(employerDeliveryStatus === 'awaiting_employer_connection' ? { nextDeliveryAttemptAt: new Date() } : { employerDeliveredAt: new Date() }),
        jobSnapshot: {
          title: job.title,
          companyName: job.companyName,
          description: job.description,
          jobType: job.jobType,
          workMode: job.workMode,
          locations: job.locations,
          requiredSkills: job.requiredSkills,
          requirements: job.requirements,
          educationRequirements: job.educationRequirements,
          experienceLevel: job.experienceLevel,
          minExperience: job.minExperience,
          maxExperience: job.maxExperience,
          salary: job.salary,
          industry: job.industry,
          benefits: job.benefits,
          postedAt: job.postedAt,
          applicationDeadline: job.applicationDeadline,
          capturedAt: new Date()
        },
        currentStatus: 'applied',
        statusHistory: [{
          status: 'applied',
          updatedAt: new Date(),
          updatedBy: student.userId,
          notes: 'Application submitted through platform'
        }],
        matchScore: matchResult.matchScore,
        skillsMatchPercentage: matchResult.matchScore,
        submittedFieldsJson: {
          submittedVia: 'this_portal',
          studentId: String(student._id),
          userId: String(userId),
          jobId: String(job._id),
          coverLetter: typeof coverLetter === 'string' ? coverLetter.trim() : undefined,
          portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks : [],
          resumeFile: student.resumeFile,
          resumeVersionUsed: {
            file: student.resumeFile,
            uploadedAt: student.resumeAnalysis?.uploadDate,
            analysisVersion: 1
          },
          submittedAt: new Date()
        },
        source: 'platform',
        appliedAt: new Date(),
        whatsappNotificationSent: false,
        emailNotificationSent: false,
        recruiterViewed: false
      });

      await application.save();
      await Job.findByIdAndUpdate(job._id, { $addToSet: { applications: application._id } });
      ProductEventService.record({
        name: 'application_confirmed',
        actorUserId: userId,
        studentId: student._id,
        jobId: job._id,
        applicationId: application._id,
        sourceProvider: job.sourceProvider || job.source,
        scores: { match: Number(matchResult.matchScore) / 100 }
      }).catch(() => undefined);
      setImmediate(() => {
        const JobBehaviorService = require('../services/job-behavior').default;
        JobBehaviorService.record(new Types.ObjectId(userId), job._id, 'apply').catch((error: unknown) =>
          console.error('Failed to record application behavior:', error)
        );
      });
    } catch (appError: any) {
      console.error('Application save error:', appError);
      if (appError?.code === 11000) {
        return res.status(409).json({ success: false, message: 'You have already applied for this job' });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to save application. Please try again later.',
        error: appError instanceof Error ? appError.message : 'Unknown application save error'
      });
    }

    // Save the resume analysis (use upsert to handle existing analyses)
    try {
      const analysisData = {
        studentId: student._id,
        jobId: new Types.ObjectId(jobId),
        matchScore: matchResult.matchScore,
        explanation: matchResult.explanation,
        suggestions: matchResult.suggestions,
        skillsMatched: matchResult.skillsMatched,
        skillsGap: matchResult.skillsGap,
        matchingModel: matchResult.matchingModel,
        ruleBasedScore: matchResult.ruleBasedScore,
        aiScore: matchResult.aiScore,
        scoreBreakdown: matchResult.scoreBreakdown,
        resumeText: resumeContent,
        resumeVersion: 1,
        jobTitle: job.title,
        jobDescription: job.description,
        companyName: job.companyName,
        applicationId: application._id,
        dateApplied: new Date(),
        isActive: true,
        analyzedAt: new Date()
      };

      // Use upsert to create or update existing analysis
      await ResumeJobAnalysis.findOneAndUpdate(
        { 
          studentId: student._id, 
          jobId: new Types.ObjectId(jobId) 
        },
        analysisData,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );

      console.log('✅ Resume analysis saved/updated successfully');
    } catch (analysisError) {
      console.error('ResumeAnalysis save error:', analysisError);
      // Not blocking application success, just log error
    }

    // Notify recruiter inside CampusPe so the application does not need an
    // external handoff to be reviewed.
    try {
      const recruiterRecord = linkedRecruiterId
        ? await Recruiter.findById(linkedRecruiterId).populate('userId', 'email')
        : null;
      const recruiterUser = recruiterRecord?.userId as any;

      if (recruiterRecord && recruiterUser?._id) {
        await sendRecruiterApplicationNotification(
          String(recruiterUser._id),
          String(application._id),
          String(job._id),
          job.title,
          job.companyName,
          `${student.firstName} ${student.lastName}`.trim(),
          recruiterUser.email || undefined,
        );
      }
    } catch (notificationError) {
      console.error('Recruiter notification error:', notificationError);
    }

    // AUTO-SEND WHATSAPP NOTIFICATION FOR HIGH MATCH SCORES (unless skipped)
    // If match score is above 70%, automatically send WhatsApp notification to the student
    if (matchResult.matchScore >= minimumAlertScore && !skipNotification) {
      try {
        console.log(`🎯 High match score (${matchResult.matchScore}%) detected! Auto-sending WhatsApp notification to student...`);
        
        // Get student's phone number from populated user data
        const studentWithUser = await Student.findById(student._id).populate('userId', 'phone whatsappNumber');
        const userDetails = studentWithUser?.userId as any; // Type assertion for populated field
        const phoneNumber = userDetails?.whatsappNumber || userDetails?.phone;
        
        if (phoneNumber) {
          const { sendJobMatchNotification } = require('../services/whatsapp');
          
          // Format salary information
          let salaryInfo = 'Competitive';
          if (job.salary && job.salary.min && job.salary.max) {
            const currency = job.salary.currency === 'INR' ? '₹' : job.salary.currency;
            const minLPA = Math.round(job.salary.min / 100000);
            const maxLPA = Math.round(job.salary.max / 100000);
            salaryInfo = `${currency}${minLPA}-${maxLPA} LPA`;
          }

          // Format location information
          let locationInfo: string = job.workMode || 'remote';
          if (job.locations && job.locations.length > 0) {
            const location = job.locations[0];
            if (location.city && location.state) {
              locationInfo = `${location.city}, ${location.state}`;
            }
            if (location.isRemote) {
              locationInfo = 'remote';
            } else if (location.hybrid) {
              locationInfo = `${locationInfo} (Hybrid)`;
            }
          }

          const messageData = {
            jobTitle: job.title,
            company: job.companyName,
            location: locationInfo,
            salary: salaryInfo,
            matchScore: String(matchResult.displayMatchScore || matchResult.matchScore),
            personalizedMessage: `🎉 Congratulations! You're a ${matchResult.displayMatchScore || matchResult.matchScore}% match for this role at ${job.companyName}!`,
            jobLink: `https://campuspe.com/jobs/${jobId}`
          };

          const whatsappResult = await sendJobMatchNotification(phoneNumber, messageData);
          
          if (whatsappResult.success) {
            // Update application to mark WhatsApp notification as sent
            await Application.findByIdAndUpdate(application._id, {
              whatsappNotificationSent: true,
              whatsappNotificationSentAt: new Date()
            });

            // Save notification record
            await recordNotification({
              recipientId: String(student.userId),
              recipientType: 'student',
              title: `🎯 Great Match: ${job.title}`,
              message: `You're a ${matchResult.displayMatchScore || matchResult.matchScore}% match! Your application for ${job.title} at ${job.companyName} has been submitted.`,
              notificationType: 'job_match',
              relatedJobId: job._id,
              channels: {
                platform: true,
                whatsapp: true,
              },
              priority: 'high',
              metadata: {
                matchScore: matchResult.displayMatchScore || matchResult.matchScore,
                autoSent: true,
                triggerReason: 'high_match_score'
              }
            });

            console.log(`✅ Auto-sent WhatsApp notification to ${student.firstName} ${student.lastName} (${phoneNumber}) for high match score`);
          } else {
            console.error(`❌ Failed to auto-send WhatsApp notification:`, whatsappResult.message);
          }
        } else {
          console.log(`📞 No phone number available for student ${student.firstName} ${student.lastName} - skipping auto WhatsApp notification`);
        }
      } catch (whatsappError) {
        console.error('Error sending auto WhatsApp notification:', whatsappError);
        // Don't block application success if WhatsApp fails
      }
    } else if (matchResult.matchScore >= minimumAlertScore && skipNotification) {
      console.log(`📱 High match score (${matchResult.matchScore}%) but notifications skipped for dashboard application`);
    }

    // Return response with match score and suggestions
    res.status(201).json({
      success: true,
      message: employerDeliveryStatus === 'delivered_to_campuspe_employer'
        ? 'Application delivered to the employer through CampusPe.'
        : 'Application saved and tracked in CampusPe. CampusPe will deliver it automatically when the employer connects.',
      data: {
        applicationId: application._id,
        trackingStatus: application.currentStatus,
        employerDeliveryStatus,
        submissionChannel: 'campuspe',
        matchScore: matchResult.displayMatchScore,
        explanation: matchResult.explanation,
        suggestions: matchResult.suggestions,
        skillsMatched: matchResult.skillsMatched,
        skillsGap: matchResult.skillsGap
      }
    });

  } catch (error) {
    console.error('Error applying for job:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get resume improvement suggestions for a specific job
 * POST /api/jobs/:jobId/improve-resume
 */
export const getResumeImprovementSuggestions = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user as any;
    
    // Find student by userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check if student has resume text or analysis
    const resumeContent = student.resumeText || 
      (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
    
    if (!resumeContent) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume first'
      });
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get detailed improvement suggestions
    const improvements = await AIResumeMatchingService.generateImprovementSuggestions(
      resumeContent
    );

    // Update or create resume analysis with improvement suggestions
    await ResumeJobAnalysis.findOneAndUpdate(
      { studentId: student._id, jobId: new Types.ObjectId(jobId) },
      {
        $set: {
          improvementsGenerated: true,
          improvementsSuggestions: improvements
        }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Resume improvement suggestions generated successfully',
      data: {
        improvements,
        jobTitle: job.title,
        companyName: job.companyName
      }
    });

  } catch (error) {
    console.error('Error generating resume improvements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate improvement suggestions. Please try again.'
    });
  }
};

/**
 * Get applications for a job (for recruiters)
 * GET /api/jobs/:jobId/applications
 */
export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user as any;
    
    // Verify the job belongs to this recruiter
    const job = await Job.findById(jobId).populate('recruiterId');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // For now, we'll skip the recruiter verification and just get applications
    // In production, you should verify that the requesting user owns this job

    // Get applications with resume analysis data
    const applications = await Application.find({ jobId: new Types.ObjectId(jobId) })
      .populate({
        path: 'studentId',
        select: 'personalInfo contactInfo skills experience education resumeFile resumeText'
      })
      .sort({ matchScore: -1, appliedAt: -1 }) // Sort by match score (highest first), then by date
      .lean();

    // Get resume analyses for these applications
    const applicationIds = applications.map(app => app._id);
    const resumeAnalyses = await ResumeJobAnalysis.find({
      applicationId: { $in: applicationIds }
    });

    // Create a map for quick lookup
    const analysisMap = new Map();
    resumeAnalyses.forEach(analysis => {
      if (analysis.applicationId) {
        analysisMap.set(analysis.applicationId.toString(), analysis);
      }
    });

    // Combine application data with analysis
    const enrichedApplications = applications.map(app => {
      const analysis = analysisMap.get(app._id.toString());
      return {
        ...app,
        resumeAnalysis: analysis ? {
          matchScore: analysis.matchScore,
          explanation: analysis.explanation,
          skillsMatched: analysis.skillsMatched,
          skillsGap: analysis.skillsGap,
          suggestions: analysis.suggestions
        } : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        jobId,
        jobTitle: job.title,
        companyName: job.companyName,
        totalApplications: applications.length,
        applications: enrichedApplications
      }
    });

  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications. Please try again.'
    });
  }
};

/**
 * Get resume analysis for a specific student-job combination
 * GET /api/jobs/:jobId/resume-analysis/:studentId
 */
export const getResumeAnalysis = async (req: Request, res: Response) => {
  try {
    const { jobId, studentId } = req.params;
    
    const analysis = await ResumeJobAnalysis.findOne({
      studentId: new Types.ObjectId(studentId),
      jobId: new Types.ObjectId(jobId)
    }).populate('studentId', 'personalInfo contactInfo')
      .populate('jobId', 'title companyName');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Resume analysis not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error fetching resume analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume analysis'
    });
  }
};

/**
 * Get all applications for the authenticated student with real-time status
 * GET /api/students/applications
 */
export const getStudentApplications = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?._id || user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find the student by userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        debug: { userId, userEmail: user?.email }
      });
    }

    // Get all applications for this student with comprehensive details
    const applications = await Application.find({ 
      studentId: student._id 
    })
    .populate('jobId', 'title companyName applicationDeadline status location workMode salary')
    .populate('recruiterId', 'companyName contactInfo')
    .sort({ appliedAt: -1 })
    .lean();

    // If no applications found, return empty array
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
        }
      });
    }

    // Transform applications to include comprehensive details and real-time status
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        try {
          // Get matching analysis from ResumeJobAnalysis
          const matchAnalysis = await ResumeJobAnalysis.findOne({
            studentId: student._id,
            jobId: app.jobId,
            applicationId: app._id
          }).lean();

          // Get status history
          const statusHistory = app.statusHistory || [];
          const latestStatus = statusHistory.length > 0 
            ? statusHistory[statusHistory.length - 1] 
            : { status: app.currentStatus, updatedAt: app.appliedAt };

          // Format job details
          const jobDetails = app.jobId as any;
          const jobSnapshot = (app.jobSnapshot || {}) as any;
          const recruiterDetails = app.recruiterId as any;

          return {
            _id: app._id,
            jobId: jobDetails?._id || app.jobId,
            jobTitle: jobDetails?.title || jobSnapshot.title || 'Job Title',
            companyName: jobDetails?.companyName || jobSnapshot.companyName || recruiterDetails?.companyName || 'Company',
            appliedDate: app.appliedAt,
            dateApplied: app.appliedAt,
            status: app.currentStatus || 'applied',
            currentStatus: app.currentStatus || 'applied',
            
            // Enhanced details for real-time tracking
            lastUpdated: latestStatus.updatedAt || app.appliedAt,
            lastStatusChange: latestStatus.updatedAt || app.appliedAt,
            statusHistory: statusHistory.slice(-3), // Last 3 status changes
            
            // Match analysis
            matchScore: matchAnalysis?.displayMatchScore || toDisplayMatchScore(matchAnalysis?.matchScore || app.matchScore || 0),
            matchAnalysis: matchAnalysis ? {
              overallMatch: matchAnalysis.displayMatchScore || toDisplayMatchScore(matchAnalysis.matchScore),
              explanation: matchAnalysis.explanation,
              skillsMatched: matchAnalysis.skillsMatched,
              skillsGap: matchAnalysis.skillsGap,
              suggestions: matchAnalysis.suggestions
            } : null,
            
            // Application details - using existing fields
            notes: app.shortlistReason || app.rejectionReason || '',
            
            // Job-specific details
            jobLocation: jobDetails?.locations || jobSnapshot.locations || 'Not specified',
            workMode: jobDetails?.workMode || jobSnapshot.workMode || 'Not specified',
            salary: jobDetails?.salary || jobSnapshot.salary,
            applicationDeadline: jobDetails?.applicationDeadline || jobSnapshot.applicationDeadline,
            jobSnapshot,
            
            // Notification status
            whatsappNotificationSent: app.whatsappNotificationSent || false,
            emailNotificationSent: app.emailNotificationSent || false,
            recruiterViewed: app.recruiterViewed || false,
            employerDeliveryStatus: app.employerDeliveryStatus || (app.recruiterId ? 'delivered_to_campuspe_employer' : 'awaiting_employer_connection'),
            submissionChannel: app.submissionChannel || 'campuspe',
            deliveryAttemptCount: app.deliveryAttemptCount || 0,
            lastDeliveryAttemptAt: app.lastDeliveryAttemptAt,
            nextDeliveryAttemptAt: app.nextDeliveryAttemptAt,
            employerDeliveredAt: app.employerDeliveredAt,
            
            // Real-time metadata
            lastChecked: new Date(),
            isActive: jobDetails?.status === 'active',
            canWithdraw: ['applied', 'under_review'].includes(app.currentStatus || 'applied'),
            
            // Interview details from interviews array if available
            interviews: app.interviews || [],
            
            // Additional feedback fields
            feedback: app.studentFeedback?.comments || '',
            rejectionReason: app.rejectionReason || ''
          };
        } catch (error) {
          console.error('Error processing application:', app._id, error);
          return {
            _id: app._id,
            jobId: app.jobId,
            jobTitle: 'Error loading job details',
            companyName: 'Unknown',
            appliedDate: app.appliedAt,
            status: app.currentStatus || 'applied',
            error: 'Failed to load application details'
          };
        }
      })
    );

    // Calculate status breakdown for dashboard analytics
    const statusBreakdown = applicationsWithDetails.reduce((acc, app) => {
      const status = app.status || 'applied';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Add missing status counts
    const allStatuses = ['applied', 'under_review', 'interview_scheduled', 'interviewed', 'selected', 'rejected', 'withdrawn'];
    allStatuses.forEach(status => {
      if (!statusBreakdown[status]) {
        statusBreakdown[status] = 0;
      }
    });

    console.log('✅ Successfully retrieved applications:', {
      studentName: `${student.firstName} ${student.lastName}`,
      totalApplications: applicationsWithDetails.length,
      statusBreakdown
    });

    res.json({
      success: true,
      data: applicationsWithDetails,
      message: `Found ${applicationsWithDetails.length} applications`,
      totalCount: applicationsWithDetails.length,
      statusBreakdown,
      lastUpdated: new Date(),
      realTimeData: true
    });

  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get resume analysis for the current authenticated user and specific job
 * GET /api/jobs/:jobId/resume-analysis/current
 */
export const getCurrentUserResumeAnalysis = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const user = req.user as any;
    const userId = user._id || user.userId;
    
    // Find the student by userId
    const student = await Student.findOne({ userId })
      .populate('userId', 'email phone whatsappNumber')
      .populate('collegeId', 'name shortName')
      .lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Find existing analysis for this student-job combination
    const analysis = await ResumeJobAnalysis.findOne({
      studentId: student._id,
      jobId: new Types.ObjectId(jobId),
      isActive: true
    }).populate('jobId', 'title companyName').lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No resume analysis found for this job',
        data: {
          studentProfile: {
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.userId && typeof student.userId === 'object' ? (student.userId as any).email || student.email || '' : student.email || '',
            phone: student.userId && typeof student.userId === 'object' ? (student.userId as any).phone || student.phoneNumber || '' : student.phoneNumber || '',
            whatsappNumber: student.userId && typeof student.userId === 'object' ? (student.userId as any).whatsappNumber || student.phoneNumber || '' : student.phoneNumber || '',
            collegeName: student.collegeId && typeof student.collegeId === 'object' ? (student.collegeId as any).name || '' : student.collegeName || '',
            shortName: student.collegeId && typeof student.collegeId === 'object' ? (student.collegeId as any).shortName || '' : '',
            profileCompleteness: student.profileCompleteness,
            isPlacementReady: student.isPlacementReady,
            skills: student.skills || [],
            education: student.education || [],
            experience: student.experience || [],
            jobPreferences: student.jobPreferences || null,
            resumeSummary: student.resumeAnalysis?.summary || student.resumeText || ''
          },
          analysis: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        analysis: {
          ...analysis,
          matchScore: analysis.displayMatchScore || toDisplayMatchScore(analysis.matchScore)
        },
        studentProfile: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.userId && typeof student.userId === 'object' ? (student.userId as any).email || student.email || '' : student.email || '',
          phone: student.userId && typeof student.userId === 'object' ? (student.userId as any).phone || student.phoneNumber || '' : student.phoneNumber || '',
          whatsappNumber: student.userId && typeof student.userId === 'object' ? (student.userId as any).whatsappNumber || student.phoneNumber || '' : student.phoneNumber || '',
          collegeName: student.collegeId && typeof student.collegeId === 'object' ? (student.collegeId as any).name || '' : student.collegeName || '',
          shortName: student.collegeId && typeof student.collegeId === 'object' ? (student.collegeId as any).shortName || '' : '',
          profileCompleteness: student.profileCompleteness,
          isPlacementReady: student.isPlacementReady,
          skills: student.skills || [],
          education: student.education || [],
          experience: student.experience || [],
          jobPreferences: student.jobPreferences || null,
          resumeSummary: student.resumeAnalysis?.summary || student.resumeText || ''
        }
      }
    });

  } catch (error) {
    console.error('Error fetching current user resume analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Test endpoint to generate analysis without applying (for testing persistence)
 * POST /api/jobs/:jobId/test-analysis
 */
export const testGenerateAnalysis = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const user = req.user as any;
    const userId = user._id || user.userId;
    
    // Find student by userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if student has resume content
    let resumeContent = student.resumeText || 
      (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
    
    if (!resumeContent) {
      resumeContent = `Test resume content for ${student.firstName} ${student.lastName}. Skills: JavaScript, React, Node.js. Experience: 2 years in web development.`;
    }

    // Perform AI resume analysis
    const matchResult = await AIResumeMatchingService.analyzeResumeMatch(
      resumeContent,
      job.description
    );

    // Save the analysis using upsert
    const analysisData = {
      studentId: student._id,
      jobId: new Types.ObjectId(jobId),
      matchScore: matchResult.matchScore,
      explanation: matchResult.explanation,
      suggestions: matchResult.suggestions,
      skillsMatched: matchResult.skillsMatched,
      skillsGap: matchResult.skillsGap,
      resumeText: resumeContent,
      resumeVersion: 1,
      jobTitle: job.title,
      jobDescription: job.description,
      companyName: job.companyName,
      isActive: true,
      analyzedAt: new Date()
    };

    const savedAnalysis = await ResumeJobAnalysis.findOneAndUpdate(
      { 
        studentId: student._id, 
        jobId: new Types.ObjectId(jobId) 
      },
      analysisData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Test analysis generated and saved successfully',
      data: {
        analysisId: savedAnalysis._id,
        matchScore: matchResult.matchScore,
        explanation: matchResult.explanation,
        suggestions: matchResult.suggestions,
        skillsMatched: matchResult.skillsMatched,
        skillsGap: matchResult.skillsGap
      }
    });

  } catch (error) {
    console.error('Error generating test analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Analyze resume for a job without applying
 * POST /api/jobs/:jobId/analyze-resume
 */
export const analyzeResumeOnly = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const user = req.user as any;
    const userId = user._id || user.userId;
    
    console.log('Analyze resume only - User ID:', userId);
    console.log('Analyze resume only - Job ID:', jobId);
    
    // Find student by userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        debug: `User ID: ${userId}, User email: ${user.email}`
      });
    }

    // Check if student has resume text
    let resumeContent = student.resumeText || 
      (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
    
    if (!resumeContent) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume before analyzing for this job'
      });
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const CentralizedMatchingService = require('../services/centralized-matching').default;
    const matchResult = await CentralizedMatchingService.getOrCalculateMatch(student._id, job._id);
    if (!matchResult) {
      return res.status(500).json({ success: false, message: 'Hybrid resume analysis failed' });
    }

    return res.status(200).json({
      success: true,
      message: 'Hybrid resume analysis completed successfully',
      data: {
        matchScore: matchResult.matchScore,
        explanation: matchResult.explanation,
        suggestions: matchResult.suggestions,
        skillsMatched: matchResult.skillsMatched,
        skillsGap: matchResult.skillsGap,
        matchingModel: matchResult.matchingModel,
        ruleBasedScore: matchResult.ruleBasedScore,
        aiScore: matchResult.aiScore,
        scoreBreakdown: matchResult.scoreBreakdown,
        analyzedAt: matchResult.analyzedAt
      }
    });

  } catch (error) {
    console.error('Analyze resume only error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
