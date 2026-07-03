import CareerAlertService from './career-alerts';

class SimpleScheduler {
    private intervals: NodeJS.Timeout[] = [];
    private isRunning = false;

    /**
     * Initialize scheduled tasks without external dependencies
     */
    init(): void {
        console.log('🕐 Initializing scheduler...');

        // Schedule daily job alerts
        this.scheduleDailyAt(9, 0, async () => {
            await this.runDailyJobAlerts();
        });

        // Schedule weekly cleanup on Sundays
        this.scheduleWeeklyAt(0, 2, 0, async () => {
            await this.runWeeklyCleanup();
        });

        // Health check every hour
        const healthCheckInterval = setInterval(() => {
            this.healthCheck();
        }, 60 * 60 * 1000);

        this.intervals.push(healthCheckInterval);
        console.log('✅ Scheduler initialized');
    }

    /**
     * Schedule daily task
     */
    private scheduleDailyAt(hour: number, minute: number, task: () => Promise<void>): void {
        const scheduleNext = () => {
            const now = new Date();
            const next = new Date();
            next.setHours(hour, minute, 0, 0);
            
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
            
            const msUntilNext = next.getTime() - now.getTime();
            
            const timeout = setTimeout(async () => {
                await task();
                scheduleNext(); // Schedule the next occurrence
            }, msUntilNext);
            
            this.intervals.push(timeout);
        };
        
        scheduleNext();
    }

    /**
     * Schedule weekly task
     */
    private scheduleWeeklyAt(dayOfWeek: number, hour: number, minute: number, task: () => Promise<void>): void {
        const scheduleNext = () => {
            const now = new Date();
            const next = new Date();
            
            const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
            next.setDate(now.getDate() + daysUntilTarget);
            next.setHours(hour, minute, 0, 0);
            
            if (next <= now) {
                next.setDate(next.getDate() + 7);
            }
            
            const msUntilNext = next.getTime() - now.getTime();
            
            const timeout = setTimeout(async () => {
                await task();
                scheduleNext(); // Schedule the next occurrence
            }, msUntilNext);
            
            this.intervals.push(timeout);
        };
        
        scheduleNext();
    }

    /**
     * Run daily job alerts
     */
    private async runDailyJobAlerts(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Daily alerts already running, skipping...');
            return;
        }

        this.isRunning = true;
        try {
            console.log('🚀 Running daily job alerts...');
            await CareerAlertService.processDailyJobAlerts();
            console.log('✅ Daily job alerts completed');
        } catch (error) {
            console.error('❌ Daily job alerts failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run weekly cleanup
     */
    private async runWeeklyCleanup(): Promise<void> {
        try {
            console.log('🧹 Running weekly cleanup...');
            
            const { Job } = require('../models/Job');
            const { Notification } = require('../models/Notification');
            
            // Mark expired jobs
            const expiredResult = await Job.updateMany(
                { applicationDeadline: { $lt: new Date() }, status: 'active' },
                { $set: { status: 'expired' } }
            );
            
            // Clean old notifications
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const cleanupResult = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                'deliveryStatus.whatsapp': { $in: ['sent', 'delivered'] }
            });
            
            console.log(`✅ Cleanup complete: ${expiredResult.modifiedCount} jobs expired, ${cleanupResult.deletedCount} notifications cleaned`);
        } catch (error) {
            console.error('❌ Weekly cleanup failed:', error);
        }
    }

    /**
     * System health check
     */
    private async healthCheck(): Promise<void> {
        try {
            const { Job } = require('../models/Job');
            const activeJobs = await Job.countDocuments({ status: 'active' });
            console.log(`💚 Health: ${activeJobs} active jobs`);
        } catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }

    /**
     * Manual triggers
     */
    async triggerDailyJobAlerts(): Promise<void> {
        await this.runDailyJobAlerts();
    }

    async triggerWeeklyCleanup(): Promise<void> {
        await this.runWeeklyCleanup();
    }

    /**
     * Get status
     */
    getStatus(): object {
        return {
            isRunning: this.isRunning,
            intervalCount: this.intervals.length,
            schedules: {
                dailyAlerts: '9:00 AM daily',
                weeklyCleanup: '2:00 AM Sundays',
                healthCheck: 'Every hour'
            }
        };
    }

    /**
     * Cleanup on shutdown
     */
    shutdown(): void {
        console.log('🛑 Shutting down scheduler...');
        this.intervals.forEach(interval => {
            if (typeof interval === 'number') {
                clearTimeout(interval);
            } else {
                clearInterval(interval);
            }
        });
        this.intervals = [];
        console.log('✅ Scheduler shutdown complete');
    }
}

export default new SimpleScheduler();
