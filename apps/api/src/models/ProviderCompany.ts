import mongoose, { Document, Schema, Types } from 'mongoose';

export type JobProviderName = 'adzuna' | 'lever' | 'greenhouse' | 'ashby' | 'smartrecruiters' | 'workday' | 'career_page' | 'selenium_page' | 'himalayas' | 'weworkremotely';

export interface IProviderCompany extends Document {
  provider: JobProviderName;
  companySlug: string;
  companyName: string;
  sourceType: 'company_careers' | 'job_board';
  recruiterId?: Types.ObjectId;
  apiRegion: 'global' | 'eu';
  pageUrl?: string;
  automationPermission?: 'not_granted' | 'written_permission' | 'public_terms_allow';
  automationPermissionGrantedAt?: Date;
  automationPermissionGrantedBy?: Types.ObjectId;
  automationPermissionEvidenceUrl?: string;
  automationPermissionNotes?: string;
  jobLinkSelector?: string;
  maxJobsPerSync?: number;
  directoryManaged?: boolean;
  discoveryStatus?: 'pending' | 'verified' | 'unsupported' | 'failed';
  lastDiscoveredAt?: Date;
  isActive: boolean;
  lastSyncedAt?: Date;
  lastSyncStatus: 'never' | 'success' | 'partial' | 'failed';
  lastError?: string;
  lastFetchedCount: number;
  lastCreatedCount: number;
  lastUpdatedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderCompanySchema = new Schema<IProviderCompany>({
  provider: { type: String, enum: ['adzuna', 'lever', 'greenhouse', 'ashby', 'smartrecruiters', 'workday', 'career_page', 'selenium_page', 'himalayas', 'weworkremotely'], required: true, index: true },
  companySlug: { type: String, required: true, trim: true, lowercase: true },
  companyName: { type: String, required: true, trim: true },
  sourceType: { type: String, enum: ['company_careers', 'job_board'], default: 'company_careers' },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', index: true },
  apiRegion: { type: String, enum: ['global', 'eu'], default: 'global' },
  pageUrl: { type: String, trim: true },
  automationPermission: { type: String, enum: ['not_granted', 'written_permission', 'public_terms_allow'], default: 'not_granted' },
  automationPermissionGrantedAt: Date,
  automationPermissionGrantedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  automationPermissionEvidenceUrl: { type: String, trim: true },
  automationPermissionNotes: { type: String, trim: true, maxlength: 1000 },
  jobLinkSelector: { type: String, trim: true },
  maxJobsPerSync: { type: Number, min: 1, max: 100, default: 30 },
  directoryManaged: { type: Boolean, default: false, index: true },
  discoveryStatus: { type: String, enum: ['pending', 'verified', 'unsupported', 'failed'] },
  lastDiscoveredAt: Date,
  isActive: { type: Boolean, default: true, index: true },
  lastSyncedAt: Date,
  lastSyncStatus: { type: String, enum: ['never', 'success', 'partial', 'failed'], default: 'never' },
  lastError: String,
  lastFetchedCount: { type: Number, default: 0 },
  lastCreatedCount: { type: Number, default: 0 },
  lastUpdatedCount: { type: Number, default: 0 }
}, { timestamps: true });

ProviderCompanySchema.index({ provider: 1, companySlug: 1 }, { unique: true });

export const ProviderCompany = mongoose.model<IProviderCompany>('ProviderCompany', ProviderCompanySchema);
