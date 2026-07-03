import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOTPVerification extends Document {
  _id: Types.ObjectId;
  
  // For email-based verification (Colleges & Recruiters)
  email?: string;
  
  // For phone-based verification (Students)
  phoneNumber?: string;
  whatsappNumber?: string;
  
  // User type to determine verification method
  userType: 'student' | 'college' | 'recruiter';
  
  // OTP details
  otp: string;
  otpExpiry: Date;
  isVerified: boolean;
  attempts: number;
  maxAttempts: number;
  
  // External service session IDs
  sessionId?: string; // For 2Factor SMS API
  azureMessageId?: string; // For Azure Communication Services
  verifiedAt?: Date; // When OTP was verified
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const OTPVerificationSchema = new Schema<IOTPVerification>({
  // Email verification (for Colleges & Recruiters)
  email: {
    type: String,
    sparse: true, // Allow null values but unique when present
    trim: true,
    index: true
  },
  
  // Phone verification (for Students)
  phoneNumber: {
    type: String,
    sparse: true,
    trim: true,
    index: true
  },
  whatsappNumber: {
    type: String,
    sparse: true,
    trim: true,
    index: true
  },
  
  // User type determines verification method
  userType: {
    type: String,
    required: true,
    enum: ['student', 'college', 'recruiter'],
    index: true
  },
  
  // OTP details
  otp: {
    type: String,
    required: true,
    length: 6
  },
  otpExpiry: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - automatically delete expired documents
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  
  // External service session IDs
  sessionId: {
    type: String,
    sparse: true // For 2Factor SMS API session tracking
  },
  azureMessageId: {
    type: String,
    sparse: true // For Azure Communication Services tracking
  },
  verifiedAt: {
    type: Date,
    sparse: true // When OTP was verified
  }
}, {
  timestamps: true
});

// Indexes for optimization
OTPVerificationSchema.index({ email: 1, userType: 1, isVerified: 1 });
OTPVerificationSchema.index({ phoneNumber: 1, userType: 1, isVerified: 1 });
OTPVerificationSchema.index({ whatsappNumber: 1, userType: 1, isVerified: 1 });
OTPVerificationSchema.index({ userType: 1, createdAt: -1 });
OTPVerificationSchema.index({ sessionId: 1 }, { sparse: true });
OTPVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }); // 15 minutes TTL

// Validation: Ensure appropriate fields are present based on userType
OTPVerificationSchema.pre('save', function(next) {
  if (this.userType === 'student') {
    if (!this.phoneNumber) {
      return next(new Error('Phone number is required for student verification'));
    }
  } else if (this.userType === 'college' || this.userType === 'recruiter') {
    if (!this.email) {
      return next(new Error('Email is required for college/recruiter verification'));
    }
  }
  next();
});

export const OTPVerification = mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);
