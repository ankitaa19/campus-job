// MongoDB Schema Models for Hiring Platform
// All models are designed with proper indexing and optimization

export { User, IUser } from './User';
export { Student, IStudent, IEducation, IExperience, ISkill, IJobPreferences } from './Student';
export { College, ICollege, IAddress, IContact, IPlacementStats } from './College';
export { Recruiter, IRecruiter, ICompanyInfo, IRecruiterProfile, IHiringInfo } from './Recruiter';
export { Admin, IAdmin } from './Admin';
export { Job, IJob, IJobRequirement, ISalaryRange, IJobLocation, IInterviewProcess } from './Job';
export { Application, IApplication, IApplicationStatus, IInterviewSchedule } from './Application';
export { JobMatch, IJobMatch } from './JobMatch';
export { BulkAutoApplyRun, IBulkAutoApplyRun } from './BulkAutoApplyRun';
export { BulkAutoApplyTask, IBulkAutoApplyTask } from './BulkAutoApplyTask';
export { ProductEvent, IProductEvent } from './ProductEvent';
export { ConsentRecord, IConsentRecord } from './ConsentRecord';
export { SourceJobSnapshot, ISourceJobSnapshot } from './SourceJobSnapshot';
export { ResumeJobAnalysis, IResumeJobAnalysis } from './ResumeJobAnalysis';
export { GeneratedResume, IGeneratedResume } from './GeneratedResume';
export { Course, ICourse } from './Course';
export { Message, IMessage } from './Message';
export { Notification, INotification } from './Notification';
export { OTPVerification, IOTPVerification } from './OTPVerification';
export { Invitation, IInvitation } from './Invitation';
export { InterviewSlot, IInterviewSlot } from './InterviewSlot';
export { Placement, IPlacement } from './Placement';
export { Event, IEvent } from './Event';
export { default as Connection } from './Connection';

// Model names for reference
export const MODEL_NAMES = {
  USER: 'User',
  STUDENT: 'Student',
  COLLEGE: 'College',
  RECRUITER: 'Recruiter',
  ADMIN: 'Admin',
  JOB: 'Job',
  APPLICATION: 'Application',
  JOB_MATCH: 'JobMatch',
  BULK_AUTO_APPLY_RUN: 'BulkAutoApplyRun',
  BULK_AUTO_APPLY_TASK: 'BulkAutoApplyTask',
  PRODUCT_EVENT: 'ProductEvent',
  CONSENT_RECORD: 'ConsentRecord',
  SOURCE_JOB_SNAPSHOT: 'SourceJobSnapshot',
  COURSE: 'Course',
  MESSAGE: 'Message',
  NOTIFICATION: 'Notification',
  OTP_VERIFICATION: 'OTPVerification',
  RESUME_JOB_ANALYSIS: 'ResumeJobAnalysis',
  GENERATED_RESUME: 'GeneratedResume',
  INVITATION: 'Invitation',
  INTERVIEW_SLOT: 'InterviewSlot',
  PLACEMENT: 'Placement',
  EVENT: 'Event'
} as const;

// Database connection utility
export const connectDatabase = async (mongoUri: string) => {
  try {
    const mongoose = await import('mongoose');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
