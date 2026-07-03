import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICompanyInfo {
  name: string;
  industry: string;
  website?: string;
  logo?: string;
  description?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  foundedYear?: number;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
}

export interface IRecruiterProfile {
  firstName: string;
  lastName: string;
  designation: string;
  department?: string;
  linkedinUrl?: string;
  profilePicture?: string;
}

export interface IHiringInfo {
  preferredColleges: Types.ObjectId[];
  preferredCourses: string[];
  hiringSeasons: string[]; // 'summer', 'winter', 'continuous'
  averageHires: number;
  workLocations: string[];
  remoteWork: boolean;
  internshipOpportunities: boolean;
}

export interface IRecruiter extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  
  // Company Information
  companyInfo: ICompanyInfo;
  
  // Recruiter Profile
  recruiterProfile: IRecruiterProfile;
  
  // Hiring Information
  hiringInfo: IHiringInfo;
  
  // Verification
  isVerified: boolean;
  verificationDocuments: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  
  // Admin Approval System
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated';
  approvedBy?: Types.ObjectId; // Admin who approved
  approvedAt?: Date;
  rejectionReason?: string;
  resubmissionNotes?: string;
  submittedDocuments?: string[]; // Additional documents uploaded for approval
  
  // Notifications
  notifications?: Array<{
    subject: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    type: 'admin_message' | 'admin_broadcast' | 'system';
  }>;
  
  // Jobs & Applications
  jobsPosted: Types.ObjectId[];
  
  // College Relationships
  approvedColleges: Types.ObjectId[];
  pendingColleges: Types.ObjectId[];
  
  // Communication
  whatsappNumber?: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  
  // Status
  isActive: boolean;
  lastActiveDate: Date;
  
  // Settings
  autoApproveApplications: boolean;
  allowWhatsappContact: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const CompanyInfoSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true },
  industry: { type: String, required: true, index: true },
  website: { type: String, trim: true },
  logo: { type: String },
  description: { type: String },
  size: { 
    type: String, 
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'], 
    required: true,
    index: true 
  },
  foundedYear: { type: Number },
  headquarters: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  }
});

const RecruiterProfileSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  linkedinUrl: { type: String, trim: true },
  profilePicture: { type: String }
});

const HiringInfoSchema = new Schema({
  preferredColleges: [{ type: Schema.Types.ObjectId, ref: 'College' }],
  preferredCourses: [{ type: String }],
  hiringSeasons: [{ type: String, enum: ['summer', 'winter', 'continuous'] }],
  averageHires: { type: Number, default: 0 },
  workLocations: [{ type: String }],
  remoteWork: { type: Boolean, default: false },
  internshipOpportunities: { type: Boolean, default: false }
});

const RecruiterSchema = new Schema<IRecruiter>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Company Information
  companyInfo: { type: CompanyInfoSchema, required: true },
  
  // Recruiter Profile
  recruiterProfile: { type: RecruiterProfileSchema, required: true },
  
  // Hiring Information
  hiringInfo: { type: HiringInfoSchema, required: true },
  
  // Verification
  isVerified: { type: Boolean, default: false, index: true },
  verificationDocuments: [{ type: String }],
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending',
    index: true 
  },
  
  // Admin Approval System
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'reverify', 'deactivated'], 
    default: 'pending',
    index: true 
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  resubmissionNotes: { type: String },
  submittedDocuments: [{ type: String }],
  
  // Notifications
  notifications: [{
    subject: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    type: { 
      type: String, 
      enum: ['admin_message', 'admin_broadcast', 'system'], 
      default: 'admin_message' 
    }
  }],
  
  // Jobs & Applications
  jobsPosted: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  
  // College Relationships
  approvedColleges: [{ type: Schema.Types.ObjectId, ref: 'College' }],
  pendingColleges: [{ type: Schema.Types.ObjectId, ref: 'College' }],
  
  // Communication
  whatsappNumber: { type: String, trim: true },
  preferredContactMethod: { 
    type: String, 
    enum: ['email', 'phone', 'whatsapp'], 
    default: 'email' 
  },
  
  // Status
  isActive: { type: Boolean, default: true, index: true },
  lastActiveDate: { type: Date, default: Date.now },
  
  // Settings
  autoApproveApplications: { type: Boolean, default: false },
  allowWhatsappContact: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for optimization
RecruiterSchema.index({ 'companyInfo.name': 1, isActive: 1 });
RecruiterSchema.index({ 'companyInfo.industry': 1, isVerified: 1 });
RecruiterSchema.index({ 'companyInfo.headquarters.city': 1, 'companyInfo.headquarters.state': 1 });
RecruiterSchema.index({ verificationStatus: 1, isActive: 1 });
RecruiterSchema.index({ 'hiringInfo.preferredColleges': 1 });

// Text index for search
RecruiterSchema.index({ 
  'companyInfo.name': 'text', 
  'companyInfo.description': 'text',
  'companyInfo.industry': 'text'
});

export const Recruiter = mongoose.model<IRecruiter>('Recruiter', RecruiterSchema);