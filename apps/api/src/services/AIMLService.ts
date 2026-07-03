import { Types } from 'mongoose';

// AI/ML Service Integration for Enterprise CampusPe
// Note: Install 'openai' package for full functionality: npm install openai
export class AIMLService {
  private vectorDimension: number = 384; // Standard embedding dimension
  
  constructor() {
    // Initialize AI service
    console.log('AIMLService initialized - Install OpenAI package for full functionality');
  }

  /**
   * Generate job embeddings for semantic matching
   * Note: Install OpenAI package for production use
   */
  async generateJobEmbedding(jobData: {
    title: string;
    description: string;
    requiredSkills: string[];
    department: string;
    experienceLevel: string;
  }): Promise<number[]> {
    try {
      // TODO: Replace with actual OpenAI embeddings when package is installed
      // const response = await this.openai.embeddings.create({
      //   model: "text-embedding-3-small",
      //   input: this.createJobText(jobData),
      //   dimensions: this.vectorDimension
      // });
      // return response.data[0].embedding;
      
      return this.generatePlaceholderVector();
    } catch (error) {
      console.error('Error generating job embedding:', error);
      return this.generatePlaceholderVector();
    }
  }

  /**
   * Generate candidate profile embeddings
   * Note: Install OpenAI package for production use
   */
  async generateCandidateEmbedding(candidateData: {
    skills: string[];
    experience: string;
    education: string;
    projects?: string[];
    certifications?: string[];
  }): Promise<number[]> {
    try {
      // TODO: Replace with actual OpenAI embeddings when package is installed
      // const response = await this.openai.embeddings.create({
      //   model: "text-embedding-3-small",
      //   input: this.createCandidateText(candidateData),
      //   dimensions: this.vectorDimension
      // });
      // return response.data[0].embedding;
      
      return this.generatePlaceholderVector();
    } catch (error) {
      console.error('Error generating candidate embedding:', error);
      return this.generatePlaceholderVector();
    }
  }

