import {
  canonicalSkill,
  cosineSimilarity,
  createFeatureVector,
  extractCanonicalSkills,
  freshnessCutoff,
  inferIndustry,
  normalizeTitle
} from './job-intelligence';

export type MatchDimension =
  | 'semanticSkills'
  | 'experience'
  | 'jobTitle'
  | 'location'
  | 'freshness'
  | 'salary'
  | 'educationCertifications'
  | 'industry';

export interface DimensionScore {
  score: number;
  weight: number;
  matched: string[];
  missing: string[];
  evidence: string;
}

export interface AtsEvaluation {
  hardSkillsScore: number;
  seniorityScore: number;
  domainScore: number;
  finalMatchScore: number;
  experienceYearsFound: number | null;
  experienceMatchStatus: 'EXCEEDS' | 'MATCHES' | 'UNDERQUALIFIED';
  matchedCoreSkills: string[];
  missingCriticalSkills: string[];
  conciseJustification: string;
}

export interface HybridMatchResult {
  matchScore: number;
  displayMatchScore?: number;
  ruleBasedScore: number;
  aiScore: number;
  matchingModel: 'hybrid-ai-v2' | 'hybrid-local-v2';
  scoreBreakdown: Record<MatchDimension, DimensionScore>;
  skillsMatched: string[];
  skillsGap: string[];
  explanation: string;
  suggestions: string[];
  atsEvaluation: AtsEvaluation;
}

export const MATCH_VISIBILITY_THRESHOLD = 70;
export const MAX_DISPLAY_MATCH_SCORE = 100;

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));
const text = (value: unknown): string => String(value || '').trim();
const unique = (items: string[]): string[] => Array.from(new Set(items.map(text).filter(Boolean)));

export const toDisplayMatchScore = (rawScore: number): number | undefined =>
  rawScore >= MATCH_VISIBILITY_THRESHOLD ? Math.min(MAX_DISPLAY_MATCH_SCORE, clamp(rawScore)) : undefined;

const WEIGHTS: Record<MatchDimension, number> = {
  semanticSkills: 40,
  experience: 15,
  jobTitle: 10,
  location: 10,
  freshness: 10,
  salary: 5,
  educationCertifications: 5,
  industry: 5
};

class HybridResumeMatchingService {
  calculate(student: any, job: any, aiAnalysis?: any): HybridMatchResult {
    const scoreBreakdown: Record<MatchDimension, DimensionScore> = {
      semanticSkills: this.scoreSkills(student, job),
      experience: this.scoreExperience(student, job),
      jobTitle: this.scoreJobTitle(student, job),
      location: this.scoreLocation(student, job),
      freshness: this.scoreFreshness(job),
      salary: this.scoreSalary(student, job),
      educationCertifications: this.scoreEducationCertifications(student, job),
      industry: this.scoreIndustry(student, job)
    };

    const localHardSkills = scoreBreakdown.semanticSkills.score;
    const localSeniority = clamp(scoreBreakdown.experience.score * 0.8 + scoreBreakdown.jobTitle.score * 0.2);
    const localDomain = clamp(
      scoreBreakdown.industry.score * 0.7
      + scoreBreakdown.jobTitle.score * 0.2
      + scoreBreakdown.educationCertifications.score * 0.1
    );
    const valid = (value: unknown): value is number => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
    const hardSkillsScore = valid(aiAnalysis?.hardSkillsScore) ? clamp(aiAnalysis.hardSkillsScore) : localHardSkills;
    const seniorityScore = valid(aiAnalysis?.seniorityScore) ? clamp(aiAnalysis.seniorityScore) : localSeniority;
    const domainScore = valid(aiAnalysis?.domainScore) ? clamp(aiAnalysis.domainScore) : localDomain;
    const ruleBasedScore = clamp(hardSkillsScore * 0.4 + seniorityScore * 0.3 + domainScore * 0.3);
    const skillsMatched = unique(scoreBreakdown.semanticSkills.matched);
    const skillsGap = unique(scoreBreakdown.semanticSkills.missing);
    const years = this.experienceYears(student);
    const minimum = Number(job.minExperience || 0);
    const experienceMatchStatus: AtsEvaluation['experienceMatchStatus'] = years >= (minimum > 0 ? minimum + 2 : 2)
      ? 'EXCEEDS'
      : years >= minimum ? 'MATCHES' : 'UNDERQUALIFIED';
    const conciseJustification = `Core skills scored ${hardSkillsScore}%, while relevant seniority scored ${seniorityScore}%. Domain and role-context alignment scored ${domainScore}%, producing a strict weighted match of ${ruleBasedScore}%.`;

    return {
      matchScore: ruleBasedScore,
      displayMatchScore: toDisplayMatchScore(ruleBasedScore),
      ruleBasedScore,
      aiScore: aiAnalysis ? clamp(aiAnalysis.matchScore ?? ruleBasedScore) : ruleBasedScore,
      matchingModel: aiAnalysis && !aiAnalysis.usedFallback ? 'hybrid-ai-v2' : 'hybrid-local-v2',
      scoreBreakdown,
      skillsMatched,
      skillsGap,
      explanation: aiAnalysis?.conciseJustification || conciseJustification,
      suggestions: skillsGap.slice(0, 4).map(skill => `Add evidence of ${skill} through relevant work or projects.`),
      atsEvaluation: {
        hardSkillsScore,
        seniorityScore,
        domainScore,
        finalMatchScore: ruleBasedScore,
        experienceYearsFound: years || null,
        experienceMatchStatus,
        matchedCoreSkills: skillsMatched,
        missingCriticalSkills: skillsGap,
        conciseJustification
      }
    };
  }

