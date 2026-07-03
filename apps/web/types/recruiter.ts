export interface Company {
  _id: string;
  email: string;
  companyInfo: {
    name: string;
    industry: string;
    logo?: string;
    website?: string;
    description?: string;
    size?: string;
    foundedYear?: number;
    headquarters?: {
      city: string;
      state: string;
      country: string;
    };
  };
  recruiterProfile?: {
    firstName: string;
    lastName: string;
    designation: string;
    department?: string;
    linkedinUrl?: string;
    profilePicture?: string;
  };
  phone?: string;
  whatsappNumber?: string;
  recruiterEmail?: string; // HR person's email (from User model)
  verificationDocuments?: string[];
  submittedDocuments?: string[];
  isVerified: boolean;
  approvalStatus: string;
}

export interface Job {
  _id: string;
  title: string;
  location: string;
  department: string;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  postedAt: string;
}

export interface JobDraft {
  id: string;
  title: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  savedAt: string;
}

export interface Application {
  _id: string;
  studentId: {
    _id: string;
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  jobId: {
    _id: string;
    title: string;
  };
  status: string;
  appliedAt: string;
}

export interface Invitation {
  _id: string;
  companyId: string;
  collegeId: {
    _id: string;
    collegeInfo: {
      name: string;
      establishedYear?: number;
      location?: {
        state: string;
        city: string;
      };
    };
  };
  jobRoles: string[];
  status: string;
  createdAt: string;
}
