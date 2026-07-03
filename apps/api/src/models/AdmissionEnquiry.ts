import { Schema, model, Document, Types } from 'mongoose';

export interface IAdmissionEnquiry extends Document {
  _id: Types.ObjectId;
  collegeId: Types.ObjectId;
  courseId: Types.ObjectId;
  studentName: string;
  email: string;
  phone: string;
  source: 'website' | 'social_media' | 'referral' | 'exhibition' | 'advertisement' | 'other';
  status: 'new' | 'active' | 'interested' | 'contacted' | 'responded' | 'converted' | 'closed';
  notes?: string;
  leadScore?: number;
  followUpDate?: Date;
  convertedAt?: Date;
  assignedTo?: Types.ObjectId; // Staff member handling this enquiry
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionEnquirySchema = new Schema<IAdmissionEnquiry>({
  collegeId: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: false,
    index: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['website', 'social_media', 'referral', 'exhibition', 'advertisement', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'active', 'interested', 'contacted', 'responded', 'converted', 'closed'],
    default: 'new',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  followUpDate: {
    type: Date
  },
  convertedAt: {
    type: Date
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AdmissionEnquirySchema.index({ collegeId: 1, status: 1 });
AdmissionEnquirySchema.index({ courseId: 1, status: 1 });
AdmissionEnquirySchema.index({ email: 1, collegeId: 1 }, { unique: true });
AdmissionEnquirySchema.index({ createdAt: -1 });

// Middleware to update convertedAt when status changes to converted
AdmissionEnquirySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'converted' && !this.convertedAt) {
    this.convertedAt = new Date();
  }
  next();
});

export const AdmissionEnquiry = model<IAdmissionEnquiry>('AdmissionEnquiry', AdmissionEnquirySchema);
