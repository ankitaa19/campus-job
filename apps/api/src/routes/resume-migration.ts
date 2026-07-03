/**
 * Resume URL Migration API Routes
 * 
 * Provides endpoints to check and fix resume URL issues
 */

import express from 'express';
import { ResumeUrlMigration } from '../utils/resume-url-migration';
import authMiddleware from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/resume-migration/scan-urls
 * Scan all generated resumes for URL analysis
 */
router.get('/scan-urls', authMiddleware, async (req, res) => {
  try {
    const result = await ResumeUrlMigration.scanAllResumeUrls();
    
    res.json({
      success: true,
      data: result,
      message: 'Resume URL scan completed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error scanning resume URLs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan resume URLs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/resume-migration/scan-student-history
 * Scan student resume history for URL issues
 */
router.get('/scan-student-history', authMiddleware, async (req, res) => {
  try {
    const result = await ResumeUrlMigration.scanStudentResumeHistory();
    
    res.json({
      success: true,
      data: result,
      message: 'Student resume history scan completed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error scanning student resume history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan student resume history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/resume-migration/fix-student-urls
 * Fix URLs in student resume history
 */
router.post('/fix-student-urls', authMiddleware, async (req, res) => {
  try {
    const result = await ResumeUrlMigration.fixStudentResumeHistoryUrls();
    
    res.json({
      success: true,
      data: result,
      message: 'Student resume history URLs fixed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing student resume history URLs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix student resume history URLs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
