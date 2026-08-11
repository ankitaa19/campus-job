import mongoose, { Document, Schema, Types } from 'mongoose';

export type ConsentPurpose =
  | 'personalized_recommendations'
  | 'resume_processing'
  | 'application_submission'
  | 'auto_apply'
  | 'employer_data_sharing'
  | 'analytics';

export interface IConsentRecord extends Document {
  userId: Types.ObjectId;
  purpose: ConsentPurpose;
  policyVersion: string;
  status: 'granted' | 'withdrawn';
  grantedAt: Date;
  withdrawnAt?: Date;
  noticeUrl?: string;
  collectionMethod: 'web' | 'mobile' | 'admin_import' | 'api';
  ipHash?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: {
    type: String,
    required: true,
    index: true,
    enum: [
      'personalized_recommendations', 'resume_processing', 'application_submission',
      'auto_apply', 'employer_data_sharing', 'analytics'
    ]
  },
  policyVersion: { type: String, required: true, trim: true },
  status: { type: String, enum: ['granted', 'withdrawn'], required: true, index: true },
  grantedAt: { type: Date, required: true, default: Date.now },
  withdrawnAt: Date,
  noticeUrl: { type: String, trim: true },
  collectionMethod: { type: String, enum: ['web', 'mobile', 'admin_import', 'api'], default: 'web' },
  ipHash: { type: String, trim: true, select: false },
  userAgent: { type: String, trim: true, select: false },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true, collection: 'consent_records' });

ConsentRecordSchema.index({ userId: 1, purpose: 1, policyVersion: 1 }, { unique: true });
ConsentRecordSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const ConsentRecord = mongoose.model<IConsentRecord>('ConsentRecord', ConsentRecordSchema);
