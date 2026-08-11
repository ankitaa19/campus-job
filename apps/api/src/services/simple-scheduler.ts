import CareerAlertService from './career-alerts';
import JobSyncService from './job-aggregation/job-sync.service';
import CareerSourceDiscoveryService from './job-aggregation/career-source-discovery.service';
import ApplicationDeliveryService from './application-delivery';
import { ProviderSyncTier } from './job-aggregation/types';

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

        // Inspect a bounded slice of the India company-career catalog nightly.
        // Verified structured sources are activated for the normal sync cycle.
        if (process.env.CAREER_DIRECTORY_DISCOVERY_ENABLED !== 'false') {
            // Start catalog activation during development/startup instead of
            // waiting until the next midnight window.
            const initialDiscovery = setTimeout(async () => {
                try {
                    const results = await CareerSourceDiscoveryService.discoverPending();
                    const verified = results.filter(item => item.status === 'verified').length;
                    console.log(`🔎 Initial career source discovery checked ${results.length}; verified ${verified}`);
                } catch (error) {
                    console.error('❌ Initial career source discovery failed:', error);
                }
            }, 5 * 1000);
            const discoveryIntervalHours = Math.min(24, Math.max(2, Number(process.env.CAREER_DIRECTORY_DISCOVERY_INTERVAL_HOURS || 6)));
            const discoveryInterval = setInterval(async () => {
                try {
                    const results = await CareerSourceDiscoveryService.discoverPending();
                    const verified = results.filter(item => item.status === 'verified').length;
                    console.log(`🔎 Career source discovery checked ${results.length}; verified ${verified}`);
                } catch (error) {
                    console.error('❌ Career source discovery failed:', error);
                }
            }, discoveryIntervalHours * 60 * 60 * 1000);
            this.intervals.push(initialDiscovery, discoveryInterval);
            this.scheduleDailyAt(0, 15, async () => {
                try {
                    const results = await CareerSourceDiscoveryService.discoverPending();
                    const verified = results.filter(item => item.status === 'verified').length;
                    console.log(`🔎 Career source discovery checked ${results.length}; verified ${verified}`);
                } catch (error) {
                    console.error('❌ Career source discovery failed:', error);
                }
            });
        }

        // Schedule weekly cleanup on Sundays
        this.scheduleWeeklyAt(0, 2, 0, async () => {
            await this.runWeeklyCleanup();
        });

        // Health check every hour
        const healthCheckInterval = setInterval(() => {
            this.healthCheck();
        }, 60 * 60 * 1000);

        this.intervals.push(healthCheckInterval);

        // Pending imported-job applications stay in CampusPe and are
        // delivered automatically once the job is linked to a recruiter.
        const initialApplicationDelivery = setTimeout(() => this.runPendingApplicationDelivery(), 20 * 1000);
        const applicationDeliveryInterval = setInterval(() => this.runPendingApplicationDelivery(), 15 * 60 * 1000);
        this.intervals.push(initialApplicationDelivery, applicationDeliveryInterval);

        // Deadlines and authoritative source verification determine whether a
        // job is active; an old posting date alone does not expire a verified job.
        const freshnessInterval = setInterval(() => this.expireStaleJobs(), 6 * 60 * 60 * 1000);
        const initialFreshnessCleanup = setTimeout(() => this.expireStaleJobs(), 10 * 1000);
        this.intervals.push(freshnessInterval, initialFreshnessCleanup);

        if (process.env.JOB_SYNC_ENABLED !== 'false') {
            const highPriorityHours = Math.min(3, Math.max(1, Number(process.env.JOB_SYNC_HIGH_PRIORITY_HOURS || 3)));
            const standardHours = Math.min(12, Math.max(4, Number(process.env.JOB_SYNC_STANDARD_HOURS || 6)));
            const dailyHours = Math.min(24, Math.max(12, Number(process.env.JOB_SYNC_DAILY_HOURS || 24)));
            this.intervals.push(
                setTimeout(() => this.runJobSynchronization('high_priority'), 30 * 1000),
                setInterval(() => this.runJobSynchronization('high_priority'), highPriorityHours * 60 * 60 * 1000),
                setTimeout(() => this.runJobSynchronization('standard'), 2 * 60 * 1000),
                setInterval(() => this.runJobSynchronization('standard'), standardHours * 60 * 60 * 1000),
                setTimeout(() => this.runJobSynchronization('daily'), 4 * 60 * 1000),
                setInterval(() => this.runJobSynchronization('daily'), dailyHours * 60 * 60 * 1000),
                setTimeout(() => this.runMissingJobRevalidation(), 10 * 60 * 1000),
                setInterval(() => this.runMissingJobRevalidation(), 12 * 60 * 60 * 1000)
            );
        }
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
                {
                    status: 'active',
                    applicationDeadline: { $lt: new Date() }
                },
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

    private async expireStaleJobs(): Promise<void> {
        try {
            const { Job } = require('../models/Job');
            const result = await Job.updateMany(
                {
                    status: 'active',
                    applicationDeadline: { $lt: new Date() }
                },
                { $set: { status: 'expired', lastModified: new Date() } }
            );
            if (result.modifiedCount) console.log(`🧹 Expired ${result.modifiedCount} stale jobs`);
        } catch (error) {
            console.error('❌ Job freshness cleanup failed:', error);
        }
    }

    private async runJobSynchronization(tier: ProviderSyncTier): Promise<void> {
        try {
            console.log(`🔄 Running ${tier} job synchronization...`);
            const results = await JobSyncService.syncTier(tier);
            const totals = results.reduce((summary, result) => ({
                fetched: summary.fetched + result.fetched,
                created: summary.created + result.created,
                updated: summary.updated + result.updated,
                closed: summary.closed + result.closed
            }), { fetched: 0, created: 0, updated: 0, closed: 0 });
            console.log('✅ External job synchronization completed:', totals);
            await this.runPendingApplicationDelivery(true);
        } catch (error) {
            if (error instanceof Error && error.message.includes('already running')) {
                console.log(`⏳ ${tier} job synchronization deferred: another synchronization is in progress`);
                const retry = setTimeout(() => this.runJobSynchronization(tier), 5 * 60 * 1000);
                this.intervals.push(retry);
                return;
            }
            console.error('❌ External job synchronization failed:', error);
        }
    }

    private async runMissingJobRevalidation(): Promise<void> {
        try {
            const results = await JobSyncService.revalidateMissingSources();
            const checkedSources = results.length;
            const lifecycleChanges = results.reduce((total, result) => total + result.closed, 0);
            if (checkedSources || lifecycleChanges) console.log(`🔁 Revalidated ${checkedSources} missing-job sources; ${lifecycleChanges} lifecycle changes`);
        } catch (error) {
            // Overlapping with an active sync is expected contention, not a fault.
            if (error instanceof Error && error.message.includes('already running')) {
                console.log('⏳ Missing-job revalidation deferred: a job synchronization is in progress');
                const retry = setTimeout(() => this.runMissingJobRevalidation(), 5 * 60 * 1000);
                this.intervals.push(retry);
                return;
            }
            console.error('❌ Missing-job revalidation failed:', error);
        }
    }

    private async runPendingApplicationDelivery(force = false): Promise<void> {
        try {
            const result = await ApplicationDeliveryService.processPending(100, force);
            if (result.checked || result.errors) console.log('📨 Pending application delivery:', result);
        } catch (error) {
            console.error('❌ Pending application delivery failed:', error);
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
                healthCheck: 'Every hour',
                pendingApplicationDelivery: 'Every 15 minutes and after each job sync',
                freshnessCleanup: 'Every 6 hours (deadline-based)',
                missingJobRevalidation: 'Every 12 hours',
                jobSynchronization: process.env.JOB_SYNC_ENABLED === 'false'
                    ? 'Disabled'
                    : 'High priority: 1-3h; standard: 6h; daily feeds: 24h'
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
