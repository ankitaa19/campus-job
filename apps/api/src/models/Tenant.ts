import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITenant extends Document {
  _id: Types.ObjectId;
  name: string;
  domain: string; // college domain for email validation
  status: 'active' | 'suspended' | 'pending_verification' | 'archived';
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
  maxStudents: number;
  maxRecruiters: number;
  
  // AI/ML configuration per tenant
  aiFeaturesEnabled: boolean;
  semanticSearchEnabled: boolean;
  autoMatchingEnabled: boolean;
  
  // Compliance & security
  dataRegion: string; // GDPR/data residency
  encryptionKeyId?: string; // Reference to external key management
  
  // Operational
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
}

const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: 'Invalid domain format'
    },
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_verification', 'archived'],
    default: 'pending_verification',
    index: true
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
    index: true
  },
  maxStudents: {
    type: Number,
    default: 1000,
    min: 0
  },
  maxRecruiters: {
    type: Number,
    default: 100,
    min: 0
  },
  aiFeaturesEnabled: {
    type: Boolean,
    default: true
  },
  semanticSearchEnabled: {
    type: Boolean,
    default: true
  },
  autoMatchingEnabled: {
    type: Boolean,
    default: true
  },
  dataRegion: {
    type: String,
    default: 'IN',
    maxlength: 50
  },
  encryptionKeyId: {
    type: String,
    maxlength: 255
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'tenants'
});

// Compound indexes for performance
TenantSchema.index({ status: 1, subscriptionTier: 1 });
TenantSchema.index({ domain: 'hashed' }); // Fast exact lookups

// Virtual for active status
TenantSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Pre-save validation
TenantSchema.pre('save', function(next) {
  if (this.isModified('domain')) {
    this.domain = this.domain.toLowerCase().trim();
  }
  next();
});

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);
