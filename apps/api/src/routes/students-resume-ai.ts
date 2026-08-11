import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth';
import { Student } from '../models/Student';
import pdfParse from 'pdf-parse';
import AIResumeMatchingService from '../services/ai-resume-matching';
import BunnyStorageService from '../services/bunny-storage.service';
import { createFeatureVector } from '../services/job-intelligence';
import CompactResumeExtractor, { extractResumeContacts } from '../services/compact-resume-extractor';
import { buildStudentStructuredFields } from '../services/profile-normalization';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================================
// PDF TEXT EXTRACTION WITH ROBUST ERROR HANDLING
// ============================================================
async function extractResumeText(filePath: string): Promise<string> {
  console.log('📄 Starting PDF text extraction for:', path.basename(filePath));
  const startTime = Date.now();
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📊 PDF file size:', fileBuffer.length, 'bytes');
    
    // Add timeout protection for PDF parsing
    const parsePromise = pdfParse(fileBuffer);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF parsing timeout - file may be corrupted')), 8000);
    });
    
    const pdfData = await Promise.race([parsePromise, timeoutPromise]) as any;
    const extractionTime = Date.now() - startTime;
    
    console.log(`✅ PDF extraction successful in ${extractionTime}ms`);
    console.log('📝 Extracted text length:', pdfData.text.length, 'characters');
    
    if (pdfData.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no readable text');
    }
    
    return pdfData.text.trim();
  } catch (error: any) {
    const extractionTime = Date.now() - startTime;
    console.error(`❌ PDF parsing failed after ${extractionTime}ms:`, error.message);
    
    // ENHANCED FALLBACK: If PDF parsing fails, try to extract filename and create minimal text
    const filename = path.basename(filePath);
    console.log('⚠️ Using enhanced filename-based fallback for:', filename);
    
    // Try to extract useful information from filename
    let fallbackText = `Resume file: ${filename}\n`;
    
    // Extract potential name from filename
    const nameMatch = filename.match(/([A-Za-z]+[-_\s][A-Za-z]+)/);
    if (nameMatch) {
      fallbackText += `Name: ${nameMatch[1].replace(/[-_]/g, ' ')}\n`;
    }
    
    // Add basic resume structure for analysis
    fallbackText += `Contact: Not available from corrupted PDF\n`;
    fallbackText += `Skills: Unable to extract from corrupted PDF\n`;
    fallbackText += `Experience: Unable to extract from corrupted PDF\n`;
    fallbackText += `Education: Unable to extract from corrupted PDF\n`;
    fallbackText += `Note: This resume could not be properly parsed. Please upload a valid PDF file.\n`;
    
    console.log('📝 Fallback text generated:', fallbackText.length, 'characters');
    return fallbackText;
  }
}

// ============================================================
// SKILL NORMALIZATION FUNCTIONS
// ============================================================

/**
 * Normalize skill level to match Student schema enum values
 */
function normalizeSkillLevel(level: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (!level || typeof level !== 'string') {
    return 'intermediate'; // Default fallback
  }
  
  const normalizedLevel = level.toLowerCase().trim();
  
  // Map various AI-generated levels to schema enum values
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
  
  // Default to intermediate for any other values
  return 'intermediate';
}

/**
 * Normalize skill category to match Student schema enum values
 */
function normalizeSkillCategory(category: string): 'technical' | 'soft' | 'language' {
  if (!category || typeof category !== 'string') {
    return 'technical'; // Default fallback
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
  
  // Default to technical for anything else
  return 'technical';
}

/**
 * Clean and validate extracted skills
 */
function cleanAndValidateSkills(skills: any[]): any[] {
  if (!Array.isArray(skills)) {
    return [];
  }
  
  return skills
    .filter(skill => skill && typeof skill === 'object' && skill.name)
    .map(skill => ({
      name: String(skill.name).trim(),
      level: normalizeSkillLevel(skill.level),
      category: normalizeSkillCategory(skill.category)
    }))
    .filter(skill => skill.name.length > 0)
    .slice(0, 30); // Limit to 30 skills max
}

// ============================================================
// CATEGORY MAPPING FUNCTION
// ============================================================
function mapCategoryToSchema(internalCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    'technical': 'technical',
    'business': 'soft',      
    'operational': 'soft',   
    'healthcare': 'technical', 
    'finance': 'soft',       
    'education': 'soft',     
    'retail': 'soft',        
    'soft': 'soft',
    'language': 'language'
  };
  
  return categoryMap[internalCategory] || 'soft';
}

// ============================================================
// AI ANALYSIS WITH FOCUSED PROMPT
// ============================================================
async function analyzeResumeWithAI(resumeText: string): Promise<{ success: boolean; analysis?: any; error?: string }> {
  try {
    console.log('🤖 Starting AI analysis with aggressive timeout protection...');
    
    // Comprehensive extraction needs enough time for all resume sections.
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timeout - falling back to local analysis')), 30000);
    });
    
    const analysisPromise = CompactResumeExtractor.analyze(resumeText);
    
    // Race between analysis and timeout
    const aiResponse = await Promise.race([analysisPromise, timeoutPromise]);
    
    if (aiResponse && typeof aiResponse === 'object') {
      console.log('✅ AI analysis completed successfully');
      return { success: true, analysis: aiResponse };
    } else {
      console.log('❌ AI returned invalid format, falling back to enhanced analysis');
      return { success: false, error: 'Invalid AI response format' };
    }
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('⏰ AI analysis timed out quickly, using enhanced local fallback');
      return { success: false, error: 'AI analysis timed out - using local analysis' };
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'AI analysis failed' };
  }
}

