export type StudentJobType =
  | 'Internship'
  | 'Full-Time'
  | 'Freelance'
  | 'Gig/Flexible'
  | 'Part-Time';

export interface StudentJobBenefit {
  id?: string;
  text: string;
  enabled?: boolean;
}

export interface StudentJob {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  date: string;
  type: string;
  jobType: StudentJobType;
  workMode: string;
  match?: string;
  via?: string;
  postedDays?: string;
  source?: string;
  skills: string[];
  allSkills?: string[];
  keySkills?: string[];
  description: string;
  experience?: string;
  education?: string;
  educationQualification?: string;
  numberOfOpenings?: number;
  compensationType?: string;
  workExperience?: { min?: string; max?: string };
  benefits?: Array<string | StudentJobBenefit>;
  internshipDetails?: {
    duration?: string;
    compensation?: string;
    stipend?: string;
    conversionPossibility?: string;
    certificateProvided?: string;
  };
  fullTimeDetails?: {
    preferredMode?: string;
    noticePeriod?: string;
    compensationType?: string;
    minSalary?: string;
    maxSalary?: string;
    payRange?: { min?: string; max?: string };
    deadline?: string;
  };
  contractDetails?: {
    duration?: string;
    paymentStructure?: string;
    paymentAmount?: string;
    extensionPossibility?: string;
  };
  gigDetails?: {
    workSchedule?: string;
    preferredDays?: string[];
    hoursPerSession?: string;
    paymentStructure?: string;
    rateAmount?: string;
    gigType?: string;
    commitmentLevel?: string;
    preferredWorkingDays?: Record<string, boolean>;
    specialRequirements?: string;
  };
  partTimeDetails?: {
    dailyTimings?: string;
    preferredWorkingDays?: string | string[] | Record<string, boolean>;
    compensationType?: string;
    hourlyRate?: string;
    payRange?: { min?: string; max?: string };
  };
}

export interface StudentApplication extends StudentJob {
  appliedDate: string;
  status: string;
  statusHistory: Array<{
    status: string;
    date: string;
    description: string;
  }>;
}
