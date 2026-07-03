import { Request, Response } from 'express';
import { Job } from '../models/Job';
import { Types } from 'mongoose';
import JobPostingService from '../services/job-posting';
import CareerAlertService from '../services/career-alerts';
import AIMatchingService from '../services/ai-matching';

// Get all jobs
export const getAllJobs = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.query;
        
        let filter = {};
        if (recruiterId) {
            filter = { recruiterId: new Types.ObjectId(recruiterId as string) };
        }
        
        const jobs = await Job.find(filter)
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 }); // Sort by newest first
            
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response) => {
    const { jobId } = req.params; // Extract the job ID from the request params
    try {
        const job = await Job.findById(jobId); // Find the job by its ID
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createJob = async (req: Request, res: Response) => {
    const jobData = req.body;
    const user = req.user as any;

    // Get recruiterId from authenticated user
    let recruiterId;
    try {
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recruiter profile not found. Please complete your recruiter registration first.' 
            });
        }
        recruiterId = recruiter._id;
    } catch (error) {
        console.error('Error finding recruiter:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error finding recruiter profile' 
        });
    }

    // Set the recruiterId from the authenticated user
    jobData.recruiterId = recruiterId;

    // Basic validation helper
    const validateJobData = (data: any) => {
        const errors: string[] = [];

        if (!data.title || typeof data.title !== 'string') errors.push('Invalid or missing title');
        if (!data.description || typeof data.description !== 'string') errors.push('Invalid or missing description');
        if (!data.companyName || typeof data.companyName !== 'string') errors.push('Invalid or missing companyName');
        if (!data.locations || !Array.isArray(data.locations) || data.locations.length === 0) errors.push('Invalid or missing locations');
        if (!data.workMode || !['remote', 'onsite', 'hybrid'].includes(data.workMode)) errors.push('Invalid or missing workMode');
        if (!data.jobType || !['full-time', 'part-time', 'internship', 'contract', 'freelance'].includes(data.jobType)) errors.push('Invalid or missing jobType');
        if (!data.department || typeof data.department !== 'string') errors.push('Invalid or missing department');
        if (!data.experienceLevel || !['entry', 'mid', 'senior', 'lead', 'executive'].includes(data.experienceLevel)) errors.push('Invalid or missing experienceLevel');
        if (typeof data.minExperience !== 'number' || data.minExperience < 0) errors.push('Invalid or missing minExperience');
        if (data.maxExperience !== undefined && (typeof data.maxExperience !== 'number' || data.maxExperience < 0)) errors.push('Invalid maxExperience');
        if (!data.salary || typeof data.salary !== 'object') errors.push('Invalid or missing salary');
        else {
            if (typeof data.salary.min !== 'number' || data.salary.min < 0) errors.push('Invalid salary.min');
            if (typeof data.salary.max !== 'number' || data.salary.max < 0) errors.push('Invalid salary.max');
            if (!data.salary.currency || typeof data.salary.currency !== 'string') errors.push('Invalid salary.currency');
        }
        if (!data.applicationDeadline || isNaN(Date.parse(data.applicationDeadline))) errors.push('Invalid or missing applicationDeadline');
        if (typeof data.totalPositions !== 'number' || data.totalPositions < 1) errors.push('Invalid or missing totalPositions');
        if (!data.interviewProcess || typeof data.interviewProcess !== 'object') errors.push('Invalid or missing interviewProcess');
        else {
            if (!Array.isArray(data.interviewProcess.rounds)) errors.push('Invalid interviewProcess.rounds');
            if (typeof data.interviewProcess.duration !== 'string') errors.push('Invalid interviewProcess.duration');
            if (!['online', 'offline', 'hybrid'].includes(data.interviewProcess.mode)) errors.push('Invalid interviewProcess.mode');
        }

        return errors;
    };

    const errors = validateJobData(jobData);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation errors', errors });
    }

    try {
        console.log('Creating job with data:', jobData);

        // First, try the AI-enhanced creation
        try {
            const newJob = await JobPostingService.createIntelligentJob(jobData);
            return res.status(201).json({
                success: true,
                message: 'Job posted successfully! Our AI will automatically analyze the description, extract key skills, and match it with qualified students. Matching students will receive personalized WhatsApp notifications.',
                data: newJob
            });
        } catch (aiError) {
            console.warn('AI job creation failed, falling back to basic creation:', aiError);

            // Fallback to basic job creation
            const newJob = new Job({
                ...jobData,
                status: 'active',
                postedAt: new Date(),
                lastModified: new Date(),
                views: 0,
                applications: []
            });

            const savedJob = await newJob.save();
            console.log('Job created successfully with basic method:', savedJob._id);

            // Trigger AI matching even for basic job creation
            try {
                console.log(`🚀 Triggering AI matching for basic job: ${savedJob._id}`);
                await CareerAlertService.processNewJobPosting(savedJob._id);
            } catch (matchingError) {
                console.error('Failed to trigger matching for basic job:', matchingError);
            }

            return res.status(201).json({
                success: true,
                message: 'Job created successfully with automatic AI matching enabled',
                data: savedJob
            });
        }
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create job',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Update an existing job
export const updateJob = async (req: Request, res: Response) => {
    const { jobId } = req.params; // Get the job ID from the params
    const {
        title,
        description,
        jobType,
        department,
        recruiterId,
        companyName,
        locations,
        workMode,
        requirements,
        experienceLevel,
        minExperience,
        maxExperience,
        educationRequirements,
        salary,
        benefits,
        applicationDeadline,
        totalPositions,
        filledPositions,
        targetColleges,
        targetCourses,
        allowDirectApplications,
        interviewProcess,
        status,
        isUrgent,
        matchingKeywords,
    } = req.body;

    try {
        const updatedJob = await Job.findByIdAndUpdate(
            jobId,
            {
                title,
                description,
                jobType,
                department,
                recruiterId,
                companyName,
                locations,
                workMode,
                requirements,
                experienceLevel,
                minExperience,
                maxExperience,
                educationRequirements,
                salary,
                benefits,
                applicationDeadline,
                totalPositions,
                filledPositions,
                targetColleges,
                targetCourses,
                allowDirectApplications,
                interviewProcess,
                status,
                isUrgent,
                matchingKeywords,
                lastModified: new Date(), // Update the last modified timestamp
            },
            { new: true } // Return the updated job object
        );

        if (!updatedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.status(200).json(updatedJob); // Return the updated job
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a job
export const deleteJob = async (req: Request, res: Response) => {
    const { jobId } = req.params; // Get the job ID from the params
    try {
        const deletedJob = await Job.findByIdAndDelete(jobId); // Find and delete the job by ID
        if (!deletedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({ message: 'Job deleted successfully' }); // Return success message
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Publish job and trigger matching
export const publishJob = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    
    try {
        await JobPostingService.publishJob(new Types.ObjectId(jobId));
        res.status(200).json({
            success: true,
            message: 'Job published successfully and matching process initiated'
        });
    } catch (error) {
        console.error('Error publishing job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish job',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get job matching statistics
export const getJobMatchingStats = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    
    try {
        const stats = await JobPostingService.getJobMatchingStats(new Types.ObjectId(jobId));
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting job matching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matching statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Find matching students for a job with detailed student information
export const findMatchingStudents = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { threshold = 0.70, limit = 50, includeDetails = true } = req.query;
    
    try {
        const matches = await AIMatchingService.findMatchingStudents(
            new Types.ObjectId(jobId), 
            parseFloat(threshold as string)
        );
        
        const limitedMatches = matches.slice(0, parseInt(limit as string));
        
        // If detailed information is requested, populate student data
        if (includeDetails === 'true') {
            const { Student } = require('../models');
            
            const enrichedMatches = await Promise.all(limitedMatches.map(async (match) => {
                const student = await Student.findById(match.studentId)
                    .populate('userId', 'email phone whatsappNumber')
                    .populate('collegeId', 'name shortName')
                    .lean();
                
                if (!student) {
                    console.warn(`Student ${match.studentId} not found`);
                    return null;
                }

                // Enhanced contact info retrieval with comprehensive fallback
                let email = '';
                let phone = '';
                let whatsappNumber = '';

                // Method 1: Check User model fields first (most reliable)
                if (student.userId && typeof student.userId === 'object') {
                    email = student.userId.email || '';
                    phone = student.userId.phone || '';
                    whatsappNumber = student.userId.whatsappNumber || student.userId.phone || '';
                }

                // Method 2: Check Student model fields as fallback
                if (!phone || !email) {
                    email = email || student.email || '';
                    phone = phone || student.phoneNumber || student.phone || '';
                    whatsappNumber = whatsappNumber || student.whatsappNumber || phone;
                }

                // Method 3: Final fallback - check alternative field names
                if (!phone) {
                    phone = (student as any).contactNumber || (student as any).mobile || '';
                    whatsappNumber = whatsappNumber || phone;
                }

                console.log(`📋 Enhanced Contact Data for ${student.firstName} ${student.lastName}:`, {
                    hasUserId: !!student.userId,
                    userEmail: student.userId?.email || 'N/A',
                    userPhone: student.userId?.phone || 'N/A',
                    userWhatsapp: student.userId?.whatsappNumber || 'N/A',
                    studentEmail: student.email || 'N/A',
                    studentPhone: student.phoneNumber || 'N/A',
                    studentWhatsapp: (student as any).whatsappNumber || 'N/A',
                    finalEmail: email,
                    finalPhone: phone,
                    finalWhatsapp: whatsappNumber,
                    collegeName: student.collegeId?.name
                });
                
                return {
                    studentId: match.studentId,
                    matchScore: Math.round(match.finalMatchScore * 100),
                    skillMatch: Math.round(match.skillMatch * 100),
                    toolMatch: Math.round(match.toolMatch * 100),
                    categoryMatch: match.categoryMatch,
                    workModeMatch: match.workModeMatch,
                    semanticSimilarity: Math.round(match.semanticSimilarity * 100),
                    matchedSkills: match.matchedSkills,
                    matchedTools: match.matchedTools,
                    // Student details with fallback for contact info
                    studentDetails: {
                        firstName: student.firstName || '',
                        lastName: student.lastName || '',
                        email: email,
                        phone: phone,
                        whatsappNumber: whatsappNumber,
                        collegeName: student.collegeId?.name || '',
                        collegeShortName: student.collegeId?.shortName || '',
                        skills: student.skills?.slice(0, 5) || [],
                        graduationYear: student.graduationYear || 0,
                        cgpa: student.cgpa || 0,
                        profileCompleteness: student.profileCompleteness || 0,
                        isPlacementReady: student.isPlacementReady || false
                    }
                };
            }));

            // Filter out null results (students not found)
            const validMatches = enrichedMatches.filter(match => match !== null);

            res.status(200).json({
                success: true,
                data: {
                    jobId: jobId,
                    totalMatches: matches.length,
                    returnedMatches: validMatches.length,
                    threshold: parseFloat(threshold as string),
                    matches: validMatches
                }
            });
        } else {
            // Return basic match data without student details
            res.status(200).json({
                success: true,
                data: {
                    jobId: jobId,
                    totalMatches: matches.length,
                    returnedMatches: limitedMatches.length,
                    threshold: parseFloat(threshold as string),
                    matches: limitedMatches.map(match => ({
                        studentId: match.studentId,
                        matchScore: Math.round(match.finalMatchScore * 100),
                        skillMatch: Math.round(match.skillMatch * 100),
                        toolMatch: Math.round(match.toolMatch * 100),
                        categoryMatch: match.categoryMatch,
                        workModeMatch: match.workModeMatch,
                        semanticSimilarity: Math.round(match.semanticSimilarity * 100),
                        matchedSkills: match.matchedSkills,
                        matchedTools: match.matchedTools
                    }))
                }
            });
        }
    } catch (error) {
        console.error('Error finding matching students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find matching students',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Trigger manual job alerts
export const triggerJobAlerts = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { threshold = 0.70 } = req.body;
    
    try {
        // Process job posting and send alerts
        await CareerAlertService.processNewJobPosting(new Types.ObjectId(jobId));
        
        res.status(200).json({
            success: true,
            message: 'Job alerts triggered successfully'
        });
    } catch (error) {
        console.error('Error triggering job alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger job alerts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Send WhatsApp messages to selected students
export const sendWhatsAppToStudents = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { studentIds, customMessage, includeJobDetails = true } = req.body;
    
    try {
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student IDs array is required and cannot be empty'
            });
        }

        const { Job, Student } = require('../models');
        
        // Get job details
        const job = await Job.findById(jobId).lean();
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Get student details with enhanced error handling and contact info validation
        const students = await Student.find({
            _id: { $in: studentIds.map((id: string) => new Types.ObjectId(id)) }
        }).populate('userId', 'phone whatsappNumber email name').lean();

        console.log(`📊 Found ${students.length} students for messaging out of ${studentIds.length} requested`);

        const results = [];
        const phoneNumbers = new Set(); // Track phone numbers to avoid duplicates
        
        for (const student of students) {
            try {
                // Enhanced phone number retrieval with validation
                let phoneNumber = '';
                
                // Try multiple sources for phone number
                if (student.userId && typeof student.userId === 'object') {
                    phoneNumber = (student.userId as any).whatsappNumber || 
                                 (student.userId as any).phone || '';
                }
                
                // Fallback to student model
                if (!phoneNumber) {
                    phoneNumber = (student as any).whatsappNumber || 
                                 (student as any).phoneNumber || 
                                 (student as any).phone || '';
                }

                // Validate phone number format
                if (!phoneNumber || phoneNumber.length < 10) {
                    console.log(`❌ Invalid phone number for student ${student.firstName}: "${phoneNumber}"`);
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        status: 'failed',
                        reason: `Invalid phone number: ${phoneNumber || 'empty'}`
                    });
                    continue;
                }

                // Check for duplicates (same phone number)
                if (phoneNumbers.has(phoneNumber)) {
                    console.log(`⚠️  Duplicate phone number detected: ${phoneNumber} for ${student.firstName}`);
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        status: 'skipped',
                        reason: 'Duplicate phone number - message already sent'
                    });
                    continue;
                }
                
                phoneNumbers.add(phoneNumber);
                console.log(`📱 Processing message for ${student.firstName} ${student.lastName} at ${phoneNumber}`);

                // Prepare message data
                let messageData;
                
                if (customMessage) {
                    // Send custom message
                    const { sendWhatsAppMessage } = require('../services/whatsapp');
                    const success = await sendWhatsAppMessage(phoneNumber, customMessage);
                    
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        phoneNumber: phoneNumber,
                        status: success ? 'sent' : 'failed',
                        message: customMessage
                    });
                } else if (includeJobDetails) {
                    // Send structured job notification
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
                    let locationInfo = job.workMode || 'Remote';
                    if (job.locations && job.locations.length > 0) {
                        const location = job.locations[0];
                        if (location.city && location.state) {
                            locationInfo = `${location.city}, ${location.state}`;
                        }
                        if (location.isRemote) {
                            locationInfo = 'Remote';
                        } else if (location.hybrid) {
                            locationInfo = `${locationInfo} (Hybrid)`;
                        }
                    }

                    messageData = {
                        jobTitle: job.title,
                        company: job.companyName,
                        location: locationInfo,
                        salary: salaryInfo,
                        matchScore: "85", // Default for manual sends
                        personalizedMessage: `Great opportunity at ${job.companyName}!`,
                        jobLink: `https://campuspe.com/jobs/${jobId}`
                    };

                    const result = await sendJobMatchNotification(phoneNumber, messageData);
                    
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        phoneNumber: phoneNumber,
                        status: result.success ? 'sent' : 'failed',
                        message: result.success ? 'Job notification sent' : result.message,
                        webhookData: messageData
                    });
                }

                // Save notification record
                const { Notification } = require('../models');
                await new Notification({
                    recipientId: student._id,
                    recipientType: 'student',
                    title: `Job Alert: ${job.title}`,
                    message: customMessage || `New job opportunity at ${job.companyName}`,
                    notificationType: 'job_match',
                    channels: {
                        whatsapp: true
                    },
                    deliveryStatus: {
                        whatsapp: results[results.length - 1]?.status === 'sent' ? 'sent' : 'failed'
                    },
                    relatedJobId: jobId,
                    priority: 'medium'
                }).save();

            } catch (studentError) {
                console.error(`Error sending message to student ${student._id}:`, studentError);
                results.push({
                    studentId: student._id,
                    studentName: `${student.firstName} ${student.lastName}`,
                    status: 'failed',
                    reason: 'Message sending failed',
                    error: studentError instanceof Error ? studentError.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.status === 'sent').length;
        const failureCount = results.filter(r => r.status === 'failed').length;

        res.status(200).json({
            success: true,
            message: `WhatsApp messages sent to ${successCount} students, ${failureCount} failed`,
            data: {
                totalStudents: students.length,
                successCount,
                failureCount,
                results
            }
        });

    } catch (error) {
        console.error('Error sending WhatsApp messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send WhatsApp messages',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get WhatsApp notification history for a job
export const getJobNotificationHistory = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    try {
        const { Notification } = require('../models');
        
        const skip = (Number(page) - 1) * Number(limit);
        
        const notifications = await Notification.find({
            relatedJobId: jobId,
            notificationType: 'job_match'
        })
        .populate('recipientId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

        const total = await Notification.countDocuments({
            relatedJobId: jobId,
            notificationType: 'job_match'
        });

        const enrichedNotifications = notifications.map((notification: any) => ({
            id: notification._id,
            studentName: notification.recipientId ? 
                `${notification.recipientId.firstName} ${notification.recipientId.lastName}` : 
                'Unknown Student',
            title: notification.title,
            message: notification.message,
            status: notification.deliveryStatus?.whatsapp || 'unknown',
            sentAt: notification.createdAt,
            channels: notification.channels,
            priority: notification.priority
        }));

        res.status(200).json({
            success: true,
            data: {
                notifications: enrichedNotifications,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    count: notifications.length,
                    totalRecords: total
                }
            }
        });

    } catch (error) {
        console.error('Error fetching notification history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