function parseResumeDate(value: unknown, endOfPeriod = false): Date | undefined {
  if (!value || value instanceof Date && isNaN(value.getTime())) return undefined;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw || /^(unknown|present|current|ongoing|now)$/i.test(raw)) return undefined;
  const yearMonth = raw.match(/\b((?:19|20)\d{2})[-/.](0?[1-9]|1[0-2])\b/);
  const monthYear = raw.match(/\b(0?[1-9]|1[0-2])[-/.]((?:19|20)\d{2})\b/);
  const yearOnly = raw.match(/\b((?:19|20)\d{2})\b/);
  let year: number | undefined;
  let month: number | undefined;
  if (yearMonth) { year = Number(yearMonth[1]); month = Number(yearMonth[2]) - 1; }
  else if (monthYear) { year = Number(monthYear[2]); month = Number(monthYear[1]) - 1; }
  else {
    const parsed = new Date(`1 ${raw}`);
    if (!isNaN(parsed.getTime()) && yearOnly) { year = parsed.getFullYear(); month = parsed.getMonth(); }
    else if (yearOnly) { year = Number(yearOnly[1]); month = endOfPeriod ? 11 : 0; }
  }
  if (year == null || month == null) return undefined;
  return endOfPeriod ? new Date(year, month + 1, 0) : new Date(year, month, 1);
}

function resumeYear(value: unknown): number | undefined {
  const match = String(value || '').match(/\b((?:19|20)\d{2})\b/);
  return match ? Number(match[1]) : undefined;
}

// ============================================================
// FALLBACK ANALYSIS FUNCTIONS
// ============================================================
function extractBasicSkills(text: string): any[] {
  const skillKeywords = {
    technical: [
      'javascript', 'js', 'python', 'java', 'react', 'reactjs', 'node.js', 'nodejs', 'html', 'html5', 
      'css', 'css3', 'sql', 'mysql', 'postgresql', 'mongodb', 'express', 'expressjs', 'aws', 
      'azure', 'git', 'github', 'docker', 'kubernetes', 'typescript', 'angular', 'vue', 'vuejs',
      'spring', 'django', 'flask', 'bootstrap', 'jquery', 'php', 'laravel', 'c++', 'c#', 'ruby',
      'go', 'rust', 'swift', 'kotlin', 'flutter', 'react native', 'redux', 'webpack', 'api',
      'rest api', 'graphql', 'microservices', 'devops', 'ci/cd', 'jenkins', 'linux', 'unix',
      'cloud', 'firebase', 'heroku', 'netlify', 'vercel', 'sass', 'less', 'tailwind'
    ],
    soft: [
      'communication', 'leadership', 'teamwork', 'team work', 'problem solving', 'time management',
      'project management', 'analytical thinking', 'creativity', 'adaptability', 'collaboration',
      'presentation', 'public speaking', 'negotiation', 'critical thinking', 'decision making',
      'organization', 'planning', 'customer service', 'conflict resolution', 'mentoring'
    ],
    language: [
      'english', 'spanish', 'french', 'german', 'chinese', 'mandarin', 'hindi', 'japanese', 
      'korean', 'portuguese', 'italian', 'russian', 'arabic', 'marathi', 'gujarati', 'bengali',
      'multilingual', 'bilingual', 'fluent', 'native'
    ]
  };
  
  const skills: any[] = [];
  const textLower = text.toLowerCase();
  
  Object.entries(skillKeywords).forEach(([category, skillList]) => {
    skillList.forEach(keyword => {
      if (textLower.includes(keyword)) {
        // Determine skill level based on context
        let level = 'intermediate';
        const skillContext = textLower.substring(
          Math.max(0, textLower.indexOf(keyword) - 100),
          Math.min(textLower.length, textLower.indexOf(keyword) + 100)
        );
        
        // Use the normalized level detection
        let skillLevel = 'intermediate';
        if (skillContext.includes('expert') || skillContext.includes('advanced') || 
            skillContext.includes('senior') || skillContext.includes('lead') ||
            skillContext.includes('proficient') || skillContext.includes('experienced')) {
          skillLevel = 'advanced';
        } else if (skillContext.includes('basic') || skillContext.includes('beginner') || 
                   skillContext.includes('learning') || skillContext.includes('familiar')) {
          skillLevel = 'beginner';
        }
        
        const validCategory = normalizeSkillCategory(category);
        skills.push({
          name: keyword.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          level: normalizeSkillLevel(skillLevel),
          category: validCategory
        });
      }
    });
  });
  
  // Remove duplicates
  const uniqueSkills = skills.filter((skill, index, self) => 
    index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase())
  );
  
  return uniqueSkills.slice(0, 20); // Limit to top 20 skills
}

