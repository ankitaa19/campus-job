import { Types } from 'mongoose';

export type ProviderName = 'adzuna' | 'lever' | 'greenhouse' | 'ashby' | 'smartrecruiters' | 'workday' | 'career_page' | 'selenium_page' | 'himalayas' | 'weworkremotely';
export type ProviderSyncTier = 'high_priority' | 'standard' | 'daily';

export interface ProviderCompanyConfig {
  _id?: Types.ObjectId;
  provider: ProviderName;
  companySlug: string;
  companyName: string;
  sourceType: 'company_careers' | 'job_board';
  recruiterId?: Types.ObjectId;
  apiRegion: 'global' | 'eu';
  pageUrl?: string;
  automationPermission?: 'not_granted' | 'written_permission' | 'public_terms_allow';
  jobLinkSelector?: string;
  maxJobsPerSync?: number;
}

export interface JobDto {
  source: 'company_careers' | 'job_board';
  sourceProvider: ProviderName;
  sourceCompanySlug: string;
  sourceExternalId: string;
  sourceUrl?: string;
  attributionName?: string;
  attributionUrl?: string;
  title: string;
  companyName: string;
  description: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
  department: string;
  locations: Array<{ city: string; state: string; country: string; isRemote: boolean; hybrid: boolean }>;
  workMode: 'remote' | 'onsite' | 'hybrid';
  requirements: Array<{ skill: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; mandatory: boolean; category: 'technical' | 'soft' | 'language' | 'certification' }>;
  requiredSkills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  minExperience: number;
  maxExperience?: number;
  educationRequirements: Array<{ degree: string; field?: string; minimumGrade?: number; mandatory: boolean }>;
  salary: { min: number; max: number; currency: string; negotiable: boolean };
  benefits: string[];
  applicationDeadline: Date;
  totalPositions: number;
  interviewProcess: { rounds: string[]; duration: string; mode: 'online' | 'offline' | 'hybrid'; additionalInfo?: string };
  postedAt: Date;
  matchingKeywords: string[];
  aiGeneratedDescription?: string;
}

export interface JobProvider<TRaw = unknown> {
  readonly name: ProviderName;
  fetchJobs(company: ProviderCompanyConfig): Promise<TRaw[]>;
  mapJob(rawJob: TRaw, company: ProviderCompanyConfig): JobDto;
  /** True only when the response is a complete authoritative snapshot. */
  isAuthoritativeSnapshot?(company: ProviderCompanyConfig, rawJobs: TRaw[]): boolean;
}

export interface SyncResult {
  provider: ProviderName;
  companySlug: string;
  fetched: number;
  created: number;
  updated: number;
  closed: number;
  errors: string[];
}
