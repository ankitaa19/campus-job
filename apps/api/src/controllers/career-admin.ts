import { Request, Response } from 'express';
import CareerAlertService from '../services/career-alerts';
import JobPostingService from '../services/job-posting';
import AIMatchingService from '../services/ai-matching';
import SimpleScheduler from '../services/simple-scheduler';
import { Types } from 'mongoose';

// Define interfaces for better type safety
interface JobMatch {
    studentId: string;
    jobTitle: string;
    company: string;
    matchScore: number;
    timestamp: Date;
}

interface DailyStats {
    [day: string]: {
        alerts: number;
        delivered: number;
    };
}

interface CompanyStats {
    [company: string]: number;
}

interface JobData {
    _id: string;
    title: string;
    companyName: string;
}

interface NotificationData {
    recipientId: string;
    relatedJobId: {
        title?: string;
        companyName?: string;
    } | null;
    metadata?: {
        matchScore?: number;
    };
    createdAt: Date;
    deliveryStatus?: {
        whatsapp?: string;
    };
}

// Get system statistics
export const getSystemStats = async (req: Request, res: Response) => {
    try {
        const Job = require('../models/Job').Job;
        const Student = require('../models/Student').Student;
        const Notification = require('../models/Notification').Notification;

        // Get basic counts
        const [
            totalJobs,
            activeJobs,
            totalStudents,
            placementReadyStudents,
            todayNotifications
        ] = await Promise.all([
            Job.countDocuments(),
            Job.countDocuments({ status: 'active' }),
            Student.countDocuments({ isActive: true }),
            Student.countDocuments({ isActive: true, isPlacementReady: true }),
            Notification.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                },
                notificationType: 'job_match'
            })
        ]);

        // Get recent job matches
        const recentMatches = await Notification.find({
            notificationType: 'job_match',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).populate('relatedJobId', 'title companyName').limit(10);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalJobs,
                    activeJobs,
                    totalStudents,
                    placementReadyStudents,
                    todayNotifications
                },
                recentActivity: {
                    jobMatchesLast24h: recentMatches.length,
                    recentMatches: recentMatches.map((match: NotificationData): JobMatch => ({
                        studentId: match.recipientId,
                        jobTitle: match.relatedJobId?.title || 'Unknown',
                        company: match.relatedJobId?.companyName || 'Unknown',
                        matchScore: match.metadata?.matchScore || 0,
                        timestamp: match.createdAt
                    }))
                },
                systemHealth: {
                    aiServiceActive: !!process.env.OPENAI_API_KEY,
                    whatsappServiceActive: !!process.env.WABB_API_KEY,
                    schedulerStatus: SimpleScheduler.getStatus()
                }
            }
        });
    } catch (error) {
        console.error('Error getting system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Process all active jobs for matching
export const processAllActiveJobs = async (req: Request, res: Response) => {
    try {
        const Job = require('../models/Job').Job;
        
        const activeJobs = await Job.find({
            status: 'active',
            applicationDeadline: { $gt: new Date() }
        }).select('_id title companyName').lean();

        // Process in background
        setImmediate(async () => {
            const jobIds = activeJobs.map((job: JobData) => job._id);
            await JobPostingService.processMultipleJobs(jobIds);
        });

        res.status(200).json({
            success: true,
            message: `Processing ${activeJobs.length} active jobs in background`,
            data: {
                jobsToProcess: activeJobs.length,
                jobs: activeJobs.map((job: JobData) => ({
                    id: job._id,
                    title: job.title,
                    company: job.companyName
                }))
            }
        });
    } catch (error) {
        console.error('Error processing all active jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process active jobs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Trigger daily job alerts manually
export const triggerDailyAlerts = async (req: Request, res: Response) => {
    try {
        // Run in background
        setImmediate(async () => {
            await SimpleScheduler.triggerDailyJobAlerts();
        });

        res.status(200).json({
            success: true,
            message: 'Daily job alerts triggered successfully'
        });
    } catch (error) {
        console.error('Error triggering daily alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger daily alerts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get matching performance analytics
export const getMatchingAnalytics = async (req: Request, res: Response) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        const Notification = require('../models/Notification').Notification;
        
        // Get notifications from last N days
        const notifications = await Notification.find({
            notificationType: 'job_match',
            createdAt: { $gte: daysAgo }
        }).populate('relatedJobId', 'title companyName');

        // Calculate analytics
        const totalAlerts = notifications.length;
        const successfulDeliveries = notifications.filter((n: NotificationData) => 
            n.deliveryStatus?.whatsapp === 'delivered' || n.deliveryStatus?.whatsapp === 'sent'
        ).length;
        
        const avgMatchScore = notifications.reduce((sum: number, n: NotificationData) => 
            sum + (n.metadata?.matchScore || 0), 0
        ) / (totalAlerts || 1);

        // Group by day
        const dailyStats: DailyStats = {};
        notifications.forEach((notification: NotificationData) => {
            const day = notification.createdAt.toISOString().split('T')[0];
            if (!dailyStats[day]) {
                dailyStats[day] = { alerts: 0, delivered: 0 };
            }
            dailyStats[day].alerts++;
            if (notification.deliveryStatus?.whatsapp === 'delivered' || 
                notification.deliveryStatus?.whatsapp === 'sent') {
                dailyStats[day].delivered++;
            }
        });

        // Top companies by alerts
        const companyStats: CompanyStats = {};
        notifications.forEach((notification: NotificationData) => {
            const company = notification.relatedJobId?.companyName || 'Unknown';
            companyStats[company] = (companyStats[company] || 0) + 1;
        });

        const topCompanies = Object.entries(companyStats)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 10)
            .map(([company, count]) => ({ company, alerts: count }));

        res.status(200).json({
            success: true,
            data: {
                period: `Last ${days} days`,
                summary: {
                    totalAlerts,
                    successfulDeliveries,
                    deliveryRate: Math.round((successfulDeliveries / (totalAlerts || 1)) * 100),
                    avgMatchScore: Math.round(avgMatchScore)
                },
                dailyBreakdown: Object.entries(dailyStats).map(([date, stats]) => ({
                    date,
                    alerts: (stats as { alerts: number; delivered: number }).alerts,
                    delivered: (stats as { alerts: number; delivered: number }).delivered
                })),
                topCompanies
            }
        });
    } catch (error) {
        console.error('Error getting matching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matching analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Test AI analysis on sample data
export const testAIAnalysis = async (req: Request, res: Response) => {
    try {
        const { text, type = 'job' } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required for analysis'
            });
        }

        let result;
        if (type === 'job') {
            result = await AIMatchingService.analyzeJobDescription(text);
        } else if (type === 'resume') {
            result = await AIMatchingService.analyzeStudentResume(text);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "job" or "resume"'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                analysisType: type,
                result,
                processedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error testing AI analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test AI analysis',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get notification history for recruiter
export const getNotificationHistory = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Import models
        const { Notification } = await import('../models/Notification');
        const { Job } = await import('../models/Job');

        // Find jobs for this recruiter
        const recruiterJobs = await Job.find({ recruiterId: new Types.ObjectId(recruiterId) }).select('_id');
        const jobIds = recruiterJobs.map(job => job._id);

        // Get notifications for recruiter's jobs
        const notifications = await Notification.find({
            relatedJobId: { $in: jobIds }
        })
        .populate('relatedJobId', 'title companyName')
        .populate('recipientId', 'personalInfo.firstName personalInfo.lastName personalInfo.phone')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

        const totalNotifications = await Notification.countDocuments({
            relatedJobId: { $in: jobIds }
        });

        // Group notifications by date for summary
        const today = new Date();
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayCount = await Notification.countDocuments({
            relatedJobId: { $in: jobIds },
            createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
        });

        const last7DaysCount = await Notification.countDocuments({
            relatedJobId: { $in: jobIds },
            createdAt: { $gte: last7Days }
        });

        const last30DaysCount = await Notification.countDocuments({
            relatedJobId: { $in: jobIds },
            createdAt: { $gte: last30Days }
        });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalNotifications / Number(limit)),
                    totalNotifications,
                    hasNext: Number(page) * Number(limit) < totalNotifications
                },
                summary: {
                    today: todayCount,
                    last7Days: last7DaysCount,
                    last30Days: last30DaysCount
                }
            }
        });
    } catch (error) {
        console.error('Error getting notification history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get candidate management data for recruiter
export const getCandidateManagement = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const { page = 1, limit = 20, status = 'all' } = req.query;

        // Import models
        const { Application } = await import('../models/Application');
        const { Job } = await import('../models/Job');
        const { Notification } = await import('../models/Notification');

        // Find jobs for this recruiter
        const recruiterJobs = await Job.find({ recruiterId: new Types.ObjectId(recruiterId) }).select('_id title');
        const jobIds = recruiterJobs.map(job => job._id);

        // Build query for applications
        let applicationQuery: any = { jobId: { $in: jobIds } };
        if (status !== 'all') {
            applicationQuery.status = status;
        }

        // Get applications with candidate data
        const applications = await Application.find(applicationQuery)
            .populate('studentId', 'personalInfo academicInfo resumeInfo')
            .populate('jobId', 'title companyName')
            .sort({ appliedAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const totalApplications = await Application.countDocuments(applicationQuery);

        // Get notification count for each candidate
        const candidatesWithNotifications = await Promise.all(
            applications.map(async (app: any) => {
                const notificationCount = await Notification.countDocuments({
                    recipientId: app.studentId._id,
                    relatedJobId: { $in: jobIds }
                });

                return {
                    ...app.toObject(),
                    notificationsSent: notificationCount
                };
            })
        );

        // Get summary stats
        const statusStats = await Application.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                candidates: candidatesWithNotifications,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalApplications / Number(limit)),
                    totalCandidates: totalApplications,
                    hasNext: Number(page) * Number(limit) < totalApplications
                },
                summary: {
                    totalApplications,
                    statusBreakdown: statusStats.reduce((acc: any, stat: any) => {
                        acc[stat._id] = stat.count;
                        return acc;
                    }, {})
                }
            }
        });
    } catch (error) {
        console.error('Error getting candidate management data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get candidate management data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get system configuration
export const getSystemConfig = async (req: Request, res: Response) => {
    try {
        const config = {
            matching: {
                defaultThreshold: 0.70,
                skillMatchWeight: 0.5,
                toolMatchWeight: 0.1,
                categoryMatchWeight: 0.1,
                workModeMatchWeight: 0.1,
                semanticSimilarityWeight: 0.2
            },
            alerts: {
                dailySchedule: '9:00 AM IST',
                rateLimitDelay: 2000, // ms between messages
                maxRetriesPerAlert: 3
            },
            ai: {
                modelUsed: 'claude-3-haiku-20240307',
                embeddingModel: 'simple-hash-based',
                provider: 'Anthropic Claude',
                enabled: !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY)
            },
            whatsapp: {
                provider: 'WABB.in',
                enabled: !!process.env.WABB_API_KEY
            }
        };

        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error getting system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system configuration',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
