import axios from 'axios';
import { IStudent } from '../models/Student';
import { IJob } from '../models/Job';

export interface ResumeMatchResult {
  matchScore: number; // 0-100
  explanation: string;
  suggestions: string[];
  skillsMatched: string[];
  skillsGap: string[];
  usedFallback?: boolean;
  hardSkillsScore: number;
  seniorityScore: number;
  domainScore: number;
  experienceYearsFound: number | null;
  experienceMatchStatus: 'EXCEEDS' | 'MATCHES' | 'UNDERQUALIFIED';
  conciseJustification: string;
}

export interface ResumeImprovementSuggestion {
  section: string;
  currentText: string;
  suggestedText: string;
  reason: string;
}

// Comprehensive AI analysis result interface
export interface ComprehensiveResumeAnalysis {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
    portfolio?: string;
    summary?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    category: 'technical' | 'business' | 'operational' | 'soft' | 'language';
  }>;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string | 'Present';
    description: string;
    isCurrentJob: boolean;
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    startYear?: number;
    endYear?: number;
    gpa?: string;
    grade?: string;
    gradingType?: 'gpa' | 'percentage';
    isCompleted: boolean;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    link?: string;
  }>;
  certifications?: Array<{
    name: string;
    organization?: string;
    year?: number;
  }>;
  languages?: Array<{
    name: string;
    proficiency?: string;
  }>;
  jobPreferences: {
    preferredRoles: string[];
    preferredIndustries: string[];
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
    workMode: 'remote' | 'onsite' | 'hybrid' | 'any';
    expectedSalaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
  };
  analysisMetadata: {
    confidence: number; // 0-100
    extractionMethod: 'AI' | 'fallback' | 'error';
    totalYearsExperience: number;
    primarySkillCategory: string;
    suggestedJobCategory: string;
    analysisDate: Date;
    provider?: string;
    creditStatus?: 'available' | 'fallback' | 'exhausted';
    exhaustedProviders?: string[];
    providerWarnings?: string[];
  };
}

class AIResumeMatchingService {
  private claudeApiKey: string = '';
  private claudeDisabled = false;
  private lastApiCall: number = 0;
  private readonly minDelayBetweenCalls = 1000; // 1 second minimum delay for Claude

