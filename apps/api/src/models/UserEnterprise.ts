import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
  _id: Types.ObjectId;
  tenantId?: Types.ObjectId; // Multi-tenant reference
  
  // Authentication
  email: string;
  emailVerified: boolean;
  password: string;
  phone?: string;
  phoneVerified: boolean;
  whatsappNumber?: string;
  
  // Encrypted PII fields (enterprise security)
  firstNameEncrypted?: Buffer;
  lastNameEncrypted?: Buffer;
  dateOfBirthEncrypted?: Buffer;
  
  // Role-based access
  role: 'student' | 'recruiter' | 'college_admin' | 'placement_officer' | 'super_admin';
  permissions: Record<string, any>; // Fine-grained permissions
  
  // Account status  
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'deleted';
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  
  // GDPR compliance
  consentGiven: boolean;
  consentDate?: Date;
  deletionRequestedAt?: Date;
  anonymizedAt?: Date;
  
  // AI/ML features
  profileVector?: number[]; // For semantic search
  matchingPreferences: Record<string, any>;
  
  // Legacy fields (for backward compatibility)
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  encryptField(value: string): Buffer;
  decryptField(encryptedValue: Buffer): string;
  checkTenantAccess(tenantId: Types.ObjectId): boolean;
  incrementFailedLogins(): void;
  resetFailedLogins(): void;
}

const UserSchema = new Schema<IUser>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    trim: true,
    sparse: true, // Allow nulls but enforce uniqueness when present
    index: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  whatsappNumber: {
    type: String,
    trim: true,
    index: true
  },
  
  // Encrypted PII fields
  firstNameEncrypted: Buffer,
  lastNameEncrypted: Buffer,
  dateOfBirthEncrypted: Buffer,
  
  role: {
    type: String,
    enum: ['student', 'recruiter', 'college_admin', 'placement_officer', 'super_admin'],
    required: true,
    index: true
  },
  permissions: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification', 'deleted'],
    default: 'pending_verification',
    index: true
  },
  lastLoginAt: {
    type: Date,
    index: true
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  
  // GDPR compliance
  consentGiven: {
    type: Boolean,
    default: false
  },
  consentDate: Date,
  deletionRequestedAt: Date,
  anonymizedAt: Date,
  
  // AI/ML features
  profileVector: [Number], // Array of numbers for embeddings
  matchingPreferences: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Legacy fields (backward compatibility)
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  lastLogin: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Compound indexes for enterprise performance
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'deleted' } } });
UserSchema.index({ tenantId: 1, role: 1 }, { partialFilterExpression: { status: 'active' } });
UserSchema.index({ phone: 1 }, { sparse: true, partialFilterExpression: { phoneVerified: true } });

// Enterprise security methods
UserSchema.methods.encryptField = function(value: string): Buffer {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return Buffer.from(encrypted, 'hex');
};

UserSchema.methods.decryptField = function(encryptedValue: Buffer): string {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const decipher = crypto.createDecipher(algorithm, key);
  
  let decrypted = decipher.update(encryptedValue.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

UserSchema.methods.checkTenantAccess = function(tenantId: Types.ObjectId): boolean {
  // Multi-tenant access control
  if (this.role === 'super_admin') return true;
  if (this.role === 'recruiter') return true; // Recruiters can access multiple tenants
  return this.tenantId?.equals(tenantId) || false;
};

UserSchema.methods.incrementFailedLogins = function(): void {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
};

UserSchema.methods.resetFailedLogins = function(): void {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLoginAt = new Date();
};

// Tenant access validation
UserSchema.pre('save', function(next) {
  // Validate tenant requirements based on role
  if (['student', 'college_admin', 'placement_officer'].includes(this.role) && !this.tenantId) {
    return next(new Error('Tenant ID required for this role'));
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
