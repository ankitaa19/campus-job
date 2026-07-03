import express from 'express';
import auth from '../middleware/auth';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { GeneratedResume } from '../models/GeneratedResume';
import aiResumeMatchingService from '../services/ai-resume-matching';
import ResumeBuilderService from '../services/resume-builder';
import GeneratedResumeService from '../services/generated-resume.service';
import ImprovedBunnyStorageService from '../services/bunny-storage-improved.service';
import { ResumeUrlUtils } from '../utils/resume-url.utils';
import axios from 'axios';

// Global type declaration for temporary resume storage
declare global {
  var tempResumeStore: Map<string, any> | undefined;
}

const router = express.Router();

// Debug endpoint to test database saving (no auth required)
router.post('/debug-save', async (req, res) => {
  try {
    console.log('=== DEBUG SAVE ENDPOINT ===');
    
    // Find an existing student
    const student = await Student.findOne({});
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student found in database'
      });
    }

    console.log('Found student:', student._id);

    const resumeHistoryItem = {
      id: new Date().getTime().toString(),
      jobDescription: 'Debug test job description',
      jobTitle: 'Debug Test Position',
      resumeData: {
        contact: {
          email: student.email,
          phone: student.phoneNumber || '9999999999',
          name: `${student.firstName} ${student.lastName}`
        },
        skills: ['Debug', 'Testing'],
        experience: []
      },
      pdfUrl: 'https://example.com/debug-resume.pdf',
      generatedAt: new Date(),
      matchScore: 99
    };

    console.log('Saving resume to history for student:', student._id);

    // Initialize aiResumeHistory if it doesn't exist
    if (!student.aiResumeHistory) {
      student.aiResumeHistory = [];
    }

    // Add new resume to history
    student.aiResumeHistory.push(resumeHistoryItem);

    // Keep only last 3 resumes
    if (student.aiResumeHistory.length > 3) {
      student.aiResumeHistory = student.aiResumeHistory.slice(-3);
    }

    // Save the document
    await student.save();

    console.log('✅ Resume saved successfully. Current history length:', student.aiResumeHistory.length);

    res.json({
      success: true,
      message: 'Debug save completed',
      studentId: student._id,
      historyLength: student.aiResumeHistory.length,
      savedItem: resumeHistoryItem
    });

  } catch (error: any) {
    console.error('❌ Debug save error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug save failed',
      error: error.message
    });
  }
});

