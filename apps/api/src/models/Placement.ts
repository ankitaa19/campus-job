import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPlacement extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  collegeId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  jobId?: Types.ObjectId;
  
  // Student Details
  studentName: string;
  studentEmail: string;
  enrollmentNumber?: string;
  department: string;
  graduationYear: number;
  cgpa?: number;
  
  // Company Details
  companyName: string;
  jobTitle: string;
  jobType: 'full-time' | 'internship' | 'part-time' | 'contract';
  
  // Package Details
  packageOffered: number; // Annual package in LPA
  packageType: 'fixed' | 'variable' | 'equity' | 'mixed';
  
  // Location
  jobLocation: string;
  workType: 'on-site' | 'remote' | 'hybrid';
  
  // Status
  placementStatus: 'offered' | 'accepted' | 'rejected' | 'joined' | 'pending';
  offerDate?: Date;
  joiningDate?: Date;
  
  // Additional Details
  placementType: 'campus' | 'off-campus' | 'referral';
  skills: string[];
  notes?: string;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: Types.ObjectId; // Admin/College who verified
  verifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSchema = new Schema<IPlacement>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  
  // Student Details
  studentName: { type: String, required: true, trim: true },
  studentEmail: { type: String, required: true, lowercase: true, trim: true },
  enrollmentNumber: { type: String, trim: true },
  department: { type: String, required: true, trim: true },
  graduationYear: { type: Number, required: true, index: true },
  cgpa: { type: Number, min: 0, max: 10 },
  
  // Company Details
  companyName: { type: String, required: true, trim: true, index: true },
  jobTitle: { type: String, required: true, trim: true },
  jobType: { 
    type: String, 
    enum: ['full-time', 'internship', 'part-time', 'contract'], 
    required: true,
    index: true
  },
  
  // Package Details
  packageOffered: { type: Number, required: true, min: 0 },
  packageType: { 
    type: String, 
    enum: ['fixed', 'variable', 'equity', 'mixed'], 
    default: 'fixed' 
  },
  
  // Location
  jobLocation: { type: String, required: true, trim: true },
  workType: { 
    type: String, 
    enum: ['on-site', 'remote', 'hybrid'], 
    default: 'on-site' 
  },
  
  // Status
  placementStatus: { 
    type: String, 
    enum: ['offered', 'accepted', 'rejected', 'joined', 'pending'], 
    default: 'offered',
    index: true
  },
  offerDate: { type: Date },
  joiningDate: { type: Date },
  
  // Additional Details
  placementType: { 
    type: String, 
    enum: ['campus', 'off-campus', 'referral'], 
    default: 'campus' 
  },
  skills: [{ type: String, trim: true }],
  notes: { type: String, trim: true },
  
  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for optimization
PlacementSchema.index({ collegeId: 1, graduationYear: 1 });
PlacementSchema.index({ companyName: 1, graduationYear: 1 });
PlacementSchema.index({ packageOffered: -1 });
PlacementSchema.index({ placementStatus: 1, isVerified: 1 });

export const Placement = mongoose.model<IPlacement>('Placement', PlacementSchema);