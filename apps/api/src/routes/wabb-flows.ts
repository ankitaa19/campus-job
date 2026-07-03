import express from 'express';
import { sendWhatsAppMessage } from '../services/whatsapp';
import ResumeBuilderService from '../services/resume-builder';
import { User } from '../models/User';
import { Student } from '../models/Student';

const router = express.Router();

// WABB Flow State Management
interface WABBFlowState {
  phone: string;
  step: 'initiated' | 'email_collected' | 'processing' | 'completed' | 'cancelled';
  email?: string;
  jobDescription?: string;
  name?: string;
  attemptCount: number;
  lastActivity: Date;
}

// In-memory state storage (use Redis in production)
const flowStates = new Map<string, WABBFlowState>();

/**
 * WABB Webhook Handler - Receives all flow events
 * POST /api/wabb-flows/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔄 WABB Flow Webhook received:', JSON.stringify(req.body, null, 2));
    
    const { 
      phone, 
      message, 
      name, 
      type, 
      flow_step, 
      email, 
      jobDescription,
      timestamp 
    } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Handle different flow events
    switch (type) {
      case 'resume_start':
        await handleResumeStart(cleanPhone, name, flow_step);
        break;
        
      case 'email_collected':
        await handleEmailCollected(cleanPhone, email, name);
        break;
        
      case 'job_description_collected':
        await handleJobDescriptionCollected(cleanPhone, jobDescription, name);
        break;
        
      case 'conversation_reset':
        await handleConversationReset(cleanPhone);
        break;
        
      case 'general_message':
        await handleGeneralMessage(cleanPhone, message, name);
        break;
        
      default:
        console.log('🔍 Unknown webhook type:', type);
        await handleGeneralMessage(cleanPhone, message, name);
    }
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ WABB Flow webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

/**
 * Handle resume flow initiation
 */
async function handleResumeStart(phone: string, name?: string, flowStep?: string): Promise<void> {
  console.log(`🚀 Resume flow started for ${phone} (${name})`);
  
  // Create or update flow state
  const state: WABBFlowState = {
    phone,
    step: 'initiated',
    name,
    attemptCount: 0,
    lastActivity: new Date()
  };
  
  flowStates.set(phone, state);
  
  // Log flow initiation
  console.log(`📊 Flow state created for ${phone}:`, state);
  
  // The welcome message is already sent by WABB flow
  // We just track the state here
}

/**
 * Handle email collection
 */
async function handleEmailCollected(phone: string, email: string, name?: string): Promise<void> {
  console.log(`📧 Email collected for ${phone}: ${email}`);
  
  const state = flowStates.get(phone);
  if (state) {
    state.email = email;
    state.step = 'email_collected';
    state.lastActivity = new Date();
    flowStates.set(phone, state);
  } else {
    // Create new state if not exists
    flowStates.set(phone, {
      phone,
      step: 'email_collected',
      email,
      name,
      attemptCount: 0,
      lastActivity: new Date()
    });
  }
  
  // Verify if user exists in our database
  const userExists = await checkUserExists(email);
  console.log(`👤 User exists in CampusPe: ${userExists}`);
  
  // WABB flow will handle the next message, we just log and track
}

/**
 * Handle job description collection and trigger resume generation
 */
