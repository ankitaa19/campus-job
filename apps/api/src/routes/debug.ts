import express from 'express';
import authMiddleware from '../middleware/auth';
import aiResumeMatchingService from '../services/ai-resume-matching';
import BunnyStorageService from '../services/bunny-storage.service';
import ImprovedBunnyStorageService from '../services/bunny-storage-improved.service';
import { User } from '../models/User';
import { Student } from '../models/Student';

const router = express.Router();

/**
 * Debug endpoint to test skill normalization
 * POST /api/debug/normalize-skills
 */
router.post('/normalize-skills', authMiddleware, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills array is required'
      });
    }

    // Normalize skill level to match Student schema enum values
    function normalizeSkillLevel(level: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
      if (!level || typeof level !== 'string') {
        return 'intermediate';
      }
      
      const normalizedLevel = level.toLowerCase().trim();
      
      if (normalizedLevel.includes('expert') || 
          normalizedLevel.includes('native') || 
          normalizedLevel.includes('fluent') ||
          normalizedLevel.includes('mastery') ||
          normalizedLevel.includes('senior') ||
          normalizedLevel.includes('lead')) {
        return 'expert';
      }
      
      if (normalizedLevel.includes('advanced') || 
          normalizedLevel.includes('professional') || 
          normalizedLevel.includes('proficient') ||
          normalizedLevel.includes('experienced') ||
          normalizedLevel.includes('strong')) {
        return 'advanced';
      }
      
      if (normalizedLevel.includes('beginner') || 
          normalizedLevel.includes('basic') || 
          normalizedLevel.includes('novice') ||
          normalizedLevel.includes('learning') ||
          normalizedLevel.includes('familiar') ||
          normalizedLevel.includes('entry')) {
        return 'beginner';
      }
      
      return 'intermediate';
    }

    // Normalize skill category to match Student schema enum values
    function normalizeSkillCategory(category: string): 'technical' | 'soft' | 'language' {
      if (!category || typeof category !== 'string') {
        return 'technical';
      }
      
      const normalizedCategory = category.toLowerCase().trim();
      
      if (normalizedCategory.includes('language') || 
          normalizedCategory.includes('linguistic')) {
        return 'language';
      }
      
      if (normalizedCategory.includes('soft') || 
          normalizedCategory.includes('interpersonal') ||
          normalizedCategory.includes('communication') ||
          normalizedCategory.includes('leadership') ||
          normalizedCategory.includes('management') ||
          normalizedCategory.includes('personal')) {
        return 'soft';
      }
      
      return 'technical';
    }

    const normalizedSkills = skills.map((skill: any) => {
      const original = {
        name: skill.name,
        level: skill.level,
        category: skill.category
      };

      const normalized = {
        name: String(skill.name || '').trim(),
        level: normalizeSkillLevel(skill.level),
        category: normalizeSkillCategory(skill.category)
      };

      return {
        original,
        normalized,
        changed: original.level !== normalized.level || original.category !== normalized.category
      };
    });

    const changedSkills = normalizedSkills.filter(skill => skill.changed);

    res.json({
      success: true,
      message: 'Skills normalized successfully',
      data: {
        totalSkills: skills.length,
        changedSkills: changedSkills.length,
        normalizedSkills,
        summary: {
          changedSkills: changedSkills.map(skill => ({
            name: skill.original.name,
            levelChange: `${skill.original.level} → ${skill.normalized.level}`,
            categoryChange: `${skill.original.category} → ${skill.normalized.category}`
          }))
        }
      }
    });

  } catch (error: any) {
    console.error('Error in skill normalization debug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to normalize skills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Debug endpoint to validate Student schema fields
 * POST /api/debug/validate-student-data
 */
router.post('/validate-student-data', authMiddleware, async (req, res) => {
  try {
    const { studentData } = req.body;

    const validations = {
      skills: {
        valid: true,
        errors: [] as string[],
        validLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
        validCategories: ['technical', 'soft', 'language']
      }
    };

    // Validate skills
    if (studentData.skills && Array.isArray(studentData.skills)) {
      studentData.skills.forEach((skill: any, index: number) => {
        if (!validations.skills.validLevels.includes(skill.level)) {
          validations.skills.valid = false;
          validations.skills.errors.push(`Skill ${index + 1} (${skill.name}): Invalid level "${skill.level}"`);
        }
        
        if (!validations.skills.validCategories.includes(skill.category)) {
          validations.skills.valid = false;
          validations.skills.errors.push(`Skill ${index + 1} (${skill.name}): Invalid category "${skill.category}"`);
        }
      });
    }

    res.json({
      success: true,
      message: 'Student data validation completed',
      data: {
        isValid: validations.skills.valid,
        validations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error in student data validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate student data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Claude API Debug Endpoint
 * GET /api/debug/claude-test
 */
router.get('/claude-test', async (req, res) => {
  console.log('\n=== CLAUDE API DEBUG ENDPOINT CALLED ===');
  
  try {
    // Test 1: Check environment variables
    console.log('\n--- ENVIRONMENT CHECK ---');
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    const envCheck = {
      claudeKeyExists: !!claudeApiKey,
      anthropicKeyExists: !!anthropicApiKey,
      claudeKeyLength: claudeApiKey ? claudeApiKey.length : 0,
      anthropicKeyLength: anthropicApiKey ? anthropicApiKey.length : 0,
      nodeEnv: process.env.NODE_ENV,
      apiKey: (claudeApiKey || anthropicApiKey) ? `${(claudeApiKey || anthropicApiKey)?.substring(0, 10)}...` : 'NONE'
    };
    
    console.log('Environment Check:', envCheck);
    
    const apiKey = claudeApiKey || anthropicApiKey;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'NO API KEY FOUND - This explains the Claude failure!',
        envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Test 2: Use imported AI service
    console.log('\n--- CLAUDE API TEST ---');
    const testPrompt = `Hello Claude! Please respond with exactly this JSON: {"test": "success", "message": "Claude API is working on Azure"}`;
    
    try {
      console.log('Making test API call to Claude...');
      
      const startTime = Date.now();
      const response = await aiResumeMatchingService.callClaudeAPI(testPrompt, 100);
      const duration = Date.now() - startTime;

      console.log('✅ Claude API call successful!');
      console.log('Response:', response);
      
      const testResult: any = {
        success: true,
        duration: `${duration}ms`,
        hasContent: !!response?.content,
        contentLength: response?.content?.length || 0,
        content: response?.content || 'No content'
      };
      
      // Test JSON parsing
      try {
        if (response?.content) {
          const parsed = JSON.parse(response.content);
          testResult.jsonParseSuccess = true;
          testResult.parsedContent = parsed;
        }
      } catch (parseError: any) {
        testResult.jsonParseSuccess = false;
        testResult.parseError = parseError.message;
      }

      return res.json({
        success: true,
        message: 'Claude API test completed successfully',
        envCheck,
        claudeTest: testResult,
        timestamp: new Date().toISOString()
      });

    } catch (claudeError: any) {
      console.log('❌ Claude API call failed:', claudeError.message);
      
      const errorDetails = {
        message: claudeError.message,
        code: claudeError.code,
        status: claudeError.response?.status,
        responseData: claudeError.response?.data,
        requestUrl: claudeError.config?.url,
        requestHeaders: claudeError.config?.headers
      };
      
      return res.status(500).json({
        success: false,
        message: 'Claude API call failed',
        envCheck,
        claudeError: errorDetails,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Debug endpoint failed',
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/debug/bunny-config
 * Check Bunny.net configuration status
 */
router.get('/bunny-config', async (req, res) => {
  try {
    console.log('🔍 Checking Bunny.net configuration...');
    
    // Check environment variables
    const envVars = {
      BUNNY_STORAGE_ZONE_NAME: process.env.BUNNY_STORAGE_ZONE_NAME,
      BUNNY_STORAGE_ACCESS_KEY: process.env.BUNNY_STORAGE_ACCESS_KEY ? '[PRESENT]' : '[MISSING]',
      BUNNY_STORAGE_HOSTNAME: process.env.BUNNY_STORAGE_HOSTNAME,
      BUNNY_CDN_URL: process.env.BUNNY_CDN_URL
    };
    
    console.log('📋 Environment variables:', envVars);
    
    res.json({
      success: true,
      data: {
        envVars,
        isConfigured: BunnyStorageService.isConfigured ? BunnyStorageService.isConfigured() : 'Method not available'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error checking Bunny.net config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Bunny.net configuration',
      details: error.message
    });
  }
});

/**
 * POST /api/debug/test-bunny-upload
 * Test Bunny.net upload with a dummy file
 */
router.post('/test-bunny-upload', async (req, res) => {
  try {
    console.log('🧪 Testing Bunny.net upload...');
    
    // Create a test PDF buffer
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const testResumeId = `test_${Date.now()}`;
    const testFileName = 'test_resume.pdf';
    
    console.log('📤 Uploading test file:', testFileName);
    
    // Test regular upload
    const uploadResult = await BunnyStorageService.uploadPDF(testPdfContent, testFileName, testResumeId);
    console.log('📊 Upload result:', uploadResult);
    
    // Test with retry
    const retryUploadResult = await BunnyStorageService.uploadPDFWithRetry(testPdfContent, testFileName, `${testResumeId}_retry`, 2);
    console.log('🔄 Retry upload result:', retryUploadResult);
    
    res.json({
      success: true,
      data: {
        testResumeId,
        uploadResult,
        retryUploadResult
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error testing Bunny.net upload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Bunny.net upload',
      details: error.message
    });
  }
});

/**
 * POST /api/debug/test-improved-bunny
 * Test the improved Bunny.net service
 */
router.post('/test-improved-bunny', async (req, res) => {
  try {
    console.log('🧪 Testing Improved Bunny.net service...');
    
    // Test connection first
    const connectionTest = await ImprovedBunnyStorageService.testConnection();
    console.log('🔗 Connection test:', connectionTest);
    
    if (!connectionTest.success) {
      return res.json({
        success: false,
        error: 'Connection test failed',
        details: connectionTest
      });
    }
    
    // Test upload
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const testResumeId = `test_improved_${Date.now()}`;
    const testFileName = 'test_resume_improved.pdf';
    
    console.log('📤 Testing upload...');
    const uploadResult = await ImprovedBunnyStorageService.uploadPDFWithRetry(testPdfContent, testFileName, testResumeId, 2);
    
    res.json({
      success: true,
      data: {
        connectionTest,
        uploadResult,
        testResumeId
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error testing improved Bunny service:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

/**
 * POST /api/debug/user-lookup
 * Debug user profile lookup for AI resume generation
 */
router.post('/user-lookup', async (req, res) => {
  try {
    console.log('🔍 Debug user lookup called with body:', req.body);
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('👤 Looking up user by email:', email);
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('📊 User found:', user ? `ID: ${user._id}, Name: ${(user as any).name || 'No name in User model'}` : 'NOT FOUND');
    
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        data: {
          email,
          userFound: false,
          studentFound: false
        }
      });
    }

    // Find student profile
    const studentProfile = await Student.findOne({ userId: user._id });
    console.log('🎓 Student profile found:', studentProfile ? `ID: ${studentProfile._id}` : 'NOT FOUND');
    
    // Prepare response data
    const responseData = {
      email,
      userFound: true,
      studentFound: !!studentProfile,
      user: {
        id: user._id,
        name: (user as any).name || 'No name in User model',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      student: studentProfile ? {
        id: studentProfile._id,
        userId: studentProfile.userId,
        // Basic info
        firstName: (studentProfile as any).firstName,
        lastName: (studentProfile as any).lastName,
        email: (studentProfile as any).email,
        phone: (studentProfile as any).phone,
        
        // Profile data
        profileCompleted: (studentProfile as any).profileCompleted,
        skills: (studentProfile as any).skills || [],
        education: (studentProfile as any).education || [],
        experience: (studentProfile as any).experience || [],
        projects: (studentProfile as any).projects || [],
        achievements: (studentProfile as any).achievements || [],
        certifications: (studentProfile as any).certifications || [],
        
        // Resume history
        aiResumeHistory: (studentProfile as any).aiResumeHistory || [],
        
        // Timestamps
        createdAt: studentProfile.createdAt,
        updatedAt: studentProfile.updatedAt
      } : null
    };

    console.log('📋 Response data prepared, user data available:', {
      userName: (user as any).name || 'No name in User model',
      hasStudentProfile: !!studentProfile,
      skillsCount: studentProfile ? ((studentProfile as any).skills || []).length : 0,
      educationCount: studentProfile ? ((studentProfile as any).education || []).length : 0,
      experienceCount: studentProfile ? ((studentProfile as any).experience || []).length : 0,
      resumeHistoryCount: studentProfile ? ((studentProfile as any).aiResumeHistory || []).length : 0
    });

    res.json({
      success: true,
      message: 'User lookup completed',
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in user lookup debug:', error);
    res.status(500).json({
      success: false,
      message: 'User lookup failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
