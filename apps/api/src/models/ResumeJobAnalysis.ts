import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResumeJobAnalysis extends Document {
  _id: Types.ObjectId;
  
  // Core References
  studentId: Types.ObjectId;
  jobId: Types.ObjectId;
  
  // AI Analysis Results
  matchScore: number; // 0-100
  explanation: string;
  suggestions: string[];
  skillsMatched: string[];
  skillsGap: string[];
  matchingModel?: 'hybrid-ai-v1' | 'hybrid-local-v1' | 'hybrid-ai-v2' | 'hybrid-local-v2';
  displayMatchScore?: number;
  behaviorAdjustment?: number;
  ruleBasedScore?: number;
  aiScore?: number;
  scoreBreakdown?: Record<string, {
    score: number;
    weight: number;
    matched: string[];
    missing: string[];
    evidence: string;
  }>;
  atsEvaluation?: {
    hardSkillsScore: number;
    seniorityScore: number;
    domainScore: number;
    finalMatchScore: number;
    experienceYearsFound: number | null;
    experienceMatchStatus: 'EXCEEDS' | 'MATCHES' | 'UNDERQUALIFIED';
    matchedCoreSkills: string[];
    missingCriticalSkills: string[];
    conciseJustification: string;
  };
  
  // Resume Version
  resumeText: string; // The resume text that was analyzed
  resumeVersion: number; // Track resume versions
  
  // Job Context
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  
  // Application Context
  applicationId?: Types.ObjectId; // If student applied
  dateApplied?: Date;
  
  // Improvement Tracking
  improvementsGenerated: boolean;
  improvementsSuggestions?: {
    section: string;
    currentText: string;
    suggestedText: string;
    reason: string;
  }[];
  
  // Status
  isActive: boolean;
  
  // Timestamps
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeJobAnalysisSchema = new Schema({
  // Core References
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true
  },
  jobId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true,
    index: true
  },
  
  // AI Analysis Results
  matchScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  explanation: { 
    type: String, 
    required: true 
  },
  suggestions: [{ 
    type: String 
  }],
  skillsMatched: [{ 
    type: String 
  }],
  skillsGap: [{ 
    type: String 
  }],
  matchingModel: { type: String, enum: ['hybrid-ai-v1', 'hybrid-local-v1', 'hybrid-ai-v2', 'hybrid-local-v2'] },
  displayMatchScore: { type: Number, min: 70, max: 100 },
  behaviorAdjustment: { type: Number, min: -8, max: 8, default: 0 },
  ruleBasedScore: { type: Number, min: 0, max: 100 },
  aiScore: { type: Number, min: 0, max: 100 },
  scoreBreakdown: { type: Schema.Types.Mixed },
  atsEvaluation: { type: Schema.Types.Mixed },
  
  // Resume Version
  resumeText: { 
    type: String, 
    required: true 
  },
  resumeVersion: { 
    type: Number, 
    default: 1 
  },
  
  // Job Context
  jobTitle: { 
    type: String, 
    required: true 
  },
  jobDescription: { 
    type: String, 
    required: true 
  },
  companyName: { 
    type: String, 
    required: true 
  },
  
  // Application Context
  applicationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Application' 
  },
  dateApplied: { 
    type: Date 
  },
  
  // Improvement Tracking
  improvementsGenerated: { 
    type: Boolean, 
    default: false 
  },
  improvementsSuggestions: [{
    section: { type: String },
    currentText: { type: String },
    suggestedText: { type: String },
    reason: { type: String }
  }],
  
  // Status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Timestamps
  analyzedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for optimization
ResumeJobAnalysisSchema.index({ studentId: 1, jobId: 1 }, { unique: true }); // One analysis per student-job pair
ResumeJobAnalysisSchema.index({ studentId: 1, matchScore: -1 }); // Get best matches for student
ResumeJobAnalysisSchema.index({ jobId: 1, matchScore: -1 }); // Get best candidates for job
ResumeJobAnalysisSchema.index({ analyzedAt: -1 });
ResumeJobAnalysisSchema.index({ dateApplied: -1 });

// Compound indexes for complex queries
ResumeJobAnalysisSchema.index({ 
  studentId: 1, 
  isActive: 1, 
  matchScore: -1 
});

ResumeJobAnalysisSchema.index({ 
  jobId: 1, 
  dateApplied: 1,
  matchScore: -1 
});

export const ResumeJobAnalysis = mongoose.model<IResumeJobAnalysis>('ResumeJobAnalysis', ResumeJobAnalysisSchema);
