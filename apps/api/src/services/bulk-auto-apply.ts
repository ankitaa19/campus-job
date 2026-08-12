import mongoose, { Types } from 'mongoose';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { BulkAutoApplyRun } from '../models/BulkAutoApplyRun';
import { BulkAutoApplyTask, BulkAutoApplyTaskStatus } from '../models/BulkAutoApplyTask';
import AutoApplyService from './auto-apply';
import ApplicationSubmissionService from './application-submission';
import JobMatchingRagService from './job-matching-rag';
import type { JobsQuery } from './job-aggregation/jobs.repository';
import { createRedisConnection } from './redis-client';
import { checkOpenAIEmbeddingHealth, checkOpenAIHealth } from './openai-client';
import { sanitizeForLog } from '../utils/safe-logging';
import { classifyApplicationCapability } from './ats/application-capability';

const QUEUE_NAME = 'bulk-auto-apply';
const PROCESS_TASK_JOB = 'process-task';
const TERMINAL_TASK_STATUSES: BulkAutoApplyTaskStatus[] = ['succeeded', 'pending_review', 'failed', 'skipped'];
let queue: Queue | null = null;
let worker: Worker | null = null;
let queueEvents: QueueEvents | null = null;
let reconcilerTimer: NodeJS.Timeout | null = null;

export type BulkAutoApplyTaskJobPayload = {
  runId: string;
  taskId: string;
  userId: string;
  jobId: string;
};

export class BulkAutoApplyStartDependencyError extends Error {
  code: 'BULK_AUTO_APPLY_MONGO_UNAVAILABLE' | 'BULK_AUTO_APPLY_OPENAI_UNAVAILABLE';
  originalError: unknown;

  constructor(code: BulkAutoApplyStartDependencyError['code'], message: string, originalError: unknown) {
    super(message);
    this.name = 'BulkAutoApplyStartDependencyError';
    this.code = code;
    this.originalError = originalError;
  }
}

const getQueue = (): Queue => {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection('campuspe-bulk-auto-apply-queue'),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 5000 }
      }
    });
  }
  return queue;
};

const DEFAULT_WORKER_CONCURRENCY = 5;

const requestedBatchSize = (filters: JobsQuery): number | undefined => {
  const value = Number(filters.batchSize);
  return Number.isInteger(value) && value > 0 ? value : undefined;
};

const buildBatchOptions = (availableCount: number): number[] => {
  const options: number[] = [];
  for (let size = 100; size <= availableCount; size += 100) options.push(size);
  if (availableCount > 0 && availableCount % 100 !== 0) options.push(availableCount);
  return options;
};

const failureReasonFromError = (message: string): string => {
  if (/not implemented/i.test(message)) return 'unsupported_ats';
  if (/required for browser auto-apply/i.test(message)) return 'unsupported_ats';
  if (/manual_completion_required|captcha|verification/i.test(message)) return 'manual_completion_required';
  if (/duplicate|E11000/i.test(message)) return 'already_applied';
  if (/complete your profile|missing/i.test(message)) return 'profile_incomplete';
  return 'ats_submission_failed';
};

class BulkAutoApplyService {
  async assertStartDependencies(): Promise<void> {
    try {
      if (!mongoose.connection.db) throw new Error('MongoDB connection is not ready');
      await mongoose.connection.db.collection<{ _id: string; checkedAt: Date }>('bulk_auto_apply_healthchecks').updateOne(
        { _id: 'bulk-run-start' },
        { $set: { checkedAt: new Date() } },
        { upsert: true }
      );
    } catch (error) {
      throw new BulkAutoApplyStartDependencyError(
        'BULK_AUTO_APPLY_MONGO_UNAVAILABLE',
        'Bulk auto-apply MongoDB write health check failed',
        error
      );
    }

    try {
      await checkOpenAIEmbeddingHealth();
      await checkOpenAIHealth();
    } catch (error) {
      throw new BulkAutoApplyStartDependencyError(
        'BULK_AUTO_APPLY_OPENAI_UNAVAILABLE',
        'Bulk auto-apply OpenAI health check failed',
        error
      );
    }
  }

