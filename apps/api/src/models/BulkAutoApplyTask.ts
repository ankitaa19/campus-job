import mongoose, { Document, Schema, Types } from 'mongoose';

export type BulkAutoApplyTaskStatus = 'pending' | 'running' | 'succeeded' | 'pending_review' | 'failed' | 'skipped';

export interface IBulkAutoApplyTask extends Document {
  _id: Types.ObjectId;
  runId: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  status: BulkAutoApplyTaskStatus;
  atsPlatform: string;
  score: number;
  applicationId?: Types.ObjectId;
  failureReason?: string;
  errorMessage?: string;
  counterApplied: boolean;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BulkAutoApplyTaskSchema = new Schema<IBulkAutoApplyTask>({
  runId: { type: Schema.Types.ObjectId, ref: 'BulkAutoApplyRun', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  status: { type: String, enum: ['pending', 'running', 'succeeded', 'pending_review', 'failed', 'skipped'], default: 'pending', required: true, index: true },
  atsPlatform: { type: String, default: 'other', index: true },
  score: { type: Number, min: 0, max: 1, required: true },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  failureReason: { type: String, index: true },
  errorMessage: String,
  counterApplied: { type: Boolean, default: false, index: true },
  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

BulkAutoApplyTaskSchema.index({ runId: 1, jobId: 1 }, { unique: true });
BulkAutoApplyTaskSchema.index({ runId: 1, status: 1 });

export const BulkAutoApplyTask = mongoose.model<IBulkAutoApplyTask>('BulkAutoApplyTask', BulkAutoApplyTaskSchema);
