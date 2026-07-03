import { GeneratedResume, IGeneratedResume } from '../models/GeneratedResume';
import { Student } from '../models/Student';
import { Types } from 'mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import BunnyStorageService from './bunny-storage.service';
import { ResumeUrlUtils } from '../utils/resume-url.utils';

export interface CreateGeneratedResumeData {
  studentId: string;
  jobTitle?: string;
  jobDescription: string;
  resumeData: any;
  fileName: string;
  pdfBuffer: Buffer;
  matchScore?: number;
  aiEnhancementUsed?: boolean;
  matchedSkills?: string[];
  missingSkills?: string[];
  suggestions?: string[];
  generationType?: 'ai' | 'manual' | 'template';
}

export interface WhatsAppShareResult {
  success: boolean;
  message: string;
  resumeId?: string;
  downloadUrl?: string;
  error?: string;
}

class GeneratedResumeService {
  
  /**
   * Create and store a new generated resume
   */
  async createGeneratedResume(data: CreateGeneratedResumeData): Promise<IGeneratedResume> {
    try {
      console.log('📝 Creating new generated resume for student:', data.studentId);
      
      // Generate unique resume ID
      const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate job description hash for duplicate detection
      const jobDescriptionHash = crypto
        .createHash('md5')
        .update(data.jobDescription.toLowerCase().trim())
        .digest('hex');
      
      // Check for similar recent resume (within last 7 days)
      const existingResume = await GeneratedResume.findSimilarResume(
        data.studentId, 
        jobDescriptionHash
      );
      
      if (existingResume) {
        console.log('🔄 Found similar resume generated recently:', existingResume.resumeId);
      }
      
      // Upload PDF to Bunny.net cloud storage with retry logic
      let cloudUrl: string | undefined;
      let filePath: string | undefined;
      
      console.log('☁️ Uploading PDF to Bunny.net cloud storage with retry logic...');
      
      const uploadResult = await BunnyStorageService.uploadPDFWithRetry(
        data.pdfBuffer, 
        data.fileName, 
        resumeId,
        3 // 3 retry attempts
      );
      
      if (uploadResult.success && uploadResult.url) {
        cloudUrl = uploadResult.url;
        console.log('✅ PDF uploaded to cloud:', cloudUrl);
      } else {
        console.warn('⚠️ Cloud upload failed after retries, storing only in database:', uploadResult.error);
        // Continue without cloud URL - the download endpoint will generate PDF on-demand
      }
      
      // Convert PDF to base64 for quick access (optional, only for small files)
      const pdfBase64 = data.pdfBuffer.length < 1024 * 1024 ? data.pdfBuffer.toString('base64') : undefined;
      
      // Transform resume data to match schema structure
      const transformedResumeData = this.transformResumeDataForSchema(data.resumeData);
      
      // Create new generated resume document
      const generatedResume = new GeneratedResume({
        studentId: new Types.ObjectId(data.studentId),
        resumeId,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        jobDescriptionHash,
        resumeData: transformedResumeData,
        fileName: data.fileName,
        filePath,
        cloudUrl, // Primary storage URL (Bunny.net)
        fileSize: data.pdfBuffer.length,
        mimeType: 'application/pdf',
        pdfBase64, // Only store base64 for small files
        matchScore: data.matchScore,
        aiEnhancementUsed: data.aiEnhancementUsed || false,
        matchedSkills: data.matchedSkills || [],
        missingSkills: data.missingSkills || [],
        suggestions: data.suggestions || [],
        status: 'completed',
        generationType: data.generationType || 'ai',
        downloadCount: 0,
        whatsappSharedCount: 0,
        whatsappSharedAt: [],
        whatsappRecipients: [],
        generatedAt: new Date()
      });
      
      const savedResume = await generatedResume.save();
      console.log('✅ Generated resume saved successfully:', savedResume.resumeId);
      
      // Update student's resume history for backward compatibility
      await this.updateStudentResumeHistory(data.studentId, savedResume);
      
      return savedResume;
      
    } catch (error) {
      console.error('❌ Error creating generated resume:', error);
      throw error;
    }
  }
  
  /**
   * Get resume by ID
   */
  async getResumeById(resumeId: string): Promise<IGeneratedResume | null> {
    try {
      return await GeneratedResume.findOne({ resumeId, status: 'completed' }).lean();
    } catch (error) {
      console.error('❌ Error fetching resume by ID:', error);
      return null;
    }
  }
  
