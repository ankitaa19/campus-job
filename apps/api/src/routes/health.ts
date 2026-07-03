import express from 'express';
import ResumeBuilderService from '../services/resume-builder';

const router = express.Router();

/**
 * Health check endpoint to test system capabilities
 * GET /api/health/pdf
 */
router.get('/pdf', async (req, res) => {
  try {
    console.log('🏥 PDF Health Check: Starting...');
    
    // Test basic HTML generation
    const testResumeData = {
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890'
      },
      summary: 'Health check test resume',
      skills: [{ name: 'Testing', level: 'expert', category: 'technical' }],
      experience: [],
      education: [],
      projects: []
    };

    const htmlContent = ResumeBuilderService.generateResumeHTML(testResumeData);
    console.log('✅ HTML generation working');

    // Test PDF generation with timeout
    const pdfBuffer = await Promise.race([
      ResumeBuilderService.generatePDF(htmlContent),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 15000)
      )
    ]) as Buffer;

    console.log('✅ PDF generation working, size:', pdfBuffer.length, 'bytes');

    res.json({
      success: true,
      message: 'PDF generation system is healthy',
      timestamp: new Date().toISOString(),
      pdfSize: pdfBuffer.length,
      environment: process.env.NODE_ENV || 'development',
      isAzure: !!(process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production')
    });

  } catch (error: any) {
    console.error('❌ PDF Health Check Failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'PDF generation system is unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      isAzure: !!(process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production')
    });
  }
});

/**
 * System information endpoint
 * GET /api/health/system
 */
router.get('/system', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isAzure: !!(process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production'),
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

export default router;
