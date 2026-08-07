import { Notification } from '../models';
import { sendWhatsAppMessage, sendJobMatchNotification } from './whatsapp';
import { Types } from 'mongoose';
import { EmailClient } from '@azure/communication-email';
import { freshnessCutoff } from './job-intelligence';

interface AlertData {
    studentId: Types.ObjectId;
    jobId: Types.ObjectId;
    matchScore: number;
    matchedSkills: string[];
    matchedTools: string[];
    jobTitle: string;
    companyName: string;
    workMode: string;
    studentName: string;
    studentPhone?: string;
    studentEmail?: string;
    studentUserId?: Types.ObjectId;
    jobUrl: string;
    jobData?: any; // Include job data for salary and location info
}

class CareerAlertService {
    private readonly minimumAlertScore = Number(process.env.JOB_ALERT_MIN_MATCH_SCORE ?? 70);

    /**
     * Step 6: Send Personalized WhatsApp Alerts via Webhook
     */
    async sendJobMatchAlert(alertData: AlertData): Promise<void> {
        try {
            const {
                studentId,
                jobId,
                matchScore,
                matchedSkills,
                matchedTools,
                jobTitle,
                companyName,
                workMode,
                studentName,
                studentPhone,
                studentEmail,
                studentUserId,
                jobUrl,
                jobData
            } = alertData;

            // Check if match score is above 70%
            // Note: matchScore can be either decimal (0.0-1.0) or percentage (0-100)
            let matchPercentage: number;
            if (matchScore <= 1.0) {
                // Decimal format - convert to percentage
                matchPercentage = Math.round(matchScore * 100);
            } else {
                // Already in percentage format
                matchPercentage = Math.round(matchScore);
            }
            
            if (matchPercentage < this.minimumAlertScore) {
                console.log(`Match score ${matchPercentage}% below threshold (${this.minimumAlertScore}%) for student ${studentName}`);
                return;
            }

            // The in-app record is created before external delivery. It makes
            // the opportunity visible even when a provider is unavailable and
            // the unique upsert prevents duplicate alerts on a job refresh.
            const isNewAlert = await this.saveNotificationRecord({
                studentId,
                studentUserId,
                jobId,
                message: `A ${jobTitle} role at ${companyName} matches your profile with a ${matchPercentage}% Match Score. Apply now on CampusPe.`,
                matchScore: matchPercentage,
                deliveryStatus: 'pending'
            });
            if (!isNewAlert) {
                console.log(`Duplicate job alert suppressed for student ${studentId} and job ${jobId}`);
                return;
            }

            if (!studentPhone) {
                console.warn(`No WhatsApp number found for student ${studentId}`);
            }

            // Generate AI personalized message
            const topSkills = matchedSkills.slice(0, 3).join(', ');
            const topTools = matchedTools.length > 0 ? `, ${matchedTools.slice(0, 2).join(', ')}` : '';
            const personalizedMessage = `Your skills in ${topSkills}${topTools} make you an excellent fit for this role.`;

            // Format salary information
            let salaryInfo = 'Competitive';
            if (jobData && jobData.salary && jobData.salary.min && jobData.salary.max) {
                const currency = jobData.salary.currency === 'INR' ? '₹' : jobData.salary.currency;
                const minLPA = Math.round(jobData.salary.min / 100000);
                const maxLPA = Math.round(jobData.salary.max / 100000);
                salaryInfo = `${currency}${minLPA}-${maxLPA} LPA`;
            }

            // Format location information
            let locationInfo = workMode || 'Remote';
            if (jobData && jobData.locations && jobData.locations.length > 0) {
                const location = jobData.locations[0];
                if (location.city && location.state) {
                    locationInfo = `${location.city}, ${location.state}`;
                }
                if (location.isRemote) {
                    locationInfo = 'Remote';
                } else if (location.hybrid) {
                    locationInfo = `${locationInfo} (Hybrid)`;
                }
            }

            // Prepare webhook data in the required format
            const webhookData = {
                jobTitle: jobTitle,
                company: companyName,
                location: locationInfo,
                salary: salaryInfo,
                matchScore: matchPercentage.toString(),
                personalizedMessage: personalizedMessage,
                jobLink: jobUrl || `https://campuspe.com/jobs/${jobId}`
            };

            // Send notification via webhook
            const result = studentPhone
                ? await sendJobMatchNotification(studentPhone, webhookData)
                : { success: false, message: 'No WhatsApp number configured' };

            if (result.success) {
                await this.updateDeliveryStatus(studentUserId || studentId, jobId, 'whatsapp', 'sent');

                console.log(`✅ Job match notification sent successfully to ${studentName} (${studentPhone}) - ${matchPercentage}% match`);
            } else {
                console.error(`❌ Failed to send job match notification to ${studentName}:`, result.message);
                
                await this.updateDeliveryStatus(studentUserId || studentId, jobId, 'whatsapp', 'failed');
            }

            const emailStatus = await this.sendJobMatchEmail(studentEmail, jobTitle, companyName, matchPercentage, jobUrl);
            await this.updateDeliveryStatus(studentUserId || studentId, jobId, 'email', emailStatus);

        } catch (error) {
            console.error('Error sending job match alert:', error);
            throw error;
        }
    }