  /**
   * Get student's resume history
   */
  async getStudentResumeHistory(studentId: string, limit = 10): Promise<IGeneratedResume[]> {
    try {
      return await GeneratedResume.findByStudentId(studentId, limit);
    } catch (error) {
      console.error('❌ Error fetching student resume history:', error);
      return [];
    }
  }
  
  /**
   * Download resume and track analytics
   */
  async downloadResume(resumeId: string): Promise<{ success: boolean; pdfBuffer?: Buffer; fileName?: string; error?: string }> {
    try {
      const resume = await GeneratedResume.findOne({ resumeId, status: 'completed' });
      
      if (!resume) {
        return { success: false, error: 'Resume not found' };
      }
      
      // Try to get PDF from different sources (priority order)
      let pdfBuffer: Buffer | undefined;
      
      // 1. Try base64 cache first (fastest)
      if (resume.pdfBase64) {
        console.log('📄 Serving PDF from base64 cache');
        pdfBuffer = Buffer.from(resume.pdfBase64, 'base64');
      }
      // 2. Try cloud storage URL
      else if (resume.cloudUrl) {
        console.log('☁️ Downloading PDF from cloud storage:', resume.cloudUrl);
        try {
          const axios = require('axios');
          const response = await axios.get(resume.cloudUrl, { responseType: 'arraybuffer' });
          pdfBuffer = Buffer.from(response.data);
        } catch (cloudError) {
          console.warn('⚠️ Cloud download failed, trying local fallback:', cloudError instanceof Error ? cloudError.message : 'Unknown error');
          // Fall through to local file attempt
        }
      }
      
      // 3. Try local file fallback
      if (!pdfBuffer && resume.filePath && fs.existsSync(resume.filePath)) {
        console.log('💾 Serving PDF from local storage');
        pdfBuffer = fs.readFileSync(resume.filePath);
      }
      
      if (!pdfBuffer) {
        return { success: false, error: 'Resume file not accessible from any source' };
      }
      
      // Update download analytics
      await resume.markAsDownloaded();
      
      return {
        success: true,
        pdfBuffer,
        fileName: resume.fileName
      };
      
    } catch (error) {
      console.error('❌ Error downloading resume:', error);
      return { success: false, error: 'Failed to download resume' };
    }
  }
  
