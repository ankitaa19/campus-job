import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  MapPin,
  Users,
  Eye,
  MoreVertical,
  Filter,
  ChevronDown,
  Briefcase,
  XCircle,
} from "lucide-react";
import ViewJobPage from './ViewJobPage';
import CloseJobModal from './CloseJobModal';
import ExtendDeadlineModal from './ExtendDeadlineModal';
import EditDraftModal from './EditDraftModal';

/** ───────────────────────── Types ───────────────────────── **/
type JobStatus = "Internship" | "Active" | "Application on hold";

interface Job {
  id: string;
  title: string;
  city: string;
  state: string;
  functionArea: string; // e.g., "Engineering"
  ctc: string; // e.g., "₹ 8–10 LPA"
  postedAgo: string; // e.g., "2 days ago"
  statusBadges: JobStatus[];
  status?: 'active' | 'closed' | 'draft'; // Job status for tabs
  avgMatch: string; // "82%"
  applicants: number; // 45
  collegesFrom: number; // 28
  publicFrom: number; // 17
  postedToColleges: number; // 8
  postedToPublic: number; // 5
  skills: string[]; // ["React","Node.js","SQL"]
}

/** ─────────────────────── Dummy data ─────────────────────── **/
const makeJobs = (): Job[] => [
  // 1. Internship - Active
  {
    id: "1",
    title: "React Native Development Intern",
    city: "Mumbai",
    state: "Maharashtra",
    functionArea: "Engineering",
    ctc: "₹ 5,000-10,000/month",
    postedAgo: "2 days ago",
    statusBadges: ["Internship", "Active"],
    status: "active",
    avgMatch: "85%",
    applicants: 28,
    collegesFrom: 18,
    publicFrom: 10,
    postedToColleges: 5,
    postedToPublic: 1,
    skills: ["React Native", "JavaScript", "Mobile Development"],
  },
  // 2. Full-time - Active
  {
    id: "2",
    title: "Senior Software Engineer",
    city: "Bangalore",
    state: "Karnataka",
    functionArea: "Engineering",
    ctc: "₹ 15–25 LPA",
    postedAgo: "5 days ago",
    statusBadges: ["Active"],
    status: "active",
    avgMatch: "92%",
    applicants: 67,
    collegesFrom: 42,
    publicFrom: 25,
    postedToColleges: 12,
    postedToPublic: 3,
    skills: ["Java", "Spring Boot", "Microservices"],
  },
  // 3. Freelance - Active
  {
    id: "3",
    title: "UI/UX Designer - Freelance",
    city: "Remote",
    state: "India",
    functionArea: "Design",
    ctc: "₹ 50,000-80,000/project",
    postedAgo: "1 week ago",
    statusBadges: ["Active"],
    status: "active",
    avgMatch: "78%",
    applicants: 35,
    collegesFrom: 15,
    publicFrom: 20,
    postedToColleges: 3,
    postedToPublic: 2,
    skills: ["Figma", "Adobe XD", "Prototyping"],
  },
  // 4. Part-time - Active
  {
    id: "4",
    title: "Content Writer - Part Time",
    city: "Delhi",
    state: "Delhi",
    functionArea: "Marketing",
    ctc: "₹ 15,000-25,000/month",
    postedAgo: "3 days ago",
    statusBadges: ["Active"],
    status: "active",
    avgMatch: "70%",
    applicants: 22,
    collegesFrom: 12,
    publicFrom: 10,
    postedToColleges: 4,
    postedToPublic: 2,
    skills: ["Content Writing", "SEO", "Blog Writing"],
  },
  // 5. Contractor - Active
  {
    id: "5",
    title: "DevOps Engineer - Contract",
    city: "Gurgaon",
    state: "Haryana",
    functionArea: "Engineering",
    ctc: "₹ 1,20,000-1,50,000/month",
    postedAgo: "1 week ago",
    statusBadges: ["Active"],
    status: "active",
    avgMatch: "88%",
    applicants: 41,
    collegesFrom: 25,
    publicFrom: 16,
    postedToColleges: 7,
    postedToPublic: 3,
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
  },
  // 6. Internship - Closed
  {
    id: "6",
    title: "Digital Marketing Intern",
    city: "Pune",
    state: "Maharashtra",
    functionArea: "Marketing",
    ctc: "₹ 8,000-12,000/month",
    postedAgo: "2 months ago",
    statusBadges: ["Internship"],
    status: "closed",
    avgMatch: "82%",
    applicants: 45,
    collegesFrom: 28,
    publicFrom: 17,
    postedToColleges: 6,
    postedToPublic: 2,
    skills: ["Social Media", "Google Ads", "Analytics"],
  },
  // 7. Full-time - Closed
  {
    id: "7",
    title: "Product Manager",
    city: "Chennai",
    state: "Tamil Nadu",
    functionArea: "Product",
    ctc: "₹ 18–28 LPA",
    postedAgo: "3 months ago",
    statusBadges: ["Application on hold"],
    status: "closed",
    avgMatch: "76%",
    applicants: 89,
    collegesFrom: 55,
    publicFrom: 34,
    postedToColleges: 10,
    postedToPublic: 5,
    skills: ["Product Strategy", "Agile", "User Research"],
  },
  // 8. Internship - Draft
  {
    id: "8",
    title: "Data Analytics Intern",
    city: "Hyderabad",
    state: "Telangana",
    functionArea: "Data Science",
    ctc: "₹ 10,000-15,000/month",
    postedAgo: "Saved recently",
    statusBadges: [],
    status: "draft",
    avgMatch: "-",
    applicants: 0,
    collegesFrom: 0,
    publicFrom: 0,
    postedToColleges: 0,
    postedToPublic: 0,
    skills: ["Python", "Excel", "Power BI"],
  },
  // 9. Full-time - Draft
  {
    id: "9",
    title: "Backend Developer",
    city: "Noida",
    state: "Uttar Pradesh",
    functionArea: "Engineering",
    ctc: "₹ 10–15 LPA",
    postedAgo: "Saved recently",
    statusBadges: [],
    status: "draft",
    avgMatch: "-",
    applicants: 0,
    collegesFrom: 0,
    publicFrom: 0,
    postedToColleges: 0,
    postedToPublic: 0,
    skills: ["Node.js", "MongoDB", "REST API"],
  },
  // 10. Freelance - Draft
  {
    id: "10",
    title: "Video Editor - Freelance",
    city: "Remote",
    state: "India",
    functionArea: "Creative",
    ctc: "₹ 25,000-40,000/project",
    postedAgo: "Saved recently",
    statusBadges: [],
    status: "draft",
    avgMatch: "-",
    applicants: 0,
    collegesFrom: 0,
    publicFrom: 0,
    postedToColleges: 0,
    postedToPublic: 0,
    skills: ["Adobe Premiere", "After Effects", "DaVinci Resolve"],
  },
];

