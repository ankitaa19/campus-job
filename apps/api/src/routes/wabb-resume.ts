import express from 'express';
import axios from 'axios';
import ResumeBuilderService from '../services/resume-builder';
import { sendWhatsAppMessage } from '../services/whatsapp';
import mockWhatsApp from '../services/mock-whatsapp';
import { Student } from '../models/Student';
import { User } from '../models/User';
import aiResumeMatchingService from '../services/ai-resume-matching';
import GeneratedResumeService from '../services/generated-resume.service';
// Temporarily disabled to fix 503 error - import wabbCompleteRouter from './wabb-complete';

// Helper function to send WhatsApp messages with fallback to mock service
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

const router = express.Router();

// Temporarily disabled to fix 503 error
// router.use('/', wabbCompleteRouter);

/**
 * Debug endpoint to check user existence
 */
router.get('/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { Student } = require('../models/Student');
    const { User } = require('../models/User');
    
    console.log(`🔍 Debugging user lookup for: ${email}`);
    
    // Check students collection
    const student = await Student.findOne({ email: email }).populate('userId');
    console.log('Student found:', !!student);
    
    // Check users collection  
    const user = await User.findOne({ email: email });
    console.log('User found:', !!user);
    
    res.json({
      email,
      studentExists: !!student,
      userExists: !!user,
      studentData: student ? {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        skills: student.skills?.length || 0,
        experience: student.experience?.length || 0
      } : null,
      userData: user ? {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.firstName + ' ' + user.lastName
      } : null
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

/**
 * WABB endpoint for WhatsApp resume generation
 * POST /api/wabb/create-resume
 * 
 * This endpoint receives email, phone, and job description from WhatsApp
 * and generates a tailored resume for the user
 */
router.post('/create-resume', async (req, res) => {
  try {
    console.log('🚀 WABB Resume Creation Request:', req.body);
    
    const { email, phone, jobDescription, name } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 Processing resume request for ${email} (${cleanPhone})`);
    
    // Send acknowledgment message to WhatsApp
    await sendWhatsAppMessage(
      cleanPhone,
      `🎯 *Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a tailored resume for you based on the job description you provided.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *What I'm doing:*\n• Analyzing the job requirements\n• Fetching your profile from CampusPe\n• Tailoring your resume to match\n• Generating PDF document\n\nI'll send you the resume shortly! 📄✨`,
      'resume'
    );
    
    // Generate tailored resume
    const result = await ResumeBuilderService.createTailoredResume(
      email,
      cleanPhone,
      jobDescription
    );
    
    if (!result.success) {
      console.error('❌ Resume generation failed:', result.message);
      
      // Send error message to WhatsApp
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 *Possible reasons:*\n• Profile not found on CampusPe\n• Incomplete profile information\n• Technical error\n\n🔗 Please visit CampusPe.com to:\n• Create/update your profile\n• Upload your resume\n• Add your skills and experience\n\nThen try again! 😊`
      );
      
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    console.log('✅ Resume generated successfully');
    
    // Convert PDF buffer to base64 for transmission
    const pdfBase64 = result.pdfBuffer!.toString('base64');
    
    // Send success message with resume to WhatsApp
    await sendWhatsAppMessage(
      cleanPhone,
      `🎉 *Resume Generated Successfully!*\n\nYour tailored resume is ready! 📄✨\n\n🎯 *Customized for:*\n• Job requirements analysis\n• Your skills & experience\n• Professional formatting\n\n📩 *Resume details:*\n• File: ${result.fileName}\n• Tailored: ${new Date().toLocaleDateString()}\n• Size: ${Math.round(result.pdfBuffer!.length / 1024)}KB\n\n� *Download Link:*\n${result.downloadUrl || 'Available on CampusPe.com'}\n\n�💼 Good luck with your application!\n\n🔗 Update your profile: CampusPe.com`
    );
    
    // Return success response with PDF data
    res.json({
      success: true,
      message: 'Resume generated and sent via WhatsApp',
      fileName: result.fileName,
      fileSize: result.pdfBuffer!.length,
      resumeId: result.resumeId,
      downloadUrl: result.downloadUrl,
      metadata: {
        generatedAt: new Date().toISOString(),
        email,
        phone: cleanPhone,
        jobDescriptionLength: jobDescription.length
      }
    });
    
  } catch (error) {
    console.error('❌ WABB Resume Creation Error:', error);
    
    // Try to send error message to WhatsApp if phone is available
    if (req.body.phone) {
      const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Technical Error*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Our team has been notified and will fix this shortly.\n\n💡 You can try again in a few minutes or visit CampusPe.com to generate your resume manually.\n\nApologies for the inconvenience! 🙏`
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during resume generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * WABB endpoint for automatic resume generation and WhatsApp sharing
 * POST /api/wabb/generate-and-share
 * 
 * This endpoint receives user information and job description from external platforms,
 * generates a tailored resume, and automatically shares it via WhatsApp
 */
router.post('/generate-and-share', async (req, res) => {
  try {
    console.log('🚀 WABB Auto-Generate & Share Request:', req.body);
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 Auto-processing resume request for ${email} (${cleanPhone})`);
    
    // Send initial acknowledgment message to WhatsApp
    await sendWhatsAppWithFallback(
      cleanPhone,
      `🎯 *AI Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a personalized resume for you.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *Processing:*\n• Analyzing job requirements\n• Fetching your CampusPe profile\n• AI-powered resume tailoring\n• Generating professional PDF\n\nYour resume will be ready shortly! 📄✨`,
      'resume'
    );
    
    // Generate tailored resume using the new AI approach
    console.log('📊 Looking up student profile...');
    
    // Find student profile
    let studentProfile = null;
    let result: { 
      success: boolean; 
      message: string; 
      resumeId: string; 
      fileName: string; 
      pdfBuffer: Buffer | null; 
      downloadUrl: string 
    } = { 
      success: false, 
      message: '', 
      resumeId: '', 
      fileName: '', 
      pdfBuffer: null, 
      downloadUrl: '' 
    };
    
    try {
      const user = await User.findOne({ email });
      if (user) {
        studentProfile = await Student.findOne({ userId: user._id }).lean();
      }
    } catch (error) {
      console.log('Could not fetch student profile:', error);
    }

    if (!studentProfile) {
      result.message = 'Student profile not found. Please complete your CampusPe profile first.';
    } else {
      try {
        // Generate AI resume content using the same approach as the working ai-resume-builder.ts
        const personalInfo = {
          name: `${studentProfile.firstName} ${studentProfile.lastName}`.trim(),
          firstName: studentProfile.firstName,
          lastName: studentProfile.lastName,
          email,
          phone: cleanPhone,
          linkedin: studentProfile?.linkedinUrl || undefined,
          github: studentProfile?.githubUrl || undefined
        };

        // Create user profile text for AI processing
        const userProfileText = `
PERSONAL INFO:
Name: ${personalInfo.name}
Email: ${email}
Phone: ${cleanPhone}

SKILLS:
${(studentProfile?.skills || []).map((skill: any) => `- ${skill.name || skill}`).join('\n')}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp: any) => 
  `- ${exp.title} at ${exp.company} (${exp.startDate || 'Date'} - ${exp.endDate || 'Present'})`
).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu: any) => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`
).join('\n')}
        `.trim();

        // Generate AI-optimized resume content
        const aiPrompt = `
You are an expert resume writer. Create a highly targeted resume that is 70% focused on the job description and 30% on the user's background. 

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
${userProfileText}

INSTRUCTIONS:
1. Analyze the job description to identify key requirements, skills, and responsibilities
2. Create a professional summary that heavily emphasizes job-relevant skills and experience
3. Rewrite experience descriptions to highlight achievements relevant to the target job
4. Prioritize skills that match the job requirements
5. Ensure 70% of content directly relates to job requirements, 30% to user's actual background
6. Use action verbs and quantifiable achievements where possible
7. Keep the tone professional and confident

Generate a JSON response with this exact structure:
{
  "summary": "Professional summary tailored to the job (2-3 sentences)",
  "skills": ["array", "of", "relevant", "skills", "max", "12"],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name", 
      "duration": "Date range",
      "description": ["bullet point 1", "bullet point 2", "bullet point 3"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Tailored project description highlighting job-relevant aspects",
      "technologies": ["relevant", "tech", "stack"]
    }
  ],
  "education": [
    {
      "degree": "Degree title",
      "institution": "Institution name",
      "year": "Year or status"
    }
  ]
}`;

        // Call Claude AI
        const aiResponse = await aiResumeMatchingService.callClaudeAPI(aiPrompt);
        
        console.log('🤖 AI Response received:', JSON.stringify(aiResponse, null, 2));
        
        if (aiResponse && aiResponse.content) {
          try {
            console.log('📝 Raw AI content:', aiResponse.content);
            
            // Parse AI response
            const aiContent = JSON.parse(aiResponse.content);
            
            // Create PDF-compatible resume data - simplified approach like the working version
            const resumeData = {
              personalInfo,
              summary: aiContent.summary || 'Professional seeking to contribute technical expertise and drive organizational success.',
              skills: aiContent.skills || [], // Keep as strings like the working version
              experience: (aiContent.experience || []).map((exp: any) => ({
                title: exp.title,
                company: exp.company,
                duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
              })),
              education: (aiContent.education || []).map((edu: any) => ({
                degree: edu.degree,
                institution: edu.institution,
                year: edu.year
              })),
              projects: aiContent.projects || []
            };

            console.log('✅ AI resume content parsed successfully');

            // Convert to PDF-compatible format like the working version
            const pdfCompatibleResume = {
              personalInfo: resumeData.personalInfo,
              summary: resumeData.summary,
              skills: (resumeData.skills || []).map((skill: any) => ({
                name: typeof skill === 'string' ? skill : skill.name || skill,
                level: 'intermediate',
                category: 'technical'
              })),
              experience: (resumeData.experience || []).map((exp: any) => {
                // Simple date handling like the working version
                const currentYear = new Date().getFullYear();
                const startYear = currentYear - 1; // Default to last year
                const endYear = exp.duration && exp.duration.includes('Present') ? null : currentYear;
                
                return {
                  title: exp.title || 'Position',
                  company: exp.company || 'Company',
                  location: '',
                  startDate: new Date(startYear, 0, 1),
                  endDate: endYear ? new Date(endYear, 11, 31) : null,
                  description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
                  responsibilities: Array.isArray(exp.description) ? exp.description : [exp.description || ''],
                  current: !endYear
                };
              }),
              education: (resumeData.education || []).map((edu: any) => {
                const year = parseInt(edu.year) || new Date().getFullYear();
                return {
                  degree: edu.degree || 'Degree',
                  institution: edu.institution || 'Institution', 
                  year: edu.year || 'Year',
                  startDate: new Date(year - 4, 0, 1),
                  endDate: new Date(year, 11, 31)
                };
              }),
              projects: (resumeData.projects || []).map((project: any) => ({
                name: project.name || 'Project',
                description: project.description || 'Project description not available.',
                technologies: Array.isArray(project.technologies) ? project.technologies : [],
                startDate: new Date(2023, 0, 1),
                endDate: new Date(2023, 11, 31)
              }))
            };

            console.log('✅ AI resume content generated, creating PDF...');

            // Generate PDF using ResumeBuilderService exactly like the working version
            const htmlContent = ResumeBuilderService.generateResumeHTML(pdfCompatibleResume);
            const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);
            
            if (!pdfBuffer) {
              throw new Error('PDF generation returned null buffer');
            }

            console.log('✅ PDF generated successfully, size:', pdfBuffer.length);

            // Extract job title like the working version
            const jobTitle = 'AI Generated Resume'; // Simplified job title extraction
            
            // Generate unique filename and save the resume exactly like the working version
            const fileName = `${personalInfo.name || 'Resume'}_${jobTitle}_${Date.now()}.pdf`;
            
            const generatedResume = await GeneratedResumeService.createGeneratedResume({
              studentId: studentProfile._id.toString(),
              jobTitle,
              jobDescription,
              resumeData: pdfCompatibleResume,
              fileName,
              pdfBuffer,
              matchScore: 85, // Default like the working version
              aiEnhancementUsed: true,
              matchedSkills: [],
              missingSkills: [],
              suggestions: [],
              generationType: 'ai'
            });

            console.log('✅ Resume saved with ID:', generatedResume.resumeId);

            // Set success result
            result = {
              success: true,
              message: 'Resume generated successfully',
              resumeId: generatedResume.resumeId,
              fileName: fileName,
              pdfBuffer: pdfBuffer,
              downloadUrl: `https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/generated-resume/download/${generatedResume.resumeId}`
            };

          } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);
            console.error('❌ Raw AI content that failed to parse:', aiResponse.content);
            result.message = `AI response parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`;
          }
        } else {
          result.message = 'AI service returned no content';
        }
      } catch (aiError: any) {
        console.error('AI resume generation failed:', aiError);
        result.message = `AI generation failed: ${aiError.message}`;
      }
    }
    
    if (!result.success) {
      console.error('❌ Auto resume generation failed:', result.message);
      
      // Send registration message via WABB webhook for user not found
      if (result.message.includes('Student profile not found')) {
        console.log('� User not found in database - sending detailed notification webhook');
        
        try {
          const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
          const webhookPayload = {
            number: cleanPhone,
            message: `👋 Hi ${email},\n\nWe noticed you tried creating an AI resume but you’re not registered yet.\n\n✨ To continue, please register at 👉 dev.campuspe.com\n\nOnce you sign up, you’ll be able to generate and download your professional resume in minutes 🚀`
          };

          console.log('📡 Sending webhook notification for unregistered user:', {
            webhookUrl,
            targetNumber: cleanPhone,
            userEmail: email,
            userPhone: phone
          });

          const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });

          console.log('✅ Webhook notification sent successfully:', webhookResponse.status);
        } catch (webhookError: any) {
          console.error('❌ Failed to send webhook notification:', webhookError?.message || 'Unknown error');
        }
      } else {
        // For other errors (like PDF generation failures), send generic error message
        console.log('📱 Sending WhatsApp failure notification to:', cleanPhone);
        try {
          await sendWhatsAppWithFallback(
            cleanPhone,
            `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 *Possible solutions:*\n• Complete your profile information\n• Upload your current resume\n• Try again in a few minutes\n\n🔗 Visit: CampusPe.com\n\nNeed help? Reply to this message! 😊`,
            'resume'
          );
          console.log('✅ WhatsApp failure notification sent successfully');
        } catch (whatsappError: any) {
          console.error('❌ Failed to send WhatsApp failure notification:', whatsappError?.message);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'User not found in database. Please register first to generate your AI resume.',
        code: 'USER_NOT_FOUND',
        action: 'REGISTRATION_REQUIRED',
        details: {
          email,
          phone,
          webhookTriggered: true,
          adminNotified: true
        }
      });
    }
    
    console.log('✅ Auto resume generated successfully, sharing via WhatsApp...');
    
    // Automatically share the resume via WhatsApp (no manual input needed)
    try {
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
      
      const shareResponse = await axios.post(`${apiBaseUrl}/api/generated-resume/wabb-send-document`, {
        resumeId: result.resumeId,
        number: cleanPhone
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 second timeout
      });

      const shareResult = shareResponse.data;
      
      if (shareResult.success) {
        console.log('✅ Resume automatically shared via WhatsApp');
        
        // Send final success message
        await sendWhatsAppWithFallback(
          cleanPhone,
          `🎉 *Resume Generated & Shared!*\n\nYour AI-tailored resume is ready! 📄✨\n\n🎯 *Optimized for:*\n• Job-specific requirements\n• Your skills & experience\n• ATS compatibility\n• Professional formatting\n\n📊 *Resume Details:*\n• File: ${result.fileName}\n• Generated: ${new Date().toLocaleDateString()}\n• Size: ${Math.round(result.pdfBuffer!.length / 1024)}KB\n\n💼 Best of luck with your application!\n\n🔗 Update profile: CampusPe.com`,
          'resume'
        );
        
        // Return comprehensive success response
        return res.json({
          success: true,
          message: 'Resume generated and automatically shared via WhatsApp',
          data: {
            resumeId: result.resumeId,
            fileName: result.fileName,
            fileSize: result.pdfBuffer!.length,
            downloadUrl: result.downloadUrl,
            sharedViaWhatsApp: true,
            metadata: {
              generatedAt: new Date().toISOString(),
              email,
              phone: cleanPhone,
              name,
              jobDescriptionLength: jobDescription.length,
              autoShared: true
            }
          }
        });
      } else {
        console.error('❌ WhatsApp sharing failed:', shareResult.message);
        
        // Resume generated but sharing failed - still return success with download link
        await sendWhatsAppWithFallback(
          cleanPhone,
          `✅ *Resume Generated Successfully!*\n\nYour resume is ready, but I couldn't send the file automatically.\n\n📥 *Download Link:*\n${result.downloadUrl || 'Available on CampusPe.com'}\n\n📄 File: ${result.fileName}\n\n💼 Good luck with your application!`
        );
        
        return res.json({
          success: true,
          message: 'Resume generated successfully, but automatic WhatsApp sharing failed',
          data: {
            resumeId: result.resumeId,
            fileName: result.fileName,
            fileSize: result.pdfBuffer!.length,
            downloadUrl: result.downloadUrl,
            sharedViaWhatsApp: false,
            shareError: shareResult.message,
            metadata: {
              generatedAt: new Date().toISOString(),
              email,
              phone: cleanPhone,
              name,
              jobDescriptionLength: jobDescription.length,
              autoShared: false
            }
          }
        });
      }
    } catch (shareError) {
      console.error('❌ WhatsApp sharing error:', shareError);
      
      // Resume generated but sharing failed - still return success
      await sendWhatsAppWithFallback(
        cleanPhone,
        `✅ *Resume Generated!*\n\nYour resume is ready!\n\n📥 *Download:*\n${result.downloadUrl || 'Visit CampusPe.com'}\n\n📄 ${result.fileName}\n\n💼 Good luck!`
      );
      
      return res.json({
        success: true,
        message: 'Resume generated successfully, but WhatsApp sharing encountered an error',
        data: {
          resumeId: result.resumeId,
          fileName: result.fileName,
          fileSize: result.pdfBuffer!.length,
          downloadUrl: result.downloadUrl,
          sharedViaWhatsApp: false,
          shareError: shareError instanceof Error ? shareError.message : 'Unknown sharing error',
          metadata: {
            generatedAt: new Date().toISOString(),
            email,
            phone: cleanPhone,
            name,
            jobDescriptionLength: jobDescription.length,
            autoShared: false
          }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ WABB Auto-Generate & Share Error:', error);
    
    // Try to send error message to WhatsApp if phone is available
    if (req.body.phone) {
      const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Technical Error*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Our team has been notified.\n\n💡 Please try again in a few minutes or visit CampusPe.com\n\nApologies for the inconvenience! 🙏`
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during auto resume generation',
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * WABB endpoint for job description analysis (preview)
 * POST /api/wabb/analyze-job
 */
router.post('/analyze-job', async (req, res) => {
  try {
    const { jobDescription, phone } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }
    
    console.log('🔍 Analyzing job description for WhatsApp user...');
    
    // Analyze job description
    const analysis = await ResumeBuilderService.analyzeJobDescription(jobDescription);
    
    // Send analysis to WhatsApp if phone provided
    if (phone) {
      const cleanPhone = phone.replace(/[^\d]/g, '');
      const analysisMessage = `🔍 *Job Analysis Complete*\n\n📋 *Requirements Found:*\n${analysis.requiredSkills.slice(0, 6).map(skill => `• ${skill}`).join('\n')}\n\n📈 *Level:* ${analysis.jobLevel.toUpperCase()}\n🏢 *Industry:* ${analysis.industry}\n\n💡 *Ready to create your tailored resume?*\nSend me your email and I'll generate a customized resume for this job!`;
      
      await sendWhatsAppMessage(cleanPhone, analysisMessage);
    }
    
    res.json({
      success: true,
      analysis,
      message: 'Job description analyzed successfully'
    });
    
  } catch (error) {
    console.error('❌ Job analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze job description'
    });
  }
});

/**
 * Test endpoint for WABB integration
 * GET /api/wabb/test
 */
router.get('/test', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (phone) {
      const cleanPhone = (phone as string).replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `🧪 *WABB Integration Test*\n\nHello! This is a test message from CampusPe's resume builder service.\n\n✅ WhatsApp integration is working!\n\n🎯 *Available Commands:*\n• Send job description + email for tailored resume\n• Get job requirement analysis\n• Professional resume generation\n\nTest completed successfully! 🚀`
      );
    }
    
    res.json({
      success: true,
      message: 'WABB integration test completed',
      timestamp: new Date().toISOString(),
      phone: phone ? (phone as string).replace(/[^\d]/g, '') : null
    });
    
  } catch (error) {
    console.error('❌ WABB test error:', error);
    res.status(500).json({
      success: false,
      message: 'WABB test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * WhatsApp webhook for handling incoming messages
 * POST /api/wabb/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📨 WABB Webhook received:', req.body);
    
    const { phone, message, name, type, timestamp } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone and message are required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Import the conversational flow handler
    const { WhatsAppResumeFlow } = await import('../services/whatsapp-resume-flow');
    
    // Handle the incoming message with our enhanced conversational flow
    await WhatsAppResumeFlow.handleIncomingMessage(cleanPhone, message, name);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ WABB webhook error:', error);
    
    // Fallback error message to user
    if (req.body.phone) {
      const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Technical Error*\n\nSorry! I encountered an error processing your message.\n\n� Please try again in a moment or contact support.\n\n💡 Type "help" for assistance.`
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

/**
 * Test WhatsApp notification endpoint
 * POST /api/wabb/test-whatsapp
 */
router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const testMessage = message || '🧪 Test WhatsApp notification from CampusPe API';
    
    console.log('🧪 Testing WhatsApp notification:', { phone, message: testMessage });
    
    const result = await sendWhatsAppMessage(phone, testMessage, 'resume');
    
    res.json({
      success: true,
      message: 'WhatsApp test completed',
      result
    });
    
  } catch (error: any) {
    console.error('❌ WhatsApp test failed:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'WhatsApp test failed'
    });
  }
});

/**
 * Health check for WABB integration
 * GET /api/wabb/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'WABB Resume Service is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/wabb/create-resume',
      'POST /api/wabb/generate-and-share',
      'GET /api/wabb/debug-user/:email',
      'POST /api/wabb/debug-generate-and-share',
      'POST /api/wabb/webhook',
      'GET /api/wabb/health'
    ]
  });
});

/**
 * Debug version of generate-and-share endpoint
 */
router.post('/debug-generate-and-share', async (req, res) => {
  try {
    console.log('🚀 DEBUG: WABB Auto-Generate & Share Request:', req.body);
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 DEBUG: Auto-processing resume request for ${email} (${cleanPhone})`);
    
    // Step 1: Check if user exists
    const { Student } = require('../models/Student');
    const student = await Student.findOne({ email: email }).populate('userId');
    
    if (!student) {
      console.log('❌ DEBUG: Student not found');
      return res.status(400).json({
        success: false,
        message: 'Student profile not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log('✅ DEBUG: Student found:', student.firstName, student.lastName);
    
    // Step 2: Test job analysis
    try {
      console.log('🔍 DEBUG: Starting job analysis...');
      const ResumeBuilderService = require('../services/resume-builder').default;
      const jobAnalysis = await ResumeBuilderService.analyzeJobDescription(jobDescription);
      console.log('✅ DEBUG: Job analysis completed:', {
        requiredSkills: jobAnalysis.requiredSkills?.length || 0,
        preferredSkills: jobAnalysis.preferredSkills?.length || 0,
        jobLevel: jobAnalysis.jobLevel
      });
    } catch (analysisError: any) {
      console.error('❌ DEBUG: Job analysis failed:', analysisError?.message);
      return res.status(500).json({
        success: false,
        message: 'Job analysis failed: ' + analysisError?.message,
        code: 'ANALYSIS_FAILED'
      });
    }
    
    // Step 3: Test student data retrieval
    try {
      console.log('📋 DEBUG: Getting student data...');
      const ResumeBuilderService = require('../services/resume-builder').default;
      const studentData = await ResumeBuilderService.getStudentData(email, cleanPhone);
      
      if (!studentData) {
        console.log('❌ DEBUG: Student data retrieval failed');
        return res.status(400).json({
          success: false,
          message: 'Failed to retrieve student data',
          code: 'DATA_RETRIEVAL_FAILED'
        });
      }
      
      console.log('✅ DEBUG: Student data retrieved:', {
        name: `${studentData.personalInfo.firstName} ${studentData.personalInfo.lastName}`,
        skillsCount: studentData.skills?.length || 0,
        experienceCount: studentData.experience?.length || 0
      });
    } catch (dataError: any) {
      console.error('❌ DEBUG: Student data retrieval failed:', dataError?.message);
      return res.status(500).json({
        success: false,
        message: 'Student data retrieval failed: ' + dataError?.message,
        code: 'DATA_FAILED'
      });
    }
    
    // Step 4: Test full resume generation
    try {
      console.log('🎯 DEBUG: Starting full resume generation...');
      const ResumeBuilderService = require('../services/resume-builder').default;
      const result = await ResumeBuilderService.createTailoredResume(
        email,
        cleanPhone,
        jobDescription
      );
      
      console.log('📊 DEBUG: Resume generation result:', {
        success: result.success,
        message: result.message,
        hasBuffer: !!result.pdfBuffer,
        fileName: result.fileName
      });
      
      return res.json({
        success: true,
        message: 'Debug completed successfully',
        debugResult: {
          userExists: true,
          jobAnalysisWorking: true,
          studentDataWorking: true,
          resumeGeneration: result
        }
      });
      
    } catch (resumeError: any) {
      console.error('❌ DEBUG: Resume generation failed:', resumeError?.message);
      return res.status(500).json({
        success: false,
        message: 'Resume generation failed: ' + resumeError?.message,
        code: 'RESUME_FAILED'
      });
    }
    
  } catch (error: any) {
    console.error('❌ DEBUG: Overall error:', error?.message);
    res.status(500).json({
      success: false,
      message: 'Debug failed: ' + error?.message,
      code: 'DEBUG_FAILED'
    });
  }
});

// Mount the complete resume generation router
// router.use(wabbCompleteRouter);

export default router;
