import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICollegeContact {
  type: 'placement_officer' | 'director' | 'dean' | 'hod' | 'admin' | 'faculty';
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation: string;
  isPrimary: boolean;
  isActive: boolean;
  linkedUserId?: Types.ObjectId; // If they have a user account
}

export interface ICollegeDepartment {
  name: string;
  code: string;
  head: string;
  email?: string;
  phone?: string;
  establishedYear?: number;
  accreditations: string[];
  studentCount: number;
  facultyCount: number;
  courses: {
    name: string;
    duration: number; // in years
    degree: 'diploma' | 'bachelor' | 'master' | 'doctorate';
    specialization?: string;
    totalSeats: number;
    currentBatch: number;
    passingPercentage?: number;
  }[];
}

export interface ICollegeRankings {
  source: string; // NIRF, Times, QS, etc.
  rank: number;
  category: string; // Overall, Engineering, MBA, etc.
  year: number;
  score?: number;
  maxScore?: number;
}

export interface IPlacementStats {
  academicYear: string;
  totalStudents: number;
  totalPlaced: number;
  placementPercentage: number;
  averagePackage: number;
  medianPackage: number;
  highestPackage: number;
  lowestPackage: number;
  topRecruiters: string[];
  departmentWiseStats: {
    department: string;
    totalStudents: number;
    placed: number;
    averagePackage: number;
    highestPackage: number;
  }[];
  packageRanges: {
    range: string; // e.g., "0-3 LPA"
    count: number;
    percentage: number;
  }[];
}

export interface ICollegeInfrastructure {
  campusArea: number; // in acres
  totalBuildings: number;
  laboratories: number;
  libraries: number;
  hostels: {
    boys: number;
    girls: number;
    totalCapacity: number;
  };
  sportsComplexes: number;
  auditoriums: number;
  conferenceHalls: number;
  wifi: boolean;
  powerBackup: boolean;
  medicalFacilities: boolean;
  transportFacility: boolean;
  canteen: boolean;
  gymnasium: boolean;
  playground: boolean;
}

export interface IAccreditation {
  body: string; // NBA, NAAC, AICTE, etc.
  status: 'accredited' | 'reaccredited' | 'pending' | 'expired' | 'not_accredited';
  grade?: string;
  validFrom: Date;
  validUntil: Date;
  certificateUrl?: string;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
}

