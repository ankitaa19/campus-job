import express from 'express';
import axios from 'axios';
import { sendWhatsAppMessage } from '../services/whatsapp';
import mockWhatsApp from '../services/mock-whatsapp';

const router = express.Router();

// Helper function to send WhatsApp messages with fallback
async function sendWhatsAppWithFallback(phone: string, message: string, serviceType: 'otp' | 'jobs' | 'resume' | 'general' = 'general') {
  const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
  
  if (!hasWabbConfig) {
    console.log('⚠️ WABB not configured, using mock WhatsApp service');
    return await mockWhatsApp.sendMessage(phone, message, serviceType);
  }
  
  try {
    return await sendWhatsAppMessage(phone, message, serviceType);
  } catch (error) {
    console.log('⚠️ WABB service failed, falling back to mock service:', error);
    return await mockWhatsApp.sendMessage(phone, message, serviceType);
  }
}

/**
 * Send initial notification when resume generation starts
 */
router.post('/send-initial-notification', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    await sendWhatsAppWithFallback(
      cleanPhone,
      `🎯 *AI Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a personalized resume for you.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *Processing:*\n• Analyzing job requirements\n• Fetching your CampusPe profile\n• AI-powered resume tailoring\n• Generating professional PDF\n\nYour resume will be ready shortly! 📄✨`,
      'resume'
    );
    
    res.json({
      success: true,
      message: 'Initial notification sent'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to send initial notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

/**
 * Send error notification when resume generation fails
 */
router.post('/send-error-notification', async (req, res) => {
  try {
    const { phone, error } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    await sendWhatsAppWithFallback(
      cleanPhone,
      `❌ *Resume Generation Failed*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Error: ${error || 'Unknown error'}\n\n💡 Please try again in a few minutes or visit CampusPe.com\n\nApologies for the inconvenience! 🙏`,
      'resume'
    );
    
    res.json({
      success: true,
      message: 'Error notification sent'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to send error notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

/**
 * Send success webhook after resume is sent successfully
 */
router.post('/send-success-webhook', async (req, res) => {
  try {
    const { resumeId, phone } = req.body;
    
    if (!resumeId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and phone number are required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Send success message via WABB webhook
    console.log('📱 Sending success message via WABB webhook...');
    
    try {
      const successWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
      const successPayload = {
        resumeId: resumeId,
        number: cleanPhone
      };
      
      console.log('Sending to success webhook:', successWebhookUrl);
      console.log('Payload:', successPayload);
      
      const successResponse = await axios.post(successWebhookUrl, successPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      console.log('✅ Success webhook response:', successResponse.status);
      
      res.json({
        success: true,
        message: 'Success webhook sent',
        webhookStatus: successResponse.status
      });
      
    } catch (webhookError: any) {
      console.error('❌ Failed to send success webhook:', webhookError?.message || 'Unknown error');
      res.status(500).json({
        success: false,
        message: 'Failed to send success webhook',
        error: webhookError.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ Failed to process success webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
});

/**
 * Send error webhook when user not found or generation fails
 */
router.post('/send-error-webhook', async (req, res) => {
  try {
    const { phone, error } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Send error message via WABB webhook
    console.log('📱 Sending error message via WABB webhook...');
    
    try {
      const errorWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
      const errorPayload = {
        number: cleanPhone,
        message: error?.includes('not found') ? "User not found" : "Generation failed"
      };
      
      console.log('Sending to error webhook:', errorWebhookUrl);
      console.log('Payload:', errorPayload);
      
      const errorResponse = await axios.post(errorWebhookUrl, errorPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      console.log('✅ Error webhook response:', errorResponse.status);
      
      res.json({
        success: true,
        message: 'Error webhook sent',
        webhookStatus: errorResponse.status
      });
      
    } catch (webhookError: any) {
      console.error('❌ Failed to send error webhook:', webhookError?.message || 'Unknown error');
      res.status(500).json({
        success: false,
        message: 'Failed to send error webhook',
        error: webhookError.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ Failed to process error webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
});

/**
 * WABB entry point - redirects to frontend page
 * This endpoint receives the original WABB request and redirects to the frontend
 */
router.post('/generate-and-share', async (req, res) => {
  try {
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Create the frontend URL with parameters
    const frontendUrl = `${process.env.WEB_BASE_URL || 'https://campuspe-web-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net'}/wabb-resume-generator`;
    const params = new URLSearchParams({
      email,
      phone,
      name: name || '',
      jobDescription
    });
    
    const redirectUrl = `${frontendUrl}?${params.toString()}`;
    
    console.log('🔄 Redirecting WABB request to frontend:', redirectUrl);
    
    // Return redirect response
    res.json({
      success: true,
      message: 'Redirecting to resume generation page',
      redirectUrl: redirectUrl,
      data: {
        email,
        phone,
        name,
        jobDescription
      }
    });
    
  } catch (error: any) {
    console.error('❌ WABB redirect failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
});

export default router;