  constructor() {
    // Check if Claude API key is available
    const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.claudeApiKey = claudeApiKey || '';
    if (!this.claudeApiKey) {
      console.warn('⚠️ Claude API key not found in environment variables. Please set CLAUDE_API_KEY or ANTHROPIC_API_KEY');
    }
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minDelayBetweenCalls) {
      const delay = this.minDelayBetweenCalls - timeSinceLastCall;
      console.log(`⏱️ Rate limiting: waiting ${delay}ms before next Claude API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastApiCall = Date.now();
  }

  /**
   * Generic Claude API call method
   */
  async callClaudeAPI(prompt: string, maxTokens: number = 2000): Promise<any> {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not available');
    }

    await this.enforceRateLimit();

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: maxTokens,
          messages: [{
            role: 'user',
            content: prompt
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      if (response.data?.content?.[0]?.text) {
        return {
          content: response.data.content[0].text.trim(),
          success: true
        };
      } else {
        throw new Error('Invalid response from Claude API');
      }
    } catch (error: any) {
      console.error('Claude API call failed:', error.message);
      throw error;
    }
  }

  /**
   * COMPREHENSIVE AI-POWERED RESUME ANALYSIS
   * Analyzes complete resume text and extracts all relevant information
   */
  async analyzeCompleteResume(resumeText: string): Promise<ComprehensiveResumeAnalysis> {
    console.log('🤖 Starting comprehensive resume analysis...');
    console.log('📝 Resume text length:', resumeText.length, 'characters');

    try {
      // Check if Claude API key is available before attempting API call
      if (this.claudeApiKey && this.claudeApiKey.trim().length > 0) {
        console.log('🎯 Attempting Claude AI analysis...');
        
        await this.enforceRateLimit();

        // Allow enough time and output space for projects, certifications and
        // education in addition to the core resume sections.
        const claudeTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Claude API timeout')), 25000);
        });

        const claudePromise = axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-3-haiku-20240307',
            max_tokens: 4000,
            messages: [{
              role: 'user',
      content: `Analyze this resume comprehensively and extract only information explicitly present in it. Return ONLY a valid JSON object with the following structure:

{
  "personalInfo": {
    "name": "Full Name",
    "email": "email if found",
    "phone": "phone if found",
    "location": "location if found",
    "linkedIn": "LinkedIn URL if found",
    "github": "GitHub URL if found",
    "portfolio": "portfolio URL if found",
    "summary": "professional summary exactly as stated",
    "dateOfBirth": "date of birth if explicitly stated",
    "gender": "gender if explicitly stated"
  },
  "skills": [
    {
      "name": "Skill Name",
      "level": "beginner|intermediate|advanced|expert",
      "category": "technical|business|operational|soft|language"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or Present",
      "description": "Job description and achievements",
      "isCurrentJob": true
    }
  ],
  "education": [
    {
      "degree": "Degree Type",
      "field": "Field of Study",
      "institution": "Institution Name",
      "startYear": 2020,
      "endYear": 2024,
      "gpa": "GPA if mentioned",
      "isCompleted": true
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["technology explicitly mentioned"],
      "link": "project URL if found"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "organization": "Issuing organization",
      "year": 2024
    }
  ],
  "languages": [
    {
      "name": "Language",
      "proficiency": "proficiency if explicitly stated"
    }
  ],
  "jobPreferences": {
    "preferredRoles": ["roles explicitly stated in the resume"],
    "preferredIndustries": ["industries explicitly stated in the resume"],
    "experienceLevel": "entry|mid|senior|executive",
    "workMode": "remote|onsite|hybrid|any"
  },
  "analysisMetadata": {
    "confidence": 95,
    "extractionMethod": "AI",
    "totalYearsExperience": 5,
    "primarySkillCategory": "technical",
    "suggestedJobCategory": "Software Development"
  }
}

Resume Text:
${resumeText}

IMPORTANT:
- Never invent, infer, assume, or supply placeholder values.
- For a missing scalar value use null or an empty string.
- For a missing section use an empty array.
- Do not infer job preferences from skills or experience.
- Preserve the resume's facts exactly.
- Return ONLY the JSON object, no additional text or formatting.`
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.claudeApiKey,
              'anthropic-version': '2023-06-01'
            },
            timeout: 25000
          }
        );

        const response = await Promise.race([claudePromise, claudeTimeout]) as any;

        if (response?.data?.content?.[0]?.text) {
          const aiResponseText = response.data.content[0].text.trim();
          console.log('✅ Claude AI response received');
          console.log('📄 AI Response preview:', aiResponseText.substring(0, 200) + '...');

          try {
            const cleanedResponse = aiResponseText
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/, '')
              .trim();
            const aiAnalysis = JSON.parse(cleanedResponse);
            aiAnalysis.personalInfo = aiAnalysis.personalInfo || {};
            aiAnalysis.personalInfo.summary = aiAnalysis.personalInfo.summary || aiAnalysis.summary || aiAnalysis.bio || '';
            aiAnalysis.skills = Array.isArray(aiAnalysis.skills) ? aiAnalysis.skills : [];
            aiAnalysis.experience = Array.isArray(aiAnalysis.experience) ? aiAnalysis.experience : [];
            aiAnalysis.education = Array.isArray(aiAnalysis.education)
              ? aiAnalysis.education
              : (Array.isArray(aiAnalysis.qualifications) ? aiAnalysis.qualifications : []);
            aiAnalysis.projects = Array.isArray(aiAnalysis.projects) ? aiAnalysis.projects : [];
            aiAnalysis.certifications = Array.isArray(aiAnalysis.certifications)
              ? aiAnalysis.certifications
              : (Array.isArray(aiAnalysis.achievements) ? aiAnalysis.achievements : []);
            if (typeof aiAnalysis.languages === 'string') {
              aiAnalysis.languages = aiAnalysis.languages.split(/[,;|]/).map((name: string) => ({ name: name.trim(), proficiency: '' })).filter((item: any) => item.name);
            } else {
              aiAnalysis.languages = Array.isArray(aiAnalysis.languages) ? aiAnalysis.languages : [];
            }

            // AI responses sometimes omit a section even though it is present in
            // the resume. Fill only blank sections using deterministic parsing.
            const localAnalysis = this.comprehensiveFallbackAnalysis(resumeText);
            if (!aiAnalysis.personalInfo.summary) aiAnalysis.personalInfo.summary = localAnalysis.personalInfo.summary || '';
            if (!aiAnalysis.education.length) aiAnalysis.education = localAnalysis.education;
            if (!aiAnalysis.projects.length) aiAnalysis.projects = localAnalysis.projects || [];
            if (!aiAnalysis.certifications.length) aiAnalysis.certifications = localAnalysis.certifications || [];
            if (!aiAnalysis.languages.length) aiAnalysis.languages = localAnalysis.languages || [];
            aiAnalysis.analysisMetadata = aiAnalysis.analysisMetadata || {};
            aiAnalysis.analysisMetadata.analysisDate = new Date();
            aiAnalysis.analysisMetadata.extractionMethod = 'AI';
            
            console.log('🎉 Claude AI analysis successful!');
            console.log('📊 Analysis summary:', {
              skillsFound: aiAnalysis.skills?.length || 0,
              experienceEntries: aiAnalysis.experience?.length || 0,
              educationEntries: aiAnalysis.education?.length || 0,
              confidence: aiAnalysis.analysisMetadata?.confidence || 0
            });
            
            return aiAnalysis;
          } catch (parseError) {
            console.error('❌ Failed to parse Claude AI response as JSON:', parseError);
            console.log('🔍 Raw AI response:', aiResponseText);
            throw new Error('Invalid JSON response from Claude AI');
          }
        } else {
          throw new Error('No content in Claude AI response');
        }

      } else {
        console.log('⚠️ No Claude API key available, skipping AI analysis and using enhanced local fallback');
      }

    } catch (error) {
      console.error('❌ Claude AI analysis failed:', error);
      console.log('🔄 Falling back to enhanced local analysis...');
    }

    // Enhanced fallback analysis with comprehensive skill detection
    return this.comprehensiveFallbackAnalysis(resumeText);
  }

  /**
   * Enhanced fallback analysis when AI is not available
   */
  private comprehensiveFallbackAnalysis(resumeText: string): ComprehensiveResumeAnalysis {
    console.log('🔧 Starting comprehensive fallback analysis...');
    
    const text = resumeText.toLowerCase();
    
    // Extract personal information
    const personalInfo = this.extractPersonalInfo(resumeText);
    
    // Comprehensive skill detection
    const skills = this.extractComprehensiveSkills(resumeText);
    
    // Extract experience (enhanced)
    const experience = this.extractExperience(resumeText);
    
    // Extract education (enhanced)
    const education = this.extractEducation(resumeText);

    const projects = this.extractProjects(resumeText);
    const certifications = this.extractCertifications(resumeText);
    const languages = this.extractLanguages(resumeText);
    
    // Infer job preferences based on content
    const jobPreferences = this.inferJobPreferences(resumeText, skills);
    
    // Calculate metadata
    const totalYearsExperience = this.calculateTotalExperience(experience);
    const primarySkillCategory = this.determinePrimarySkillCategory(skills);
    
    const analysis: ComprehensiveResumeAnalysis = {
      personalInfo,
      skills,
      experience,
      education,
      projects,
      certifications,
      languages,
      jobPreferences,
      analysisMetadata: {
        confidence: 75,
        extractionMethod: 'fallback',
        totalYearsExperience,
        primarySkillCategory,
        suggestedJobCategory: this.suggestJobCategory(skills, experience),
        analysisDate: new Date()
      }
    };

    console.log('✅ Comprehensive fallback analysis completed');
    console.log('📊 Fallback analysis summary:', {
      skillsFound: skills.length,
      experienceEntries: experience.length,
      educationEntries: education.length,
      projectEntries: projects.length,
      certificationEntries: certifications.length,
      primaryCategory: primarySkillCategory
    });
    
    return analysis;
  }

  /**
   * Extract personal information from resume text
   */
  private extractPersonalInfo(resumeText: string): ComprehensiveResumeAnalysis['personalInfo'] {
    const personalInfo: ComprehensiveResumeAnalysis['personalInfo'] = {
      name: ''
    };

    // Extract name (first few lines, common patterns)
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
    
    // Look for name in first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      // Simple heuristic: if line has 2-4 words and looks like a name
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && 
          words.every(word => /^[A-Za-z]+$/.test(word)) &&
          line.length < 50) {
        personalInfo.name = line;
        break;
      }
    }

    // Extract email
    const emailMatch = resumeText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract LinkedIn
    const linkedInMatch = resumeText.match(/(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)[^\s]+/i);
    if (linkedInMatch) {
      personalInfo.linkedIn = linkedInMatch[0];
    }

    // Extract GitHub
    const githubMatch = resumeText.match(/(?:github\.com\/)[^\s]+/i);
    if (githubMatch) {
      personalInfo.github = githubMatch[0];
    }

    const portfolioMatch = resumeText.match(/https?:\/\/(?!www\.)?[^\s]*(?:portfolio|behance|dribbble|github\.io)[^\s]*/i);
    if (portfolioMatch) personalInfo.portfolio = portfolioMatch[0];

    const summarySection = this.extractSection(resumeText, ['summary', 'professional summary', 'profile', 'about me', 'objective', 'career objective']);
    if (summarySection) {
      personalInfo.summary = summarySection
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, index) => index === 0
          ? line.replace(/^(summary|professional summary|profile|about me|objective|career objective)\s*:?\s*/i, '')
          : line)
        .filter(Boolean)
        .slice(0, 6)
        .join(' ')
        .trim();
    }

    return personalInfo;
  }

  /**
   * Extract comprehensive skills from resume text
   */
  private extractComprehensiveSkills(resumeText: string): ComprehensiveResumeAnalysis['skills'] {
    const text = resumeText.toLowerCase();
    const foundSkills: ComprehensiveResumeAnalysis['skills'] = [];
    
    // Comprehensive skill categories
    const skillCategories = {
      // Technical skills
      technical: [
        'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 'mongodb',
        'typescript', 'angular', 'vue.js', 'express.js', 'spring boot', 'django', 'flask',
        'aws', 'azure', 'docker', 'kubernetes', 'git', 'linux', 'windows', 'mysql', 'postgresql',
        'redis', 'elasticsearch', 'jenkins', 'terraform', 'ansible', 'prometheus', 'grafana',
        'microservices', 'rest api', 'graphql', 'oauth', 'jwt', 'ci/cd', 'devops', 'agile', 'scrum'
      ],
      
      // Business and operational skills
      business: [
        'project management', 'team leadership', 'strategic planning', 'business analysis',
        'financial analysis', 'budget management', 'stakeholder management', 'risk management',
        'process improvement', 'quality assurance', 'vendor management', 'contract negotiation',
        'customer relationship management', 'crm', 'sales', 'marketing', 'digital marketing',
        'social media marketing', 'content marketing', 'seo', 'sem', 'google analytics',
        'data analysis', 'reporting', 'kpi tracking', 'performance metrics', 'dashboard creation'
      ],
      
      // Operational skills (warehouse, logistics, manufacturing)
      operational: [
        'warehouse operations', 'inventory management', 'supply chain management', 'logistics',
        'forklift operation', 'pallet jack', 'order picking', 'shipping and receiving',
        'quality control', 'lean manufacturing', 'six sigma', 'kaizen', '5s methodology',
        'warehouse management system', 'wms', 'inventory control', 'cycle counting',
        'safety protocols', 'osha compliance', 'hazmat handling', 'cross-docking',
        'distribution', 'fulfillment', 'picking', 'packing', 'sorting', 'loading', 'unloading',
        'inventory tracking', 'stock management', 'procurement', 'vendor relations',
        'transportation', 'routing', 'scheduling', 'fleet management'
      ],
      
      // Soft skills
      soft: [
        'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
        'time management', 'organization', 'attention to detail', 'multitasking', 'adaptability',
        'creativity', 'innovation', 'customer service', 'conflict resolution', 'negotiation',
        'presentation', 'public speaking', 'training', 'mentoring', 'coaching', 'collaboration',
        'emotional intelligence', 'stress management', 'decision making', 'analytical thinking'
      ],
      
      // Language skills
      language: [
        'english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese',
        'italian', 'russian', 'arabic', 'hindi', 'bilingual', 'multilingual', 'translation',
        'interpretation', 'native speaker', 'fluent', 'proficient', 'conversational'
      ]
    };

    // Find skills in text
    for (const [category, skillList] of Object.entries(skillCategories)) {
      for (const skill of skillList) {
        if (text.includes(skill.toLowerCase())) {
          // Determine skill level based on context
          let level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate';
          
          const skillContext = this.getSkillContext(text, skill);
          if (skillContext.includes('expert') || skillContext.includes('advanced') || 
              skillContext.includes('senior') || skillContext.includes('lead')) {
            level = 'expert';
          } else if (skillContext.includes('experienced') || skillContext.includes('proficient')) {
            level = 'advanced';
          } else if (skillContext.includes('basic') || skillContext.includes('beginner') || 
                     skillContext.includes('learning')) {
            level = 'beginner';
          }
          
          foundSkills.push({
            name: this.capitalizeSkill(skill),
            level,
            category: category as any
          });
        }
      }
    }

    // Remove duplicates and return
    const uniqueSkills = foundSkills.filter((skill, index, self) => 
      index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase())
    );

    console.log(`🎯 Found ${uniqueSkills.length} unique skills across all categories`);
    return uniqueSkills;
  }

  /**
   * Get context around a skill mention for level determination
   */
  private getSkillContext(text: string, skill: string): string {
    const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
    if (skillIndex === -1) return '';
    
    const start = Math.max(0, skillIndex - 50);
    const end = Math.min(text.length, skillIndex + skill.length + 50);
    
    return text.substring(start, end).toLowerCase();
  }

  /**
   * Capitalize skill name properly
   */
  private capitalizeSkill(skill: string): string {
    // Handle acronyms and special cases
    const specialCases: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'node.js': 'Node.js',
      'vue.js': 'Vue.js',
      'express.js': 'Express.js',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'mongodb': 'MongoDB',
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'aws': 'AWS',
      'rest api': 'REST API',
      'graphql': 'GraphQL',
      'oauth': 'OAuth',
      'jwt': 'JWT',
      'ci/cd': 'CI/CD',
      'devops': 'DevOps',
      'crm': 'CRM',
      'seo': 'SEO',
      'sem': 'SEM',
      'wms': 'WMS',
      'osha': 'OSHA',
      '5s methodology': '5S Methodology'
    };
    
    if (specialCases[skill.toLowerCase()]) {
      return specialCases[skill.toLowerCase()];
    }
    
    // Default capitalization
    return skill.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Enhanced experience extraction from resume text
   */
  private extractExperience(resumeText: string): ComprehensiveResumeAnalysis['experience'] {
    const experience: ComprehensiveResumeAnalysis['experience'] = [];
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentExperience: any = null;
    let inExperienceSection = false;
    let collectingDescription = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Check if we're entering experience section
      if (lineLower.includes('work experience') || 
          lineLower.includes('professional experience') || 
          lineLower.includes('employment') ||
          lineLower === 'experience') {
        inExperienceSection = true;
        continue;
      }
      
      // Check if we're leaving experience section
      if (inExperienceSection && (
          lineLower.includes('education') || 
          lineLower.includes('skills') || 
          lineLower.includes('projects') ||
          lineLower.includes('certificates'))) {
        // Save current experience before leaving
        if (currentExperience) {
          experience.push(currentExperience);
          currentExperience = null;
        }
        break;
      }
      
      if (inExperienceSection) {
        // Look for job title patterns
        const jobTitlePattern = /^([A-Za-z\s&\/\-]+(?:Intern|Developer|Engineer|Manager|Analyst|Specialist|Coordinator|Assistant|Director|Lead|Senior|Junior|Associate)?)\s*$/;
        const datePattern = /(\d{2}\/\d{4}|\d{4}|\d{1,2}\/\d{4}|present|current)/i;
        
        // Check if line contains dates (likely a job entry)
        if (datePattern.test(line)) {
          // Save previous experience
          if (currentExperience) {
            experience.push(currentExperience);
          }
          
          // Extract dates
          const dateMatches = line.match(/(\d{2}\/\d{4}|\d{4}|\w+\s+\d{4})\s*[-–—]\s*(\d{2}\/\d{4}|\d{4}|\w+\s+\d{4}|present|current)/i);
          let startDate = 'Unknown';
          let endDate = 'Unknown';
          let isCurrentJob = false;
          
          if (dateMatches) {
            startDate = dateMatches[1];
            endDate = dateMatches[2];
            isCurrentJob = dateMatches[2].toLowerCase().includes('present') || dateMatches[2].toLowerCase().includes('current');
          }
          
          // Look for location in the same line or next line
          const locationMatch = line.match(/[|,]\s*([A-Za-z\s,]+)$/);
          const location = locationMatch ? locationMatch[1].trim() : '';
          
          // Get job title from previous line or extract from this line
          let title = '';
          let company = '';
          
          if (i > 0) {
            const prevLine = lines[i - 1];
            if (jobTitlePattern.test(prevLine)) {
              title = prevLine.trim();
            }
          }
          
          // Extract company name (usually after job title, before dates)
          const beforeDates = line.split(dateMatches ? dateMatches[0] : '')[0];
          if (beforeDates && beforeDates.trim()) {
            company = beforeDates.trim();
          } else if (i > 1) {
            // Check previous lines for company
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
              const checkLine = lines[j];
              if (!jobTitlePattern.test(checkLine) && checkLine.length > 0) {
                company = checkLine.trim();
                break;
              }
            }
          }
          
          currentExperience = {
            title: title,
            company: company,
            location: location,
            startDate: startDate,
            endDate: endDate,
            description: '',
            isCurrentJob: isCurrentJob
          };
          
          collectingDescription = true;
        }
        // Collect description points (lines starting with • or -)
        else if (collectingDescription && currentExperience && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
          if (currentExperience.description) {
            currentExperience.description += '\n';
          }
          currentExperience.description += line;
        }
        // If we hit a new job title while collecting description, prepare for new entry
        else if (jobTitlePattern.test(line) && collectingDescription) {
          collectingDescription = false;
        }
      }
    }
    
    // Add the last experience
    if (currentExperience) {
      experience.push(currentExperience);
    }
    
    return experience;
  }

  /**
   * Enhanced education extraction from resume text
   */
  private extractEducation(resumeText: string): ComprehensiveResumeAnalysis['education'] {
    const section = this.extractSection(resumeText, [
      'education', 'educational background', 'academic background',
      'academic qualifications', 'qualifications'
    ]);
    if (!section) return [];

    const lines = section.split('\n')
      .map(line => line.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);
    if (lines.length) {
      lines[0] = lines[0].replace(/^(education|educational background|academic background|academic qualifications|qualifications)\s*:?\s*/i, '');
      if (!lines[0]) lines.shift();
    }

    const education: ComprehensiveResumeAnalysis['education'] = [];
    let current: any = null;
    const degreePattern = /\b(B\.?\s?Tech|B\.?\s?E\.?|Bachelor(?:'s)? of (?:Engineering|Technology|Science|Commerce|Arts|Business Administration|Computer Applications)|Bachelor(?:'s)? Degree|B\.?\s?Sc\.?|B\.?\s?Com\.?|B\.?\s?A\.?|BBA|BCA|M\.?\s?Tech|M\.?\s?E\.?|Master(?:'s)? of (?:Engineering|Technology|Science|Commerce|Arts|Business Administration|Computer Applications)|Master(?:'s)? Degree|M\.?\s?Sc\.?|M\.?\s?Com\.?|M\.?\s?A\.?|MBA|MCA|Ph\.?\s?D\.?|Doctorate|Diploma|HSC|SSC|12th|10th)\b/i;
    const institutionPattern = /\b(university|college|institute|school|academy|polytechnic)\b/i;
    const yearRangePattern = /\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|present|current|pursuing)\b/i;
    const singleYearPattern = /\b((?:19|20)\d{2})\b/;
    const scorePattern = /\b(?:CGPA|GPA)\s*[:\-]?\s*(\d+(?:\.\d+)?)|\b(\d+(?:\.\d+)?)\s*%/i;

    const finishCurrent = () => {
      if (current && (current.degree || current.institution)) education.push(current);
      current = null;
    };

    for (const line of lines) {
      const degreeMatch = line.match(degreePattern);
      if (degreeMatch) {
        const previousInstitution = current && !current.degree ? current.institution : '';
        if (current?.degree) finishCurrent();
        const degree = degreeMatch[0].replace(/\s+/g, ' ').trim();
        const institutionMatch = line.match(/(?:^|[,|])\s*([^,|]*(?:university|college|institute|school|academy|polytechnic)[^,|]*)/i);
        let field = line
          .replace(degreeMatch[0], '')
          .replace(yearRangePattern, '')
          .replace(scorePattern, '')
          .replace(institutionMatch?.[0] || '', '')
          .trim()
          .replace(/^(?:in|of|[-–—|,:.])+\s*/i, '')
          .replace(/\s*[|,]\s*(?:CGPA|GPA|Percentage).*$/i, '')
          .replace(/[|,:.\s]+$/, '')
          .trim();
        if (institutionPattern.test(field)) field = '';
        current = {
          degree,
          field,
          institution: institutionMatch?.[1]?.trim() || previousInstitution || '',
          startYear: undefined,
          endYear: undefined,
          gpa: undefined,
          isCompleted: true
        };
      }

      if (!current && institutionPattern.test(line)) {
        current = { degree: '', field: '', institution: '', startYear: undefined, endYear: undefined, gpa: undefined, isCompleted: true };
      }
      if (!current) continue;

      if (institutionPattern.test(line)) {
        const institutionMatch = line.match(/(?:^|[,|])\s*([^,|]*(?:university|college|institute|school|academy|polytechnic)[^,|]*)/i);
        current.institution = institutionMatch?.[1]?.trim() || line
          .replace(yearRangePattern, '')
          .replace(scorePattern, '')
          .replace(/[|,\s]+$/, '')
          .trim();
      }

      const yearRange = line.match(yearRangePattern);
      if (yearRange) {
        current.startYear = Number(yearRange[1]);
        const endValue = yearRange[2].toLowerCase();
        current.isCompleted = !['present', 'current', 'pursuing'].includes(endValue);
        current.endYear = current.isCompleted ? Number(yearRange[2]) : undefined;
      } else {
        const singleYear = line.match(singleYearPattern);
        if (singleYear && !current.endYear) current.endYear = Number(singleYear[1]);
      }

      const score = line.match(scorePattern);
      if (score?.[1]) {
        current.gpa = score[1];
        current.gradingType = 'gpa';
      } else if (score?.[2]) {
        current.grade = score[2];
        current.gradingType = 'percentage';
      }
    }

    finishCurrent();
    return education;
  }

  private extractProjects(resumeText: string): NonNullable<ComprehensiveResumeAnalysis['projects']> {
    const section = this.extractSection(resumeText, ['projects', 'personal projects', 'academic projects', 'key projects']);
    if (!section) return [];

    const lines = section.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length) {
      lines[0] = lines[0].replace(/^(projects?|personal projects|academic projects|key projects)\s*:?\s*/i, '');
      if (!lines[0]) lines.shift();
    }

    const projects: NonNullable<ComprehensiveResumeAnalysis['projects']> = [];
    let current: any = null;
    const technologyNames = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express',
      'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C++', 'C#', '.NET',
      'MongoDB', 'MySQL', 'PostgreSQL', 'Firebase', 'AWS', 'Azure', 'Docker',
      'Kubernetes', 'HTML', 'CSS', 'Tailwind', 'Git'
    ];
    const finishProject = () => {
      if (!current?.name) return;
      const projectText = `${current.name} ${current.description}`;
      const inferredTechnologies = technologyNames.filter(technology => {
        const escapedTechnology = technology.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^A-Za-z0-9])${escapedTechnology}([^A-Za-z0-9]|$)`, 'i').test(projectText);
      });
      current.technologies = Array.from(new Set([...(current.technologies || []), ...inferredTechnologies]));
      projects.push(current);
      current = null;
    };

    for (const line of lines) {
      const bullet = /^[-•*]\s*/.test(line);
      const cleanedLine = line.replace(/^[-•*]\s*/, '').trim();
      const inlineProject = cleanedLine.match(/^(.{2,80}?)\s+[-–—]\s+((?:built|developed|created|designed|implemented)\b.+)$/i);
      const technologiesMatch = cleanedLine.match(/(?:technologies|tech stack|built with|using)\s*:?\s*(.+)/i);
      const linkMatch = line.match(/https?:\/\/\S+/i);
      const looksLikeTitle = !bullet && cleanedLine.length <= 100 && !/[.!?]$/.test(cleanedLine) && !technologiesMatch;

      if (inlineProject) {
        finishProject();
        current = { name: inlineProject[1].trim(), description: inlineProject[2].trim(), technologies: [], link: linkMatch?.[0] || '' };
      } else if (looksLikeTitle && (!current || Boolean(current.description))) {
        finishProject();
        const name = cleanedLine
          .replace(linkMatch?.[0] || '', '')
          .replace(/[|:–—\-\s]+$/, '')
          .trim();
        current = { name, description: '', technologies: [], link: linkMatch?.[0] || '' };
      } else if (current) {
        if (technologiesMatch) {
          current.technologies = technologiesMatch[1].split(/[,|]|\s+and\s+/i).map((item: string) => item.trim()).filter(Boolean);
          if (!/^(?:technologies|tech stack)\s*:/i.test(cleanedLine)) {
            current.description = [current.description, cleanedLine].filter(Boolean).join(' ');
          }
        } else {
          current.description = [current.description, cleanedLine].filter(Boolean).join(' ');
        }
        if (linkMatch) current.link = linkMatch[0];
      }
    }
    finishProject();
    return projects;
  }

  private extractCertifications(resumeText: string): NonNullable<ComprehensiveResumeAnalysis['certifications']> {
    const entries: NonNullable<ComprehensiveResumeAnalysis['certifications']> = [];
    const achievementHeading = /^(certifications?(?:\s*(?:&|and)\s*licenses?)?|licenses?(?:\s*(?:&|and)\s*certifications?)?|certificates?|achievements?(?:\s*(?:&|and)\s*awards?)?|awards?(?:\s*(?:&|and)\s*achievements?)?)\s*(?::\s*(.*))?$/i;
    const otherHeading = /^(?:summary|professional summary|profile|objective|career objective|experience|work experience|education|educational background|academic background|academic qualifications|qualifications|skills|technical skills|projects?|personal projects|academic projects|key projects|languages?|language skills)\s*:?/i;
    let activeHeading = '';

    for (const rawLine of resumeText.split('\n')) {
      let line = rawLine.trim().replace(/^[-•*]\s*/, '');
      if (!line) continue;
      const headingMatch = line.match(achievementHeading);
      if (headingMatch) {
        activeHeading = headingMatch[1].toLowerCase();
        line = (headingMatch[2] || '').trim();
        if (!line) continue;
      } else if (otherHeading.test(line)) {
        activeHeading = '';
        continue;
      }
      if (!activeHeading || line.length < 3) continue;
      if (/^(?:&|and)?\s*(?:achievements?|awards?|certifications?|certificates?|licenses?)\s*:?$/i.test(line)) continue;

      const year = line.match(/\b(19|20)\d{2}\b/)?.[0];
      let organization = line.match(/(?:by|from|issued by)\s+([^,;|]+)/i)?.[1]?.trim() || '';
      let name = line
        .replace(/(?:by|from|issued by)\s+[^,;|]+/i, '')
        .replace(/\b(19|20)\d{2}\b/g, '')
        .replace(/[|,;\-–—]+\s*$/, '')
        .trim();
      if (!organization && /certification|certificate|license/i.test(activeHeading)) {
        const parts = name.split(/\s+[-–—]\s+/).map(part => part.trim()).filter(Boolean);
        if (parts.length > 1) {
          name = parts.shift() || name;
          organization = parts.join(' - ');
        }
      }
      if (name && !entries.some(entry => entry.name.toLowerCase() === name.toLowerCase())) {
        entries.push({ name, organization, year: year ? Number(year) : undefined });
      }
    }
    return entries;
  }

  private extractLanguages(resumeText: string): NonNullable<ComprehensiveResumeAnalysis['languages']> {
    const section = this.extractSection(resumeText, ['languages', 'language skills']);
    if (!section) return [];

    const languageDefinitions = [
      { name: 'English', aliases: ['English'] }, { name: 'Hindi', aliases: ['Hindi'] },
      { name: 'Marathi', aliases: ['Marathi'] }, { name: 'German', aliases: ['German', 'Germany'] },
      { name: 'Gujarati', aliases: ['Gujarati'] }, { name: 'Kannada', aliases: ['Kannada'] },
      { name: 'Tamil', aliases: ['Tamil'] }, { name: 'Telugu', aliases: ['Telugu'] },
      { name: 'Malayalam', aliases: ['Malayalam'] }, { name: 'Bengali', aliases: ['Bengali', 'Bangla'] },
      { name: 'Punjabi', aliases: ['Punjabi'] }, { name: 'Urdu', aliases: ['Urdu'] },
      { name: 'Odia', aliases: ['Odia', 'Oriya'] }, { name: 'Assamese', aliases: ['Assamese'] },
      { name: 'Sanskrit', aliases: ['Sanskrit'] }, { name: 'French', aliases: ['French'] },
      { name: 'Spanish', aliases: ['Spanish'] }, { name: 'Italian', aliases: ['Italian'] },
      { name: 'Portuguese', aliases: ['Portuguese'] }, { name: 'Russian', aliases: ['Russian'] },
      { name: 'Arabic', aliases: ['Arabic'] }, { name: 'Japanese', aliases: ['Japanese'] },
      { name: 'Korean', aliases: ['Korean'] }, { name: 'Chinese', aliases: ['Chinese'] },
      { name: 'Mandarin', aliases: ['Mandarin'] }
    ];
    const normalizedSection = section.replace(/^(languages?|language skills)\s*:?\s*/i, '');
    const aliasToName = new Map<string, string>();
    for (const definition of languageDefinitions) {
      for (const alias of definition.aliases) aliasToName.set(alias.toLowerCase(), definition.name);
    }
    const languagePattern = new RegExp(`\\b(${Array.from(aliasToName.keys()).sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi');
    const matches = Array.from(normalizedSection.matchAll(languagePattern));
    const results: NonNullable<ComprehensiveResumeAnalysis['languages']> = [];

    matches.forEach((match, index) => {
      const name = aliasToName.get(match[0].toLowerCase()) || match[0];
      if (results.some(language => language.name === name)) return;
      const segmentStart = (match.index || 0) + match[0].length;
      const segmentEnd = matches[index + 1]?.index ?? normalizedSection.length;
      const segment = normalizedSection.substring(segmentStart, segmentEnd).split(/[,;\n|]/)[0];
      const proficiency = segment.match(/native|fluent|professional(?: working)?|proficient|intermediate|conversational|basic|beginner|advanced/i)?.[0] || '';
      results.push({ name, proficiency });
    });

    return results;
  }

  /**
   * Infer job preferences from resume content
   */
  private inferJobPreferences(resumeText: string, skills: ComprehensiveResumeAnalysis['skills']): ComprehensiveResumeAnalysis['jobPreferences'] {
    const text = resumeText.toLowerCase();
    
    // Infer preferred roles based on skills and experience
    const preferredRoles: string[] = [];
    const preferredIndustries: string[] = [];
    
    // Technical roles
    if (skills.some(s => s.category === 'technical')) {
      if (skills.some(s => s.name.toLowerCase().includes('react') || s.name.toLowerCase().includes('javascript'))) {
        preferredRoles.push('Frontend Developer', 'Full Stack Developer');
      }
      if (skills.some(s => s.name.toLowerCase().includes('node') || s.name.toLowerCase().includes('python'))) {
        preferredRoles.push('Backend Developer', 'Software Engineer');
      }
      if (skills.some(s => s.name.toLowerCase().includes('aws') || s.name.toLowerCase().includes('docker'))) {
        preferredRoles.push('DevOps Engineer', 'Cloud Engineer');
      }
      preferredIndustries.push('Technology', 'Software Development');
    }
    
    // Operational roles
    if (skills.some(s => s.category === 'operational')) {
      preferredRoles.push('Warehouse Associate', 'Logistics Coordinator', 'Operations Specialist');
      preferredIndustries.push('Logistics', 'Supply Chain', 'Manufacturing', 'Retail');
    }
    
    // Business roles
    if (skills.some(s => s.category === 'business')) {
      preferredRoles.push('Business Analyst', 'Project Manager', 'Account Manager');
      preferredIndustries.push('Consulting', 'Finance', 'Marketing');
    }
    
    // Determine experience level
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'entry';
    if (text.includes('senior') || text.includes('lead') || text.includes('manager')) {
      experienceLevel = 'senior';
    } else if (text.includes('experienced') || text.includes('5+ years') || text.includes('3+ years')) {
      experienceLevel = 'mid';
    }
    
    return {
      preferredRoles: preferredRoles.length > 0 ? preferredRoles : ['General'],
      preferredIndustries: preferredIndustries.length > 0 ? preferredIndustries : ['General'],
      experienceLevel,
      workMode: 'any'
    };
  }

  /**
   * Calculate total years of experience
   */
  private calculateTotalExperience(experience: ComprehensiveResumeAnalysis['experience']): number {
    if (experience.length === 0) return 0;
    
    let totalMonths = 0;
    
    for (const exp of experience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const months = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += months;
      }
    }
    
    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Determine primary skill category
   */
  private determinePrimarySkillCategory(skills: ComprehensiveResumeAnalysis['skills']): string {
    const categoryCounts: { [key: string]: number } = {};
    
    for (const skill of skills) {
      categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
    }
    
    const primaryCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, 'general'
    );
    
    return primaryCategory;
  }

  /**
   * Suggest job category based on skills and experience
   */
  private suggestJobCategory(skills: ComprehensiveResumeAnalysis['skills'], experience: ComprehensiveResumeAnalysis['experience']): string {
    const primaryCategory = this.determinePrimarySkillCategory(skills);
    
    const categoryMap: { [key: string]: string } = {
      'technical': 'Software Development',
      'business': 'Business Operations',
      'operational': 'Operations & Logistics',
      'soft': 'General Management',
      'language': 'Communications'
    };
    
    return categoryMap[primaryCategory] || 'General';
  }

  /**
   * Extract a specific section from resume text
   */
  private extractSection(text: string, sectionNames: string[]): string | null {
    let sectionIndex = -1;
    let matchedLength = 0;
    for (const sectionName of sectionNames) {
      const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`(?:^|\\n)\\s*(${escapedName})\\s*:?`, 'i').exec(text);
      if (match) {
        const headingIndex = match.index + match[0].indexOf(match[1]);
        if (sectionIndex === -1 || headingIndex < sectionIndex) {
          sectionIndex = headingIndex;
          matchedLength = match[1].length;
        }
      }
    }
    if (sectionIndex === -1) return null;

    const nextSectionIndex = this.findNextSectionIndex(text, sectionIndex + matchedLength);
    return text.substring(sectionIndex, nextSectionIndex);
  }

  /**
   * Find the index of the next major section
   */
  private findNextSectionIndex(text: string, startIndex: number): number {
    const majorSections = [
      'summary', 'professional summary', 'profile', 'objective',
      'about me', 'career objective', 'experience', 'work experience',
      'education', 'educational background', 'academic background',
      'academic qualifications', 'qualifications',
      'skills', 'technical skills', 'projects', 'personal projects',
      'academic projects', 'key projects', 'certifications and licenses',
      'licenses and certifications', 'achievements and awards', 'awards and achievements',
      'certifications', 'certificates', 'licenses', 'achievements', 'awards',
      'languages', 'language skills'
    ];
    
    let nextIndex = text.length;
    
    for (const section of majorSections) {
      const escapedSection = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const remainingText = text.substring(startIndex);
      const match = new RegExp(`(?:^|\\n)\\s*(${escapedSection})\\s*:?`, 'i').exec(remainingText);
      if (match) {
        const index = startIndex + match.index + match[0].indexOf(match[1]);
        if (index < nextIndex) nextIndex = index;
      }
    }
    
    return nextIndex;
  }

  /**
   * Parse date range string
   */
  private parseDateRange(dateRange: string): { start: string; end: string } {
    const cleaned = dateRange.replace(/[()]/g, '').trim();
    
    if (cleaned.includes(' - ')) {
      const [start, end] = cleaned.split(' - ');
      return {
        start: start.trim(),
        end: end.trim()
      };
    }
    
    if (cleaned.includes(' to ')) {
      const [start, end] = cleaned.split(' to ');
      return {
        start: start.trim(),
        end: end.trim()
      };
    }
    
    return {
      start: cleaned,
      end: 'Present'
    };
  }

  /**
   * Extract degree type from matched text
   */
  private extractDegreeType(matchedText: string): string {
    const lowerText = matchedText.toLowerCase();
    
    if (lowerText.includes('bachelor')) return 'Bachelor\'s';
    if (lowerText.includes('master')) return 'Master\'s';
    if (lowerText.includes('phd') || lowerText.includes('doctorate')) return 'PhD';
    if (lowerText.includes('associate')) return 'Associate';
    
    return 'Degree';
  }

  /**
   * Analyze resume against job description and provide match score using Claude Haiku
   */
  async analyzeResumeMatch(resumeText: string, jobDescription: string): Promise<ResumeMatchResult> {
    console.log('🔍 Starting resume-job match analysis...');
    
    try {
      if (!this.claudeApiKey || this.claudeDisabled) {
        console.log('⚠️ No Claude API key available, using fallback matching');
        return this.generateFallbackMatch(resumeText, jobDescription);
      }
      
      await this.enforceRateLimit();
      
      const prompt = `You are an advanced, industry-grade Applicant Tracking System matching engine. Evaluate the resume against the job description objectively, like an elite technical recruiter.

Evaluation criteria, based only on evidence in the resume:
1. Hard Skills Match (40%): contextual evidence of mandatory technologies, methodologies, and frameworks.
2. Experience & Seniority Match (30%): relevant years, actual responsibilities, impact and required seniority.
3. Domain & Context Match (30%): relevant industry background and role trajectory.

Disregard hidden keywords and context-free keyword lists. Infer seniority from responsibility and impact, not title alone. Return ONLY valid JSON with this exact schema and no markdown:
{
  "hard_skills_score": 0,
  "seniority_score": 0,
  "domain_score": 0,
  "final_match_score": 0,
  "experience_years_found": null,
  "experience_match_status": "UNDERQUALIFIED",
  "matched_core_skills": [],
  "missing_critical_skills": [],
  "concise_justification": "Exactly two concise sentences."
}

[JOB DESCRIPTION]
${jobDescription}

[RESUME]
${resumeText}`;

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      if (response.data?.content?.[0]?.text) {
        try {
          const responseText = response.data.content[0].text.trim();
          
          // Try to extract JSON from the response
          let jsonStr = responseText;
          
          // If the response contains text before JSON, try to extract just the JSON part
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
          
          const result = JSON.parse(jsonStr);
          
          const hardSkillsScore = this.validScore(result.hard_skills_score);
          const seniorityScore = this.validScore(result.seniority_score);
          const domainScore = this.validScore(result.domain_score);
          if ([hardSkillsScore, seniorityScore, domainScore].some(score => score === undefined) || !result.concise_justification) {
            throw new Error('Invalid JSON structure from Claude');
          }
          const matchScore = Math.round(hardSkillsScore! * 0.4 + seniorityScore! * 0.3 + domainScore! * 0.3);
          const skillsMatched = Array.isArray(result.matched_core_skills) ? result.matched_core_skills.map(String) : [];
          const skillsGap = Array.isArray(result.missing_critical_skills) ? result.missing_critical_skills.map(String) : [];
          const status = ['EXCEEDS', 'MATCHES', 'UNDERQUALIFIED'].includes(result.experience_match_status) ? result.experience_match_status : 'UNDERQUALIFIED';
          console.log('✅ Claude analysis successful - Match Score:', matchScore);
          return {
            matchScore, hardSkillsScore: hardSkillsScore!, seniorityScore: seniorityScore!, domainScore: domainScore!,
            experienceYearsFound: Number.isFinite(Number(result.experience_years_found)) ? Math.max(0, Math.round(Number(result.experience_years_found))) : null,
            experienceMatchStatus: status,
            conciseJustification: String(result.concise_justification),
            explanation: String(result.concise_justification), suggestions: skillsGap.slice(0, 4).map((skill: string) => `Develop or demonstrate ${skill} in a relevant project.`),
            skillsMatched, skillsGap
          };
        } catch (parseError) {
          console.error('❌ Failed to parse Claude response:', parseError);
          console.error('Raw response:', response.data.content[0].text);
          return this.generateFallbackMatch(resumeText, jobDescription);
        }
      }

    } catch (error: any) {
      console.error('❌ Claude API error:', error.response?.status, error.message);
      
      if (error.response?.status === 401) {
        console.error('🚫 Authentication failed - please check your Claude API key');
        this.claudeDisabled = true;
      }
    }

    return this.generateFallbackMatch(resumeText, jobDescription);
  }

  /**
   * Generate fallback match analysis when Claude is unavailable
   */
  private generateFallbackMatch(resumeText: string, jobDescription: string): ResumeMatchResult {
    console.log('🔧 Generating fallback match analysis...');
    
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    
    // Extract common keywords from job description
    const jobKeywords = this.extractKeywords(jobLower);
    const resumeKeywords = this.extractKeywords(resumeLower);
    
    // Find matching keywords
    const matchingKeywords = jobKeywords.filter(keyword => 
      resumeKeywords.some(resumeKeyword => 
        resumeKeyword.includes(keyword) || keyword.includes(resumeKeyword)
      )
    );
    
    // Calculate basic match score
    const hardSkillsScore = Math.min(100, Math.round((matchingKeywords.length / Math.max(jobKeywords.length, 1)) * 100));
    const yearsPattern = /\b(\d{1,2})\s*(?:\+|years?)\b/gi;
    const resumeYears = Math.max(0, ...Array.from(resumeText.matchAll(yearsPattern), match => Number(match[1]) || 0));
    const requiredYears = Math.max(0, ...Array.from(jobDescription.matchAll(yearsPattern), match => Number(match[1]) || 0));
    const seniorityScore = requiredYears ? Math.min(100, Math.round(resumeYears / requiredYears * 100)) : resumeYears ? 70 : 25;
    const domainScore = Math.round(hardSkillsScore * 0.55 + seniorityScore * 0.45);
    const matchScore = Math.round(hardSkillsScore * 0.4 + seniorityScore * 0.3 + domainScore * 0.3);
    
    // Generate basic suggestions
    const suggestions = [
      'Consider adding more specific technical skills mentioned in the job description',
      'Include quantifiable achievements and metrics',
      'Tailor your experience descriptions to match job requirements',
      'Add relevant keywords from the job posting'
    ];
    
    const skillsMatched = matchingKeywords.slice(0, 10); // Top 10 matches
    const skillsGap = jobKeywords.filter(keyword => !matchingKeywords.includes(keyword)).slice(0, 8);
    
    return {
      matchScore,
      explanation: `Based on keyword analysis, your resume has a ${matchScore}% match with this job. ${matchingKeywords.length} key terms align with the job requirements.`,
      suggestions,
      skillsMatched,
      skillsGap,
      usedFallback: true,
      hardSkillsScore, seniorityScore, domainScore,
      experienceYearsFound: resumeYears || null,
      experienceMatchStatus: resumeYears > requiredYears + 1 ? 'EXCEEDS' : resumeYears >= requiredYears ? 'MATCHES' : 'UNDERQUALIFIED',
      conciseJustification: `Core skills scored ${hardSkillsScore}%, while relevant seniority scored ${seniorityScore}%. Domain and role-context alignment scored ${domainScore}%, producing a strict weighted match of ${matchScore}%.`
    };
  }

  private validScore(value: unknown): number | undefined {
    const score = Number(value);
    return Number.isFinite(score) && score >= 0 && score <= 100 ? Math.round(score) : undefined;
  }

  /**
   * Extract keywords from text for matching
   */
  private extractKeywords(text: string): string[] {
    // Common technical and professional keywords
    const keywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'typescript',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'sql', 'mongodb', 'postgresql',
      'project management', 'leadership', 'team', 'agile', 'scrum', 'communication',
      'problem solving', 'analysis', 'design', 'development', 'testing', 'deployment',
      'warehouse', 'logistics', 'inventory', 'supply chain', 'operations', 'quality',
      'safety', 'manufacturing', 'distribution', 'procurement', 'vendor management'
    ];
    
    return keywords.filter(keyword => text.includes(keyword));
  }

  /**
   * Generate resume improvement suggestions using Claude
   */
  async generateImprovementSuggestions(resumeText: string): Promise<ResumeImprovementSuggestion[]> {
    console.log('💡 Generating resume improvement suggestions...');
    
    try {
      if (!this.claudeApiKey) {
        return this.generateFallbackSuggestions(resumeText);
      }
      
      await this.enforceRateLimit();
      
      const prompt = `Analyze this resume and provide specific improvement suggestions for each section.

Resume:
${resumeText}

Please provide improvement suggestions in JSON format:
[
  {
    "section": "Summary",
    "currentText": "Current text from resume",
    "suggestedText": "Improved version",
    "reason": "Why this improvement helps"
  }
]

Focus on:
- Making achievements more quantifiable
- Using stronger action verbs
- Better keyword optimization
- Improving clarity and impact`;

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      if (response.data?.content?.[0]?.text) {
        try {
          const suggestions = JSON.parse(response.data.content[0].text.trim());
          console.log('✅ Generated', suggestions.length, 'improvement suggestions');
          return suggestions;
        } catch (parseError) {
          console.error('❌ Failed to parse suggestions:', parseError);
          return this.generateFallbackSuggestions(resumeText);
        }
      }

    } catch (error: any) {
      console.error('❌ Error generating suggestions:', error.message);
    }

    return this.generateFallbackSuggestions(resumeText);
  }

  /**
   * Generate fallback improvement suggestions
   */
  private generateFallbackSuggestions(resumeText: string): ResumeImprovementSuggestion[] {
    return [
      {
        section: 'Overall',
        currentText: 'General resume structure',
        suggestedText: 'Add more quantifiable achievements and specific metrics',
        reason: 'Numbers and metrics make your accomplishments more credible and impactful'
      },
      {
        section: 'Experience',
        currentText: 'Job descriptions',
        suggestedText: 'Use strong action verbs and focus on results rather than responsibilities',
        reason: 'Action-oriented language demonstrates initiative and achievement'
      },
      {
        section: 'Skills',
        currentText: 'Skills list',
        suggestedText: 'Organize skills by category and include proficiency levels',
        reason: 'Categorized skills with levels help recruiters quickly assess your capabilities'
      }
    ];
  }
}

export default new AIResumeMatchingService();