    /**
     * Process Job Posting - Find and Alert Matching Students
     */
    async processNewJobPosting(jobId: Types.ObjectId): Promise<void> {
        try {
            console.log(`🔍 Processing new job posting: ${jobId}`);

            // Get job details first
            const Job = require('../models/Job').Job;
            const Student = require('../models/Student').Student;
            const job = await Job.findById(jobId).lean();

            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }

            // Get all active students (not just placement ready to ensure comprehensive matching)
            const students = await Student.find({
                isActive: true
                // Removed isPlacementReady filter to check all active students
            }).populate('userId', '_id email phone whatsappNumber').lean();

            console.log(`Found ${students.length} total active students to check for matches`);

            const matches: any[] = [];
            const CentralizedMatchingService = require('./centralized-matching').default;
            let processedCount = 0;
            let matchCount = 0;

            // Check each student for match using centralized matching service
            for (const student of students) {
                try {
                    processedCount++;
                    
                    if (!student.userId) {
                        console.warn(`Student ${student._id} has no user data`);
                        continue;
                    }

                    // Use centralized matching service to ensure consistency and caching
                    const matchResult = await CentralizedMatchingService.getOrCalculateMatch(
                        student._id,
                        jobId
                    );

                    if (!matchResult) {
                        console.warn(`No match result for student ${student._id}`);
                        continue;
                    }

                    console.log(`Student ${student.firstName} ${student.lastName}: ${matchResult.matchScore}% match score${matchResult.cached ? ' (cached)' : ''}`);

                    // Check if match score is above 70%
                    if (matchResult.matchScore >= this.minimumAlertScore) {
                        matchCount++;
                        const studentPhone = student.userId.whatsappNumber || student.userId.phone;

                        matches.push({
                            studentId: student._id,
                            jobId: jobId,
                            finalMatchScore: matchResult.displayMatchScore || matchResult.matchScore,
                            matchedSkills: matchResult.skillsMatched || matchResult.matchedSkills || [],
                            matchedTools: matchResult.matchedTools || [], // From centralized service
                            studentName: `${student.firstName} ${student.lastName}`,
                            studentPhone: studentPhone,
                            studentEmail: student.userId.email,
                            studentUserId: student.userId._id,
                            matchScore: matchResult.displayMatchScore || matchResult.matchScore
                        });

                        console.log(`✅ Student ${student.firstName} ${student.lastName} matched with ${matchResult.matchScore}% score${matchResult.cached ? ' (cached)' : ''}`);
                    } else {
                        console.log(`❌ Student ${student.firstName} ${student.lastName} scored ${matchResult.matchScore}% (below ${this.minimumAlertScore}% threshold)`);
                    }

                    // Progress logging every 20 students
                    if (processedCount % 20 === 0) {
                        console.log(`📈 Progress: ${processedCount}/${students.length} students processed, ${matchCount} matches found`);
                    }

                } catch (studentError) {
                    console.error(`Error processing student ${student._id}:`, studentError);
                }
            }

            console.log(`Found ${matches.length} high-match students (≥70%) for job ${jobId}`);

            if (matches.length === 0) {
                console.log(`⚠️ No students found with 70%+ match for job "${job.title}" at ${job.companyName}`);
                return;
            }

            console.log(`📱 Sending WhatsApp notifications to ${matches.length} matched students...`);

            // Send alerts to matched students
            let sentCount = 0;
            let failedCount = 0;
            
            for (const match of matches) {
                try {
                    const alertData: AlertData = {
                        studentId: match.studentId,
                        jobId: match.jobId,
                        matchScore: match.finalMatchScore, // Use percentage format consistently
                        matchedSkills: match.matchedSkills,
                        matchedTools: match.matchedTools,
                        jobTitle: job.title,
                        companyName: job.companyName,
                        workMode: job.workMode,
                        studentName: match.studentName,
                        studentPhone: match.studentPhone,
                        studentEmail: match.studentEmail,
                        studentUserId: match.studentUserId,
                        jobUrl: `${process.env.FRONTEND_URL || 'https://campuspe.com'}/jobs/${jobId}`,
                        jobData: job // Pass the complete job data
                    };

                    // Send alert with a small delay to avoid rate limiting
                    await this.sendJobMatchAlert(alertData);
                    sentCount++;
                    await this.delay(2000); // 2-second delay between messages

                } catch (studentError) {
                    console.error(`Error processing alert for student ${match.studentId}:`, studentError);
                    failedCount++;
                }
            }

            console.log(`✅ Completed job ${job.title} at ${job.companyName}:`);
            console.log(`   📊 ${processedCount} students analyzed`);
            console.log(`   🎯 ${matches.length} students matched (≥70%)`);
            console.log(`   📱 ${sentCount} WhatsApp notifications sent`);
            console.log(`   ❌ ${failedCount} notifications failed`);

        } catch (error) {
            console.error(`Error processing job posting ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Batch Process - Check for new job matches daily
     */
    async processDailyJobAlerts(): Promise<void> {
        try {
            console.log('🕐 Starting daily job alert processing...');

            const Job = require('../models/Job').Job;
            
            // Get jobs posted in the last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const recentJobs = await Job.find({
                status: 'active',
                createdAt: { $gte: yesterday }
            }).select('_id title companyName workMode locations salary').lean();

            console.log(`Found ${recentJobs.length} recent jobs to process`);

            for (const job of recentJobs) {
                try {
                    await this.processNewJobPosting(job._id);
                    await this.delay(5000); // 5-second delay between job processing
                } catch (jobError) {
                    console.error(`Error processing job ${job._id}:`, jobError);
                }
            }

            console.log('✅ Daily job alert processing completed');

        } catch (error) {
            console.error('Error in daily job alert processing:', error);
            throw error;
        }
    }

    /**
     * Student Profile Update - Check for new matches
     */
    async processStudentProfileUpdate(studentId: Types.ObjectId): Promise<void> {
        try {
            console.log(`👤 Processing profile update for student: ${studentId}`);

            const Job = require('../models/Job').Job;
            const Student = require('../models/Student').Student;

            // Get active jobs
            const activeJobs = await Job.find({
                status: 'active',
                applicationDeadline: { $gt: new Date() },
                postedAt: { $gte: freshnessCutoff() }
            }).select('_id title companyName workMode locations salary').lean();

            const student = await Student.findById(studentId)
                .populate('userId', 'email phone whatsappNumber')
                .lean();

            if (!student || !student.userId) {
                console.warn(`Student ${studentId} not found`);
                return;
            }

            let alertsSent = 0;
            const CentralizedMatchingService = require('./centralized-matching').default;
            await CentralizedMatchingService.invalidateStudentCache(studentId);

            // Check each active job for matches
            for (const job of activeJobs) {
                try {
                    const match = await CentralizedMatchingService.getOrCalculateMatch(studentId, job._id, true);
                    
                    if (match && match.matchScore >= this.minimumAlertScore) {
                        const studentPhone = student.userId.whatsappNumber || student.userId.phone;
                        
                        {
                            const alertData: AlertData = {
                                studentId,
                                jobId: job._id,
                                matchScore: match.displayMatchScore || match.matchScore,
                                matchedSkills: match.skillsMatched || match.matchedSkills,
                                matchedTools: match.matchedTools,
                                jobTitle: job.title,
                                companyName: job.companyName,
                                workMode: job.workMode || 'onsite',
                                studentName: `${student.firstName} ${student.lastName}`,
                                studentPhone,
                                studentEmail: student.userId.email,
                                studentUserId: student.userId._id,
                                jobUrl: `${process.env.FRONTEND_URL || 'https://campuspe.com'}/jobs/${job._id}`,
                                jobData: job
                            };

                            await this.sendJobMatchAlert(alertData);
                            alertsSent++;
                            await this.delay(2000); // Rate limiting
                        }
                    }

                } catch (matchError) {
                    console.error(`Error calculating match for job ${job._id}:`, matchError);
                }
            }

            console.log(`✅ Sent ${alertsSent} job alerts for student profile update`);

        } catch (error) {
            console.error(`Error processing student profile update ${studentId}:`, error);
            throw error;
        }
    }

    /**
     * Private Helper Methods
     */
    private createPersonalizedMessage(data: {
        studentName: string;
        matchPercentage: number;
        jobTitle: string;
        companyName: string;
        workMode: string;
        skills: string;
        jobUrl: string;
    }): string {
        const { studentName, matchPercentage, jobTitle, companyName, workMode, skills, jobUrl } = data;
        
        const greeting = this.getTimeBasedGreeting();
        const workModeEmoji = workMode === 'Remote' ? '🏠' : workMode === 'Hybrid' ? '🔄' : '🏢';
        
        return `${greeting} ${studentName}! 🎯

🚀 *PERFECT MATCH FOUND!*

You have a *${matchPercentage}%* match for:
📋 *${jobTitle}* at *${companyName}*
${workModeEmoji} Work Mode: ${workMode}

✨ *Top matched skills:* ${skills}

🔗 *Apply Now:* ${jobUrl}

💡 *Quick Actions:*
• Type "profile" to update your profile
• Type "jobs" to see more opportunities
• Type "applications" to track your applications

Best of luck! 🍀
*- Team CampusPe*`;
    }

    private getTimeBasedGreeting(): string {
        const hour = new Date().getHours();
        
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Hi';
    }

    private async saveNotificationRecord(data: {
        studentId: Types.ObjectId;
        studentUserId?: Types.ObjectId;
        jobId: Types.ObjectId;
        message: string;
        matchScore: number;
        deliveryStatus: string;
        errorMessage?: string;
    }): Promise<boolean> {
        try {
            const existing = await Notification.exists({
                recipientId: data.studentUserId || data.studentId,
                relatedJobId: data.jobId,
                notificationType: 'job_match'
            });
            if (existing) return false;
            await Notification.findOneAndUpdate({
                recipientId: data.studentUserId || data.studentId,
                relatedJobId: data.jobId,
                notificationType: 'job_match'
            }, {
                $setOnInsert: {
                recipientId: data.studentUserId || data.studentId,
                recipientType: 'student',
                title: 'New Job Match Alert',
                message: data.message,
                notificationType: 'job_match',
                channels: {
                    platform: true,
                    email: true,
                    whatsapp: true,
                    push: false
                },
                deliveryStatus: {
                    platform: 'sent',
                    email: 'pending',
                    whatsapp: data.deliveryStatus
                },
                relatedJobId: data.jobId,
                priority: 'high',
                actionRequired: true,
                actionUrl: `/jobs/${data.jobId}`,
                actionText: 'Apply Now',
                metadata: {
                    matchScore: data.matchScore,
                    alertType: 'career_opportunity',
                    errorMessage: data.errorMessage
                }
                }
            }, { upsert: true, new: true });
            return true;
        } catch (error) {
            console.error('Error saving notification record:', error);
            return false;
        }
    }

    private async updateDeliveryStatus(recipientId: Types.ObjectId, jobId: Types.ObjectId, channel: 'email' | 'whatsapp', status: string): Promise<void> {
        await Notification.updateOne(
            { recipientId, relatedJobId: jobId, notificationType: 'job_match' },
            { $set: { [`deliveryStatus.${channel}`]: status, sentAt: new Date() } }
        );
    }

    private async sendJobMatchEmail(email: string | undefined, jobTitle: string, companyName: string, matchScore: number, jobUrl: string): Promise<'sent' | 'failed'> {
        const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
        const senderAddress = process.env.AZURE_COMMUNICATION_EMAIL_FROM;
        if (!email || !connectionString || !senderAddress) return 'failed';
        try {
            const client = new EmailClient(connectionString);
            const poller = await client.beginSend({
                senderAddress,
                recipients: { to: [{ address: email }] },
                content: {
                    subject: `New ${matchScore}% job match: ${jobTitle}`,
                    html: `<p>A <strong>${jobTitle}</strong> role at <strong>${companyName}</strong> matches your profile with a <strong>${matchScore}% Match Score</strong>.</p><p><a href="${jobUrl}">View and apply on CampusPe</a></p>`
                }
            });
            const result = await poller.pollUntilDone();
            return result.status === 'Succeeded' ? 'sent' : 'failed';
        } catch (error) {
            console.error('Job match email delivery failed:', error);
            return 'failed';
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new CareerAlertService();