  /**
   * Calculate semantic similarity between job and candidate
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Advanced job-candidate matching with multiple factors
   */
  async calculateAdvancedMatchScore(
    jobData: any,
    candidateData: any
  ): Promise<{
    overallScore: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
    semanticMatch: number;
    breakdown: Record<string, number>;
  }> {
    // Skills matching (30% weight)
    const skillsMatch = this.calculateSkillsMatch(
      jobData.requiredSkills || [],
      candidateData.skills || []
    );

    // Experience matching (25% weight)
    const experienceMatch = this.calculateExperienceMatch(
      jobData.minExperience || 0,
      jobData.maxExperience || 100,
      candidateData.experience || 0
    );

    // Education matching (20% weight)
    const educationMatch = this.calculateEducationMatch(
      jobData.educationRequirements || [],
      candidateData.education || {}
    );

    // Location matching (15% weight)
    const locationMatch = this.calculateLocationMatch(
      jobData.locations || [],
      candidateData.location || {},
      jobData.workMode || 'onsite'
    );

    // Semantic matching using embeddings (10% weight)
    const semanticMatch = await this.calculateSemanticMatch(jobData, candidateData);

    // Calculate weighted overall score
    const weights = {
      skills: 0.30,
      experience: 0.25,
      education: 0.20,
      location: 0.15,
      semantic: 0.10
    };

    const overallScore = 
      skillsMatch * weights.skills +
      experienceMatch * weights.experience +
      educationMatch * weights.education +
      locationMatch * weights.location +
      semanticMatch * weights.semantic;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      skillsMatch,
      experienceMatch,
      educationMatch,
      locationMatch,
      semanticMatch,
      breakdown: {
        skills: skillsMatch,
        experience: experienceMatch,
        education: educationMatch,
        location: locationMatch,
        semantic: semanticMatch
      }
    };
  }

  /**
   * Analyze resume and extract key information
   * Note: Install OpenAI package for production use
   */
  async analyzeResume(resumeText: string): Promise<{
    skills: string[];
    experience: {
      totalYears: number;
      companies: string[];
      roles: string[];
      domains: string[];
    };
    education: {
      degree: string;
      field: string;
      institution: string;
      grade?: string;
    }[];
    certifications: string[];
    projects: string[];
    keyStrengths: string[];
    improvementAreas: string[];
    personalityTraits: string[];
    salaryPrediction: {
      min: number;
      max: number;
      confidence: number;
    };
  }> {
    try {
      // TODO: Replace with actual OpenAI chat completion when package is installed
      // const response = await this.openai.chat.completions.create({
      //   model: "gpt-4o-mini",
      //   messages: [
      //     {
      //       role: "system",
      //       content: "You are an expert HR analyst. Analyze the resume and extract structured information in JSON format."
      //     },
      //     {
      //       role: "user",
      //       content: this.createResumeAnalysisPrompt(resumeText)
      //     }
      //   ],
      //   temperature: 0.3,
      //   response_format: { type: "json_object" }
      // });
      // const analysis = JSON.parse(response.choices[0].message.content || '{}');
      // return this.validateResumeAnalysis(analysis);
      
      return this.getDefaultResumeAnalysis();
    } catch (error) {
      console.error('Error analyzing resume:', error);
      return this.getDefaultResumeAnalysis();
    }
  }

  /**
   * Predict hiring probability for a candidate
   */
  async predictHiringProbability(
    candidateData: any,
    jobData: any,
    historicalData?: any[]
  ): Promise<{
    probability: number;
    confidence: number;
    factors: Record<string, number>;
    reasoning: string[];
  }> {
    try {
      const matchScore = await this.calculateAdvancedMatchScore(jobData, candidateData);
      
      // Base probability from matching score
      let probability = matchScore.overallScore;
      
      // Adjust based on market factors
      const marketFactors = this.analyzeMarketFactors(candidateData, jobData);
      probability = probability * (1 + marketFactors.adjustment);
      
      // Historical success rate adjustment
      if (historicalData && historicalData.length > 0) {
        const historicalRate = this.calculateHistoricalSuccessRate(historicalData);
        probability = (probability + historicalRate) / 2;
      }
      
      // Ensure probability is between 0 and 1
      probability = Math.max(0, Math.min(1, probability));
      
      return {
        probability: Math.round(probability * 100) / 100,
        confidence: this.calculateConfidenceScore(matchScore, marketFactors),
        factors: {
          skillMatch: matchScore.skillsMatch,
          experienceMatch: matchScore.experienceMatch,
          marketDemand: marketFactors.demand,
          salaryExpectation: marketFactors.salaryAlignment
        },
        reasoning: this.generateHiringReasons(matchScore, marketFactors)
      };
    } catch (error) {
      console.error('Error predicting hiring probability:', error);
      return {
        probability: 0.5,
        confidence: 0.3,
        factors: {},
        reasoning: ['Analysis incomplete due to technical error']
      };
    }
  }

  /**
   * Generate personalized job recommendations
   */
  async generateJobRecommendations(
    candidateId: Types.ObjectId,
    candidateProfile: any,
    availableJobs: any[],
    limit: number = 10
  ): Promise<{
    jobId: Types.ObjectId;
    matchScore: number;
    reasoning: string[];
    salaryFit: 'under' | 'match' | 'over';
    growthPotential: number;
  }[]> {
    const recommendations = [];
    
    for (const job of availableJobs) {
      const matchScore = await this.calculateAdvancedMatchScore(job, candidateProfile);
      
      if (matchScore.overallScore > 0.3) { // Minimum threshold
        recommendations.push({
          jobId: job._id,
          matchScore: matchScore.overallScore,
          reasoning: this.generateMatchingReasons(matchScore),
          salaryFit: this.calculateSalaryFit(job.salary, candidateProfile.expectedSalary),
          growthPotential: this.calculateGrowthPotential(job, candidateProfile)
        });
      }
    }
    
    // Sort by match score and return top recommendations
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  // Private helper methods

  private createJobText(jobData: any): string {
    return [
      `Job Title: ${jobData.title}`,
      `Department: ${jobData.department}`,
      `Experience Level: ${jobData.experienceLevel}`,
      `Required Skills: ${jobData.requiredSkills.join(', ')}`,
      `Description: ${jobData.description}`
    ].join('\n');
  }

  private createCandidateText(candidateData: any): string {
    return [
      `Skills: ${candidateData.skills.join(', ')}`,
      `Experience: ${candidateData.experience}`,
      `Education: ${candidateData.education}`,
      `Projects: ${candidateData.projects?.join(', ') || ''}`,
      `Certifications: ${candidateData.certifications?.join(', ') || ''}`
    ].join('\n');
  }

  private calculateSkillsMatch(requiredSkills: string[], candidateSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase());
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
    
    const matches = normalizedRequired.filter(skill =>
      normalizedCandidate.some(candidateSkill =>
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    );
    
    return matches.length / normalizedRequired.length;
  }

  private calculateExperienceMatch(minExp: number, maxExp: number, candidateExp: number): number {
    if (candidateExp < minExp) {
      return Math.max(0, 1 - (minExp - candidateExp) / minExp);
    } else if (candidateExp > maxExp) {
      return Math.max(0.7, 1 - (candidateExp - maxExp) / maxExp);
    } else {
      return 1;
    }
  }

  private calculateEducationMatch(requirements: any[], candidateEducation: any): number {
    if (requirements.length === 0) return 1;
    
    // Simplified education matching logic
    return requirements.some(req => 
      candidateEducation.degree?.toLowerCase().includes(req.degree?.toLowerCase())
    ) ? 1 : 0.5;
  }

  private calculateLocationMatch(jobLocations: any[], candidateLocation: any, workMode: string): number {
    if (workMode === 'remote') return 1;
    
    if (jobLocations.length === 0) return 1;
    
    return jobLocations.some(loc =>
      loc.city?.toLowerCase() === candidateLocation.city?.toLowerCase()
    ) ? 1 : 0.3;
  }

  private async calculateSemanticMatch(jobData: any, candidateData: any): Promise<number> {
    try {
      const jobVector = await this.generateJobEmbedding(jobData);
      const candidateVector = await this.generateCandidateEmbedding(candidateData);
      
      return this.calculateCosineSimilarity(jobVector, candidateVector);
    } catch (error) {
      console.error('Error calculating semantic match:', error);
      return 0.5; // Default neutral score
    }
  }

  private generatePlaceholderVector(): number[] {
    return new Array(this.vectorDimension).fill(0).map(() => Math.random() - 0.5);
  }

  private createResumeAnalysisPrompt(resumeText: string): string {
    return `
Analyze this resume and extract the following information in JSON format:

${resumeText}

Please provide a JSON response with the following structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": {
    "totalYears": number,
    "companies": ["company1", ...],
    "roles": ["role1", ...],
    "domains": ["domain1", ...]
  },
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "grade": "string"
    }
  ],
  "certifications": ["cert1", ...],
  "projects": ["project1", ...],
  "keyStrengths": ["strength1", ...],
  "improvementAreas": ["area1", ...],
  "personalityTraits": ["trait1", ...],
  "salaryPrediction": {
    "min": number,
    "max": number,
    "confidence": number
  }
}
`;
  }

  private validateResumeAnalysis(analysis: any): any {
    return {
      skills: analysis.skills || [],
      experience: analysis.experience || {
        totalYears: 0,
        companies: [],
        roles: [],
        domains: []
      },
      education: analysis.education || [],
      certifications: analysis.certifications || [],
      projects: analysis.projects || [],
      keyStrengths: analysis.keyStrengths || [],
      improvementAreas: analysis.improvementAreas || [],
      personalityTraits: analysis.personalityTraits || [],
      salaryPrediction: analysis.salaryPrediction || {
        min: 300000,
        max: 500000,
        confidence: 0.5
      }
    };
  }

  private getDefaultResumeAnalysis(): any {
    return {
      skills: [],
      experience: { totalYears: 0, companies: [], roles: [], domains: [] },
      education: [],
      certifications: [],
      projects: [],
      keyStrengths: [],
      improvementAreas: [],
      personalityTraits: [],
      salaryPrediction: { min: 300000, max: 500000, confidence: 0.3 }
    };
  }

  private analyzeMarketFactors(candidateData: any, jobData: any): any {
    return {
      demand: 0.7, // Market demand for the role
      salaryAlignment: 0.8, // How well salary expectations align
      adjustment: 0.1 // Overall market adjustment factor
    };
  }

  private calculateHistoricalSuccessRate(historicalData: any[]): number {
    const successful = historicalData.filter(d => d.hired === true).length;
    return successful / historicalData.length;
  }

  private calculateConfidenceScore(matchScore: any, marketFactors: any): number {
    return Math.min(1, (matchScore.overallScore + marketFactors.demand) / 2);
  }

  private generateHiringReasons(matchScore: any, marketFactors: any): string[] {
    const reasons = [];
    
    if (matchScore.skillsMatch > 0.8) {
      reasons.push('Strong skill alignment with job requirements');
    }
    if (matchScore.experienceMatch > 0.7) {
      reasons.push('Experience level matches job expectations');
    }
    if (marketFactors.demand > 0.7) {
      reasons.push('High market demand for this role type');
    }
    
    return reasons;
  }

  private generateMatchingReasons(matchScore: any): string[] {
    const reasons = [];
    
    if (matchScore.skillsMatch > 0.7) {
      reasons.push(`${Math.round(matchScore.skillsMatch * 100)}% skill match`);
    }
    if (matchScore.experienceMatch > 0.7) {
      reasons.push('Experience requirements met');
    }
    if (matchScore.locationMatch > 0.8) {
      reasons.push('Location preference aligned');
    }
    
    return reasons;
  }

  private calculateSalaryFit(jobSalary: any, expectedSalary: number): 'under' | 'match' | 'over' {
    if (!jobSalary || !expectedSalary) return 'match';
    
    const jobMin = jobSalary.min || 0;
    const jobMax = jobSalary.max || jobMin;
    
    if (expectedSalary < jobMin) return 'over';
    if (expectedSalary > jobMax) return 'under';
    return 'match';
  }

  private calculateGrowthPotential(job: any, candidate: any): number {
    // Simplified growth potential calculation
    return Math.random() * 0.5 + 0.5; // 0.5 to 1.0
  }
}

export default AIMLService;