/** ───────────────────── UI helpers (chips) ───────────────────── **/
const Chip = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-5 ${className}`}>
    {children}
  </span>
);

const Dot = () => <span className="mx-2 inline-block h-1 w-1 rounded-full bg-gray-300" />;

/** ───────────────────── Main Component ───────────────────── **/
const ManageJobsSection: React.FC<{
  activeJobs?: any[];
  draftJobs?: any[];
  onCreateJob?: () => void;
  onViewJob?: (jobId: string, jobTitle: string) => void;
  onPostSimilarJob?: (jobData: any) => void;
}> = ({ activeJobs = [], draftJobs = [], onCreateJob, onViewJob, onPostSimilarJob }) => {
  const [activeTab, setActiveTab] = useState<"active" | "closed" | "draft">("active");
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string>("All Types");
  const [isJobTypeDropdownOpen, setIsJobTypeDropdownOpen] = useState(false);
  
  // Refs for click-outside detection
  const jobTypeDropdownRef = useRef<HTMLDivElement>(null);
  const jobActionsDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // View states
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedJobForView, setSelectedJobForView] = useState<any>(null);
  
  // Modal states
  const [isCloseJobModalOpen, setIsCloseJobModalOpen] = useState(false);
  const [isExtendDeadlineModalOpen, setIsExtendDeadlineModalOpen] = useState(false);
  const [isEditDraftModalOpen, setIsEditDraftModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close job type dropdown
      if (jobTypeDropdownRef.current && !jobTypeDropdownRef.current.contains(event.target as Node)) {
        setIsJobTypeDropdownOpen(false);
      }
      
      // Close job actions dropdown
      const clickedOutsideAllDropdowns = Object.values(jobActionsDropdownRefs.current).every(
        ref => !ref || !ref.contains(event.target as Node)
      );
      
      if (clickedOutsideAllDropdowns) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Job type options
  const jobTypeOptions = [
    "All Types",
    "Internship",
    "Full-time",
    "Part-time",
    "Freelance",
    "Contractor"
  ];

  // Use passed props or fallback to mock data
  const jobs = useMemo(() => {
    if (activeJobs.length > 0 || draftJobs.length > 0) {
      // Convert real data to the expected format
      const convertedActiveJobs = activeJobs.map(job => ({
        id: job._id,
        _id: job._id,
        title: job.title,
        functionArea: job.department || 'General',
        city: job.location?.split(',')[0] || 'Remote',
        state: job.location?.split(',')[1]?.trim() || '',
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        postedAt: job.postedAt,
        postedAgo: 'Just now',
        isActive: job.isActive,
        status: job.isActive ? 'active' : 'closed',
        statusBadges: [],
        avgMatch: '85%',
        ctc: '₹8-12 LPA',
        postedToColleges: 0,
        applicants: 0,
        collegesFrom: 0,
        publicFrom: 0,
        skills: []
      }));
      
      const convertedDraftJobs = draftJobs.map(draft => ({
        id: draft.id,
        _id: draft.id,
        title: draft.title,
        functionArea: 'General',
        city: draft.location?.split(',')[0] || 'Remote',
        state: draft.location?.split(',')[1]?.trim() || '',
        jobType: draft.jobType,
        experienceLevel: draft.experienceLevel,
        postedAt: draft.savedAt,
        postedAgo: 'Saved recently',
        isActive: false,
        status: 'draft',
        statusBadges: [],
        avgMatch: '-',
        ctc: '-',
        postedToColleges: 0,
        applicants: 0,
        collegesFrom: 0,
        publicFrom: 0,
        skills: []
      }));
      
      return [...convertedActiveJobs, ...convertedDraftJobs];
    }
    return makeJobs(); // Fallback to mock data
  }, [activeJobs, draftJobs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    
    // First filter by active tab
    let tabFiltered = jobs.filter(job => {
      if (activeTab === 'active') return job.status === 'active';
      if (activeTab === 'closed') return job.status === 'closed';
      if (activeTab === 'draft') return job.status === 'draft';
      return true;
    });
    
    // Filter by job type
    let typeFiltered = tabFiltered;
    if (selectedJobType !== 'All Types') {
      typeFiltered = tabFiltered.filter((j) => {
        const titleLower = j.title.toLowerCase();
        const badges = j.statusBadges || [];
        
        if (selectedJobType === 'Internship') {
          return badges.includes('Internship') || titleLower.includes('intern');
        } else if (selectedJobType === 'Freelance') {
          return titleLower.includes('freelance');
        } else if (selectedJobType === 'Part-time') {
          return titleLower.includes('part time') || titleLower.includes('part-time');
        } else if (selectedJobType === 'Contractor') {
          return titleLower.includes('contract');
        } else if (selectedJobType === 'Full-time') {
          return !badges.includes('Internship') && 
                 !titleLower.includes('intern') && 
                 !titleLower.includes('freelance') && 
                 !titleLower.includes('part time') && 
                 !titleLower.includes('part-time') && 
                 !titleLower.includes('contract');
        }
        return true;
      });
    }
    
    // Then filter by search term
    if (!term) return typeFiltered;
    return typeFiltered.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.functionArea.toLowerCase().includes(term) ||
        j.city.toLowerCase().includes(term) ||
        j.state.toLowerCase().includes(term)
    );
  }, [jobs, search, activeTab, selectedJobType]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    return {
      active: jobs.filter(j => j.status === 'active').length,
      closed: jobs.filter(j => j.status === 'closed').length,
      draft: jobs.filter(j => j.status === 'draft').length,
    };
  }, [jobs]);

  // Modal handlers
  const handleViewJob = (job: any) => {
    setSelectedJobForView(job);
    setViewMode('detail');
    setOpenDropdown(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedJobForView(null);
  };

  const handleCloseJob = (job: any) => {
    setSelectedJob(job);
    setIsCloseJobModalOpen(true);
    setOpenDropdown(null);
  };

  const handleExtendDeadline = (job: any) => {
    setSelectedJob(job);
    setIsExtendDeadlineModalOpen(true);
    setOpenDropdown(null);
  };

  const handlePostSimilarJob = (job: any) => {
    // Determine job type
    const isInternship = job.statusBadges?.includes('Internship') || job.title.toLowerCase().includes('intern');
    const isFullTime = job.jobType?.toLowerCase().includes('full-time') || job.jobType?.toLowerCase().includes('full time');
    const isPartTime = job.jobType?.toLowerCase().includes('part-time') || job.jobType?.toLowerCase().includes('part time');
    const isContract = job.jobType?.toLowerCase().includes('contract') || job.jobType?.toLowerCase().includes('freelance');
    const isGig = job.jobType?.toLowerCase().includes('gig') || job.jobType?.toLowerCase().includes('flexible');
    
    // Map job type string
    let jobType = 'Full-Time';
    if (isInternship) jobType = 'Internship';
    else if (isPartTime) jobType = 'Part-Time';
    else if (isContract) jobType = 'Contract';
    else if (isGig) jobType = 'Gig/Flexible';
    
    // Parse location
    const [city = '', state = ''] = (job.location || '').split(',').map((s: string) => s.trim());
    
    // Build the pre-fill data matching JobFormState structure
    const prefillData: any = {
      title: job.title || '',
      jobType: jobType,
      workMode: job.workMode || (city === 'Remote' ? 'Remote' : ''),
      keySkills: job.skills || [],
      workExperience: job.experience 
        ? { min: job.experience.split('-')[0]?.trim() || '', max: job.experience.split('-')[1]?.trim() || '' }
        : { min: '', max: '' },
      educationQualification: job.education || '',
      numberOfOpenings: job.openings?.toString() || '1',
      location: job.location || `${city}, ${state}`,
      description: job.description || `Pre-filled job description from: ${job.title}`,
      postToPublic: (job.postedToPublic || 0) > 0,
      postToColleges: (job.postedToColleges || 0) > 0,
    };
    
    // Add type-specific details
    if (isInternship && job.internshipDetails) {
      prefillData.internshipDetails = {
        duration: job.internshipDetails.duration || '',
        compensation: job.internshipDetails.compensation || '',
        stipend: job.internshipDetails.stipend || '',
        conversionPossibility: job.internshipDetails.conversionPossibility || '',
        certificateProvided: job.internshipDetails.certificateProvided || '',
      };
    }
    
    if (isFullTime && job.fullTimeDetails) {
      prefillData.fullTimeDetails = {
        preferredMode: job.fullTimeDetails.preferredMode || job.workMode || '',
        noticePeriod: job.fullTimeDetails.noticePeriod || '',
        deadline: job.fullTimeDetails.deadline || '',
        minSalary: job.fullTimeDetails.payRange?.min || '',
        maxSalary: job.fullTimeDetails.payRange?.max || '',
      };
      
      // Add benefits if available
      if (job.benefits && Array.isArray(job.benefits)) {
        prefillData.benefits = job.benefits.map((benefit: string, index: number) => ({
          id: (index + 1).toString(),
          text: benefit,
          enabled: true,
        }));
      }
    }
    
    if (isPartTime && job.partTimeDetails) {
      prefillData.dailyTimings = job.partTimeDetails.dailyTimings || '';
      prefillData.preferredWorkingDays = job.partTimeDetails.preferredWorkingDays || [];
      prefillData.compensationType = job.partTimeDetails.compensationType || '';
      prefillData.payRange = job.partTimeDetails.payRange || { min: '', max: '' };
    }
    
    if (isContract && job.contractDetails) {
      prefillData.contractDetails = {
        duration: job.contractDetails.duration || '',
        paymentStructure: job.contractDetails.paymentStructure || '',
        paymentAmount: job.contractDetails.paymentAmount || '',
        extensionPossibility: job.contractDetails.extensionPossibility || '',
      };
    }
    
    if (isGig && job.gigDetails) {
      prefillData.gigDetails = {
        workSchedule: job.gigDetails.workSchedule || '',
        preferredDays: job.gigDetails.preferredDays || '',
        hoursPerSession: job.gigDetails.hoursPerSession || '',
        paymentStructure: job.gigDetails.paymentStructure || '',
        rateAmount: job.gigDetails.rateAmount || '',
        gigType: job.gigDetails.gigType || '',
        commitmentLevel: job.gigDetails.commitmentLevel || '',
        specialRequirements: job.gigDetails.specialRequirements || '',
        preferredWorkingDays: job.gigDetails.preferredWorkingDays || [],
      };
    }
    
    // Add internship benefits if applicable
    if (isInternship && job.benefits && Array.isArray(job.benefits)) {
      prefillData.benefits = job.benefits.map((benefit: string, index: number) => ({
        id: (index + 1).toString(),
        text: benefit,
        enabled: true,
      }));
    }
    
    console.log('Post Similar Job - Prefill Data:', prefillData);
    
    // Pass the prefill data to parent component
    if (onPostSimilarJob) {
      onPostSimilarJob(prefillData);
    } else {
      console.warn('onPostSimilarJob callback is not provided');
      alert('Post Similar Job functionality requires onPostSimilarJob callback prop');
    }
    
    setOpenDropdown(null);
  };

  const handleCloseJobConfirm = (jobId: string, reason: string) => {
    console.log('Closing job:', jobId, 'Reason:', reason);
    // Implement your close job logic here
  };

  const handleExtendDeadlineConfirm = (jobId: string, newDeadline: string) => {
    console.log('Extending deadline for job:', jobId, 'New deadline:', newDeadline);
    // Implement your extend deadline logic here
  };

  const handleSaveEditedDraft = (jobId: string, updates: {
    startDate: string;
    duration: string;
    workMode: string;
    stipend: string;
    numberOfOpenings: number;
  }) => {
    console.log('Saving edited draft job:', jobId, updates);
    // Implement your save draft logic here
    // For example: call an API to update the job with the new values
  };

  // If viewing job details, show the detail page
  if (viewMode === 'detail' && selectedJobForView) {
    // Determine job type from title or badges
    let jobType = 'Full-time';
    const titleLower = selectedJobForView.title.toLowerCase();
    
    if (selectedJobForView.statusBadges?.includes('Internship') || titleLower.includes('intern')) {
      jobType = 'Internship';
    } else if (titleLower.includes('freelance')) {
      jobType = 'Freelance';
    } else if (titleLower.includes('part time') || titleLower.includes('part-time')) {
      jobType = 'Part-time';
    } else if (titleLower.includes('contract')) {
      jobType = 'Contractor';
    }
    
    const isInternship = jobType === 'Internship';
    const isFreelance = jobType === 'Freelance';
    const isPartTime = jobType === 'Part-time';
    const isContractor = jobType === 'Contractor';
    
    const jobForView = {
      id: selectedJobForView.id,
      title: selectedJobForView.title,
      jobType: jobType,
      workMode: selectedJobForView.city === 'Remote' ? 'Remote' : 'Hybrid',
      city: selectedJobForView.city,
      state: selectedJobForView.state,
      location: `${selectedJobForView.city}, ${selectedJobForView.state}`,
      keySkills: selectedJobForView.skills || [],
      workExperience: { min: '0', max: '2' },
      educationQualification: 'Bachelor\'s degree or equivalent',
      endDate: 'Dec 31, 2025',
      startDate: 'Dec 15, 2025',
      numberOfOpenings: 2,
      description: `Are you passionate about ${selectedJobForView.functionArea}? Join our team at XYZ Technologies Private Limited as a ${selectedJobForView.title}! As ${isInternship ? 'an intern' : 'a professional'}, you will have the opportunity to work on exciting projects and gain hands-on experience. Your role will be crucial in contributing to the success of our company and making a real impact in the tech industry.`,
      postedTo: {
        colleges: selectedJobForView.postedToColleges || 0,
        public: selectedJobForView.postedToPublic || 0
      },
      postedAgo: selectedJobForView.postedAgo || '2 days ago',
      status: selectedJobForView.status,
      
      // Internship-specific details
      internshipDetails: isInternship ? {
        duration: '3 months',
        compensation: 'Paid',
        stipend: selectedJobForView.ctc?.replace('₹ ', '').replace('/month', '') || '10,000',
        conversionPossibility: 'Yes',
        certificateProvided: 'Completion Certificate'
      } : undefined,
      
      // Full-time specific details
      fullTimeDetails: jobType === 'Full-time' ? {
        noticePeriod: '30 Days',
        compensationType: 'Salary',
        payRange: { 
          min: selectedJobForView.ctc?.split('–')[0]?.replace('₹ ', '').replace(' LPA', '').trim() || '8',
          max: selectedJobForView.ctc?.split('–')[1]?.replace(' LPA', '').trim() || '12'
        }
      } : undefined,
      
      // Part-time specific details
      partTimeDetails: isPartTime ? {
        dailyTimings: 'Flexible',
        preferredWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        compensationType: 'Hourly',
        payRange: {
          min: selectedJobForView.ctc?.replace('₹ ', '').split('-')[0]?.trim() || '15,000',
          max: selectedJobForView.ctc?.replace('₹ ', '').replace('/month', '').split('-')[1]?.trim() || '25,000'
        }
      } : undefined,
      
      // Contract specific details
      contractDetails: isContractor ? {
        duration: '6 months',
        paymentStructure: 'Monthly',
        paymentAmount: selectedJobForView.ctc?.replace('₹ ', '').replace('/month', '').split('-')[0]?.trim() || '1,20,000',
        extensionPossibility: 'Yes'
      } : undefined,
      
      // Gig/Flexible specific details
      gigDetails: isFreelance ? {
        workSchedule: 'Flexible Hours',
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        hoursPerSession: '4-6 hours',
        paymentStructure: 'Per Project',
        rateAmount: selectedJobForView.ctc?.replace('₹ ', '').replace('/project', '').split('-')[0]?.trim() || '50,000',
      } : undefined,
      
      // Benefits - ONLY for Full-time and Internship
      benefits: (isInternship || jobType === 'Full-time')
        ? ['Health insurance', 'Flexible working hours', 'Professional development budget', 'Stock options']
        : undefined,
    };

    return <ViewJobPage job={jobForView} onBack={handleBackToList} />;
  }

  return (
    <div className="bg-white">
      {/* Title + subtext + Post New Job */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage <span className="text-blue-600">Jobs</span>
          </h1>
          <p className="mt-2 text-gray-600">Manage all your job postings</p>
        </div>
        
        <button
          onClick={onCreateJob}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 border"
          style={{
            borderColor: '#1383F3',
            color: '#1182F2',
            backgroundColor: 'white'
          }}
        >
          <Plus className="h-4 w-4" style={{ color: '#1182F2' }} />
          Post New Job
        </button>
      </div>

      {/* Search + filters */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search colleges by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg py-2.5 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              color: '#717182'
            }}
          />
        </div>

        <div className="relative" ref={jobTypeDropdownRef}>
          <button 
            onClick={() => setIsJobTypeDropdownOpen(!isJobTypeDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 border whitespace-nowrap"
            style={{
              borderColor: '#1383F3',
              color: '#1182F2',
              backgroundColor: 'white',
              minWidth: '140px'
            }}
          >
            <Filter className="h-4 w-4" style={{ color: '#1182F2' }} />
            {selectedJobType}
            <ChevronDown className="h-4 w-4 ml-auto" style={{ color: '#1182F2' }} />
          </button>

          {/* Job Type Dropdown */}
          {isJobTypeDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
              <div className="py-1">
                {jobTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedJobType(type);
                      setIsJobTypeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      selectedJobType === type ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs (rounded group like screenshot) */}
      <div className="mb-5">
        <div className="flex w-full rounded-full bg-gray-100 p-1">
          {([
            ["active", "Active Jobs", tabCounts.active],
            ["closed", "Closed Jobs", tabCounts.closed],
            ["draft", "Draft Jobs", tabCounts.draft],
          ] as const).map(([key, label, count]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition shadow-sm ${
                  isActive ? "text-white" : "text-gray-600 hover:text-gray-800"
                }`}
                style={isActive ? {
                  background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)',
                } : {}}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Job cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-sm font-medium">No jobs found in this category</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or create a new job posting</p>
          </div>
        ) : (
          filtered.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl bg-white hover:shadow-lg transition-all duration-200 group"
              style={{ 
                border: job.status === 'closed' ? '1px solid #B8BBD2' : '1px solid #E5E7EB',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="p-6">
                {/* Main content row */}
                <div className="flex items-start gap-6">
                  {/* Left side: Avatar + Job Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${job.status === 'closed' ? 'opacity-40' : ''}`}
                      style={{ 
                        background: job.status === 'closed' 
                          ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <span className="text-2xl font-semibold text-white">
                        {job.title.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row with badges */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold" style={{ color: job.status === 'closed' ? '#0A0A0A' : undefined }}>{job.title}</h3>

                        {/* For closed jobs - show Internship badge first if applicable, then Closed badge */}
                        {job.status === 'closed' && (
                          <>
                            {job.statusBadges.includes("Internship") && (
                              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                                style={{ 
                                  backgroundColor: '#E9EAF2',
                                  color: '#9297C0',
                                  border: '1px solid #E9EAF2'
                                }}
                              >
                                Internship
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                              style={{ 
                                backgroundColor: '#E9EAF2',
                                color: '#9297C0',
                                border: '1px solid #E9EAF2'
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" style={{ color: '#9297C0' }} />
                              Closed
                            </span>
                          </>
                        )}

                        {/* Status badges - only shown for active jobs */}
                        {job.status !== 'closed' && job.status !== 'draft' && job.statusBadges.map((b, i) => {
                          if (b === "Internship")
                            return (
                              <span key={`${b}-${i}`} className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                                style={{ border: '1px solid #E9D5FF' }}
                              >
                                Internship
                              </span>
                            );
                          if (b === "Active")
                            return (
                              <span key={`${b}-${i}`} className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                                style={{ border: '1px solid #BBF7D0' }}
                              >
                                ● Active
                              </span>
                            );
                          return (
                            <span key={`${b}-${i}`} className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                              style={{ border: '1px solid #FECACA' }}
                            >
                              Application on hold
                            </span>
                          );
                        })}
                        
                        {/* Draft status badge */}
                        {job.status === 'draft' && (
                          <>
                            {job.statusBadges.includes("Internship") && (
                              <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                                style={{ border: '1px solid #E9D5FF' }}
                              >
                                Internship
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                              style={{ 
                                backgroundColor: 'rgba(236, 27, 27, 0.1)',
                                color: '#EC1B1B',
                                border: '1px solid rgba(236, 27, 27, 0.2)'
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Draft
                            </span>
                          </>
                        )}

                        {/* Avg Match - only for non-draft and non-closed jobs */}
                        {job.status !== 'draft' && job.status !== 'closed' && (
                          <span className="text-sm font-semibold" style={{ color: '#0377EB' }}>
                            Avg Match: {job.avgMatch}
                          </span>
                        )}
                      </div>

                      {/* Meta: location • area • CTC */}
                      <div className="mb-3 flex flex-wrap items-center text-sm" style={{ color: job.status === 'closed' ? '#717182' : '#6B7280' }}>
                        <MapPin className="mr-1.5 h-4 w-4" style={{ color: job.status === 'closed' ? '#717182' : undefined }} />
                        <span>
                          {job.city}, {job.state}
                        </span>
                        <Dot />
                        <span>{job.functionArea}</span>
                        <Dot />
                        <span className="font-medium" style={{ color: job.status === 'closed' ? '#717182' : '#111827' }}>{job.ctc}</span>
                      </div>

                      {/* Posted to + applicants - show for all job statuses */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span style={{ color: job.status === 'closed' ? '#717182' : '#4B5563' }}>Posted to:</span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                          style={job.status === 'closed' ? {
                            backgroundColor: '#E9EAF2',
                            color: '#9297C0',
                            border: '1px solid #E9EAF2'
                          } : {
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #DBEAFE'
                          }}
                        >
                          {job.postedToColleges} Colleges
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                          style={job.status === 'closed' ? {
                            backgroundColor: '#E9EAF2',
                            color: '#9297C0',
                            border: '1px solid #E9EAF2'
                          } : {
                            backgroundColor: '#FFFBEB',
                            color: '#B45309',
                            border: '1px solid #FEF3C7'
                          }}
                        >
                          Public
                        </span>

                        <span className="mx-2 inline-block h-4 w-px bg-gray-300"></span>

                        <span className={`inline-flex items-center ${job.status === 'closed' ? 'text-gray-500' : 'text-gray-700'}`}>
                          <Users className={`mr-1.5 h-4 w-4 ${job.status === 'closed' ? 'text-gray-400' : 'text-gray-400'}`} />
                          <button 
                            className={`font-semibold ${job.status === 'closed' ? 'text-gray-500 cursor-default' : 'hover:underline'}`} 
                            style={{ color: job.status === 'closed' ? undefined : '#0377EB' }}
                            disabled={job.status === 'closed'}
                          >
                            {job.applicants} applicants
                          </button>
                        </span>

                        <span className="text-gray-500">
                          {job.collegesFrom} from Colleges • {job.publicFrom} from Public
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Posted date and action menu */}
                  <div className="flex shrink-0 items-start gap-3">
                    <span className={`text-xs whitespace-nowrap ${job.status === 'closed' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {job.status === 'draft' ? 'Saved:' : 'Posted:'} {job.postedAgo}
                    </span>
                    <div className="relative" ref={(el) => { jobActionsDropdownRefs.current[job.id] = el; }}>
                      <button 
                        onClick={() => setOpenDropdown(openDropdown === job.id ? null : job.id)}
                        className="rounded-lg p-1.5 transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    
                    {/* Dropdown Menu */}
                    {openDropdown === job.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                        <div className="py-1">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 border-b border-gray-100">
                            Select Action
                          </div>
                          <button 
                            onClick={() => handleViewJob(job)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View Job
                          </button>
                          
                          {/* Show different options based on job status */}
                          {job.status === 'active' && (
                            <>
                              <button 
                                onClick={() => handleCloseJob(job)}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Close Job
                              </button>
                              <button 
                                onClick={() => handleExtendDeadline(job)}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Extend Deadline
                              </button>
                            </>
                          )}
                          
                          {/* Post Similar Job option for active and closed jobs only */}
                          {job.status !== 'draft' && (
                            <button 
                              onClick={() => handlePostSimilarJob(job)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Post Similar Job
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                {/* Bottom row: Skills and Action button */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Top Skills:</span>
                    {job.skills.slice(0, 3).map((s) => (
                      <span 
                        key={s} 
                        className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium"
                        style={job.status === 'closed' ? {
                          backgroundColor: '#E9EAF2',
                          color: '#9297C0',
                          border: '1px solid #E9EAF2'
                        } : {
                          backgroundColor: 'rgba(147, 51, 234, 0.1)',
                          color: '#7C3AED',
                          border: '1px solid rgba(147, 51, 234, 0.2)'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <button 
                        className={`text-xs font-medium ${job.status === 'closed' ? 'text-gray-400 cursor-default' : 'text-blue-600 hover:text-blue-700 hover:underline'}`}
                        disabled={job.status === 'closed'}
                      >
                        +{job.skills.length - 3} more
                      </button>
                    )}
                  </div>

                  {/* Bottom button - different for draft, active, and closed jobs */}
                  {job.status === 'draft' ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          console.log('Delete draft job:', job.id);
                          // Implement delete logic
                        }}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold bg-white hover:bg-gray-50 transition-colors"
                        style={{
                          border: '1px solid #EC1B1B',
                          color: '#EC1B1B'
                        }}
                      >
                        Delete Job
                      </button>
                      <button
                        onClick={() => {
                          console.log('Preview draft job:', job.id);
                          handleViewJob(job);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold bg-white hover:bg-gray-50 transition-colors"
                        style={{
                          border: '1px solid #097CEE',
                          color: '#097CEE'
                        }}
                      >
                        Preview Job
                      </button>
                      <button
                        onClick={() => {
                          console.log('Post draft job:', job.id);
                          // Implement post logic
                        }}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                        style={{
                          background: 'linear-gradient(90deg, #2490FB 0%, #0478EB 100%)',
                        }}
                      >
                        Post Job
                      </button>
                    </div>
                  ) : job.status === 'closed' ? (
                    <button
                      onClick={() => onViewJob?.(job.id, job.title)}
                      className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{
                        background: 'linear-gradient(90deg, #A4AAD7 0%, #9297C0 100%)',
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Applications
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewJob?.(job.id, job.title)}
                      className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                      style={{
                        background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)',
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Applications
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination (compact squares like screenshot) */}
      <div className="mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-1">
          <button
            className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Previous"
          >
            ‹
          </button>
          {["1", "2", "3", "4", "5"].map((n, i) => (
            <button
              key={n}
              className={`h-7 w-7 rounded-md border text-sm ${
                i === 0
                  ? "border-blue-600 bg-blue-600 font-medium text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          ))}
          <button className="h-7 w-7 cursor-default rounded-md border border-transparent text-gray-500">…</button>
          <button
            className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Next"
          >
            ›
          </button>
        </nav>
      </div>

      {/* Modals */}
      <CloseJobModal
        jobId={selectedJob?.id || ''}
        jobTitle={selectedJob?.title || ''}
        isOpen={isCloseJobModalOpen}
        onClose={() => setIsCloseJobModalOpen(false)}
        onConfirm={handleCloseJobConfirm}
      />

      <ExtendDeadlineModal
        jobId={selectedJob?.id || ''}
        jobTitle={selectedJob?.title || ''}
        currentDeadline="Dec 31, 2025"
        isOpen={isExtendDeadlineModalOpen}
        onClose={() => setIsExtendDeadlineModalOpen(false)}
        onConfirm={handleExtendDeadlineConfirm}
      />

      <EditDraftModal
        jobId={selectedJob?.id || selectedJob?._id || ''}
        jobTitle={selectedJob?.title || ''}
        jobType={selectedJob?.statusBadges?.[0] || selectedJob?.type || ''}
        currentStartDate={selectedJob?.startDate || ''}
        currentDuration={selectedJob?.duration || ''}
        currentWorkMode={selectedJob?.workMode || 'Remote'}
        currentStipend={selectedJob?.ctc || selectedJob?.stipend || ''}
        currentNumberOfOpenings={selectedJob?.numberOfOpenings || 1}
        isOpen={isEditDraftModalOpen}
        onClose={() => setIsEditDraftModalOpen(false)}
        onSave={handleSaveEditedDraft}
      />
    </div>
  );
};

export default ManageJobsSection;