async function handleJobDescriptionCollected(phone: string, jobDescription: string, name?: string): Promise<void> {
  console.log(`📋 Job description collected for ${phone} (${jobDescription.length} chars)`);
  
  const state = flowStates.get(phone);
  if (!state || !state.email) {
    console.error('❌ No email found for user, cannot generate resume');
    await sendWhatsAppMessage(
      phone,
      '❌ *Error: Missing Email*\n\nI don\'t have your email address. Please start over by typing "resume".'
    );
    return;
  }
  
  // Update state
  state.jobDescription = jobDescription;
  state.step = 'processing';
  state.lastActivity = new Date();
  flowStates.set(phone, state);
  
  try {
    // Generate resume using our existing service
    console.log(`🤖 Starting resume generation for ${state.email}`);
    
    const result = await ResumeBuilderService.createTailoredResume(
      state.email,
      phone,
      jobDescription
    );
    
    if (result.success) {
      // Update state to completed
      state.step = 'completed';
      state.lastActivity = new Date();
      flowStates.set(phone, state);
      
      console.log(`✅ Resume generated successfully: ${result.fileName}`);
      
      // Send success message with download details
      await sendWhatsAppMessage(
        phone,
        `🎉 *Resume Generated Successfully!*\n\n📄 *Your tailored resume is ready!*\n\n📊 **Resume Details:**\n• File: ${result.fileName}\n• Size: ${Math.round(result.pdfBuffer!.length / 1024)}KB\n• Generated: ${new Date().toLocaleString()}\n• Optimized for the job requirements\n\n🎯 **What I customized:**\n• Skills matching job requirements\n• Experience relevance\n• Professional summary\n• Keywords for ATS systems\n\n📥 **Download Link:**\n${result.downloadUrl || 'Check your CampusPe account'}\n\n🚀 **Next Steps:**\n• Review and fine-tune if needed\n• Submit your application\n• Track on CampusPe.com\n\n💼 Good luck with your application!\n\n🔄 Need another resume? Type "resume"`
      );
      
      // Clean up state after 5 minutes
      setTimeout(() => {
        flowStates.delete(phone);
        console.log(`🧹 Cleaned up flow state for ${phone}`);
      }, 5 * 60 * 1000);
      
    } else {
      console.error(`❌ Resume generation failed: ${result.message}`);
      
      await sendWhatsAppMessage(
        phone,
        `❌ *Resume Generation Failed*\n\n**Error:** ${result.message}\n\n🔧 **Common solutions:**\n• Ensure you have a complete CampusPe profile\n• Verify your email is correct\n• Add skills and experience to your profile\n• Try again in a few minutes\n\n🌐 **Create/Update Profile:**\nhttps://campuspe.com/profile\n\n🔄 **Try Again:** Type "resume"\n💡 **Need Help:** Type "help"`
      );
      
      // Reset state for retry
      if (state) {
        state.step = 'initiated';
        state.attemptCount += 1;
        flowStates.set(phone, state);
      }
    }
    
  } catch (error) {
    console.error('❌ Resume generation error:', error);
    
    await sendWhatsAppMessage(
      phone,
      `❌ *Technical Error*\n\nSorry! I encountered a technical issue while generating your resume.\n\n🔧 **What happened:**\n• Server processing error\n• Our team has been notified\n• This will be fixed shortly\n\n🔄 **Try again in 5 minutes**\n💻 **Alternative:** Visit CampusPe.com\n💡 **Support:** Contact our team\n\n🙏 Apologies for the inconvenience!`
    );
    
    flowStates.delete(phone);
  }
}

/**
 * Handle conversation reset
 */
async function handleConversationReset(phone: string): Promise<void> {
  console.log(`🔄 Conversation reset for ${phone}`);
  
  flowStates.delete(phone);
  
  // Log reset event
  console.log(`📊 Flow state cleared for ${phone}`);
}

/**
 * Handle general messages (fallback)
 */
async function handleGeneralMessage(phone: string, message: string, name?: string): Promise<void> {
  console.log(`💬 General message from ${phone}: ${message}`);
  
  const messageText = message?.toLowerCase() || '';
  
  // Check if user is asking for resume help
  if (messageText.includes('resume') || messageText.includes('cv')) {
    // Guide them to start the proper flow
    await sendWhatsAppMessage(
      phone,
      `🎯 *Ready to create a resume?*\n\nHi ${name || 'there'}! To start the resume builder, simply type:\n\n📝 **"resume"**\n\nI'll guide you through the process step by step!\n\n💡 Make sure you have:\n• Your email address ready\n• The job description you're applying for\n\n🚀 Type "resume" to begin!`
    );
  } else {
    // Default response
    await sendWhatsAppMessage(
      phone,
      `👋 *Welcome to CampusPe!*\n\nHi ${name || 'there'}! I'm your AI Resume Assistant.\n\n🤖 **What I can do:**\n• Create job-tailored resumes\n• Analyze job requirements\n• Optimize for ATS systems\n• Generate professional PDFs\n\n🚀 **Get Started:**\n• Type "resume" - Start building\n• Type "help" - Get detailed guide\n\n🔗 Visit CampusPe.com for more features!`
    );
  }
}

/**
 * Check if user exists in our database
 */
async function checkUserExists(email: string): Promise<boolean> {
  try {
    const user = await User.findOne({ email }).lean();
    if (user) {
      const student = await Student.findOne({ userId: user._id }).lean();
      return !!student;
    }
    return false;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

/**
 * Get flow statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const activeFlows = flowStates.size;
    const flowsByStep = {
      initiated: 0,
      email_collected: 0,
      processing: 0,
      completed: 0
    };
    
    for (const state of flowStates.values()) {
      if (state.step in flowsByStep) {
        flowsByStep[state.step as keyof typeof flowsByStep]++;
      }
    }
    
    res.json({
      success: true,
      data: {
        activeFlows,
        flowsByStep,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching flow stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * Clean up old flow states (call this periodically)
 */
function cleanupOldFlowStates(): void {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  let cleanedCount = 0;
  for (const [phone, state] of flowStates.entries()) {
    if (state.lastActivity < oneHourAgo) {
      flowStates.delete(phone);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} old flow states`);
  }
}

// Clean up old states every hour
setInterval(cleanupOldFlowStates, 60 * 60 * 1000);

export default router;