export interface ICollege extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId; // Each college is a tenant
  
  // Basic Information
  name: string;
  shortName?: string; // Acronym or abbreviation
  establishedYear: number;
  type: 'government' | 'private' | 'deemed' | 'autonomous' | 'central' | 'state';
  category: 'engineering' | 'medical' | 'management' | 'arts_science' | 'law' | 'pharmacy' | 'mixed';
  
  // Contact & Location
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };
  contacts: ICollegeContact[];
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  
  // Administrative Details
  universityAffiliation?: string;
  principalName: string;
  principalEmail?: string;
  principalPhone?: string;
  registrationNumber?: string;
  
  // Academic Structure
  departments: ICollegeDepartment[];
  totalStudents: number;
  totalFaculty: number;
  studentFacultyRatio: number;
  
  // Accreditations & Recognition
  accreditations: IAccreditation[];
  rankings: ICollegeRankings[];
  autonomousStatus: boolean;
  nbaAccredited: boolean;
  naacGrade?: string;
  aicteApproved: boolean;
  ugcRecognized: boolean;
  
  // Infrastructure
  infrastructure: ICollegeInfrastructure;
  
  // Placement Information
  placementCell: {
    isActive: boolean;
    officerName: string;
    officerEmail: string;
    officerPhone?: string;
    establishedYear?: number;
    websiteUrl?: string;
    brochureUrl?: string;
  };
  placementStats: IPlacementStats[];
  
  // Recruitment Information
  recruitmentPreferences: {
    allowedJobTypes: ('full-time' | 'part-time' | 'internship' | 'contract')[];
    minimumPackage?: number;
    preferredCompanies: string[];
    blacklistedCompanies: string[];
    recruitmentCalendar: {
      season: 'summer' | 'winter' | 'campus';
      startDate: Date;
      endDate: Date;
      description?: string;
    }[];
    eligibilityCriteria: {
      minimumCGPA: number;
      allowBacklogs: boolean;
      maxBacklogs?: number;
      allowCurrentBacklogs: boolean;
    };
  };
  
  // Platform Configuration
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    startDate: Date;
    endDate: Date;
    maxStudents: number;
    maxJobs: number;
    maxRecruiters: number;
    features: string[];
    isActive: boolean;
    paymentStatus: 'paid' | 'pending' | 'overdue' | 'cancelled';
    lastPaymentDate?: Date;
    nextBillingDate?: Date;
    billingAmount?: number;
    currency: string;
  };
  
  // Platform Settings
  settings: {
    allowDirectApplications: boolean;
    requireApprovalForApplications: boolean;
    autoShareStudentProfiles: boolean;
    allowBulkApplications: boolean;
    notificationPreferences: {
      newJobs: boolean;
      applications: boolean;
      interviews: boolean;
      offers: boolean;
      deadlines: boolean;
    };
    branding: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customDomain?: string;
    };
  };
  
  // Analytics & Performance
  analytics: {
    totalJobsPosted: number;
    totalApplications: number;
    totalPlacements: number;
    averageTimeToPlacement: number; // days
    topRecruitingCompanies: string[];
    platformUsage: {
      activeStudents: number;
      activeRecruiters: number;
      lastActivityDate: Date;
    };
    conversionRates: {
      applicationToInterview: number;
      interviewToOffer: number;
      offerToAcceptance: number;
    };
  };
  
  // Compliance & Verification
  verification: {
    status: 'pending' | 'verified' | 'rejected' | 'suspended';
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    verificationDocuments: {
      type: string;
      url: string;
      uploadedAt: Date;
      verified: boolean;
    }[];
    rejectionReason?: string;
  };
  
  // API Integration
  integrations: {
    smsProvider?: {
      provider: string;
      apiKey: string;
      isActive: boolean;
    };
    emailProvider?: {
      provider: string;
      apiKey: string;
      fromEmail: string;
      isActive: boolean;
    };
    paymentGateway?: {
      provider: string;
      merchantId: string;
      isActive: boolean;
    };
    lmsIntegration?: {
      provider: string;
      apiEndpoint: string;
      apiKey: string;
      isActive: boolean;
    };
  };
  
  // Business Intelligence
  biMetrics: {
    studentSatisfactionScore?: number;
    recruiterSatisfactionScore?: number;
    platformEngagementScore?: number;
    digitalReadinessScore?: number;
    lastCalculatedAt?: Date;
  };
  
  // Status & Lifecycle
  status: 'active' | 'inactive' | 'suspended' | 'onboarding' | 'trial' | 'churned';
  onboardingCompleted: boolean;
  onboardingSteps: {
    step: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: Types.ObjectId;
  }[];
  
  // Collaboration
  administrators: {
    userId: Types.ObjectId;
    role: 'super_admin' | 'admin' | 'placement_officer' | 'faculty' | 'viewer';
    permissions: string[];
    addedAt: Date;
    addedBy: Types.ObjectId;
    isActive: boolean;
  }[];
  
  // External Data
  externalIds: {
    aicteeId?: string;
    ugcId?: string;
    naacId?: string;
    nbaId?: string;
    universityRollNumber?: string;
  };
  
  // Archival
  archivedAt?: Date;
  archiveReason?: string;
  
  // Timestamps
  lastLoginAt?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculatePlacementRate(year?: string): number;
  getActiveStudentCount(): Promise<number>;
  checkSubscriptionValidity(): boolean;
  generateAnalyticsReport(dateRange?: { start: Date; end: Date }): any;
  updateBIMetrics(): Promise<void>;
}

