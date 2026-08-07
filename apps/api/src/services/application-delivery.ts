import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { Recruiter } from '../models/Recruiter';
import { Student } from '../models/Student';
import { sendRecruiterApplicationNotification } from './notifications';

class ApplicationDeliveryService {
  private running = false;

  async processPending(limit = 100, force = false): Promise<{ checked: number; delivered: number; pending: number; errors: number }> {
    if (this.running) return { checked: 0, delivered: 0, pending: 0, errors: 0 };
    this.running = true;
    const summary = { checked: 0, delivered: 0, pending: 0, errors: 0 };
    try {
      const applications = await Application.find({
        employerDeliveryStatus: 'awaiting_employer_connection',
        ...(force ? {} : {
          $or: [
            { nextDeliveryAttemptAt: { $exists: false } },
            { nextDeliveryAttemptAt: { $lte: new Date() } }
          ]
        })
      }).sort({ appliedAt: 1 }).limit(Math.min(500, Math.max(1, limit))).lean();

      for (const application of applications) {
        summary.checked += 1;
        try {
          const job = await Job.findById(application.jobId).select('title companyName recruiterId').lean();
          if (!job?.recruiterId) {
            await Application.updateOne(
              { _id: application._id, employerDeliveryStatus: 'awaiting_employer_connection' },
              { $set: { lastDeliveryAttemptAt: new Date(), nextDeliveryAttemptAt: new Date(Date.now() + 15 * 60000) }, $inc: { deliveryAttemptCount: 1 } }
            );
            summary.pending += 1;
            continue;
          }

          const delivered = await Application.findOneAndUpdate(
            { _id: application._id, employerDeliveryStatus: 'awaiting_employer_connection' },
            {
              $set: {
                recruiterId: job.recruiterId,
                employerDeliveryStatus: 'delivered_to_campuspe_employer',
                employerDeliveredAt: new Date(),
                lastDeliveryAttemptAt: new Date()
              },
              $unset: { nextDeliveryAttemptAt: 1 }
            },
            { new: true }
          );
          if (!delivered) continue;

          const [recruiter, student] = await Promise.all([
            Recruiter.findById(job.recruiterId).populate('userId', 'email').lean(),
            Student.findById(application.studentId).select('firstName lastName').lean()
          ]);
          const recruiterUser = recruiter?.userId as any;
          if (recruiterUser?._id) {
            await sendRecruiterApplicationNotification(
              String(recruiterUser._id),
              String(application._id),
              String(job._id),
              job.title,
              job.companyName,
              `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
              recruiterUser.email || undefined
            );
          }
          summary.delivered += 1;
        } catch (error) {
          summary.errors += 1;
          console.error(`Pending application delivery failed for ${application._id}:`, error);
        }
      }
      return summary;
    } finally {
      this.running = false;
    }
  }
}

export default new ApplicationDeliveryService();
