// Shared company data for CollegeConnectionManager and CompanyDetailsView
// Updated to use dynamic dummy data generation instead of hardcoded values

export interface Company {
  _id: string;
  name: string;
  industry: string;
  location: string;
  partnershipType: 'new' | 'standard' | 'premium';
  lastContact: string;
  description?: string;
  established?: string;
  employees?: string;
  website?: string;
  metrics: {
    placements?: number;
    avgPackage: string;
    activeJobs: number;
    pastPlacements?: number;
  };
  jobs: CompanyJob[];
  hrContact: {
    name: string;
    email: string;
  };
}

export interface CompanyJob {
  _id: string;
  title: string;
  education: string;
  experience: string;
  openings: number;
  type?: string;
  location?: string;
  schedule?: string;
  salaryRange?: string;
  eligibility?: string[];
  skillsRequired?: string[];
  description?: string;
  deadline?: string;
  instant?: boolean;
  isPlaceholder?: boolean;
}

// Generate dynamic dummy data
const generateRandomCompany = (id: number): Company => {
  const companyNames = [
    'TechCorp Solutions', 'InnovateSoft', 'DataVision Labs', 'CloudSync Systems', 
    'NextGen Technologies', 'ByteWorks Inc', 'CodeCraft Studios', 'DigitalFlow Co',
    'SmartEdge Solutions', 'FutureTech Innovations', 'CyberLogic Systems', 'WebStream Labs'
  ];
  
  const industries = ['IT Services', 'Software Development', 'Cloud Computing', 'E-commerce', 'FinTech', 'EdTech'];
  const locations = ['Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai', 'Delhi NCR'];
  const partnershipTypes: Array<'new' | 'standard' | 'premium'> = ['new', 'standard', 'premium'];
  
  const jobTitles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Analyst', 'Product Manager', 'UX/UI Designer', 'DevOps Engineer',
    'Quality Assurance Engineer', 'Business Analyst', 'Technical Writer', 'Sales Executive'
  ];
  
  const skillSets = [
    ['React', 'Node.js', 'MongoDB'],
    ['Java', 'Spring Boot', 'MySQL'],
    ['Python', 'Django', 'PostgreSQL'],
    ['Angular', 'TypeScript', 'Express.js'],
    ['Vue.js', 'Laravel', 'Redis'],
    ['C#', '.NET Core', 'SQL Server'],
    ['PHP', 'Symfony', 'MariaDB'],
    ['Go', 'Docker', 'Kubernetes']
  ];

  const companyName = companyNames[id % companyNames.length];
  const industry = industries[id % industries.length];
  const location = locations[id % locations.length];
  const partnershipType = partnershipTypes[id % partnershipTypes.length];
  
  // Generate 1-4 jobs per company
  const numJobs = Math.floor(Math.random() * 4) + 1;
  const jobs: CompanyJob[] = [];
  
  for (let j = 0; j < numJobs; j++) {
    const titleIndex = (id + j) % jobTitles.length;
    const skillIndex = (id + j) % skillSets.length;
    const salaryBase = 300000 + (Math.random() * 500000); // 3-8 LPA range
    const salaryMin = Math.round(salaryBase / 100000) / 10;
    const salaryMax = Math.round((salaryBase + 200000) / 100000) / 10;
    
    jobs.push({
      _id: `${id}-${j}`,
      title: jobTitles[titleIndex],
      type: Math.random() > 0.2 ? 'Full-time' : 'Internship',
      location: Math.random() > 0.3 ? 'On-site' : Math.random() > 0.5 ? 'Hybrid' : 'Remote',
      schedule: 'Full time',
      salaryRange: `₹${salaryMin}-${salaryMax} LPA`,
      eligibility: ['B.Tech/BE - Any', 'CGPA 6.5+'],
      skillsRequired: skillSets[skillIndex],
      experience: 'Fresher',
      education: 'B.Tech/BE - Any',
      description: `Join our dynamic team as a ${jobTitles[titleIndex]}. Work on innovative projects using cutting-edge technologies and contribute to our company's growth in the ${industry.toLowerCase()} sector.`,
      deadline: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 2) + 11).padStart(2, '0')}-2024`,
      openings: Math.floor(Math.random() * 8) + 2,
      instant: Math.random() > 0.7
    });
  }

  const avgPackageValue = Math.round((300000 + Math.random() * 400000) / 100000) / 10;
  const pastPlacementsValue = Math.floor(Math.random() * 200) + 20;

  return {
    _id: id.toString(),
    name: companyName,
    industry,
    location: `${location}, India`,
    partnershipType,
    lastContact: `${Math.floor(Math.random() * 30) + 1} days ago`,
    description: `${companyName} is a leading company in ${industry.toLowerCase()}. We focus on delivering innovative solutions and creating exceptional value for our clients through cutting-edge technology and expertise.`,
    established: `${1995 + Math.floor(Math.random() * 25)}`,
    employees: Math.random() > 0.5 ? '500-1000' : '100-500',
    website: `www.${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
    metrics: {
      placements: pastPlacementsValue,
      avgPackage: `₹${avgPackageValue}L`,
      activeJobs: jobs.length,
      pastPlacements: pastPlacementsValue
    },
    jobs,
    hrContact: {
      name: `${Math.random() > 0.5 ? 'Ms.' : 'Mr.'} ${['Priya', 'Arjun', 'Kavya', 'Rohit', 'Sneha', 'Amit'][Math.floor(Math.random() * 6)]} ${['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Gupta'][Math.floor(Math.random() * 6)]}`,
      email: `hr@${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`
    }
  };
};

// Cache for generated companies to ensure consistency
let cachedCompanies: Company[] | null = null;

export const getCompanyData = (): Company[] => {
  // Return cached companies if available to ensure consistency
  if (cachedCompanies) {
    return cachedCompanies;
  }
  
  // Generate 10 companies with varied data
  const numCompanies = 10;
  const companies: Company[] = [];
  
  for (let i = 1; i <= numCompanies; i++) {
    companies.push(generateRandomCompany(i));
  }
  
  // Cache the generated companies
  cachedCompanies = companies;
  return companies;
};

// Function to refresh the company data (useful for testing)
export const refreshCompanyData = (): Company[] => {
  cachedCompanies = null;
  return getCompanyData();
};

// Helper function to get a specific company by ID
export const getCompanyById = (id: string): Company | undefined => {
  return getCompanyData().find(company => company._id === id);
};

// Helper function to get sample company (for testing/demo purposes)
export const getSampleCompany = (): Company => {
  return getCompanyData()[0] || generateRandomCompany(1);
};
