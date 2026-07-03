import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobRequirement {
  skill: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  mandatory: boolean;
  category: 'technical' | 'soft' | 'language' | 'certification';
  weight: number; // AI scoring weight (0-1)
}

export interface ISalaryRange {
  min: number;
  max: number;
  currency: string;
  negotiable: boolean;
  equityComponent?: number; // Percentage
  bonusStructure?: Record<string, any>;
}

export interface IJobLocation {
  city: string;
  state: string;
  country: string;
  isRemote: boolean;
  hybrid: boolean;
  timezone?: string;
  officeAddress?: string;
  coordinates?: { lat: number; lng: number };
}

export interface IInterviewProcess {
  rounds: {
    name: string;
    type: 'technical' | 'hr' | 'managerial' | 'cultural' | 'case_study';
    duration: string;
    mode: 'online' | 'offline' | 'hybrid';
    weightage: number;
  }[];
  totalDuration: string;
  additionalInfo?: string;
  assessmentLinks?: string[];
}

export interface IAIJobFeatures {
  jobVector?: number[]; // Job embedding for semantic matching
  skillsVector?: number[]; // Skills-specific vector
  matchingScore?: number; // Overall job attractiveness score
  aiGeneratedSummary?: string;
  keywordDensity?: Record<string, number>;
  competitiveAnalysis?: {
    similarJobsCount: number;
    salaryPercentile: number;
    demandScore: number;
  };
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId; // Multi-tenant isolation
  
  // Basic Information
  title: string;
  description: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance' | 'apprenticeship';
  department: string;
  category: string; // Engineering, Sales, Marketing, etc.
  subCategory?: string;
  
  // Company & Recruiter
  recruiterId: Types.ObjectId;
  companyName: string;
  companyId?: Types.ObjectId; // If company is in our system
  hiringManagerId?: Types.ObjectId;
  
  // Location & Work Mode
  locations: IJobLocation[];
  workMode: 'remote' | 'onsite' | 'hybrid';
  timeZoneRequirement?: string;
  travelRequirement?: string;
  
  // Requirements & Skills
  requirements: IJobRequirement[];
  requiredSkills: string[]; // Simple array for backward compatibility
  preferredSkills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | 'director';
  minExperience: number; // in years
  maxExperience?: number;
  
  // Education Requirements
  educationRequirements: {
    degree: string;
    field?: string;
    minimumGrade?: number;
    mandatory: boolean;
    alternatives?: string[]; // Alternative qualifications
  }[];
  certificationRequirements?: string[];
  
  // Compensation & Benefits
  salary: ISalaryRange;
  benefits: string[];
  workLifeBalance?: {
    flexibleHours: boolean;
    paidTimeOff: string;
    healthInsurance: boolean;
    retirementPlan: boolean;
    learningBudget?: number;
  };
  
  // Application Management
  applicationDeadline: Date;
  expectedJoiningDate?: Date;
  totalPositions: number;
  filledPositions: number;
  reservedPositions?: { // Diversity hiring
    category: string;
    count: number;
  }[];
  
  // Targeting & Accessibility
  targetColleges: Types.ObjectId[];
  targetCourses: string[];
  diversityPreferences?: string[];
  accessibilitySupport?: string[];
  allowDirectApplications: boolean;
  requiresReferral: boolean;
  
  // Interview & Selection Process
  interviewProcess: IInterviewProcess;
  assessmentRequired: boolean;
  backgroundCheckRequired: boolean;
  
  // Status & Lifecycle
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired' | 'cancelled' | 'filled';
  isUrgent: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  featuredUntil?: Date;
  autoCloseDate?: Date;
  
  // AI & Machine Learning Features
  aiFeatures: IAIJobFeatures;
  matchingKeywords: string[];
  searchableText: string; // Concatenated searchable content
  
  // Analytics & Performance
  views: number;
  uniqueViews: number;
  applications: Types.ObjectId[];
  shortlistedCandidates: Types.ObjectId[];
  interviewsScheduled: number;
  offersExtended: number;
  conversionRate?: number;
  averageTimeToHire?: number; // in days
  
  // Compliance & Legal
  eeocCompliant: boolean;
  dataRetentionPeriod: number; // in months
  gdprCompliant: boolean;
  
  // External Integrations
  externalJobBoards?: {
    platform: string;
    jobId: string;
    postedAt: Date;
    status: 'active' | 'paused' | 'expired';
  }[];
  
  // Collaboration
  collaborators: {
    userId: Types.ObjectId;
    role: 'viewer' | 'editor' | 'approver';
    permissions: string[];
  }[];
  
  // Approval Workflow
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Versioning
  version: number;
  parentJobId?: Types.ObjectId; // For job duplicates/templates
  
