import crypto from 'crypto';
import express from 'express';
import authMiddleware from '../middleware/auth';
import { ConsentPurpose, ConsentRecord } from '../models/ConsentRecord';

const router = express.Router();
const purposes = new Set<ConsentPurpose>([
  'personalized_recommendations', 'resume_processing', 'application_submission',
  'auto_apply', 'employer_data_sharing', 'analytics'
]);

const ipHash = (ip: string): string => crypto
  .createHmac('sha256', process.env.CONSENT_AUDIT_SECRET || process.env.JWT_SECRET || 'development-only')
  .update(ip)
  .digest('hex');

router.get('/consents', authMiddleware, async (req: any, res) => {
  const userId = req.user?._id || req.user?.userId;
  const records = await ConsentRecord.find({ userId })
    .select('-ipHash -userAgent')
    .sort({ updatedAt: -1 })
    .lean();
  return res.json({ success: true, data: records });
});

router.put('/consents/:purpose', authMiddleware, async (req: any, res) => {
  const userId = req.user?._id || req.user?.userId;
  const purpose = req.params.purpose as ConsentPurpose;
  const policyVersion = String(req.body?.policyVersion || '').trim();
  const granted = req.body?.granted;
  if (!purposes.has(purpose)) {
    return res.status(400).json({ success: false, message: 'Unsupported consent purpose' });
  }
  if (!policyVersion || typeof granted !== 'boolean') {
    return res.status(400).json({ success: false, message: 'policyVersion and granted are required' });
  }

  const now = new Date();
  const record = await ConsentRecord.findOneAndUpdate(
    { userId, purpose, policyVersion },
    {
      $set: {
        status: granted ? 'granted' : 'withdrawn',
        ...(granted ? { grantedAt: now } : { withdrawnAt: now }),
        noticeUrl: req.body?.noticeUrl,
        collectionMethod: req.body?.collectionMethod || 'web',
        ipHash: ipHash(req.ip || ''),
        userAgent: String(req.get('user-agent') || '').slice(0, 512),
        metadata: req.body?.metadata
      },
      ...(granted ? { $unset: { withdrawnAt: 1 } } : {})
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).select('-ipHash -userAgent');

  return res.json({ success: true, data: record });
});

export default router;
