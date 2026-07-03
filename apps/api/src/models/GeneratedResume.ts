import mongoose, { Document, Schema, Types, Model } from 'mongoose';

export interface IGeneratedResume extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  resumeId: string; // Unique identifier for each generated resume
  
  // Job Information
  jobTitle?: string;
  jobDescription: string;
  jobDescriptionHash: string; // For detecting similar job descriptions
  
  // Resume Data
  resumeData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      linkedin?: string;
      github?: string;
      location?: string;
    };
    summary: string;
    skills: Array<{
      name: string;
      level: string;
      category: string;
    }>;
    experience: Array<{
      title: string;
      company: string;
      location?: string;
      startDate: Date;
      endDate?: Date;
      description: string;
      isCurrentJob: boolean;
    }>;
    education: Array<{
      degree: string;
      field: string;
      institution: string;
      startDate: Date;
      endDate?: Date;
      gpa?: number;
      isCompleted: boolean;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      link?: string;
    }>;
    certifications: Array<{
      name: string;
      year: number;
      organization: string;
    }>;
  };
  
  // File Information
  fileName: string;
  filePath?: string; // Local file path if stored locally
  cloudUrl?: string; // Cloud storage URL
  fileSize: number;
  mimeType: string;
  pdfBase64?: string; // Base64 encoded PDF for quick access
  
  // AI Analysis Results
  matchScore?: number;
  aiEnhancementUsed: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  
  // Status and Metadata
  status: 'generating' | 'completed' | 'failed' | 'expired';
  generationType: 'ai' | 'manual' | 'template';
  downloadCount: number;
  whatsappSharedCount: number;
  
  // WhatsApp Integration
  whatsappSharedAt?: Date[];
  whatsappRecipients: Array<{
    phoneNumber: string;
    sharedAt: Date;
    status: 'sent' | 'delivered' | 'read' | 'failed';
  }>;
  
  // Timestamps
  generatedAt: Date;
  lastDownloadedAt?: Date;
  lastSharedAt?: Date;
  expiresAt?: Date; // For cleanup of old resumes
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsDownloaded(): Promise<IGeneratedResume>;
  markAsSharedOnWhatsApp(phoneNumber: string): Promise<IGeneratedResume>;
  updateWhatsAppStatus(phoneNumber: string, status: string): Promise<IGeneratedResume>;
}

export interface IGeneratedResumeModel extends Model<IGeneratedResume> {
  findByStudentId(studentId: string, limit?: number): Promise<IGeneratedResume[]>;
  findSimilarResume(studentId: string, jobDescriptionHash: string): Promise<IGeneratedResume | null>;
  getStudentStats(studentId: string): Promise<any[]>;
}

const GeneratedResumeSchema = new Schema({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true
  },
  resumeId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // Job Information
  jobTitle: { type: String },
  jobDescription: { type: String, required: true },
  jobDescriptionHash: { type: String, required: true, index: true },
  
  // Resume Data
  resumeData: {
    personalInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      linkedin: { type: String },
      github: { type: String },
      location: { type: String }
    },
    summary: { type: String, required: true },
    skills: [{
      name: { type: String, required: true },
      level: { type: String, required: true },
      category: { type: String, required: true }
    }],
    experience: [{
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      description: { type: String },
      isCurrentJob: { type: Boolean, default: false }
    }],
    education: [{
      degree: { type: String, required: true },
      field: { type: String, required: true },
      institution: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      gpa: { type: Number, min: 0, max: 10 },
      isCompleted: { type: Boolean, default: false }
    }],
    projects: [{
      name: { type: String, required: true },
      description: { type: String, required: true },
      technologies: [{ type: String }],
      link: { type: String }
    }],
    certifications: [{
      name: { type: String, required: true },
      year: { type: Number, required: true },
      organization: { type: String, required: true }
    }]
  },
  
  // File Information
  fileName: { type: String, required: true },
  filePath: { type: String },
  cloudUrl: { type: String },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: 'application/pdf' },
  pdfBase64: { type: String }, // Optional for quick access
  
  // AI Analysis Results
  matchScore: { type: Number, min: 0, max: 100 },
  aiEnhancementUsed: { type: Boolean, default: false },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  suggestions: [{ type: String }],
  
  // Status and Metadata
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed', 'expired'], 
    default: 'generating',
    index: true 
  },
  generationType: { 
    type: String, 
    enum: ['ai', 'manual', 'template'], 
    default: 'ai',
    index: true 
  },
  downloadCount: { type: Number, default: 0 },
  whatsappSharedCount: { type: Number, default: 0 },
  
  // WhatsApp Integration
  whatsappSharedAt: [{ type: Date }],
  whatsappRecipients: [{
    phoneNumber: { type: String, required: true },
    sharedAt: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'], 
      default: 'sent' 
    }
  }],
  
  // Timestamps
  generatedAt: { type: Date, default: Date.now, index: true },
  lastDownloadedAt: { type: Date },
  lastSharedAt: { type: Date },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true 
  }
}, {
  timestamps: true
});