  // Timestamps
  postedAt?: Date;
  lastModified: Date;
  lastViewedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateMatchScore(candidateProfile: any): number;
  generateJobVector(): Promise<number[]>;
  updateAnalytics(event: string, data?: any): void;
  checkTenantAccess(tenantId: Types.ObjectId): boolean;
}

const JobRequirementSchema = new Schema<IJobRequirement>({
  skill: { type: String, required: true },
  level: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  mandatory: { type: Boolean, default: true },
  category: {
    type: String,
    enum: ['technical', 'soft', 'language', 'certification'],
    required: true
  },
  weight: { type: Number, min: 0, max: 1, default: 0.5 }
});

const SalaryRangeSchema = new Schema<ISalaryRange>({
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
  negotiable: { type: Boolean, default: true },
  equityComponent: { type: Number, min: 0, max: 100 },
  bonusStructure: Schema.Types.Mixed
});

const JobLocationSchema = new Schema<IJobLocation>({
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  isRemote: { type: Boolean, default: false },
  hybrid: { type: Boolean, default: false },
  timezone: String,
  officeAddress: String,
  coordinates: {
    lat: Number,
    lng: Number
  }
});

const InterviewProcessSchema = new Schema<IInterviewProcess>({
  rounds: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['technical', 'hr', 'managerial', 'cultural', 'case_study'],
      required: true
    },
    duration: { type: String, required: true },
    mode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: true
    },
    weightage: { type: Number, min: 0, max: 1, default: 0.25 }
  }],
  totalDuration: String,
  additionalInfo: String,
  assessmentLinks: [String]
});

const AIJobFeaturesSchema = new Schema<IAIJobFeatures>({
  jobVector: [Number],
  skillsVector: [Number],
  matchingScore: { type: Number, min: 0, max: 1 },
  aiGeneratedSummary: String,
  keywordDensity: Schema.Types.Mixed,
  competitiveAnalysis: {
    similarJobsCount: Number,
    salaryPercentile: Number,
    demandScore: Number
  }
});

const JobSchema = new Schema<IJob>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  description: {
    type: String,
    required: true,
    maxlength: 10000,
    index: 'text'
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance', 'apprenticeship'],
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subCategory: String,
  
  // Company & Recruiter
  recruiterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  hiringManagerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Location & Work Mode
  locations: [JobLocationSchema],
  workMode: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    required: true,
    index: true
  },
  timeZoneRequirement: String,
  travelRequirement: String,
  
  // Requirements & Skills
  requirements: [JobRequirementSchema],
  requiredSkills: {
    type: [String],
    index: true
  },
  preferredSkills: [String],
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive', 'director'],
    required: true,
    index: true
  },
  minExperience: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  maxExperience: {
    type: Number,
    min: 0
  },
  
  // Education Requirements
  educationRequirements: [{
    degree: { type: String, required: true },
    field: String,
    minimumGrade: Number,
    mandatory: { type: Boolean, default: true },
    alternatives: [String]
  }],
  certificationRequirements: [String],
  
  // Compensation & Benefits
  salary: {
    type: SalaryRangeSchema,
    required: true
  },
  benefits: [String],
  workLifeBalance: {
    flexibleHours: { type: Boolean, default: false },
    paidTimeOff: String,
    healthInsurance: { type: Boolean, default: false },
    retirementPlan: { type: Boolean, default: false },
    learningBudget: Number
  },
  
  // Application Management
  applicationDeadline: {
    type: Date,
    required: true,
    index: true
  },
  expectedJoiningDate: Date,
  totalPositions: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  filledPositions: {
    type: Number,
    default: 0,
    min: 0
  },
  reservedPositions: [{
    category: String,
    count: Number
  }],
  
  // Targeting & Accessibility
  targetColleges: [{
    type: Schema.Types.ObjectId,
    ref: 'College',
    index: true
  }],
  targetCourses: [String],
  diversityPreferences: [String],
  accessibilitySupport: [String],
  allowDirectApplications: {
    type: Boolean,
    default: true
  },
  requiresReferral: {
    type: Boolean,
    default: false
  },
  
  // Interview & Selection Process
  interviewProcess: InterviewProcessSchema,
  assessmentRequired: {
    type: Boolean,
    default: false
  },
  backgroundCheckRequired: {
    type: Boolean,
    default: false
  },
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'expired', 'cancelled', 'filled'],
    default: 'draft',
    index: true
  },
  isUrgent: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  featuredUntil: Date,
  autoCloseDate: Date,
  
  // AI & Machine Learning Features
  aiFeatures: {
    type: AIJobFeaturesSchema,
    default: {}
  },
  matchingKeywords: {
    type: [String],
    index: true
  },
  searchableText: {
    type: String,
    index: 'text'
  },
  
  // Analytics & Performance
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViews: {
    type: Number,
    default: 0,
    min: 0
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'Application'
  }],
  shortlistedCandidates: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  interviewsScheduled: {
    type: Number,
    default: 0
  },
  offersExtended: {
    type: Number,
    default: 0
  },
  conversionRate: Number,
  averageTimeToHire: Number,
  
  // Compliance & Legal
  eeocCompliant: {
    type: Boolean,
    default: true
  },
  dataRetentionPeriod: {
    type: Number,
    default: 24 // months
  },
  gdprCompliant: {
    type: Boolean,
    default: true
  },
  
  // External Integrations
  externalJobBoards: [{
    platform: String,
    jobId: String,
    postedAt: Date,
    status: {
      type: String,
      enum: ['active', 'paused', 'expired'],
      default: 'active'
    }
  }],
  
  // Collaboration
  collaborators: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'approver'],
      required: true
    },
    permissions: [String]
  }],
  
  // Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_revision'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  parentJobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  
  // Timestamps
  postedAt: Date,
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastViewedAt: Date,
  archivedAt: Date
}, {
  timestamps: true,
  collection: 'jobs'
});

