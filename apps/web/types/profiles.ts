// TypeScript interfaces for profile data across the application

export interface BaseProfile {
  _id: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ===== STUDENT PROFILE TYPES =====
export interface StudentEducation {
  degree: string;
  field: string;
  institution: string;
  college?: string; // For compatibility
  startDate: string;
  endDate?: string;
  year?: number; // For compatibility
  gpa?: number;
  cgpa?: number; // For compatibility
  percentage?: number; // For compatibility
  isCompleted: boolean;
}

export interface StudentExperience {
  title: string;
  position?: string; // For compatibility
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentJob: boolean;
}

export interface StudentSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'technical' | 'soft' | 'language';
}

export interface StudentProject {
  name: string;
  title?: string; // For compatibility
  description?: string;
  technologies?: string[];
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface StudentJobPreferences {
  jobTypes: string[];
  preferredLocations: string[];
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  workMode: 'remote' | 'onsite' | 'hybrid' | 'any';
  availableFrom?: string;
}

export interface StudentResumeAnalysis {
  skills: string[];
  category: string;
  experienceLevel: string;
  summary: string;
  uploadDate: string;
  fileName: string;
  originalFileName?: string;
  resumeText?: string;
  extractedDetails?: {
    personalInfo?: {
      name?: string;
      summary?: string;
    };
    experience?: StudentExperience[];
    education?: StudentEducation[];
    contactInfo?: {
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      address?: string;
    };
    projects?: StudentProject[];
    certifications?: Array<{
      name?: string;
      year?: number;
      organization?: string;
    }>;
    languages?: Array<{
      name?: string;
      proficiency?: string;
    }>;
  };
  analysisQuality?: string;
  confidence?: number;
}

export interface StudentProfile extends BaseProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  profilePicture?: string;
  
  // Social URLs
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // College Information
  collegeId?: {
    _id: string;
    name: string;
    address?: {
      city: string;
      state: string;
      country: string;
    };
  } | string;
  studentId?: string;
  enrollmentYear?: number;
  graduationYear?: number;
  currentSemester?: number;
  
  // Profile Data
  education: StudentEducation[];
  experience: StudentExperience[];
  skills: StudentSkill[] | string[]; // Support both formats
  projects?: StudentProject[];
  achievements?: string[];
  bio?: string;
  
  // Resume
  resumeFile?: string;
  resumeText?: string;
  resumeScore?: number;
  resumeAnalysis?: StudentResumeAnalysis;
  resume?: {
    filename: string;
    uploadDate: string;
  };
  
  // Job Preferences
  jobPreferences?: StudentJobPreferences;
  
  // Status
  profileCompleteness?: number;
  isPlacementReady?: boolean;
  isVerified?: boolean;
  
  // Compatibility with old structure
  profile?: {
    skills: string[];
    experience: StudentExperience[];
    education: StudentEducation[];
    projects: StudentProject[];
    achievements: string[];
    bio?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  };
}

// ===== COLLEGE PROFILE TYPES =====
export interface CollegeAddress {
  street?: string;
  address?: string; // For compatibility
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string; // For compatibility
  country: string;
}

export interface CollegeContact {
  name: string;
  designation: string;
  email: string;
  phone: string;
}

export interface CollegePlacementStats {
  year: number;
  totalStudents: number;
  placedStudents: number;
  averagePackage: number;
  highestPackage: number;
  topRecruiters: string[];
  placementRate?: number;
}

export interface CollegeProgram {
  name: string;
  description?: string;
  duration?: string;
  seats?: number;
  eligibility?: string;
}

export interface CollegeStats {
  totalStudents: number;
  placedStudents: number;
  recruitingCompanies: number;
  averagePackage: number;
  totalPrograms?: number;
  placementRate?: number;
  rating?: number;
  highestPackage?: number;
  activeJobs?: number;
  upcomingEvents?: number;
}

export interface CollegeProfile extends BaseProfile {
  userId: string;
  name: string;
  shortName?: string;
  domainCode?: string;
  email: string;
  website?: string;
  logo?: string;
  description?: string;
  
  // College Information (new structure)
  address?: CollegeAddress;
  primaryContact?: CollegeContact;
  placementContact?: CollegeContact;
  establishedYear?: number;
  affiliation?: string;
  accreditation?: string[];
  departments?: string[];
  
