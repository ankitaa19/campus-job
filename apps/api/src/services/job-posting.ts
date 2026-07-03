import { Job } from '../models';
import AIMatchingService from './ai-matching';
import CareerAlertService from './career-alerts';
import { Types } from 'mongoose';

interface JobPostingData {
    title: string;
    description: string;
    requirements: Array<{
        skill: string;
        level: string;
        mandatory: boolean;
        category: string;
    }>;
    workMode: string;
    locations: Array<{
        city: string;
        state: string;
        country: string;
    }>;
    companyName: string;
    recruiterId: Types.ObjectId;
}

class JobPostingService {
    /**
     * Enhanced Job Creation with AI Analysis
     */
    async createIntelligentJob(jobData: JobPostingData): Promise<any> {
        try {
            console.log(`🤖 Creating intelligent job: ${jobData.title}`);

            // Step 1: Create the basic job record
            const job = new Job({
                ...jobData,
                status: 'active', // Start as active for immediate matching
                postedAt: new Date(),
                lastModified: new Date(),
                views: 0,
                applications: []
            });

            const savedJob = await job.save();
            console.log(`✅ Job created with ID: ${savedJob._id}`);

            // Step 2: AI Enhancement - Analyze job description
            try {
                const aiAnalysis = await AIMatchingService.analyzeJobDescription(jobData.description);
                
                // Step 3: Update job with AI insights
                const enhancedJob = await Job.findByIdAndUpdate(
                    savedJob._id,
                    {
                        $set: {
                            'aiGeneratedDescription': aiAnalysis.role_summary,
                            'aiSkills': aiAnalysis.skills,
                            'aiTools': aiAnalysis.tools,
                            'aiCategory': aiAnalysis.category,
                            'aiWorkMode': aiAnalysis.work_mode,
                            'matchingKeywords': [...aiAnalysis.skills, ...aiAnalysis.tools],
                            'metadata.aiAnalysis': aiAnalysis,
                            'metadata.category': aiAnalysis.category,
                            'metadata.jobFunction': aiAnalysis.job_function
                        }
                    },
                    { new: true }
                );

                console.log(`🧠 AI Analysis completed:`, {
                    category: aiAnalysis.category,
                    workMode: aiAnalysis.work_mode,
                    skillsExtracted: aiAnalysis.skills.length,
                    toolsExtracted: aiAnalysis.tools.length
                });

                // Step 4: Create job embedding for future matching
                await AIMatchingService.createJobEmbedding(savedJob._id, savedJob.toObject());

                // Step 5: Automatically trigger AI matching and WhatsApp notifications
                console.log(`🚀 Triggering automatic AI matching for job: ${savedJob._id}`);
                this.triggerJobMatchingAsync(savedJob._id);

                return enhancedJob;

            } catch (aiError) {
                console.error('AI analysis failed, continuing with basic job creation:', aiError);
                
                // Still trigger matching even if AI enhancement fails
                this.triggerJobMatchingAsync(savedJob._id);
                return savedJob;
            }

        } catch (error) {
            console.error('Error creating intelligent job:', error);
            throw error;
        }
    }

