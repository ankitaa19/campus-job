// Helper to export generateAIResume function for use in WABB endpoint
const { aiResumeMatchingService } = require('../services/ai-resume-matching');
const { skillNormalizationService } = require('../services/skill-normalization');

// Helper function to generate AI resume using Claude AI (same as web version)
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
${studentProfile?.linkedinUrl ? `LinkedIn: ${studentProfile.linkedinUrl}` : ''}
${studentProfile?.githubUrl ? `GitHub: ${studentProfile.githubUrl}` : ''}

Skills: ${studentProfile?.skills?.map((s: any) => s.name || s).join(', ') || 'Not specified'}
Experience: ${studentProfile?.experience?.length || 0} entries
Education: ${studentProfile?.education?.length || 0} entries
Projects: ${studentProfile?.projects?.length || 0} entries

${studentProfile?.bio ? `Bio: ${studentProfile.bio}` : ''}
`;

    // Generate AI resume content
    const aiResumeResult = await aiService.generateTailoredResume(userProfileText, jobDescription);
    
    if (!aiResumeResult.success || !aiResumeResult.resumeData) {
      throw new Error(aiResumeResult.message || 'Failed to generate AI resume content');
    }

    const aiResumeData = aiResumeResult.resumeData;

    // Normalize skills using the skill normalization service
    let normalizedSkills = [];
    if (aiResumeData.skills && aiResumeData.skills.length > 0) {
      const skillsToNormalize = aiResumeData.skills.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name || skill
      );
      
      try {
        const normalizedResult = await skillNormalizationService.normalizeSkills(skillsToNormalize);
        normalizedSkills = normalizedResult.success ? normalizedResult.normalizedSkills : skillsToNormalize;
      } catch (error) {
        console.log('Skill normalization failed, using original skills:', error);
        normalizedSkills = skillsToNormalize;
      }
    }

    // Return the same structure as the web version
    return {
      personalInfo,
      summary: aiResumeData.summary || '',
      skills: normalizedSkills,
      experience: aiResumeData.experience || [],
      education: aiResumeData.education || [],
      projects: aiResumeData.projects || []
    };

  } catch (error: any) {
    console.error('Error in generateAIResume:', error);
    throw new Error(`Failed to generate AI resume: ${error.message}`);
  }
}

module.exports = { generateAIResume };
