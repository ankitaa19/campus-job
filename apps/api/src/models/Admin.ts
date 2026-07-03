import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  adminProfile: {
    firstName: string;
    lastName: string;
    designation: string;
    department?: string;
    profilePicture?: string;
  };
  permissions: {
    canApproveColleges: boolean;
    canApproveRecruiters: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canManageJobs: boolean;
  };
  activityLog: {
    action: string;
    targetType: 'college' | 'recruiter' | 'user' | 'job';
    targetId: Types.ObjectId;
    timestamp: Date;
    details?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  adminProfile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    profilePicture: { type: String }
  },
  
  permissions: {
    canApproveColleges: { type: Boolean, default: true },
    canApproveRecruiters: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: true },
    canManageJobs: { type: Boolean, default: false }
  },
  
  activityLog: [{
    action: { type: String, required: true },
    targetType: { type: String, enum: ['college', 'recruiter', 'user', 'job'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
  }],
  
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

// Indexes for optimization
AdminSchema.index({ userId: 1, isActive: 1 });
AdminSchema.index({ 'permissions.canApproveColleges': 1 });
AdminSchema.index({ 'permissions.canApproveRecruiters': 1 });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