// Indexes for optimization
GeneratedResumeSchema.index({ studentId: 1, generatedAt: -1 }); // Student's resume history
GeneratedResumeSchema.index({ resumeId: 1 }); // Quick lookup by resume ID
GeneratedResumeSchema.index({ jobDescriptionHash: 1, studentId: 1 }); // Detect similar jobs
GeneratedResumeSchema.index({ status: 1, generatedAt: -1 }); // Status-based queries
GeneratedResumeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto cleanup
GeneratedResumeSchema.index({ 'whatsappRecipients.phoneNumber': 1 }); // WhatsApp sharing

// Methods
GeneratedResumeSchema.methods.markAsDownloaded = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

GeneratedResumeSchema.methods.markAsSharedOnWhatsApp = function(phoneNumber: string) {
  this.whatsappSharedCount += 1;
  this.lastSharedAt = new Date();
  this.whatsappSharedAt.push(new Date());
  this.whatsappRecipients.push({
    phoneNumber,
    sharedAt: new Date(),
    status: 'sent'
  });
  return this.save();
};

GeneratedResumeSchema.methods.updateWhatsAppStatus = function(phoneNumber: string, status: string) {
  const recipient = this.whatsappRecipients.find((r: any) => r.phoneNumber === phoneNumber);
  if (recipient) {
    recipient.status = status;
    return this.save();
  }
};

// Static methods
GeneratedResumeSchema.statics.findByStudentId = function(studentId: string, limit = 10) {
  return this.find({ studentId, status: 'completed' })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .lean();
};

GeneratedResumeSchema.statics.findSimilarResume = function(studentId: string, jobDescriptionHash: string) {
  return this.findOne({ 
    studentId, 
    jobDescriptionHash, 
    status: 'completed',
    generatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Within last 7 days
  }).lean();
};

GeneratedResumeSchema.statics.getStudentStats = function(studentId: string) {
  return this.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalResumes: { $sum: 1 },
        totalDownloads: { $sum: '$downloadCount' },
        totalWhatsAppShares: { $sum: '$whatsappSharedCount' },
        avgMatchScore: { $avg: '$matchScore' },
        lastGenerated: { $max: '$generatedAt' }
      }
    }
  ]);
};

// Pre-save middleware
GeneratedResumeSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate unique resume ID if not provided
    if (!this.resumeId) {
      this.resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Generate job description hash for duplicate detection
    if (!this.jobDescriptionHash) {
      const crypto = require('crypto');
      this.jobDescriptionHash = crypto
        .createHash('md5')
        .update(this.jobDescription.toLowerCase().trim())
        .digest('hex');
    }
  }
  next();
});

export const GeneratedResume = mongoose.model<IGeneratedResume, IGeneratedResumeModel>('GeneratedResume', GeneratedResumeSchema);
