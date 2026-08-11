import { Types } from 'mongoose';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { Student } from '../models/Student';
import { User } from '../models/User';
import TailoringService from './ats/tailoring.service';
import { getAtsAdapter } from './ats/registry';

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
    return application.save();
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
        lastDeliveryAttemptAt: new Date(),
        coverLetterUsed: materials.coverLetterText,
        submittedFieldsJson
      },
      $inc: { deliveryAttemptCount: 1 }
    });

    try {
      const adapter = getAtsAdapter(job.atsPlatform || 'other');
      const receipt = await adapter.submitApplication({ application, job, student, user, materials });
      return Application.findByIdAndUpdate(application._id, {
        $set: {
          status: receipt.status,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failureReason = /not implemented/i.test(message) ? 'unsupported_ats' : 'ats_submission_failed';
      await Application.findByIdAndUpdate(application._id, {
        $set: {
          status: 'failed',
          failureReason,
          atsResponseRaw: {
            error: message,
            failureReason,
            failedAt: new Date()
          }
        }
      });
      throw error;
    }
  }
}

export default new ApplicationSubmissionService();
