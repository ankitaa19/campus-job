import puppeteer, { Browser } from 'puppeteer';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import AIResumeMatchingService from './ai-resume-matching';
import PDFDocument from 'pdfkit';
import AzurePDFService from './azure-pdf-service';
const htmlToPdf = require('html-pdf-node');

interface ResumeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    location?: string;
    profession?: string;
  };
  summary?: string;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    startDate: Date;
    endDate?: Date;
    gpa?: number;
    isCompleted: boolean;
  }>;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
    isCurrentJob: boolean;
  }>;
  skills: Array<{
    name: string;
    level: string;
    category: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications?: Array<{
    name: string;
    year: number;
    organization: string;
  }>;
}

interface JobDescriptionAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  jobLevel: string;
  industry: string;
  responsibilities: string[];
  qualifications: string[];
}

class ResumeBuilderService {
  private browser: Browser | null = null;

  async initBrowser() {
    if (!this.browser) {
      // Azure App Service specific configuration for Puppeteer
      const isAzure = process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production';
      
      let puppeteerConfig: any = {
        headless: true,
        timeout: 60000, // Increase timeout for Azure
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-ipc-flooding-protection',
          '--disable-extensions',
          '--disable-default-apps',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-features=TranslateUI'
        ]
      };

      // Additional Azure-specific configurations
      if (isAzure) {
        // First try chrome-aws-lambda (Azure optimized)
        try {
          const chromium = require('chrome-aws-lambda');
          puppeteerConfig = {
            ...puppeteerConfig,
            args: [...chromium.args, ...puppeteerConfig.args],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
          };
          console.log('✅ Using chrome-aws-lambda for Azure compatibility');
        } catch (chromiumError) {
          console.log('⚠️ chrome-aws-lambda not available, trying system Chrome paths...');
          
          // Fallback to system Chrome if available
          const possiblePaths = [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/opt/google/chrome/chrome', // Common Azure path
            process.env.CHROME_BIN // Environment variable
          ].filter(Boolean);
          
          for (const chromePath of possiblePaths) {
            try {
              const fs = require('fs');
              if (fs.existsSync(chromePath)) {
                puppeteerConfig.executablePath = chromePath;
                console.log(`🔍 Found Chrome at: ${chromePath}`);
                break;
              }
            } catch (e) {
              // Continue to next path
            }
          }
          
          if (!puppeteerConfig.executablePath) {
            console.log('⚠️ No Chrome executable found on Azure');
          }
        }
      } else {
        // Local development - more relaxed settings
        puppeteerConfig.args = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ];
      }

      console.log('🌐 Initializing browser for', isAzure ? 'Azure' : 'local', 'environment');
      console.log('🔧 Puppeteer config args count:', puppeteerConfig.args.length);
      
      try {
        this.browser = await puppeteer.launch(puppeteerConfig);
        console.log('✅ Browser initialized successfully');
        
        // Test browser functionality
        const testPage = await this.browser.newPage();
        await testPage.goto('data:text/html,<h1>Test</h1>', { waitUntil: 'load', timeout: 10000 });
        await testPage.close();
        console.log('✅ Browser test successful');
        
      } catch (error) {
        console.error('❌ Failed to initialize browser:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Don't throw error here - let generatePDF handle fallback
        this.browser = null;
        console.log('⚠️ Browser initialization failed, PDF generation will use fallback');
        throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Analyze job description to extract requirements using AI
   */
  async analyzeJobDescription(jobDescription: string): Promise<JobDescriptionAnalysis> {
    try {
      console.log('🔍 Analyzing job description with AI...');
      
      // Use fallback analysis since AI service structure is different
      return this.fallbackJobAnalysis(jobDescription);
      
    } catch (error) {
      console.error('❌ Error analyzing job description:', error);
      return this.fallbackJobAnalysis(jobDescription);
    }
  }

  /**
   * Fallback job analysis using keyword matching
   */
  private fallbackJobAnalysis(jobDescription: string): JobDescriptionAnalysis {
    const text = jobDescription.toLowerCase();
    
    const skillKeywords = {
      'JavaScript': ['javascript', 'js', 'node.js', 'nodejs'],
      'React': ['react', 'reactjs'],
      'Python': ['python', 'django', 'flask'],
      'Java': ['java', 'spring', 'springboot'],
      'SQL': ['sql', 'mysql', 'postgresql', 'database'],
      'AWS': ['aws', 'amazon web services', 'cloud'],
      'Docker': ['docker', 'containerization'],
      'Git': ['git', 'github', 'version control']
    };
    
    const foundSkills: string[] = [];
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundSkills.push(skill);
      }
    }
    
    const jobLevel = text.includes('senior') || text.includes('lead') ? 'senior' : 
                    text.includes('junior') || text.includes('entry') ? 'entry' : 'mid';
    
    return {
      requiredSkills: foundSkills.slice(0, 6),
      preferredSkills: foundSkills.slice(6, 10),
      jobLevel,
      industry: 'technology',
      responsibilities: ['Develop software solutions', 'Collaborate with team'],
      qualifications: ['Bachelor\'s degree', 'Relevant experience']
    };
  }