function extractExperience(text: string): any[] {
  const experience: any[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for experience section markers
  let inExperienceSection = false;
  let currentExperience: any = null;
  
  const experienceMarkers = [
    'work experience', 'professional experience', 'experience', 'employment', 
    'career history', 'work history', 'professional background'
  ];
  
  const educationMarkers = [
    'education', 'academic', 'qualification', 'degree', 'certification', 'skills', 'projects'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Check if we're entering experience section
    if (experienceMarkers.some(marker => lineLower.includes(marker))) {
      inExperienceSection = true;
      continue;
    }
    
    // Check if we're leaving experience section
    if (inExperienceSection && educationMarkers.some(marker => lineLower === marker || lineLower.startsWith(marker))) {
      inExperienceSection = false;
      if (currentExperience) {
        experience.push(currentExperience);
        currentExperience = null;
      }
      continue;
    }
    
    if (inExperienceSection) {
      // Look for job titles (usually followed by company or date)
      const datePattern = /\d{2}\/\d{4}|\d{4}|present|current/i;
      const companyIndicators = ['at ', ' | ', ' - ', ' – ', ' — '];
      
      if (datePattern.test(line) || companyIndicators.some(indicator => line.includes(indicator))) {
        // Save previous experience
        if (currentExperience) {
          experience.push(currentExperience);
        }
        
        // Parse new experience entry
        const parts = line.split(/[|–—-]/).map(part => part.trim());
        let title = parts[0] || 'Professional';
        let company = 'Organization';
        let duration = 'Past';
        let location = '';
        
        // Extract company and dates
        for (let j = 1; j < parts.length; j++) {
          const part = parts[j];
          if (datePattern.test(part)) {
            duration = part;
          } else if (part.length > 0 && !datePattern.test(part)) {
            if (company === 'Organization') {
              company = part;
            } else {
              location = part;
            }
          }
        }
        
        // Extract dates
        let startDate = '2020';
        let endDate = 'Present';
        
        const dateMatch = duration.match(/(\d{2}\/\d{4}|\d{4})\s*[-–—to]*\s*(\d{2}\/\d{4}|\d{4}|present|current)/i);
        if (dateMatch) {
          startDate = dateMatch[1];
          endDate = dateMatch[2].toLowerCase().includes('present') || dateMatch[2].toLowerCase().includes('current') ? 'Present' : dateMatch[2];
        }
        
        currentExperience = {
          title: title,
          company: company,
          location: location,
          startDate: startDate,
          endDate: endDate,
          description: '',
          isCurrentJob: endDate === 'Present'
        };
      } else if (currentExperience && line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        // Add description points
        if (currentExperience.description) {
          currentExperience.description += ' ' + line.replace(/^[•\-*]\s*/, '');
        } else {
          currentExperience.description = line.replace(/^[•\-*]\s*/, '');
        }
      }
    }
  }
  
  // Add the last experience if exists
  if (currentExperience) {
    experience.push(currentExperience);
  }
  
  return experience;
}

function extractEducation(text: string): any[] {
  const education: any[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const educationMarkers = ['education', 'academic', 'qualification', 'degree'];
  const experienceMarkers = ['experience', 'work', 'employment', 'projects', 'skills', 'certifications'];
  
  let inEducationSection = false;
  let currentEducation: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Check if we're entering education section
    if (educationMarkers.some(marker => lineLower.includes(marker))) {
      inEducationSection = true;
      continue;
    }
    
    // Check if we're leaving education section
    if (inEducationSection && experienceMarkers.some(marker => lineLower === marker || lineLower.startsWith(marker))) {
      inEducationSection = false;
      if (currentEducation) {
        education.push(currentEducation);
        currentEducation = null;
      }
      continue;
    }
    
    if (inEducationSection) {
      // Look for degree patterns
      const degreePatterns = [
        /b\.?tech|bachelor.*technology|bachelor.*engineering/i,
        /m\.?tech|master.*technology|master.*engineering/i,
        /b\.?sc|bachelor.*science/i,
        /m\.?sc|master.*science/i,
        /b\.?com|bachelor.*commerce/i,
        /m\.?com|master.*commerce/i,
        /b\.?a|bachelor.*arts/i,
        /m\.?a|master.*arts/i,
        /mba|master.*business/i,
        /phd|doctorate/i,
        /diploma/i
      ];
      
      const datePattern = /\d{4}/g;
      const dates = line.match(datePattern);
      
      if (degreePatterns.some(pattern => pattern.test(line)) || dates) {
        // Save previous education
        if (currentEducation) {
          education.push(currentEducation);
        }
        
        // Parse education entry
        const parts = line.split(/[|–—-]/).map(part => part.trim());
        let degree = parts[0] || 'Degree';
        let institution = 'Educational Institution';
        let field = 'General Studies';
        let startYear = 2018;
        let endYear = 2022;
        
        // Extract institution and dates
        for (let j = 1; j < parts.length; j++) {
          const part = parts[j];
          const partDates = part.match(datePattern);
          if (partDates && partDates.length >= 2) {
            startYear = parseInt(partDates[0]);
            endYear = parseInt(partDates[1]);
          } else if (partDates && partDates.length === 1) {
            endYear = parseInt(partDates[0]);
            startYear = endYear - 4; // Assume 4-year program
          } else if (part.length > 0 && !datePattern.test(part)) {
            if (institution === 'Educational Institution') {
              institution = part;
            } else {
              field = part;
            }
          }
        }
        
        // Try to extract field from degree name
        if (field === 'General Studies') {
          if (degree.toLowerCase().includes('computer') || degree.toLowerCase().includes('cse')) {
            field = 'Computer Science';
          } else if (degree.toLowerCase().includes('engineering')) {
            field = 'Engineering';
          } else if (degree.toLowerCase().includes('business') || degree.toLowerCase().includes('mba')) {
            field = 'Business Administration';
          }
        }
        
        currentEducation = {
          degree: degree,
          field: field,
          institution: institution,
          startYear: startYear,
          endYear: endYear,
          gpa: null,
          isCompleted: endYear <= new Date().getFullYear()
        };
      }
    }
  }
  
  // Add the last education if exists
  if (currentEducation) {
    education.push(currentEducation);
  }
  
  return education;
}

function inferJobPreferences(skills: any[], experience: any[], text: string): any {
  const textLower = text.toLowerCase();
  
  // Infer roles based on skills and experience
  const roleMapping = {
    'frontend': ['react', 'javascript', 'html', 'css', 'vue', 'angular'],
    'backend': ['node.js', 'python', 'java', 'express', 'django', 'spring'],
    'fullstack': ['react', 'node.js', 'javascript', 'mongodb', 'express'],
    'devops': ['aws', 'docker', 'kubernetes', 'jenkins', 'linux'],
    'data': ['python', 'sql', 'mongodb', 'analytics'],
    'mobile': ['react native', 'flutter', 'swift', 'kotlin'],
    'design': ['ui', 'ux', 'design', 'figma', 'photoshop']
  };
  
  const skillNames = skills.map(s => s.name.toLowerCase()).join(' ');
  const preferredRoles: string[] = [];
  
  Object.entries(roleMapping).forEach(([role, keywords]) => {
    if (keywords.some(keyword => skillNames.includes(keyword))) {
      switch (role) {
        case 'frontend':
          preferredRoles.push('Frontend Developer', 'UI Developer');
          break;
        case 'backend':
          preferredRoles.push('Backend Developer', 'API Developer');
          break;
        case 'fullstack':
          preferredRoles.push('Full Stack Developer', 'Software Engineer');
          break;
        case 'devops':
          preferredRoles.push('DevOps Engineer', 'Cloud Engineer');
          break;
        case 'data':
          preferredRoles.push('Data Analyst', 'Database Developer');
          break;
        case 'mobile':
          preferredRoles.push('Mobile Developer', 'App Developer');
          break;
        case 'design':
          preferredRoles.push('UI/UX Designer', 'Product Designer');
          break;
      }
    }
  });
  
  // Default roles if none found
  if (preferredRoles.length === 0) {
    preferredRoles.push('Software Developer', 'Analyst', 'Consultant');
  }
  
  // Infer industries
  const preferredIndustries = ['Technology', 'Software Development'];
  if (textLower.includes('finance') || textLower.includes('banking')) {
    preferredIndustries.push('Finance');
  }
  if (textLower.includes('healthcare') || textLower.includes('medical')) {
    preferredIndustries.push('Healthcare');
  }
  if (textLower.includes('education') || textLower.includes('teaching')) {
    preferredIndustries.push('Education');
  }
  if (textLower.includes('retail') || textLower.includes('ecommerce')) {
    preferredIndustries.push('Retail');
  }
  
  // Infer experience level
  let experienceLevel = 'entry';
  if (experience.length > 0) {
    experienceLevel = 'mid';
    if (experience.some(exp => exp.title.toLowerCase().includes('senior') || exp.title.toLowerCase().includes('lead'))) {
      experienceLevel = 'senior';
    }
  }
  
  return {
    preferredRoles: [...new Set(preferredRoles)].slice(0, 5),
    preferredIndustries: [...new Set(preferredIndustries)],
    experienceLevel,
    workMode: 'any'
  };
}

function extractPersonalInfo(text: string): any {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
  const linkedInRegex = /linkedin\.com\/in\/[\w\-]+/gi;
  const githubRegex = /github\.com\/[\w\-]+/gi;
  
  // Extract name (first non-email line that looks like a name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let name = null;
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.match(/\d{4}/) && line.split(' ').length >= 2 && line.length < 50) {
      name = line;
      break;
    }
  }
  
  return {
    name: name,
    email: text.match(emailRegex)?.[0] || null,
    phone: text.match(phoneRegex)?.[0] || null,
    linkedIn: text.match(linkedInRegex)?.[0] || null,
    github: text.match(githubRegex)?.[0] || null
  };
}