  private scoreSkills(student: any, job: any): DimensionScore {
    const extracted = student.resumeAnalysis?.extractedDetails || {};
    const certifications = (extracted.certifications || []).map((item: any) => item.name).join(' ');
    const projects = (extracted.projects || []).map((item: any) => `${item.name || ''} ${item.description || ''} ${(item.technologies || []).join(' ')}`).join(' ');
    const studentSkills = (student.skills || []).map((item: any) => canonicalSkill(item.name || item));
    const studentContent = `${student.resumeText || student.resumeAnalysis?.resumeText || ''} ${studentSkills.join(' ')} ${certifications} ${projects}`;
    const studentCanonical = extractCanonicalSkills(studentContent, studentSkills);
    const requirements = (job.requirements || []).filter((item: any) => item.skill);
    const jobCanonical = unique([
      ...(job.canonicalSkills || []),
      ...(job.requiredSkills || []),
      ...requirements.map((item: any) => item.skill)
    ].map(canonicalSkill));
    if (!jobCanonical.length) return this.dimension(studentCanonical.length ? 70 : 40, 'semanticSkills', [], [], 'No explicit required skills were supplied.');
    const matched = jobCanonical.filter(skill => studentCanonical.includes(skill));
    const missing = jobCanonical.filter(skill => !studentCanonical.includes(skill));
    const mandatory = new Set(requirements.filter((item: any) => item.mandatory).map((item: any) => canonicalSkill(item.skill)));
    const totalWeight = jobCanonical.reduce((sum, skill) => sum + (mandatory.has(skill) ? 2 : 1), 0);
    const matchedWeight = matched.reduce((sum, skill) => sum + (mandatory.has(skill) ? 2 : 1), 0);
    const exactScore = totalWeight ? matchedWeight / totalWeight * 100 : 0;
    const targetVector = Array.isArray(job.featureVector) && job.featureVector.length
      ? job.featureVector
      : createFeatureVector(`${job.title || ''} ${job.description || ''}`);
    const semanticScore = cosineSimilarity(createFeatureVector(studentContent), targetVector) * 100;
    return this.dimension(exactScore * 0.8 + semanticScore * 0.2, 'semanticSkills', matched, missing, `${matched.length} of ${jobCanonical.length} required skills matched.`);
  }

  private scoreExperience(student: any, job: any): DimensionScore {
    const years = this.experienceYears(student);
    const minimum = Number(job.minExperience || 0);
    const score = minimum ? Math.min(100, years / minimum * 100) : years ? 100 : 85;
    return this.dimension(score, 'experience', years ? [`${years} years`] : [], years < minimum ? [`${minimum} years required`] : [], `${years} years found; ${minimum} required.`);
  }

  private scoreJobTitle(student: any, job: any): DimensionScore {
    const roles = unique([
      ...(student.jobPreferences?.preferredRoles || []),
      ...(student.experience || []).map((item: any) => item.title)
    ]);
    const target = normalizeTitle(job.title || '');
    const similarities = roles.map(role => {
      const normalized = normalizeTitle(role);
      if (normalized === target) return 100;
      if (normalized.includes(target) || target.includes(normalized)) return 85;
      return cosineSimilarity(createFeatureVector(normalized), createFeatureVector(target)) * 100;
    });
    const titleScore = similarities.length ? Math.max(...similarities) : 45;
    const preferredTypes = (student.jobPreferences?.jobTypes || []).map((item: string) => item.toLowerCase());
    const typeScore = !preferredTypes.length || preferredTypes.includes(String(job.jobType || '').toLowerCase()) ? 100 : 30;
    return this.dimension(titleScore * 0.8 + typeScore * 0.2, 'jobTitle', titleScore >= 70 ? [job.title] : [], titleScore < 50 ? [job.title] : [], roles.length ? 'Compared with preferred and previous roles.' : 'No preferred role supplied.');
  }