const CollegeContactSchema = new Schema<ICollegeContact>({
  type: {
    type: String,
    enum: ['placement_officer', 'director', 'dean', 'hod', 'admin', 'faculty'],
    required: true
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  department: String,
  designation: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  linkedUserId: { type: Schema.Types.ObjectId, ref: 'User' }
});

const CollegeDepartmentSchema = new Schema<ICollegeDepartment>({
  name: { type: String, required: true },
  code: { type: String, required: true },
  head: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: String,
  establishedYear: Number,
  accreditations: [String],
  studentCount: { type: Number, default: 0 },
  facultyCount: { type: Number, default: 0 },
  courses: [{
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    degree: {
      type: String,
      enum: ['diploma', 'bachelor', 'master', 'doctorate'],
      required: true
    },
    specialization: String,
    totalSeats: { type: Number, required: true },
    currentBatch: Number,
    passingPercentage: Number
  }]
});

const CollegeRankingsSchema = new Schema<ICollegeRankings>({
  source: { type: String, required: true },
  rank: { type: Number, required: true },
  category: { type: String, required: true },
  year: { type: Number, required: true },
  score: Number,
  maxScore: Number
});

const PlacementStatsSchema = new Schema<IPlacementStats>({
  academicYear: { type: String, required: true },
  totalStudents: { type: Number, required: true },
  totalPlaced: { type: Number, required: true },
  placementPercentage: { type: Number, required: true },
  averagePackage: { type: Number, required: true },
  medianPackage: { type: Number, required: true },
  highestPackage: { type: Number, required: true },
  lowestPackage: { type: Number, required: true },
  topRecruiters: [String],
  departmentWiseStats: [{
    department: String,
    totalStudents: Number,
    placed: Number,
    averagePackage: Number,
    highestPackage: Number
  }],
  packageRanges: [{
    range: String,
    count: Number,
    percentage: Number
  }]
});

const CollegeInfrastructureSchema = new Schema<ICollegeInfrastructure>({
  campusArea: Number,
  totalBuildings: Number,
  laboratories: Number,
  libraries: Number,
  hostels: {
    boys: Number,
    girls: Number,
    totalCapacity: Number
  },
  sportsComplexes: Number,
  auditoriums: Number,
  conferenceHalls: Number,
  wifi: { type: Boolean, default: false },
  powerBackup: { type: Boolean, default: false },
  medicalFacilities: { type: Boolean, default: false },
  transportFacility: { type: Boolean, default: false },
  canteen: { type: Boolean, default: false },
  gymnasium: { type: Boolean, default: false },
  playground: { type: Boolean, default: false }
});

const AccreditationSchema = new Schema<IAccreditation>({
  body: { type: String, required: true },
  status: {
    type: String,
    enum: ['accredited', 'reaccredited', 'pending', 'expired', 'not_accredited'],
    required: true
  },
  grade: String,
  validFrom: Date,
  validUntil: Date,
  certificateUrl: String,
  lastReviewDate: Date,
  nextReviewDate: Date
});

const CollegeSchema = new Schema<ICollege>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: 20
  },
  establishedYear: {
    type: Number,
    required: true,
    min: 1800,
    max: new Date().getFullYear()
  },
  type: {
    type: String,
    enum: ['government', 'private', 'deemed', 'autonomous', 'central', 'state'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['engineering', 'medical', 'management', 'arts_science', 'law', 'pharmacy', 'mixed'],
    required: true,
    index: true
  },
  
  // Contact & Location
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    country: { type: String, required: true, default: 'India' },
    pincode: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contacts: [CollegeContactSchema],
  website: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String
  },
  
  // Administrative Details
  universityAffiliation: String,
  principalName: { type: String, required: true },
  principalEmail: { type: String, lowercase: true },
  principalPhone: String,
  registrationNumber: String,
  
  // Academic Structure
  departments: [CollegeDepartmentSchema],
  totalStudents: { type: Number, default: 0, min: 0 },
  totalFaculty: { type: Number, default: 0, min: 0 },
  studentFacultyRatio: { type: Number, default: 0 },
  
  // Accreditations & Recognition
  accreditations: [AccreditationSchema],
  rankings: [CollegeRankingsSchema],
  autonomousStatus: { type: Boolean, default: false },
  nbaAccredited: { type: Boolean, default: false },
  naacGrade: {
    type: String,
    enum: ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D']
  },
  aicteApproved: { type: Boolean, default: false },
  ugcRecognized: { type: Boolean, default: false },
  
  // Infrastructure
  infrastructure: CollegeInfrastructureSchema,
  
  // Placement Information
  placementCell: {
    isActive: { type: Boolean, default: true },
    officerName: { type: String, required: true },
    officerEmail: { type: String, required: true, lowercase: true },
    officerPhone: String,
    establishedYear: Number,
    websiteUrl: String,
    brochureUrl: String
  },
  placementStats: [PlacementStatsSchema],
  
  // Recruitment Information
  recruitmentPreferences: {
    allowedJobTypes: [{
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract']
    }],
    minimumPackage: Number,
    preferredCompanies: [String],
    blacklistedCompanies: [String],
    recruitmentCalendar: [{
      season: {
        type: String,
        enum: ['summer', 'winter', 'campus']
      },
      startDate: Date,
      endDate: Date,
      description: String
    }],
    eligibilityCriteria: {
      minimumCGPA: { type: Number, min: 0, max: 10 },
      allowBacklogs: { type: Boolean, default: true },
      maxBacklogs: Number,
      allowCurrentBacklogs: { type: Boolean, default: false }
    }
  },
  
  // Platform Configuration
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxStudents: { type: Number, default: 100 },
    maxJobs: { type: Number, default: 10 },
    maxRecruiters: { type: Number, default: 5 },
    features: [String],
    isActive: { type: Boolean, default: true },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'cancelled'],
      default: 'paid'
    },
    lastPaymentDate: Date,
    nextBillingDate: Date,
    billingAmount: Number,
    currency: { type: String, default: 'INR' }
  },
  
  // Platform Settings
  settings: {
    allowDirectApplications: { type: Boolean, default: true },
    requireApprovalForApplications: { type: Boolean, default: false },
    autoShareStudentProfiles: { type: Boolean, default: false },
    allowBulkApplications: { type: Boolean, default: true },
    notificationPreferences: {
      newJobs: { type: Boolean, default: true },
      applications: { type: Boolean, default: true },
      interviews: { type: Boolean, default: true },
      offers: { type: Boolean, default: true },
      deadlines: { type: Boolean, default: true }
    },
    branding: {
      logoUrl: String,
      primaryColor: String,
      secondaryColor: String,
      customDomain: String
    }
  },
  
  // Analytics & Performance
  analytics: {
    totalJobsPosted: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0 },
    totalPlacements: { type: Number, default: 0 },
    averageTimeToPlacement: { type: Number, default: 0 },
    topRecruitingCompanies: [String],
    platformUsage: {
      activeStudents: { type: Number, default: 0 },
      activeRecruiters: { type: Number, default: 0 },
      lastActivityDate: { type: Date, default: Date.now }
    },
    conversionRates: {
      applicationToInterview: { type: Number, default: 0 },
      interviewToOffer: { type: Number, default: 0 },
      offerToAcceptance: { type: Number, default: 0 }
    }
  },
  
  // Compliance & Verification
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
      index: true
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationDocuments: [{
      type: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false }
    }],
    rejectionReason: String
  },
  
  // API Integration
  integrations: {
    smsProvider: {
      provider: String,
      apiKey: String,
      isActive: { type: Boolean, default: false }
    },
    emailProvider: {
      provider: String,
      apiKey: String,
      fromEmail: String,
      isActive: { type: Boolean, default: false }
    },
    paymentGateway: {
      provider: String,
      merchantId: String,
      isActive: { type: Boolean, default: false }
    },
    lmsIntegration: {
      provider: String,
      apiEndpoint: String,
      apiKey: String,
      isActive: { type: Boolean, default: false }
    }
  },
  
  // Business Intelligence
  biMetrics: {
    studentSatisfactionScore: Number,
    recruiterSatisfactionScore: Number,
    platformEngagementScore: Number,
    digitalReadinessScore: Number,
    lastCalculatedAt: Date
  },
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'onboarding', 'trial', 'churned'],
    default: 'onboarding',
    index: true
  },
  onboardingCompleted: { type: Boolean, default: false },
  onboardingSteps: [{
    step: String,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Collaboration
  administrators: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'placement_officer', 'faculty', 'viewer'],
      required: true
    },
    permissions: [String],
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
  }],
  
  // External Data
  externalIds: {
    aicteeId: String,
    ugcId: String,
    naacId: String,
    nbaId: String,
    universityRollNumber: String
  },
  
  // Archival
  archivedAt: Date,
  archiveReason: String,
  
  // Timestamps
  lastLoginAt: Date,
  lastActivityAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  collection: 'colleges'
});

