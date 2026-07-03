import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  district: string;
  country: string;
}

export interface IContact {
  name: string;
  designation: string;
  email: string;
  phone: string;
}

export interface IPlacementStats {
  year: number;
  totalStudents: number;
  placedStudents: number;
  averagePackage: number;
  highestPackage: number;
  topRecruiters: string[];
}

export interface IFacility {
  _id?: Types.ObjectId;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

export interface IAchievement {
  _id?: Types.ObjectId;
  title: string;
  year: number;
  description?: string;
  photo?: string; // URL to uploaded image
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAlumni {
  _id?: Types.ObjectId;
  name: string;
  email?: string;
  company?: string;
  qualification?: string;
  graduationYear?: number;
  image?: string; // URL to uploaded image
  about?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVirtualTour {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  videoUrl?: string; // External video URL (YouTube, etc.)
  videoFile?: string; // Uploaded video file URL
  locationName?: string;
  thumbnailUrl?: string;
  duration?: number; // Video duration in seconds
  isPreview?: boolean; // Whether this video is set as banner preview
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBrochure {
  _id?: Types.ObjectId;
  name: string;
  size: number;
  url: string;
  cdnUrl: string;
  uploadedAt?: Date;
}

export interface ICollege extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  shortName?: string;
  domainCode: string; // Unique code for student registration
  website?: string;
  logo?: string;
  banner?: string;
  previewVideoId?: Types.ObjectId; // ID of the virtual tour video set as banner preview
  
  // Contact Information
  address: IAddress;
  primaryContact: IContact;
  placementContact?: IContact;
  
  // Academic Information
  establishedYear: number;
  affiliation: string; // University affiliation
  recognizedBy: string; // Regulatory body recognition (AICTE, UGC, etc.)
  collegeType?: string; // Private/Government/Autonomous
  aboutCollege?: string; // Description
  accreditation: string[];
  naacRating?: string; // NAAC accreditation rating (A++, A+, A, B++, B+, B, C)
  nirfRanking?: {
    category?: string;
    rank?: number;
    year?: number;
  };
  
  // Social Media Links
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    pinterest?: string;
    website?: string;
  };
  
  // Gallery
  gallery?: string[]; // Array of image URLs
  
  // Campus Facilities
  facilities?: IFacility[];
  selectedFacilities?: string[]; // Array of facility IDs for multi-select
  campusDescription?: string;
  
  // Achievements
  achievements?: IAchievement[];
  
  // Alumni
  alumni?: IAlumni[];
  
  // Virtual Tours
  virtualTours?: IVirtualTour[];
  
  // Brochures
  brochures?: IBrochure[];
  
  // Courses & Programs
  courses: Types.ObjectId[]; // Reference to Course model
  offeredPrograms: string[]; // Simple array for matching
  departments: string[];
  
  // Student & Recruiter Management
  students: Types.ObjectId[]; // Reference to Student model
  approvedRecruiters: Types.ObjectId[]; // Reference to Recruiter model
  pendingRecruiters: Types.ObjectId[]; // Recruiters awaiting approval
  
  // Placement Information
  placementStats: IPlacementStats[];
  isPlacementActive: boolean;
  placementCriteria?: {
    minimumCGPA: number;
    allowedBranches: string[];
    noOfBacklogs: number;
  };
  
  // Verification & Status
  isVerified: boolean;
  verificationDocuments: string[];
  isActive: boolean;
  
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
  
  // Settings
  allowDirectApplications: boolean; // Students can apply directly or need approval
  whatsappGroupId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  zipCode: { type: String, required: true },
  district: { type: String, required: true },
  country: { type: String, required: true, default: 'India' }
});

const ContactSchema = new Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
});

const PlacementStatsSchema = new Schema({
  year: { type: Number, required: true },
  totalStudents: { type: Number, required: true },
  placedStudents: { type: Number, required: true },
  averagePackage: { type: Number, required: true },
  highestPackage: { type: Number, required: true },
  topRecruiters: [{ type: String }]
});

const FacilitySchema = new Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, required: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
});

