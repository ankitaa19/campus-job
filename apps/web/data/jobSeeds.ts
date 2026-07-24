export interface JobSeed {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  locations: Array<{ city: string; state: string; country: string }>;
  workMode: string;
  jobType: string;
  salary: { min: number; max: number; currency: string };
  postedAt: string;
  experienceLevel: string;
  description: string;
  skills?: string[];
  totalPositions?: number;
  benefits?: string[];
  companyAbout?: string;
  educationQualification?: string;
  noticePeriod?: string;
  compensationType?: string;
  dailyTimings?: string;
  preferredWorkingDays?: string[];
  contractDuration?: string;
  paymentStructure?: string;
  paymentAmount?: string;
  extensionPossibility?: string;
  hoursPerSession?: string;
  gigType?: string;
  commitmentLevel?: string;
  internshipDetails?: {
    duration?: string;
    compensation?: string;
    stipend?: string;
    conversionPossibility?: string;
    certificateProvided?: string;
  };
  fullTimeDetails?: {
    noticePeriod?: string;
    compensationType?: string;
    payRange?: { min?: string; max?: string };
    preferredMode?: string;
  };
  partTimeDetails?: {
    dailyTimings?: string;
    preferredWorkingDays?: string[] | string;
    compensationType?: string;
    hourlyRate?: string;
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
  };
}

const now = Date.now();

export const JOB_SEEDS: JobSeed[] = [
  {
    _id: '1', title: 'Software Developer', companyName: 'TechFront',
    locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India' }], workMode: 'Hybrid', jobType: 'internship',
    salary: { min: 15000, max: 15000, currency: 'INR' }, postedAt: new Date(now - 10 * 60 * 1000).toISOString(),
    experienceLevel: 'Fresher', educationQualification: 'Graduate', totalPositions: 2,
    description: 'Build and improve production web experiences with a supportive engineering team.',
    companyAbout: 'TechFront builds practical technology products and gives early-career talent hands-on exposure to modern software development.',
    skills: ['React', 'Node.js', 'AWS', 'TypeScript'], benefits: ['Flexible Working Hours', 'Mentorship', 'Professional Development Budget'],
    internshipDetails: { duration: '3 months', compensation: 'Paid', stipend: '₹15,000/month', conversionPossibility: 'Yes - performance based', certificateProvided: 'Internship Certificate' }
  },
  {
    _id: '2', title: 'Software Developer', companyName: 'Wiseck',
    locations: [{ city: 'New Delhi', state: 'Delhi', country: 'India' }], workMode: 'Remote', jobType: 'full-time',
    salary: { min: 40000, max: 42000, currency: 'INR' }, postedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '2 years', educationQualification: 'Graduate', totalPositions: 2,
    description: 'Develop reliable software solutions with a cross-functional product and engineering team.',
    companyAbout: 'Wiseck is a product-led technology company focused on dependable, scalable solutions for growing businesses.',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], benefits: ['Health Insurance', 'Flexible Working Hours', 'Stock Options', 'Professional Development Budget'],
    fullTimeDetails: { noticePeriod: 'Immediate Joiner', compensationType: 'Annual salary', payRange: { min: '₹4.8 LPA', max: '₹5.0 LPA' }, preferredMode: 'Remote' }
  },
  {
    _id: '3', title: 'UI/UX Designer', companyName: 'Mind Inc.',
    locations: [{ city: 'Mumbai', state: 'Maharashtra', country: 'India' }], workMode: 'Remote', jobType: 'freelance',
    salary: { min: 25000, max: 0, currency: 'INR' }, postedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '0-2 years', educationQualification: 'Graduate', totalPositions: 1,
    description: 'Design polished product journeys and reusable interface patterns for focused digital projects.',
    companyAbout: 'Mind Inc. is a creative technology studio that collaborates with independent specialists on focused digital projects.',
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    contractDetails: { duration: 'Short term · 6 weeks', paymentStructure: 'Project completion', paymentAmount: '₹25,000/project', extensionPossibility: 'Yes - based on project needs' }
  },
  {
    _id: '4', title: 'Backend Developer', companyName: 'Demo Company',
    locations: [{ city: 'Noida', state: 'Uttar Pradesh', country: 'India' }], workMode: 'On-site', jobType: 'full-time',
    salary: { min: 40000, max: 42000, currency: 'INR' }, postedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '0-2 years', educationQualification: 'Graduate', totalPositions: 1,
    description: 'Build backend services, learn from experienced mentors, and ship customer-facing functionality.',
    companyAbout: 'Demo Company is a fast-growing product team where early-career engineers build customer-facing features with support from experienced mentors.',
    skills: ['Java', 'Spring Boot', 'SQL', 'AWS'], benefits: ['Health Insurance', 'Flexible Working Hours', 'Professional Development Budget'],
    fullTimeDetails: { noticePeriod: 'Immediate Joiner', compensationType: 'Annual salary', payRange: { min: '₹4.8 LPA', max: '₹5.0 LPA' }, preferredMode: 'On-site' }
  },
  {
    _id: '5', title: 'Customer Support Executive', companyName: 'Fintech',
    locations: [{ city: 'Noida', state: 'Uttar Pradesh', country: 'India' }], workMode: 'Remote', jobType: 'part-time',
    salary: { min: 8000, max: 15000, currency: 'INR' }, postedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '0-2 years', educationQualification: 'Graduate', totalPositions: 2,
    description: 'Support customers through clear, helpful conversations while working a flexible daily schedule.',
    companyAbout: 'Fintech builds secure digital financial experiences and offers flexible schedules for specialists who prefer focused part-time work.',
    skills: ['Communication', 'CRM', 'Problem Solving'],
    partTimeDetails: { dailyTimings: 'Morning shift (9 AM - 12 PM)', preferredWorkingDays: ['Monday', 'Wednesday', 'Friday'], compensationType: 'Monthly salary', hourlyRate: '₹500/hour' }
  },
  {
    _id: '6', title: 'Delivery Partner', companyName: 'Miller Group',
    locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India' }], workMode: 'Field Work', jobType: 'contract',
    salary: { min: 600, max: 0, currency: 'INR' }, postedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: 'Fresher', educationQualification: '12th Pass', totalPositions: 5,
    description: 'Complete flexible delivery and logistics assignments on a schedule that works for you.',
    companyAbout: 'Miller Group connects dependable talent with flexible, on-demand assignments across delivery and logistics operations.',
    skills: ['Two Wheeler', 'Navigation', 'Customer Service'],
    gigDetails: { workSchedule: 'Morning shifts (9 AM - 12 PM)', preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'], hoursPerSession: '2 hours/session', paymentStructure: 'Hourly rate', rateAmount: '₹600/hour', gigType: 'Delivery & Logistics', commitmentLevel: 'One-time gig' }
  }
];

export const getJobSeedById = (id: string) => JOB_SEEDS.find((job) => job._id === id) || null;
