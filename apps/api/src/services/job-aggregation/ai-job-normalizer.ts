import { JobDto } from './types';
import { callOpenAIChat, OpenAIRateLimitError } from '../openai-client';
import { sanitizeForLog } from '../../utils/safe-logging';

interface AIJobFields {
  summary?: string;
  skills?: string[];
  department?: string;
  workMode?: 'remote' | 'onsite' | 'hybrid';
  jobType?: JobDto['jobType'];
  minExperience?: number;
  maxExperience?: number;
  education?: Array<{ degree: string; field?: string }>;
  benefits?: string[];
  matchingKeywords?: string[];
}

const cleanList = (values: unknown, maximum = 20): string[] => Array.isArray(values)
  ? [...new Set(values.map(value => String(value || '').trim().toLowerCase()).filter(Boolean))].slice(0, maximum)
  : [];

const extractJson = (value: string): AIJobFields => {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI job normalization returned no JSON object');
  return JSON.parse(cleaned.slice(start, end + 1));
};

class AIJobNormalizer {
  private disabledUntil = 0;
  private lastSkipLogAt = 0;
  private skippedSinceLastLog = 0;

  isEnabled(): boolean {
    return process.env.AI_JOB_ENRICHMENT_ENABLED !== 'false' && Date.now() >= this.disabledUntil;
  }

  /** Re-enables enrichment immediately, e.g. after quota or credentials change. */
  resetRateLimitState(): void {
    this.disabledUntil = 0;
    this.lastSkipLogAt = 0;
    this.skippedSinceLastLog = 0;
  }

  async enrich(job: JobDto): Promise<JobDto> {
    if (!this.isEnabled()) return job;
    try {
      const prompt = `Extract factual job information from the posting. Do not invent missing facts. Skills must include technologies, tools, methodologies, domain skills and explicitly required soft skills. Use 0 when experience is not stated.\n\nTitle: ${job.title}\nCompany: ${job.companyName}\nProvider location/work mode: ${JSON.stringify(job.locations)} / ${job.workMode}\nDescription:\n${job.description.slice(0, 14000)}`;
      let responseText = '';
      {
        const data = await callOpenAIChat<any>({
          model: process.env.OPENAI_JOB_NORMALIZATION_MODEL || 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 900,
          messages: [{ role: 'system', content: 'Extract only explicit job facts.' }, { role: 'user', content: prompt }],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'campuspe_job_fields', strict: true,
              schema: {
                type: 'object', additionalProperties: false,
                properties: {
                  summary: { type: 'string' }, skills: { type: 'array', items: { type: 'string' } },
                  department: { type: 'string' }, workMode: { type: 'string', enum: ['remote', 'onsite', 'hybrid', 'unknown'] },
                  jobType: { type: 'string', enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance', 'unknown'] },
                  minExperience: { type: 'number' }, maxExperience: { type: 'number' },
                  education: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { degree: { type: 'string' }, field: { type: 'string' } }, required: ['degree', 'field'] } },
                  benefits: { type: 'array', items: { type: 'string' } }, matchingKeywords: { type: 'array', items: { type: 'string' } }
                },
                required: ['summary', 'skills', 'department', 'workMode', 'jobType', 'minExperience', 'maxExperience', 'education', 'benefits', 'matchingKeywords']
              }
            }
          }
        }, {
          serviceName: 'job description extraction',
          timeout: 30000,
          // Enrichment is a background best-effort pass, so it yields the key's
          // remaining quota to student-facing requests instead of queueing.
          waitForCooldown: false
        });
        responseText = data?.choices?.[0]?.message?.content || '';
      }
      if (!responseText) return job;
      const fields = extractJson(responseText);
      const aiSkills = cleanList(fields.skills);
      const requiredSkills = [...new Set([...job.requiredSkills, ...aiSkills])].slice(0, 30);
      const matchingKeywords = [...new Set([...job.matchingKeywords, ...cleanList(fields.matchingKeywords), ...aiSkills])].slice(0, 50);
      const validWorkMode = ['remote', 'onsite', 'hybrid'].includes(String(fields.workMode)) ? fields.workMode : undefined;
      const validJobType = ['full-time', 'part-time', 'internship', 'contract', 'freelance'].includes(String(fields.jobType)) ? fields.jobType : undefined;
      const minExperience = Number.isFinite(Number(fields.minExperience)) ? Math.max(0, Number(fields.minExperience)) : job.minExperience;
      const parsedMaximum = Number(fields.maxExperience);
      const maxExperience = Number.isFinite(parsedMaximum) && parsedMaximum > 0 ? Math.max(minExperience, parsedMaximum) : job.maxExperience;
      const educationRequirements = job.educationRequirements.length ? job.educationRequirements : Array.isArray(fields.education)
        ? fields.education.filter(item => item?.degree).slice(0, 5).map(item => ({ degree: String(item.degree).trim(), field: item.field ? String(item.field).trim() : undefined, mandatory: false }))
        : [];
      const benefits = job.benefits.length ? job.benefits : cleanList(fields.benefits, 15).map(value => value.replace(/\b\w/g, letter => letter.toUpperCase()));
      const department = job.department && job.department !== 'General' ? job.department : String(fields.department || 'General').trim();
      const summary = String(fields.summary || '').replace(/\s+/g, ' ').trim().slice(0, 240);

      return {
        ...job,
        department,
        // Provider-supplied structured values remain authoritative. AI is a
        // fallback for missing facts, never a reason to overwrite them.
        workMode: job.workMode || validWorkMode || 'onsite',
        jobType: job.jobType || validJobType || 'full-time',
        minExperience: job.minExperience || minExperience,
        maxExperience: job.maxExperience ?? maxExperience,
        requiredSkills,
        requirements: requiredSkills.map(skill => job.requirements.find(item => item.skill.toLowerCase() === skill.toLowerCase()) || ({ skill, level: 'intermediate', mandatory: false, category: 'technical' })),
        educationRequirements,
        benefits,
        matchingKeywords,
        aiGeneratedDescription: summary || job.aiGeneratedDescription
      };
    } catch (error) {
      const status = Number((error as any)?.response?.status || 0);
      if ([400, 401, 402, 403].includes(status)) this.disabledUntil = Date.now() + 15 * 60 * 1000;
      if (error instanceof OpenAIRateLimitError) {
        // Pause enrichment for the whole sync rather than retrying per job, and
        // report the throttling once per window instead of once per posting.
        this.disabledUntil = Math.max(this.disabledUntil, Date.now() + error.retryAfterMs);
        this.reportRateLimit(error.retryAfterMs);
        return job;
      }
      console.warn(`AI job enrichment skipped for ${job.sourceProvider}:${job.sourceExternalId}:`, sanitizeForLog(error instanceof Error ? error.message : error));
      return job;
    }
  }

  private reportRateLimit(retryAfterMs: number): void {
    this.skippedSinceLastLog += 1;
    if (Date.now() - this.lastSkipLogAt < 60_000) return;
    console.warn(`⚠️  OpenAI rate limit reached; AI job enrichment paused for ${Math.ceil(retryAfterMs / 1000)}s (${this.skippedSinceLastLog} posting(s) kept provider-normalized data).`);
    this.lastSkipLogAt = Date.now();
    this.skippedSinceLastLog = 0;
  }
}

export default new AIJobNormalizer();
