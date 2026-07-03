/**
 * Resume URL Migration Script
 * 
 * This script helps identify and fix resumes that are still using
 * the old Azure URL format instead of Bunny.net URLs
 */

import { GeneratedResume } from '../models/GeneratedResume';
import { Student } from '../models/Student';
import { ResumeUrlUtils } from '../utils/resume-url.utils';

export class ResumeUrlMigration {
  
  /**
   * Scan all generated resumes and report URL status
   */
  static async scanAllResumeUrls(): Promise<{
    total: number;
    bunnyNetUrls: number;
    fallbackUrls: number;
    invalidUrls: number;
    summary: any[];
  }> {
    try {
      console.log('🔍 Scanning all generated resumes for URL analysis...');
      
      const resumes = await GeneratedResume.find({}, 'resumeId cloudUrl fileName status').lean();
      
      let bunnyNetUrls = 0;
      let fallbackUrls = 0;
      let invalidUrls = 0;
      const summary: any[] = [];
      
      for (const resume of resumes) {
        const cloudUrl = resume.cloudUrl;
        let status = 'UNKNOWN';
        
        if (ResumeUrlUtils.isBunnyNetUrl(cloudUrl)) {
          bunnyNetUrls++;
          status = '✅ BUNNY.NET';
        } else if (ResumeUrlUtils.isCorrectFormat(cloudUrl)) {
          fallbackUrls++;
          status = '⚠️ FALLBACK';
        } else {
          invalidUrls++;
          status = '❌ INVALID';
        }
        
        summary.push({
          resumeId: resume.resumeId,
          status,
          cloudUrl,
          fileName: resume.fileName
        });
      }
      
      const result = {
        total: resumes.length,
        bunnyNetUrls,
        fallbackUrls,
        invalidUrls,
        summary
      };
      
      console.log('📊 URL Analysis Complete:');
      console.log(`   Total Resumes: ${result.total}`);
      console.log(`   ✅ Bunny.net URLs: ${result.bunnyNetUrls} (${((result.bunnyNetUrls/result.total)*100).toFixed(1)}%)`);
      console.log(`   ⚠️ Fallback URLs: ${result.fallbackUrls} (${((result.fallbackUrls/result.total)*100).toFixed(1)}%)`);
      console.log(`   ❌ Invalid URLs: ${result.invalidUrls} (${((result.invalidUrls/result.total)*100).toFixed(1)}%)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error scanning resume URLs:', error);
      throw error;
    }
  }
  
  /**
   * Scan student resume history for URL issues
   */
  static async scanStudentResumeHistory(): Promise<{
    studentsScanned: number;
    resumesScanned: number;
    issuesFound: number;
    issues: any[];
  }> {
    try {
      console.log('🔍 Scanning student resume history for URL issues...');
      
      const students = await Student.find(
        { aiResumeHistory: { $exists: true, $ne: [] } },
        'aiResumeHistory'
      ).lean();
      
      let resumesScanned = 0;
      let issuesFound = 0;
      const issues: any[] = [];
      
      for (const student of students) {
        if (student.aiResumeHistory) {
          for (const resume of student.aiResumeHistory) {
            resumesScanned++;
            
            if (!ResumeUrlUtils.isCorrectFormat(resume.pdfUrl)) {
              issuesFound++;
              issues.push({
                studentId: student._id,
                resumeId: resume.id,
                currentUrl: resume.pdfUrl,
                issue: 'Invalid URL format'
              });
            }
          }
        }
      }
      
      const result = {
        studentsScanned: students.length,
        resumesScanned,
        issuesFound,
        issues
      };
      
      console.log('📊 Student History Analysis:');
      console.log(`   Students Scanned: ${result.studentsScanned}`);
      console.log(`   Resumes Scanned: ${result.resumesScanned}`);
      console.log(`   Issues Found: ${result.issuesFound}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error scanning student resume history:', error);
      throw error;
    }
  }
  
  /**
   * Fix URLs in student resume history
   */
  static async fixStudentResumeHistoryUrls(): Promise<{
    studentsUpdated: number;
    resumesUpdated: number;
  }> {
    try {
      console.log('🔧 Fixing URLs in student resume history...');
      
      const students = await Student.find(
        { aiResumeHistory: { $exists: true, $ne: [] } }
      );
      
      let studentsUpdated = 0;
      let resumesUpdated = 0;
      
      for (const student of students) {
        let studentNeedsUpdate = false;
        
        if (student.aiResumeHistory) {
          for (const resume of student.aiResumeHistory) {
            if (!ResumeUrlUtils.isCorrectFormat(resume.pdfUrl)) {
              // Fix the URL
              resume.pdfUrl = ResumeUrlUtils.getPrimaryDownloadUrl(
                (resume as any).cloudUrl, 
                resume.id, 
                'ai-resume-builder'
              );
              
              resumesUpdated++;
              studentNeedsUpdate = true;
              
              console.log(`🔧 Fixed URL for resume ${resume.id}: ${resume.pdfUrl}`);
            }
          }
        }
        
        if (studentNeedsUpdate) {
          await student.save();
          studentsUpdated++;
        }
      }
      
      const result = {
        studentsUpdated,
        resumesUpdated
      };
      
      console.log('✅ URL Fix Complete:');
      console.log(`   Students Updated: ${result.studentsUpdated}`);
      console.log(`   Resumes Updated: ${result.resumesUpdated}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fixing student resume history URLs:', error);
      throw error;
    }
  }
}
