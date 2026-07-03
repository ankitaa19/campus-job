import puppeteer, { Browser } from 'puppeteer';
import * as PDFDocument from 'pdfkit';

/**
 * Improved PDF Generation Service for Azure Compatibility
 * Addresses the quality difference between localhost and Azure deployments
 */
class ImprovedPDFService {
  private browser: Browser | null = null;

  /**
   * Initialize browser with Azure-compatible configuration
   */
  async initBrowser() {
    if (!this.browser) {
      const isAzure = process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production';
      
      let puppeteerConfig: any = {
        headless: true,
        timeout: 60000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      };

      if (isAzure) {
        try {
          // Try chrome-aws-lambda for Azure
          const chromium = require('chrome-aws-lambda');
          puppeteerConfig = {
            ...puppeteerConfig,
            args: [...chromium.args, ...puppeteerConfig.args],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
          };
          console.log('✅ Using chrome-aws-lambda for Azure');
        } catch (error) {
          console.warn('⚠️ chrome-aws-lambda not available, using system Chrome');
          // Fallback to system Chrome paths
          const chromePaths = [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
          ];
          
          for (const path of chromePaths) {
            try {
              const fs = require('fs');
              if (fs.existsSync(path)) {
                puppeteerConfig.executablePath = path;
                break;
              }
            } catch (e) {
              // Continue to next path
            }
          }
        }
      }

      this.browser = await puppeteer.launch(puppeteerConfig);
      console.log('✅ Browser initialized for', isAzure ? 'Azure' : 'localhost');
    }
    return this.browser;
  }

  /**
   * Enhanced PDF generation with multiple fallback strategies
   */
  async generatePDF(htmlContent: string): Promise<Buffer> {
    console.log('📄 Starting enhanced PDF generation...');
    
    // Strategy 1: Try Puppeteer (works well on localhost)
    try {
      return await this.generatePuppeteerPDF(htmlContent);
    } catch (puppeteerError) {
      console.warn('⚠️ Puppeteer failed, trying fallbacks...');
      
      // Strategy 2: Enhanced PDFKit fallback (for Azure)
      try {
        return await this.generateEnhancedPDFKitPDF(htmlContent);
      } catch (pdfkitError) {
        console.error('❌ All PDF generation methods failed');
        throw new Error('PDF generation is currently unavailable. Please try again later.');
      }
    }
  }