// Enterprise indexes for performance
CollegeSchema.index({ name: 'text', 'address.city': 'text' });
CollegeSchema.index({ type: 1, category: 1, 'address.state': 1 });
CollegeSchema.index({ 'verification.status': 1, status: 1 });
CollegeSchema.index({ 'subscription.plan': 1, 'subscription.endDate': 1 });
CollegeSchema.index({ establishedYear: 1, type: 1 });

// Geospatial index for location-based queries
CollegeSchema.index({ 'address.coordinates': '2dsphere' });

// Enterprise methods
CollegeSchema.methods.calculatePlacementRate = function(year?: string): number {
  let stats = this.placementStats;
  
  if (year) {
    stats = stats.filter((stat: IPlacementStats) => stat.academicYear === year);
  }
  
  if (stats.length === 0) return 0;
  
  const latestStats = stats.sort((a: IPlacementStats, b: IPlacementStats) => 
    b.academicYear.localeCompare(a.academicYear)
  )[0];
  
  return latestStats.placementPercentage;
};

CollegeSchema.methods.getActiveStudentCount = async function(): Promise<number> {
  const User = mongoose.model('User');
  return await User.countDocuments({
    tenantId: this.tenantId,
    role: 'student',
    status: 'active'
  });
};

CollegeSchema.methods.checkSubscriptionValidity = function(): boolean {
  if (!this.subscription.isActive) return false;
  if (this.subscription.paymentStatus !== 'paid') return false;
  if (this.subscription.endDate && this.subscription.endDate < new Date()) return false;
  
  return true;
};

