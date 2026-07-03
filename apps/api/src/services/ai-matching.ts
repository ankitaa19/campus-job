import axios from 'axios';
import { Job, Student } from '../models';
import { Types } from 'mongoose';

interface AIJobAnalysis {
    type: "job";
    category: "Tech" | "Non-Tech" | "Core";
    work_mode: "Onsite" | "Remote" | "Hybrid";
    skills: string[];
    tools: string[];
    job_function: string;
    role_summary: string;
}

interface AIResumeAnalysis {
    type: "resume";
    skills: string[];
    tools: string[];
    work_mode_preference: "Onsite" | "Remote" | "Hybrid" | "Any";
    category_preference: "Tech" | "Non-Tech" | "Core";
    experience_years: string;
    education: string;
    career_summary: string;
}

interface JobEmbedding {
    jobId: Types.ObjectId;
    embedding: number[];
    metadata: AIJobAnalysis;
    createdAt: Date;
}

interface StudentEmbedding {
    studentId: Types.ObjectId;
    embedding: number[];
    metadata: AIResumeAnalysis;
    createdAt: Date;
}

interface MatchResult {
    studentId: Types.ObjectId;
    jobId: Types.ObjectId;
    finalMatchScore: number;
    skillMatch: number;
    toolMatch: number;
    categoryMatch: number;
    workModeMatch: number;
    semanticSimilarity: number;
    matchedSkills: string[];
    matchedTools: string[];
}

class AIMatchingService {
    private claudeApiKey: string;
    private jobEmbeddings: Map<string, JobEmbedding> = new Map();
    private studentEmbeddings: Map<string, StudentEmbedding> = new Map();

    constructor() {
        this.claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
        console.log('AI Matching Service initialized with Claude API key:', this.claudeApiKey ? 'Present' : 'Missing');
    }