  /**
   * Share resume on WhatsApp
   */
  async shareResumeOnWhatsApp(resumeId: string, phoneNumber: string): Promise<WhatsAppShareResult> {
    try {
      const resume = await GeneratedResume.findOne({ resumeId, status: 'completed' });
      
      if (!resume) {
        return { success: false, message: 'Resume not found' };
      }
      
      // Generate public download URL
      const downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
      
      // Mark as shared on WhatsApp
      await resume.markAsSharedOnWhatsApp(phoneNumber);
      
      // Send to WhatsApp using your existing service
      const { sendWhatsAppMessage } = require('./whatsapp');
      
      const message = `🎉 *Your Resume is Ready!*\n\n📄 *File:* ${resume.fileName}\n📅 *Generated:* ${resume.generatedAt.toLocaleDateString()}\n🎯 *Job Match Score:* ${resume.matchScore || 'N/A'}%\n\n📥 *Download:* ${downloadUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
      
      const whatsappResult = await sendWhatsAppMessage(phoneNumber, message);
      
      if (whatsappResult.success) {
        return {
          success: true,
          message: 'Resume shared successfully on WhatsApp',
          resumeId,
          downloadUrl
        };
      } else {
        return {
          success: false,
          message: `Failed to send WhatsApp message: ${whatsappResult.message}`,
          error: whatsappResult.message
        };
      }
      
    } catch (error) {
      console.error('❌ Error sharing resume on WhatsApp:', error);
      return {
        success: false,
        message: 'Failed to share resume on WhatsApp',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get student statistics
   */
  async getStudentStats(studentId: string): Promise<any> {
    try {
      const stats = await GeneratedResume.getStudentStats(studentId);
      return stats[0] || {
        totalResumes: 0,
        totalDownloads: 0,
        totalWhatsAppShares: 0,
        avgMatchScore: 0,
        lastGenerated: null
      };
    } catch (error) {
      console.error('❌ Error fetching student stats:', error);
      return null;
    }
  }
  
  /**
   * Cleanup expired resumes
   */
  async cleanupExpiredResumes(): Promise<{ deleted: number; errors: number }> {
    try {
      console.log('🧹 Starting cleanup of expired resumes...');
      
      const expiredResumes = await GeneratedResume.find({
        expiresAt: { $lte: new Date() },
        status: { $ne: 'expired' }
      }).lean();
      
      let deleted = 0;
      let errors = 0;
      
      for (const resume of expiredResumes) {
        try {
          // Delete physical file
          if (resume.filePath && fs.existsSync(resume.filePath)) {
            fs.unlinkSync(resume.filePath);
          }
          
          // Mark as expired instead of deleting (for analytics)
          await GeneratedResume.findByIdAndUpdate(resume._id, {
            status: 'expired',
            pdfBase64: undefined, // Remove base64 to save space
            filePath: undefined
          });
          
          deleted++;
        } catch (error) {
          console.error(`❌ Error cleaning up resume ${resume.resumeId}:`, error);
          errors++;
        }
      }
      
      console.log(`✅ Cleanup completed: ${deleted} expired, ${errors} errors`);
      return { deleted, errors };
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return { deleted: 0, errors: 1 };
    }
  }
  
  /**
   * Update student's aiResumeHistory for backward compatibility
   */
  private async updateStudentResumeHistory(studentId: string, generatedResume: IGeneratedResume): Promise<void> {
    try {
      const student = await Student.findById(studentId);
      if (!student) return;
      
      const historyItem = {
        id: generatedResume.resumeId,
        jobDescription: generatedResume.jobDescription.substring(0, 500),
        jobTitle: generatedResume.jobTitle,
        resumeData: generatedResume.resumeData,
        pdfUrl: ResumeUrlUtils.getPrimaryDownloadUrl(generatedResume.cloudUrl, generatedResume.resumeId, 'generated-resume'),
        cloudUrl: generatedResume.cloudUrl, // Include cloud URL
        generatedAt: generatedResume.generatedAt,
        matchScore: generatedResume.matchScore
      };
      
      // Log URL usage for monitoring
      ResumeUrlUtils.logUrlUsage(generatedResume.resumeId, historyItem.pdfUrl, 'Student Resume History');
      
      // Initialize aiResumeHistory if it doesn't exist
      if (!student.aiResumeHistory) {
        student.aiResumeHistory = [];
      }
      
      // Add new resume to history
      student.aiResumeHistory.push(historyItem);
      
      // Keep only last 5 resumes
      if (student.aiResumeHistory.length > 5) {
        student.aiResumeHistory = student.aiResumeHistory.slice(-5);
      }
      
      await student.save();
      console.log('✅ Updated student resume history for backward compatibility');
      
    } catch (error) {
      console.error('❌ Error updating student resume history:', error);
      // Don't throw error as this is for backward compatibility
    }
  }
  
  /**
   * Search resumes by criteria
   */
  async searchResumes(criteria: {
    studentId?: string;
    jobTitle?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minMatchScore?: number;
    generationType?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<IGeneratedResume[]> {
    try {
      const query: any = {};
      
      if (criteria.studentId) query.studentId = new Types.ObjectId(criteria.studentId);
      if (criteria.jobTitle) query.jobTitle = new RegExp(criteria.jobTitle, 'i');
      if (criteria.dateFrom || criteria.dateTo) {
        query.generatedAt = {};
        if (criteria.dateFrom) query.generatedAt.$gte = criteria.dateFrom;
        if (criteria.dateTo) query.generatedAt.$lte = criteria.dateTo;
      }
      if (criteria.minMatchScore) query.matchScore = { $gte: criteria.minMatchScore };
      if (criteria.generationType) query.generationType = criteria.generationType;
      if (criteria.status) query.status = criteria.status;
      
      return await GeneratedResume.find(query)
        .sort({ generatedAt: -1 })
        .limit(criteria.limit || 20)
        .skip(criteria.skip || 0)
        .lean();
        
    } catch (error) {
      console.error('❌ Error searching resumes:', error);
      return [];
    }
  }
  
  /**
   * Get resume analytics
   */
  async getResumeAnalytics(resumeId: string): Promise<any> {
    try {
      const resume = await GeneratedResume.findOne({ resumeId }).lean();
      if (!resume) return null;
      
      return {
        resumeId: resume.resumeId,
        studentId: resume.studentId,
        jobTitle: resume.jobTitle,
        generatedAt: resume.generatedAt,
        downloadCount: resume.downloadCount,
        whatsappSharedCount: resume.whatsappSharedCount,
        matchScore: resume.matchScore,
        status: resume.status,
        fileSize: resume.fileSize,
        whatsappRecipients: resume.whatsappRecipients?.length || 0,
        lastDownloaded: resume.lastDownloadedAt,
        lastShared: resume.lastSharedAt
      };
    } catch (error) {
      console.error('❌ Error getting resume analytics:', error);
      return null;
    }
  }

  /**
   * Transform resume data to match GeneratedResume schema structure
   */
  private transformResumeDataForSchema(resumeData: any): any {
    try {
      console.log('🔄 [GeneratedResumeService] Transforming resume data for schema compatibility...');
      
      // Handle both nested and flat structures
      const sourceData = resumeData.resumeData || resumeData;
      
      const transformed = {
        personalInfo: {
          firstName: sourceData.personalInfo?.firstName || sourceData.firstName || 'Unknown',
          lastName: sourceData.personalInfo?.lastName || sourceData.lastName || 'User',
          email: sourceData.personalInfo?.email || sourceData.email || '',
          phone: sourceData.personalInfo?.phone || sourceData.phone || '',
          address: sourceData.personalInfo?.address || sourceData.address || '',
          linkedin: sourceData.personalInfo?.linkedin || sourceData.linkedin || '',
          website: sourceData.personalInfo?.website || sourceData.website || ''
        },
        summary: sourceData.summary || sourceData.professionalSummary || '',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: []
      };

      // Transform skills - ensure proper structure with name, level, category
      if (sourceData.skills && Array.isArray(sourceData.skills)) {
        transformed.skills = sourceData.skills.map((skill: any) => {
          if (typeof skill === 'string') {
            return {
              name: skill,
              level: 'Intermediate',
              category: 'Technical'
            };
          }
          return {
            name: skill.name || skill.skill || skill,
            level: skill.level || 'Intermediate',
            category: skill.category || 'Technical'
          };
        });
      }

      // Transform experience - Fix field names and data types
      if (sourceData.experience && Array.isArray(sourceData.experience)) {
        transformed.experience = sourceData.experience.map((exp: any) => ({
          title: exp.title || exp.position || '',  // Schema expects 'title' not 'position'
          company: exp.company || '',
          location: exp.location || '',
          startDate: new Date(), // Schema requires Date object, not string
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          description: Array.isArray(exp.description) 
            ? exp.description.join(' ') // Convert array to string
            : (exp.description || ''),
          isCurrentJob: exp.isCurrentJob || false
        }));
      }

      // Transform education - Fix field names and data types  
      if (sourceData.education && Array.isArray(sourceData.education)) {
        transformed.education = sourceData.education.map((edu: any) => ({
          degree: edu.degree || '',
          field: edu.field || edu.fieldOfStudy || edu.degree || '', // Schema expects 'field' not 'fieldOfStudy'
          institution: edu.institution || edu.school || '',
          startDate: new Date(), // Schema requires Date object
          endDate: edu.endDate ? new Date(edu.endDate) : null,
          gpa: edu.gpa ? parseFloat(edu.gpa) : null,
          isCompleted: edu.isCompleted !== false // Default to true
        }));
      }

      // Transform projects
      if (sourceData.projects && Array.isArray(sourceData.projects)) {
        transformed.projects = sourceData.projects.map((proj: any) => ({
          name: proj.name || proj.title || '',
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.link || proj.url || ''
        }));
      }

      // Transform certifications
      if (sourceData.certifications && Array.isArray(sourceData.certifications)) {
        transformed.certifications = sourceData.certifications.map((cert: any) => ({
          name: cert.name || cert.title || '',
          issuer: cert.issuer || cert.organization || '',
          date: cert.date || cert.issueDate || '',
          link: cert.link || cert.url || ''
        }));
      }

      // Transform languages
      if (sourceData.languages && Array.isArray(sourceData.languages)) {
        transformed.languages = sourceData.languages.map((lang: any) => {
          if (typeof lang === 'string') {
            return {
              name: lang,
              proficiency: 'Fluent'
            };
          }
          return {
            name: lang.name || lang.language || lang,
            proficiency: lang.proficiency || lang.level || 'Fluent'
          };
        });
      }

      console.log('✅ [GeneratedResumeService] Resume data transformation completed');
      console.log('📊 [GeneratedResumeService] Transformed data structure:', {
        personalInfo: !!transformed.personalInfo.firstName,
        skillsCount: transformed.skills.length,
        experienceCount: transformed.experience.length,
        educationCount: transformed.education.length
      });

      return transformed;
    } catch (error) {
      console.error('❌ [GeneratedResumeService] Error transforming resume data:', error);
      // Return a minimal valid structure if transformation fails
      return {
        personalInfo: {
          firstName: 'Unknown',
          lastName: 'User',
          email: '',
          phone: '',
          address: '',
          linkedin: '',
          website: ''
        },
        summary: '',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: []
      };
    }
  }
}

export default new GeneratedResumeService();