CollegeSchema.methods.generateAnalyticsReport = function(
  dateRange?: { start: Date; end: Date }
): any {
  return {
    collegeId: this._id,
    collegeName: this.name,
    reportGeneratedAt: new Date(),
    dateRange,
    metrics: {
      totalStudents: this.totalStudents,
      totalFaculty: this.totalFaculty,
      studentFacultyRatio: this.studentFacultyRatio,
      placementRate: this.calculatePlacementRate(),
      analytics: this.analytics,
      biMetrics: this.biMetrics
    },
    subscription: {
      plan: this.subscription.plan,
      status: this.subscription.paymentStatus,
      validUntil: this.subscription.endDate
    }
  };
};

CollegeSchema.methods.updateBIMetrics = async function(): Promise<void> {
  // This would calculate various business intelligence metrics
  // For now, placeholder implementation
  this.biMetrics.lastCalculatedAt = new Date();
  
  // Calculate engagement score based on activity
  const daysSinceLastActivity = Math.floor(
    (Date.now() - this.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  this.biMetrics.platformEngagementScore = Math.max(0, 100 - daysSinceLastActivity * 2);
  
  // Calculate digital readiness based on integrations and settings
  let digitalScore = 0;
  if (this.integrations.smsProvider?.isActive) digitalScore += 25;
  if (this.integrations.emailProvider?.isActive) digitalScore += 25;
  if (this.integrations.paymentGateway?.isActive) digitalScore += 25;
  if (this.integrations.lmsIntegration?.isActive) digitalScore += 25;
  
  this.biMetrics.digitalReadinessScore = digitalScore;
  
  await this.save();
};

// Middleware for student-faculty ratio calculation
CollegeSchema.pre('save', function(next) {
  if (this.totalStudents > 0 && this.totalFaculty > 0) {
    this.studentFacultyRatio = Math.round((this.totalStudents / this.totalFaculty) * 100) / 100;
  }
  
  this.lastActivityAt = new Date();
  next();
});

// Virtual for placement cell email (primary contact)
CollegeSchema.virtual('primaryContact').get(function() {
  return this.contacts.find((contact: ICollegeContact) => contact.isPrimary) || 
         this.contacts.find((contact: ICollegeContact) => contact.type === 'placement_officer');
});

export const CollegeEnterprise = mongoose.model<ICollege>('CollegeEnterprise', CollegeSchema);
