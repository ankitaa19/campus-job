import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISourceJobSnapshot extends Document {
  provider: string;
  companySlug: string;
  externalId: string;
  contentHash: string;
  providerCompanyId?: Types.ObjectId;
  fetchedAt: Date;
  parserVersion: number;
  rawPayload: unknown;
  normalizationWarnings: string[];
  createdAt: Date;
}

const SourceJobSnapshotSchema = new Schema<ISourceJobSnapshot>({
  provider: { type: String, required: true, trim: true, lowercase: true, index: true },
  companySlug: { type: String, required: true, trim: true, lowercase: true, index: true },
  externalId: { type: String, required: true, trim: true },
  contentHash: { type: String, required: true, trim: true },
  providerCompanyId: { type: Schema.Types.ObjectId, ref: 'ProviderCompany', index: true },
  fetchedAt: { type: Date, required: true, default: Date.now, index: true },
  parserVersion: { type: Number, required: true, default: 1 },
  rawPayload: { type: Schema.Types.Mixed, required: true },
  normalizationWarnings: [{ type: String, trim: true }]
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'source_job_snapshots'
});

SourceJobSnapshotSchema.index(
  { provider: 1, companySlug: 1, externalId: 1, contentHash: 1 },
  { unique: true }
);
SourceJobSnapshotSchema.index({ providerCompanyId: 1, fetchedAt: -1 });

export const SourceJobSnapshot = mongoose.model<ISourceJobSnapshot>('SourceJobSnapshot', SourceJobSnapshotSchema);