// Enterprise indexes for performance
JobSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
JobSchema.index({ tenantId: 1, recruiterId: 1, status: 1 });
JobSchema.index({ tenantId: 1, experienceLevel: 1, workMode: 1 });
JobSchema.index({ tenantId: 1, 'salary.min': 1, 'salary.max': 1 });
JobSchema.index({ tenantId: 1, targetColleges: 1, status: 1 });
JobSchema.index({ matchingKeywords: 1, status: 1 });
JobSchema.index({ title: 'text', description: 'text', searchableText: 'text' });

// Geospatial index for location-based queries
JobSchema.index({ 'locations.coordinates': '2dsphere' });

// AI/ML vector indexes (if using MongoDB Atlas Vector Search)
JobSchema.index({ 'aiFeatures.jobVector': 1 });
JobSchema.index({ 'aiFeatures.skillsVector': 1 });

// Enterprise methods
JobSchema.methods.calculateMatchScore = function(candidateProfile: any): number {
  let score = 0;
  let totalWeight = 0;
  
  // Skills matching
  this.requirements.forEach((req: IJobRequirement) => {
    const hasSkill = candidateProfile.skills?.some((skill: string) => 
      skill.toLowerCase().includes(req.skill.toLowerCase())
    );
    if (hasSkill) {
      score += req.weight;
    }
    totalWeight += req.weight;
  });
  
  // Experience matching
  if (candidateProfile.experience >= this.minExperience) {
    score += 0.3;
  }
  totalWeight += 0.3;
  
  // Location matching
  if (this.workMode === 'remote' || 
      this.locations.some((loc: IJobLocation) => 
        candidateProfile.location?.city?.toLowerCase() === loc.city.toLowerCase()
      )) {
    score += 0.2;
  }
  totalWeight += 0.2;
  
  return totalWeight > 0 ? score / totalWeight : 0;
};

JobSchema.methods.generateJobVector = async function(): Promise<number[]> {
  // This would integrate with an AI/ML service to generate embeddings
  // For now, return a placeholder vector
  const text = `${this.title} ${this.description} ${this.requiredSkills.join(' ')}`;
  // TODO: Integrate with OpenAI, Cohere, or similar service
  return new Array(384).fill(0).map(() => Math.random()); // Placeholder 384-dim vector
};

JobSchema.methods.updateAnalytics = function(event: string, data?: any): void {
  switch (event) {
    case 'view':
      this.views += 1;
      this.lastViewedAt = new Date();
      break;
    case 'unique_view':
      this.uniqueViews += 1;
      break;
    case 'application':
      this.applications.push(data.applicationId);
      break;
    case 'interview_scheduled':
      this.interviewsScheduled += 1;
      break;
    case 'offer_extended':
      this.offersExtended += 1;
      break;
  }
  this.lastModified = new Date();
};

JobSchema.methods.checkTenantAccess = function(tenantId: Types.ObjectId): boolean {
  return this.tenantId.equals(tenantId);
};

// Middleware for searchable text generation
JobSchema.pre('save', function(next) {
  this.searchableText = [
    this.title,
    this.description,
    this.companyName,
    this.department,
    this.category,
    this.requiredSkills.join(' '),
    this.preferredSkills.join(' '),
    this.locations.map(loc => `${loc.city} ${loc.state}`).join(' ')
  ].join(' ').toLowerCase();
  
  next();
});

// Auto-close expired jobs
JobSchema.pre('find', function() {
  this.where({
    $or: [
      { autoCloseDate: { $exists: false } },
      { autoCloseDate: { $gte: new Date() } },
      { status: { $in: ['closed', 'expired', 'filled'] } }
    ]
  });
});

export const JobEnterprise = mongoose.model<IJob>('JobEnterprise', JobSchema);
