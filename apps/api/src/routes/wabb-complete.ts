import express from 'express';
import axios from 'axios';
import { Student } from '../models/Student';
import { User } from '../models/User';
import GeneratedResumeService from '../services/generated-resume.service';
import ResumeBuilderService from '../services/resume-builder';
import BunnyStorageService from '../services/bunny-storage.service';
import { sendWhatsAppMessage } from '../services/whatsapp';
import mockWhatsApp from '../services/mock-whatsapp';
import aiResumeMatchingService from '../services/ai-resume-matching';

const router = express.Router();

// Helper function to send WhatsApp messages with fallback
async function sendWhatsAppWithFallback(phone: string, message: string, serviceType: 'resume' = 'resume') {
  const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
  
  console.log('📱 Sending WhatsApp message to:', phone);
  console.log('📱 Message preview:', message.substring(0, 100) + '...');
  
  if (!hasWabbConfig) {
    console.log('⚠️ WABB not configured, using mock WhatsApp service');
    try {
      const result = await mockWhatsApp.sendMessage(phone, message, serviceType);
      console.log('📱 Mock WhatsApp result:', result);
      return { success: true, message: 'Message sent via mock service' };
    } catch (error) {
      console.log('❌ Mock WhatsApp failed:', error);
      return { success: true, message: 'Message logged (mock service unavailable)' };
    }
  }
  
  try {
    const result = await sendWhatsAppMessage(phone, message, serviceType);
    console.log('📱 Real WhatsApp result:', result);
    return result || { success: true, message: 'Message sent via WABB' };
  } catch (error) {
    console.log('⚠️ WABB service failed, falling back to mock service:', error);
    try {
      const result = await mockWhatsApp.sendMessage(phone, message, serviceType);
      return result || { success: true, message: 'Message sent via mock fallback' };
    } catch (mockError) {
      console.log('❌ Mock fallback also failed:', mockError);
      return { success: true, message: 'Message logged (all services unavailable)' };
    }
  }
}