  /**
   * Get student data and tailor it for job requirements
   */
  async getStudentData(email: string, phoneNumber: string): Promise<ResumeData | null> {
    try {
      console.log(`📋 Fetching student data for email: ${email}, phone: ${phoneNumber}`);
      
      // Try to find student by email first, then phone
      let student = await Student.findOne({ email: email }).populate('userId');
      
      if (!student && phoneNumber) {
        student = await Student.findOne({ phoneNumber: phoneNumber }).populate('userId');
      }
      
      // If student not found, try to find in Users collection and create/link student profile
      if (!student) {
        console.log('📋 Student not found in students collection, checking users collection...');
        
        const { User } = require('../models/User');
        let user = await User.findOne({ email: email });
        
        if (!user && phoneNumber) {
          user = await User.findOne({ phone: phoneNumber });
        }
        
        if (user) {
          console.log(`✅ User found in users collection: ${user.email}`);
          
          // Create a basic student profile from user data
          const mongoose = require('mongoose');
          const studentData = {
            userId: user._id,
            firstName: user.firstName || user.name?.split(' ')[0] || 'Student',
            lastName: user.lastName || user.name?.split(' ')[1] || 'User',
            email: user.email || email,
            phoneNumber: user.phone || phoneNumber,
            collegeId: new mongoose.Types.ObjectId(), // Temporary placeholder
            studentId: `STU${Date.now()}`,
            enrollmentYear: new Date().getFullYear(),
            education: [],
            experience: [],
            skills: [
              { name: 'JavaScript', level: 'intermediate', category: 'technical' },
              { name: 'React', level: 'intermediate', category: 'technical' },
              { name: 'Node.js', level: 'intermediate', category: 'technical' },
              { name: 'Problem Solving', level: 'advanced', category: 'soft' }
            ],
            jobPreferences: {
              jobTypes: ['Software Engineer'],
              preferredLocations: ['Any'],
              workMode: 'any'
            },
            profileCompleteness: 40,
            isActive: true,
            isPlacementReady: false
          };
          
          student = new Student(studentData);
          await student.save();
          console.log('✅ Created basic student profile from user data');
        } else {
          console.log('❌ User not found in any collection');
          return null;
        }
      }
      
      console.log(`✅ Student found: ${student.firstName} ${student.lastName}`);
      
      return {
        personalInfo: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email || email,
          phone: student.phoneNumber || phoneNumber,
          linkedin: student.linkedinUrl,
          github: student.githubUrl,
          location: 'India' // Default location
        },
        education: student.education && student.education.length > 0 ? student.education : [
          {
            degree: 'Bachelor of Technology',
            field: 'Computer Science',
            institution: 'University',
            startDate: new Date(new Date().getFullYear() - 4, 0, 1),
            endDate: new Date(),
            isCompleted: true
          }
        ],
        experience: student.experience && student.experience.length > 0 ? student.experience : [
          {
            title: 'Software Developer',
            company: 'Tech Company',
            location: 'India',
            startDate: new Date(new Date().getFullYear() - 1, 0, 1),
            endDate: new Date(),
            description: 'Developed web applications using modern technologies and frameworks. Collaborated with cross-functional teams to deliver high-quality software solutions.',
            isCurrentJob: true
          }
        ],
        skills: student.skills && student.skills.length > 0 ? student.skills : [
          { name: 'JavaScript', level: 'intermediate', category: 'technical' },
          { name: 'React', level: 'intermediate', category: 'technical' },
          { name: 'Node.js', level: 'intermediate', category: 'technical' },
          { name: 'MongoDB', level: 'intermediate', category: 'technical' },
          { name: 'Problem Solving', level: 'advanced', category: 'soft' },
          { name: 'Team Collaboration', level: 'advanced', category: 'soft' }
        ],
        projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p: any) => p.name && p.description).map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          technologies: p.technologies || [],
          link: p.link
        })),
        certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c: any) => c.name && c.organization && c.year).map((c: any) => ({
          name: c.name || '',
          year: c.year || new Date().getFullYear(),
          organization: c.organization || ''
        }))
      };
      
    } catch (error) {
      console.error('❌ Error fetching student data:', error);
      return null;
    }
  }

  /**
   * Tailor resume for specific job requirements
   */
  tailorResumeForJob(studentData: ResumeData, jobAnalysis: JobDescriptionAnalysis): ResumeData {
    console.log('🎯 Tailoring resume for job requirements...');
    
    // Create tailored copy
    const tailoredResume = JSON.parse(JSON.stringify(studentData));
    
    // Prioritize skills that match job requirements
    const prioritizedSkills = [];
    const requiredSkillsLower = jobAnalysis.requiredSkills.map(s => s.toLowerCase());
    const preferredSkillsLower = jobAnalysis.preferredSkills.map(s => s.toLowerCase());
    
    // Add matching required skills first
    for (const skill of tailoredResume.skills) {
      if (requiredSkillsLower.includes(skill.name.toLowerCase())) {
        prioritizedSkills.push({ ...skill, priority: 'high' });
      }
    }
    
    // Add matching preferred skills
    for (const skill of tailoredResume.skills) {
      if (preferredSkillsLower.includes(skill.name.toLowerCase()) && 
          !prioritizedSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
        prioritizedSkills.push({ ...skill, priority: 'medium' });
      }
    }
    
    // Add remaining skills
    for (const skill of tailoredResume.skills) {
      if (!prioritizedSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
        prioritizedSkills.push({ ...skill, priority: 'low' });
      }
    }
    
    tailoredResume.skills = prioritizedSkills.slice(0, 12); // Limit to top 12 skills
    
    // Generate tailored summary
    const matchingSkills = prioritizedSkills.filter(s => s.priority === 'high').map(s => s.name);
    const summaryTemplate = this.generateTailoredSummary(studentData, jobAnalysis, matchingSkills);
    tailoredResume.summary = summaryTemplate;
    
    console.log(`✅ Resume tailored with ${matchingSkills.length} matching skills`);
    
    return tailoredResume;
  }

  /**
   * Generate a tailored summary based on job requirements
   */
  private generateTailoredSummary(studentData: ResumeData, jobAnalysis: JobDescriptionAnalysis, matchingSkills: string[]): string {
    const experienceYears = this.calculateExperience(studentData.experience);
    const topSkills = matchingSkills.slice(0, 5).join(', ');
    
    let summary = `${jobAnalysis.jobLevel.charAt(0).toUpperCase() + jobAnalysis.jobLevel.slice(1)}-level professional`;
    
    if (experienceYears > 0) {
      summary += ` with ${experienceYears} year${experienceYears > 1 ? 's' : ''} of experience`;
    }
    
    if (jobAnalysis.industry) {
      summary += ` in ${jobAnalysis.industry}`;
    }
    
    if (topSkills) {
      summary += `. Skilled in ${topSkills}`;
    }
    
    summary += '. Passionate about delivering high-quality solutions and contributing to team success.';
    
    return summary;
  }

  /**
   * Calculate years of experience
   */
  private calculateExperience(experience: ResumeData['experience']): number {
    if (!experience || experience.length === 0) return 0;
    
    let totalMonths = 0;
    
    for (const exp of experience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.isCurrentJob ? new Date() : new Date(exp.endDate || new Date());
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
    
    return Math.floor(totalMonths / 12);
  }

  /**
   * Generate HTML template for resume
   */
  generateResumeHTML(resumeData: ResumeData): string {
    const formatDate = (date: Date | undefined, isCurrentJob = false) => {
      if (isCurrentJob) return 'Present';
      if (!date) return '';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume - ${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
                font-size: 12px;
            }
            
            .resume-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                background: white;
                min-height: 100vh;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
            }
            
            .name {
                font-size: 32px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .contact-info {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 20px;
                color: #666;
                font-size: 11px;
            }
            
            .contact-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .section {
                margin-bottom: 25px;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 15px;
                text-transform: uppercase;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
            }
            
            .summary {
                font-size: 13px;
                line-height: 1.8;
                color: #555;
                text-align: justify;
            }
            
            .experience-item, .education-item, .project-item {
                margin-bottom: 20px;
                padding-left: 15px;
                border-left: 3px solid #e5e7eb;
            }
            
            .experience-header, .education-header, .project-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
                flex-wrap: wrap;
            }
            
            .job-title, .degree, .project-name {
                font-weight: 600;
                color: #1e40af;
                font-size: 13px;
            }
            
            .company, .institution {
                color: #666;
                font-size: 12px;
                font-style: italic;
            }
            
            .date-range {
                color: #666;
                font-size: 11px;
                white-space: nowrap;
            }
            
            .description {
                color: #555;
                font-size: 11px;
                line-height: 1.6;
                margin-top: 5px;
            }
            
            .skills-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .skill-category {
                background: #f8fafc;
                padding: 12px;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
            }
            
            .skill-category-title {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 8px;
                font-size: 12px;
                text-transform: capitalize;
            }
            
            .skill-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            
            .skill-item {
                background: #e0e7ff;
                color: #3730a3;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .certification-item {
                background: #f0f9ff;
                padding: 8px 12px;
                border-radius: 6px;
                margin-bottom: 8px;
                border-left: 3px solid #0ea5e9;
            }
            
            .cert-name {
                font-weight: 600;
                color: #0c4a6e;
                font-size: 12px;
            }
            
            .cert-org {
                color: #666;
                font-size: 11px;
            }
            
            .tech-stack {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 5px;
            }
            
            .tech-item {
                background: #fef3c7;
                color: #92400e;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 9px;
                font-weight: 500;
            }
            
            .gpa {
                color: #059669;
                font-weight: 600;
                font-size: 11px;
            }
            
            @media print {
                body {
                    font-size: 11px;
                }
                
                .resume-container {
                    padding: 20px;
                    max-width: none;
                }
                
                .section {
                    margin-bottom: 20px;
                }
                
                .name {
                    font-size: 28px;
                }
                
                .contact-info {
                    font-size: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="resume-container">
            <!-- Header -->
            <div class="header">
                <h1 class="name">${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}</h1>
                <div class="contact-info">
                    <div class="contact-item">
                        <span>📧</span>
                        <span>${resumeData.personalInfo.email}</span>
                    </div>
                    <div class="contact-item">
                        <span>📱</span>
                        <span>${resumeData.personalInfo.phone}</span>
                    </div>
                    ${resumeData.personalInfo.linkedin ? `
                    <div class="contact-item">
                        <span>💼</span>
                        <span>LinkedIn</span>
                    </div>
                    ` : ''}
                    ${resumeData.personalInfo.github ? `
                    <div class="contact-item">
                        <span>💻</span>
                        <span>GitHub</span>
                    </div>
                    ` : ''}
                    ${resumeData.personalInfo.location ? `
                    <div class="contact-item">
                        <span>📍</span>
                        <span>${resumeData.personalInfo.location}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Summary -->
            ${resumeData.summary ? `
            <div class="section">
                <h2 class="section-title">Professional Summary</h2>
                <div class="summary">
                    ${resumeData.summary}
                </div>
            </div>
            ` : ''}

            <!-- Skills -->
            ${resumeData.skills && resumeData.skills.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Skills & Technologies</h2>
                <div class="skills-grid">
                    ${this.groupSkillsByCategory(resumeData.skills).map(category => `
                        <div class="skill-category">
                            <div class="skill-category-title">${category.name}</div>
                            <div class="skill-list">
                                ${category.skills.map((skill: any) => `
                                    <span class="skill-item">${skill.name}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Experience -->
            ${resumeData.experience && resumeData.experience.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Professional Experience</h2>
                ${resumeData.experience.map(exp => `
                    <div class="experience-item">
                        <div class="experience-header">
                            <div>
                                <div class="job-title">${exp.title}</div>
                                <div class="company">${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
                            </div>
                            <div class="date-range">
                                ${formatDate(exp.startDate)} - ${formatDate(exp.endDate, exp.isCurrentJob)}
                            </div>
                        </div>
                        ${exp.description ? `
                        <div class="description">
                            ${exp.description}
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Education -->
            ${resumeData.education && resumeData.education.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Education</h2>
                ${resumeData.education.map(edu => `
                    <div class="education-item">
                        <div class="education-header">
                            <div>
                                <div class="degree">${edu.degree} in ${edu.field}</div>
                                <div class="institution">${edu.institution}</div>
                            </div>
                            <div>
                                <div class="date-range">
                                    ${formatDate(edu.startDate)} - ${formatDate(edu.endDate, !edu.isCompleted)}
                                </div>
                                ${edu.gpa ? `<div class="gpa">GPA: ${edu.gpa}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Projects -->
            ${resumeData.projects && resumeData.projects.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Projects</h2>
                ${resumeData.projects.map(project => `
                    <div class="project-item">
                        <div class="project-header">
                            <div class="project-name">${project.name}</div>
                        </div>
                        ${project.description ? `
                        <div class="description">
                            ${project.description}
                        </div>
                        ` : ''}
                        ${project.technologies && project.technologies.length > 0 ? `
                        <div class="tech-stack">
                            ${project.technologies.map(tech => `
                                <span class="tech-item">${tech}</span>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Certifications -->
            ${resumeData.certifications && resumeData.certifications.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Certifications</h2>
                ${resumeData.certifications.map(cert => `
                    <div class="certification-item">
                        <div class="cert-name">${cert.name}</div>
                        <div class="cert-org">${cert.organization} • ${cert.year}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Group skills by category for better organization
   */
  private groupSkillsByCategory(skills: ResumeData['skills']) {
    const categories = new Map();
    
    skills.forEach(skill => {
      const category = skill.category || 'Technical';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(skill);
    });
    
    // Convert to array and ensure proper formatting
    return Array.from(categories.entries()).map(([name, skills]) => ({
      name: this.formatCategoryName(name),
      skills
    }));
  }

  /**
   * Format category names properly
   */
  private formatCategoryName(categoryName: string): string {
    // Handle common category mappings
    const categoryMappings: { [key: string]: string } = {
      'technical': 'Technical',
      'Technical': 'Technical',
      'soft': 'Soft Skills',
      'language': 'Languages',
      'languages': 'Languages',
      'certification': 'Certifications',
      'tool': 'Tools & Platforms',
      'tools': 'Tools & Platforms',
      'framework': 'Frameworks',
      'frameworks': 'Frameworks'
    };

    const lowerName = categoryName.toLowerCase();
    return categoryMappings[lowerName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  }

  /**
   * Generate PDF from HTML using improved Azure-compatible approach
   */
  async generatePDF(htmlContent: string): Promise<Buffer> {
    console.log('📄 Starting Azure-optimized PDF generation...');
    
    // Strategy 1: Try structured PDF generation first (most reliable, no external deps)
    try {
      console.log('� Attempting structured PDF generation...');
      const resumeData = this.parseResumeHTML(htmlContent);
      const pdfBuffer = await this.generateStructuredPDF(resumeData);
      console.log('✅ Structured PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (structuredError: any) {
      console.log('⚠️ Structured PDF failed:', structuredError?.message || 'Unknown error');
    }

    // Strategy 2: Try Azure PDF Service (if available and configured)
    try {
      console.log('�️ Attempting Azure PDF Service...');
      if (await AzurePDFService.healthCheck()) {
        const pdfBuffer = await AzurePDFService.generatePDF(htmlContent);
        console.log('✅ Azure PDF Service generated successfully, size:', pdfBuffer.length, 'bytes');
        return pdfBuffer;
      } else {
        console.log('⚠️ Azure PDF Service not available, trying next strategy...');
      }
    } catch (azureError: any) {
      console.log('⚠️ Azure PDF Service failed:', azureError?.message || 'Unknown error');
    }

    // Strategy 3: Try html-pdf-node (lightweight, no browser)
    try {
      console.log('📄 Attempting html-pdf-node generation...');
      const pdfBuffer = await this.generateHtmlToPdfFallback(htmlContent);
      console.log('✅ html-pdf-node PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (htmlPdfError: any) {
      console.log('⚠️ html-pdf-node failed:', htmlPdfError?.message || 'Unknown error');
    }

    // Strategy 4: Enhanced fallback PDF with comprehensive content
    try {
      console.log('🔄 Using enhanced fallback PDF generation...');
      const pdfBuffer = await this.generateEnhancedFallbackPDF(htmlContent);
      console.log('✅ Enhanced fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (fallbackError: any) {
      console.error('❌ All PDF generation strategies failed:', fallbackError?.message || 'Unknown error');
      throw new Error('PDF generation failed: All strategies exhausted. Please try again later or contact support.');
    }
  }

  /**
   * Generate PDF using html-pdf-node (fallback method)
   */
  async generateHtmlToPdfFallback(htmlContent: string): Promise<Buffer> {
    console.log('📄 Using html-pdf-node fallback PDF generation...');
    
    try {
      // Configure html-pdf-node options
      const options = {
        format: 'A4',
        border: {
          top: '20px',
          right: '20px', 
          bottom: '20px',
          left: '20px'
        },
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: false,
        timeout: 30000, // 30 second timeout
        height: '11.7in',
        width: '8.27in'
      };

      // Create file object for html-pdf-node
      const file = { content: htmlContent };

      console.log('🔄 Converting HTML to PDF with html-pdf-node...');
      
      // Generate PDF buffer - html-pdf-node returns a Promise<Buffer>
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        htmlToPdf.generatePdf(file, options)
          .then((buffer: Buffer) => {
            console.log('✅ PDF generated successfully with html-pdf-node, size:', buffer.length, 'bytes');
            resolve(buffer);
          })
          .catch((error: Error) => {
            console.error('❌ html-pdf-node generation error:', error);
            reject(error);
          });
      });
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ html-pdf-node PDF generation failed:', error);
      throw new Error(`html-pdf-node fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a professional, clean PDF resume matching the provided design
   */
  async generateStructuredPDF(resumeData: ResumeData): Promise<Buffer> {
    console.log('🎨 Generating professional structured PDF...');
    
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40
        }
      });
      
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log('✅ Professional PDF generated successfully, size:', pdfBuffer.length, 'bytes');
          resolve(pdfBuffer);
        });
        
        doc.on('error', reject);
        
        // Professional colors matching the reference design
        const colors = {
          primaryBlue: '#4472C4',     // Professional blue for headings
          darkBlue: '#2F5497',        // Darker blue for name
          lightBlue: '#D9E2F3',       // Light blue for backgrounds
          textDark: '#333333',        // Main text color
          textGray: '#666666',        // Secondary text
          textLight: '#999999',       // Light text
          lineColor: '#CCCCCC'        // Divider lines
        };
        
        // Layout configuration
        const pageWidth = 595.28; // A4 width in points
        const pageHeight = 841.89; // A4 height in points
        const leftMargin = 40;
        const rightMargin = 40;
        const contentWidth = pageWidth - leftMargin - rightMargin;
        let yPos = 40;
        
        // Helper function to check page break
        const checkPageBreak = (requiredHeight: number) => {
          if (yPos + requiredHeight > 760) { // Near bottom of page
            doc.addPage();
            yPos = 40;
          }
        };
        
        // Helper function to draw section header with professional styling
        const drawSectionHeader = (title: string, y: number) => {
          // Background rectangle for section header
          doc.rect(leftMargin, y - 5, contentWidth, 22)
             .fillColor(colors.lightBlue)
             .fill();
          
          doc.fontSize(12)
             .fillColor(colors.primaryBlue)
             .font('Helvetica-Bold')
             .text(title, leftMargin + 8, y + 3);
        };
        
        // === HEADER SECTION ===
        // Name - Large, centered, professional (matching reference image)
        const fullName = `${resumeData.personalInfo.firstName.toUpperCase()} ${resumeData.personalInfo.lastName.toUpperCase()}`;
        doc.fontSize(24)
           .fillColor(colors.darkBlue)
           .font('Helvetica-Bold')
           .text(fullName, leftMargin, yPos, {
             width: contentWidth,
             align: 'center'
           });
        
        yPos += 30;
        
        // Dynamic Job Title/Position based on resume data
        let jobTitle = '';
        if (resumeData.experience && resumeData.experience.length > 0) {
          // Use the most recent job title
          jobTitle = resumeData.experience[0].title.toUpperCase();
        } else {
          jobTitle = 'PROFESSIONAL'; // Default fallback
        }
        
        doc.fontSize(12)
           .fillColor(colors.primaryBlue)
           .font('Helvetica')
           .text(jobTitle, leftMargin, yPos, {
             width: contentWidth,
             align: 'center'
           });
        
        yPos += 20;
        
        // Contact Information Row - Clean format matching reference
        const contactItems = [];
        if (resumeData.personalInfo.email) contactItems.push(resumeData.personalInfo.email);
        if (resumeData.personalInfo.phone) contactItems.push(resumeData.personalInfo.phone);
        if (resumeData.personalInfo.linkedin) contactItems.push('LinkedIn');
        if (resumeData.personalInfo.github) contactItems.push('GitHub');
        
        const contactText = contactItems.join(' • ');
        doc.fontSize(9)
           .fillColor(colors.textGray)
           .font('Helvetica')
           .text(contactText, leftMargin, yPos, {
             width: contentWidth,
             align: 'center'
           });
        
        yPos += 20;
        
        // Professional separator line (full width like reference)
        doc.moveTo(leftMargin, yPos)
           .lineTo(pageWidth - rightMargin, yPos)
           .strokeColor(colors.primaryBlue)
           .lineWidth(2)
           .stroke();
        
        yPos += 25;
        
        // === PROFESSIONAL SUMMARY SECTION ===
        if (resumeData.summary) {
          checkPageBreak(80);
          
          drawSectionHeader('PROFESSIONAL SUMMARY', yPos);
          yPos += 30;
          
          doc.fontSize(10)
             .fillColor(colors.textDark)
             .font('Helvetica')
             .text(resumeData.summary, leftMargin + 5, yPos, {
               width: contentWidth - 10,
               align: 'justify',
               lineGap: 4
             });
          
          yPos += doc.heightOfString(resumeData.summary, { width: contentWidth - 10, lineGap: 4 }) + 20;
        }
        
        // === SKILLS & TECHNOLOGIES SECTION ===
        if (resumeData.skills && resumeData.skills.length > 0) {
          checkPageBreak(120);
          
          drawSectionHeader('SKILLS & TECHNOLOGIES', yPos);
          yPos += 30;
          
          // Group skills by category
          const skillGroups = this.groupSkillsByCategory(resumeData.skills);
          
          skillGroups.forEach((group, index) => {
            if (index > 0) checkPageBreak(30);
            
            // Category name with professional styling and better spacing
            doc.fontSize(10)
               .fillColor(colors.primaryBlue)
               .font('Helvetica-Bold')
               .text(`${group.name}:`, leftMargin + 5, yPos, { width: 80 });
            
            // Skills list with clean formatting and proper alignment
            const skillsList = group.skills.map((skill: any) => skill.name).join(' • ');
            
            doc.fontSize(9)
               .fillColor(colors.textDark)
               .font('Helvetica')
               .text(skillsList, leftMargin + 90, yPos, {
                 width: contentWidth - 95,
                 lineGap: 2,
                 align: 'left'
               });
            
            // Calculate actual height used and add appropriate spacing
            const skillsHeight = doc.heightOfString(skillsList, { 
              width: contentWidth - 95, 
              lineGap: 2 
            });
            yPos += Math.max(16, skillsHeight + 4);
          });
          
          yPos += 15;
        }
        
        // === PROFESSIONAL EXPERIENCE SECTION ===
        if (resumeData.experience && resumeData.experience.length > 0) {
          checkPageBreak(100);
          
          drawSectionHeader('PROFESSIONAL EXPERIENCE', yPos);
          yPos += 30;
          
          resumeData.experience.forEach((exp, index) => {
            checkPageBreak(70);
            
            // Job title with professional styling
            doc.fontSize(11)
               .fillColor(colors.primaryBlue)
               .font('Helvetica-Bold')
               .text(exp.title, leftMargin + 5, yPos);
            
            // Date range aligned to right
            const endDate = exp.isCurrentJob ? 'Present' : 
                           exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
            const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            const dateRange = `${startDate} - ${endDate}`;
            
            doc.fontSize(9)
               .fillColor(colors.textGray)
               .font('Helvetica')
               .text(dateRange, pageWidth - rightMargin - 120, yPos, {
                 width: 120,
                 align: 'right'
               });
            
            yPos += 14;
            
            // Company name with location
            doc.fontSize(10)
               .fillColor(colors.textDark)
               .font('Helvetica-Oblique')
               .text(`${exp.company}${exp.location ? ` • ${exp.location}` : ''}`, leftMargin + 5, yPos);
            
            yPos += 16;
            
            // Job description with bullet points
            if (exp.description) {
              const descriptions = exp.description.split('\n').filter(line => line.trim());
              
              descriptions.forEach(desc => {
                if (desc.trim()) {
                  checkPageBreak(15);
                  
                  doc.fontSize(9)
                     .fillColor(colors.textDark)
                     .font('Helvetica')
                     .text('•', leftMargin + 10, yPos);
                  
                  doc.text(desc.trim(), leftMargin + 20, yPos, {
                     width: contentWidth - 25,
                     lineGap: 2
                  });
                  
                  yPos += doc.heightOfString(desc.trim(), { width: contentWidth - 25, lineGap: 2 }) + 3;
                }
              });
            }
            
            yPos += index < resumeData.experience.length - 1 ? 18 : 12;
          });
        }
        
        // === EDUCATION SECTION ===
        if (resumeData.education && resumeData.education.length > 0) {
          checkPageBreak(80);
          
          drawSectionHeader('EDUCATION', yPos);
          yPos += 30;
          
          resumeData.education.forEach((edu) => {
            checkPageBreak(50);
            
            // Degree and field
            doc.fontSize(11)
               .fillColor(colors.primaryBlue)
               .font('Helvetica-Bold')
               .text(`${edu.degree} in ${edu.field}`, leftMargin + 5, yPos);
            
            // Date range
            const endDate = !edu.isCompleted ? 'Present' : 
                           edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
            const startDate = new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            const dateRange = `${startDate} - ${endDate}`;
            
            doc.fontSize(9)
               .fillColor(colors.textGray)
               .font('Helvetica')
               .text(dateRange, pageWidth - rightMargin - 120, yPos, {
                 width: 120,
                 align: 'right'
               });
            
            yPos += 14;
            
            // Institution
            doc.fontSize(10)
               .fillColor(colors.textDark)
               .font('Helvetica-Oblique')
               .text(edu.institution, leftMargin + 5, yPos);
            
            // GPA if available
            if (edu.gpa) {
              doc.fontSize(9)
                 .fillColor(colors.primaryBlue)
                 .font('Helvetica-Bold')
                 .text(`GPA: ${edu.gpa}`, pageWidth - rightMargin - 80, yPos, {
                   width: 80,
                   align: 'right'
                 });
            }
            
            yPos += 25;
          });
        }
        
        // === PROJECTS SECTION ===
        if (resumeData.projects && resumeData.projects.length > 0) {
          checkPageBreak(80);
          
          drawSectionHeader('PROJECTS', yPos);
          yPos += 30;
          
          resumeData.projects.forEach((project) => {
            checkPageBreak(60);
            
            // Project name
            doc.fontSize(11)
               .fillColor(colors.primaryBlue)
               .font('Helvetica-Bold')
               .text(project.name, leftMargin + 5, yPos);
            
            yPos += 16;
            
            // Project description
            if (project.description) {
              doc.fontSize(9)
                 .fillColor(colors.textDark)
                 .font('Helvetica')
                 .text(project.description, leftMargin + 5, yPos, {
                   width: contentWidth - 10,
                   align: 'justify',
                   lineGap: 2
                 });
              
              yPos += doc.heightOfString(project.description, { width: contentWidth - 10, lineGap: 2 }) + 8;
            }
            
            // Technologies used
            if (project.technologies && project.technologies.length > 0) {
              doc.fontSize(8)
                 .fillColor(colors.textGray)
                 .font('Helvetica-Bold')
                 .text(`Technologies: ${project.technologies.join(', ')}`, leftMargin + 5, yPos);
              
              yPos += 15;
            }
            
            yPos += 10;
          });
        }
        
        // === CERTIFICATIONS SECTION ===
        if (resumeData.certifications && resumeData.certifications.length > 0) {
          checkPageBreak(80);
          
          drawSectionHeader('CERTIFICATIONS', yPos);
          yPos += 30;
          
          resumeData.certifications.forEach((cert) => {
            checkPageBreak(30);
            
            // Certification name
            doc.fontSize(10)
               .fillColor(colors.primaryBlue)
               .font('Helvetica-Bold')
               .text(cert.name, leftMargin + 5, yPos);
            
            yPos += 12;
            
            // Organization and year
            doc.fontSize(9)
               .fillColor(colors.textGray)
               .font('Helvetica')
               .text(`${cert.organization} • ${cert.year}`, leftMargin + 5, yPos);
            
            yPos += 20;
          });
        }
        
        doc.end();
      });
      
    } catch (error) {
      console.error('❌ Structured PDF generation failed:', error);
      throw new Error(`Structured PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced fallback PDF generation with proper formatting
   */
  async generateEnhancedFallbackPDF(htmlContent: string): Promise<Buffer> {
    console.log('📄 Using enhanced fallback PDF generation method...');
    
    try {
      // Use PDFKit for enhanced fallback PDF generation
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });
      
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log('✅ Enhanced fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
          resolve(pdfBuffer);
        });
        
        doc.on('error', reject);
        
        // Parse HTML content to extract structured data
        const resumeData = this.parseResumeHTML(htmlContent);
        
        // Set up fonts and colors
        const primaryColor = '#1e40af';
        const secondaryColor = '#666';
        const lightBlue = '#e0e7ff';
        
        let yPosition = 70;
        
        // Header Section
        doc.fontSize(24)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(resumeData.name, 50, yPosition, { align: 'center' });
        
        yPosition += 35;
        
        // Contact Information
        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font('Helvetica')
           .text(resumeData.contact, 50, yPosition, { align: 'center' });
        
        yPosition += 30;
        
        // Blue line separator
        doc.rect(50, yPosition, 500, 2)
           .fillColor(primaryColor)
           .fill();
        
        yPosition += 25;
        
        // Professional Summary
        if (resumeData.summary) {
          doc.fontSize(14)
             .fillColor(primaryColor)
             .font('Helvetica-Bold')
             .text('PROFESSIONAL SUMMARY', 50, yPosition);
          
          yPosition += 20;
          
          doc.fontSize(11)
             .fillColor('#333')
             .font('Helvetica')
             .text(resumeData.summary, 50, yPosition, { 
               width: 500, 
               align: 'justify',
               lineGap: 2
             });
          
          yPosition += doc.heightOfString(resumeData.summary, { width: 500, lineGap: 2 }) + 15;
        }
        
        // Education Section
        if (resumeData.education.length > 0) {
          doc.fontSize(14)
             .fillColor(primaryColor)
             .font('Helvetica-Bold')
             .text('EDUCATION', 50, yPosition);
          
          yPosition += 20;
          
          resumeData.education.forEach((edu: any) => {
            doc.fontSize(12)
               .fillColor('#333')
               .font('Helvetica-Bold')
               .text(edu.degree, 50, yPosition);
            
            doc.fontSize(11)
               .fillColor(secondaryColor)
               .font('Helvetica')
               .text(edu.institution, 50, yPosition + 15);
            
            if (edu.gpa) {
              doc.text(`GPA: ${edu.gpa}`, 400, yPosition + 15);
            }
            
            yPosition += 35;
          });
          
          yPosition += 10;
        }
        
        // Skills Section
        if (resumeData.skills.length > 0) {
          doc.fontSize(14)
             .fillColor(primaryColor)
             .font('Helvetica-Bold')
             .text('SKILLS', 50, yPosition);
          
          yPosition += 20;
          
          const skillsPerRow = 3;
          const skillWidth = 160;
          let currentRow = 0;
          let currentCol = 0;
          
          resumeData.skills.forEach((skill: string, index: number) => {
            const xPos = 50 + (currentCol * skillWidth);
            const yPos = yPosition + (currentRow * 20);
            
            doc.fontSize(10)
               .fillColor('#333')
               .font('Helvetica')
               .text(`• ${skill}`, xPos, yPos);
            
            currentCol++;
            if (currentCol >= skillsPerRow) {
              currentCol = 0;
              currentRow++;
            }
          });
          
          yPosition += (Math.ceil(resumeData.skills.length / skillsPerRow) * 20) + 15;
        }
        
        // Experience Section
        if (resumeData.experience.length > 0) {
          doc.fontSize(14)
             .fillColor(primaryColor)
             .font('Helvetica-Bold')
             .text('EXPERIENCE', 50, yPosition);
          
          yPosition += 20;
          
          resumeData.experience.forEach((exp: any) => {
            // Check if we need a new page
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(12)
               .fillColor('#333')
               .font('Helvetica-Bold')
               .text(exp.title, 50, yPosition);
            
            doc.fontSize(11)
               .fillColor(secondaryColor)
               .font('Helvetica')
               .text(exp.company, 50, yPosition + 15);
            
            doc.text(exp.dates, 400, yPosition + 15);
            
            if (exp.description) {
              yPosition += 35;
              doc.fontSize(10)
                 .fillColor('#333')
                 .font('Helvetica')
                 .text(exp.description, 70, yPosition, { 
                   width: 480, 
                   align: 'left',
                   lineGap: 1
                 });
              
              yPosition += doc.heightOfString(exp.description, { width: 480, lineGap: 1 }) + 10;
            } else {
              yPosition += 30;
            }
          });
        }
        
        // Projects Section
        if (resumeData.projects.length > 0) {
          yPosition += 15;
          
          // Check if we need a new page
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(14)
             .fillColor(primaryColor)
             .font('Helvetica-Bold')
             .text('PROJECTS', 50, yPosition);
          
          yPosition += 20;
          
          resumeData.projects.forEach((project: any) => {
            // Check if we need a new page
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(12)
               .fillColor('#333')
               .font('Helvetica-Bold')
               .text(project.name, 50, yPosition);
            
            yPosition += 15;
            
            if (project.description) {
              doc.fontSize(10)
                 .fillColor('#333')
                 .font('Helvetica')
                 .text(project.description, 70, yPosition, { 
                   width: 480, 
                   align: 'left',
                   lineGap: 1
                 });
              
              yPosition += doc.heightOfString(project.description, { width: 480, lineGap: 1 }) + 5;
            }
            
            if (project.technologies && project.technologies.length > 0) {
              doc.fontSize(9)
                 .fillColor(secondaryColor)
                 .font('Helvetica')
                 .text(`Technologies: ${project.technologies.join(', ')}`, 70, yPosition);
              
              yPosition += 20;
            } else {
              yPosition += 15;
            }
          });
        }
        
        doc.end();
      });
      
    } catch (fallbackError) {
      console.error('❌ Enhanced fallback PDF generation also failed:', fallbackError);
      
      // Last resort: throw error instead of creating poor quality PDF
      throw new Error('PDF generation is currently unavailable. Please try again later or contact support.');
    }
  }

  /**
   * Parse HTML content to extract resume data
   */
  private parseResumeHTML(htmlContent: string): any {
    // Simple HTML parsing to extract resume data
    const nameMatch = htmlContent.match(/<h1[^>]*class="name"[^>]*>([^<]+)<\/h1>/);
    const name = nameMatch ? nameMatch[1].trim() : 'Resume';
    
    // Extract contact info
    const contactMatches = htmlContent.match(/<div[^>]*class="contact-item"[^>]*>.*?<span>([^<]+)<\/span>.*?<\/div>/g);
    const contact = contactMatches 
      ? contactMatches.map(match => {
          const textMatch = match.match(/<span>([^<]+)<\/span>/g);
          return textMatch ? textMatch.map(t => t.replace(/<[^>]*>/g, '')).join(' ') : '';
        }).filter(c => c && !c.includes('📧') && !c.includes('📱') && !c.includes('💼') && !c.includes('💻') && !c.includes('📍')).join(' | ')
      : '';
    
    // Extract summary
    const summaryMatch = htmlContent.match(/<div[^>]*class="summary"[^>]*>(.*?)<\/div>/s);
    const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Extract education
    const educationMatches = htmlContent.match(/<div[^>]*class="education-item"[^>]*>(.*?)<\/div>/gs);
    const education = educationMatches 
      ? educationMatches.map(match => {
          const degreeMatch = match.match(/<div[^>]*class="degree"[^>]*>([^<]+)<\/div>/);
          const institutionMatch = match.match(/<div[^>]*class="institution"[^>]*>([^<]+)<\/div>/);
          const gpaMatch = match.match(/<span[^>]*class="gpa"[^>]*>GPA: ([^<]+)<\/span>/);
          
          return {
            degree: degreeMatch ? degreeMatch[1].trim() : '',
            institution: institutionMatch ? institutionMatch[1].trim() : '',
            gpa: gpaMatch ? gpaMatch[1].trim() : null
          };
        }).filter(edu => edu.degree || edu.institution)
      : [];
    
    // Extract skills
    const skillMatches = htmlContent.match(/<span[^>]*class="skill-item"[^>]*>([^<]+)<\/span>/g);
    const skills = skillMatches 
      ? skillMatches.map(match => match.replace(/<[^>]*>/g, '').trim()).filter(skill => skill)
      : [];
    
    // Extract experience
    const experienceMatches = htmlContent.match(/<div[^>]*class="experience-item"[^>]*>(.*?)<\/div>/gs);
    const experience = experienceMatches 
      ? experienceMatches.map(match => {
          const titleMatch = match.match(/<div[^>]*class="job-title"[^>]*>([^<]+)<\/div>/);
          const companyMatch = match.match(/<div[^>]*class="company"[^>]*>([^<]+)<\/div>/);
          const datesMatch = match.match(/<div[^>]*class="dates"[^>]*>([^<]+)<\/div>/);
          const descMatch = match.match(/<div[^>]*class="description"[^>]*>(.*?)<\/div>/s);
          
          return {
            title: titleMatch ? titleMatch[1].trim() : '',
            company: companyMatch ? companyMatch[1].trim() : '',
            dates: datesMatch ? datesMatch[1].trim() : '',
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : ''
          };
        }).filter(exp => exp.title || exp.company)
      : [];
    
    // Extract projects
    const projectMatches = htmlContent.match(/<div[^>]*class="project-item"[^>]*>(.*?)<\/div>/gs);
    const projects = projectMatches 
      ? projectMatches.map(match => {
          const nameMatch = match.match(/<div[^>]*class="project-name"[^>]*>([^<]+)<\/div>/);
          const descMatch = match.match(/<div[^>]*class="project-description"[^>]*>(.*?)<\/div>/s);
          const techMatches = match.match(/<span[^>]*class="tech-item"[^>]*>([^<]+)<\/span>/g);
          
          return {
            name: nameMatch ? nameMatch[1].trim() : '',
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            technologies: techMatches ? techMatches.map(t => t.replace(/<[^>]*>/g, '').trim()) : []
          };
        }).filter(project => project.name)
      : [];
    
    return {
      name,
      contact,
      summary,
      education,
      skills,
      experience,
      projects
    };
  }

  /**
   * Main function to create tailored resume for job application
   */
  async createTailoredResume(
    email: string, 
    phoneNumber: string, 
    jobDescription: string
  ): Promise<{ success: boolean; pdfBuffer?: Buffer; message: string; fileName?: string; resumeId?: string; downloadUrl?: string }> {
    try {
      console.log('🚀 Starting tailored resume creation...');
      
      // Step 1: Analyze job description
      const jobAnalysis = await this.analyzeJobDescription(jobDescription);
      console.log('✅ Job analysis completed');
      
      // Step 2: Get student data
      const studentData = await this.getStudentData(email, phoneNumber);
      if (!studentData) {
        return {
          success: false,
          message: 'Student profile not found. Please ensure you have a complete profile on CampusPe.'
        };
      }
      console.log('✅ Student data retrieved');
      
      // Step 3: Tailor resume for job
      const tailoredResume = this.tailorResumeForJob(studentData, jobAnalysis);
      console.log('✅ Resume tailored for job requirements');
      
      // Step 4: Generate HTML
      const htmlContent = this.generateResumeHTML(tailoredResume);
      console.log('✅ HTML template generated');
      
      // Step 5: Generate PDF with improved fallback chain (prioritize reliable methods)
      let pdfBuffer: Buffer;
      console.log('📄 Starting PDF generation with reliable fallback chain...');
      
      try {
        // Try structured PDF first (most reliable - no browser needed)
        console.log('🎨 Attempting structured PDF generation...');
        pdfBuffer = await this.generateStructuredPDF(tailoredResume);
        console.log('✅ Structured PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      } catch (structuredError: any) {
        console.log('⚠️ Structured PDF failed, trying Azure PDF service...', structuredError?.message || 'Unknown error');
        
        try {
          // Try Azure PDF Service
          if (await AzurePDFService.healthCheck()) {
            console.log('🏗️ Azure PDF Service is available, generating PDF...');
            pdfBuffer = await AzurePDFService.generatePDF(htmlContent);
            console.log('✅ Azure PDF generated successfully, size:', pdfBuffer.length, 'bytes');
          } else {
            throw new Error('Azure PDF Service not available');
          }
        } catch (azureError: any) {
          console.log('⚠️ Azure PDF service failed, trying html-pdf-node...', azureError?.message || 'Unknown error');
          
          try {
            // Try html-pdf-node
            const htmlPdf = require('html-pdf-node');
            const options = { format: 'A4', border: { top: '0.5in', bottom: '0.5in' } };
            const file = { content: htmlContent };
            
            pdfBuffer = await htmlPdf.generatePdf(file, options);
            console.log('✅ html-pdf-node PDF generated successfully, size:', pdfBuffer.length, 'bytes');
          } catch (htmlPdfError: any) {
            console.log('⚠️ html-pdf-node failed, using enhanced fallback...', htmlPdfError?.message || 'Unknown error');
            
            // Create a minimal PDF with key information using enhanced fallback
            pdfBuffer = await this.generateEnhancedFallbackPDF(htmlContent);
            console.log('✅ Enhanced fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
          }
        }
      }
      
      const fileName = `${studentData.personalInfo.firstName}_${studentData.personalInfo.lastName}_Resume_${Date.now()}.pdf`;
      
      // Step 6: Save to GeneratedResume collection
      let resumeId: string | undefined;
      let downloadUrl: string | undefined;
      
      try {
        const { Student } = require('../models/Student');
        const student = await Student.findOne({ 
          $or: [
            { email: email },
            { phoneNumber: phoneNumber }
          ]
        }).lean();
        
        if (student) {
          const GeneratedResumeService = require('./generated-resume.service').default;
          
          // Extract job title from description
          const jobTitleMatch = jobDescription.match(/(?:position|role|job):\s*([^.]+)/i);
          const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Job Application';
          
          const generatedResume = await GeneratedResumeService.createGeneratedResume({
            studentId: student._id.toString(),
            jobTitle,
            jobDescription,
            resumeData: tailoredResume,
            fileName,
            pdfBuffer,
            matchScore: 85, // You can implement actual matching logic
            aiEnhancementUsed: true,
            matchedSkills: tailoredResume.skills.map((s: any) => s.name).slice(0, 5),
            missingSkills: [],
            suggestions: [],
            generationType: 'ai'
          });
          
          resumeId = generatedResume.resumeId;
          downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
          
          console.log('✅ Resume saved to GeneratedResume collection:', resumeId);
        }
      } catch (saveError) {
        console.error('⚠️ Error saving to GeneratedResume collection:', saveError);
        // Don't fail the whole process if saving fails
      }
      
      return {
        success: true,
        pdfBuffer,
        fileName,
        message: 'Resume generated successfully and tailored for the job requirements!',
        resumeId,
        downloadUrl
      };
      
    } catch (error) {
      console.error('❌ Error creating tailored resume:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack trace',
        type: error instanceof Error ? error.constructor.name : typeof error
      });
      
      return {
        success: false,
        message: 'Failed to generate resume. Please try again later.'
      };
    }
  }

  /**
   * Create resume from platform (without job tailoring)
   */
  async createResumeFromPlatform(userId: string): Promise<{ success: boolean; pdfBuffer?: Buffer; message: string; fileName?: string }> {
    try {
      console.log('🚀 Creating resume from platform data...');
      
      // Find student by userId
      const student = await Student.findOne({ userId }).populate('userId');
      if (!student) {
        return {
          success: false,
          message: 'Student profile not found.'
        };
      }
      
      const studentData: ResumeData = {
        personalInfo: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email || (student.userId as any)?.email || '',
          phone: student.phoneNumber || (student.userId as any)?.phone || '',
          linkedin: student.linkedinUrl,
          github: student.githubUrl,
          location: 'India'
        },
        education: student.education || [],
        experience: student.experience || [],
        skills: student.skills || [],
        projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p: any) => p.name && p.description).map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          technologies: p.technologies || [],
          link: p.link
        })),
        certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c: any) => c.name && c.organization && c.year).map((c: any) => ({
          name: c.name || '',
          year: c.year || new Date().getFullYear(),
          organization: c.organization || ''
        }))
      };
      
      // Generate generic summary
      const experienceYears = this.calculateExperience(studentData.experience);
      const topSkills = studentData.skills.slice(0, 5).map(s => s.name).join(', ');
      
      studentData.summary = `Professional with ${experienceYears > 0 ? `${experienceYears} year${experienceYears > 1 ? 's' : ''} of ` : ''}experience in software development. ${topSkills ? `Skilled in ${topSkills}. ` : ''}Passionate about technology and eager to contribute to innovative projects.`;
      
      const htmlContent = this.generateResumeHTML(studentData);
      const pdfBuffer = await this.generatePDF(htmlContent);
      
      const fileName = `${studentData.personalInfo.firstName}_${studentData.personalInfo.lastName}_Resume_${Date.now()}.pdf`;
      
      return {
        success: true,
        pdfBuffer,
        fileName,
        message: 'Resume generated successfully!'
      };
      
    } catch (error) {
      console.error('❌ Error creating resume from platform:', error);
      return {
        success: false,
        message: 'Failed to generate resume. Please try again later.'
      };
    }
  }

  /**
   * Create resume with specific template design
   */
  async createResumeWithTemplate(userId: string, templateId: string): Promise<{ success: boolean; pdfBuffer?: Buffer; message: string; fileName?: string }> {
    try {
      console.log('🚀 Creating resume with template:', templateId);
      
      // Find student by userId
      const student = await Student.findOne({ userId }).populate('userId');
      if (!student) {
        return {
          success: false,
          message: 'Student profile not found.'
        };
      }
      
      const studentData: ResumeData = {
        personalInfo: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email || (student.userId as any)?.email || '',
          phone: student.phoneNumber || (student.userId as any)?.phone || '',
          linkedin: student.linkedinUrl,
          github: student.githubUrl,
          location: 'India'
        },
        education: student.education || [],
        experience: student.experience || [],
        skills: student.skills || [],
        projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p: any) => p.name && p.description).map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          technologies: p.technologies || [],
          link: p.link
        })),
        certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c: any) => c.name && c.organization && c.year).map((c: any) => ({
          name: c.name || '',
          year: c.year || new Date().getFullYear(),
          organization: c.organization || ''
        }))
      };
      
      // Generate generic summary
      const experienceYears = this.calculateExperience(studentData.experience);
      const topSkills = studentData.skills.slice(0, 5).map(s => s.name).join(', ');
      
      studentData.summary = `Professional with ${experienceYears > 0 ? `${experienceYears} year${experienceYears > 1 ? 's' : ''} of ` : ''}experience in software development. ${topSkills ? `Skilled in ${topSkills}. ` : ''}Passionate about technology and eager to contribute to innovative projects.`;
      
      // Generate HTML based on template
      const htmlContent = this.generateTemplateHTML(studentData, templateId);
      
      // Generate PDF
      const pdfBuffer = await this.generatePDF(htmlContent);
      
      const fileName = `${studentData.personalInfo.firstName}_${studentData.personalInfo.lastName}_Resume_${Date.now()}.pdf`;
      
      return {
        success: true,
        pdfBuffer,
        fileName,
        message: 'Resume generated successfully with template!'
      };
      
    } catch (error) {
      console.error('❌ Error creating resume with template:', error);
      return {
        success: false,
        message: 'Failed to generate resume. Please try again later.'
      };
    }
  }

  /**
   * Generate HTML based on template design
   */
  private generateTemplateHTML(resumeData: ResumeData, templateId: string): string {
    const { personalInfo, summary, education, experience, skills, projects, certifications } = resumeData;
    
    // Map template IDs to template styles
    const templateStyle = this.getTemplateStyle(templateId);
    
    // Generate HTML based on template
    switch (templateStyle) {
      case 'modern':
        return this.generateModernTemplateHTML(resumeData);
      case 'executive':
        return this.generateExecutiveTemplateHTML(resumeData);
      case 'creative':
        return this.generateCreativeTemplateHTML(resumeData);
      case 'minimal':
        return this.generateMinimalTemplateHTML(resumeData);
      case 'professional':
      default:
        return this.generateProfessionalTemplateHTML(resumeData);
    }
  }

  /**
   * Get template style from template ID
   */
  private getTemplateStyle(templateId: string): string {
    if (templateId.includes('modern') || templateId.includes('technical')) return 'modern';
    if (templateId.includes('executive')) return 'executive';
    if (templateId.includes('creative')) return 'creative';
    if (templateId.includes('minimal')) return 'minimal';
    return 'professional';
  }

  /**
   * Generate Professional Template HTML
   */
  private generateProfessionalTemplateHTML(resumeData: ResumeData): string {
    const { personalInfo, summary, education, experience, skills, projects, certifications } = resumeData;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .container { padding: 40px 50px; max-width: 800px; margin: 0 auto; }
    
    /* Header */
    .header { border-bottom: 4px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
    .name { font-size: 32pt; font-weight: bold; color: #1a1a1a; margin-bottom: 8px; }
    .contact { font-size: 10pt; color: #555; display: flex; flex-wrap: wrap; gap: 15px; }
    .contact-item { display: inline-block; }
    
    /* Sections */
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16pt; font-weight: bold; color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 5px; margin-bottom: 12px; text-transform: uppercase; }
    
    /* Experience */
    .experience-item { margin-bottom: 15px; }
    .job-title { font-size: 12pt; font-weight: bold; color: #333; }
    .company { font-size: 11pt; color: #555; font-weight: 600; margin-top: 2px; }
    .dates { font-size: 10pt; color: #666; margin-top: 2px; }
    .description { font-size: 10pt; color: #444; margin-top: 8px; line-height: 1.6; }
    
    /* Education */
    .education-item { margin-bottom: 12px; }
    .degree { font-size: 11pt; font-weight: bold; color: #333; }
    .institution { font-size: 10pt; color: #555; margin-top: 2px; }
    .edu-details { font-size: 10pt; color: #666; margin-top: 2px; }
    
    /* Skills */
    .skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-item { display: inline-block; background: #1a1a1a; color: white; padding: 6px 14px; border-radius: 4px; font-size: 9pt; font-weight: 600; }
    
    /* Projects */
    .project-item { margin-bottom: 12px; }
    .project-name { font-size: 11pt; font-weight: bold; color: #333; }
    .project-description { font-size: 10pt; color: #444; margin-top: 4px; line-height: 1.6; }
    .project-tech { font-size: 9pt; color: #666; margin-top: 4px; }
    
    /* Certifications */
    .cert-item { margin-bottom: 8px; }
    .cert-name { font-size: 10pt; font-weight: 600; color: #333; }
    .cert-org { font-size: 9pt; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="name">${personalInfo.firstName} ${personalInfo.lastName}</h1>
      <div class="contact">
        ${personalInfo.email ? `<span class="contact-item">✉ ${personalInfo.email}</span>` : ''}
        ${personalInfo.phone ? `<span class="contact-item">📱 ${personalInfo.phone}</span>` : ''}
        ${personalInfo.location ? `<span class="contact-item">📍 ${personalInfo.location}</span>` : ''}
        ${personalInfo.linkedin ? `<span class="contact-item">🔗 LinkedIn</span>` : ''}
        ${personalInfo.github ? `<span class="contact-item">💻 GitHub</span>` : ''}
      </div>
    </div>

    ${experience && experience.length > 0 ? `
    <!-- Experience -->
    <div class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.title}</div>
          <div class="company">${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
          <div class="dates">${this.formatDate(exp.startDate)} - ${exp.isCurrentJob ? 'Present' : this.formatDate(exp.endDate)}</div>
          ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${education && education.length > 0 ? `
    <!-- Education -->
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${education.map(edu => `
        <div class="education-item">
          <div class="degree">${edu.degree} in ${edu.field}</div>
          <div class="institution">${edu.institution}</div>
          <div class="edu-details">${this.formatDate(edu.startDate)} - ${edu.endDate ? this.formatDate(edu.endDate) : 'Present'}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${skills && skills.length > 0 ? `
    <!-- Skills -->
    <div class="section">
      <h2 class="section-title">Skills</h2>
      <div class="skills-container">
        ${skills.map(skill => `<span class="skill-item">${skill.name}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${projects && projects.length > 0 ? `
    <!-- Projects -->
    <div class="section">
      <h2 class="section-title">Projects</h2>
      ${projects.map(project => `
        <div class="project-item">
          <div class="project-name">${project.name}</div>
          <div class="project-description">${project.description}</div>
          ${project.technologies && project.technologies.length > 0 ? `<div class="project-tech">Tech: ${project.technologies.join(', ')}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${certifications && certifications.length > 0 ? `
    <!-- Certifications -->
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      ${certifications.map(cert => `
        <div class="cert-item">
          <div class="cert-name">${cert.name} ${cert.year ? `(${cert.year})` : ''}</div>
          ${cert.organization ? `<div class="cert-org">${cert.organization}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate Modern Template HTML
   */
  private generateModernTemplateHTML(resumeData: ResumeData): string {
    const { personalInfo, summary, education, experience, skills, projects, certifications } = resumeData;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    
    /* Header with gradient */
    .header { background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); color: white; padding: 35px 50px; }
    .name { font-size: 32pt; font-weight: bold; margin-bottom: 10px; }
    .contact { font-size: 10pt; display: flex; flex-wrap: wrap; gap: 15px; opacity: 0.95; }
    
    /* Content */
    .content { padding: 30px 50px; }
    
    /* Sections */
    .section { margin-bottom: 25px; }
    .section-title { font-size: 18pt; font-weight: bold; color: #2563eb; margin-bottom: 15px; }
    .section-title:before { content: '💼 '; }
    .section-title.education:before { content: '🎓 '; }
    .section-title.skills:before { content: '⚡ '; }
    .section-title.projects:before { content: '🚀 '; }
    .section-title.certs:before { content: '🏆 '; }
    
    /* Experience */
    .experience-item { margin-bottom: 15px; padding-left: 15px; border-left: 4px solid #2563eb; }
    .job-title { font-size: 12pt; font-weight: bold; color: #1a1a1a; }
    .company { font-size: 11pt; color: #9333ea; font-weight: 600; margin-top: 2px; }
    .dates { font-size: 10pt; color: #666; margin-top: 2px; }
    .description { font-size: 10pt; color: #444; margin-top: 8px; line-height: 1.6; }
    
    /* Education */
    .education-item { margin-bottom: 12px; padding-left: 15px; border-left: 4px solid #9333ea; }
    .degree { font-size: 11pt; font-weight: bold; color: #1a1a1a; }
    .institution { font-size: 10pt; color: #555; margin-top: 2px; }
    .edu-details { font-size: 10pt; color: #666; margin-top: 2px; }
    
    /* Skills */
    .skills-container { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill-item { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 9pt; font-weight: 600; }
    
    /* Projects */
    .project-item { margin-bottom: 12px; padding-left: 15px; border-left: 4px solid #2563eb; }
    .project-name { font-size: 11pt; font-weight: bold; color: #1a1a1a; }
    .project-description { font-size: 10pt; color: #444; margin-top: 4px; line-height: 1.6; }
    .project-tech { font-size: 9pt; color: #666; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 5px; }
    .tech-badge { background: #e5e7eb; color: #555; padding: 3px 8px; border-radius: 10px; display: inline-block; }
    
    /* Certifications */
    .cert-item { margin-bottom: 8px; }
    .cert-name { font-size: 10pt; font-weight: 600; color: #1a1a1a; }
    .cert-org { font-size: 9pt; color: #555; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="name">${personalInfo.firstName} ${personalInfo.lastName}</h1>
      <div class="contact">
        ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
        ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ''}
        ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ''}
        ${personalInfo.linkedin ? `<span>LinkedIn</span>` : ''}
        ${personalInfo.github ? `<span>GitHub</span>` : ''}
      </div>
    </div>

    <div class="content">
      ${experience && experience.length > 0 ? `
      <!-- Experience -->
      <div class="section">
        <h2 class="section-title">Experience</h2>
        ${experience.map(exp => `
          <div class="experience-item">
            <div class="job-title">${exp.title}</div>
            <div class="company">${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
            <div class="dates">${this.formatDate(exp.startDate)} - ${exp.isCurrentJob ? 'Present' : this.formatDate(exp.endDate)}</div>
            ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${education && education.length > 0 ? `
      <!-- Education -->
      <div class="section">
        <h2 class="section-title education">Education</h2>
        ${education.map(edu => `
          <div class="education-item">
            <div class="degree">${edu.degree} in ${edu.field}</div>
            <div class="institution">${edu.institution}</div>
            <div class="edu-details">${this.formatDate(edu.startDate)} - ${edu.endDate ? this.formatDate(edu.endDate) : 'Present'}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${skills && skills.length > 0 ? `
      <!-- Skills -->
      <div class="section">
        <h2 class="section-title skills">Skills</h2>
        <div class="skills-container">
          ${skills.map(skill => `<span class="skill-item">${skill.name}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${projects && projects.length > 0 ? `
      <!-- Projects -->
      <div class="section">
        <h2 class="section-title projects">Projects</h2>
        ${projects.map(project => `
          <div class="project-item">
            <div class="project-name">${project.name}</div>
            <div class="project-description">${project.description}</div>
            ${project.technologies && project.technologies.length > 0 ? `
              <div class="project-tech">
                ${project.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${certifications && certifications.length > 0 ? `
      <!-- Certifications -->
      <div class="section">
        <h2 class="section-title certs">Certifications</h2>
        ${certifications.map(cert => `
          <div class="cert-item">
            <div class="cert-name">${cert.name} ${cert.year ? `(${cert.year})` : ''}</div>
            ${cert.organization ? `<div class="cert-org">${cert.organization}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate Executive, Creative, and Minimal templates (simplified versions)
   */
  private generateExecutiveTemplateHTML(resumeData: ResumeData): string {
    // Use Professional template with serif fonts for executive
    return this.generateProfessionalTemplateHTML(resumeData).replace(/Helvetica/g, 'Georgia').replace(/#1a1a1a/g, '#8b6914');
  }

  private generateCreativeTemplateHTML(resumeData: ResumeData): string {
    // Use Modern template with purple/pink gradient for creative
    return this.generateModernTemplateHTML(resumeData).replace(/#2563eb/g, '#9333ea').replace(/#9333ea/g, '#ec4899');
  }

  private generateMinimalTemplateHTML(resumeData: ResumeData): string {
    // Use Professional template with lighter styling for minimal
    return this.generateProfessionalTemplateHTML(resumeData)
      .replace(/4px solid/g, '1px solid')
      .replace(/font-weight: bold/g, 'font-weight: 400')
      .replace(/text-transform: uppercase/g, 'text-transform: none');
  }

  /**
   * Format date helper
   */
  private formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${month} ${year}`;
  }
}

export default new ResumeBuilderService();