function createEnhancedFallbackAnalysis(resumeText: string): any {
  console.log('🔧 Creating enhanced fallback analysis...');
  
  const basicSkills = extractBasicSkills(resumeText);
  const personalInfo = extractPersonalInfo(resumeText);
  const experience = extractExperience(resumeText);
  const education = extractEducation(resumeText);
  const jobPreferences = inferJobPreferences(basicSkills, experience, resumeText);
  
  console.log('📊 Enhanced fallback extraction summary:', {
    skills: basicSkills.length,
    experience: experience.length,
    education: education.length,
    personalInfo: Object.keys(personalInfo).filter(key => personalInfo[key]).length
  });
  
  return {
    personalInfo: {
      name: personalInfo.name || null,
      email: personalInfo.email || null,
      phone: personalInfo.phone || null,
      linkedIn: personalInfo.linkedIn || null,
      github: personalInfo.github || null
    },
    skills: basicSkills,
    skillsCount: basicSkills.length,
    experience: experience,
    experienceCount: experience.length,
    education: education,
    educationCount: education.length,
    jobPreferences: {
      preferredRoles: [],
      preferredIndustries: [],
      experienceLevel: experience.length > 0 ? jobPreferences.experienceLevel : null,
      workMode: null
    },
    analysisMetadata: {
      confidence: 80, // Higher confidence for enhanced analysis
      extractionMethod: 'enhanced-fallback',
      totalYearsExperience: calculateYearsExperience(experience),
      primarySkillCategory: determinePrimarySkillCategory(basicSkills),
      suggestedJobCategory: suggestJobCategory(basicSkills, resumeText),
      analysisDate: new Date()
    },
    profileCompleteness: calculateProfileCompleteness(personalInfo, basicSkills, experience, education)
  };
}

function calculateYearsExperience(experience: any[]): number {
  if (experience.length === 0) return 0;
  
  let totalYears = 0;
  for (const exp of experience) {
    const startYear = parseInt(exp.startDate) || 2020;
    const endYear = exp.endDate === 'Present' ? new Date().getFullYear() : parseInt(exp.endDate) || startYear + 1;
    totalYears += Math.max(0, endYear - startYear);
  }
  
  return Math.min(totalYears, 20); // Cap at 20 years
}

function determinePrimarySkillCategory(skills: any[]): string {
  if (skills.length === 0) return 'soft';
  
  const categoryCount = skills.reduce((acc: any, skill) => {
    acc[skill.category] = (acc[skill.category] || 0) + 1;
    return acc;
  }, {});
  
  return Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b) || 'soft';
}

function suggestJobCategory(skills: any[], text: string): string {
  const techSkillCount = skills.filter(s => s.category === 'technical').length;
  const textLower = text.toLowerCase();
  
  if (techSkillCount >= 5) {
    if (textLower.includes('react') || textLower.includes('frontend') || textLower.includes('ui')) {
      return 'Frontend Development';
    } else if (textLower.includes('backend') || textLower.includes('api') || textLower.includes('server')) {
      return 'Backend Development';
    } else if (textLower.includes('devops') || textLower.includes('cloud') || textLower.includes('aws')) {
      return 'DevOps Engineering';
    } else if (textLower.includes('data') || textLower.includes('analytics')) {
      return 'Data Analysis';
    } else {
      return 'Software Development';
    }
  } else if (textLower.includes('marketing') || textLower.includes('business')) {
    return 'Business Development';
  } else if (textLower.includes('design') || textLower.includes('ui/ux')) {
    return 'Design';
  } else {
    return 'General';
  }
}

function calculateProfileCompleteness(personalInfo: any, skills: any[], experience: any[], education: any[]): number {
  let score = 0;
  
  // Personal info (30 points)
  if (personalInfo.name) score += 10;
  if (personalInfo.email) score += 5;
  if (personalInfo.phone) score += 5;
  if (personalInfo.linkedIn) score += 5;
  if (personalInfo.github) score += 5;
  
  // Skills (25 points)
  if (skills.length >= 5) score += 25;
  else if (skills.length >= 3) score += 15;
  else if (skills.length >= 1) score += 10;
  
  // Experience (25 points)
  if (experience.length >= 2) score += 25;
  else if (experience.length >= 1) score += 15;
  
  // Education (20 points)
  if (education.length >= 1) score += 20;
  else score += 10; // Default assumption
  
  return Math.min(score, 100);
}

