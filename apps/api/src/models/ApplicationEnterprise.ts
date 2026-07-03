import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IApplicationDocument {
  type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'transcript' | 'reference_letter';
  name: string;
  url: string;
  uploadedAt: Date;
  fileSize: number;
  mimeType: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
}

export interface IApplicationTimeline {
  stage: 'applied' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interview_completed' | 
         'technical_assessment' | 'background_check' | 'reference_check' | 'offer_extended' | 
         'offer_accepted' | 'offer_declined' | 'rejected' | 'withdrawn';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  timestamp: Date;
  updatedBy: Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
  durationInStage?: number; // milliseconds
  automatedAction?: boolean;
}

export interface IInterviewSchedule {
  round: number;
  type: 'technical' | 'hr' | 'managerial' | 'cultural' | 'case_study';
  scheduledAt: Date;
  duration: number; // minutes
  mode: 'online' | 'offline' | 'hybrid';
  interviewerIds: Types.ObjectId[];
  meetingLink?: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  feedback?: {
    overallRating: number; // 1-10
    technicalSkills: number;
    communicationSkills: number;
    culturalFit: number;
    comments: string;
    recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
    interviewerId: Types.ObjectId;
    submittedAt: Date;
  }[];
  recordingUrl?: string;
  notesUrl?: string;
}

export interface IAssessmentResult {
  assessmentId: string;
  type: 'coding' | 'aptitude' | 'personality' | 'domain_specific' | 'case_study';
  platform: string; // HackerRank, Codility, etc.
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // minutes
  maxTime: number; // minutes
  score: number;
  maxScore: number;
  percentile?: number;
  skillBreakdown?: {
    skill: string;
    score: number;
    maxScore: number;
  }[];
  reportUrl?: string;
  cheatingDetected: boolean;
  proctored: boolean;
}

export interface IAIAnalysis {
  resumeAnalysisId?: Types.ObjectId;
  matchingScore: number; // 0-1, AI calculated job match
  skillsExtracted: string[];
  experienceLevel: string;
  educationLevel: string;
  keywordMatches: string[];
  redFlags: string[]; // Potential issues detected
  strengths: string[];
  improvementAreas: string[];
  personayPrediction?: {
    traits: Record<string, number>;
    workStyle: string;
    teamFit: number;
  };
  salaryPrediction?: {
    min: number;
    max: number;
    confidence: number;
  };
  hiringProbability: number; // 0-1, likelihood of being hired
  timeToHirePrediction?: number; // days
  lastAnalyzedAt: Date;
}