  /**
   * Puppeteer PDF generation (primary method)
   */
  private async generatePuppeteerPDF(htmlContent: string): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setViewport({ width: 1200, height: 1600 });
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for styling to load
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', () => resolve());
          }
        });
      });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        timeout: 30000,
        preferCSSPageSize: false,
        displayHeaderFooter: false
      });
      
      console.log('✅ Puppeteer PDF generated successfully');
      return Buffer.from(pdf);
      
    } finally {
      await page.close();
    }
  }

  /**
   * Enhanced PDFKit fallback that mimics the HTML styling
   */
  private async generateEnhancedPDFKitPDF(htmlContent: string): Promise<Buffer> {
    console.log('📄 Using enhanced PDFKit fallback...');
    
    const resumeData = this.parseHTMLContent(htmlContent);
    
    const doc = new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('✅ Enhanced PDFKit PDF generated successfully');
        resolve(pdfBuffer);
      });
      
      doc.on('error', reject);
      
      // Generate PDF content with proper styling
      this.generatePDFContent(doc, resumeData);
      doc.end();
    });
  }

  /**
   * Parse HTML to extract structured resume data
   */
  private parseHTMLContent(htmlContent: string): any {
    // Extract name
    const nameMatch = htmlContent.match(/<h1[^>]*class="name"[^>]*>([^<]+)<\/h1>/i) ||
                     htmlContent.match(/<div[^>]*class="name"[^>]*>([^<]+)<\/div>/i) ||
                     htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Professional Resume';
    
    // Extract contact information
    const emailMatch = htmlContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = htmlContent.match(/(\+?[\d\s\-\(\)]{10,})/);
    const locationMatch = htmlContent.match(/📍\s*([^<\n]+)/);
    
    const contactParts = [];
    if (emailMatch) contactParts.push(`📧 ${emailMatch[1].trim()}`);
    if (phoneMatch) contactParts.push(`📱 ${phoneMatch[1].trim()}`);
    if (locationMatch) contactParts.push(`📍 ${locationMatch[1].trim()}`);
    
    // Extract summary
    const summaryMatch = htmlContent.match(/<div[^>]*class="summary"[^>]*>(.*?)<\/div>/s);
    const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Extract skills (improved pattern matching)
    const skills: string[] = [];
    const skillPatterns = [
      /<span[^>]*class="skill[^"]*"[^>]*>([^<]+)<\/span>/g,
      /(?:•|<li>)\s*([A-Za-z][^<\n•]{2,30})(?:<\/li>|$)/g
    ];
    
    skillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null) {
        const skill = match[1].replace(/<[^>]*>/g, '').trim();
        if (skill && skill.length > 2 && skill.length < 50 && !skills.includes(skill)) {
          skills.push(skill);
        }
      }
    });
    
    // Extract experience, education, and projects with similar improved parsing
    const experience = this.extractExperience(htmlContent);
    const education = this.extractEducation(htmlContent);
    const projects = this.extractProjects(htmlContent);
    
    return {
      name,
      contact: contactParts.join('  •  '),
      summary,
      skills,
      experience,
      education,
      projects
    };
  }

  /**
   * Generate PDF content with professional styling
   */
  private generatePDFContent(doc: any, resumeData: any): void {
    const pageWidth = 595.28;
    const leftMargin = 40;
    const rightMargin = 40;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    let yPos = 70;
    
    const primaryColor = '#1e40af';
    const secondaryColor = '#666';
    const textColor = '#333';
    
    // Helper function for page breaks
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > 750) {
        doc.addPage();
        yPos = 40;
      }
    };
    
    // Header - Name
    doc.fontSize(28)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(resumeData.name.toUpperCase(), leftMargin, yPos, {
         width: contentWidth,
         align: 'center',
         characterSpacing: 1
       });
    
    yPos += 40;
    
    // Contact Information
    if (resumeData.contact) {
      doc.fontSize(11)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text(resumeData.contact, leftMargin, yPos, {
           width: contentWidth,
           align: 'center'
         });
      yPos += 25;
    }
    
    // Blue line separator
    doc.moveTo(leftMargin, yPos)
       .lineTo(pageWidth - rightMargin, yPos)
       .strokeColor(primaryColor)
       .lineWidth(2)
       .stroke();
    yPos += 25;
    
    // Professional Summary
    if (resumeData.summary) {
      checkPageBreak(80);
      this.addSection(doc, 'PROFESSIONAL SUMMARY', resumeData.summary, yPos, leftMargin, contentWidth, primaryColor, textColor);
      yPos += this.calculateTextHeight(doc, resumeData.summary, contentWidth) + 40;
    }
    
    // Skills Section
    if (resumeData.skills.length > 0) {
      checkPageBreak(100);
      this.addSkillsSection(doc, resumeData.skills, yPos, leftMargin, contentWidth, primaryColor);
      yPos += Math.ceil(resumeData.skills.length / 3) * 18 + 40;
    }
    
    // Experience Section
    if (resumeData.experience.length > 0) {
      checkPageBreak(100);
      yPos = this.addExperienceSection(doc, resumeData.experience, yPos, leftMargin, contentWidth, primaryColor, textColor, checkPageBreak);
    }
    
    // Education Section
    if (resumeData.education.length > 0) {
      checkPageBreak(80);
      yPos = this.addEducationSection(doc, resumeData.education, yPos, leftMargin, contentWidth, primaryColor, secondaryColor);
    }
    
    // Projects Section
    if (resumeData.projects.length > 0) {
      checkPageBreak(80);
      yPos = this.addProjectsSection(doc, resumeData.projects, yPos, leftMargin, contentWidth, primaryColor, textColor, checkPageBreak);
    }
  }

  // Helper methods for different sections
  private addSection(doc: any, title: string, content: string, yPos: number, leftMargin: number, contentWidth: number, primaryColor: string, textColor: string): void {
    doc.fontSize(16)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(title, leftMargin, yPos);
    
    yPos += 20;
    
    doc.moveTo(leftMargin, yPos - 5)
       .lineTo(leftMargin + 200, yPos - 5)
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();
    
    yPos += 5;
    
    doc.fontSize(12)
       .fillColor(textColor)
       .font('Helvetica')
       .text(content, leftMargin, yPos, {
         width: contentWidth,
         align: 'justify',
         lineGap: 3
       });
  }

  private addSkillsSection(doc: any, skills: string[], yPos: number, leftMargin: number, contentWidth: number, primaryColor: string): void {
    doc.fontSize(16)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('SKILLS & TECHNOLOGIES', leftMargin, yPos);
    
    yPos += 25;
    
    const skillsPerRow = 3;
    const skillWidth = contentWidth / skillsPerRow;
    let currentRow = 0;
    let currentCol = 0;
    
    skills.forEach((skill: string) => {
      const xPos = leftMargin + (currentCol * skillWidth);
      const yPosSkill = yPos + (currentRow * 18);
      
      doc.fontSize(11)
         .fillColor('#333')
         .font('Helvetica')
         .text(`• ${skill}`, xPos, yPosSkill, {
           width: skillWidth - 10
         });
      
      currentCol++;
      if (currentCol >= skillsPerRow) {
        currentCol = 0;
        currentRow++;
      }
    });
  }

  private addExperienceSection(doc: any, experience: any[], yPos: number, leftMargin: number, contentWidth: number, primaryColor: string, textColor: string, checkPageBreak: Function): number {
    doc.fontSize(16)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('PROFESSIONAL EXPERIENCE', leftMargin, yPos);
    
    yPos += 25;
    
    experience.forEach((exp: any) => {
      checkPageBreak(80);
      
      // Job title
      doc.fontSize(13)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(exp.title, leftMargin, yPos);
      
      yPos += 15;
      
      // Company
      doc.fontSize(12)
         .fillColor('#666')
         .font('Helvetica-Oblique')
         .text(exp.company, leftMargin, yPos);
      
      yPos += 15;
      
      // Description
      if (exp.description) {
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica')
           .text(exp.description, leftMargin + 15, yPos, {
             width: contentWidth - 15,
             align: 'justify',
             lineGap: 2
           });
        
        yPos += this.calculateTextHeight(doc, exp.description, contentWidth - 15) + 10;
      }
      
      yPos += 15;
    });
    
    return yPos;
  }

  private addEducationSection(doc: any, education: any[], yPos: number, leftMargin: number, contentWidth: number, primaryColor: string, secondaryColor: string): number {
    doc.fontSize(16)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('EDUCATION', leftMargin, yPos);
    
    yPos += 25;
    
    education.forEach((edu: any) => {
      doc.fontSize(13)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(edu.degree, leftMargin, yPos);
      
      yPos += 15;
      
      doc.fontSize(12)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text(edu.institution, leftMargin, yPos);
      
      yPos += 25;
    });
    
    return yPos;
  }

  private addProjectsSection(doc: any, projects: any[], yPos: number, leftMargin: number, contentWidth: number, primaryColor: string, textColor: string, checkPageBreak: Function): number {
    doc.fontSize(16)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('PROJECTS', leftMargin, yPos);
    
    yPos += 25;
    
    projects.forEach((project: any) => {
      checkPageBreak(70);
      
      doc.fontSize(13)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(project.name, leftMargin, yPos);
      
      yPos += 15;
      
      if (project.description) {
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica')
           .text(project.description, leftMargin + 15, yPos, {
             width: contentWidth - 15,
             align: 'justify',
             lineGap: 2
           });
        
        yPos += this.calculateTextHeight(doc, project.description, contentWidth - 15) + 10;
      }
      
      if (project.technologies && project.technologies.length > 0) {
        doc.fontSize(10)
           .fillColor('#92400e')
           .font('Helvetica-Bold')
           .text(`Technologies: ${project.technologies.join(', ')}`, leftMargin + 15, yPos);
        
        yPos += 15;
      }
      
      yPos += 15;
    });
    
    return yPos;
  }

  private calculateTextHeight(doc: any, text: string, width: number): number {
    return doc.heightOfString(text, { width, lineGap: 2 });
  }

  // Extract methods for different sections
  private extractExperience(htmlContent: string): any[] {
    const experience: any[] = [];
    const expMatches = htmlContent.match(/<div[^>]*class="experience-item"[^>]*>(.*?)<\/div>/gs);
    
    if (expMatches) {
      expMatches.forEach(match => {
        const titleMatch = match.match(/<[^>]*class="job-title"[^>]*>([^<]+)/);
        const companyMatch = match.match(/<[^>]*class="company"[^>]*>([^<]+)/);
        const descMatch = match.match(/<[^>]*class="description"[^>]*>(.*?)<\/[^>]*>/s);
        
        if (titleMatch || companyMatch) {
          experience.push({
            title: titleMatch ? titleMatch[1].trim() : 'Position',
            company: companyMatch ? companyMatch[1].trim() : 'Company',
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : ''
          });
        }
      });
    }
    
    return experience;
  }

  private extractEducation(htmlContent: string): any[] {
    const education: any[] = [];
    const eduMatches = htmlContent.match(/<div[^>]*class="education-item"[^>]*>(.*?)<\/div>/gs);
    
    if (eduMatches) {
      eduMatches.forEach(match => {
        const degreeMatch = match.match(/<[^>]*class="degree"[^>]*>([^<]+)/);
        const institutionMatch = match.match(/<[^>]*class="institution"[^>]*>([^<]+)/);
        
        if (degreeMatch || institutionMatch) {
          education.push({
            degree: degreeMatch ? degreeMatch[1].trim() : 'Degree',
            institution: institutionMatch ? institutionMatch[1].trim() : 'Institution'
          });
        }
      });
    }
    
    return education;
  }

  private extractProjects(htmlContent: string): any[] {
    const projects: any[] = [];
    const projMatches = htmlContent.match(/<div[^>]*class="project-item"[^>]*>(.*?)<\/div>/gs);
    
    if (projMatches) {
      projMatches.forEach(match => {
        const nameMatch = match.match(/<[^>]*class="project-name"[^>]*>([^<]+)/);
        const descMatch = match.match(/<[^>]*class="project-description"[^>]*>(.*?)<\/[^>]*>/s);
        const techMatches = match.match(/<span[^>]*class="tech[^"]*"[^>]*>([^<]+)<\/span>/g);
        
        if (nameMatch) {
          projects.push({
            name: nameMatch[1].trim(),
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            technologies: techMatches ? techMatches.map(t => t.replace(/<[^>]*>/g, '').trim()) : []
          });
        }
      });
    }
    
    return projects;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default new ImprovedPDFService();
