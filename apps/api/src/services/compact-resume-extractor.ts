import axios from 'axios';
import AIResumeMatchingService, { ComprehensiveResumeAnalysis } from './ai-resume-matching';

const cleanResumeText = (value: string): string => {
  const seen = new Set<string>();
  return value
    .replace(/\u0000/g, ' ')
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => {
      if (!line) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('\n')
    .slice(0, 18000);
};

export const extractResumeContacts = (text: string): { email?: string; phone?: string } => {
  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const candidates = text.match(/(?:\+?91[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?)?\d(?:[\s.-]?\d){8,11}/g) || [];
  const phone = candidates.map(value => value.trim()).find(value => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
  });
  return { ...(email ? { email } : {}), ...(phone ? { phone } : {}) };
};

const schema = {
  name: 'campuspe_resume_profile',
  strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    properties: {
      personalInfo: {
        type: 'object', additionalProperties: false,
        properties: {
          location: { type: 'string' }, linkedIn: { type: 'string' }, github: { type: 'string' },
          portfolio: { type: 'string' }, summary: { type: 'string' },
          dateOfBirth: { type: 'string' }, gender: { type: 'string' }
        },
        required: ['location', 'linkedIn', 'github', 'portfolio', 'summary', 'dateOfBirth', 'gender']
      },
      skills: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          properties: {
            name: { type: 'string' },
            level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
            category: { type: 'string', enum: ['technical', 'soft', 'language'] }
          },
          required: ['name', 'level', 'category']
        }
      },
      experience: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          properties: {
            title: { type: 'string' }, company: { type: 'string' }, location: { type: 'string' },
            startDate: { type: 'string' }, endDate: { type: 'string' }, description: { type: 'string' },
            isCurrentJob: { type: 'boolean' }
          },
          required: ['title', 'company', 'location', 'startDate', 'endDate', 'description', 'isCurrentJob']
        }
      },
      education: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          properties: {
            degree: { type: 'string' }, field: { type: 'string' }, institution: { type: 'string' },
            startDate: { type: 'string' }, endDate: { type: 'string' },
            startYear: { type: 'integer' }, endYear: { type: 'integer' }, gpa: { type: 'string' },
            grade: { type: 'string' }, isCompleted: { type: 'boolean' }
          },
          required: ['degree', 'field', 'institution', 'startDate', 'endDate', 'startYear', 'endYear', 'gpa', 'grade', 'isCompleted']
        }
      },
      projects: {
        type: 'array', items: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, description: { type: 'string' }, technologies: { type: 'array', items: { type: 'string' } }, link: { type: 'string' } },
          required: ['name', 'description', 'technologies', 'link']
        }
      },
      certifications: {
        type: 'array', items: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, organization: { type: 'string' }, year: { type: 'integer' } },
          required: ['name', 'organization', 'year']
        }
      },
      languages: {
        type: 'array', items: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, proficiency: { type: 'string' } }, required: ['name', 'proficiency']
        }
      }
    },
    required: ['personalInfo', 'skills', 'experience', 'education', 'projects', 'certifications', 'languages']
  }
};