  private scoreLocation(student: any, job: any): DimensionScore {
    const preferred = (student.jobPreferences?.preferredLocations || []).map((item: string) => item.toLowerCase());
    const locations = (job.locations || []).flatMap((item: any) => [item.city, item.state, item.country]).filter(Boolean).map((item: string) => item.toLowerCase());
    const preferredMode = String(student.jobPreferences?.workMode || 'any').toLowerCase();
    const jobMode = String(job.workMode || '').toLowerCase();
    const modeMatches = preferredMode === 'any' || preferredMode === jobMode;
    const locationMatches = jobMode === 'remote' || !preferred.length || preferred.some((place: string) => locations.some((location: string) => location.includes(place) || place.includes(location)));
    const score = (modeMatches ? 50 : 10) + (locationMatches ? 50 : 10);
    return this.dimension(score, 'location', locationMatches ? [jobMode === 'remote' ? 'Remote' : locations[0]] : [], locationMatches ? [] : preferred, 'Compared preferred work mode and locations.');
  }

  private scoreFreshness(job: any): DimensionScore {
    const posted = new Date(job.postedAt || job.createdAt || 0);
    const ageDays = Math.max(0, (Date.now() - posted.getTime()) / 86400000);
    const score = posted >= freshnessCutoff() ? Math.max(55, 100 - ageDays * 3) : 20;
    return this.dimension(score, 'freshness', [`Posted ${Math.round(ageDays)} days ago`], [], 'Recent jobs receive a stronger recommendation signal.');
  }

  private scoreSalary(student: any, job: any): DimensionScore {
    const expected = student.jobPreferences?.expectedSalary;
    const offered = job.salary;
    if (!expected?.min || !offered?.max) return this.dimension(70, 'salary', [], [], 'Salary preference or offer is incomplete.');
    const score = offered.max >= expected.min ? 100 : Math.max(0, offered.max / expected.min * 100);
    return this.dimension(score, 'salary', score >= 80 ? ['Expected range'] : [], score < 80 ? ['Expected salary'] : [], 'Compared maximum offer with minimum expectation.');
  }

  private scoreEducationCertifications(student: any, job: any): DimensionScore {
    const extracted = student.resumeAnalysis?.extractedDetails || {};
    const education = [...(student.education || []), ...(extracted.education || [])];
    const certifications = (extracted.certifications || []).map((item: any) => text(item.name || item).toLowerCase());
    const requiredEducation = job.educationRequirements || [];
    const requiredCertifications = (job.certifications || []).map((item: string) => item.toLowerCase());
    const educationText = education.map((item: any) => `${item.degree || ''} ${item.field || ''}`).join(' ').toLowerCase();
    const educationMatched = requiredEducation.filter((item: any) => educationText.includes(text(item.degree).toLowerCase()) || (item.field && educationText.includes(text(item.field).toLowerCase()))).map((item: any) => item.degree);
    const certificationMatched = requiredCertifications.filter((required: string) => certifications.some((owned: string) => owned.includes(required) || required.includes(owned)));
    const requiredCount = requiredEducation.length + requiredCertifications.length;
    const score = requiredCount ? (educationMatched.length + certificationMatched.length) / requiredCount * 100 : (education.length || certifications.length ? 90 : 65);
    return this.dimension(score, 'educationCertifications', [...educationMatched, ...certificationMatched], requiredCertifications.filter((item: string) => !certificationMatched.includes(item)), 'Compared explicit education and certification requirements.');
  }

  private scoreIndustry(student: any, job: any): DimensionScore {
    const preferred = (student.jobPreferences?.industriesOfInterest || []).map((item: string) => item.toLowerCase());
    const resumeIndustry = inferIndustry(`${student.resumeText || ''} ${(student.experience || []).map((item: any) => `${item.company} ${item.description}`).join(' ')}`).toLowerCase();
    const jobIndustry = text(job.industry || inferIndustry(`${job.department || ''} ${job.description || ''}`)).toLowerCase();
    const matched = resumeIndustry === jobIndustry || preferred.some((item: string) => jobIndustry.includes(item) || item.includes(jobIndustry));
    return this.dimension(matched ? 100 : preferred.length ? 35 : 60, 'industry', matched ? [jobIndustry] : [], matched ? [] : [jobIndustry], 'Compared resume domain and preferred industries with the job context.');
  }

  private experienceYears(student: any): number {
    const experiences = student.experience || student.resumeAnalysis?.extractedDetails?.experience || [];
    const months = experiences.reduce((total: number, item: any) => {
      const start = item.startDate ? new Date(item.startDate) : null;
      const end = item.endDate ? new Date(item.endDate) : (item.isCurrentJob ? new Date() : null);
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return total;
      return total + Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth());
    }, 0);
    return Math.round(months / 12 * 10) / 10;
  }

  private dimension(score: number, dimension: MatchDimension, matched: string[], missing: string[], evidence: string): DimensionScore {
    return { score: clamp(score), weight: WEIGHTS[dimension], matched: unique(matched), missing: unique(missing), evidence };
  }
}

export default new HybridResumeMatchingService();
