import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEducation {
  degree: string;
  field: string;
  institution: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  isCompleted: boolean;
}

export interface IExperience {
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrentJob: boolean;
}

export interface ISkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'technical' | 'soft' | 'language';
}

export interface IBasicInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  profilePicture?: string;
}

export interface IJobPreferences {
  jobTypes: string[];
  preferredLocations: string[];
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  workMode: 'remote' | 'onsite' | 'hybrid' | 'any';
  availableFrom?: Date;
}

export interface IStudent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  profilePicture?: string;

  // Contact & Social
  email?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // College Information
  collegeId: Types.ObjectId;
  collegeName?: string; // Direct college name input (optional, used if collegeId not set)
  studentId: string; // College student ID
  enrollmentYear: number;
  graduationYear?: number;
  currentSemester?: number;

  // Education & Experience
  education: IEducation[];
  experience: IExperience[];
  skills: ISkill[];

  // Resume
  resumeFile?: string; // File path/URL
  resumeText?: string; // Extracted text
  resumeScore?: number; // AI-generated score
  resumeAnalysis?: {
    skills: string[];
    category: string;
    experienceLevel: string;
    summary: string;
    uploadDate: Date;
    fileName: string;
    originalFileName?: string;
    resumeText?: string;
    extractedDetails?: {
      personalInfo?: {
        name?: string;
        summary?: string;
      };
      experience?: Array<{
        title?: string;
        company?: string;
        duration?: string;
        startDate?: Date;
        endDate?: Date;
        isCurrentJob?: boolean;
        description?: string;
        location?: string;
      }>;
      education?: Array<{
        degree?: string;
        field?: string;
        institution?: string;
        startDate?: Date;
        endDate?: Date;
        year?: number;
        isCompleted?: boolean;
      }>;
      contactInfo?: {
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        address?: string;
      };
      projects?: Array<{
        name?: string;
        description?: string;
        technologies?: string[];
      }>;
      certifications?: Array<{
        name?: string;
        year?: number;
        organization?: string;
      }>;
      languages?: Array<{
        name?: string;
        proficiency?: string;
      }>;
    };
    analysisQuality?: string;
    confidence?: number;
    originalSkillsDetected?: number;
    skillsFiltered?: number;
  };

  // AI Resume History (last 3 generated resumes)
  aiResumeHistory?: Array<{
    id: string;
    jobDescription: string;
    jobTitle?: string;
    resumeData: any;
    pdfUrl?: string;
    generatedAt: Date;
    matchScore?: number;
  }>;

  // Job Matching
  jobMatches?: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    matchPercentage: number;
    matchedSkills: string[];
    location?: string;
    salary?: string;
  }>;
  lastJobMatchUpdate?: Date;

  // Preferences
  jobPreferences: IJobPreferences;

  // Status
  profileCompleteness: number; // 0-100
  isActive: boolean;
  isPlacementReady: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const EducationSchema = new Schema({
  degree: { type: String, required: true },
  field: { type: String, required: true },
  institution: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  gpa: { type: Number, min: 0, max: 10 },
  isCompleted: { type: Boolean, default: false }
});

const ExperienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
  isCurrentJob: { type: Boolean, default: false }
});

const SkillSchema = new Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], required: true },
  category: { type: String, enum: ['technical', 'soft', 'language'], required: true }
});

const JobPreferencesSchema = new Schema({
  jobTypes: [{ type: String }],
  preferredLocations: [{ type: String }],
  expectedSalary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  workMode: { type: String, enum: ['remote', 'onsite', 'hybrid', 'any'], default: 'any' },
  availableFrom: { type: Date }
});

const StudentSchema = new Schema<IStudent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  profilePicture: { type: String },
  
  // Contact & Social
  email: { type: String, trim: true, lowercase: true },
  phoneNumber: { type: String, trim: true },
  linkedinUrl: { type: String, trim: true },
  githubUrl: { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  
  // College Information
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: false, index: true }, // Made optional for registration
  collegeName: { type: String, trim: true }, // Direct college name input
  studentId: { type: String, required: true, trim: true },
  enrollmentYear: { type: Number, required: true },
  graduationYear: { type: Number },
  currentSemester: { type: Number },
  
  // Education & Experience
  education: [EducationSchema],
  experience: [ExperienceSchema],
  skills: [SkillSchema],
  
  // Resume
  resumeFile: { type: String },
  resumeText: { type: String },
  resumeScore: { type: Number, min: 0, max: 100 },
  resumeAnalysis: {
    skills: [String],
    category: String,
    experienceLevel: String,
    summary: String,
    uploadDate: Date,
    fileName: String,
    originalFileName: String,
    resumeText: String,
    extractedDetails: {
      personalInfo: {
        name: String,
        summary: String
      },
      experience: [{
        title: String,
        company: String,
        duration: String,
        startDate: Date,
        endDate: Date,
        isCurrentJob: Boolean,
        description: String,
        location: String
      }],
      education: [{
        degree: String,
        field: String,
        institution: String,
        startDate: Date,
        endDate: Date,
        year: Number,
        isCompleted: Boolean
      }],
      contactInfo: {
        email: String,
        phone: String,
        linkedin: String,
        github: String,
        address: String
      },
      projects: [{
        name: String,
        description: String,
        technologies: [String]
      }],
      certifications: [{
        name: String,
        year: Number,
        organization: String
      }],
      languages: [{
        name: String,
        proficiency: String
      }]
    },
    analysisQuality: String,
    confidence: Number,
    originalSkillsDetected: Number,
    skillsFiltered: Number
  },
  
  // AI Resume History (last 3 generated resumes)
  aiResumeHistory: [{
    id: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobTitle: String,
    resumeData: { type: Schema.Types.Mixed },
    pdfUrl: String,
    generatedAt: { type: Date, default: Date.now },
    matchScore: Number
  }],
  
  // Job Matching
  jobMatches: [{
    jobId: String,
    jobTitle: String,
    company: String,
    matchPercentage: Number,
    matchedSkills: [String],
    location: String,
    salary: String
  }],
  lastJobMatchUpdate: Date,
  
  // Preferences
  jobPreferences: { type: JobPreferencesSchema, required: true },
  
  // Status
  profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true, index: true },
  isPlacementReady: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Indexes for optimization
StudentSchema.index({ collegeId: 1, isActive: 1 });
StudentSchema.index({ 'skills.name': 1 });
StudentSchema.index({ 'skills.category': 1 });
StudentSchema.index({ enrollmentYear: 1, graduationYear: 1 });
StudentSchema.index({ isPlacementReady: 1, isActive: 1 });
StudentSchema.index({ userId: 1 });

// Separate indexes for job matching (avoid parallel array indexing)
StudentSchema.index({ 'jobPreferences.jobTypes': 1, isPlacementReady: 1 });
StudentSchema.index({ 'jobPreferences.preferredLocations': 1, isPlacementReady: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);