import { Types } from 'mongoose';
import { User } from '../models/User';
import ApplicationSubmissionService from './application-submission';

class AutoApplyService {
  async handleMatchedJob(
    userId: string | Types.ObjectId,
    jobId: string | Types.ObjectId,
    score: number,
    options: { forceSubmit?: boolean } = {}
  ) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');
    const normalizedScore = score > 1 ? score / 100 : score;
    const threshold = Number.isFinite(Number(user.autoApplyThreshold)) ? Number(user.autoApplyThreshold) : 0.85;
    const requireReview = !options.forceSubmit && user.requireReview === true;

    if (!options.forceSubmit && (requireReview || normalizedScore < threshold)) {
      const application = await ApplicationSubmissionService.createPendingReviewApplication(user._id, jobId, normalizedScore);
      return { action: 'pending_review' as const, application };
    }

    const queued = await ApplicationSubmissionService.createQueuedApplication(user._id, jobId, normalizedScore);
    const application = await ApplicationSubmissionService.submitQueuedApplication(queued._id);
    return { action: 'submitted' as const, application };
  }
}

export default new AutoApplyService();