export interface IApplication extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId; // Multi-tenant isolation
  
  // Core References
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId; // Student/User ID
  recruiterId: Types.ObjectId; // Job recruiter
  
  // Application Details
  appliedAt: Date;
  applicationSource: 'direct' | 'college_portal' | 'referral' | 'job_board' | 'career_fair' | 'headhunter';
  referralId?: Types.ObjectId; // If referred by someone
  coverLetter?: string;
  customResponses?: { // Answers to job-specific questions
    question: string;
    answer: string;
  }[];
  
  // Current Status
  currentStage: string;
  status: 'active' | 'withdrawn' | 'rejected' | 'hired' | 'on_hold' | 'expired';
  timeline: IApplicationTimeline[];
  
  // Documents
  documents: IApplicationDocument[];
  
  // Interview Management
  interviews: IInterviewSchedule[];
  overallInterviewRating?: number;
  interviewFeedbackSummary?: string;
  
  // Assessments
  assessments: IAssessmentResult[];
  overallAssessmentScore?: number;
  
  // AI Analysis & Scoring
  aiAnalysis: IAIAnalysis;
  humanReviewRequired: boolean;
  humanReviewReason?: string;
  
  // Communication Log
  communications: {
    type: 'email' | 'sms' | 'whatsapp' | 'call' | 'video_call' | 'in_person';
    direction: 'inbound' | 'outbound';
    subject?: string;
    content: string;
    timestamp: Date;
    sentBy: Types.ObjectId;
    deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
    metadata?: Record<string, any>;
  }[];
  
  // Offer Management
  offer?: {
    extendedAt: Date;
    extendedBy: Types.ObjectId;
    salary: {
      base: number;
      bonus?: number;
      equity?: number;
      currency: string;
    };
    benefits: string[];
    startDate: Date;
    expiryDate: Date;
    status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'expired';
    negotiations?: {
      round: number;
      candidateRequest: string;
      companyResponse?: string;
      status: 'pending' | 'accepted' | 'rejected';
      timestamp: Date;
    }[];
    acceptedAt?: Date;
    declinedAt?: Date;
    declineReason?: string;
    contractUrl?: string;
    signedContractUrl?: string;
  };
  
  // Background Check
  backgroundCheck?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    provider: string;
    initiatedAt: Date;
    completedAt?: Date;
    results: {
      identity: 'verified' | 'failed' | 'pending';
      education: 'verified' | 'failed' | 'pending';
      employment: 'verified' | 'failed' | 'pending';
      criminal: 'clear' | 'issues_found' | 'pending';
      credit: 'clear' | 'issues_found' | 'pending' | 'not_required';
    };
    reportUrl?: string;
    issues?: string[];
  };
  
  // Compliance & Legal
  gdprConsent: boolean;
  dataRetentionUntil: Date;
  eeocData?: {
    ethnicity?: string;
    gender?: string;
    veteranStatus?: string;
    disabilityStatus?: string;
    providedVoluntarily: boolean;
  };
  
  // Analytics & Metrics
  viewedByRecruiter: boolean;
  viewedAt?: Date;
  timeSpentInStages: Record<string, number>; // stage -> milliseconds
  totalProcessingTime?: number; // milliseconds from application to final decision
  touchpoints: number; // Number of interactions
  
  // Rejection Details
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  rejectionStage?: string;
  internalNotes?: string; // Private recruiter notes
  
  // Candidate Experience
  candidateFeedback?: {
    processRating: number; // 1-5
    communicationRating: number;
    timelinessRating: number;
    overallExperience: number;
    comments?: string;
    wouldRecommendCompany: boolean;
    submittedAt: Date;
  };
  
  // Collaboration
  assignedRecruiters: Types.ObjectId[];
  watchers: Types.ObjectId[]; // Users watching this application
  
  // External Integration
  externalApplicationId?: string; // If synced from external ATS
  externalData?: Record<string, any>;
  
  // Timestamps
  lastActivityAt: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateStage(newStage: string, updatedBy: Types.ObjectId, notes?: string): void;
  calculateProcessingTime(): number;
  generateCandidateReport(): any;
  checkTenantAccess(tenantId: Types.ObjectId): boolean;
  scheduleInterview(interviewData: Partial<IInterviewSchedule>): void;
  addCommunication(commData: any): void;
}

const ApplicationDocumentSchema = new Schema<IApplicationDocument>({
  type: {
    type: String,
    enum: ['resume', 'cover_letter', 'portfolio', 'certificate', 'transcript', 'reference_letter'],
    required: true
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

const ApplicationTimelineSchema = new Schema<IApplicationTimeline>({
  stage: {
    type: String,
    enum: ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interview_completed', 
           'technical_assessment', 'background_check', 'reference_check', 'offer_extended', 
           'offer_accepted', 'offer_declined', 'rejected', 'withdrawn'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
  metadata: Schema.Types.Mixed,
  durationInStage: Number,
  automatedAction: { type: Boolean, default: false }
});

const InterviewScheduleSchema = new Schema<IInterviewSchedule>({
  round: { type: Number, required: true },
  type: {
    type: String,
    enum: ['technical', 'hr', 'managerial', 'cultural', 'case_study'],
    required: true
  },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, required: true },
  mode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    required: true
  },
  interviewerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  meetingLink: String,
  location: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled'
  },
  feedback: [{
    overallRating: { type: Number, min: 1, max: 10 },
    technicalSkills: { type: Number, min: 1, max: 10 },
    communicationSkills: { type: Number, min: 1, max: 10 },
    culturalFit: { type: Number, min: 1, max: 10 },
    comments: String,
    recommendation: {
      type: String,
      enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire']
    },
    interviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now }
  }],
  recordingUrl: String,
  notesUrl: String
});

