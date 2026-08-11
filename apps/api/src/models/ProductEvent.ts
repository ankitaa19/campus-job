import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProductEventName =
  | 'job_ingested'
  | 'job_updated'
  | 'job_expired'
  | 'recommendation_generated'
  | 'job_impression'
  | 'job_opened'
  | 'job_saved'
  | 'job_hidden'
  | 'external_apply_clicked'
  | 'application_started'
  | 'application_paused'
  | 'application_resumed'
  | 'application_submitted'
  | 'application_confirmed'
  | 'application_failed'
  | 'employer_shortlisted'
  | 'interview_scheduled'
  | 'offer_received'
  | 'hired'
  | 'user_withdrew'
  | 'employer_rejected';

export interface IProductEvent extends Document {
  eventId: string;
  name: ProductEventName;
  occurredAt: Date;
  actorUserId?: Types.ObjectId;
  studentId?: Types.ObjectId;
  jobId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
  sessionId?: string;
  modelVersion?: string;
  experimentId?: string;
  experimentVariant?: string;
  rank?: number;
  candidateSetSize?: number;
  scores?: Record<string, number>;
  profileVersion?: string;
  jobVersion?: string;
  sourceProvider?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ProductEventSchema = new Schema<IProductEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  name: {
    type: String,
    required: true,
    index: true,
    enum: [
      'job_ingested', 'job_updated', 'job_expired', 'recommendation_generated',
      'job_impression', 'job_opened', 'job_saved', 'job_hidden',
      'external_apply_clicked', 'application_started', 'application_paused',
      'application_resumed', 'application_submitted', 'application_confirmed',
      'application_failed', 'employer_shortlisted', 'interview_scheduled',
      'offer_received', 'hired', 'user_withdrew', 'employer_rejected'
    ]
  },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', index: true },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', index: true },
  sessionId: { type: String, trim: true, index: true },
  modelVersion: { type: String, trim: true, index: true },
  experimentId: { type: String, trim: true, index: true },
  experimentVariant: { type: String, trim: true },
  rank: { type: Number, min: 0 },
  candidateSetSize: { type: Number, min: 0 },
  scores: { type: Schema.Types.Mixed },
  profileVersion: { type: String, trim: true },
  jobVersion: { type: String, trim: true },
  sourceProvider: { type: String, trim: true, lowercase: true, index: true },
  reason: { type: String, trim: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'product_events'
});

ProductEventSchema.index({ studentId: 1, occurredAt: -1 });
ProductEventSchema.index({ jobId: 1, name: 1, occurredAt: -1 });
ProductEventSchema.index({ applicationId: 1, occurredAt: 1 });
ProductEventSchema.index({ modelVersion: 1, experimentId: 1, occurredAt: -1 });

export const ProductEvent = mongoose.model<IProductEvent>('ProductEvent', ProductEventSchema);