  async previewCount(userId: string | Types.ObjectId, filters: JobsQuery = {}) {
    const selection = await JobMatchingRagService.findBulkAutoApplySelection(userId, filters);
    const batchSize = requestedBatchSize(filters);
    const cappedCount = Math.min(selection.matches.length, batchSize || Number.POSITIVE_INFINITY);
    return {
      count: cappedCount,
      availableCount: selection.matches.length,
      needsYouCount: selection.needsYouCount,
      unsupportedCount: selection.unsupportedCount,
      totalConsideredJobs: selection.totalConsideredJobs,
      totalMatchedAboveThreshold: selection.totalMatchedAboveThreshold,
      batchOptions: buildBatchOptions(selection.matches.length)
    };
  }

  async createRun(userId: string | Types.ObjectId, filters: JobsQuery = {}) {
    const objectUserId = new Types.ObjectId(userId);
    const activeRun = await BulkAutoApplyRun.findOne({
      userId: objectUserId,
      status: { $in: ['pending', 'running'] }
    }).sort({ createdAt: -1 });
    if (activeRun) return activeRun;

    const selection = await JobMatchingRagService.findBulkAutoApplySelection(objectUserId, filters);
    const batchSize = requestedBatchSize(filters);
    if (!batchSize) throw new Error('Choose an Auto Apply batch size in increments of 100');
    const matches = selection.matches.slice(0, batchSize);
    const run = await new BulkAutoApplyRun({
      userId: objectUserId,
      status: matches.length ? 'pending' : 'completed',
      filters,
      totalJobs: matches.length,
      processedCount: 0,
      succeededCount: 0,
      pendingReviewCount: 0,
      failedCount: 0,
      skippedCount: 0,
      needsYouCount: selection.needsYouCount,
      unsupportedCount: selection.unsupportedCount,
      unsupportedAtsCount: 0,
      failureReasons: {},
      completedAt: matches.length ? undefined : new Date()
    }).save();

    if (!matches.length) return run;

    const tasks = await BulkAutoApplyTask.insertMany(matches.map(match => ({
      runId: run._id,
      userId: run.userId,
      jobId: match.job._id,
      status: 'pending',
      atsPlatform: match.job.atsPlatform || match.job.sourceProvider || 'other',
      score: match.score
    })), { ordered: false });

    try {
      await getQueue().addBulk(tasks.map(task => ({
        name: PROCESS_TASK_JOB,
        data: {
          runId: String(run._id),
          taskId: String(task._id),
          userId: String(task.userId),
          jobId: String(task.jobId)
        } satisfies BulkAutoApplyTaskJobPayload,
        opts: {
          jobId: String(task._id),
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }
        }
      })));
    } catch (error) {
      await BulkAutoApplyRun.findByIdAndUpdate(run._id, {
        $set: {
          status: 'failed',
          completedAt: new Date(),
          'failureReasons.enqueue_failed': 1
        }
      });
      throw error;
    }

    this.warnIfRunNotPickedUp(run._id).catch(() => undefined);