const AchievementSchema = new Schema({
  title: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  description: { type: String, trim: true },
  photo: { type: String, trim: true } // URL to uploaded image
}, {
  timestamps: true
});

const AlumniSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  company: { type: String, trim: true },
  qualification: { type: String, trim: true },
  graduationYear: { type: Number },
  image: { type: String, trim: true }, // URL to uploaded image
  about: { type: String, trim: true }
}, {
  timestamps: true
});

const VirtualTourSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  videoUrl: { type: String, trim: true }, // External video URL
  videoFile: { type: String, trim: true }, // Uploaded video file URL
  locationName: { type: String, trim: true },
  thumbnailUrl: { type: String, trim: true },
  duration: { type: Number }, // Video duration in seconds
  isPreview: { type: Boolean, default: false } // Whether this video is set as banner preview
}, {
  timestamps: true
});

const BrochureSchema = new Schema({
  name: { type: String, required: true, trim: true },
  size: { type: Number, required: true },
  url: { type: String, required: true, trim: true },
  cdnUrl: { type: String, required: true, trim: true }
}, {
  timestamps: true
});

const CollegeSchema = new Schema<ICollege>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true, index: true },
  shortName: { type: String, trim: true },
  domainCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  website: { type: String, trim: true },
  logo: { type: String },
  banner: { type: String },
  previewVideoId: { type: Schema.Types.ObjectId },
  
  // Contact Information
  address: { type: AddressSchema, required: true },
  primaryContact: { type: ContactSchema, required: true },
  placementContact: { type: ContactSchema },
  
  // Academic Information
  establishedYear: { type: Number, required: true },
  affiliation: { type: String, required: true },
  recognizedBy: { type: String, trim: true }, // Regulatory body recognition
  collegeType: { type: String, trim: true }, // Private/Government/Autonomous
  aboutCollege: { type: String, trim: true }, // Description
  accreditation: [{ type: String }],
  naacRating: { type: String, trim: true }, // NAAC accreditation rating
  nirfRanking: {
    category: { type: String, trim: true },
    rank: { type: Number },
    year: { type: Number }
  },
  
  // Social Media Links
  socialMedia: {
    linkedin: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    pinterest: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  
  // Gallery
  gallery: [{ type: String }], // Array of image URLs
  
  // Campus Facilities
  facilities: [FacilitySchema],
  selectedFacilities: [{ type: String }], // Array of facility IDs for multi-select
  campusDescription: { type: String, trim: true },
  
  // Achievements
  achievements: [AchievementSchema],
  
  // Alumni
  alumni: [AlumniSchema],
  
  // Virtual Tours
  virtualTours: [VirtualTourSchema],
  
  // Brochures
  brochures: [BrochureSchema],
  
  
  // Courses & Programs
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  offeredPrograms: [{ type: String }], // Programs offered by the college
  departments: [{ type: String, required: true }],
  
  // Student & Recruiter Management
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  approvedRecruiters: [{ type: Schema.Types.ObjectId, ref: 'Recruiter' }],
  pendingRecruiters: [{ type: Schema.Types.ObjectId, ref: 'Recruiter' }],
  
  // Placement Information
  placementStats: [PlacementStatsSchema],
  isPlacementActive: { type: Boolean, default: true, index: true },
  placementCriteria: {
    minimumCGPA: { type: Number, default: 6.0 },
    allowedBranches: [{ type: String }],
    noOfBacklogs: { type: Number, default: 0 }
  },
  
  // Verification & Status
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{ type: String }],
  isActive: { type: Boolean, default: true },
  
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
  
  // Settings
  allowDirectApplications: { type: Boolean, default: false },
  whatsappGroupId: { type: String }
}, {
  timestamps: true
});

// Indexes for optimization
CollegeSchema.index({ domainCode: 1, isActive: 1 });
CollegeSchema.index({ 'address.city': 1, 'address.state': 1 });
CollegeSchema.index({ name: 'text', shortName: 'text' });
CollegeSchema.index({ departments: 1 });
CollegeSchema.index({ isVerified: 1, isActive: 1 });

export const College = mongoose.model<ICollege>('College', CollegeSchema);