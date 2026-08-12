import crypto from 'crypto';
import { Types } from 'mongoose';
import { Application } from '../models/Application';
import { ConsentRecord } from '../models/ConsentRecord';
import { Job } from '../models/Job';
import { Student } from '../models/Student';
import { User } from '../models/User';
import TailoringService from './ats/tailoring.service';
import { getAtsAdapter } from './ats/registry';
import { inspectApplicationCapability } from './ats/application-capability';
import { BrowserSubmissionError } from './ats/types';
import ProductEventService from './product-events';

class ApplicationSubmissionService {
  async createQueuedApplication(userId: string | Types.ObjectId, jobId: string | Types.ObjectId, matchScore?: number) {
    return this.createApplicationRecord(userId, jobId, 'queued', matchScore);
  }

  async createPendingReviewApplication(userId: string | Types.ObjectId, jobId: string | Types.ObjectId, matchScore?: number) {
    const application = await this.createApplicationRecord(userId, jobId, 'pending_review', matchScore);
    const [job, student] = await Promise.all([
      Job.findById(application.jobId).select('+applyUrl'),
      Student.findById(application.studentId)
    ]);
    if (!job) throw new Error('Job not found');
    if (!student) throw new Error('Student profile not found');
    this.assertProfileReady(student);
    const materials = await TailoringService.buildMaterials(student, job);
    return Application.findByIdAndUpdate(application._id, {
      $set: {
        coverLetterUsed: materials.coverLetterText,
        submittedFieldsJson: {
          ...(application.submittedFieldsJson || {}),
          tailoredResumeText: materials.resumeText,
          coverLetterText: materials.coverLetterText,
          submittedVia: 'this_portal',
          pendingReviewAt: new Date()
        }
      }
    }, { new: true });
  }

  async approveApplication(applicationId: string | Types.ObjectId, approverUserId: string | Types.ObjectId) {
    const application = await Application.findById(applicationId);
    if (!application) throw new Error('Application not found');
    if (application.status !== 'pending_review') throw new Error('Only pending review applications can be approved');
    if (String(application.userId) !== String(approverUserId)) throw new Error('Application does not belong to this user');
    await Application.findByIdAndUpdate(application._id, {
      $set: {
        status: 'queued',
        workflowState: 'queued',
        submittedFieldsJson: {
          ...(application.submittedFieldsJson || {}),
          approvedAt: new Date(),
          submittedVia: 'this_portal'
        }
      }
    });
    return this.submitQueuedApplication(application._id);
  }