    return run;
  }

  startWorker(): void {
    if (worker) return;
    const connection = createRedisConnection('campuspe-bulk-auto-apply-worker');
    worker = new Worker(QUEUE_NAME, async job => {
      if (job.name !== PROCESS_TASK_JOB) return;
      await this.processTaskJob(job.data as BulkAutoApplyTaskJobPayload);
    }, {
      connection,
      concurrency: Number(process.env.BULK_AUTO_APPLY_WORKER_CONCURRENCY || DEFAULT_WORKER_CONCURRENCY)
    });
    queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: createRedisConnection('campuspe-bulk-auto-apply-events')
    });
    worker.on('ready', () => console.log('✅ Bulk auto-apply worker started'));
    worker.on('failed', async (job, error) => {
      console.error('❌ Bulk auto-apply task job failed after retries:', {
        runId: job?.data?.runId,
        taskId: job?.data?.taskId,
        error: sanitizeForLog(error)
      });
    });
    worker.on('error', error => {
      console.error('❌ Bulk auto-apply worker Redis/queue error:', sanitizeForLog(error));
    });
    queueEvents.on('error', error => {
      console.error('❌ Bulk auto-apply queue events error:', sanitizeForLog(error));
    });
  }

  async stopWorker(): Promise<void> {
    if (reconcilerTimer) {
      clearInterval(reconcilerTimer);
      reconcilerTimer = null;
    }
    await Promise.all([
      worker?.close(),
      queueEvents?.close(),
      queue?.close()
    ]);
    worker = null;
    queueEvents = null;
    queue = null;
  }

  startOrphanedRunReconciler(): void {
    if (reconcilerTimer) return;
    const intervalMs = Number(process.env.BULK_AUTO_APPLY_RECONCILE_INTERVAL_MS || 5 * 60 * 1000);
    reconcilerTimer = setInterval(() => {
      this.reconcileOrphanedRuns().catch(error => {
        console.error('❌ Bulk auto-apply orphaned-run reconciliation failed:', sanitizeForLog(error));
      });
    }, intervalMs);
    reconcilerTimer.unref?.();
  }

  async getRunForUser(runId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    const run = await BulkAutoApplyRun.findOne({ _id: runId, userId }).lean();
    if (!run) return null;
    const failedTasks = await BulkAutoApplyTask.find({ runId: run._id, status: 'failed' })
      .populate('jobId', 'title companyName atsPlatform')
      .sort({ completedAt: -1 })
      .limit(25)
      .lean();
    const [runningJobIds, runningCount, pendingCount, pickedUpTask] = await Promise.all([
      BulkAutoApplyTask.find({ runId: run._id, status: { $in: ['pending', 'running'] } }).distinct('jobId'),
      BulkAutoApplyTask.countDocuments({ runId: run._id, status: 'running' }),
      BulkAutoApplyTask.countDocuments({ runId: run._id, status: 'pending' }),
      BulkAutoApplyTask.exists({ runId: run._id, status: { $ne: 'pending' } })
    ]);
    const hasNoWorkerPickup = ['pending', 'running'].includes(run.status)
      && run.processedCount === 0
      && !pickedUpTask
      && Date.now() - new Date(run.createdAt).getTime() > Number(process.env.BULK_AUTO_APPLY_PICKUP_WARNING_MS || 60000);
    return {
      ...run,
      failedTasks,
      runningJobIds,
      runningCount,
      pendingCount,
      workerWarning: hasNoWorkerPickup
        ? 'Bulk Auto Apply is waiting for the background worker. Start the API worker process to continue processing.'
        : undefined
    };
  }

  async cancelRun(runId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    const run = await BulkAutoApplyRun.findOne({
      _id: runId,
      userId,
      status: { $in: ['pending', 'running'] }
    });
    if (!run) {
      return BulkAutoApplyRun.findOne({ _id: runId, userId }).lean();
    }

    const now = new Date();
    const skipped = await BulkAutoApplyTask.updateMany({
      runId: run._id,
      status: 'pending'
    }, {
      $set: {
        status: 'skipped',
        failureReason: 'cancelled',
        errorMessage: 'Bulk auto-apply run was cancelled before this task started',
        completedAt: now,
        counterApplied: true
      }
    });

    const inc: Record<string, number> = {};
    if (skipped.modifiedCount) {
      inc.processedCount = skipped.modifiedCount;
      inc.skippedCount = skipped.modifiedCount;
      inc['failureReasons.cancelled'] = skipped.modifiedCount;
    }

    await BulkAutoApplyRun.findByIdAndUpdate(run._id, {
      $set: { status: 'cancelled', completedAt: now },
      ...(Object.keys(inc).length ? { $inc: inc } : {})
    });

    return this.getRunForUser(run._id, userId);
  }

  async reconcileOrphanedRuns(): Promise<number> {
    const staleBefore = new Date(Date.now() - Number(process.env.BULK_AUTO_APPLY_ORPHANED_AFTER_MS || 10 * 60 * 1000));
    const runningRuns = await BulkAutoApplyRun.find({ status: 'running' }).select('_id').lean();
    let failedRuns = 0;

    for (const run of runningRuns) {
      const latestTask = await BulkAutoApplyTask.findOne({ runId: run._id })
        .sort({ updatedAt: -1 })
        .select('updatedAt')
        .lean();
      if (latestTask && latestTask.updatedAt > staleBefore) continue;

      const result = await BulkAutoApplyRun.updateOne({
        _id: run._id,
        status: 'running'
      }, {
        $set: {
          status: 'failed',
          completedAt: new Date(),
          'failureReasons.orphaned_run': 1
        }
      });
      failedRuns += result.modifiedCount;
      if (result.modifiedCount) {
        console.error(`❌ Bulk auto-apply run ${run._id} marked failed: no task activity for at least 10 minutes`);
      }
    }

    return failedRuns;
  }

  async processTaskJob(payload: BulkAutoApplyTaskJobPayload) {
    const existingTask = await BulkAutoApplyTask.findById(payload.taskId);
    if (!existingTask) return;
    if (TERMINAL_TASK_STATUSES.includes(existingTask.status)) {
      await this.applyTaskCounters(existingTask._id);
      return;
    }

    const task = await BulkAutoApplyTask.findOneAndUpdate({
      _id: existingTask._id,
      status: { $nin: TERMINAL_TASK_STATUSES }
    }, {
      $set: { status: 'running', startedAt: existingTask.startedAt || new Date() }
    }, { new: true });
    if (!task) return;
    const run = await BulkAutoApplyRun.findById(task.runId).select('status');
    if (!run || run.status === 'cancelled') {
      await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
        $set: {
          status: 'skipped',
          failureReason: 'cancelled',
          errorMessage: 'Bulk auto-apply run was cancelled before this task started',
          completedAt: new Date()
        }
      });
      await this.applyTaskCounters(task._id);
      return;
    }
    await BulkAutoApplyRun.findByIdAndUpdate(task.runId, { $set: { status: 'running' } });

    try {
      const existingApplication = await Application.findOne({
        userId: task.userId,
        jobId: task.jobId
      }).sort({ createdAt: -1 });
      if (existingApplication && ['submitted', 'confirmed'].includes(existingApplication.status)) {
        await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
          $set: {
            status: 'succeeded',
            applicationId: existingApplication._id,
            completedAt: new Date()
          }
        });
        await this.applyTaskCounters(task._id);
        return;
      }

      const job = await Job.findById(task.jobId)
        .select('+applyUrl +sourceUrl atsPlatform sourceProvider sourceCompanySlug greenhouseBoardToken atsJobId sourceExternalId allowDirectApplications')
        .lean();
      const capability = job ? classifyApplicationCapability(job) : 'unsupported';

      if (existingApplication?.status === 'pending_review') {
        if (capability === 'auto_apply') {
          await Application.findByIdAndUpdate(existingApplication._id, {
            $set: {
              status: 'queued',
              submittedFieldsJson: {
                ...(existingApplication.submittedFieldsJson || {}),
                submittedVia: 'this_portal',
                queuedAt: new Date(),
                autoSubmittedFromPendingReviewAt: new Date()
              }
            }
          });
          const application = await ApplicationSubmissionService.submitQueuedApplication(existingApplication._id);
          const taskStatus = application?.status === 'pending_review' ? 'pending_review' : 'succeeded';
          await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
            $set: {
              status: taskStatus,
              applicationId: application?._id,
              completedAt: new Date()
            }
          });
          await this.applyTaskCounters(task._id);
          return;
        }
        await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
          $set: {
            status: 'pending_review',
            applicationId: existingApplication._id,
            completedAt: new Date()
          }
        });
        await this.applyTaskCounters(task._id);
        return;
      }
      if (existingApplication?.status === 'failed') {
        await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
          $set: {
            status: 'failed',
            applicationId: existingApplication._id,
            failureReason: existingApplication.failureReason || 'ats_submission_failed',
            errorMessage: existingApplication.atsResponseRaw?.error,
            completedAt: new Date()
          }
        });
        await this.applyTaskCounters(task._id);
        return;
      }

      if (capability === 'needs_you') {
        const application = await ApplicationSubmissionService.createPendingReviewApplication(task.userId, task.jobId, task.score);
        await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
          $set: {
            status: 'pending_review',
            applicationId: application?._id,
            completedAt: new Date()
          }
        });
        await this.applyTaskCounters(task._id);
        return;
      }
      if (capability === 'unsupported') {
        const application = existingApplication?.status === 'queued'
          ? existingApplication
          : await ApplicationSubmissionService.createQueuedApplication(task.userId, task.jobId, task.score);
        await Application.findByIdAndUpdate(application._id, {
          $set: {
            status: 'failed',
            failureReason: 'unsupported_ats',
            atsResponseRaw: {
              error: 'ATS is not supported for automatic submission',
              failureReason: 'unsupported_ats',
              failedAt: new Date()
            }
          }
        });
        await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
          $set: {
            status: 'failed',
            applicationId: application._id,
            failureReason: 'unsupported_ats',
            errorMessage: 'ATS is not supported for automatic submission',
            completedAt: new Date()
          }
        });
        await this.applyTaskCounters(task._id);
        return;
      }

      const application = existingApplication?.status === 'queued'
        ? await ApplicationSubmissionService.submitQueuedApplication(existingApplication._id)
        : (await AutoApplyService.handleMatchedJob(task.userId, task.jobId, task.score, { forceSubmit: true })).application as any;
      const taskStatus = application?.status === 'pending_review' ? 'pending_review' : 'succeeded';
      await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
        $set: {
          status: taskStatus,
          applicationId: application?._id,
          completedAt: new Date()
        }
      });
      await this.applyTaskCounters(task._id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failureReason = failureReasonFromError(message);
      const application = await Application.findOne({ userId: task.userId, jobId: task.jobId }).sort({ createdAt: -1 });
      if (application && application.status !== 'failed' && failureReason === 'unsupported_ats') {
        await Application.findByIdAndUpdate(application._id, {
          $set: {
            status: 'failed',
            failureReason,
            atsResponseRaw: {
              ...(application.atsResponseRaw || {}),
              error: message,
              failureReason,
              failedAt: new Date()
            }
          }
        });
      }
      await BulkAutoApplyTask.findByIdAndUpdate(task._id, {
        $set: {
          status: failureReason === 'already_applied' ? 'skipped' : 'failed',
          applicationId: application?._id,
          failureReason,
          errorMessage: message,
          completedAt: new Date()
        }
      });
      await this.applyTaskCounters(task._id);
    }
  }

  private async applyTaskCounters(taskId: Types.ObjectId) {
    const task = await BulkAutoApplyTask.findOneAndUpdate({
      _id: taskId,
      status: { $in: TERMINAL_TASK_STATUSES },
      counterApplied: { $ne: true }
    }, {
      $set: { counterApplied: true }
    }, { new: true });
    if (!task) return;

    const inc: Record<string, number> = { processedCount: 1 };
    if (task.status === 'succeeded') inc.succeededCount = 1;
    if (task.status === 'pending_review') inc.pendingReviewCount = 1;
    if (task.status === 'skipped') inc.skippedCount = 1;
    if (task.status === 'failed') inc.failedCount = 1;
    if (task.failureReason === 'unsupported_ats') inc.unsupportedAtsCount = 1;
    if (task.failureReason) inc[`failureReasons.${task.failureReason}`] = 1;

    const run = await BulkAutoApplyRun.findByIdAndUpdate(task.runId, { $inc: inc }, { new: true });
    if (run && run.status !== 'cancelled' && run.totalJobs > 0 && run.processedCount >= run.totalJobs) {
      await BulkAutoApplyRun.findOneAndUpdate({
        _id: run._id,
        status: { $ne: 'completed' }
      }, {
        $set: { status: 'completed', completedAt: new Date() }
      });
    }
  }

  private async warnIfRunNotPickedUp(runId: Types.ObjectId) {
    const delayMs = Number(process.env.BULK_AUTO_APPLY_PICKUP_WARNING_MS || 60000);
    const timer = setTimeout(async () => {
      const run = await BulkAutoApplyRun.findById(runId).lean().catch(() => null);
      if (!run || run.status !== 'pending') return;
      const pickedUpTask = await BulkAutoApplyTask.exists({
        runId,
        status: { $ne: 'pending' }
      }).catch(() => null);
      if (!pickedUpTask) {
        console.error(`❌ Bulk auto-apply run ${runId} has not been picked up by a worker after ${delayMs}ms. Start the worker with npm run worker.`);
      }
    }, delayMs);
    timer.unref?.();
  }
}

export default new BulkAutoApplyService();