    /**
     * Step 1: Analyze Job Description using AI
     */
    async analyzeJobDescription(jobDescription: string): Promise<AIJobAnalysis> {
        const prompt = `
You are a professional AI Career Assistant designed to extract structured data from Job Descriptions.

TASK: Analyze the following Job Description and extract structured information in JSON format.

JOB DESCRIPTION:
"""
${jobDescription}
"""

RETURN JSON STRUCTURE:
{
    "type": "job",
    "category": "Tech | Non-Tech | Core",
    "work_mode": "Onsite | Remote | Hybrid",
    "skills": ["skill1", "skill2", "skill3"],
    "tools": ["tool1", "tool2"],
    "job_function": "Job Function like Software Development, Marketing, Sales, Data Analysis",
    "role_summary": "One short professional summary of the role"
}

RULES:
- Always return valid JSON with no extra text
- All skills and tools must be lowercase
- Focus on job-relevant technical and domain skills
- Use concise professional phrasing
- Only output the JSON object
        `.trim();

        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [
                    { 
                        role: 'user', 
                        content: `You are an expert job analysis AI. Return only valid JSON.\n\n${prompt}` 
                    }
                ],
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${this.claudeApiKey}`,
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            try {
                const analysis = JSON.parse(response.data.content[0].text);
                return analysis as AIJobAnalysis;
            } catch (parseError) {
                console.error('Error parsing job analysis JSON:', parseError);
                // Try to clean and parse again
                let cleanResponse = response.data.content[0].text.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                const analysis = JSON.parse(cleanResponse);
                return analysis as AIJobAnalysis;
            }
        } catch (error) {
            console.error('Error analyzing job description:', error);
            // Fallback to basic analysis
            return this.fallbackJobAnalysis(jobDescription);
        }
    }

    /**
     * Step 2: Analyze Student Resume using AI
     */
    async analyzeStudentResume(resumeText: string): Promise<AIResumeAnalysis> {
        const prompt = `
You are a professional AI Career Assistant designed to extract structured data from Student Resumes.

TASK: Analyze the following Student Resume and extract structured information in JSON format.

RESUME TEXT:
"""
${resumeText}
"""

RETURN JSON STRUCTURE:
{
    "type": "resume",
    "skills": ["skill1", "skill2", "skill3"],
    "tools": ["tool1", "tool2"],
    "work_mode_preference": "Onsite | Remote | Hybrid | Any",
    "category_preference": "Tech | Non-Tech | Core",
    "experience_years": "X years",
    "education": "Highest Degree or Qualification",
    "career_summary": "Brief 1-2 sentence professional summary"
}

RULES:
- Always return valid JSON with no extra text
- All skills and tools must be lowercase
- Focus on technical, domain, or industry skills
- Use concise professional phrasing
- Only output the JSON object
        `.trim();

        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [
                    { 
                        role: 'user', 
                        content: `You are an expert resume analysis AI. Return only valid JSON.\n\n${prompt}` 
                    }
                ],
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${this.claudeApiKey}`,
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            try {
                const analysis = JSON.parse(response.data.content[0].text);
                return analysis as AIResumeAnalysis;
            } catch (parseError) {
                console.error('Error parsing resume analysis JSON:', parseError);
                // Try to clean and parse again
                let cleanResponse = response.data.content[0].text.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                const analysis = JSON.parse(cleanResponse);
                return analysis as AIResumeAnalysis;
            }
        } catch (error) {
            console.error('Error analyzing resume:', error);
            // Fallback to basic analysis
            return this.fallbackResumeAnalysis(resumeText);
        }
    }

    /**
     * Step 3: Create Embeddings for Jobs and Students
     */
    async createJobEmbedding(jobId: Types.ObjectId, jobData: any): Promise<JobEmbedding> {
        const jobText = `${jobData.title} ${jobData.description} ${jobData.requirements?.map((r: any) => r.skill).join(' ')}`;
        
        try {
            const embedding = await this.generateEmbedding(jobText);
            const aiAnalysis = await this.analyzeJobDescription(jobData.description);
            
            const jobEmbedding: JobEmbedding = {
                jobId,
                embedding,
                metadata: aiAnalysis,
                createdAt: new Date()
            };

            this.jobEmbeddings.set(jobId.toString(), jobEmbedding);
            return jobEmbedding;
        } catch (error) {
            console.error('Error creating job embedding:', error);
            throw error;
        }
    }

    async createStudentEmbedding(studentId: Types.ObjectId, studentData: any): Promise<StudentEmbedding> {
        // Combine resume text, skills, and experience
        const resumeText = this.buildResumeText(studentData);
        
        try {
            const embedding = await this.generateEmbedding(resumeText);
            const aiAnalysis = await this.analyzeStudentResume(resumeText);
            
            const studentEmbedding: StudentEmbedding = {
                studentId,
                embedding,
                metadata: aiAnalysis,
                createdAt: new Date()
            };

            this.studentEmbeddings.set(studentId.toString(), studentEmbedding);
            return studentEmbedding;
        } catch (error) {
            console.error('Error creating student embedding:', error);
            throw error;
        }
    }

    /**
     * Step 4: Advanced Matching Logic
     */
    async calculateAdvancedMatch(studentId: Types.ObjectId, jobId: Types.ObjectId): Promise<MatchResult> {
        const student = await Student.findById(studentId).lean();
        const job = await Job.findById(jobId).lean();

        if (!student || !job) {
            throw new Error('Student or Job not found');
        }

        // Get or create embeddings
        let studentEmbedding = this.studentEmbeddings.get(studentId.toString());
        if (!studentEmbedding) {
            studentEmbedding = await this.createStudentEmbedding(studentId, student);
        }

        let jobEmbedding = this.jobEmbeddings.get(jobId.toString());
        if (!jobEmbedding) {
            jobEmbedding = await this.createJobEmbedding(jobId, job);
        }

        // A. Skill & Tool Match
        const studentSkills = studentEmbedding.metadata.skills;
        const studentTools = studentEmbedding.metadata.tools;
        const jobSkills = jobEmbedding.metadata.skills;
        const jobTools = jobEmbedding.metadata.tools;

        const matchedSkills = studentSkills.filter(skill => 
            jobSkills.some(jobSkill => 
                skill.includes(jobSkill) || jobSkill.includes(skill)
            )
        );
        
        const matchedTools = studentTools.filter(tool => 
            jobTools.some(jobTool => 
                tool.includes(jobTool) || jobTool.includes(tool)
            )
        );

        const skillMatch = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;
        const toolMatch = jobTools.length > 0 ? matchedTools.length / jobTools.length : 0;

        // B. Category Match
        const categoryMatch = studentEmbedding.metadata.category_preference === jobEmbedding.metadata.category ? 1 : 0;

        // C. Work Mode Match
        const workModeMatch = this.calculateWorkModeMatch(
            studentEmbedding.metadata.work_mode_preference,
            jobEmbedding.metadata.work_mode
        );

        // D. Semantic Similarity (Cosine similarity)
        const semanticSimilarity = this.cosineSimilarity(
            studentEmbedding.embedding,
            jobEmbedding.embedding
        );

        // E. Final Match Score Calculation
        const finalMatchScore = 
            (skillMatch * 0.5) +
            (toolMatch * 0.1) +
            (categoryMatch * 0.1) +
            (workModeMatch * 0.1) +
            (semanticSimilarity * 0.2);

        return {
            studentId,
            jobId,
            finalMatchScore,
            skillMatch,
            toolMatch,
            categoryMatch,
            workModeMatch,
            semanticSimilarity,
            matchedSkills,
            matchedTools
        };
    }

    /**
     * Step 5: Find High-Match Students for a Job - Enhanced to check ALL students
     */
    async findMatchingStudents(jobId: Types.ObjectId, threshold: number = 0.70): Promise<MatchResult[]> {
        console.log(`🔍 Finding matching students for job ${jobId} with threshold ${threshold * 100}%`);
        
        // Get ALL active students (not just placement ready)
        const eligibleStudents = await Student.find({
            isActive: true
            // Removed isPlacementReady filter to check all students
        }).select('_id firstName lastName').lean();

        console.log(`📊 Found ${eligibleStudents.length} total active students to analyze`);

        const matches: MatchResult[] = [];
        let processedCount = 0;
        let errorCount = 0;

        for (const student of eligibleStudents) {
            try {
                processedCount++;
                const matchResult = await this.calculateAdvancedMatch(student._id, jobId);
                
                console.log(`Student ${student.firstName} ${student.lastName}: ${Math.round(matchResult.finalMatchScore * 100)}% match`);
                
                if (matchResult.finalMatchScore >= threshold) {
                    matches.push(matchResult);
                    console.log(`✅ Match found: ${student.firstName} ${student.lastName} - ${Math.round(matchResult.finalMatchScore * 100)}%`);
                } else {
                    console.log(`❌ Below threshold: ${student.firstName} ${student.lastName} - ${Math.round(matchResult.finalMatchScore * 100)}%`);
                }
                
                // Progress logging every 10 students
                if (processedCount % 10 === 0) {
                    console.log(`📈 Progress: ${processedCount}/${eligibleStudents.length} students processed, ${matches.length} matches found`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error calculating match for student ${student._id} (${student.firstName} ${student.lastName}):`, error);
            }
        }

        console.log(`🎯 Matching complete: ${processedCount} students analyzed, ${matches.length} matches found, ${errorCount} errors`);

        // Sort by match score (highest first)
        matches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
        
        return matches;
    }

    /**
     * Utility Functions
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        // Note: Claude doesn't provide embeddings. Using alternative approach.
        // For production, consider using OpenAI embeddings separately or other embedding services
        console.log('📊 Using fallback embedding generation (Claude does not provide embeddings)');
        
        // Generate a simple hash-based embedding as fallback
        // This is a simplified approach - for production consider using a dedicated embedding service
        return this.generateSimpleEmbedding(text);
    }

    private generateSimpleEmbedding(text: string): number[] {
        // Simple embedding based on text characteristics
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(384).fill(0); // Smaller embedding size
        
        // Basic feature extraction
        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            const embeddingIndex = Math.abs(hash) % embedding.length;
            embedding[embeddingIndex] += 1;
        });
        
        // Normalize the embedding
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private calculateWorkModeMatch(studentPreference: string, jobMode: string): number {
        if (studentPreference === 'Any') return 1;
        if (studentPreference === jobMode) return 1;
        if (studentPreference === 'Hybrid' && (jobMode === 'Remote' || jobMode === 'Onsite')) return 0.7;
        return 0;
    }

    private buildResumeText(studentData: any): string {
        let resumeText = '';
        
        if (studentData.firstName && studentData.lastName) {
            resumeText += `${studentData.firstName} ${studentData.lastName}\n\n`;
        }
        
        if (studentData.skills && Array.isArray(studentData.skills)) {
            resumeText += 'Skills: ' + studentData.skills.map((skill: any) => skill.name || skill).join(', ') + '\n\n';
        }
        
        if (studentData.experience && Array.isArray(studentData.experience)) {
            resumeText += 'Experience:\n';
            studentData.experience.forEach((exp: any) => {
                resumeText += `${exp.title} at ${exp.company}. ${exp.description || ''}\n`;
            });
            resumeText += '\n';
        }
        
        if (studentData.education && Array.isArray(studentData.education)) {
            resumeText += 'Education:\n';
            studentData.education.forEach((edu: any) => {
                resumeText += `${edu.degree} in ${edu.field} from ${edu.institution}\n`;
            });
        }
        
        return resumeText || 'No resume information available';
    }

    private fallbackJobAnalysis(jobDescription: string): AIJobAnalysis {
        const skills = this.extractSkillsFromText(jobDescription);
        const isRemote = /remote|work from home|wfh/i.test(jobDescription);
        const isHybrid = /hybrid|flexible/i.test(jobDescription);
        const workMode = isRemote ? 'Remote' : isHybrid ? 'Hybrid' : 'Onsite';
        
        const isTech = /software|developer|programmer|engineer|tech|coding|programming/i.test(jobDescription);
        const category = isTech ? 'Tech' : 'Non-Tech';

        return {
            type: 'job',
            category,
            work_mode: workMode,
            skills: skills.slice(0, 10),
            tools: this.extractToolsFromText(jobDescription).slice(0, 5),
            job_function: 'General',
            role_summary: jobDescription.slice(0, 100) + '...'
        };
    }

    private fallbackResumeAnalysis(resumeText: string): AIResumeAnalysis {
        const skills = this.extractSkillsFromText(resumeText);
        const tools = this.extractToolsFromText(resumeText);
        
        const isTech = /software|developer|engineer|programming|coding|tech/i.test(resumeText);
        const category = isTech ? 'Tech' : 'Non-Tech';
        
        return {
            type: 'resume',
            skills: skills.slice(0, 10),
            tools: tools.slice(0, 5),
            work_mode_preference: 'Any',
            category_preference: category,
            experience_years: '0-2 years',
            education: 'Bachelor\'s Degree',
            career_summary: resumeText.slice(0, 100) + '...'
        };
    }

    private extractSkillsFromText(text: string): string[] {
        const commonSkills = [
            'javascript', 'python', 'java', 'react', 'nodejs', 'angular', 'vue',
            'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'docker',
            'kubernetes', 'git', 'typescript', 'express', 'flask', 'django',
            'spring', 'laravel', 'php', 'ruby', 'golang', 'c++', 'c#',
            'marketing', 'sales', 'accounting', 'finance', 'hr', 'design',
            'photoshop', 'illustrator', 'figma', 'sketch', 'communication'
        ];
        
        const lowerText = text.toLowerCase();
        return commonSkills.filter(skill => lowerText.includes(skill));
    }

    private extractToolsFromText(text: string): string[] {
        const commonTools = [
            'jira', 'slack', 'trello', 'github', 'gitlab', 'jenkins', 'tableau',
            'powerbi', 'excel', 'word', 'powerpoint', 'salesforce', 'hubspot',
            'google analytics', 'adobe', 'canva', 'notion', 'confluence'
        ];
        
        const lowerText = text.toLowerCase();
        return commonTools.filter(tool => lowerText.includes(tool));
    }
}

export default new AIMatchingService();
