import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobRequirement {
  skill: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  mandatory: boolean;
  category: 'technical' | 'soft' | 'language' | 'certification';
}

export interface ISalaryRange {
  min: number;
  max: number;
  currency: string;
  negotiable: boolean;
}

export type ATSPlatform = 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'smartrecruiters' | 'other';

export interface IJobLocation {
  city: string;
  state: string;
  country: string;
  isRemote: boolean;
  hybrid: boolean;
}

export interface IInterviewProcess {
  rounds: string[];
  duration: string;
  mode: 'online' | 'offline' | 'hybrid';
  additionalInfo?: string;
}

export interface IApplicationConfiguration {
  requiredFields: string[];
  customQuestions: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'boolean' | 'single_select' | 'multi_select' | 'file' | 'date' | 'unknown';
    required: boolean;
    options?: string[];
  }>;
  requiredDocuments: string[];
  requiresAuthentication: boolean;
  requiresAssessment: boolean;
  requiresCaptcha: boolean;
  unsupportedQuestionTypes: string[];
  lastInspectedAt?: Date;
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  
  // Basic Information
  title: string;
  description: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
  department: string;
  
  // Company & Recruiter
  recruiterId?: Types.ObjectId;
  companyName: string;

  // Origin is retained for audit/refresh purposes only. Applications always
  // remain on CampusPe; sourceUrl is never returned as an apply action.
  source: 'campuspe' | 'company_careers' | 'job_board';
  sourceExternalId?: string;
  sourceProvider?: string;
  sourceCompanySlug?: string;
  providerCompanyId?: Types.ObjectId;
  sourceUrl?: string;
  attributionName?: string;
  attributionUrl?: string;
  importedAt?: Date;
  sourceLifecycleStatus?: 'active' | 'missing_on_source' | 'recheck' | 'expired';
  lastVerifiedAt?: Date;
  firstMissingAt?: Date;
  lastMissingAt?: Date;
  nextSourceRecheckAt?: Date;
  missingSourceCount: number;
  
  // Location & Work Mode
  locations: IJobLocation[];
  workMode: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  remoteType?: 'remote' | 'onsite' | 'hybrid';
  
  // Requirements
  requirements: IJobRequirement[];
  requiredSkills: string[]; // Simple array for matching
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  seniority?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  minExperience: number; // in years
  maxExperience?: number;
  noticePeriodDays?: number;
  
  // Education Requirements
  educationRequirements: {
    degree: string;
    field?: string;
    minimumGrade?: number;
    mandatory: boolean;
  }[];
  
  // Compensation
  salary: ISalaryRange;
  salaryBand?: ISalaryRange;
  benefits: string[];
  
  // Application Details
  applicationDeadline: Date;
  expectedJoiningDate?: Date;
  totalPositions: number;
  filledPositions: number;
  
  // Targeting
  targetColleges: Types.ObjectId[];
  targetCourses: string[];
  allowDirectApplications: boolean;
  atsPlatform?: ATSPlatform;
  atsJobId?: string;
  applyUrl?: string;
  applicationConfiguration?: IApplicationConfiguration;
  
  // Visibility
  isPublic: boolean; // If true, job is visible on public jobs page
  
  // Interview & Selection
  interviewProcess: IInterviewProcess;
  
  // Status & Metadata
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  isUrgent: boolean;
  featuredUntil?: Date;
  
  // AI & Matching
  aiGeneratedDescription?: string;
  matchingKeywords: string[];
  normalizedTitle?: string;
  canonicalSkills: string[];
  certifications: string[];
  industry?: string;
  featureVector: number[];
  dedupFingerprint?: string;
  normalizationVersion?: number;
  
  // Analytics
  views: number;
  applications: Types.ObjectId[];
  
  // Timestamps
  postedAt: Date;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobRequirementSchema = new Schema({
  skill: { type: String, required: true, trim: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], required: true },
  mandatory: { type: Boolean, default: false },
  category: { type: String, enum: ['technical', 'soft', 'language', 'certification'], required: true }
});

const SalaryRangeSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  negotiable: { type: Boolean, default: false }
});

const JobLocationSchema = new Schema({
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  isRemote: { type: Boolean, default: false },
  hybrid: { type: Boolean, default: false }
});

const AtsPlatformValues: ATSPlatform[] = ['greenhouse', 'lever', 'workday', 'ashby', 'smartrecruiters', 'other'];

const InterviewProcessSchema = new Schema({
  rounds: [{ type: String, required: true }],
  duration: { type: String, required: true },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
  additionalInfo: { type: String }
});

const ApplicationConfigurationSchema = new Schema({
  requiredFields: [{ type: String, trim: true }],
  customQuestions: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'boolean', 'single_select', 'multi_select', 'file', 'date', 'unknown'],
      default: 'unknown'
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }]
  }],
  requiredDocuments: [{ type: String, trim: true }],
  requiresAuthentication: { type: Boolean, default: false },
  requiresAssessment: { type: Boolean, default: false },
  requiresCaptcha: { type: Boolean, default: false },
  unsupportedQuestionTypes: [{ type: String, trim: true }],
  lastInspectedAt: Date
}, { _id: false });

const EducationRequirementSchema = new Schema({
  degree: { type: String, required: true },
  field: { type: String },
  minimumGrade: { type: Number },
  mandatory: { type: Boolean, default: false }
});