class CompactResumeExtractor {
  async analyze(resumeText: string): Promise<ComprehensiveResumeAnalysis> {
    const compactText = cleanResumeText(resumeText);
    const exhaustedProviders: string[] = [];
    const providerWarnings: string[] = [];
    const openAIKey = process.env.OPENAI_API_KEY?.trim();
    if (openAIKey) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 2500,
          messages: [
            { role: 'system', content: this.instruction() },
            { role: 'user', content: compactText }
          ],
          response_format: { type: 'json_schema', json_schema: schema }
        }, {
          timeout: 30000,
          headers: { Authorization: `Bearer ${openAIKey}`, 'Content-Type': 'application/json' }
        });
        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('OpenAI returned no resume analysis');
        return this.normalize(JSON.parse(content), 'openai-gpt-4o-mini', exhaustedProviders, providerWarnings);
      } catch (error) {
        if (this.isCreditError(error)) {
          exhaustedProviders.push('OpenAI');
          providerWarnings.push('OpenAI API credits are exhausted. CampusPe used the next available resume analyzer.');
        }
        console.warn('Compact OpenAI resume extraction failed:', this.errorMessage(error));
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      try {
        const model = process.env.GEMINI_RESUME_MODEL || 'gemini-2.5-flash-lite';
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            contents: [{ role: 'user', parts: [{ text: `${this.instruction()}\n\nRESUME:\n${compactText}` }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json',
              responseJsonSchema: schema.schema
            }
          },
          { timeout: 30000, headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' } }
        );
        const content = response.data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('');
        if (!content) throw new Error('Gemini returned no resume analysis');
        return this.normalize(JSON.parse(content), 'gemini-flash-lite', exhaustedProviders, providerWarnings);
      } catch (error) {
        if (this.isCreditError(error)) {
          exhaustedProviders.push('Gemini');
          providerWarnings.push('Gemini API credits are exhausted. CampusPe used the next available resume analyzer.');
        }
        console.warn('Compact Gemini resume extraction failed:', this.errorMessage(error));
      }
    }

    const analysis = await AIResumeMatchingService.analyzeCompleteResume(resumeText);
    analysis.analysisMetadata = {
      ...analysis.analysisMetadata,
      provider: analysis.analysisMetadata?.extractionMethod === 'AI' ? 'claude-fallback' : 'local-fallback',
      creditStatus: exhaustedProviders.length
        ? analysis.analysisMetadata?.extractionMethod === 'AI' ? 'fallback' : 'exhausted'
        : 'available',
      exhaustedProviders,
      providerWarnings
    };
    return analysis;
  }

  private instruction(): string {
    return 'Extract resume facts only. Never invent or infer missing facts. Use empty strings, zero years, or empty arrays when absent. Never estimate an education or employment start date from an end date. Preserve explicit month precision as YYYY-MM. Keep each experience description concise but preserve measurable achievements. Summary must come only from an explicit Summary, Profile, About, or Objective section; otherwise return an empty string. Do not extract name, email, or phone.';
  }

  private normalize(
    analysis: any,
    provider: string,
    exhaustedProviders: string[] = [],
    providerWarnings: string[] = []
  ): ComprehensiveResumeAnalysis {
    analysis.personalInfo = analysis.personalInfo || {};
    analysis.skills = (analysis.skills || []).filter((item: any) => item.name);
    analysis.education = (analysis.education || []).filter((item: any) => item.degree || item.institution);
    analysis.experience = (analysis.experience || []).filter((item: any) => item.title || item.company);
    analysis.projects = (analysis.projects || []).filter((item: any) => item.name);
    analysis.certifications = (analysis.certifications || []).filter((item: any) => item.name);
    analysis.languages = (analysis.languages || []).filter((item: any) => item.name);
    analysis.jobPreferences = { preferredRoles: [], preferredIndustries: [], experienceLevel: 'entry', workMode: 'any' };
    analysis.analysisMetadata = {
      confidence: 90,
      extractionMethod: 'AI',
      provider,
      creditStatus: exhaustedProviders.length ? 'fallback' : 'available',
      exhaustedProviders,
      providerWarnings,
      totalYearsExperience: 0,
      primarySkillCategory: analysis.skills?.[0]?.category || '',
      suggestedJobCategory: '',
      analysisDate: new Date()
    };
    return analysis as ComprehensiveResumeAnalysis;
  }

  private errorMessage(error: unknown): string {
    const status = (error as any)?.response?.status;
    const message = (error as any)?.response?.data?.error?.message || (error instanceof Error ? error.message : String(error));
    return `${status ? `${status} ` : ''}${message}`;
  }

  private isCreditError(error: unknown): boolean {
    const status = Number((error as any)?.response?.status || 0);
    const code = String((error as any)?.response?.data?.error?.code || (error as any)?.response?.data?.error?.status || '').toLowerCase();
    const message = this.errorMessage(error).toLowerCase();
    return status === 402
      || status === 429
      || /insufficient_quota|resource_exhausted|billing_hard_limit/.test(code)
      || /quota|credit|billing limit|resource exhausted/.test(message);
  }
}

export default new CompactResumeExtractor();
