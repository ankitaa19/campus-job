import { createFeatureVector } from './job-intelligence';

export interface SalaryExpectation {
  min?: number;
  max?: number;
  currency?: string;
}

const uniqueClean = (values: unknown[], limit = 50): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= limit) break;
  }
  return result;
};

export const normalizeSalaryExpectation = (value: any): SalaryExpectation | undefined => {
  const source = value?.expectedSalary || value?.salaryExpectation || value?.salary_expectation || value;
  if (!source || typeof source !== 'object') return undefined;
  const min = Number(source.min ?? source.minimum);
  const max = Number(source.max ?? source.maximum);
  const salary: SalaryExpectation = {};
  if (Number.isFinite(min) && min >= 0) salary.min = min;
  if (Number.isFinite(max) && max >= 0) salary.max = max;
  salary.currency = String(source.currency || 'INR').trim() || 'INR';
  return salary.min != null || salary.max != null ? salary : undefined;
};

export const calculateYearsExperience = (experience: any[] = []): number => {
  const totalMonths = experience.reduce((sum, item) => {
    const start = item?.startDate ? new Date(item.startDate) : undefined;
    const end = item?.isCurrentJob ? new Date() : (item?.endDate ? new Date(item.endDate) : undefined);
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return sum;
    return sum + Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth());
  }, 0);
  return Math.round((totalMonths / 12) * 10) / 10;
};

export const buildStudentStructuredFields = (student: any) => {
  const extracted = student?.resumeAnalysis?.extractedDetails || {};
  const skills = uniqueClean([
    ...(student?.skills || []).map((skill: any) => typeof skill === 'string' ? skill : skill?.name),
    ...(student?.resumeAnalysis?.skills || [])
  ], 80);
  const titles = uniqueClean([
    ...(student?.experience || []).map((item: any) => item?.title),
    ...(extracted?.experience || []).map((item: any) => item?.title),
    ...(student?.jobPreferences?.preferredRoles || [])
  ], 30);
  const education = Array.isArray(student?.education) && student.education.length
    ? student.education
    : (Array.isArray(extracted?.education) ? extracted.education : []);
  const locations = uniqueClean([
    ...(student?.jobPreferences?.preferredLocations || []),
    student?.resumeAnalysis?.extractedDetails?.contactInfo?.address,
    student?.collegeName,
    ...(student?.experience || []).map((item: any) => item?.location)
  ], 30);
  const salaryExpectation = normalizeSalaryExpectation(student?.jobPreferences || student);
  const yearsExperience = Number(student?.yearsExperience ?? student?.years_experience);
  const calculatedYearsExperience = calculateYearsExperience(student?.experience || extracted?.experience || []);

  return {
    titles,
    yearsExperience: Number.isFinite(yearsExperience) && yearsExperience > 0
      ? yearsExperience
      : calculatedYearsExperience,
    education,
    locations,
    salaryExpectation,
    structuredResumeUpdatedAt: new Date(),
    profileFeatureVector: createFeatureVector([
      student?.resumeText || student?.resumeAnalysis?.resumeText || '',
      skills.join(' '),
      titles.join(' '),
      education.map((item: any) => `${item?.degree || ''} ${item?.field || ''} ${item?.institution || ''}`).join(' '),
      locations.join(' ')
    ].join(' '))
  };
};