const AssessmentResultSchema = new Schema<IAssessmentResult>({
  assessmentId: { type: String, required: true },
  type: {
    type: String,
    enum: ['coding', 'aptitude', 'personality', 'domain_specific', 'case_study'],
    required: true
  },
  platform: { type: String, required: true },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  timeSpent: { type: Number, required: true },
  maxTime: { type: Number, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentile: Number,
  skillBreakdown: [{
    skill: String,
    score: Number,
    maxScore: Number
  }],
  reportUrl: String,
  cheatingDetected: { type: Boolean, default: false },
  proctored: { type: Boolean, default: false }
});

const AIAnalysisSchema = new Schema<IAIAnalysis>({
  resumeAnalysisId: { type: Schema.Types.ObjectId, ref: 'ResumeAnalysis' },
  matchingScore: { type: Number, min: 0, max: 1, required: true },
  skillsExtracted: [String],
  experienceLevel: String,
  educationLevel: String,
  keywordMatches: [String],
  redFlags: [String],
  strengths: [String],
  improvementAreas: [String],
  personayPrediction: {
    traits: Schema.Types.Mixed,
    workStyle: String,
    teamFit: Number
  },
  salaryPrediction: {
    min: Number,
    max: Number,
    confidence: Number
  },
  hiringProbability: { type: Number, min: 0, max: 1 },
  timeToHirePrediction: Number,
  lastAnalyzedAt: { type: Date, default: Date.now }
});

const ApplicationSchema = new Schema<IApplication>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Core References
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recruiterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Application Details
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  applicationSource: {
    type: String,
    enum: ['direct', 'college_portal', 'referral', 'job_board', 'career_fair', 'headhunter'],
    default: 'direct',
    index: true
  },
  referralId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  coverLetter: String,
  customResponses: [{
    question: String,
    answer: String
  }],
  
  // Current Status
  currentStage: {
    type: String,
    default: 'applied',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'withdrawn', 'rejected', 'hired', 'on_hold', 'expired'],
    default: 'active',
    index: true
  },
  timeline: [ApplicationTimelineSchema],
  
  // Documents
  documents: [ApplicationDocumentSchema],
  
  // Interview Management
  interviews: [InterviewScheduleSchema],
  overallInterviewRating: Number,
  interviewFeedbackSummary: String,
  
  // Assessments
  assessments: [AssessmentResultSchema],
  overallAssessmentScore: Number,
  
  // AI Analysis & Scoring
  aiAnalysis: {
    type: AIAnalysisSchema,
    required: true
  },
  humanReviewRequired: {
    type: Boolean,
    default: false,
    index: true
  },
  humanReviewReason: String,
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'call', 'video_call', 'in_person'],
      required: true
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },
    subject: String,
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    },
    metadata: Schema.Types.Mixed
  }],
  
  // Offer Management
  offer: {
    extendedAt: Date,
    extendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    salary: {
      base: Number,
      bonus: Number,
      equity: Number,
      currency: { type: String, default: 'INR' }
    },
    benefits: [String],
    startDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'negotiating', 'expired'],
      default: 'pending'
    },
    negotiations: [{
      round: Number,
      candidateRequest: String,
      companyResponse: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected']
      },
      timestamp: { type: Date, default: Date.now }
    }],
    acceptedAt: Date,
    declinedAt: Date,
    declineReason: String,
    contractUrl: String,
    signedContractUrl: String
  },
  
  // Background Check
  backgroundCheck: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed']
    },
    provider: String,
    initiatedAt: Date,
    completedAt: Date,
    results: {
      identity: {
        type: String,
        enum: ['verified', 'failed', 'pending']
      },
      education: {
        type: String,
        enum: ['verified', 'failed', 'pending']
      },
      employment: {
        type: String,
        enum: ['verified', 'failed', 'pending']
      },
      criminal: {
        type: String,
        enum: ['clear', 'issues_found', 'pending']
      },
      credit: {
        type: String,
        enum: ['clear', 'issues_found', 'pending', 'not_required']
      }
    },
    reportUrl: String,
    issues: [String]
  },
  
  // Compliance & Legal
  gdprConsent: {
    type: Boolean,
    default: false
  },
  dataRetentionUntil: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
  },
  eeocData: {
    ethnicity: String,
    gender: String,
    veteranStatus: String,
    disabilityStatus: String,
    providedVoluntarily: { type: Boolean, default: false }
  },
  
  // Analytics & Metrics
  viewedByRecruiter: {
    type: Boolean,
    default: false,
    index: true
  },
  viewedAt: Date,
  timeSpentInStages: {
    type: Schema.Types.Mixed,
    default: {}
  },
  totalProcessingTime: Number,
  touchpoints: {
    type: Number,
    default: 0
  },
  
  // Rejection Details
  rejectedAt: Date,
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  rejectionStage: String,
  internalNotes: String,
  
  // Candidate Experience
  candidateFeedback: {
    processRating: { type: Number, min: 1, max: 5 },
    communicationRating: { type: Number, min: 1, max: 5 },
    timelinessRating: { type: Number, min: 1, max: 5 },
    overallExperience: { type: Number, min: 1, max: 5 },
    comments: String,
    wouldRecommendCompany: Boolean,
    submittedAt: { type: Date, default: Date.now }
  },
  
  // Collaboration
  assignedRecruiters: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  // External Integration
  externalApplicationId: String,
  externalData: Schema.Types.Mixed,
  
  // Timestamps
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  archivedAt: Date
}, {
  timestamps: true,
  collection: 'applications'
});

