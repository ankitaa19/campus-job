import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICourse extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  duration: string; // e.g., "2 Years", "4 Years"
  type: 'undergraduate' | 'postgraduate' | 'diploma' | 'certificate';
  category: 'undergraduate' | 'postgraduate' | 'diploma' | 'certificate';
  studyMode: 'full-time' | 'part-time' | 'distance-education';
  accreditation?: 'ugc-approved' | 'aicte-approved' | 'university-affiliated';
  collegeId: Types.ObjectId;
  department: string;
  streamType?: string; // New field for stream/specialization
  eligibilityCriteria?: string;
  totalFee?: number;
  semesterFee?: number;
  numberOfSeats?: number;
  enrolledStudents?: number;
  fees?: {
    tuition: number;
    other: number;
    currency: string;
  };
  // Step 2 fields
  specialOffers?: {
    spotAdmission?: {
      enabled: boolean;
      fee?: number;
      seats?: number;
    };
    earlyBird?: {
      enabled: boolean;
      discount?: number; // percentage
      validUntil?: Date;
    };
    meritScholarship?: {
      enabled: boolean;
      percent?: number; // percentage up to
      criteria?: string;
    };
  };
  admissionDates?: {
    startDate?: Date;
    deadline?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['undergraduate', 'postgraduate', 'diploma', 'certificate']
  },
  category: {
    type: String,
    required: true,
    enum: ['undergraduate', 'postgraduate', 'diploma', 'certificate']
  },
  studyMode: {
    type: String,
    required: true,
    enum: ['full-time', 'part-time', 'distance-education'],
    default: 'full-time'
  },
  accreditation: {
    type: String,
    enum: ['ugc-approved', 'aicte-approved', 'university-affiliated'],
    trim: true
  },
  collegeId: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  streamType: {
    type: String,
    trim: true
  },
  eligibilityCriteria: {
    type: String,
    trim: true
  },
  totalFee: {
    type: Number,
    min: 0,
    default: 0
  },
  semesterFee: {
    type: Number,
    min: 0,
    default: 0
  },
  numberOfSeats: {
    type: Number,
    min: 0,
    default: 0
  },
  enrolledStudents: {
    type: Number,
    min: 0,
    default: 0
  },
  fees: {
    tuition: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  // Step 2 fields schema
  specialOffers: {
    spotAdmission: {
      enabled: { type: Boolean, default: false },
      fee: { type: Number, default: 0 },
      seats: { type: Number, default: 0 }
    },
    earlyBird: {
      enabled: { type: Boolean, default: false },
      discount: { type: Number, default: 0 },
      validUntil: { type: Date }
    },
    meritScholarship: {
      enabled: { type: Boolean, default: false },
      percent: { type: Number, default: 0 },
      criteria: { type: String, trim: true }
    }
  },
  admissionDates: {
    startDate: { type: Date },
    deadline: { type: Date }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

CourseSchema.index({ collegeId: 1, code: 1 });
CourseSchema.index({ type: 1, isActive: 1 });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
