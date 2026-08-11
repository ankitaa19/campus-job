import express from 'express';
import { Types } from 'mongoose';
import authMiddleware from '../middleware/auth';
import { ProductEventName } from '../models/ProductEvent';
import { Student } from '../models/Student';
import ProductEventService from '../services/product-events';

const router = express.Router();
const clientEventNames = new Set<ProductEventName>([
  'job_impression', 'job_opened', 'job_saved', 'job_hidden',
  'external_apply_clicked', 'application_started', 'user_withdrew'
]);

router.post('/events', authMiddleware, async (req: any, res) => {
  const userId = req.user?._id || req.user?.userId;
  const payload = Array.isArray(req.body?.events) ? req.body.events : [req.body];
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!payload.length || payload.length > 100) {
    return res.status(400).json({ success: false, message: 'Submit between 1 and 100 events' });
  }

  const invalid = payload.find(event =>
    !event?.eventId ||
    !clientEventNames.has(event?.name) ||
    (event.jobId && !Types.ObjectId.isValid(event.jobId)) ||
    (event.applicationId && !Types.ObjectId.isValid(event.applicationId))
  );
  if (invalid) {
    return res.status(400).json({
      success: false,
      message: 'Each event requires eventId and an allowed name with valid resource IDs'
    });
  }

  const student = await Student.findOne({ userId }).select('_id').lean();
  await ProductEventService.recordMany(payload.map(event => ({
    eventId: String(event.eventId),
    name: event.name,
    occurredAt: event.occurredAt ? new Date(event.occurredAt) : new Date(),
    actorUserId: userId,
    studentId: student?._id,
    jobId: event.jobId,
    applicationId: event.applicationId,
    sessionId: event.sessionId,
    modelVersion: event.modelVersion,
    experimentId: event.experimentId,
    experimentVariant: event.experimentVariant,
    rank: event.rank,
    candidateSetSize: event.candidateSetSize,
    scores: event.scores,
    reason: event.reason,
    metadata: event.metadata
  })));

  return res.status(202).json({ success: true, accepted: payload.length });
});

export default router;
