import express from 'express';
import WhatsAppResumeFlow from '../services/whatsapp-resume-flow';
import { sendWhatsAppMessage } from '../services/whatsapp';
import ResumeBuilderService from '../services/resume-builder';
import { GeneratedResume } from '../models/GeneratedResume';
import { Student } from '../models/Student';
import auth from '../middleware/auth';

const router = express.Router();

/**
 * Admin endpoint to view conversation statistics
 * GET /api/whatsapp-admin/stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = WhatsAppResumeFlow.getStats();
    
    // Get additional statistics from database
    const [
      totalResumesGenerated,
      resumesToday,
      successfulDeliveries,
      failedDeliveries
    ] = await Promise.all([
      GeneratedResume.countDocuments({ generationType: 'whatsapp' }),
      GeneratedResume.countDocuments({ 
        generationType: 'whatsapp',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      GeneratedResume.countDocuments({ 
        'whatsappRecipients.status': 'sent'
      }),
      GeneratedResume.countDocuments({ 
        'whatsappRecipients.status': 'failed'
      })
    ]);
    
    res.json({
      success: true,
      data: {
        conversations: {
          active: stats.activeConversations,
          completedToday: stats.completedToday
        },
        resumes: {
          totalGenerated: totalResumesGenerated,
          generatedToday: resumesToday,
          successfulDeliveries,
          failedDeliveries
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * Admin endpoint to send test message
 * POST /api/whatsapp-admin/test-message
 */
router.post('/test-message', auth, async (req, res) => {
  try {
    const { phoneNumber, message, serviceType = 'general' } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }
    
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    const result = await sendWhatsAppMessage(cleanPhone, message, serviceType);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
      details: result
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test message'
    });
  }
});

/**
 * Admin endpoint to trigger resume flow for testing
 * POST /api/whatsapp-admin/test-resume-flow
 */
router.post('/test-resume-flow', auth, async (req, res) => {
  try {
    const { phoneNumber, email, jobDescription } = req.body;
    
    if (!phoneNumber || !email || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, email, and job description are required'
      });
    }
    
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    // Send initial message
    await sendWhatsAppMessage(
      cleanPhone,
      `🧪 *Test Resume Generation*\n\nStarting test resume generation for:\n• Email: ${email}\n• Job Description: ${jobDescription.substring(0, 100)}...\n\n⏳ Processing...`
    );
    
    // Generate resume
    const result = await ResumeBuilderService.createTailoredResume(
      email,
      cleanPhone,
      jobDescription
    );
    
    if (result.success) {
      await sendWhatsAppMessage(
        cleanPhone,
        `✅ *Test Resume Generated*\n\n📄 File: ${result.fileName}\n📥 Download: ${result.downloadUrl || 'Available on platform'}\n\n🧪 This was a test generation`
      );
    } else {
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Test Failed*\n\nError: ${result.message}\n\n🧪 This was a test generation`
      );
    }
    
    res.json({
      success: true,
      message: 'Test resume flow initiated',
      result: {
        resumeGenerated: result.success,
        fileName: result.fileName,
        error: result.success ? null : result.message
      }
    });
  } catch (error) {
    console.error('Error in test resume flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test resume flow'
    });
  }
});

/**
 * Endpoint to handle conversation reset
 * POST /api/whatsapp-admin/reset-conversation
 */
router.post('/reset-conversation', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    // This would reset the conversation state
    // Since conversationStates is private, we'll send a reset message
    await sendWhatsAppMessage(
      cleanPhone,
      `🔄 *Conversation Reset*\n\nYour conversation has been reset by an admin.\n\n🚀 Ready to start fresh? Type "resume" to begin!`
    );
    
    res.json({
      success: true,
      message: 'Conversation reset message sent'
    });
  } catch (error) {
    console.error('Error resetting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset conversation'
    });
  }
});

/**
 * Endpoint to get recent WhatsApp resume activities
 * GET /api/whatsapp-admin/recent-activities
 */
router.get('/recent-activities', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const recentResumes = await GeneratedResume.find({
      generationType: 'whatsapp'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('studentId', 'firstName lastName email')
    .lean();
    
    const activities = recentResumes.map(resume => ({
      id: resume._id,
      studentName: resume.studentId && typeof resume.studentId === 'object' ? 
        `${(resume.studentId as any).firstName || ''} ${(resume.studentId as any).lastName || ''}`.trim() : 
        'Unknown',
      studentEmail: resume.studentId && typeof resume.studentId === 'object' ? 
        (resume.studentId as any).email : 
        'Unknown',
      fileName: resume.fileName,
      jobTitle: resume.jobTitle,
      createdAt: resume.createdAt,
      whatsappSharedCount: resume.whatsappSharedCount || 0,
      lastSharedAt: resume.lastSharedAt,
      status: resume.whatsappRecipients?.length > 0 ? 
        resume.whatsappRecipients[resume.whatsappRecipients.length - 1].status : 
        'pending'
    }));
    
    res.json({
      success: true,
      data: activities,
      total: activities.length
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
});

/**
 * Endpoint to broadcast message to all active users
 * POST /api/whatsapp-admin/broadcast
 */
router.post('/broadcast', auth, async (req, res) => {
  try {
    const { message, userType = 'all' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Get users with phone numbers based on userType
    let users = [];
    if (userType === 'students' || userType === 'all') {
      const students = await Student.find({
        phoneNumber: { $exists: true, $ne: null }
      }).select('phoneNumber firstName').lean();
      users.push(...students);
    }
    
    // Add other user types as needed...
    
    const broadcastMessage = `📢 *CampusPe Announcement*\n\n${message}\n\n🤖 This is an automated message from CampusPe`;
    
    let successCount = 0;
    let failedCount = 0;
    
    // Send messages in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const promises = batch.map(async (user) => {
        try {
          if (user.phoneNumber) {
            const cleanPhone = user.phoneNumber.replace(/[^\d]/g, '');
            await sendWhatsAppMessage(cleanPhone, broadcastMessage);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to send to ${user.phoneNumber}:`, error);
          failedCount++;
        }
      });
      
      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    res.json({
      success: true,
      message: 'Broadcast completed',
      stats: {
        totalUsers: users.length,
        successCount,
        failedCount
      }
    });
  } catch (error) {
    console.error('Error in broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast'
    });
  }
});

export default router;