// Enterprise indexes for performance
ApplicationSchema.index({ tenantId: 1, jobId: 1, status: 1 });
ApplicationSchema.index({ tenantId: 1, candidateId: 1, appliedAt: -1 });
ApplicationSchema.index({ tenantId: 1, recruiterId: 1, status: 1, appliedAt: -1 });
ApplicationSchema.index({ tenantId: 1, currentStage: 1, lastActivityAt: -1 });
ApplicationSchema.index({ tenantId: 1, 'aiAnalysis.matchingScore': -1 });
ApplicationSchema.index({ tenantId: 1, humanReviewRequired: 1, status: 1 });

// Compound index for common queries
ApplicationSchema.index({ 
  tenantId: 1, 
  jobId: 1, 
  status: 1, 
  'aiAnalysis.matchingScore': -1 
});

// Enterprise methods
ApplicationSchema.methods.updateStage = function(
  newStage: string, 
  updatedBy: Types.ObjectId, 
  notes?: string
): void {
  const previousStage = this.currentStage;
  const now = new Date();
  
  // Calculate time spent in previous stage
  if (previousStage && this.timeline.length > 0) {
    const lastUpdate = this.timeline[this.timeline.length - 1].timestamp;
    const timeInStage = now.getTime() - lastUpdate.getTime();
    this.timeSpentInStages[previousStage] = 
      (this.timeSpentInStages[previousStage] || 0) + timeInStage;
  }
  
  // Add to timeline
  this.timeline.push({
    stage: newStage,
    status: 'completed',
    timestamp: now,
    updatedBy,
    notes,
    durationInStage: this.timeSpentInStages[previousStage] || 0,
    automatedAction: false
  } as IApplicationTimeline);
  
  this.currentStage = newStage;
  this.lastActivityAt = now;
  this.touchpoints += 1;
};

ApplicationSchema.methods.calculateProcessingTime = function(): number {
  if (this.timeline.length === 0) return 0;
  
  const firstEntry = this.timeline[0];
  const lastEntry = this.timeline[this.timeline.length - 1];
  
  return lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime();
};

ApplicationSchema.methods.generateCandidateReport = function(): any {
  return {
    applicationId: this._id,
    jobTitle: this.jobId, // Would need to populate
    appliedAt: this.appliedAt,
    currentStage: this.currentStage,
    status: this.status,
    matchingScore: this.aiAnalysis.matchingScore,
    interviewRating: this.overallInterviewRating,
    assessmentScore: this.overallAssessmentScore,
    timeInProcess: this.calculateProcessingTime(),
    touchpoints: this.touchpoints,
    communicationHistory: this.communications.length
  };
};

ApplicationSchema.methods.checkTenantAccess = function(tenantId: Types.ObjectId): boolean {
  return this.tenantId.equals(tenantId);
};

ApplicationSchema.methods.scheduleInterview = function(interviewData: Partial<IInterviewSchedule>): void {
  this.interviews.push({
    round: this.interviews.length + 1,
    type: interviewData.type || 'technical',
    scheduledAt: interviewData.scheduledAt || new Date(),
    duration: interviewData.duration || 60,
    mode: interviewData.mode || 'online',
    interviewerIds: interviewData.interviewerIds || [],
    status: 'scheduled'
  } as IInterviewSchedule);
  
  this.updateStage('interview_scheduled', interviewData.interviewerIds?.[0] || this.recruiterId);
};

ApplicationSchema.methods.addCommunication = function(commData: any): void {
  this.communications.push({
    type: commData.type,
    direction: commData.direction,
    subject: commData.subject,
    content: commData.content,
    timestamp: new Date(),
    sentBy: commData.sentBy,
    deliveryStatus: 'sent',
    metadata: commData.metadata
  });
  
  this.touchpoints += 1;
  this.lastActivityAt = new Date();
};

// Middleware for analytics
ApplicationSchema.pre('save', function(next) {
  if (this.isModified('currentStage') || this.isModified('status')) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Auto-expire old applications
ApplicationSchema.pre('find', function() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  this.where({
    $or: [
      { status: { $ne: 'expired' } },
      { appliedAt: { $gte: sixMonthsAgo } }
    ]
  });
});

export const ApplicationEnterprise = mongoose.model<IApplication>('ApplicationEnterprise', ApplicationSchema);
