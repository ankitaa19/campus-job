const express = require('express');
const router = express.Router();

// Debug endpoint that uses the EXACT same logic as WABB but with detailed logging
router.post('/debug-wabb-generation', async (req, res) => {
    console.log('\n=== WABB DEBUG GENERATION START ===');
    
    try {
        const { email, phone, jobDescription } = req.body;
        
        console.log('Input Parameters:', {
            email: email,
            phone: phone,
            jobDescriptionLength: jobDescription?.length || 0
        });

        // Import required services (same as WABB)
        const Student = require('../models/Student');
        const aiResumeMatchingService = require('../services/ai-resume-matching').default;
        
        // Step 1: Get student profile (same as WABB)
        console.log('\n--- STEP 1: STUDENT PROFILE LOOKUP ---');
        let studentProfile = null;
        try {
            studentProfile = await Student.findOne({ email }).lean();
            console.log('Student Profile Found:', !!studentProfile);
            if (studentProfile) {
                console.log('Profile Details:', {
                    name: `${studentProfile.firstName} ${studentProfile.lastName}`,
                    experienceCount: studentProfile.experience?.length || 0,
                    educationCount: studentProfile.education?.length || 0,
                    skillsCount: studentProfile.skills?.length || 0,
                    hasResumeAnalysis: !!studentProfile.resumeAnalysis
                });
            }
        } catch (profileError) {
            console.log('Profile Lookup Error:', profileError.message);
        }

        // Step 2: Test AI Resume Generation (same function as WABB)
        console.log('\n--- STEP 2: AI RESUME GENERATION TEST ---');
        
        // Extract personal information with proper structure for PDF generation
        const fullName = studentProfile ? 
            `${studentProfile.firstName} ${studentProfile.lastName}`.trim() :
            'Your Name';
        
        const personalInfo = {
            name: fullName,
            firstName: studentProfile?.firstName || 'Your',
            lastName: studentProfile?.lastName || 'Name',
            email,
            phone,
            location: studentProfile?.address || undefined,
            linkedin: studentProfile?.linkedinUrl || undefined,
            github: studentProfile?.githubUrl || undefined
        };

        console.log('Personal Info Created:', personalInfo);

        // Step 3: Prepare user profile for Claude AI
        console.log('\n--- STEP 3: CLAUDE AI PROFILE PREPARATION ---');
        
        const userProfileText = `
Name: ${personalInfo.name}
Contact: ${email}, ${phone}
${studentProfile?.address ? `Location: ${studentProfile.address}` : ''}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp) => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${Array.isArray(exp.description) ? exp.description.join(', ') : (exp.description || 'No description')}`
).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu) => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`
).join('\n')}

SKILLS:
${[
  ...(studentProfile?.skills?.map((skill) => skill.name) || []),
  ...(studentProfile?.resumeAnalysis?.skills || [])
].join(', ')}

PROJECTS:
${(studentProfile?.projects || []).map((project) => 
  `- ${project.name}: ${project.description || 'Project description'}`
).join('\n')}
        `.trim();

        console.log('User Profile Text Length:', userProfileText.length);
        console.log('User Profile Preview:', userProfileText.substring(0, 300) + '...');

        // Step 4: Claude AI Test
        console.log('\n--- STEP 4: CLAUDE AI CALL TEST ---');
        
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

        console.log('AI Prompt Length:', aiPrompt.length);

        let aiResponse = null;
        let aiError = null;
        
        try {
            console.log('🤖 Calling Claude AI...');
            const startTime = Date.now();
            aiResponse = await aiResumeMatchingService.callClaudeAPI(aiPrompt);
            const duration = Date.now() - startTime;
            
            console.log('✅ Claude AI Response Success:', {
                duration: `${duration}ms`,
                hasResponse: !!aiResponse,
                hasContent: !!aiResponse?.content,
                contentLength: aiResponse?.content?.length || 0,
                contentPreview: aiResponse?.content?.substring(0, 200) || 'No content'
            });
            
        } catch (claudeError) {
            aiError = claudeError;
            console.log('❌ Claude AI Call Failed:', {
                message: claudeError.message,
                stack: claudeError.stack?.substring(0, 300)
            });
        }

        // Step 5: Test JSON Parsing
        console.log('\n--- STEP 5: JSON PARSING TEST ---');
        
        let aiContent = null;
        let parseError = null;
        
        if (aiResponse && aiResponse.content) {
            try {
                aiContent = JSON.parse(aiResponse.content);
                console.log('✅ JSON Parsing Success:', {
                    hasSummary: !!aiContent.summary,
                    summaryLength: aiContent.summary?.length || 0,
                    skillsCount: aiContent.skills?.length || 0,
                    experienceCount: aiContent.experience?.length || 0,
                    projectsCount: aiContent.projects?.length || 0,
                    educationCount: aiContent.education?.length || 0
                });
            } catch (jsonError) {
                parseError = jsonError;
                console.log('❌ JSON Parsing Failed:', jsonError.message);
                console.log('Raw Content:', aiResponse.content);
            }
        }

        // Step 6: Return detailed diagnostic
        res.json({
            success: true,
            message: 'WABB Debug Generation Complete',
            diagnostics: {
                studentProfileFound: !!studentProfile,
                studentProfileDetails: studentProfile ? {
                    name: personalInfo.name,
                    experienceCount: studentProfile.experience?.length || 0,
                    educationCount: studentProfile.education?.length || 0,
                    skillsCount: studentProfile.skills?.length || 0
                } : null,
                userProfileTextLength: userProfileText.length,
                claudeApiCall: {
                    attempted: true,
                    success: !!aiResponse && !aiError,
                    error: aiError?.message || null,
                    responseLength: aiResponse?.content?.length || 0
                },
                jsonParsing: {
                    attempted: !!aiResponse?.content,
                    success: !!aiContent && !parseError,
                    error: parseError?.message || null,
                    parsedContent: aiContent
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Debug generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