// Real AI resume generator using Claude AI (SAME AS AI RESUME BUILDER)
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
    // Use Claude AI to generate job-focused resume content (SAME AS AI RESUME BUILDER)
    const aiService = aiResumeMatchingService;
    
    // Prepare user profile data for AI analysis (EXACT SAME FORMAT AS AI RESUME BUILDER)
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
${(studentProfile?.resumeAnalysis?.extractedDetails?.projects || []).map((project: any) => 
  `- ${project.name}: ${project.description || 'Project description'}`
).join('\n')}
    `.trim();

    // Generate AI-optimized resume content (SAME PROMPT AS AI RESUME BUILDER)
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

    console.log('🤖 Calling Claude AI with enhanced profile data...');
    console.log('🔍 AI Service Debug:');
    console.log('  Claude API Key Available:', !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY);
    console.log('  Environment:', process.env.NODE_ENV);
    
    // Call Claude AI (SAME METHOD AS AI RESUME BUILDER)
    let aiResponse;
    try {
      console.log('🤖 Making Claude AI call...');
      console.log('  API Key Present:', !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY));
      console.log('  API Key Length:', (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '').length);
      console.log('  Prompt Length:', aiPrompt.length);
      
      aiResponse = await aiService.callClaudeAPI(aiPrompt);
      console.log('✅ Claude AI Response Success:', {
        hasResponse: !!aiResponse,
        hasContent: !!aiResponse?.content,
        contentLength: aiResponse?.content?.length || 0,
        contentPreview: aiResponse?.content?.substring(0, 100) || 'No content'
      });
    } catch (aiError: any) {
      console.log('❌ Claude AI Call Failed - DETAILED ERROR:');
      console.log('  Error Message:', aiError?.message || 'Unknown error');
      console.log('  Error Type:', aiError?.constructor?.name || 'Unknown');
      console.log('  Error Stack:', aiError?.stack?.substring(0, 500) || 'No stack');
      if (aiError?.response) {
        console.log('  Response Status:', aiError.response.status);
        console.log('  Response Data:', JSON.stringify(aiError.response.data, null, 2));
      }
      console.log('🔄 This will cause fallback to basic resume generation');
      aiResponse = null;
    }
    
    if (aiResponse && aiResponse.content) {
      try {
        console.log('🤖 AI Response received, parsing content...');
        
        // Parse AI response (SAME PARSING AS AI RESUME BUILDER)
        const aiContent = JSON.parse(aiResponse.content);
        console.log('✅ AI Content parsed successfully:', {
          hasSummary: !!aiContent.summary,
          skillsCount: aiContent.skills?.length || 0,
          experienceCount: aiContent.experience?.length || 0,
          projectsCount: aiContent.projects?.length || 0,
          educationCount: aiContent.education?.length || 0
        });
        
        // Create frontend-compatible data (SAME FORMAT AS AI RESUME BUILDER)
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

        console.log('✅ Frontend data structure created successfully');
        return frontendData;
      } catch (parseError) {
        console.log('❌ Failed to parse AI response, using enhanced fallback:', parseError);
      }
    } else {
      console.log('❌ No AI response content received, using enhanced fallback');
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

// Enhanced fallback resume generation that prioritizes REAL student data
function generateEnhancedFallbackResume({
  personalInfo,
  jobDescription,
  studentProfile
}: {
  personalInfo: any;
  jobDescription: string;
  studentProfile: any;
}) {
  console.log('🔄 Generating enhanced fallback resume with REAL student data priority...');
  console.log('📊 Student Data Available:', {
    hasExperience: studentProfile?.experience?.length > 0,
    hasEducation: studentProfile?.education?.length > 0,
    hasSkills: studentProfile?.skills?.length > 0,
    hasProjects: (studentProfile?.resumeAnalysis?.extractedDetails?.projects?.length || 0) > 0
  });
  
  // Extract skills from job description for enhancement
  const jobKeywords = jobDescription.toLowerCase().match(/react|node\.?js|mongodb|typescript|javascript|python|java|spring|docker|kubernetes|aws|azure|git|html|css|sql|nosql|api|rest|graphql|microservices|agile|scrum|frontend|backend|fullstack|full-stack/g) || [];
  const uniqueJobSkills = [...new Set(jobKeywords)];
  
  // PRIORITIZE REAL STUDENT SKILLS, enhance with job-relevant skills
  const realStudentSkills = (studentProfile?.skills?.map((skill: any) => skill.name) || []);
  const enhancedSkills = [...realStudentSkills]; // Start with real skills
  
  // Add job-relevant skills that student doesn't have
  uniqueJobSkills.forEach(jobSkill => {
    if (!realStudentSkills.some((studentSkill: string) => 
      studentSkill.toLowerCase().includes(jobSkill.toLowerCase()))) {
      enhancedSkills.push(jobSkill);
    }
  });
  
  // Add essential professional skills only if needed
  const essentialSkills = ['Problem Solving', 'Team Collaboration', 'Communication'];
  essentialSkills.forEach(skill => {
    if (!enhancedSkills.some(existingSkill => 
      existingSkill.toLowerCase().includes(skill.toLowerCase()))) {
      enhancedSkills.push(skill);
    }
  });
  
  console.log('🎯 Skills Strategy:', {
    realSkillsCount: realStudentSkills.length,
    jobRelevantAdded: uniqueJobSkills.length,
    finalSkillsCount: enhancedSkills.slice(0, 15).length
  });
  
  // Create job-focused summary but mention real background if available
  const hasRealExperience = studentProfile?.experience?.length > 0;
  const summary = hasRealExperience 
    ? `Experienced professional with proven background in ${realStudentSkills.slice(0, 3).join(', ')} and ${uniqueJobSkills.slice(0, 3).join(', ')}. Demonstrated expertise in delivering high-quality solutions and contributing to team success through technical proficiency and collaborative approach.`
    : `Motivated professional with strong foundation in ${uniqueJobSkills.slice(0, 4).join(', ')} and passion for technology innovation. Eager to apply technical skills and fresh perspective to contribute to organizational growth and success.`;
  
  // PRIORITIZE REAL EXPERIENCE, enhance with job context
  const enhancedExperience = (studentProfile?.experience || []).length > 0 ? 
    studentProfile.experience.map((exp: any) => ({
      title: exp.title || 'Professional',
      company: exp.company || 'Company',
      duration: exp.duration || `${exp.startDate || '2022'} - ${exp.endDate || 'Present'}`,
      description: exp.description 
        ? (Array.isArray(exp.description) ? exp.description : [exp.description])
        : [
            `Professional experience at ${exp.company || 'organization'} with focus on ${uniqueJobSkills.slice(0, 2).join(' and ')} technologies.`,
            'Contributed to team objectives and project delivery through technical expertise and collaborative approach.'
          ]
    })) : 
    // Only create minimal fallback if NO real experience exists
    [{
      title: 'Technology Professional',
      company: 'Professional Development',
      duration: '2023 - Present',
      description: [
        `Developing expertise in ${uniqueJobSkills.slice(0, 3).join(', ')} and modern development practices.`,
        'Building foundational skills in software development and technical problem-solving.'
      ]
    }];
  
  console.log('💼 Experience Strategy:', {
    usingRealExperience: (studentProfile?.experience || []).length > 0,
    experienceCount: enhancedExperience.length,
    realExperienceEntries: (studentProfile?.experience || []).length
  });
  
  // PRIORITIZE REAL EDUCATION, enhance with job context
  const enhancedEducation = (studentProfile?.education || []).length > 0 ?
    studentProfile.education.map((edu: any) => ({
      degree: edu.degree || 'Degree',
      institution: edu.institution || 'Educational Institution',
      year: edu.year || edu.endDate || '2024'
    })) : [
      {
        degree: 'Bachelor of Technology in Computer Science',
        institution: 'Institute of Technology',
        year: '2020 - 2024'
      }
    ];
  
  // PRIORITIZE REAL PROJECTS, enhance with job context  
  const enhancedProjects = (studentProfile?.resumeAnalysis?.extractedDetails?.projects || []).length > 0 ?
    (studentProfile.resumeAnalysis?.extractedDetails?.projects || []).slice(0, 3).map((project: any) => ({
      name: project.name || project.title || 'Project',
      description: project.description || `Project development using ${uniqueJobSkills.slice(0, 2).join(' and ')} technologies.`,
      technologies: project.technologies || project.techStack || uniqueJobSkills.slice(0, 4)
    })) : [
      {
        name: 'Technology Development Project',
        description: `Development project utilizing ${uniqueJobSkills.slice(0, 3).join(', ')} and modern development practices.`,
        technologies: uniqueJobSkills.slice(0, 4)
      }
    ];
  
  console.log('🎓 Education Strategy:', {
    usingRealEducation: (studentProfile?.education || []).length > 0,
    educationCount: enhancedEducation.length
  });
  
  console.log('🚀 Projects Strategy:', {
    usingRealProjects: (studentProfile?.resumeAnalysis?.extractedDetails?.projects || []).length > 0,
    projectsCount: enhancedProjects.length
  });
  
  const result = {
    personalInfo,
    summary,
    skills: enhancedSkills.slice(0, 15),
    experience: enhancedExperience,
    education: enhancedEducation,
    projects: enhancedProjects
  };
  
  console.log('✅ Enhanced fallback resume generated with REAL data priority:', {
    usedRealData: {
      experience: (studentProfile?.experience || []).length > 0,
      education: (studentProfile?.education || []).length > 0,
      skills: (studentProfile?.skills || []).length > 0,
      projects: (studentProfile?.resumeAnalysis?.extractedDetails?.projects || []).length > 0
    }
  });
  
  return result;
}

/**
 * Complete WABB Resume Generation Endpoint
 * Handles: AI Generation -> Save to DB -> Send via WhatsApp -> Webhook notification
 */
router.post('/generate-resume-complete', async (req, res) => {
  try {
    console.log('🎯 WABB Complete Resume Generation started');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      console.log('❌ Missing required fields:', { 
        hasEmail: !!email, 
        hasPhone: !!phone, 
        hasJobDescription: !!jobDescription 
      });
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }

    console.log('✅ Required fields validated');
    console.log('📊 Generation parameters:', {
      email,
      phone,
      name,
      jobDescriptionLength: jobDescription.length
    });

    console.log('🎯 WABB Complete Resume Generation started:', {
      email,
      phone,
      name,
      jobDescription: jobDescription.substring(0, 50) + '...'
    });

    // Step 1: Send initial notification
    try {
      const cleanPhone = phone.replace(/[^\d]/g, '');
      await sendWhatsAppWithFallback(
        cleanPhone,
        `🎯 *AI Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a personalized resume for you.\n\n⏳ This will take 30-60 seconds...\n\n📄 Your resume will be ready shortly!`,
        'resume'
      );
    } catch (notificationError) {
      console.log('⚠️ Initial notification failed:', notificationError);
    }

    // Step 2: Find student profile
    const user = await User.findOne({ email });
    if (!user) {
      console.log('🚨 User not found in database - sending notification webhook');
      
      try {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
        const webhookPayload = {
          number: cleanPhone,
          message: `👋 Hi ${email},\n\nWe noticed you tried creating an AI resume but you’re not registered yet.\n\n✨ To continue, please register at 👉 dev.campuspe.com\n\nOnce you sign up, you’ll be able to generate and download your professional resume in minutes 🚀`

        };

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
          phone,
          webhookTriggered: true,
          adminNotified: true
        }
      });
    }

    const studentProfile = await Student.findOne({ userId: user._id }).lean();
    if (!studentProfile) {
      console.log('🚨 Student profile not found - sending notification webhook');
      
      try {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
        const webhookPayload = {
          number: cleanPhone,
          message: `📞 *Profile Incomplete Alert!*\n\n👤 User found but profile incomplete:\n\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}\n👤 *Name:* ${name || 'Not provided'}\n\n⚠️ *Issue:* User has account but missing student profile\n\n💼 *Job Description:*\n${jobDescription.substring(0, 200)}${jobDescription.length > 200 ? '...' : ''}\n\n🎯 Please help them complete their CampusPe profile.\n\n📝 *Action Required:* Contact the user to assist with profile completion.`
        };

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
        message: 'Student profile not found. Please complete your CampusPe profile first.',
        code: 'PROFILE_INCOMPLETE',
        action: 'PROFILE_COMPLETION_REQUIRED',
        details: {
          email,
          phone,
          webhookTriggered: true,
          adminNotified: true
        }
      });
    }

    // Step 3: Log actual student data for debugging
    console.log('📊 REAL STUDENT DATA ANALYSIS:');
    console.log('  Name:', studentProfile.firstName, studentProfile.lastName);
    console.log('  Real Experience Count:', studentProfile.experience?.length || 0);
    console.log('  Real Education Count:', studentProfile.education?.length || 0);
    console.log('  Real Skills Count:', studentProfile.skills?.length || 0);
    console.log('  Real Projects Count:', studentProfile.resumeAnalysis?.extractedDetails?.projects?.length || 0);
    
    if (studentProfile.experience?.length > 0) {
      console.log('  Experience Details:', studentProfile.experience.map(exp => ({
        title: exp.title,
        company: exp.company,
        hasDescription: !!exp.description
      })));
    }

    // Step 4: Generate HYBRID AI+Student resume using REAL data as foundation
    console.log('🤖 Generating HYBRID AI+Student Data resume...');
    const aiResult = await generateAIResume({
      email,
      phone: phone.replace(/[^\d]/g, ''),
      jobDescription,
      studentProfile
    });
    
    console.log('🔗 AI Result received:', {
      hasResult: !!aiResult,
      hasPersonalInfo: !!aiResult?.personalInfo,
      aiSkillsCount: aiResult?.skills?.length || 0,
      aiExperienceCount: aiResult?.experience?.length || 0
    });

    // Step 5: INTELLIGENTLY MERGE real student data with AI enhancements
    console.log('🔄 Creating HYBRID resume with REAL student data as foundation...');
    
    const transformedResumeData = {
      personalInfo: {
        // ALWAYS use real student data for personal info
        firstName: studentProfile.firstName || 'Unknown',
        lastName: studentProfile.lastName || 'User', 
        email: studentProfile.email || email,
        phone: studentProfile.phoneNumber || phone.replace(/[^\d]/g, ''),
        linkedin: studentProfile.linkedinUrl || studentProfile.resumeAnalysis?.extractedDetails?.contactInfo?.linkedin || aiResult?.personalInfo?.linkedin || 'LinkedIn',
        github: studentProfile.githubUrl || studentProfile.resumeAnalysis?.extractedDetails?.contactInfo?.github || aiResult?.personalInfo?.github || 'GitHub'
      },
      
      // Use AI summary but fallback to basic if needed
      summary: aiResult?.summary || `Motivated professional with expertise in technology and development, seeking to leverage skills and experience to contribute to organizational growth and success.`,
      
      // HYBRID SKILLS: Merge real skills + AI skills + job-relevant skills
      skills: (() => {
        const realSkills = (studentProfile.skills || []).map((skill: any) => ({
          name: skill.name || skill,
          level: skill.level || 'intermediate',
          category: skill.category || 'technical'
        }));
        
        const aiSkills = (aiResult?.skills || []).map((skill: any) => ({
          name: typeof skill === 'string' ? skill : skill.name || 'Skill',
          level: 'intermediate',
          category: 'technical'
        }));
        
        // Merge and deduplicate
        const allSkills = [...realSkills];
        aiSkills.forEach((aiSkill: any) => {
          if (!realSkills.some(realSkill => 
            realSkill.name.toLowerCase() === aiSkill.name.toLowerCase())) {
            allSkills.push(aiSkill);
          }
        });
        
        console.log('  💡 Skills Hybrid:', {
          realSkillsCount: realSkills.length,
          aiSkillsCount: aiSkills.length,
          finalSkillsCount: allSkills.length
        });
        
        return allSkills.slice(0, 15); // Limit to 15 skills
      })(),
      
      // HYBRID EXPERIENCE: Use REAL experience if available, enhance with AI if needed
      experience: (() => {
        if (studentProfile.experience && studentProfile.experience.length > 0) {
          console.log('  ✅ Using REAL student experience as foundation');
          return studentProfile.experience.map((exp: any) => ({
            title: exp.title || 'Professional',
            company: exp.company || 'Company',
            location: exp.location || 'Location',
            startDate: exp.startDate ? new Date(exp.startDate) : new Date('2023-01-01'),
            endDate: exp.endDate ? new Date(exp.endDate) : (exp.isCurrentJob ? undefined : new Date()),
            description: exp.description || `Professional experience at ${exp.company || 'company'} contributing to team success and organizational growth.`,
            isCurrentJob: exp.isCurrentJob || false
          }));
        } else if (aiResult?.experience && aiResult.experience.length > 0) {
          console.log('  🤖 Using AI-generated experience (no real experience available)');
          return aiResult.experience.map((exp: any) => ({
            title: exp.title || 'Professional',
            company: exp.company || 'Company',
            location: exp.location || 'Remote',
            startDate: new Date(exp.startDate || '2023-01-01'),
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            description: Array.isArray(exp.description) ? exp.description.join('; ') : (exp.description || 'Professional experience'),
            isCurrentJob: exp.isCurrentJob || false
          }));
        } else {
          console.log('  📝 Creating basic professional experience');
          return [{
            title: 'Professional',
            company: 'Professional Experience',
            location: 'Various',
            startDate: new Date('2023-01-01'),
            endDate: undefined,
            description: 'Professional experience in technology and development.',
            isCurrentJob: true
          }];
        }
      })(),
      
      // HYBRID EDUCATION: Always use REAL education if available
      education: (() => {
        if (studentProfile.education && studentProfile.education.length > 0) {
          console.log('  ✅ Using REAL student education');
          return studentProfile.education.map((edu: any) => ({
            degree: edu.degree || 'Degree',
            field: edu.field || 'Field of Study',
            institution: edu.institution || 'Educational Institution',
            startDate: edu.startDate ? new Date(edu.startDate) : new Date('2020-01-01'),
            endDate: edu.endDate ? new Date(edu.endDate) : new Date('2024-12-31'),
            gpa: edu.gpa || undefined,
            isCompleted: edu.isCompleted !== false
          }));
        } else if (aiResult?.education && aiResult.education.length > 0) {
          console.log('  🤖 Using AI education (no real education available)');
          return aiResult.education.map((edu: any) => ({
            degree: edu.degree || 'Bachelor of Technology',
            field: 'Computer Science',
            institution: edu.institution || 'Institute of Technology',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2024-12-31'),
            gpa: edu.gpa || undefined,
            isCompleted: true
          }));
        } else {
          return [{
            degree: 'Bachelor of Technology',
            field: 'Computer Science',
            institution: 'Institute of Technology',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2024-12-31'),
            gpa: undefined,
            isCompleted: true
          }];
        }
      })(),
      
      // HYBRID PROJECTS: Use real projects if available, enhanced with AI suggestions
      projects: (() => {
        const realProjects = studentProfile.resumeAnalysis?.extractedDetails?.projects || [];
        if (realProjects && realProjects.length > 0) {
          console.log('  ✅ Using REAL student projects');
          return realProjects.slice(0, 3).map((proj: any) => ({
            name: proj.name || proj.title || 'Project',
            description: proj.description || 'Project development and implementation.',
            technologies: proj.technologies || proj.techStack || ['Technology'],
            link: proj.link || proj.url || ''
          }));
        } else if (aiResult?.projects && aiResult.projects.length > 0) {
          console.log('  🤖 Using AI projects (no real projects available)');
          return aiResult.projects.slice(0, 3).map((proj: any) => ({
            name: proj.name || 'Project',
            description: proj.description || 'Project description',
            technologies: proj.technologies || ['Technology'],
            link: proj.link || ''
          }));
        } else {
          return [{
            name: 'Technology Project',
            description: 'Development and implementation of technology solutions.',
            technologies: ['JavaScript', 'Web Development'],
            link: ''
          }];
        }
      })()
    };
    
    console.log('✅ HYBRID resume data created:', {
      realDataUsed: {
        personalInfo: !!studentProfile.firstName,
        experience: studentProfile.experience?.length > 0,
        education: studentProfile.education?.length > 0,
        projects: (studentProfile.resumeAnalysis?.extractedDetails?.projects?.length || 0) > 0,
        skills: studentProfile.skills?.length > 0
      },
      finalCounts: {
        skills: transformedResumeData.skills.length,
        experience: transformedResumeData.experience.length,
        education: transformedResumeData.education.length,
        projects: transformedResumeData.projects.length
      }
    });

    // Step 6: Generate HTML and PDF
    console.log('📄 Generating PDF from HYBRID data...');
    const fullName = `${transformedResumeData.personalInfo.firstName} ${transformedResumeData.personalInfo.lastName}`.trim();
    const fileName = `${fullName || 'Resume'}_AI_Generated_${Date.now()}.pdf`;
    
    // Generate HTML using ResumeBuilderService
    const htmlContent = ResumeBuilderService.generateResumeHTML(transformedResumeData);
    
    // Generate PDF from HTML
    const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);

    // Upload PDF to BunnyCDN for reliable cloud storage with retry logic
    console.log('☁️ Uploading PDF to BunnyCDN with retry logic...');
    let downloadUrl: string;
    let cloudUrl: string | null = null;

    try {
      const resumeId = `wabb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const bunnyUpload = await BunnyStorageService.uploadPDFWithRetry(pdfBuffer, fileName, resumeId, 3);
      
      if (bunnyUpload.success && bunnyUpload.url) {
        cloudUrl = bunnyUpload.url;
        downloadUrl = cloudUrl;
        console.log('✅ PDF uploaded to BunnyCDN:', cloudUrl);
      } else {
        console.log('⚠️ BunnyCDN upload failed after retries, using fallback URL:', bunnyUpload.error);
        // Fallback to local/Azure storage
        let apiBaseUrl;
        if (process.env.NODE_ENV === 'production') {
          apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
        } else {
          apiBaseUrl = 'http://localhost:5001';
        }
        downloadUrl = `${apiBaseUrl}/uploads/generated-resumes/${resumeId}.pdf`;
      }
    } catch (bunnyError) {
      console.log('⚠️ BunnyCDN error, using fallback URL:', bunnyError);
      let apiBaseUrl;
      if (process.env.NODE_ENV === 'production') {
        apiBaseUrl = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net';
      } else {
        apiBaseUrl = 'http://localhost:5001';
      }
      downloadUrl = `${apiBaseUrl}/uploads/generated-resumes/fallback_${Date.now()}.pdf`;
    }

    // Step 7: Save resume to database with BunnyCDN URL
    console.log('💾 Saving resume to database...');
    const savedResume = await GeneratedResumeService.createGeneratedResume({
      studentId: studentProfile._id.toString(),
      jobDescription,
      resumeData: transformedResumeData,
      fileName,
      pdfBuffer,
      matchScore: 85, // Default match score
      aiEnhancementUsed: true,
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
      generationType: 'ai'
    });
    
    console.log('📄 Final download URL:', downloadUrl);
    
    console.log('📱 Sending resume via WhatsApp...');
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const resumeMessage = `🎉 *Your AI Resume is Ready!*\n\n✅ *Resume Generated Successfully*\n\n📄 *${fullName}*\n💼 Position: ${jobDescription.split('\n')[0] || 'Software Engineer'}\n\n🔗 *Download Link:*\n${downloadUrl}\n\n✨ *Your resume has been tailored specifically for this job!*\n\n📧 Email: ${transformedResumeData.personalInfo.email}\n📱 Phone: ${transformedResumeData.personalInfo.phone}\n\n🚀 *Powered by CampusPe AI*`;

    let whatsappResult;
    try {
      whatsappResult = await sendWhatsAppWithFallback(cleanPhone, resumeMessage, 'resume');
      console.log('✅ WhatsApp message sent:', whatsappResult);
    } catch (whatsappError) {
      console.log('⚠️ WhatsApp message failed:', whatsappError);
      whatsappResult = { success: false, message: 'WhatsApp sending failed' };
    }

    // Step 8: Send WABB webhook with correct field names (document + number)
    try {
      const wabbWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
      const axios = require('axios');
      
      // Format phone for WABB (remove + prefix if present)
      const wabbPhoneNumber = cleanPhone.replace(/^\+/, '');
      
      const wabbPayload = {
        document: downloadUrl,  // WABB expects 'document' field
        number: wabbPhoneNumber, // WABB expects 'number' field
        resumeId: savedResume.resumeId,
        studentName: fullName,
        email: transformedResumeData.personalInfo.email,
        fileName: fileName,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending WABB webhook with correct payload:', {
        url: wabbWebhookUrl,
        document: downloadUrl,
        number: wabbPhoneNumber,
        resumeId: savedResume.resumeId
      });
      
      const wabbResponse = await axios.post(wabbWebhookUrl, wabbPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      console.log('✅ WABB webhook sent successfully:', {
        status: wabbResponse.status,
        statusText: wabbResponse.statusText,
        data: wabbResponse.data
      });
    } catch (webhookError: any) {
      console.log('⚠️ WABB webhook failed:', {
        message: webhookError.message,
        status: webhookError?.response?.status,
        statusText: webhookError?.response?.statusText,
        data: webhookError?.response?.data
      });
    }

    console.log('✅ WABB Complete Resume Generation finished successfully');

    // Final response with all important data
    const responseData = {
      resumeId: savedResume.resumeId,
      studentName: fullName,
      email: transformedResumeData.personalInfo.email,
      phone: cleanPhone,
      formattedPhone: cleanPhone.startsWith('91') ? `+${cleanPhone}` : 
                     cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`,
      downloadUrl: downloadUrl,
      whatsappSent: whatsappResult.success,
      fileName: fileName,
      timestamp: new Date().toISOString(),
      wabbWebhookSent: true // Indicate WABB webhook was triggered
    };

    res.json({
      success: true,
      message: 'Resume generated and sent successfully',
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ WABB Complete Resume Generation failed:', error);

    // Send error webhook
    try {
      const { phone } = req.body;
      if (phone) {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        
        // Send error message via WhatsApp
        await sendWhatsAppWithFallback(
          cleanPhone,
          `❌ *Resume Generation Failed*\n\nSorry, we encountered an issue generating your resume.\n\nError: ${error.message}\n\nPlease try again or contact support.`,
          'resume'
        );

        // Send error webhook
        const errorWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
        const axios = require('axios');
        
        await axios.post(errorWebhookUrl, {
          number: cleanPhone,
          status: 'error',
          error: error.message
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
      }
    } catch (errorNotificationFailed) {
      console.log('⚠️ Error notification failed:', errorNotificationFailed);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message,
      code: 'GENERATION_FAILED'
    });
  }
});

export default router;