const JobSchema = new Schema<IJob>({
  // Basic Information
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true },
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'], 
    required: true,
    index: true 
  },
  department: { type: String, required: true, trim: true },
  
  // Company & Recruiter
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', index: true },
  companyName: { type: String, required: true, trim: true, index: true },
  source: { type: String, enum: ['campuspe', 'company_careers', 'job_board'], default: 'campuspe', index: true },
  sourceExternalId: { type: String, trim: true },
  sourceUrl: { type: String, trim: true, select: false },
  attributionName: { type: String, trim: true },
  attributionUrl: { type: String, trim: true },
  sourceProvider: { type: String, trim: true, lowercase: true, index: true },
  sourceCompanySlug: { type: String, trim: true, lowercase: true, index: true },
  providerCompanyId: { type: Schema.Types.ObjectId, ref: 'ProviderCompany', index: true },
  importedAt: { type: Date },
  sourceLifecycleStatus: { type: String, enum: ['active', 'missing_on_source', 'recheck', 'expired'], index: true },
  lastVerifiedAt: { type: Date, index: true },
  firstMissingAt: Date,
  lastMissingAt: Date,
  nextSourceRecheckAt: { type: Date, index: true },
  missingSourceCount: { type: Number, default: 0, min: 0 },
  
  // Location & Work Mode
  locations: [JobLocationSchema],
  workMode: { 
    type: String, 
    enum: ['remote', 'onsite', 'hybrid'], 
    required: true,
    index: true 
  },
  location: { type: String, trim: true, index: true },
  remoteType: { type: String, enum: ['remote', 'onsite', 'hybrid'], index: true },
  
  // Requirements
  requirements: [JobRequirementSchema],
  requiredSkills: [{ type: String, trim: true, lowercase: true, index: true }],
  experienceLevel: { 
    type: String, 
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'], 
    required: true,
    index: true 
  },
  seniority: { type: String, enum: ['entry', 'mid', 'senior', 'lead', 'executive'], index: true },
  minExperience: { type: Number, required: true, min: 0 },
  maxExperience: { type: Number, min: 0 },
  noticePeriodDays: { type: Number, min: 0, index: true },
  
  // Education Requirements
  educationRequirements: [EducationRequirementSchema],
  
  // Compensation
  salary: { type: SalaryRangeSchema, required: true },
  salaryBand: { type: SalaryRangeSchema },
  benefits: [{ type: String }],
  
  // Application Details
  applicationDeadline: { type: Date, required: true, index: true },
  expectedJoiningDate: { type: Date },
  totalPositions: { type: Number, required: true, min: 1 },
  filledPositions: { type: Number, default: 0, min: 0 },
  
  // Targeting
  targetColleges: [{ type: Schema.Types.ObjectId, ref: 'College' }],
  targetCourses: [{ type: String }],
  allowDirectApplications: { type: Boolean, default: true },
  atsPlatform: { type: String, enum: AtsPlatformValues, default: 'other', index: true },
  atsJobId: { type: String, trim: true, index: true },
  applyUrl: { type: String, trim: true, select: false },
  applicationConfiguration: { type: ApplicationConfigurationSchema },
  
  // Visibility
  isPublic: { type: Boolean, default: false, index: true }, // If true, job is visible on public jobs page
  
  // Interview & Selection
  interviewProcess: { type: InterviewProcessSchema, required: true },
  
  // Status & Metadata
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'closed', 'expired'], 
    default: 'draft',
    index: true 
  },
  isUrgent: { type: Boolean, default: false, index: true },
  featuredUntil: { type: Date },
  
  // AI & Matching
  aiGeneratedDescription: { type: String },
  matchingKeywords: [{ type: String }],
  normalizedTitle: { type: String, trim: true, lowercase: true, index: true },
  canonicalSkills: [{ type: String, trim: true, lowercase: true, index: true }],
  certifications: [{ type: String, trim: true }],
  industry: { type: String, trim: true, index: true },
  featureVector: [{ type: Number, select: false }],
  dedupFingerprint: { type: String, trim: true, index: true },
  normalizationVersion: { type: Number, default: 1, index: true },
  
  // Analytics
  views: { type: Number, default: 0 },
  applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  
  // Timestamps
  postedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for optimization
JobSchema.index({ title: 'text', description: 'text', 'requirements.skill': 'text' });
JobSchema.index({ status: 1, postedAt: -1 });
JobSchema.index({ 'locations.city': 1, 'locations.state': 1 });
JobSchema.index({ jobType: 1, experienceLevel: 1 });
JobSchema.index({ applicationDeadline: 1, status: 1 });
JobSchema.index({ 'requirements.skill': 1 });
JobSchema.index({ targetColleges: 1, status: 1 });
JobSchema.index({ companyName: 1, status: 1 });
JobSchema.index({ workMode: 1, status: 1 });
JobSchema.index({ atsPlatform: 1, atsJobId: 1 });
// An upstream vacancy can be refreshed safely without creating a second job.
JobSchema.index(
  { source: 1, sourceExternalId: 1 },
  { unique: true, partialFilterExpression: { sourceExternalId: { $type: 'string' } } }
);
JobSchema.index({ sourceProvider: 1, sourceCompanySlug: 1, status: 1 });
JobSchema.index({ sourceLifecycleStatus: 1, nextSourceRecheckAt: 1 });
JobSchema.index({ status: 1, postedAt: -1, industry: 1 });

// Compound indexes for complex queries
JobSchema.index({ 
  status: 1, 
  'locations.city': 1, 
  jobType: 1, 
  experienceLevel: 1 
});

// Middleware to update lastModified
JobSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

export const Job = mongoose.model<IJob>('Job', JobSchema);