// AI Resume Generation Endpoint
router.post('/generate-ai', auth, async (req, res) => {
  try {
    const { jobDescription, templateId, includeProfileData = true } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!jobDescription || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Job description and template ID are required'
      });
    }

    // Find the student profile - required for AI resume generation
    let studentProfile = null;
    try {
      studentProfile = await Student.findOne({ userId }).lean();
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found. Please complete your profile first.'
        });
      }
    } catch (error) {
      console.log('Could not fetch student profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student profile'
      });
    }

    // Get email and phone from student profile with validation
    const email = studentProfile.email || '';
    const phone = studentProfile.phoneNumber || '';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required in student profile'
      });
    }

    // Create resume data using existing profile and job analysis
    const resumeData = await generateAIResume({
      email,
      phone,
      jobDescription,
      studentProfile
    });

    let historySaved = false;
    let historyError = null;
    let generatedResumeId = null;
    let downloadUrl: string | null = null;
    let cloudUrl: string | null = null;

    // Store the generated resume in both GeneratedResume collection AND student history
    if (studentProfile) {
      try {
        console.log('=== SAVING RESUME TO DATABASE ===');
        console.log('Student ID:', studentProfile._id);

        generatedResumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Extract job title from description
        const jobTitle = extractJobTitleFromDescription(jobDescription);

        // Generate PDF and upload to Bunny.net CDN
        console.log('📄 Generating PDF for CDN upload...');
        
        // Convert to PDF-compatible format
        const pdfCompatibleResume = {
          personalInfo: resumeData.personalInfo,
          summary: resumeData.summary,
          skills: (resumeData.skills || []).map((skill: any) => ({
            name: typeof skill === 'string' ? skill : skill.name,
            level: 'intermediate',
            category: 'technical'
          })),
          experience: (resumeData.experience || []).map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            location: exp.location || 'Remote',
            startDate: new Date(),
            endDate: exp.duration?.includes('Present') ? undefined : new Date(),
            description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
            isCurrentJob: exp.duration?.includes('Present') || false
          })),
          education: (resumeData.education || []).map((edu: any) => ({
            degree: edu.degree || 'Degree',
            field: 'Field of Study',
            institution: edu.institution || 'Institution',
            startDate: new Date(),
            endDate: edu.year === 'In Progress' ? undefined : new Date(),
            isCompleted: edu.year !== 'In Progress'
          })),
          projects: resumeData.projects || []
        };

        // Generate PDF buffer
        const pdfBuffer = await ResumeBuilderService.generateStructuredPDF(pdfCompatibleResume);
        const fileName = `${jobTitle || 'Resume'}_${generatedResumeId}.pdf`;

        // Upload to BunnyCDN with retry logic
        console.log('☁️ Uploading PDF to BunnyCDN...');
        let fileSize = pdfBuffer.length;

        try {
          const bunnyUpload = await ImprovedBunnyStorageService.uploadPDFWithRetry(pdfBuffer, fileName, generatedResumeId, 3);
          
          if (bunnyUpload.success && bunnyUpload.url) {
            cloudUrl = bunnyUpload.url;
            downloadUrl = cloudUrl;
            console.log('✅ PDF uploaded to BunnyCDN:', cloudUrl);
          } else {
            console.log('⚠️ BunnyCDN upload failed, using fallback URL:', bunnyUpload.error);
            downloadUrl = generateDownloadUrl(generatedResumeId, jobTitle || 'Resume');
          }
        } catch (bunnyError) {
          console.log('⚠️ BunnyCDN error, using fallback URL:', bunnyError);
          downloadUrl = generateDownloadUrl(generatedResumeId, jobTitle || 'Resume');
        }

        // 1. Save to GeneratedResume collection (campuspe.generatedresumes)
        let transformedResumeData: any = null;
        try {
          console.log('🔄 STARTING GeneratedResume save process...');
          console.log('📊 Raw resumeData before transformation:', JSON.stringify(resumeData, null, 2));
          
          // Transform resumeData to match schema structure
          transformedResumeData = transformResumeDataForSchema(resumeData);
          
          console.log('📊 Transformed resumeData after transformation:', JSON.stringify(transformedResumeData, null, 2));
          
          // DEBUG: Let's check the exact structure being passed to mongoose
          console.log('🔍 DEBUG - Experience structure check:');
          if (transformedResumeData.experience && transformedResumeData.experience.length > 0) {
            const firstExp = transformedResumeData.experience[0];
            console.log('  - Has title field:', 'title' in firstExp);
            console.log('  - Has position field:', 'position' in firstExp);
            console.log('  - Title value:', firstExp.title);
            console.log('  - Position value:', firstExp.position);
            console.log('  - Description type:', typeof firstExp.description);
            console.log('  - Start date type:', typeof firstExp.startDate);
          }
          
          const generatedResume = new GeneratedResume({
            studentId: studentProfile._id,
            resumeId: generatedResumeId,
            templateId: templateId, // Store the selected template ID
            jobTitle: jobTitle || 'AI Generated Resume',
            jobDescription,
            jobDescriptionHash: require('crypto').createHash('md5').update(jobDescription).digest('hex'),
            resumeData: transformedResumeData,
            
            // File information with actual data
            fileName: fileName,
            filePath: cloudUrl, // Store CDN URL as filePath
            cloudUrl: cloudUrl, // Store CDN URL
            fileSize: fileSize, // Actual file size
            mimeType: 'application/pdf',
            
            // AI Analysis
            matchScore: 85,
            aiEnhancementUsed: true,
            matchedSkills: resumeData.skills?.map((skill: any) => typeof skill === 'string' ? skill : skill.name) || [],
            missingSkills: [],
            suggestions: [],
            
            // Status
            status: 'completed', // Mark as completed since we're providing the resume data
            generationType: 'ai',
            downloadCount: 0,
            whatsappSharedCount: 0,
            
            // Timestamps
            generatedAt: new Date(),
            whatsappSharedAt: [],
            whatsappRecipients: []
          });

          await generatedResume.save();
          console.log('✅ SUCCESS! Resume saved to GeneratedResume collection with ID:', generatedResume._id);
          console.log('📊 Resume details:', {
            resumeId: generatedResume.resumeId,
            studentId: generatedResume.studentId,
            status: generatedResume.status,
            fileName: generatedResume.fileName,
            transformedDataValid: !!transformedResumeData
          });
        } catch (dbError) {
          console.error('❌ CRITICAL ERROR saving to GeneratedResume collection:', dbError);
          console.error('❌ Error type:', dbError instanceof Error ? dbError.constructor.name : typeof dbError);
          console.error('❌ Error message:', dbError instanceof Error ? dbError.message : 'Unknown error');
          console.error('❌ Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');
          if (dbError instanceof Error && dbError.message.includes('validation')) {
            console.error('❌ VALIDATION ERROR - check required fields and data structure');
            console.error('❌ Transformed data that failed validation:', JSON.stringify(transformedResumeData, null, 2));
          }
          // Continue execution to save to Student.aiResumeHistory as fallback
        }

        // 2. Also save to Student.aiResumeHistory for frontend compatibility
        const student = await Student.findById(studentProfile._id);
        if (student) {
          // Initialize aiResumeHistory if it doesn't exist
          if (!student.aiResumeHistory) {
            student.aiResumeHistory = [];
          }

          // Create the history item in the format expected by frontend
          const historyItem = {
            id: generatedResumeId,
            jobDescription,
            jobTitle: jobTitle || 'AI Generated Resume',
            resumeData: resumeData,
            pdfUrl: downloadUrl, // Use actual CDN URL
            cloudUrl: cloudUrl, // Store CDN URL
            generatedAt: new Date(),
            matchScore: 85
          };

          // Add to beginning of array
          student.aiResumeHistory.unshift(historyItem);

          // Keep only last 10 resumes
          if (student.aiResumeHistory.length > 10) {
            student.aiResumeHistory = student.aiResumeHistory.slice(0, 10);
          }

          await student.save();
          console.log('✅ Resume saved to Student.aiResumeHistory');
          
          historySaved = true;
        }

      } catch (error) {
        console.error('❌ ERROR saving resume to student history:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        historyError = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      console.log('⚠️ No student profile found - resume history not saved');
      historyError = 'No student profile found';
    }

    res.json({
      success: true,
      message: 'Resume generated successfully using AI',
      data: {
        resume: resumeData,
        resumeId: generatedResumeId,
        downloadUrl: downloadUrl, // Return actual CDN URL
        cloudUrl: cloudUrl // Include CDN URL in response
      },
      historySaved,
      historyError
    });

  } catch (error: any) {
    console.error('Error generating AI resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get Resume History Endpoint - Enhanced with GeneratedResume collection
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('🔍 Fetching resume history for user:', userId);

    // Find student profile
    const student = await Student.findOne({ userId }, 'aiResumeHistory').lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    console.log('👤 Student found:', student._id);

    // Get resumes from both sources
    // 1. From Student.aiResumeHistory (legacy/frontend compatibility)
    const studentHistory = (student.aiResumeHistory || [])
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, 10);

    console.log('📚 Student.aiResumeHistory count:', studentHistory.length);

    // 2. From GeneratedResume collection (primary storage)
    const generatedResumes = await GeneratedResume.find({ 
      studentId: student._id 
    })
    .sort({ generatedAt: -1 })
    .limit(10)
    .lean();

    console.log('📄 GeneratedResume collection count:', generatedResumes.length);

    // Log some details for debugging
    if (generatedResumes.length > 0) {
      console.log('📊 Generated resumes details:');
      generatedResumes.forEach((resume, index) => {
        console.log(`  ${index + 1}. ID: ${resume.resumeId}, Status: ${resume.status}, Job: ${resume.jobTitle}`);
      });
    }

    if (studentHistory.length > 0) {
      console.log('📋 Student history details:');
      studentHistory.forEach((resume, index) => {
        console.log(`  ${index + 1}. ID: ${resume.id}, Job: ${resume.jobTitle}`);
      });
    }

    res.json({
      success: true,
      data: {
        resumeHistory: studentHistory, // For frontend compatibility
        generatedResumes: generatedResumes, // New collection data
        sources: {
          studentCollection: studentHistory.length,
          generatedResumeCollection: generatedResumes.length
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching resume history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug Database Route - Test GeneratedResume collection
router.get('/debug/database', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('🔍 DEBUG: Testing database collections...');
    
    // Find student
    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    console.log('👤 Student found:', student._id);
    
    // Test GeneratedResume collection
    const totalResumes = await GeneratedResume.countDocuments({ studentId: student._id });
    const allResumes = await GeneratedResume.find({ studentId: student._id }).lean();
    
    console.log('📊 Total resumes in GeneratedResume collection:', totalResumes);
    
    // Test if we can create a test document
    const testResume = new GeneratedResume({
      studentId: student._id,
      resumeId: `test_${Date.now()}`,
      jobDescription: 'Test job description for database connectivity',
      jobDescriptionHash: 'test_hash_123',
      resumeData: {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '1234567890'
        },
        summary: 'Test summary',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: []
      },
      fileName: 'test_resume.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'completed',
      generationType: 'ai',
      downloadCount: 0,
      whatsappSharedCount: 0,
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
      aiEnhancementUsed: true
    });
    
    const savedTestResume = await testResume.save();
    console.log('✅ Test resume created successfully:', savedTestResume._id);
    
    // Clean up test document
    await GeneratedResume.deleteOne({ _id: savedTestResume._id });
    console.log('🗑️ Test resume cleaned up');
    
    res.json({
      success: true,
      data: {
        studentId: student._id,
        totalResumesInCollection: totalResumes,
        collectionWorking: true,
        resumeDetails: allResumes.map(r => ({
          id: r.resumeId,
          status: r.status,
          jobTitle: r.jobTitle,
          createdAt: r.createdAt
        }))
      }
    });
    
  } catch (error: any) {
    console.error('❌ Database debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Database debug failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Change Template Endpoint - Apply new template to existing resume without AI regeneration
router.post('/change-template', auth, async (req, res) => {
  try {
    const { resumeId, newTemplateId } = req.body;
    const userId = req.user._id;

    if (!resumeId || !newTemplateId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and new template ID are required'
      });
    }

    console.log('🎨 Changing template for resume:', resumeId);
    console.log('📋 New template:', newTemplateId);

    // Find the existing resume in GeneratedResume collection
    const existingResume = await GeneratedResume.findOne({ resumeId });
    
    if (!existingResume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Verify ownership
    const student = await Student.findOne({ userId });
    if (!student || existingResume.studentId.toString() !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this resume'
      });
    }

    console.log('✅ Resume found, applying new template...');

    // Generate new resume ID
    const newResumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare PDF-compatible resume data from existing resume
    const pdfCompatibleResume = {
      personalInfo: existingResume.resumeData.personalInfo,
      summary: existingResume.resumeData.summary || '',
      skills: (existingResume.resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: skill.level || 'intermediate',
        category: skill.category || 'technical'
      })),
      experience: (existingResume.resumeData.experience || []).map((exp: any) => ({
        title: exp.title || exp.position,
        company: exp.company,
        location: exp.location || 'Remote',
        startDate: exp.startDate || new Date(),
        endDate: exp.endDate,
        description: exp.description || '',
        isCurrentJob: exp.isCurrentJob || false
      })),
      education: (existingResume.resumeData.education || []).map((edu: any) => ({
        degree: edu.degree,
        field: edu.field || 'Field of Study',
        institution: edu.institution,
        startDate: edu.startDate || new Date(),
        endDate: edu.endDate,
        isCompleted: edu.isCompleted !== false
      })),
      projects: existingResume.resumeData.projects || [],
      certifications: existingResume.resumeData.certifications || []
    };

    // Generate new PDF with new template
    console.log('📄 Generating PDF with new template...');
    const pdfBuffer = await ResumeBuilderService.generateStructuredPDF(pdfCompatibleResume);
    const fileName = `${existingResume.jobTitle || 'Resume'}_${newTemplateId}_${newResumeId}.pdf`;
    const fileSize = pdfBuffer.length;

    // Upload to BunnyCDN
    let cloudUrl: string | null = null;
    try {
      const bunnyUpload = await ImprovedBunnyStorageService.uploadPDFWithRetry(pdfBuffer, fileName, newResumeId, 3);
      
      if (bunnyUpload.success && bunnyUpload.url) {
        cloudUrl = bunnyUpload.url;
        console.log('✅ PDF uploaded to BunnyCDN:', cloudUrl);
      }
    } catch (bunnyError) {
      console.log('⚠️ BunnyCDN error:', bunnyError);
    }

    // Create new GeneratedResume document with new template
    const newResume = new GeneratedResume({
      studentId: student._id,
      resumeId: newResumeId,
      templateId: newTemplateId, // New template ID
      jobTitle: existingResume.jobTitle,
      jobDescription: existingResume.jobDescription,
      jobDescriptionHash: existingResume.jobDescriptionHash,
      resumeData: existingResume.resumeData, // Same content
      
      // File information
      fileName: fileName,
      filePath: cloudUrl,
      cloudUrl: cloudUrl,
      fileSize: fileSize,
      mimeType: 'application/pdf',
      pdfBase64: pdfBuffer.toString('base64'),
      
      // Preserve AI analysis
      matchScore: existingResume.matchScore,
      aiEnhancementUsed: existingResume.aiEnhancementUsed,
      matchedSkills: existingResume.matchedSkills,
      missingSkills: existingResume.missingSkills,
      suggestions: existingResume.suggestions,
      
      // Status
      status: 'completed',
      generationType: 'ai',
      downloadCount: 0,
      whatsappSharedCount: 0,
      
      // Timestamps
      generatedAt: new Date(),
      whatsappSharedAt: [],
      whatsappRecipients: []
    });

    await newResume.save();
    console.log('✅ New resume saved with template:', newTemplateId);

    res.json({
      success: true,
      message: 'Template changed successfully',
      data: {
        resumeId: newResumeId,
        templateId: newTemplateId,
        downloadUrl: cloudUrl
      }
    });

  } catch (error: any) {
    console.error('❌ Error changing template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Share Resume on WhatsApp Endpoint
router.post('/share-whatsapp', auth, async (req, res) => {
  try {
    const { resumeId, phoneNumber } = req.body;
    const userId = req.user._id;

    if (!resumeId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and phone number are required'
      });
    }

    // Find the student and specific resume
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Generate PDF URL for this resume
    const pdfUrl = await generateResumePdfUrl(resume.resumeData, resumeId);
    
    if (!pdfUrl) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF URL'
      });
    }
    
    // Send to WhatsApp via Wabb webhook
    const whatsappResponse = await sendResumeToWhatsApp(phoneNumber, pdfUrl, resume.jobTitle || 'Resume');

    // Update the resume with PDF URL if successful
    if (whatsappResponse.success && pdfUrl) {
      await Student.findOneAndUpdate(
        { userId, 'aiResumeHistory.id': resumeId },
        { $set: { 'aiResumeHistory.$.pdfUrl': pdfUrl } }
      );
    }

    res.json({
      success: true,
      message: 'Resume shared successfully on WhatsApp',
      data: {
        pdfUrl,
        whatsappResponse
      }
    });

  } catch (error: any) {
    console.error('Error sharing resume on WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share resume on WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send Resume to User's Own WhatsApp - New Endpoint
router.post('/send-to-my-whatsapp', auth, async (req, res) => {
  try {
    const { resumeId } = req.body;
    const userId = req.user._id;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required'
      });
    }

    // Find the student profile to get their phone number
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get phone number from student profile
    let phoneNumber = student.phoneNumber;
    
    // If no phone number in student profile, try to get from User model
    if (!phoneNumber) {
      const user = await import('../models/User').then(mod => mod.User.findById(userId).lean());
      phoneNumber = user?.phone;
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in your profile. Please update your profile with a valid phone number.'
      });
    }

    // Clean and validate phone number - ensure it's 10 digits
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please update your profile with a valid 10-digit phone number.'
      });
    }

    // Get the last 10 digits if phone number is longer than 10 digits
    const tenDigitPhone = cleanPhone.slice(-10);

    // Find the specific resume
    const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Use the existing WABB resume service to send the resume
    const { sendWhatsAppMessage } = require('../services/whatsapp');
    
    try {
      // Generate PDF URL for this resume
      const pdfUrl = await generateResumePdfUrl(resume.resumeData, resumeId);
      
      if (pdfUrl) {
        // Send resume document via WABB webhook
        const whatsappResponse = await sendResumeToWhatsApp(tenDigitPhone, pdfUrl, resume.jobTitle || 'Resume');
        
        if (whatsappResponse.success) {
          // Update the resume with PDF URL
          await Student.findOneAndUpdate(
            { userId, 'aiResumeHistory.id': resumeId },
            { $set: { 'aiResumeHistory.$.pdfUrl': pdfUrl } }
          );

          return res.json({
            success: true,
            message: 'Resume sent to your WhatsApp successfully!',
            data: {
              phoneNumber: tenDigitPhone,
              pdfUrl,
              fileName: `${student.firstName}_${student.lastName}_Resume_${Date.now()}.pdf`,
              whatsappResponse
            }
          });
        } else {
          // Fallback to text message with download link
          const message = `🎉 *Your AI-Generated Resume is Ready!*\n\n📄 *Job Title:* ${resume.jobTitle || 'Professional Resume'}\n📅 *Generated:* ${new Date().toLocaleDateString()}\n\n📥 *Download Link:* ${pdfUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
          
          await sendWhatsAppMessage(tenDigitPhone, message);
          
          return res.json({
            success: true,
            message: 'Resume download link sent to your WhatsApp!',
            data: {
              phoneNumber: tenDigitPhone,
              pdfUrl,
              sentAsLink: true
            }
          });
        }
      } else {
        // Send simple message if PDF generation fails
        const message = `🎉 *Your AI-Generated Resume is Ready!*\n\n📄 *Job Title:* ${resume.jobTitle || 'Professional Resume'}\n📅 *Generated:* ${new Date().toLocaleDateString()}\n\n📥 *Download:* Please visit your CampusPe dashboard to download your resume.\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
        
        await sendWhatsAppMessage(tenDigitPhone, message);
        
        return res.json({
          success: true,
          message: 'Resume notification sent to your WhatsApp!',
          data: {
            phoneNumber: tenDigitPhone,
            sentAsNotification: true
          }
        });
      }
    } catch (whatsappError: any) {
      console.error('WhatsApp sending failed:', whatsappError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send resume to WhatsApp. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? whatsappError?.message : undefined
      });
    }

  } catch (error: any) {
    console.error('Error sending resume to WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send resume to WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PDF Download Endpoint
router.post('/download-pdf', auth, async (req, res) => {
  try {
    const { resume, format = 'professional' } = req.body;

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: 'Resume data is required'
      });
    }

    console.log('📄 Processing PDF download request...');
    console.log('📊 Resume data keys:', Object.keys(resume));

    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: {
        firstName: resume.personalInfo?.firstName || resume.personalInfo?.name?.split(' ')[0] || 'Unknown',
        lastName: resume.personalInfo?.lastName || resume.personalInfo?.name?.split(' ').slice(1).join(' ') || 'User',
        email: resume.personalInfo?.email || 'user@example.com',
        phone: resume.personalInfo?.phone || 'N/A',
        location: resume.personalInfo?.location || '',
        linkedin: resume.personalInfo?.linkedin || '',
        github: resume.personalInfo?.github || ''
      },
      summary: resume.summary || 'Professional summary not available.',
      skills: (resume.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : (skill.name || 'Skill'),
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resume.experience || []).map((exp: any) => {
        // Parse duration to extract dates
        const duration = exp.duration || '';
        const isCurrentJob = duration.includes('Present') || duration.includes('Current');
        const currentYear = new Date().getFullYear();
        
        // Try to extract years from duration string
        const yearMatches = duration.match(/\d{4}/g);
        const startYear = yearMatches && yearMatches[0] ? parseInt(yearMatches[0]) : currentYear - 1;
        const endYear = isCurrentJob ? currentYear : (yearMatches && yearMatches[1] ? parseInt(yearMatches[1]) : currentYear);
        
        return {
          title: exp.title || 'Position',
          company: exp.company || 'Company',
          location: exp.location || '',
          startDate: new Date(startYear, 0, 1),
          endDate: isCurrentJob ? undefined : new Date(endYear, 11, 31),
          description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || 'Description not available.'),
          isCurrentJob: isCurrentJob
        };
      }),
      education: (resume.education || []).map((edu: any) => {
        // Parse degree to separate degree and field
        const degreeText = edu.degree || 'Degree';
        const degreeParts = degreeText.includes(' in ') ? degreeText.split(' in ') : [degreeText, 'Field'];
        const degree = degreeParts[0] || 'Degree';
        const field = degreeParts[1] || edu.field || 'Field of Study';
        
        // Parse year to determine completion status
        const year = edu.year || 'Unknown';
        const isCompleted = year !== 'In Progress' && year !== 'Current' && year !== 'Ongoing';
        const currentYear = new Date().getFullYear();
        const gradYear = year.match(/\d{4}/) ? parseInt(year.match(/\d{4}/)[0]) : currentYear;
        
        return {
          degree: degree,
          field: field,
          institution: edu.institution || 'Institution',
          startDate: new Date(gradYear - 4, 8, 1), // Assume 4-year program starting in September
          endDate: isCompleted ? new Date(gradYear, 4, 31) : undefined, // May graduation for completed
          isCompleted: isCompleted
        };
      }),
      projects: (resume.projects || []).map((project: any) => ({
        name: project.name || 'Project',
        description: project.description || 'Project description not available.',
        technologies: Array.isArray(project.technologies) ? project.technologies : []
      }))
    };

    console.log('✅ Resume data formatted for PDF generation');

    const resumeBuilder = ResumeBuilderService;
    
    // FIXED: Use structured PDF generation directly with the formatted data
    // This bypasses the HTML parsing issue and uses the actual user data
    console.log('🔄 Starting DIRECT PDF generation with structured data...');
    const pdfBuffer = await resumeBuilder.generateStructuredPDF(pdfCompatibleResume);
    console.log('✅ PDF generated successfully with actual user data');

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AI_Resume_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('❌ Error generating PDF:', error);
    
    // Provide detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('📊 Error details:', errorDetails);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF. Please try again or contact support if the issue persists.',
      error: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
});

