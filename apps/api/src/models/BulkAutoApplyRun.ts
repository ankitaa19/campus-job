import mongoose, { Document, Schema, Types } from 'mongoose';

export type BulkAutoApplyRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface IBulkAutoApplyRun extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: BulkAutoApplyRunStatus;
  filters?: Record<string, unknown>;
  totalJobs: number;
  processedCount: number;
  succeededCount: number;
  pendingReviewCount: number;
  failedCount: number;
  skippedCount: number;
  needsYouCount: number;
  unsupportedCount: number;
  unsupportedAtsCount: number;
  failureReasons: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const BulkAutoApplyRunSchema = new Schema<IBulkAutoApplyRun>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], default: 'pending', required: true, index: true },
  filters: { type: Schema.Types.Mixed },
  totalJobs: { type: Number, default: 0, min: 0 },
  processedCount: { type: Number, default: 0, min: 0 },
  succeededCount: { type: Number, default: 0, min: 0 },
  pendingReviewCount: { type: Number, default: 0, min: 0 },
  failedCount: { type: Number, default: 0, min: 0 },
  skippedCount: { type: Number, default: 0, min: 0 },
  needsYouCount: { type: Number, default: 0, min: 0 },
  unsupportedCount: { type: Number, default: 0, min: 0 },
  unsupportedAtsCount: { type: Number, default: 0, min: 0 },
  failureReasons: { type: Schema.Types.Mixed, default: {} },
  completedAt: Date
}, { timestamps: true });

BulkAutoApplyRunSchema.index({ userId: 1, createdAt: -1 });

export const BulkAutoApplyRun = mongoose.model<IBulkAutoApplyRun>('BulkAutoApplyRun', BulkAutoApplyRunSchema);
