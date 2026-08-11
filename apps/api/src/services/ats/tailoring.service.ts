import { TailoredMaterials } from './types';
import { callOpenAIChat, OpenAIRateLimitError } from '../openai-client';
import { sanitizeForLog } from '../../utils/safe-logging';

const compact = (value: unknown): string => String(value || '').replace(/\s+/g, ' ').trim();

class TailoringService {
  async buildMaterials(student: any, job: any): Promise<TailoredMaterials> {
    const facts = this.resumeFacts(student);
      try {
        const data = await callOpenAIChat<any>({
          model: process.env.OPENAI_APPLICATION_TAILORING_MODEL || process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 1800,
          messages: [
            {
              role: 'system',
              content: 'Create tailored application materials using only the supplied resume facts. Do not invent skills, employers, education, metrics, eligibility, or experience. Omit any fact that is not supplied.'
            },
            {
              role: 'user',
              content: JSON.stringify({
                resumeFacts: facts,
                job: {
                  title: job.title,
                  companyName: job.companyName,
                  description: job.description,
                  requiredSkills: job.requiredSkills,
                  location: job.location,
                  seniority: job.seniority || job.experienceLevel
                }
              })
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'campuspe_tailored_application',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  resumeText: { type: 'string' },
                  coverLetterText: { type: 'string' }
                },
                required: ['resumeText', 'coverLetterText']
              }
            }
          }
        }, {
          serviceName: 'application tailoring',
          timeout: 30000,
          // A student is waiting on this submission, so absorb brief throttling
          // instead of failing the application outright.
          waitForCooldown: true,
          maxCooldownWaitMs: 20_000
        });
        const content = data?.choices?.[0]?.message?.content;
        if (content) return this.normalizeMaterials(JSON.parse(content), facts, job);
      } catch (error) {
        if (error instanceof OpenAIRateLimitError) {
          console.warn(`Application tailoring deferred: ${error.message}`);
          throw error;
        }
        console.error('Application tailoring OpenAI call failed:', sanitizeForLog(error));
        throw new Error(`Application tailoring failed: ${error instanceof Error ? error.message : 'OpenAI request failed'}`);
      }
    throw new Error('Application tailoring failed: OpenAI returned no tailored materials');
  }

  private resumeFacts(student: any): Record<string, unknown> {
    const extracted = student.resumeAnalysis?.extractedDetails || {};
    return {
      name: compact(`${student.firstName || ''} ${student.lastName || ''}`),
      email: student.email || extracted.contactInfo?.email || '',
      phone: student.phoneNumber || extracted.contactInfo?.phone || '',
      location: student.locations?.[0] || extracted.contactInfo?.address || '',
      summary: student.resumeAnalysis?.summary || extracted.personalInfo?.summary || '',
      skills: (student.skills || []).map((skill: any) => compact(typeof skill === 'string' ? skill : skill?.name)).filter(Boolean),
      titles: student.titles || (student.experience || []).map((item: any) => item?.title).filter(Boolean),
      yearsExperience: student.yearsExperience || 0,
      experience: (student.experience || extracted.experience || []).map((item: any) => ({
        title: item.title,
        company: item.company,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        isCurrentJob: item.isCurrentJob,
        description: item.description
      })),
      education: (student.education || extracted.education || []).map((item: any) => ({
        degree: item.degree,
        field: item.field,
        institution: item.institution,
        isCompleted: item.isCompleted
      })),
      projects: extracted.projects || [],
      certifications: extracted.certifications || []
    };
  }

  private normalizeMaterials(value: any, facts: Record<string, unknown>, job: any): TailoredMaterials {
    const fallback = this.fallbackMaterials(facts, job);
    return {
      resumeText: compact(value?.resumeText).length >= 50 ? String(value.resumeText).trim() : fallback.resumeText,
      coverLetterText: compact(value?.coverLetterText).length >= 50 ? String(value.coverLetterText).trim() : fallback.coverLetterText
    };
  }

  private fallbackMaterials(facts: Record<string, unknown>, job: any): TailoredMaterials {
    const skills = (facts.skills as string[] || []).join(', ');
    const experience = (facts.experience as any[] || [])
      .map(item => `${compact(item.title)} at ${compact(item.company)}. ${compact(item.description)}`)
      .filter(line => line.replace(/[.\s]/g, '').length)
      .join('\n');
    const education = (facts.education as any[] || [])
      .map(item => `${compact(item.degree)} ${compact(item.field)} from ${compact(item.institution)}`.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
    const resumeText = [
      facts.name,
      facts.email,
      facts.phone,
      facts.location,
      facts.summary,
      skills ? `Skills: ${skills}` : '',
      experience ? `Experience:\n${experience}` : '',
      education ? `Education:\n${education}` : ''
    ].map(compact).filter(Boolean).join('\n\n');

    const coverLetterText = [
      `Dear ${compact(job.companyName) || 'Hiring Team'} team,`,
      `I am applying for the ${compact(job.title) || 'open'} role.`,
      skills ? `My relevant skills from my resume include ${skills}.` : '',
      experience ? `My experience includes ${experience.split('\n')[0]}` : '',
      'All details above are based on my CampusPe resume profile.'
    ].filter(Boolean).join('\n\n');

    return { resumeText, coverLetterText };
  }
}

export default new TailoringService();