// Public PDF Download Endpoint (for WhatsApp sharing)
router.get('/download-pdf-public/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    console.log('🔗 Public download request for resume:', resumeId);
    
    let resume = null;
    
    // First, check temporary store for no-auth resumes
    if (global.tempResumeStore && global.tempResumeStore.has(resumeId)) {
      console.log('📄 Found resume in temporary store (no-auth)');
      resume = global.tempResumeStore.get(resumeId);
    } else {
      // Find resume in database for authenticated resumes
      console.log('📚 Searching for resume in database...');
      const student = await Student.findOne({ 
        'aiResumeHistory.id': resumeId 
      }, 'aiResumeHistory').lean();
      
      if (student) {
        resume = student.aiResumeHistory?.find(r => r.id === resumeId);
        console.log('📄 Found resume in database');
      }
    }
    
    if (!resume) {
      console.log('❌ Resume not found in both temporary store and database');
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // If we have a BunnyCDN URL, redirect to it
    if (resume.cloudUrl) {
      console.log('🔗 Redirecting to BunnyCDN URL:', resume.cloudUrl);
      return res.redirect(302, resume.cloudUrl);
    }

    // Fallback: Generate PDF on-demand if no cloud URL is available
    console.log('⚠️ No cloud URL found, generating PDF on-demand...');

    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resume.resumeData.personalInfo,
      summary: resume.resumeData.summary,
      skills: (resume.resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resume.resumeData.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: new Date(),
        endDate: exp.duration?.includes('Present') ? undefined : new Date(),
        description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
        isCurrentJob: exp.duration?.includes('Present') || false
      })),
      education: (resume.resumeData.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: 'Field',
        institution: edu.institution || 'Institution',
        startDate: new Date(),
        endDate: edu.year === 'In Progress' ? undefined : new Date(),
        isCompleted: edu.year !== 'In Progress'
      })),
      projects: resume.resumeData.projects || []
    };

    const resumeBuilder = ResumeBuilderService;
    
    // FIXED: Use structured PDF generation directly with the formatted data
    const pdfBuffer = await resumeBuilder.generateStructuredPDF(pdfCompatibleResume);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resume.jobTitle || 'Resume'}_${resumeId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating public PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to generate AI resume using Claude AI
async function generateAIResume({
  email,
  phone,
  jobDescription,
  studentProfile
}: {
  email: string;
  phone: string;
  jobDescription: string;
  studentProfile: any;
}) {
  // Extract personal information with proper structure for PDF generation
  const fullName = studentProfile ? 
    `${studentProfile.firstName} ${studentProfile.lastName}`.trim() :
    'Your Name';
  
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Your';
  const lastName = nameParts.slice(1).join(' ') || 'Name';
  
  const personalInfo = {
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    email,
    phone,
    location: studentProfile?.address || undefined,
    linkedin: studentProfile?.linkedinUrl || undefined,
    github: studentProfile?.githubUrl || undefined
  };

  try {
    // Use Claude AI to generate job-focused resume content
    const aiService = aiResumeMatchingService;
    
    // Prepare user profile data for AI analysis
    const userProfileText = `
Name: ${personalInfo.name}
Contact: ${email}, ${phone}
${studentProfile?.address ? `Location: ${studentProfile.address}` : ''}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp: any) => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${Array.isArray(exp.description) ? exp.description.join(', ') : (exp.description || 'No description')}`
).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu: any) => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`
).join('\n')}

SKILLS:
${[
  ...(studentProfile?.skills?.map((skill: any) => skill.name) || []),
  ...(studentProfile?.resumeAnalysis?.skills || [])
].join(', ')}

PROJECTS:
${(studentProfile?.projects || []).map((project: any) => 
  `- ${project.name}: ${project.description || 'Project description'}`
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
    const aiResponse = await aiService.callClaudeAPI(aiPrompt);
    
    if (aiResponse && aiResponse.content) {
      try {
        // Parse AI response
        const aiContent = JSON.parse(aiResponse.content);
        
        // Create frontend-compatible data
        const frontendData = {
          personalInfo,
          summary: aiContent.summary || 'Professional seeking to contribute technical expertise and drive organizational success.',
          skills: aiContent.skills || [], // Keep as strings for frontend
          experience: (aiContent.experience || []).map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
            description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
          })),
          education: (aiContent.education || []).map((edu: any) => ({
            degree: edu.degree || 'Degree',
            institution: edu.institution || 'Institution',
            year: edu.year || 'Year'
          })),
          projects: aiContent.projects || []
        };

        return frontendData;
      } catch (parseError) {
        console.log('Failed to parse AI response, using fallback');
      }
    }
  } catch (aiError: any) {
    console.log('AI generation failed, using enhanced fallback:', aiError?.message || 'Unknown error');
  }

  // Enhanced fallback logic when AI fails
  return generateEnhancedFallbackResume({
    personalInfo,
    jobDescription,
    studentProfile
  });
}

// Enhanced fallback resume generation
function generateEnhancedFallbackResume({
  personalInfo,
  jobDescription,
  studentProfile
}: {
  personalInfo: any;
  jobDescription: string;
  studentProfile: any;
}) {
  // Extract key terms from job description
  const jobKeywords = extractKeywordsFromJob(jobDescription);
  
  // Generate job-focused summary
  const summary = generateJobFocusedSummary(jobDescription, studentProfile, jobKeywords);
  
  // Prioritize skills based on job relevance
  const skills = prioritizeSkillsForJob(studentProfile, jobKeywords);
  
  // Enhance experience descriptions for job relevance
  const experience = enhanceExperienceForJob(studentProfile?.experience || [], jobKeywords);
  
  // Process education (convert to expected structure)
  const education = (studentProfile?.education || []).map((edu: any) => ({
    degree: edu.degree || 'Degree',
    field: edu.field || 'Field',
    institution: edu.institution || 'Institution',
    startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
    endDate: edu.endDate && edu.isCompleted ? new Date(edu.endDate) : undefined,
    gpa: edu.gpa,
    isCompleted: edu.isCompleted !== false
  }));

  // Enhance projects for job relevance
  const projects = enhanceProjectsForJob(studentProfile?.projects || [], jobKeywords);

  return {
    personalInfo,
    summary,
    skills: skills.map((skill: any) => skill.name), // Convert to strings for frontend
    experience: experience.map((exp: any) => ({
      title: exp.title,
      company: exp.company,
      duration: exp.isCurrentJob ? 
        `${exp.startDate?.getFullYear() || ''} - Present` :
        `${exp.startDate?.getFullYear() || ''} - ${exp.endDate?.getFullYear() || 'Present'}`,
      description: [exp.description] // Convert to array for frontend
    })),
    education: education.map((edu: any) => ({
      degree: `${edu.degree} in ${edu.field}`,
      institution: edu.institution,
      year: edu.endDate ? edu.endDate.getFullYear().toString() : 
        (edu.isCompleted ? 'Completed' : 'In Progress')
    })),
    projects
  };
}

// Helper functions for enhanced fallback
function extractKeywordsFromJob(jobDescription: string): string[] {
  const commonTechTerms = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'API', 'REST', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue',
    'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'CI/CD', 'Agile', 'Scrum'
  ];
  
  const keywords = commonTechTerms.filter(term => 
    jobDescription.toLowerCase().includes(term.toLowerCase())
  );
  
  // Add other relevant keywords from job description
  const words = jobDescription.toLowerCase().split(/\W+/);
  const additionalKeywords = words.filter(word => 
    word.length > 4 && 
    !['with', 'experience', 'required', 'preferred', 'knowledge'].includes(word)
  ).slice(0, 10);
  
  return [...keywords, ...additionalKeywords];
}

function generateJobFocusedSummary(jobDescription: string, studentProfile: any, keywords: string[]): string {
  const roleMatch = jobDescription.match(/(?:position|role|job):\s*([^.]+)/i);
  const role = roleMatch ? roleMatch[1].trim() : 'technical professional';
  
  const topSkills = keywords.slice(0, 3).join(', ');
  
  if (studentProfile?.experience?.length > 0) {
    return `Results-driven professional with experience in ${topSkills} seeking to leverage expertise in a ${role} role. Proven track record of delivering technical solutions and contributing to team success with strong problem-solving abilities and commitment to excellence.`;
  } else {
    return `Motivated ${role} with strong foundation in ${topSkills}. Eager to apply technical skills and fresh perspective to drive innovation and contribute to organizational goals through dedicated effort and continuous learning.`;
  }
}

function prioritizeSkillsForJob(studentProfile: any, jobKeywords: string[]): any[] {
  const allSkills = [
    ...(studentProfile?.skills?.map((skill: any) => skill.name) || []),
    ...(studentProfile?.resumeAnalysis?.skills || [])
  ];
  
  const uniqueSkills = [...new Set(allSkills)];
  
  // Prioritize skills that match job keywords
  const jobRelevantSkills = uniqueSkills.filter(skill =>
    jobKeywords.some(keyword => 
      skill.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  const otherSkills = uniqueSkills.filter(skill => !jobRelevantSkills.includes(skill));
  
  // Return skills in the expected object format
  return [...jobRelevantSkills, ...otherSkills].slice(0, 12).map((skill: string) => ({
    name: skill,
    level: 'intermediate',
    category: 'technical'
  }));
}

function enhanceExperienceForJob(experience: any[], jobKeywords: string[]): any[] {
  return experience.map((exp: any) => {
    let description = exp.description || [`Contributed to ${exp.company} operations and team objectives`];
    
    // Ensure description is always an array for processing
    if (typeof description === 'string') {
      description = [description];
    } else if (!Array.isArray(description)) {
      description = [`Contributed to ${exp.company} operations and team objectives`];
    }
    
    // Enhance descriptions with job-relevant keywords
    const enhancedDescription = description.map((desc: string) => {
      if (jobKeywords.length > 0) {
        const relevantKeywords = jobKeywords.slice(0, 2);
        return `${desc} Utilized ${relevantKeywords.join(' and ')} to drive technical excellence and project success.`;
      }
      return desc;
    });
    
    return {
      title: exp.title,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
      endDate: exp.endDate && !exp.isCurrentJob ? new Date(exp.endDate) : undefined,
      description: enhancedDescription.join('. '), // Convert to string
      isCurrentJob: exp.isCurrentJob || false
    };
  });
}

function enhanceProjectsForJob(projects: any[], jobKeywords: string[]): any[] {
  return projects.slice(0, 3).map((project: any) => {
    const baseDescription = project.description || `${project.name} project showcasing technical skills and problem-solving abilities`;
    
    // Add job-relevant context to project descriptions
    const relevantTech = jobKeywords.filter(keyword => 
      project.technologies?.some((tech: string) => 
        tech.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    const enhancedDescription = relevantTech.length > 0 ?
      `${baseDescription} Leveraged ${relevantTech.join(', ')} to deliver scalable solutions and meet project objectives.` :
      baseDescription;
    
    return {
      name: project.name,
      description: enhancedDescription,
      technologies: project.technologies || []
    };
  });
}

// Public PDF Download Endpoint (for WhatsApp sharing)
// Helper function to generate the best available download URL
function generateDownloadUrl(resumeId: string, jobTitle?: string): string {
  // Try to generate Bunny.net URL first
  const cdnBaseUrl = process.env.BUNNY_CDN_URL;
  if (cdnBaseUrl) {
    const sanitizedJobTitle = (jobTitle || 'Resume').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    return `${cdnBaseUrl}resumes/${resumeId}/${sanitizedJobTitle}_${resumeId}.pdf`;
  }
  
  // Fallback to API endpoint
  return `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume-builder/download-pdf-public/${resumeId}`;
}

// Helper function to update database with actual CDN URL after successful upload
async function updateResumeWithCDNUrl(resumeId: string, cloudUrl: string): Promise<void> {
  try {
    // Update GeneratedResume collection
    await GeneratedResume.findOneAndUpdate(
      { resumeId: resumeId },
      { 
        cloudUrl: cloudUrl,
        status: 'completed'
      }
    );
    
    // Update Student.aiResumeHistory
    await Student.updateOne(
      { 'aiResumeHistory.id': resumeId },
      { 
        $set: { 'aiResumeHistory.$.pdfUrl': cloudUrl }
      }
    );
    
    console.log('✅ Database updated with CDN URL:', cloudUrl);
  } catch (error) {
    console.error('❌ Failed to update database with CDN URL:', error);
  }
}

// Helper function to extract job title from job description
function extractJobTitleFromDescription(jobDescription: string): string {
  const lines = jobDescription.split('\n');
  const firstLine = lines[0].trim();
  
  // Look for common patterns
  const titlePatterns = [
    /^(.*?)\s*-\s*job/i,
    /^position:\s*(.*?)$/i,
    /^role:\s*(.*?)$/i,
    /^title:\s*(.*?)$/i,
    /^job title:\s*(.*?)$/i,
    /^(.*?)\s*position/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = firstLine.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, take first line if it looks like a title (under 100 chars)
  if (firstLine.length < 100 && !firstLine.toLowerCase().includes('company') && !firstLine.toLowerCase().includes('location')) {
    return firstLine;
  }
  
  return 'Job Position';
}

// Helper function to generate PDF URL for a resume
async function generateResumePdfUrl(resumeData: any, resumeId: string): Promise<string | null> {
  try {
    console.log('🔄 generateResumePdfUrl called with resumeId:', resumeId);
    console.log('📋 Resume data keys:', Object.keys(resumeData || {}));
    
    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resumeData.personalInfo || {
        name: 'Default Name',
        firstName: 'Default',
        lastName: 'User',
        email: 'default@example.com',
        phone: '0000000000'
      },
      summary: resumeData.summary || 'Professional summary not available',
      skills: (resumeData.skills || ['General Skills']).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resumeData.experience || []).map((exp: any) => ({
        title: exp.title || 'Position',
        company: exp.company || 'Company',
        location: exp.location || 'Location',
        startDate: new Date(),
        endDate: exp.duration?.includes('Present') ? undefined : new Date(),
        description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || 'Job description'),
        isCurrentJob: exp.duration?.includes('Present') || false
      })),
      education: (resumeData.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: 'Field',
        institution: edu.institution || 'Institution',
        startDate: new Date(),
        endDate: edu.year === 'In Progress' ? undefined : new Date(),
        isCompleted: edu.year !== 'In Progress'
      })),
      projects: resumeData.projects || []
    };

    console.log('📄 PDF compatible resume created with personal info:', pdfCompatibleResume.personalInfo);

    const resumeBuilder = ResumeBuilderService;
    
    // Generate HTML from resume data
    console.log('🔄 Generating HTML content...');
    const htmlContent = resumeBuilder.generateResumeHTML(pdfCompatibleResume);
    
    console.log('🔄 Generating PDF buffer...');
    const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);
    console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');

    // Upload to BunnyCDN using the improved service
    const fileName = `WhatsApp_Resume_${resumeId}.pdf`;
    console.log('☁️ Uploading to Bunny.net with filename:', fileName);
    
    try {
      const bunnyUpload = await ImprovedBunnyStorageService.uploadPDFWithRetry(pdfBuffer, fileName, resumeId, 3);
      
      if (bunnyUpload.success && bunnyUpload.url) {
        console.log('✅ WhatsApp PDF uploaded to BunnyCDN:', bunnyUpload.url);
        return bunnyUpload.url;
      } else {
        console.log('⚠️ BunnyCDN upload failed for WhatsApp, using fallback URL:', bunnyUpload.error);
        return generateDownloadUrl(resumeId, 'WhatsApp_Resume');
      }
    } catch (bunnyError) {
      console.log('⚠️ BunnyCDN error for WhatsApp, using fallback URL:', bunnyError);
      return generateDownloadUrl(resumeId, 'WhatsApp_Resume');
    }
    
  } catch (error) {
    console.error('❌ Error generating PDF URL:', error);
    return null;
  }
}

// Helper function to send resume to WhatsApp via Wabb
async function sendResumeToWhatsApp(phoneNumber: string, pdfUrl: string, jobTitle: string): Promise<any> {
  try {
    // Use environment variable for resume webhook URL
    const wabbWebhookUrl = process.env.WABB_WEBHOOK_URL_RESUME || process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    const payload = {
      number: phoneNumber,
      document: pdfUrl // Document URL for Wabb
    };

    console.log('Sending resume to Wabb:', payload);
    console.log('Using webhook URL:', wabbWebhookUrl);

    const response = await axios.post(wabbWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error: any) {
    console.error('Error sending resume to WhatsApp:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Debug endpoint for no-auth AI resume generation (for WABB)
router.post('/debug-no-auth', async (req, res) => {
  try {
    console.log('=== DEBUG NO-AUTH AI RESUME GENERATION ===');
    
    const { email, jobDescription } = req.body;
    
    if (!email || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email and job description are required'
      });
    }
    
    console.log('Email:', email);
    console.log('Job Description length:', jobDescription.length);
    
    // Find user and student profile
    let studentProfile = null;
    try {
      const { User } = require('../models/User');
      const user = await User.findOne({ email });
      if (user) {
        studentProfile = await Student.findOne({ userId: user._id }).lean();
      }
    } catch (error) {
      console.log('Could not fetch student profile:', error);
    }

    if (!studentProfile) {
      console.log('🚨 User not found in database - sending notification webhook');
      
      try {
        const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
        const webhookPayload = {
          number: req.body.number || req.body.phone || '', // Use provided number or fallback
          message: `👋 Hi ${email},\n\nWe noticed you tried creating an AI resume but you’re not registered yet.\n\n✨ To continue, please register at 👉 dev.campuspe.com\n\nOnce you sign up, you’ll be able to generate and download your professional resume in minutes 🚀`
        };

        console.log('📡 Sending webhook notification for unregistered user:', {
          webhookUrl,
          userEmail: email
        });

        const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('✅ Webhook notification sent successfully:', webhookResponse.status);
      } catch (webhookError) {
        console.error('❌ Webhook notification failed:', webhookError);
      }

      return res.status(404).json({
        success: false,
        message: 'User not found in database. Please register first to generate your AI resume.',
        code: 'USER_NOT_FOUND',
        action: 'REGISTRATION_REQUIRED',
        details: {
          email,
          webhookTriggered: true,
          adminNotified: true
        }
      });
    }

    console.log('Found student:', studentProfile._id);

    // Create resume data using existing profile and job analysis
    const resumeData = await generateAIResume({
      email,
      phone: studentProfile.phoneNumber || '0000000000',
      jobDescription,
      studentProfile
    });

    console.log('✅ AI resume generated successfully');

    res.json({
      success: true,
      message: 'AI resume generated successfully',
      data: resumeData
    });

  } catch (error: any) {
    console.error('❌ Debug no-auth AI resume generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'AI resume generation failed',
      error: error.message
    });
  }
});

// Save resume endpoint (no auth for WABB)
router.post('/save-resume', async (req, res) => {
  try {
    const { resumeData, jobDescription, email } = req.body;
    
    if (!resumeData || !jobDescription || !email) {
      return res.status(400).json({
        success: false,
        message: 'Resume data, job description, and email are required'
      });
    }

    // Find student profile
    let studentProfile = null;
    try {
      const { User } = require('../models/User');
      const user = await User.findOne({ email });
      if (user) {
        studentProfile = await Student.findOne({ userId: user._id }).lean();
      }
    } catch (error) {
      console.log('Could not fetch student profile:', error);
    }

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Convert to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resumeData.personalInfo,
      summary: resumeData.summary,
      skills: (resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name || skill,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resumeData.experience || []).map((exp: any) => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 1;
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

    // Generate PDF
    const htmlContent = ResumeBuilderService.generateResumeHTML(pdfCompatibleResume);
    const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);

    // Extract job title
    const jobTitle = 'AI Generated Resume';
    
    // Generate filename
    const fileName = `${resumeData.personalInfo.name || 'Resume'}_${jobTitle}_${Date.now()}.pdf`;

    // Create the resume in GeneratedResume collection
    const generatedResume = await GeneratedResumeService.createGeneratedResume({
      studentId: studentProfile._id.toString(),
      jobTitle,
      jobDescription,
      resumeData: pdfCompatibleResume,
      fileName,
      pdfBuffer,
      matchScore: 85,
      aiEnhancementUsed: true,
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
      generationType: 'ai'
    });

    console.log('✅ Resume saved with ID:', generatedResume.resumeId);

    res.json({
      success: true,
      message: 'Resume saved successfully',
      resumeId: generatedResume.resumeId,
      fileName: fileName
    });

  } catch (error: any) {
    console.error('❌ Save resume failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save resume',
      error: error.message
    });
  }
});

// Send to WhatsApp endpoint (no auth for WABB)
router.post('/send-to-whatsapp', async (req, res) => {
  try {
    const { resumeId, phoneNumber, jobTitle } = req.body;
    
    if (!resumeId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and phone number are required'
      });
    }

    // First, try to fetch the resume from the database
    let resumeData = null;
    try {
      const existingResume = await GeneratedResume.findOne({ resumeId: resumeId });
      if (existingResume && existingResume.resumeData) {
        resumeData = existingResume.resumeData;
        console.log('📋 Found existing resume data for WhatsApp sharing');
      }
    } catch (dbError: any) {
      console.log('⚠️ Could not fetch resume from database, will generate with empty data:', dbError.message);
    }

    // Generate PDF URL for this resume
    const pdfUrl = await generateResumePdfUrl(resumeData || {}, resumeId);
    
    if (!pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'Failed to generate PDF URL'
      });
    }
    
    const whatsappResponse = await sendResumeToWhatsApp(phoneNumber, pdfUrl, jobTitle || 'Resume');
    
    res.json({
      success: whatsappResponse.success,
      message: whatsappResponse.message,
      pdfUrl: pdfUrl
    });

  } catch (error: any) {
    console.error('❌ Send to WhatsApp failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send to WhatsApp',
      error: error.message
    });
  }
});

// Test endpoint for debugging (no auth required)
router.post('/test-generate', async (req, res) => {
  try {
    console.log('🧪 Test resume generation endpoint');
    
    const { email, phone, jobDescription } = req.body;
    
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    console.log(`🧪 Test generation for ${email} (${phone})`);
    
    // Use the WABB resume creation service which doesn't require auth
    const result = await ResumeBuilderService.createTailoredResume(
      email,
      phone,
      jobDescription
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test resume generated successfully',
        data: {
          resumeId: result.resumeId,
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          pdfSize: result.pdfBuffer?.length
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ Test generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test generation failed',
      error: error.message
    });
  }
});

// Helper function to transform AI-generated resume data to match GeneratedResume schema
function transformResumeDataForSchema(resumeData: any): any {
  try {
    console.log('🔄 Transforming resume data for schema compatibility...');
    
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

    console.log('✅ Resume data transformation completed');
    console.log('📊 Transformed data structure:', {
      personalInfo: !!transformed.personalInfo.firstName,
      skillsCount: transformed.skills.length,
      experienceCount: transformed.experience.length,
      educationCount: transformed.education.length
    });

    return transformed;
  } catch (error) {
    console.error('❌ Error transforming resume data:', error);
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

// No-Auth Endpoint: Generate AI Resume and Trigger WABB Webhook
router.post('/generate-ai-no-auth', async (req, res) => {
  try {
    const { email, phone, jobDescription, number } = req.body;

    // Validate required fields
    if (!email || !phone || !jobDescription || !number) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, job description, and number are required',
        required: ['email', 'phone', 'jobDescription', 'number']
      });
    }

    console.log('📱 No-Auth AI Resume Generation Request:', {
      email,
      phone,
      jobDescription: jobDescription.substring(0, 100) + '...',
      number
    });

    // Find the student profile based on email and phone
    let studentProfile = null;
    let studentId = null; // Store student ID separately for database operations
    let user = null;
    let userExists = false;
    
    try {
      console.log('🔍 Looking for user with email:', email);
      
      // First, find the user by email
      user = await User.findOne({ email: email }).lean();
      if (user) {
        console.log('✅ Found user:', user._id, (user as any).name || (user as any).firstName + ' ' + (user as any).lastName);
        userExists = true;
        
        // Then find the student profile linked to this user
        studentProfile = await Student.findOne({ userId: user._id }).lean();
        if (studentProfile) {
          studentId = studentProfile._id; // Store the ID for later database operations
          console.log('✅ Found student profile:', studentProfile._id);
          console.log('📊 Student profile data available:', {
            hasSkills: !!(studentProfile.skills && studentProfile.skills.length > 0),
            hasExperience: !!(studentProfile.experience && studentProfile.experience.length > 0),
            hasEducation: !!(studentProfile.education && studentProfile.education.length > 0),
            hasProjects: !!((studentProfile as any).projects && (studentProfile as any).projects.length > 0)
          });
        } else {
          console.log('⚠️ No student profile found for user');
        }
      } else {
        console.log('⚠️ No user found with email:', email);
        
        // Also check if user exists with the phone number
        const userByPhone = await User.findOne({ phone: phone }).lean();
        if (userByPhone) {
          console.log('✅ Found user by phone:', userByPhone._id);
          userExists = true;
          user = userByPhone;
          
          // Find student profile for phone-matched user
          studentProfile = await Student.findOne({ userId: userByPhone._id }).lean();
          if (studentProfile) {
            studentId = studentProfile._id;
            console.log('✅ Found student profile by phone match:', studentProfile._id);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error finding user/student profile:', error);
    }

    // Check if user doesn't exist in database - send notification webhook
    if (!userExists) {
      console.log('🚨 User not found in database - sending notification webhook');
      try {
        const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
        const webhookPayload = {
          number: number,
          message: `👋 Hi ${email},\n\nWe noticed you tried creating an AI resume but you’re not registered yet.\n\n✨ To continue, please register at 👉 dev.campuspe.com\n\nOnce you sign up, you’ll be able to generate and download your professional resume in minutes 🚀`
        };

        console.log('📡 Sending webhook notification for unregistered user:', {
          webhookUrl,
          targetNumber: number,
          userEmail: email,
          userPhone: phone
        });

        const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('✅ Webhook notification sent successfully:', webhookResponse.status);
        
        // Return early with notification that user needs to register
        return res.status(404).json({
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

      } catch (webhookError) {
        console.error('❌ Webhook notification failed:', webhookError);
        
        // Continue with resume generation even if webhook fails
        console.log('⚠️ Continuing with resume generation despite webhook failure');
      }
    }

    // Generate resume data using AI service with actual profile data
    const resumeData = await generateAIResume({
      email,
      phone,
      jobDescription,
      studentProfile // Use actual student profile instead of null
    });

    const generatedResumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract job title from description
    const jobTitle = extractJobTitleFromDescription(jobDescription);

    // Generate PDF immediately and upload to BunnyCDN
    console.log('📄 Generating PDF for BunnyCDN upload...');
    
    // Convert to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resumeData.personalInfo,
      summary: resumeData.summary,
      skills: (resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resumeData.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || 'Remote',
        startDate: new Date(),
        endDate: exp.duration?.includes('Present') ? undefined : new Date(),
        description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
        isCurrentJob: exp.duration?.includes('Present') || false
      })),
      education: (resumeData.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: 'Field of Study',
        institution: edu.institution || 'Institution',
        startDate: new Date(),
        endDate: edu.year === 'In Progress' ? undefined : new Date(),
        isCompleted: edu.year !== 'In Progress'
      })),
      projects: resumeData.projects || []
    };

    // Generate PDF buffer
    const pdfBuffer = await ResumeBuilderService.generateStructuredPDF(pdfCompatibleResume);
    const fileName = `${jobTitle || 'Resume'}_${generatedResumeId}.pdf`;

    // Upload to BunnyCDN with retry logic
    console.log('☁️ Uploading PDF to BunnyCDN with retry logic...');
    let downloadUrl: string;
    let cloudUrl: string | null = null;

    try {
      const bunnyUpload = await ImprovedBunnyStorageService.uploadPDFWithRetry(pdfBuffer, fileName, generatedResumeId, 3);
      
      if (bunnyUpload.success && bunnyUpload.url) {
        cloudUrl = bunnyUpload.url;
        downloadUrl = cloudUrl;
        console.log('✅ PDF uploaded to BunnyCDN:', cloudUrl);
        
        // Update database with actual CDN URL
        await updateResumeWithCDNUrl(generatedResumeId, cloudUrl);
      } else {
        console.log('⚠️ BunnyCDN upload failed after retries, using fallback URL:', bunnyUpload.error);
        downloadUrl = generateDownloadUrl(generatedResumeId, jobTitle || 'Resume');
      }
    } catch (bunnyError) {
      console.log('⚠️ BunnyCDN error, using fallback URL:', bunnyError);
      downloadUrl = generateDownloadUrl(generatedResumeId, jobTitle || 'Resume');
    }

    // Create resume history item with BunnyCDN URL
    const resumeHistoryItem = {
      id: generatedResumeId,
      jobDescription: jobDescription.substring(0, 500),
      jobTitle: jobTitle || 'AI Generated Resume',
      resumeData: resumeData,
      pdfBuffer: pdfBuffer, // Store buffer for fallback
      pdfUrl: downloadUrl,
      cloudUrl: cloudUrl, // BunnyCDN URL
      generatedAt: new Date(),
      matchScore: 85,
      contactInfo: {
        email,
        phone,
        number // WhatsApp number for webhook
      }
    };

    // Log URL usage for monitoring
    ResumeUrlUtils.logUrlUsage(generatedResumeId, downloadUrl, 'AI Resume Generation');

    // Store resume data temporarily (you might want to use Redis or database for production)
    // For now, we'll use a simple in-memory store
    if (!global.tempResumeStore) {
      global.tempResumeStore = new Map();
    }
    global.tempResumeStore.set(generatedResumeId, resumeHistoryItem);

    // Also save to database for persistence
    try {
      console.log('🔄 Saving no-auth resume to database...');
      console.log('🚀 DEBUG: Database save section reached!');
      console.log('🚀 DEBUG: studentProfile status:', studentProfile ? 'FOUND' : 'NOT FOUND');
      console.log('🚀 DEBUG: generatedResumeId:', generatedResumeId);
      
      // Transform resume data for database
      const transformedResumeData = transformResumeDataForSchema(resumeData);
      
      const generatedResume = new GeneratedResume({
        studentId: studentId || null, // Use actual student ID if found
        resumeId: generatedResumeId,
        jobTitle: jobTitle || 'AI Generated Resume',
        jobDescription,
        jobDescriptionHash: require('crypto').createHash('md5').update(jobDescription).digest('hex'),
        resumeData: transformedResumeData,
        
        // File information with actual data
        fileName: fileName,
        filePath: cloudUrl, // Store CDN URL as filePath
        cloudUrl: cloudUrl, // Store CDN URL
        fileSize: pdfBuffer.length, // Actual file size
        mimeType: 'application/pdf',
        
        // AI Analysis
        matchScore: 85,
        aiEnhancementUsed: true,
        matchedSkills: resumeData.skills?.map((skill: any) => typeof skill === 'string' ? skill : skill.name) || [],
        missingSkills: [],
        suggestions: [],
        
        // Status
        status: 'completed',
        generationType: 'ai', // FIX: Use valid enum value instead of 'ai-no-auth'
        downloadCount: 0,
        whatsappSharedCount: 1, // Already shared via webhook
        
        // Contact info for no-auth requests
        contactInfo: {
          email,
          phone,
          whatsappNumber: number
        },
        
        // Timestamps
        generatedAt: new Date(),
        whatsappSharedAt: [new Date()],
        whatsappRecipients: [{ // FIX: Use object array instead of string array
          phoneNumber: number,
          sharedAt: new Date(),
          status: 'sent'
        }]
      });

      await generatedResume.save();
      console.log('✅ No-auth resume saved to database with ID:', generatedResume._id);
      
      // CRITICAL FIX: Save to user's aiResumeHistory if we found the student profile
      console.log('🔍 DEBUG: Checking if studentId exists for aiResumeHistory save...');
      console.log('🔍 DEBUG: studentId:', studentId ? 'FOUND' : 'NOT FOUND');
      console.log('🔍 DEBUG: studentId value:', studentId);
      
      if (studentId) {
        console.log('🔄 DEBUG: Starting aiResumeHistory save process...');
        try {
          console.log('🔍 DEBUG: Finding student by ID:', studentId);
          
          // CRITICAL FIX: Use the stored studentId instead of studentProfile._id
          const student = await Student.findById(studentId);
          
          if (student) {
            console.log('✅ DEBUG: Student found in database for aiResumeHistory update');
            console.log('🔍 DEBUG: Current aiResumeHistory length:', student.aiResumeHistory?.length || 0);
            
            // CRITICAL FIX: Initialize aiResumeHistory if it doesn't exist
            if (!student.aiResumeHistory) {
              console.log('🔧 DEBUG: Initializing aiResumeHistory array');
              student.aiResumeHistory = [];
            }

            // CRITICAL FIX: Create the history item with proper structure
            const historyItem = {
              id: generatedResumeId,
              jobDescription,
              jobTitle: jobTitle || 'AI Generated Resume',
              resumeData: resumeData,
              pdfUrl: downloadUrl, // Use actual CDN URL
              cloudUrl: cloudUrl, // Store CDN URL
              generatedAt: new Date(),
              matchScore: 85
            };

            console.log('🔧 DEBUG: Created history item:', {
              id: historyItem.id,
              jobTitle: historyItem.jobTitle,
              pdfUrl: historyItem.pdfUrl,
              cloudUrl: historyItem.cloudUrl
            });

            // CRITICAL FIX: Add to beginning of array
            student.aiResumeHistory.unshift(historyItem);
            console.log('🔧 DEBUG: Added item to aiResumeHistory, new length:', student.aiResumeHistory.length);

            // CRITICAL FIX: Keep only last 10 resumes
            if (student.aiResumeHistory.length > 10) {
              console.log('🔧 DEBUG: Trimming aiResumeHistory to 10 items');
              student.aiResumeHistory = student.aiResumeHistory.slice(0, 10);
            }

            // CRITICAL FIX: Mark the field as modified to ensure Mongoose saves it
            student.markModified('aiResumeHistory');
            
            console.log('💾 DEBUG: Attempting to save student with updated aiResumeHistory...');
            const saveResult = await student.save();
            console.log('✅ Resume saved to user aiResumeHistory for:', email);
            console.log('✅ DEBUG: Student save completed successfully, result ID:', saveResult._id);
            console.log('✅ DEBUG: Final aiResumeHistory length:', saveResult.aiResumeHistory?.length || 0);
          } else {
            console.log('❌ DEBUG: Student not found in database when trying to save aiResumeHistory');
            console.log('❌ DEBUG: Attempted to find student with ID:', studentId);
          }
        } catch (historyError) {
          console.error('❌ Error saving to user aiResumeHistory:', historyError);
          console.error('❌ DEBUG: Full error details:', historyError instanceof Error ? historyError.stack : historyError);
          // Continue execution - don't fail if history save fails
        }
      } else {
        console.log('⚠️ DEBUG: No studentId found, skipping aiResumeHistory save');
        console.log('⚠️ DEBUG: studentProfile details:', studentProfile);
      }
    } catch (dbError) {
      console.error('❌ Error saving no-auth resume to database:', dbError);
      // Continue execution - don't fail if database save fails
    }

    console.log('📄 Resume generated successfully:', {
      resumeId: generatedResumeId,
      downloadUrl: downloadUrl,
      jobTitle: jobTitle || 'AI Generated Resume'
    });

    // Trigger WABB Webhook with multiple approaches
    let webhookTriggered = false;
    let webhookError = null;
    
    // Format phone number for WABB webhook - MUST be +91xxxxxxxxxx format
    let wabbFormattedNumber = number.toString().replace(/[^\d]/g, ''); // Remove all non-digits
    
    // Handle different input formats and ensure +91 prefix
    if (wabbFormattedNumber.startsWith('91') && wabbFormattedNumber.length === 12) {
      // Already has 91 prefix (919156621088) -> add +
      wabbFormattedNumber = '+' + wabbFormattedNumber;
    } else if (wabbFormattedNumber.startsWith('91') && wabbFormattedNumber.length > 12) {
      // Has 91 prefix but extra digits (919156621088123) -> take first 12 and add +
      wabbFormattedNumber = '+' + wabbFormattedNumber.substring(0, 12);
    } else if (wabbFormattedNumber.length === 10) {
      // 10-digit number (9156621088) -> add +91
      wabbFormattedNumber = '+91' + wabbFormattedNumber;
    } else if (wabbFormattedNumber.length > 10) {
      // More than 10 digits, assume it needs country code stripping or fixing
      if (wabbFormattedNumber.startsWith('0')) {
        // Remove leading 0 and check again
        wabbFormattedNumber = wabbFormattedNumber.substring(1);
        if (wabbFormattedNumber.startsWith('91') && wabbFormattedNumber.length >= 12) {
          wabbFormattedNumber = '+' + wabbFormattedNumber.substring(0, 12);
        } else {
          wabbFormattedNumber = '+91' + wabbFormattedNumber.slice(-10);
        }
      } else {
        // Take last 10 digits and add +91
        wabbFormattedNumber = '+91' + wabbFormattedNumber.slice(-10);
      }
    } else {
      // Default case - assume it needs +91
      wabbFormattedNumber = '+91' + wabbFormattedNumber;
    }
    
    console.log('📱 Phone number formatting for WABB:');
    console.log('   Original:', number);
    console.log('   Formatted for WABB:', wabbFormattedNumber);
    
    const documentUrl = cloudUrl || downloadUrl;
    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    // Try multiple webhook payload formats - WABB requires +91xxxxxxxxxx format
    const webhookAttempts = [
      {
        name: 'Minimal format (working in other endpoints)',
        payload: {
          resumeId: generatedResumeId,
          number: wabbFormattedNumber
        }
      },
      {
        name: 'Document + Number format',
        payload: {
          document: documentUrl,
          number: wabbFormattedNumber
        }
      },
      {
        name: 'Full message format',
        payload: {
          number: wabbFormattedNumber,
          message: `🎉 Your AI-Generated Resume is Ready!\n\n📄 Job Title: ${jobTitle || 'AI Generated Resume'}\n📅 Generated: ${new Date().toLocaleDateString()}\n📧 Email: ${email}\n\n📥 Download: ${documentUrl}\n\n💼 Best of luck with your application!`,
          document: documentUrl
        }
      }
    ];

    for (const attempt of webhookAttempts) {
      if (webhookTriggered) break; // Stop if we already succeeded
      
      try {
        console.log(`� Trying WABB webhook - ${attempt.name}...`);
        console.log('📤 Payload:', JSON.stringify(attempt.payload, null, 2));
        
        const webhookResponse = await axios.post(webhookUrl, attempt.payload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CampusPe-Resume-Builder/1.0'
          },
          timeout: 10000
        });

        console.log(`✅ WABB webhook succeeded with ${attempt.name}:`, {
          status: webhookResponse.status,
          data: webhookResponse.data
        });
        
        webhookTriggered = true;
        webhookError = null;
        break; // Success, exit the loop
        
      } catch (error) {
        console.error(`❌ WABB webhook failed with ${attempt.name}:`, (error as Error).message);
        if ((error as any)?.response) {
          console.error('Response details:', {
            status: (error as any).response.status,
            data: (error as any).response.data
          });
        }
        webhookError = error;
        
        // Wait a bit before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Log final webhook status
    if (!webhookTriggered) {
      console.error('❌ All WABB webhook attempts failed');
      console.log('📧 Webhook details for debugging:', {
        webhookUrl,
        wabbFormattedNumber,
        documentUrl,
        originalNumber: number,
        generatedResumeId
      });
    }

    // Send success response
    res.json({
      success: true,
      message: webhookTriggered ? 'AI resume generated successfully and webhook triggered' : 'AI resume generated successfully but webhook failed',
      data: {
        resumeId: generatedResumeId,
        downloadUrl: downloadUrl,
        cloudUrl: cloudUrl, // Add cloudUrl to the response
        jobTitle: jobTitle || 'AI Generated Resume',
        webhookTriggered: webhookTriggered,
        webhookError: webhookError ? (webhookError as Error).message : null,
        whatsappNumber: number,
        resume: resumeData
      }
    });

  } catch (error: any) {
    console.error('❌ Error in no-auth AI resume generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug endpoint to test WABB webhook directly
router.post('/test-webhook', async (req, res) => {
  try {
    const { number, document, message } = req.body;
    
    if (!number) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    console.log('🧪 Testing WABB webhook directly...');
    
    const axios = require('axios');
    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    // Format phone number
    let formattedNumber = number;
    if (formattedNumber.startsWith('+91')) {
      formattedNumber = formattedNumber.substring(3);
    } else if (formattedNumber.startsWith('91')) {
      formattedNumber = formattedNumber.substring(2);
    } else if (formattedNumber.startsWith('+')) {
      formattedNumber = formattedNumber.substring(1);
    }
    
    if (formattedNumber.length > 10) {
      formattedNumber = formattedNumber.slice(-10);
    }

    const webhookPayload = {
      number: formattedNumber,
      message: message || `🧪 Test message from CampusPe Resume Builder API\n\nTimestamp: ${new Date().toISOString()}`,
      document: document || undefined
    };

    console.log('📤 Test webhook payload:', webhookPayload);

    const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CampusPe-Resume-Builder/1.0'
      },
      timeout: 15000
    });

    console.log('✅ Test webhook response:', {
      status: webhookResponse.status,
      data: webhookResponse.data
    });

    res.json({
      success: true,
      message: 'Webhook test completed',
      data: {
        originalNumber: number,
        formattedNumber: formattedNumber,
        webhookUrl: webhookUrl,
        payload: webhookPayload,
        response: {
          status: webhookResponse.status,
          data: webhookResponse.data
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Webhook test error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Webhook test failed',
      error: {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      }
    });
  }
});

// Debug endpoint to check user lookup
router.post('/debug-user-lookup', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('🔍 Debug: Looking for user with email:', email);
    
    // First, find the user by email
    const user = await User.findOne({ email: email }).lean();
    
    if (user) {
      console.log('✅ Debug: Found user:', user._id, (user as any).name || 'No name');
      
      // Then find the student profile linked to this user
      const studentProfile = await Student.findOne({ userId: user._id }).lean();
      
      if (studentProfile) {
        console.log('✅ Debug: Found student profile:', studentProfile._id);
        return res.json({
          success: true,
          message: 'User and student profile found',
          data: {
            user: {
              id: user._id,
              email: user.email,
              name: (user as any).name || 'No name',
              firstName: (user as any).firstName,
              lastName: (user as any).lastName
            },
            studentProfile: {
              id: studentProfile._id,
              userId: studentProfile.userId,
              hasSkills: !!((studentProfile as any).skills && (studentProfile as any).skills.length > 0),
              hasExperience: !!((studentProfile as any).experience && (studentProfile as any).experience.length > 0),
              hasEducation: !!((studentProfile as any).education && (studentProfile as any).education.length > 0),
              hasProjects: !!((studentProfile as any).projects && (studentProfile as any).projects.length > 0),
              aiResumeHistoryCount: (studentProfile as any).aiResumeHistory?.length || 0,
              aiResumeHistory: (studentProfile as any).aiResumeHistory || []
            }
          }
        });
      } else {
        console.log('⚠️ Debug: No student profile found for user');
        return res.json({
          success: false,
          message: 'User found but no student profile',
          data: {
            user: {
              id: user._id,
              email: user.email,
              name: (user as any).name || 'No name',
              firstName: (user as any).firstName,
              lastName: (user as any).lastName
            },
            studentProfile: null
          }
        });
      }
    } else {
      console.log('⚠️ Debug: No user found with email:', email);
      return res.json({
        success: false,
        message: 'No user found with this email',
        data: {
          user: null,
          studentProfile: null
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug lookup failed',
      error: error?.message || 'Unknown error'
    });
  }
});

export default router;