    /**
     * Publish Job and Trigger Matching
     */
    async publishJob(jobId: Types.ObjectId): Promise<void> {
        try {
            console.log(`📢 Publishing job: ${jobId}`);

            // Update job status to active
            const job = await Job.findByIdAndUpdate(
                jobId,
                {
                    $set: {
                        status: 'active',
                        postedAt: new Date(),
                        lastModified: new Date()
                    }
                },
                { new: true }
            );

            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }

            console.log(`✅ Job published: ${job.title} at ${job.companyName}`);

            // Trigger matching and alerts in background
            this.triggerJobMatchingAsync(jobId);

        } catch (error) {
            console.error(`Error publishing job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Background Job Matching and Alerts
     */
    private async triggerJobMatchingAsync(jobId: Types.ObjectId): Promise<void> {
        // Run in background without blocking the response
        setImmediate(async () => {
            try {
                console.log(`🔍 Starting background matching for job: ${jobId}`);
                
                // Process matching and send alerts
                await CareerAlertService.processNewJobPosting(jobId);
                
                console.log(`✅ Background matching completed for job: ${jobId}`);
                
            } catch (error) {
                console.error(`❌ Background matching failed for job ${jobId}:`, error);
                
                // Log to monitoring service (if available)
                this.logMatchingError(jobId, error);
            }
        });
    }

    /**
     * Update Job and Re-trigger Matching
     */
    async updateJobAndRetriggerMatching(
        jobId: Types.ObjectId, 
        updateData: Partial<JobPostingData>
    ): Promise<any> {
        try {
            console.log(`📝 Updating job: ${jobId}`);

            // Update the job
            const job = await Job.findByIdAndUpdate(
                jobId,
                {
                    $set: {
                        ...updateData,
                        lastModified: new Date()
                    }
                },
                { new: true }
            );

            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }

            // If description was updated, re-run AI analysis
            if (updateData.description) {
                try {
                    const aiAnalysis = await AIMatchingService.analyzeJobDescription(updateData.description);
                    
                    await Job.findByIdAndUpdate(jobId, {
                        $set: {
                            'aiGeneratedDescription': aiAnalysis.role_summary,
                            'matchingKeywords': [...aiAnalysis.skills, ...aiAnalysis.tools],
                            'metadata.aiAnalysis': aiAnalysis
                        }
                    });

                    // Recreate embedding with new data
                    await AIMatchingService.createJobEmbedding(jobId, job.toObject());

                    console.log(`🧠 AI re-analysis completed for updated job`);
                    
                } catch (aiError) {
                    console.error('AI re-analysis failed:', aiError);
                }
            }

            // If job is active, retrigger matching
            if (job.status === 'active') {
                this.triggerJobMatchingAsync(jobId);
            }

            return job;

        } catch (error) {
            console.error(`Error updating job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Bulk Job Processing
     */
    async processMultipleJobs(jobIds: Types.ObjectId[]): Promise<void> {
        console.log(`🔄 Processing ${jobIds.length} jobs for matching...`);

        for (let i = 0; i < jobIds.length; i++) {
            const jobId = jobIds[i];
            
            try {
                await CareerAlertService.processNewJobPosting(jobId);
                
                // Add delay between jobs to avoid overwhelming the system
                if (i < jobIds.length - 1) {
                    await this.delay(10000); // 10-second delay between jobs
                }
                
            } catch (error) {
                console.error(`Error processing job ${jobId} in bulk:`, error);
                // Continue with next job instead of stopping
            }
        }

        console.log(`✅ Completed bulk job processing`);
    }

    /**
     * Get Job Matching Statistics
     */
    async getJobMatchingStats(jobId: Types.ObjectId): Promise<any> {
        try {
            const matches = await AIMatchingService.findMatchingStudents(jobId, 0.50);
            
            const highMatches = matches.filter(m => m.finalMatchScore >= 0.70);
            const mediumMatches = matches.filter(m => m.finalMatchScore >= 0.50 && m.finalMatchScore < 0.70);
            
            const skillDistribution = this.analyzeSkillDistribution(matches);
            const avgMatchScore = matches.length > 0 
                ? matches.reduce((sum, m) => sum + m.finalMatchScore, 0) / matches.length 
                : 0;

            return {
                jobId,
                totalCandidates: matches.length,
                highMatches: highMatches.length,
                mediumMatches: mediumMatches.length,
                averageMatchScore: Math.round(avgMatchScore * 100) / 100,
                skillDistribution,
                topCandidates: highMatches.slice(0, 10).map(match => ({
                    studentId: match.studentId,
                    matchScore: Math.round(match.finalMatchScore * 100),
                    matchedSkills: match.matchedSkills,
                    matchedTools: match.matchedTools
                }))
            };
            
        } catch (error) {
            console.error(`Error getting job matching stats for ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Private Helper Methods
     */
    private analyzeSkillDistribution(matches: any[]): Record<string, number> {
        const skillCounts: Record<string, number> = {};
        
        matches.forEach(match => {
            match.matchedSkills.forEach((skill: string) => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        
        // Sort by frequency and return top 10
        const sortedSkills = Object.entries(skillCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [skill, count]) => {
                obj[skill] = count;
                return obj;
            }, {} as Record<string, number>);
        
        return sortedSkills;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private logMatchingError(jobId: Types.ObjectId, error: any): void {
        // Log to your monitoring service (e.g., Sentry, DataDog)
        console.error('MATCHING_ERROR', {
            jobId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}

export default new JobPostingService();