  private async createApplicationRecord(
    userId: string | Types.ObjectId,
    jobId: string | Types.ObjectId,
    status: 'queued' | 'pending_review',
    matchScore?: number
  ) {
    const objectUserId = new Types.ObjectId(userId);
    const objectJobId = new Types.ObjectId(jobId);
    const [student, job, user] = await Promise.all([
      Student.findOne({ userId: objectUserId }),
      Job.findById(objectJobId).select('+applyUrl'),
      User.findById(objectUserId)
    ]);
    if (!student) throw new Error('Student profile not found');
    if (!job) throw new Error('Job not found');
    if (!user) throw new Error('User not found');
    this.assertProfileReady(student, user);

    const linkedRecruiterId = (job.recruiterId as any)?._id || job.recruiterId || null;
    await this.assertConsent(objectUserId, status === 'queued');
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${objectUserId}:${objectJobId}:v1`)
      .digest('hex');
    const application = new Application({
      userId: objectUserId,
      studentId: student._id,
      jobId: job._id,
      recruiterId: linkedRecruiterId,
      collegeId: student.collegeId,
      resumeFile: student.resumeFile,
      resumeVersionUsed: {
        file: student.resumeFile,
        uploadedAt: student.resumeAnalysis?.uploadDate,
        analysisVersion: 1
      },
      sourcePlatform: job.atsPlatform || job.sourceProvider || job.source || 'campuspe',
      status,
      workflowState: status === 'queued' ? 'queued' : 'ready_for_review',
      idempotencyKey,
      submittedVia: 'this_portal',
      submissionChannel: 'campuspe',
      employerDeliveryStatus: linkedRecruiterId ? 'delivered_to_campuspe_employer' : 'awaiting_employer_connection',
      externalSubmissionAttempted: false,
      currentStatus: 'applied',
      statusHistory: [{
        status: 'applied',
        updatedAt: new Date(),
        updatedBy: objectUserId,
        notes: 'Application queued by CampusPe for ATS submission'
      }],
      matchScore,
      skillsMatchPercentage: matchScore,
      submittedFieldsJson: {
        submittedVia: 'this_portal',
        userId: String(objectUserId),
        studentId: String(student._id),
        jobId: String(job._id),
        [status === 'queued' ? 'queuedAt' : 'pendingReviewAt']: new Date()
      },
      source: 'platform',
      appliedAt: new Date(),
      whatsappNotificationSent: false,
      emailNotificationSent: false,
      recruiterViewed: false
    });
    const saved = await application.save();
    await ProductEventService.record({
      name: 'application_started',
      actorUserId: objectUserId,
      studentId: student._id,
      jobId: job._id,
      applicationId: saved._id,
      scores: matchScore === undefined ? undefined : { match: matchScore },
      sourceProvider: job.atsPlatform || job.sourceProvider
    });
    return saved;
  }

  private assertProfileReady(student: any, user?: any) {
    const missing: string[] = [];
    const hasResume = Boolean(student.resumeFile || student.resumeText || student.resumeAnalysis?.resumeText);
    const hasFirstName = Boolean(String(student.firstName || user?.name?.split(' ')?.[0] || '').trim());
    const hasLastName = Boolean(String(student.lastName || user?.name?.split(' ')?.slice(1).join(' ') || '').trim());
    const hasEmail = Boolean(String(student.email || user?.email || '').trim());

    if (!hasResume) missing.push('resume');
    if (!hasFirstName || !hasLastName) missing.push('name');
    if (!hasEmail) missing.push('email');

    if (missing.length) {
      throw new Error(`Complete your profile before using Auto Apply. Missing: ${missing.join(', ')}`);
    }
  }

  async submitQueuedApplication(applicationId: string | Types.ObjectId) {
    const application = await Application.findById(applicationId);
    if (!application) throw new Error('Application not found');
    if (!['queued', 'submitted'].includes(application.status)) {
      throw new Error(`Application status ${application.status} cannot be submitted`);
    }

    const [job, student, user] = await Promise.all([
      Job.findById(application.jobId).select('+applyUrl'),
      Student.findById(application.studentId),
      User.findById(application.userId)
    ]);
    if (!job) throw new Error('Job not found');
    if (!student) throw new Error('Student profile not found');
    if (!user) throw new Error('User not found');

    this.assertProfileReady(student, user);
    await this.assertConsent(user._id, true);
    const adapter = getAtsAdapter(job.atsPlatform || 'other');
    const deterministicInspection = inspectApplicationCapability(job);
    // Provider adapters can inspect employer-specific authorization and form
    // capabilities that the synchronous catalogue classifier cannot see.
    const schema = await adapter.inspectApplication?.(job) || deterministicInspection;
    if (schema && schema.capability !== 'auto_apply') {
      const reasons = schema.reasons || [];
      const workflowState = schema.capability === 'unsupported'
        ? 'unsupported'
        : reasons.includes('authentication_required')
          ? 'needs_authentication'
          : reasons.includes('assessment_required')
            ? 'needs_assessment'
            : reasons.includes('additional_documents_required')
              ? 'needs_document'
              : 'needs_user_input';
      const interventionType = workflowState === 'needs_authentication'
        ? 'authentication'
        : workflowState === 'needs_assessment'
          ? 'assessment'
          : workflowState === 'needs_document'
            ? 'document'
            : reasons.includes('captcha_required')
              ? 'captcha'
              : 'user_input';
      const paused = await Application.findByIdAndUpdate(application._id, {
        $set: {
          status: schema.capability === 'unsupported' ? 'failed' : 'pending_review',
          workflowState,
          failureReason: schema.capability === 'unsupported' ? 'unsupported_ats' : undefined,
          intervention: {
            type: interventionType,
            reason: reasons.join(',') || 'Application requires user input',
            requiredFields: schema.requiredFields,
            createdAt: new Date()
          }
        }
      }, { new: true });
      await ProductEventService.record({
        name: 'application_paused',
        actorUserId: user._id,
        studentId: student._id,
        jobId: job._id,
        applicationId: application._id,
        sourceProvider: job.atsPlatform || job.sourceProvider,
        reason: reasons.join(',')
      });
      return paused;
    }
    const materials = await TailoringService.buildMaterials(student, job);
    const submittedFieldsJson = {
      ...(application.submittedFieldsJson || {}),
      tailoredResumeText: materials.resumeText,
      coverLetterText: materials.coverLetterText,
      submittedVia: 'this_portal',
      submittedAt: new Date()
    };
    await Application.findByIdAndUpdate(application._id, {
      $set: {
        externalSubmissionAttempted: true,
        workflowState: 'submitting',
        lastDeliveryAttemptAt: new Date(),
        coverLetterUsed: materials.coverLetterText,
        submittedFieldsJson
      },
      $inc: { deliveryAttemptCount: 1 }
    });

    try {
      const receipt = await adapter.submitApplication({ application, job, student, user, materials });
      const workflowState = receipt.status === 'failed' ? 'failed_final' : receipt.status;
      const updated = await Application.findByIdAndUpdate(application._id, {
        $set: {
          status: receipt.status,
          workflowState,
          externalApplicationId: receipt.externalApplicationId,
          submissionReceipt: {
            provider: receipt.provider,
            externalApplicationId: receipt.externalApplicationId,
            acceptedAt: new Date()
          },
          atsResponseRaw: receipt.rawResponse,
          submittedFieldsJson: {
            ...submittedFieldsJson,
            ...receipt.submittedFields,
            submittedVia: 'this_portal',
            provider: receipt.provider,
            submittedAt: new Date()
          },
          employerDeliveredAt: receipt.status === 'confirmed' ? new Date() : undefined
        }
      }, { new: true });
      await ProductEventService.record({
        name: receipt.status === 'confirmed' ? 'application_confirmed' : 'application_submitted',
        actorUserId: user._id,
        studentId: student._id,
        jobId: job._id,
        applicationId: application._id,
        sourceProvider: receipt.provider,
        metadata: { externalApplicationId: receipt.externalApplicationId }
      });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof BrowserSubmissionError) {
        const interventionByReason = {
          captcha_required: { workflowState: 'needs_user_input', type: 'captcha' },
          login_required: { workflowState: 'needs_authentication', type: 'authentication' },
          missing_required_custom_question: { workflowState: 'needs_user_input', type: 'unsupported_question' },
          resume_upload_failed: { workflowState: 'needs_document', type: 'document' }
        } as const;
        const intervention = interventionByReason[error.reason as keyof typeof interventionByReason];
        if (intervention) {
          const paused = await Application.findByIdAndUpdate(application._id, {
            $set: {
              status: 'pending_review',
              workflowState: intervention.workflowState,
              failureReason: error.reason,
              atsResponseRaw: {
                error: message,
                failureReason: error.reason,
                diagnostics: error.diagnostics,
                failedAt: new Date()
              },
              intervention: {
                type: intervention.type,
                reason: message,
                requiredFields: error.diagnostics.visibleRequiredFields?.map(field => field.label || field.name || field.type || field.tag),
                createdAt: new Date()
              }
            }
          }, { new: true });
          await ProductEventService.record({
            name: 'application_paused',
            actorUserId: user._id,
            studentId: student._id,
            jobId: job._id,
            applicationId: application._id,
            sourceProvider: job.atsPlatform || job.sourceProvider,
            reason: error.reason
          });
          return paused;
        }

        const unknown = error.reason === 'submission_not_confirmed';
        await Application.findByIdAndUpdate(application._id, {
          $set: {
            status: unknown ? 'submitted' : 'failed',
            workflowState: unknown
              ? 'submission_unknown'
              : error.reason === 'external_site_blocked'
                ? 'failed_final'
                : 'failed_retryable',
            failureReason: error.reason,
            atsResponseRaw: {
              error: message,
              failureReason: error.reason,
              diagnostics: error.diagnostics,
              failedAt: new Date()
            }
          }
        });
        await ProductEventService.record({
          name: 'application_failed',
          actorUserId: user._id,
          studentId: student._id,
          jobId: job._id,
          applicationId: application._id,
          sourceProvider: job.atsPlatform || job.sourceProvider,
          reason: error.reason
        });
        throw error;
      }
      const failureReason = /not implemented/i.test(message) ? 'unsupported_ats' : 'ats_submission_failed';
      const ambiguous = /timeout|ECONNRESET|socket hang up/i.test(message);
      await Application.findByIdAndUpdate(application._id, {
        $set: {
          status: ambiguous ? 'submitted' : 'failed',
          workflowState: ambiguous ? 'submission_unknown' : (failureReason === 'unsupported_ats' ? 'unsupported' : 'failed_retryable'),
          failureReason: ambiguous ? 'submission_unknown' : failureReason,
          atsResponseRaw: {
            error: message,
            failureReason,
            failedAt: new Date()
          }
        }
      });
      await ProductEventService.record({
        name: 'application_failed',
        actorUserId: user._id,
        studentId: student._id,
        jobId: job._id,
        applicationId: application._id,
        sourceProvider: job.atsPlatform || job.sourceProvider,
        reason: ambiguous ? 'submission_unknown' : failureReason
      });
      throw error;
    }
  }

  private async assertConsent(userId: Types.ObjectId, autoApply: boolean): Promise<void> {
    if (process.env.ENFORCE_APPLICATION_CONSENT !== 'true') return;
    const purposes = autoApply
      ? ['application_submission', 'employer_data_sharing', 'auto_apply']
      : ['application_submission', 'employer_data_sharing'];
    const granted = await ConsentRecord.distinct('purpose', {
      userId,
      purpose: { $in: purposes },
      status: 'granted'
    });
    const missing = purposes.filter(purpose => !granted.includes(purpose as any));
    if (missing.length) throw new Error(`Consent required before application submission: ${missing.join(', ')}`);
  }
}

export default new ApplicationSubmissionService();
