import mongoose, { Document, Schema, Types } from 'mongoose';

export type JobInteractionType = 'view' | 'click' | 'save' | 'dismiss' | 'apply' | 'abandon';

export interface IJobInteraction extends Document {
  studentId: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  type: JobInteractionType;
  weight: number;
  jobFeatures: { industry?: string; title?: string; skills: string[]; jobType?: string; workMode?: string };
  sessionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const JobInteractionSchema = new Schema<IJobInteraction>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  type: { type: String, enum: ['view', 'click', 'save', 'dismiss', 'apply', 'abandon'], required: true, index: true },
  weight: { type: Number, required: true },
  jobFeatures: {
    industry: String, title: String, skills: [{ type: String }], jobType: String, workMode: String
  },
  sessionId: { type: String, trim: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

JobInteractionSchema.index({ studentId: 1, createdAt: -1 });
JobInteractionSchema.index({ studentId: 1, jobId: 1, type: 1, createdAt: -1 });

export const JobInteraction = mongoose.model<IJobInteraction>('JobInteraction', JobInteractionSchema);
