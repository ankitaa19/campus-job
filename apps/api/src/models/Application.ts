import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IApplicationStatus {
  status: 'applied' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interview_completed' | 'selected' | 'rejected' | 'withdrawn';
  updatedAt: Date;
  updatedBy: Types.ObjectId;
  notes?: string;
}

export interface IInterviewSchedule {
  round: string;
  scheduledAt: Date;
  duration: number; // in minutes
  mode: 'online' | 'offline' | 'phone';
  location?: string;
  meetingLink?: string;
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  rating?: number; // 1-10
}

export interface IApplication extends Document {
  _id: Types.ObjectId;
  
  // Core References
  studentId: Types.ObjectId;
  jobId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  collegeId?: Types.ObjectId;
  
  // Application Details
  coverLetter?: string;
  resumeFile?: string; // Specific resume for this job
  portfolioLinks?: string[];
  
  // Status Tracking
  currentStatus: 'applied' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interview_completed' | 'selected' | 'rejected' | 'withdrawn';
  statusHistory: IApplicationStatus[];
  
  // Interview Process
  interviews: IInterviewSchedule[];
  
  // College Approval (if required)
  collegeApprovalRequired: boolean;
  collegeApprovalStatus?: 'pending' | 'approved' | 'rejected';
  collegeApprovalDate?: Date;
  collegeApprovalNotes?: string;
  
  // Matching & Scoring
  matchScore?: number; // AI-generated match score (0-100)
  skillsMatchPercentage?: number;
  
  // Communication
  whatsappNotificationSent: boolean;
  whatsappNotificationSentAt?: Date;
  emailNotificationSent: boolean;
  lastContactedAt?: Date;
  
  // Recruiter Actions
  recruiterViewed: boolean;
  recruiterViewedAt?: Date;
  shortlistReason?: string;
  rejectionReason?: string;
  
  // Offer Details (if selected)
  offerDetails?: {
    salary: number;
    currency: string;
    joiningDate: Date;
    location: string;
    additionalBenefits: string[];
  };
  
  // Feedback
  studentFeedback?: {
    rating: number;
    comments: string;
    wouldRecommend: boolean;
  };
  
  // Analytics
  source: 'platform' | 'whatsapp' | 'direct' | 'referral';
  
  // Timestamps
  appliedAt: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationStatusSchema = new Schema({
  status: { 
    type: String, 
    enum: ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interview_completed', 'selected', 'rejected', 'withdrawn'], 
    required: true 
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String }
});

const InterviewScheduleSchema = new Schema({
  round: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, required: true },
  mode: { type: String, enum: ['online', 'offline', 'phone'], required: true },
  location: { type: String },
  meetingLink: { type: String },
  interviewers: [{ type: String }],
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  feedback: { type: String },
  rating: { type: Number, min: 1, max: 10 }
});

const ApplicationSchema = new Schema<IApplication>({
  // Core References
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', index: true },
  
  // Application Details
  coverLetter: { type: String },
  resumeFile: { type: String },
  portfolioLinks: [{ type: String }],
  
  // Status Tracking
  currentStatus: { 
    type: String, 
    enum: ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interview_completed', 'selected', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true
  },
  statusHistory: [ApplicationStatusSchema],
  
  // Interview Process
  interviews: [InterviewScheduleSchema],
  
  // College Approval (if required)
  collegeApprovalRequired: { type: Boolean, default: false },
  collegeApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
  collegeApprovalDate: { type: Date },
  collegeApprovalNotes: { type: String },
  
  // Matching & Scoring
  matchScore: { type: Number, min: 0, max: 100 },
  skillsMatchPercentage: { type: Number, min: 0, max: 100 },
  
  // Communication
  whatsappNotificationSent: { type: Boolean, default: false },
  whatsappNotificationSentAt: { type: Date },
  emailNotificationSent: { type: Boolean, default: false },
  lastContactedAt: { type: Date },
  
  // Recruiter Actions
  recruiterViewed: { type: Boolean, default: false, index: true },
  recruiterViewedAt: { type: Date },
  shortlistReason: { type: String },
  rejectionReason: { type: String },
  
  // Offer Details (if selected)
  offerDetails: {
    salary: { type: Number },
    currency: { type: String, default: 'INR' },
    joiningDate: { type: Date },
    location: { type: String },
    additionalBenefits: [{ type: String }]
  },
  
  // Feedback
  studentFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    wouldRecommend: { type: Boolean }
  },
  
  // Analytics
  source: { type: String, enum: ['platform', 'whatsapp', 'direct', 'referral'], default: 'platform' },
  
  // Timestamps
  appliedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for optimization
ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true }); // Prevent duplicate applications
ApplicationSchema.index({ jobId: 1, currentStatus: 1 });
ApplicationSchema.index({ recruiterId: 1, currentStatus: 1 });
ApplicationSchema.index({ collegeId: 1, currentStatus: 1 });
ApplicationSchema.index({ appliedAt: -1 });
ApplicationSchema.index({ 'interviews.scheduledAt': 1 });

// Compound indexes for complex queries
ApplicationSchema.index({ 
  studentId: 1, 
  currentStatus: 1, 
  appliedAt: -1 
});

ApplicationSchema.index({ 
  recruiterId: 1, 
  recruiterViewed: 1, 
  currentStatus: 1 
});

// Middleware to update lastUpdated
ApplicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