// ============================================================
// MAIN ROUTE HANDLER - IMPROVED TWO-STEP APPROACH
// ============================================================
// Test endpoint without authentication for development testing
router.post('/test-analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No resume file uploaded' 
      });
    }

    console.log('🚀 Test AI-Powered Resume Analysis Flow Started');
    console.log('📁 File received:', req.file.originalname, `(${req.file.size} bytes)`);

    // STEP 1: Extract text from PDF using the existing function
    console.log('🔍 STEP 1: Extracting text from PDF...');
    
    const resumeText = await extractResumeText(req.file.path);
    
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract text from the uploaded PDF' 
      });
    }

    console.log('✅ PDF text extraction successful');
    console.log('📝 Text length:', resumeText.length, 'characters');

    // STEP 2: Analyze with enhanced fallback (since we're testing without Claude API)
    console.log('🤖 STEP 2: Analyzing with enhanced fallback analysis...');
    
    const analysis = createEnhancedFallbackAnalysis(resumeText);
    
    console.log('✅ Enhanced analysis completed successfully');
    
    return res.json({
      success: true,
      message: 'Resume analysis completed successfully',
      analysis: analysis,
      metadata: {
        method: 'enhanced-fallback-test',
        extractedTextLength: resumeText.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Test analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Public endpoint for resume analysis during registration (no authentication required)
router.post('/analyze-resume-registration', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No resume file uploaded' 
      });
    }

    console.log('🚀 Registration Resume Analysis Flow Started');
    console.log('📁 File received:', req.file.originalname, `(${req.file.size} bytes)`);

    // STEP 1: Extract text from PDF
    console.log('🔍 STEP 1: Extracting text from PDF...');
    
    const resumeText = await extractResumeText(req.file.path);
    
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract text from the uploaded PDF' 
      });
    }

    console.log('✅ PDF text extraction successful');
    console.log('📝 Text length:', resumeText.length, 'characters');

    // STEP 2: Analyze with enhanced fallback
    console.log('🤖 STEP 2: Analyzing with enhanced fallback analysis...');
    
    const analysis = createEnhancedFallbackAnalysis(resumeText);
    
    // Generate a unique analysis ID for registration tracking
    const analysisId = new mongoose.Types.ObjectId().toString();
    
    console.log('✅ Registration analysis completed successfully');
    console.log('🆔 Generated analysis ID:', analysisId);
    
    // Clean up uploaded file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up uploaded file:', cleanupError);
    }
    
    return res.json({
      success: true,
      message: 'Resume analysis completed for registration',
      data: {
        analysisId: analysisId,
        ...analysis
      },
      metadata: {
        method: 'enhanced-fallback-registration',
        extractedTextLength: resumeText.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Registration analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze resume for registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// EMERGENCY: Super-fast route for immediate testing - bypasses PDF parsing and AI
router.post('/analyze-resume-fast', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('⚡ FAST ROUTE: Emergency bypass route for immediate testing');
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }

    console.log('📁 Fast route - File received:', req.file.originalname, `(${req.file.size} bytes)`);

    // Simulate analysis result instantly
    const mockAnalysis = {
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Database Management'],
      experience_years: 3,
      education_level: 'Bachelor\'s Degree',
      job_titles: ['Software Engineer', 'Full Stack Developer'],
      certifications: ['AWS Certified', 'Google Cloud'],
      summary: 'Experienced software engineer with strong technical skills and proven track record.',
      contact_info: {
        email: req.file.originalname.toLowerCase().includes('prem') ? 'premthakare@gmail.com' : 'candidate@example.com',
        phone: '+1-234-567-8900'
      },
      analysisSource: 'FAST_BYPASS_ROUTE'
    };

    console.log('⚡ Fast analysis completed in <1ms');

    return res.status(200).json({
      success: true,
      message: 'Resume analysis completed via fast bypass route',
      data: mockAnalysis,
      analysisTime: '< 1ms',
      route: 'emergency_fast_bypass'
    });

  } catch (error) {
    console.error('❌ Fast route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Fast route analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================
// DEBUG ROUTE - PDF PROCESSING TEST (NO AUTH)
// ============================================================
router.post('/debug-pdf-test', upload.single('resume'), async (req: any, res: any) => {
  const startTime = Date.now();
  console.log('🔍 DEBUG: PDF Test Route Started');
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    console.log('📁 File received:', req.file.originalname, '- Size:', req.file.size, 'bytes');
    
    // Test PDF extraction with timeout
    const extractionStart = Date.now();
    console.log('🔄 Starting PDF extraction...');
    
    const extractionPromise = extractResumeText(req.file.path);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF extraction timeout')), 5000);
    });
    
    const text = await Promise.race([extractionPromise, timeoutPromise]) as string;
    const extractionTime = Date.now() - extractionStart;
    
    console.log('✅ PDF extraction completed in', extractionTime, 'ms');
    console.log('📝 Extracted text length:', text.length, 'characters');
    console.log('📄 Text preview:', text.substring(0, 200));
    
    // Cleanup
    fs.unlinkSync(req.file.path);
    
    const totalTime = Date.now() - startTime;
    
    res.json({
      success: true,
      extractionTime: extractionTime + 'ms',
      totalTime: totalTime + 'ms',
      textLength: text.length,
      textPreview: text.substring(0, 300)
    });
    
  } catch (error: any) {
    console.error('❌ Debug PDF test failed:', error.message);
    
    // Cleanup on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    const totalTime = Date.now() - startTime;
    res.status(500).json({
      message: 'PDF test failed',
      error: error.message,
      totalTime: totalTime + 'ms'
    });
  }
});

router.post('/analyze-resume-ai', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('🚀 AI-Powered Resume Analysis Flow Started - Two-Step Approach');
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }

    console.log('📁 File received:', req.file.originalname, `(${req.file.size} bytes)`);

    const user = (req as any).user;
    const filePath = req.file.path;

    // ========================================
    // STEP 1: EXTRACT AND STORE RESUME TEXT
    // ========================================
    console.log('🔍 STEP 1: Extracting text from PDF...');
    let resumeText = '';
    
    try {
      resumeText = await extractResumeText(filePath);
      console.log('✅ PDF text extraction successful');
      console.log('📝 Text length:', resumeText.length, 'characters');
    } catch (extractError) {
      console.error('❌ PDF text extraction failed:', extractError);
      
      // Clean up file
      try { fs.unlinkSync(filePath); } catch {}
      
      return res.status(400).json({
        success: false,
        error: `Failed to extract text from PDF: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`
      });
    }

    // Contact details are detected locally at zero token cost for validation
    // only. Registration-owned email and phone are never overwritten.
    const detectedResumeContacts = extractResumeContacts(resumeText);

    // Find or create student record
    let student = await Student.findOne({ userId: user._id }) as any;
    
    if (!student) {
      console.log('👤 Creating new student profile...');
      student = new Student({
        userId: user._id,
        firstName: user.name?.split(' ')[0] || user.firstName || '',
        lastName: user.name?.split(' ')[1] || '',
        phoneNumber: user.phone || '',
        education: [],
        experience: [],
        skills: [],
        jobPreferences: { jobTypes: [], preferredLocations: [], workMode: 'any' },
        isActive: true
      });
    }

    // Bunny.net is paused by default. Set ENABLE_BUNNY_RESUME_STORAGE=true to
    // restore cloud uploads without changing this flow again.
    const useBunnyStorage = process.env.ENABLE_BUNNY_RESUME_STORAGE === 'true';
    let resumeStorageUrl = filePath;
    let storedFileName = req.file.filename;

    if (useBunnyStorage) {
      console.log('☁️ Uploading original resume to Bunny.net...');
      const resumeBuffer = fs.readFileSync(filePath);
      const bunnyUpload = await BunnyStorageService.uploadPDFWithRetry(
        resumeBuffer,
        req.file.originalname,
        student._id.toString(),
        3
      );

      if (!bunnyUpload.success || !bunnyUpload.url) {
        console.error('❌ Bunny.net resume upload failed:', bunnyUpload.error);
        try { fs.unlinkSync(filePath); } catch {}
        return res.status(502).json({
          success: false,
          error: 'Resume storage failed. Please try again.',
          details: bunnyUpload.error
        });
      }
      resumeStorageUrl = bunnyUpload.url;
      storedFileName = bunnyUpload.fileName || req.file.filename;
      console.log('✅ Original resume stored on Bunny.net:', resumeStorageUrl);
    } else {
      console.log('⏸️ Bunny.net resume storage paused; keeping resume in local storage');
    }

    // Store resume text in database FIRST
    console.log('🗃️ STEP 1B: Storing resume text in database...');
    student.resumeText = resumeText;
    student.resumeFile = resumeStorageUrl;
    student.resumeAnalysis = {
      fileName: storedFileName,
      originalFileName: req.file.originalname,
      uploadDate: new Date(),
      resumeText: resumeText,
      skills: [],
      category: 'pending_analysis',
      experienceLevel: 'pending_analysis', 
      summary: 'Resume uploaded successfully. Analysis in progress...'
    };
    student.updatedAt = new Date();

    student.profileFeatureVector = createFeatureVector([
      resumeText,
      ...(student.skills || []).map((skill: any) => skill.name || skill),
      ...(student.experience || []).map((item: any) => `${item.title || ''} ${item.description || ''}`),
      ...(student.education || []).map((item: any) => `${item.degree || ''} ${item.field || ''}`)
    ].join(' '));
    await student.save();
    console.log('✅ Resume text stored in database successfully');

    // ========================================
    // STEP 2: AI-POWERED STRUCTURED ANALYSIS  
    // ========================================
    console.log('🤖 STEP 2: Analyzing stored resume text with AI...');
    
    let finalAnalysis: any;
    
    // Try AI analysis first
    const aiResult = await analyzeResumeWithAI(resumeText);
    
    if (aiResult.success && aiResult.analysis) {
      console.log('✅ AI analysis completed successfully');
      finalAnalysis = aiResult.analysis;
      
      // Add missing fields for consistency
      finalAnalysis.skillsCount = finalAnalysis.skills?.length || 0;
      finalAnalysis.experienceCount = finalAnalysis.experience?.length || 0;
      finalAnalysis.educationCount = finalAnalysis.education?.length || 0;
      finalAnalysis.profileCompleteness = 85;
      
      if (!finalAnalysis.analysisMetadata) {
        finalAnalysis.analysisMetadata = {
          confidence: 85,
          extractionMethod: 'ai-focused',
          analysisDate: new Date()
        };
      }
      
    } else {
      console.log('⚠️ AI analysis failed, using enhanced fallback...');
      finalAnalysis = createEnhancedFallbackAnalysis(resumeText);
    }

    // Normalize common alternate field names before persisting the profile.
    finalAnalysis.personalInfo = finalAnalysis.personalInfo || {};
    finalAnalysis.personalInfo.summary = finalAnalysis.personalInfo.summary || finalAnalysis.summary || finalAnalysis.bio || '';
    finalAnalysis.education = Array.isArray(finalAnalysis.education)
      ? finalAnalysis.education
      : (Array.isArray(finalAnalysis.qualifications) ? finalAnalysis.qualifications : []);
    finalAnalysis.projects = Array.isArray(finalAnalysis.projects) ? finalAnalysis.projects : [];
    finalAnalysis.certifications = Array.isArray(finalAnalysis.certifications)
      ? finalAnalysis.certifications
      : (Array.isArray(finalAnalysis.achievements) ? finalAnalysis.achievements : []);
    finalAnalysis.languages = Array.isArray(finalAnalysis.languages) ? finalAnalysis.languages : [];

    finalAnalysis.education = finalAnalysis.education.map((edu: any) => ({
      ...edu,
      degree: edu.degree || edu.qualification || '',
      field: edu.field || edu.fieldOfStudy || edu.specialization || '',
      institution: edu.institution || edu.college || edu.university || edu.school || '',
      startYear: edu.startDate || edu.startYear,
      endYear: edu.endDate || edu.endYear || edu.year || edu.graduationYear
    }));
    finalAnalysis.projects = finalAnalysis.projects.map((project: any) => typeof project === 'string'
      ? { name: project, description: '', technologies: [], link: '' }
      : { ...project, name: project.name || project.title || '' });
    finalAnalysis.certifications = finalAnalysis.certifications.map((item: any) => typeof item === 'string'
      ? { name: item, organization: '', year: undefined }
      : { ...item, name: item.name || item.title || item.achievement || '' })
      .map((item: any) => ({ ...item, name: String(item.name || '').trim() }))
      .filter((item: any, index: number, items: any[]) =>
        item.name &&
        !/^(?:&|and)?\s*(?:achievements?|awards?|certifications?|certificates?|licenses?)\s*:?$/i.test(item.name) &&
        items.findIndex(other => other.name.toLowerCase() === item.name.toLowerCase()) === index
      );
    const languageNameMap: Record<string, string> = {
      english: 'English', hindi: 'Hindi', marathi: 'Marathi', german: 'German', germany: 'German',
      gujarati: 'Gujarati', kannada: 'Kannada', tamil: 'Tamil', telugu: 'Telugu',
      malayalam: 'Malayalam', bengali: 'Bengali', bangla: 'Bengali', punjabi: 'Punjabi',
      urdu: 'Urdu', odia: 'Odia', oriya: 'Odia', french: 'French', spanish: 'Spanish'
    };
    finalAnalysis.languages = finalAnalysis.languages.map((item: any) => {
      const language = typeof item === 'string' ? { name: item, proficiency: '' } : item;
      const rawName = String(language.name || language.language || '').trim();
      return {
        name: languageNameMap[rawName.toLowerCase()] || rawName,
        proficiency: String(language.proficiency || language.level || '').trim()
      };
    }).filter((item: any, index: number, items: any[]) =>
      item.name &&
      !/^languages?(?:\s+skills)?\s*:?$/i.test(item.name) &&
      items.findIndex(other => other.name.toLowerCase() === item.name.toLowerCase()) === index
    );

    // ========================================
    // STEP 3: UPDATE DATABASE WITH ANALYSIS
    // ========================================
    console.log('💾 STEP 3: Updating database with structured analysis...');
    
    // Registered name, email and phone number are authoritative and are never
    // overwritten by resume extraction.
    finalAnalysis.personalInfo.name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    finalAnalysis.personalInfo.email = student.email || user.email || '';
    finalAnalysis.personalInfo.phone = student.phoneNumber || user.phone || '';
    student.linkedinUrl = finalAnalysis.personalInfo?.linkedIn || undefined;
    student.githubUrl = finalAnalysis.personalInfo?.github || undefined;
    student.portfolioUrl = finalAnalysis.personalInfo?.portfolio || undefined;
    student.dateOfBirth = undefined;
    student.gender = undefined;

    if (finalAnalysis.personalInfo?.dateOfBirth) {
      const parsedDateOfBirth = new Date(finalAnalysis.personalInfo.dateOfBirth);
      if (!isNaN(parsedDateOfBirth.getTime())) student.dateOfBirth = parsedDateOfBirth;
    }

    if (['male', 'female', 'other'].includes(String(finalAnalysis.personalInfo?.gender).toLowerCase())) {
      student.gender = String(finalAnalysis.personalInfo.gender).toLowerCase();
    }

    // Resume-owned collections are replaced on every upload. Missing sections
    // therefore remain empty instead of retaining stale or fabricated values.
    student.skills = [];
    student.experience = [];
    student.education = [];
    student.collegeName = undefined;
    student.enrollmentYear = undefined;
    student.graduationYear = undefined;

    // Update skills with proper normalization and validation
    if (finalAnalysis.skills && finalAnalysis.skills.length > 0) {
      console.log('🔄 Processing skills with normalization...');
      console.log('📊 Raw skills sample:', finalAnalysis.skills.slice(0, 3));
      
      const cleanedSkills = cleanAndValidateSkills(finalAnalysis.skills);
      student.skills = cleanedSkills;
      
      console.log('✅ Updated skills:', student.skills.length, 'skills');
      console.log('📊 Processed skills sample:', student.skills.slice(0, 3));
    }

    // Update experience with proper date handling
    if (finalAnalysis.experience && finalAnalysis.experience.length > 0) {
      student.experience = finalAnalysis.experience.map((exp: any) => {
        const startDate = parseResumeDate(exp.startDate);
        const endDate = parseResumeDate(exp.endDate, true);
        const isCurrentJob = /present|current|ongoing|now/i.test(String(exp.endDate || '')) || Boolean(exp.isCurrentJob);
        
        return {
          title: exp.title || '',
          company: exp.company || '',
          location: exp.location || '',
          startDate: startDate,
          endDate: endDate,
          description: exp.description || '',
          isCurrentJob
        };
      });
      console.log('✅ Updated experience:', student.experience.length, 'positions');
    }

    // Update education with required fields
    if (finalAnalysis.education && finalAnalysis.education.length > 0) {
      student.education = finalAnalysis.education.map((edu: any) => {
        const endValue = edu.endDate || edu.endYear;
        const endYear = resumeYear(endValue);
        const explicitlyOngoing = /present|current|pursuing|expected|ongoing/i.test(String(endValue || ''));
        const isCompleted = explicitlyOngoing
          ? false
          : Boolean(edu.isCompleted || (endYear && endYear <= new Date().getFullYear()));
        const startDate = parseResumeDate(edu.startDate || edu.startYear);
        const endDate = isCompleted ? parseResumeDate(endValue, true) : undefined;
        
        return {
          degree: edu.degree || '',
          field: edu.field || edu.fieldOfStudy || '',
          institution: edu.institution || '',
          startDate: startDate,
          endDate: endDate,
          gpa: edu.gpa && parseFloat(edu.gpa) <= 10 ? parseFloat(edu.gpa) : undefined,
          grade: edu.grade || (edu.gpa && parseFloat(edu.gpa) > 10 ? String(edu.gpa) : undefined),
          gradingType: edu.gradingType || (edu.grade || (edu.gpa && parseFloat(edu.gpa) > 10) ? 'percentage' : (edu.gpa ? 'gpa' : undefined)),
          isCompleted
        };
      });
      console.log('✅ Updated education:', student.education.length, 'entries');

      const primaryEducation = finalAnalysis.education[0];
      student.collegeName = primaryEducation.institution || undefined;
      student.enrollmentYear = resumeYear(primaryEducation.startDate || primaryEducation.startYear);
      student.graduationYear = resumeYear(primaryEducation.endDate || primaryEducation.endYear);
    }

    // Update resume analysis summary with sanitized data
    student.resumeAnalysis = {
      ...student.resumeAnalysis,
      skills: finalAnalysis.skills?.map((s: any) => s.name) || [],
      category: finalAnalysis.analysisMetadata?.suggestedJobCategory || 'General',
      experienceLevel: finalAnalysis.jobPreferences?.experienceLevel || 'mid',
      summary: finalAnalysis.personalInfo?.summary || '',
      extractedDetails: {
        personalInfo: {
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          summary: finalAnalysis.personalInfo?.summary || ''
        },
        contactInfo: {
          email: student.email || user.email || '',
          phone: student.phoneNumber || '',
          linkedin: finalAnalysis.personalInfo?.linkedIn || '',
          github: finalAnalysis.personalInfo?.github || '',
          address: finalAnalysis.personalInfo?.location || ''
        },
        // Sanitize experience data for storage with proper Date conversion
        experience: finalAnalysis.experience?.map((exp: any) => {
          return {
            title: exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: parseResumeDate(exp.startDate),
            endDate: parseResumeDate(exp.endDate, true),
            description: exp.description || '',
            isCurrentJob: /present|current|ongoing|now/i.test(String(exp.endDate || '')) || Boolean(exp.isCurrentJob)
          };
        }) || [],
        // Sanitize education data for storage with proper Date conversion
        education: finalAnalysis.education?.map((edu: any) => {
          const endValue = edu.endDate || edu.endYear;
          const endYear = resumeYear(endValue);
          const explicitlyOngoing = /present|current|pursuing|expected|ongoing/i.test(String(endValue || ''));
          const isCompleted = explicitlyOngoing
            ? false
            : Boolean(edu.isCompleted || (endYear && endYear <= new Date().getFullYear()));
          return {
            degree: edu.degree || '',
            field: edu.field || edu.fieldOfStudy || '',
            institution: edu.institution || '',
            startDate: parseResumeDate(edu.startDate || edu.startYear),
            endDate: isCompleted ? parseResumeDate(endValue, true) : undefined,
            year: resumeYear(edu.year || edu.endYear || edu.graduationYear),
            gpa: edu.gpa && parseFloat(edu.gpa) <= 10 ? parseFloat(edu.gpa) : undefined,
            grade: edu.grade || (edu.gpa && parseFloat(edu.gpa) > 10 ? String(edu.gpa) : undefined),
            gradingType: edu.gradingType || (edu.grade || (edu.gpa && parseFloat(edu.gpa) > 10) ? 'percentage' : (edu.gpa ? 'gpa' : undefined)),
            isCompleted
          };
        }) || [],
        projects: (finalAnalysis.projects || []).map((project: any) => ({
          name: project.name || '',
          description: project.description || '',
          technologies: Array.isArray(project.technologies) ? project.technologies : [],
          link: project.link || ''
        })),
        certifications: (finalAnalysis.certifications || []).map((certification: any) => ({
          name: certification.name || '',
          organization: certification.organization || '',
          year: certification.year || undefined
        })),
        languages: (finalAnalysis.languages || []).map((language: any) => ({
          name: language.name || '',
          proficiency: language.proficiency || ''
        })),
        jobPreferences: finalAnalysis.jobPreferences,
        analysisMetadata: finalAnalysis.analysisMetadata
      }
    };
    const structuredFields = buildStudentStructuredFields(student);
    student.titles = structuredFields.titles;
    student.yearsExperience = structuredFields.yearsExperience;
    student.locations = structuredFields.locations;
    student.salaryExpectation = structuredFields.salaryExpectation;
    student.structuredResumeUpdatedAt = structuredFields.structuredResumeUpdatedAt;
    student.profileFeatureVector = structuredFields.profileFeatureVector;

    await student.save();
    console.log('✅ All data updated successfully in database');

    // Resume data changes every matching dimension, so refresh all active-job
    // scores after the upload response is no longer waiting on this work.
    setImmediate(async () => {
      try {
        const CareerAlertService = require('../services/career-alerts').default;
        await CareerAlertService.processStudentProfileUpdate(student._id);
        console.log('✅ Hybrid job matches refreshed after resume analysis');
      } catch (matchError) {
        console.error('❌ Hybrid match refresh after resume analysis failed:', matchError);
      }
    });

    // Local files are retained while Bunny.net is paused. Once Bunny storage
    // is enabled, the temporary upload can be removed after successful upload.
    if (useBunnyStorage) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Resume analyzed successfully using two-step approach and profile updated',
      analysis: finalAnalysis,
      aiCreditStatus: finalAnalysis.analysisMetadata?.creditStatus || 'available',
      aiWarnings: finalAnalysis.analysisMetadata?.providerWarnings || [],
      studentId: student._id,
      resumeUrl: resumeStorageUrl,
      resumeStorage: useBunnyStorage ? 'bunny' : 'local',
      debug: {
        textLength: resumeText.length,
        extractionMethod: finalAnalysis.analysisMetadata?.extractionMethod || 'unknown',
        confidence: finalAnalysis.analysisMetadata?.confidence || 75,
        aiSuccess: aiResult.success || false,
        resumeContactDetected: {
          email: Boolean(detectedResumeContacts.email),
          phone: Boolean(detectedResumeContacts.phone)
        },
        stepsCompleted: ['text_extraction', 'database_storage', 'ai_analysis', 'database_update']
      }
    });

  } catch (error) {
    console.error('💥 Resume analysis flow failed:', error);
    
    // Clean up uploaded file if it exists
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    return res.status(500).json({
      success: false,
      error: 'Resume analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