  // College Information (legacy structure for compatibility)
  collegeInfo?: {
    name: string;
    type: string;
    establishment: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };
    website?: string;
    logo?: string;
    description?: string;
    nirf_ranking?: number;
    accreditation?: string;
    affiliation?: string;
    courses?: string[];
    departments?: string[];
    facilities?: string[];
    student_strength?: number;
    faculty_strength?: number;
    contact?: {
      phone?: string;
      email?: string;
    };
  };
  
  // Contact Person (legacy structure)
  contactPerson?: {
    name: string;
    designation: string;
    email: string;
    phone?: string;
  };
  
  // Academic Information
  offeredPrograms?: string[];
  courses?: string[];
  programs?: CollegeProgram[];
  facilities?: string[];
  naacRating?: string; // NAAC accreditation rating (A++, A+, A, B++, B+, B, C)
  nirfRanking?: {
    category?: string;
    rank?: number;
    year?: number;
  };
  
  // Placement Information
  placementStats?: CollegePlacementStats[];
  isPlacementActive?: boolean;
  placementCriteria?: {
    minimumCGPA: number;
    allowedBranches: string[];
    noOfBacklogs: number;
  };
  
  // Statistics
  stats?: CollegeStats;
  
  // Verification & Status
  isVerified?: boolean;
  verificationStatus?: string;
  approvalStatus?: string;
  verificationDocuments?: string[];
  
  // Settings
  allowDirectApplications?: boolean;
  whatsappGroupId?: string;
}

// ===== RECRUITER PROFILE TYPES =====
export interface CompanyInfo {
  name: string;
  industry: string;
  website?: string;
  logo?: string;
  description?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  foundedYear?: number;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
}

export interface RecruiterPersonalInfo {
  firstName: string;
  lastName: string;
  designation: string;
  department?: string;
  linkedinUrl?: string;
  profilePicture?: string;
}

export interface HiringInfo {
  preferredColleges: string[];
  preferredCourses: string[];
  hiringSeasons: string[];
  averageHires: number;
  workLocations: string[];
  remoteWork: boolean;
  internshipOpportunities: boolean;
}

export interface RecruiterStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  scheduledInterviews: number;
  selectedCandidates: number;
  avgApplicationsPerJob: number;
  companyProfileCompleteness: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

export interface RecruiterProfile extends BaseProfile {
  userId: string;
  email: string;
  
  // Company Information
  companyInfo: CompanyInfo;
  
  // Recruiter Profile
  recruiterProfile: RecruiterPersonalInfo;
  
  // Hiring Information
  hiringInfo: HiringInfo;
  
  // Verification & Approval
  isVerified?: boolean;
  verificationDocuments?: string[];
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  resubmissionNotes?: string;
  submittedDocuments?: string[];
  
  // Jobs & Applications
  jobsPosted?: string[];
  
  // College Relationships
  approvedColleges?: string[];
  pendingColleges?: string[];
  
  // Communication
  whatsappNumber?: string;
  preferredContactMethod?: 'email' | 'phone' | 'whatsapp';
  
  // Statistics
  stats?: RecruiterStats;
  
  // Settings
  autoApproveApplications?: boolean;
  allowWhatsappContact?: boolean;
  lastActiveDate?: string;
}

// ===== APPLICATION TYPES =====
export interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company?: string;
    location?: string;
    type?: string;
  } | string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    collegeId?: string;
  } | string;
  recruiterId?: string;
  resumeFile?: string;
  coverLetter?: string;
  currentStatus: 'applied' | 'under_review' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected';
  appliedAt: string;
  lastUpdated: string;
  matchScore?: number;
  notes?: string;
  
  // Legacy fields for compatibility
  jobTitle?: string;
  studentName?: string;
  studentEmail?: string;
  resumeUrl?: string;
  status?: string;
  appliedDate?: string;
}

// ===== API RESPONSE TYPES =====
export interface ProfileApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface StudentProfileResponse extends ProfileApiResponse<StudentProfile> {}
export interface CollegeProfileResponse extends ProfileApiResponse<CollegeProfile> {}
export interface RecruiterProfileResponse extends ProfileApiResponse<RecruiterProfile> {}

// ===== UTILITY TYPES =====
export type ProfileType = 'student' | 'college' | 'recruiter';

export interface ProfileContext {
  userType: ProfileType;
  userId: string;
  isOwnProfile: boolean;
  canEdit: boolean;
  canContact: boolean;
}

export interface ProfileViewProps {
  profileId: string;
  context: ProfileContext;
}
