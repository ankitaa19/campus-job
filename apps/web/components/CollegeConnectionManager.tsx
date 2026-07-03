import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  UserCheck, 
  Search, 
  Filter, 
  MapPin, 
  Star,
  Phone,
  Mail,
  Eye,
  MessageCircle,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Send,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import CompanyDetailsView from './CompanyDetailsView';
import { getCompanyData, Company, CompanyJob } from '../utils/companyData';
import TabButtons from './ui/TabButtons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface Connection {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  target: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  acceptedAt?: string;
  isRequester?: boolean;
}

interface CollegeConnectionManagerProps {
  onRefresh?: () => void;
  onViewCompany?: (company: Company) => void;
}

const CollegeConnectionManager: React.FC<CollegeConnectionManagerProps> = ({ onRefresh, onViewCompany }) => {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hiring' | 'visits' | 'requests'>('hiring');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Company details modal state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Schedule Campus Visit modal state (College initiates)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCompanyForVisit, setSelectedCompanyForVisit] = useState<Company | null>(null);
  const [visitScheduleStep, setVisitScheduleStep] = useState(1);
  
  // College-initiated visits (Campus Visits tab)
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([
    {
      id: '1',
      company: {
        name: 'TechCorp Solutions',
        location: 'Bangalore, India',
        industry: 'Technology',
        logo: 'TC'
      },
      visitDate: '2025-11-15',
      timeSlot: '10:00 AM - 1:00 PM',
      startTime: '10:00 AM',
      endTime: '1:00 PM',
      meetingType: 'Campus Visit',
      venue: 'Offline',
      onCampus: 'Main Auditorium',
      expectedCandidates: 100,
      jobRoles: ['Software Engineer', 'Frontend Developer'],
      contactPerson: 'Dr. Sharma',
      contactNumber: '+91 9876543210',
      welcomeNote: 'Campus Hiring Drive for Software Engineers',
      meetingLink: '',
      status: 'scheduled',
      createdBy: 'college'
    },
    {
      id: '2',
      company: {
        name: 'Digital Innovations Pvt Ltd',
        location: 'Pune, India',
        industry: 'IT Services',
        logo: 'DI'
      },
      visitDate: '2025-11-20',
      timeSlot: '2:00 PM - 4:00 PM',
      startTime: '2:00 PM',
      endTime: '4:00 PM',
      meetingType: 'Campus Visit',
      venue: 'Online',
      onCampus: 'Online',
      expectedCandidates: 60,
      jobRoles: ['Data Analyst', 'Business Analyst'],
      contactPerson: 'Dr. Sharma',
      contactNumber: '+91 9876543210',
      welcomeNote: 'Online Campus Recruitment for Analyst Roles',
      meetingLink: 'https://teams.microsoft.com/meet/xyz-abc-123',
      status: 'scheduled',
      createdBy: 'college'
    }
  ]);
  
  // Company-initiated visit requests (Company Visits Request tab)
  const [companyVisitRequests, setCompanyVisitRequests] = useState<any[]>(() => {
    // Load from localStorage first
    if (typeof window !== 'undefined') {
      const storedRequests = localStorage.getItem('campus-visit-requests');
      if (storedRequests) {
        try {
          const parsed = JSON.parse(storedRequests);
          return parsed.length > 0 ? parsed : getDefaultRequests();
        } catch (e) {
          console.error('Error parsing stored requests:', e);
        }
      }
    }
    return getDefaultRequests();
  });

  // Helper function to get default requests
  function getDefaultRequests() {
    return [
      {
        id: '1',
        company: {
          name: 'XYZ Company',
          location: 'New Delhi, India',
          industry: 'Technology',
          logo: 'XY'
        },
        jobTitle: 'Backend Developer',
        jobLocation: 'New Delhi, India',
        jobType: 'Full-Time',
        salary: '8-12 LPA',
        date: 'Nov 10, 2025',
        visitDate: 'October 15th, 2025',
        timeSlot: '10 AM - 1 pm',
        startTime: '10:00',
        endTime: '17:00',
        meetingType: 'Campus Visit',
        interviewMode: 'Online',
        venue: 'Online',
        onCampus: 'Online',
        slots: '50 students maximum',
        timestamp: '20 mins ago • 10:20 AM',
        meetingAgenda: 'Campus Hiring',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        hrContact: {
          name: 'Dr. Rajesh Kumar',
          email: 'placement@abc.ac.in',
          phone: '+91 1011001101'
        },
        status: 'pending',
        createdBy: 'company'
      },
      {
        id: '2',
        company: {
          name: 'InnovateSoft',
          location: 'Mumbai, India',
          industry: 'Software Development',
          logo: 'IS'
        },
        jobTitle: 'Frontend Developer',
        jobLocation: 'Mumbai, India',
        jobType: 'Full-Time',
        salary: '10-15 LPA',
        date: 'Nov 12, 2025',
        visitDate: 'November 12th, 2025',
        timeSlot: '2 PM - 5 PM',
        startTime: '14:00',
        endTime: '17:00',
        meetingType: 'Campus Visit',
        interviewMode: 'Offline',
        venue: 'Offline',
        onCampus: 'Conference Hall A',
        slots: '75 students maximum',
        timestamp: '1 hour ago • 9:00 AM',
        meetingAgenda: 'Frontend Developer Recruitment',
        meetingLink: '',
        hrContact: {
          name: 'Ms. Priya Sharma',
          email: 'hr@innovatesoft.com',
          phone: '+91 9988776655'
        },
        status: 'pending',
        createdBy: 'company'
      }
    ];
  }
  // Visit request details modal state
  const [showVisitRequestModal, setShowVisitRequestModal] = useState(false);
  const [selectedVisitRequest, setSelectedVisitRequest] = useState<any>(null);
  
  // Campus Visit details modal state
  const [showCampusVisitDetailsModal, setShowCampusVisitDetailsModal] = useState(false);
  const [selectedCampusVisit, setSelectedCampusVisit] = useState<any>(null);
  
  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<any>(null);
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);
  
  // Schedule form state
  const [visitForm, setVisitForm] = useState({
    visitDate: '',
    startTime: '',
    duration: '2 hours',
    venue: 'Placement Hall',
    expectedCandidates: 50,
    jobRoles: [] as string[],
    contactPerson: '',
    contactNumber: '',
    welcomeNote: '',
    meetingLink: ''
  });

  // Sample company data based on Figma design - consistent with CompanyDetailsView
  const [companies] = useState<Company[]>(getCompanyData());

  // Fetch college profile data from backend to get primary contact
  const fetchCollegeProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, checking localStorage for user data');
        loadContactFromLocalStorage();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/college/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        const collegeData = response.data;
        console.log('College profile data:', collegeData);
        
        // Try multiple possible field names from backend
        const contactPerson = 
          collegeData.primaryContact?.name || 
          collegeData.admissionCoordinatorName || 
          collegeData.contactPerson ||
          collegeData.name ||
          '';
          
        const contactNumber = 
          collegeData.primaryContact?.phone || 
          collegeData.admissionCoordinatorNumber || 
          collegeData.contactNumber ||
          collegeData.phone ||
          '';
        
        console.log('Setting contact person:', contactPerson, 'contact number:', contactNumber);
        
        setVisitForm(prev => ({
          ...prev,
          contactPerson,
          contactNumber
        }));
      }
    } catch (err) {
      console.error('Error fetching college profile:', err);
      // Fallback to localStorage if API fails
      loadContactFromLocalStorage();
    }
  };

  const loadContactFromLocalStorage = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('User data from localStorage:', user);
        
        const contactPerson = 
          user.primaryContact?.name || 
          user.admissionCoordinatorName || 
          user.contactPerson ||
          user.name ||
          '';
          
        const contactNumber = 
          user.primaryContact?.phone || 
          user.admissionCoordinatorNumber || 
          user.contactNumber ||
          user.phone ||
          '';
        
        console.log('Setting contact from localStorage - person:', contactPerson, 'number:', contactNumber);
        
        setVisitForm(prev => ({
          ...prev,
          contactPerson,
          contactNumber
        }));
      } catch (parseErr) {
        console.error('Error parsing user data:', parseErr);
      }
    } else {
      console.log('No user data found in localStorage');
    }
  };

  useEffect(() => {
    fetchCollegeProfile();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConnections(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

    const getPartnershipBadge = (type: string) => {
    // Always show "Partnered" badge regardless of type
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-transparent"
        style={{ 
          backgroundColor: '#EAFFF3', 
          color: '#00A34B' 
        }}
      >
        <svg 
          className="w-3.5 h-3.5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#00A34B" 
          strokeWidth="2.5"
        >
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Partnered
      </span>
    );
  };

  const getCompanyLogo = (name: string) => {
    const colors = ['#FF339F', '#FFC700', '#CCB1FF'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </div>
    );
  };

  // Helper function to get the last posted job (most recent)
  const getLastPostedJob = (company: Company): string => {
    if (!company.jobs || company.jobs.length === 0) {
      return 'No jobs posted';
    }
    
    // Get the first job (assumed to be most recent) or the one with earliest deadline
    const lastJob = company.jobs[0];
    return lastJob.title || 'Recent position';
  };

  // Helper function to ensure minimum 3 jobs are displayed
  const getJobsWithMinimum = (jobs: any[]) => {
    const displayJobs = [...jobs];
    
    // Fill up to 3 jobs with "Coming Soon" placeholders
    while (displayJobs.length < 3) {
      displayJobs.push({
        _id: `placeholder-${displayJobs.length}`,
        title: 'Job posting',
        education: 'Coming Soon',
        experience: '..',
        openings: 0,
        isPlaceholder: true
      });
    }
    
    return displayJobs.slice(0, 3);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Companies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Total Companies</h3>
            <div className="w-7 h-7 bg-gradient-to-r from-[#00C950] to-[#00A63E] rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-gray-900">45</div>
            <div className="flex items-center gap-2 text-sm">
              <ChevronUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-600">Vs last month</span>
            </div>
          </div>
        </div>

        {/* Active Partners */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Active Partners</h3>
            <div className="w-7 h-7 bg-gradient-to-r from-[#AD46FF] to-[#9810FA] rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-gray-900">38</div>
            <div className="flex items-center gap-2 text-sm">
              <ChevronUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+8%</span>
              <span className="text-gray-600">Vs last month</span>
            </div>
          </div>
        </div>

        {/* New This Month */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">New This Month</h3>
            <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-gray-900">05</div>
            <div className="flex items-center gap-2 text-sm">
              <ChevronUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+23%</span>
              <span className="text-gray-600">Vs last month</span>
            </div>
          </div>
        </div>

        {/* Total Placements */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Total Placements</h3>
            <div className="w-7 h-7 bg-gradient-to-r from-[#008EFF] to-[#0573CB] rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-gray-900">45%</div>
            <div className="flex items-center gap-2 text-sm">
              <ChevronUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+15%</span>
              <span className="text-gray-600">Vs last month</span>
            </div>
          </div>
        </div>
      </div>

{/* Tab Buttons - Full Width */}
<TabButtons
  tabs={[
    { id: 'hiring', label: 'Hiring Companies', count: companies.length, showCount: true },
    { id: 'visits', label: 'Campus Visits', count: scheduledVisits.length, showCount: false },
    { id: 'requests', label: 'Company Visits Request', count: companyVisitRequests.length, showCount: true }
  ]}
  activeTab={activeTab}
  onTabChange={(tabId) => setActiveTab(tabId as 'hiring' | 'visits' | 'requests')}
  className="mb-6"
/>

{/* Search and Filter Section */}
<div className="flex items-center gap-3 mb-8">
  {/* Search Bar - Takes most space */}
  <div className="relative flex-1">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search className="w-4 h-4 text-gray-400" />
    </div>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search companies or industries..."
      className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-700 text-sm"
    />
  </div>

  {/* Filter Button - Fixed width */}
  <button className="flex items-center gap-2 px-6 py-2.5 border border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-200 text-sm font-medium shadow-sm whitespace-nowrap">
    <Filter className="w-4 h-4" />
    Filter
  </button>
</div>


      {/* Company Cards or Campus Visits */}
      {activeTab === 'hiring' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {companies.map((company) => (
          <div key={company._id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-full">
            {/* Company Header */}
            <div className="flex items-start gap-3 mb-4">
              {getCompanyLogo(company.name)}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{company.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{company.industry}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{company.location}</span>
                </div>
              </div>
            </div>

            {/* Partnership Badge */}
            <div className="flex items-center justify-between mb-4">
              {getPartnershipBadge(company.partnershipType)}
              <span className="text-xs text-gray-500">Posted new job: {getLastPostedJob(company)}</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{company.metrics.placements}</div>
                <div className="text-xs text-gray-600">Placements</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{company.metrics.avgPackage}</div>
                <div className="text-xs text-gray-600">Avg Package</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{company.metrics.activeJobs}+</div>
                <div className="text-xs text-gray-600">Active Jobs</div>
              </div>
            </div>

            {/* Jobs Section - Fixed height for consistency */}
            <div className="mt-4 flex-grow">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Hiring For ({company.jobs.length} role{company.jobs.length !== 1 ? 's' : ''})</span>
              </div>

              <div className="space-y-3">
                {getJobsWithMinimum(company.jobs).map((job, index) => (
                  <div key={job._id} className={`rounded-xl p-3 ${job.isPlaceholder ? 'bg-gray-50 border border-dashed border-gray-300' : 'bg-gray-50'}`}>
                    {job.isPlaceholder ? (
                      <div className="text-gray-500 text-sm text-center py-2">
                        {job.title}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                          <span 
                            className="inline-flex items-center px-2 py-1 text-xs rounded-full border"
                            style={{
                              backgroundColor: 'rgba(143, 255, 188, 0.2)',
                              borderColor: '#00C950',
                              color: '#00C950'
                            }}
                          >
                            {job.openings} Openings
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{job.education}</span>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>{job.experience}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {company.jobs.length > 3 && (
                  <div className="text-right mt-2">
                    <button 
                onClick={() => {
                  if (onViewCompany) {
                    onViewCompany(company);
                  } else {
                    setSelectedCompany(company);
                    setShowCompanyModal(true);
                  }
                }}
                className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
              >
                      View All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* HR Contact */}
            <div className="mt-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">HR Contact</h4>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-gray-700">{company.hrContact.name}</div>
                  <div className="text-xs text-gray-500">{company.hrContact.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-7 flex items-center justify-center border border-blue-500 rounded text-blue-600 hover:bg-blue-50 transition-colors">
                    <Phone className="w-3 h-3" />
                  </button>
                  <button className="w-8 h-7 flex items-center justify-center border border-blue-500 rounded text-blue-600 hover:bg-blue-50 transition-colors">
                    <Mail className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons - Always at bottom */}
            <div className="flex gap-2 mt-auto">
              <button 
                onClick={() => {
                  setSelectedCompanyForVisit(company);
                  setVisitScheduleStep(1);
                  setShowScheduleModal(true);
                }}
                className="flex-1 bg-gradient-to-r from-[#2590FB] to-[#0478EB] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
              >
                Schedule Campus Visit
              </button>
              <button 
                onClick={() => {
                  if (onViewCompany) {
                    onViewCompany(company);
                  } else {
                    setSelectedCompany(company);
                    setShowCompanyModal(true);
                  }
                }}
                className="px-4 py-2 bg-white border border-[#1383F3] text-[#1383F3] rounded-lg hover:bg-[#1383F3] hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Eye className="w-4 h-4 text-[#1383F3]" />
                View
              </button>
            </div>
          </div>
          ))}
        </div>
      ) : activeTab === 'visits' ? (
        /* Campus Visits Section - College-initiated visits */
        <div className="space-y-6 mb-8">
          {scheduledVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No scheduled visits yet
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Schedule a campus visit with companies by going to the Hiring Companies tab
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {scheduledVisits.filter(v => v.createdBy === 'college').map((visit) => (
                <div 
                  key={visit.id} 
                  className="bg-white rounded-2xl border border-gray-200 p-5"
                  style={{
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Scheduled Campus Visit</p>
                      <h4 className="text-base font-semibold text-gray-900">{visit.company?.name || 'Company Name'}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Scheduled by you</span>
                      <button 
                        className="text-gray-400 transition hover:text-gray-600"
                        onClick={() => {
                          setSelectedCampusVisit(visit);
                          setShowCampusVisitDetailsModal(true);
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date:</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'Nov 15, 2025'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time slot:</p>
                      <p className="text-sm font-semibold text-gray-900">{visit.timeSlot || visit.startTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Venue:</p>
                      <p className="text-sm font-semibold text-gray-900">{visit.venue === 'Online' ? 'Online' : visit.onCampus || 'On Campus'}</p>
                    </div>
                  </div>

                  {/* Meeting Agenda */}
                  {visit.welcomeNote && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Purpose:</p>
                      <p className="text-sm font-semibold text-gray-900">{visit.welcomeNote}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {/* Show Join button only for online meetings */}
                    {(visit.venue === 'Online' || visit.meetingLink) && (
                      <button
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                        style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                        onClick={() => {
                          // Open meeting link in new tab
                          if (visit.meetingLink) {
                            window.open(visit.meetingLink, '_blank');
                          }
                        }}
                      >
                        <Send className="h-4 w-4" />
                        Join
                      </button>
                    )}
                    
                    {/* Show Withdraw button only for college-initiated visits */}
                    {visit.createdBy === 'college' && (
                      <button
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition hover:bg-yellow-50"
                        style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
                        onClick={() => {
                          // Handle withdraw - remove from scheduled visits
                          if (confirm('Are you sure you want to withdraw this campus visit?')) {
                            setScheduledVisits(scheduledVisits.filter(v => v.id !== visit.id));
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                        Withdraw
                      </button>
                    )}
                    
                    <button
                      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition hover:bg-blue-50"
                      style={{ borderColor: '#2590FB', color: '#2590FB' }}
                      onClick={() => {
                        setSelectedVisitForReschedule(visit);
                        setSelectedCompanyForVisit(visit.company);
                        setVisitForm({
                          visitDate: visit.visitDate,
                          startTime: visit.startTime,
                          duration: visit.duration || '2 hours',
                          venue: visit.venue,
                          expectedCandidates: visit.expectedCandidates,
                          jobRoles: visit.jobRoles || [],
                          contactPerson: visit.contactPerson,
                          contactNumber: visit.contactNumber,
                          welcomeNote: visit.welcomeNote,
                          meetingLink: visit.meetingLink || ''
                        });
                        setShowScheduleModal(true);
                        setIsRescheduleMode(true);
                        setVisitScheduleStep(1);
                      }}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'requests' ? (
        <div className="space-y-6 mb-8">
          {companyVisitRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No visit requests yet
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Company visit requests will appear here when companies send campus visit requests
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {companyVisitRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="bg-white rounded-2xl border border-gray-200 p-5"
                  style={{
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Campus Visit Request</p>
                      <h4 className="text-base font-semibold text-gray-900">{request.company.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{request.timestamp}</span>
                      <button 
                        className="text-gray-400 transition hover:text-gray-600"
                        onClick={() => {
                          setSelectedVisitRequest(request);
                          setShowVisitRequestModal(true);
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date:</p>
                      <p className="text-sm font-semibold text-gray-900">{request.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time slot:</p>
                      <p className="text-sm font-semibold text-gray-900">{request.timeSlot}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Meeting type:</p>
                      <p className="text-sm font-semibold text-gray-900">{request.meetingType}</p>
                    </div>
                  </div>

                  {/* Meeting Agenda */}
                  {request.meetingAgenda && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Meeting agenda:</p>
                      <p className="text-sm font-semibold text-gray-900">{request.meetingAgenda}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {request.status === 'pending' ? (
                      <>
                        {/* Pending Request Buttons */}
                        <button
                          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition hover:bg-red-50"
                          style={{ borderColor: '#EF4444', color: '#EF4444' }}
                          onClick={() => {
                            // Handle decline - remove from requests
                            if (confirm('Are you sure you want to decline this visit request?')) {
                              setCompanyVisitRequests(companyVisitRequests.filter(r => r.id !== request.id));
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </button>
                        <button
                          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                          style={{ background: 'linear-gradient(90deg, #00C950 0%, #00A63E 100%)' }}
                          onClick={() => {
                            // Handle accept - update status to accepted
                            const updatedRequests = companyVisitRequests.map(r => 
                              r.id === request.id 
                                ? { ...r, status: 'accepted' }
                                : r
                            );
                            setCompanyVisitRequests(updatedRequests);
                          }}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept
                        </button>
                        <button
                          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition hover:bg-blue-50"
                          style={{ borderColor: '#2590FB', color: '#2590FB' }}
                          onClick={() => {
                            setSelectedVisitRequest(request);
                            setShowRescheduleModal(true);
                          }}
                        >
                          Reschedule
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Accepted Request Buttons */}
                        {/* Show Join button only for online meetings */}
                        {(request.venue === 'Online' || request.meetingLink) && (
                          <button
                            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                            onClick={() => {
                              // Open meeting link in new tab
                              if (request.meetingLink) {
                                window.open(request.meetingLink, '_blank');
                              }
                            }}
                          >
                            <Send className="h-4 w-4" />
                            Join
                          </button>
                        )}
                        <button
                          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition hover:bg-blue-50"
                          style={{ borderColor: '#2590FB', color: '#2590FB' }}
                          onClick={() => {
                            setSelectedVisitRequest(request);
                            setShowRescheduleModal(true);
                          }}
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Partnership Opportunities */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#0270DF] mb-6">Partnership Opportunities</h2>
        
        <div className="space-y-4">
          {getCompanyData().slice(0, 2).map((opportunity, index) => (
            <div 
              key={`${opportunity._id}-${index}`} 
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {opportunity.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Interested in campus hiring
                </p>
              </div>
              
              <button 
                onClick={() => {
                  // Navigate to Connect Companies > Discover Companies with the company
                  router.push({
                    pathname: '/dashboard/college',
                    query: { 
                      tab: 'connections',
                      subtab: 'discover',
                      companyId: opportunity._id 
                    }
                  });
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2590FB] to-[#0478EB] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Invitation
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Company Details Modal */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CompanyDetailsView 
              company={selectedCompany}
              onBack={() => setShowCompanyModal(false)}
              onViewCompany={(company) => {
                console.log('🚀 CollegeConnectionManager: onViewCompany called with:', company.name);
                setSelectedCompany(company);
                console.log('🚀 CollegeConnectionManager: selectedCompany updated');
              }}
            />
          </div>
        </div>
      )}

      {/* Schedule Campus Visit Modal */}
      {(showScheduleModal || showRescheduleModal) && selectedCompanyForVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[740px] max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {showRescheduleModal || isRescheduleMode 
                    ? `Schedule Campus Visit - ${selectedCompanyForVisit.name}`
                    : `Schedule Campus Visit - ${selectedCompanyForVisit.name}`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setShowRescheduleModal(false);
                  setIsRescheduleMode(false);
                  setVisitScheduleStep(1);
                  setSelectedCompanyForVisit(null);
                  setSelectedVisitForReschedule(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Schedule Form */}
              {visitScheduleStep === 1 && (
                <div className="space-y-6">
                  {/* Subtitle */}
                  <p className="text-sm text-gray-600">
                    Coordinate campus recruitment visit and interview schedule
                  </p>

                  {/* Company Info */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#F15E10]/15 to-[#FFB800]/15 rounded-xl border border-orange-200">
                    {getCompanyLogo(selectedCompanyForVisit.name)}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">
                        {selectedCompanyForVisit.name}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedCompanyForVisit.hrContact?.name}</p>
                    </div>
                  </div>

                  {/* Step Indicator */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white text-sm font-medium">
                      1
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300"></div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
                      2
                    </div>
                  </div>

                  {/* Title Section */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-red-500" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {showRescheduleModal || isRescheduleMode 
                          ? "When would you like to reschedule the visit?"
                          : "When would you like to schedule the visit?"}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Choose the date, time and duration for the campus recruitment
                    </p>
                  </div>

                  {/* Visit Date & Industry */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={visitForm.visitDate}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, visitDate: e.target.value })
                            }
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-grey-300 rounded-full focus:ring-2 focus:ring-grey-500 focus:border-grey-500 text-grey-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                        <input
                          type="text"
                          disabled
                          value="default"
                          className="w-full px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Start Time & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <div className="relative">
                          <input
                            type="time"
                            value={visitForm.startTime}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, startTime: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
                          />
                          
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                        <div className="relative">
                          <select
                            value={visitForm.duration}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, duration: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10"
                          >
                            <option value="2 hours">2 hours</option>
                            <option value="3 hours">3 hours</option>
                            <option value="4 hours">4 hours</option>
                            <option value="Full day">Full day</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Venue & Expected Candidates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                        <div className="relative">
                          <select
                            value={visitForm.venue}
                            onChange={(e) => {
                              setVisitForm({ ...visitForm, venue: e.target.value });
                              if (e.target.value !== 'Online') {
                                setVisitForm(prev => ({ ...prev, meetingLink: '' }));
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-grey-500 appearance-none bg-white pr-10"
                          >
                            <option value="Placement Hall">Placement Hall</option>
                            <option value="Auditorium">Auditorium</option>
                            <option value="Conference Room">Conference Room</option>
                            <option value="Computer Lab">Computer Lab</option>
                            <option value="Seminar Hall">Seminar Hall</option>
                            <option value="Main Campus">Main Campus</option>
                            <option value="Online">Online</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Candidates</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={visitForm.expectedCandidates}
                            onChange={(e) =>
                              setVisitForm({
                                ...visitForm,
                                expectedCandidates: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="50"
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-grey-500"
                          />
                          
                        </div>
                      </div>
                    </div>

                    {/* Meeting Link - Only show if Online is selected */}
                    {visitForm.venue === 'Online' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                        <input
                          type="url"
                          value={visitForm.meetingLink}
                          onChange={(e) =>
                            setVisitForm({ ...visitForm, meetingLink: e.target.value })
                          }
                          placeholder="http://meet.google/jnc-ussefgsr-tksqvbs"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Job Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {showRescheduleModal || isRescheduleMode ? 'Job Type' : 'Job Role'}
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {selectedCompanyForVisit?.jobs && selectedCompanyForVisit.jobs.length > 0 ? (
                          selectedCompanyForVisit.jobs.map((job) => (
                            <label key={job._id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={visitForm.jobRoles.includes(job.title)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setVisitForm({...visitForm, jobRoles: [...visitForm.jobRoles, job.title]});
                                  } else {
                                    setVisitForm({...visitForm, jobRoles: visitForm.jobRoles.filter(r => r !== job.title)});
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{job.title}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No job roles available for this company</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6">
                    <button
                      onClick={() => {
                        setShowScheduleModal(false);
                        setShowRescheduleModal(false);
                        setIsRescheduleMode(false);
                        setVisitScheduleStep(1);
                        setSelectedCompanyForVisit(null);
                        setSelectedVisitForReschedule(null);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setVisitScheduleStep(2)}
                      disabled={!visitForm.visitDate || !visitForm.startTime || visitForm.jobRoles.length === 0}
                      className="px-8 py-3 bg-gradient-to-r from-[#2590FB] to-[#0478EB] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Review & Send */}
              {visitScheduleStep === 2 && (
                <div className="space-y-6">
                  {/* Subtitle */}
                  <p className="text-sm text-gray-600">
                    Coordinate campus recruitment visit and interview schedule
                  </p>

                  {/* Company Info */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#F15E10]/15 to-[#FFB800]/15 rounded-xl border border-orange-200">
                    {getCompanyLogo(selectedCompanyForVisit.name)}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">
                        {selectedCompanyForVisit.name}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedCompanyForVisit.hrContact?.name}</p>
                    </div>
                  </div>

                  {/* Step Indicator */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white text-sm font-medium">
                      1
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300"></div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white text-sm font-medium">
                      2
                    </div>
                  </div>

                  {/* Review Section Title */}
                  <div className="text-center mb-6">
                    <span className="ml-3 text-lg font-bold">Review & Send</span>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h4 className="text-sm text-gray-900">
                        Final details for {selectedCompanyForVisit.name}
                      </h4>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="bg-purple-50 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Date</p>
                        <p className="font-semibold text-gray-900">
                          {visitForm.visitDate ? new Date(visitForm.visitDate).toLocaleDateString('en-US', { 
                            day: 'numeric',
                            month: 'short'
                          }) : '15 Sept'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">{visitForm.startTime || '20:00'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-semibold text-gray-900">{visitForm.duration.replace(' hours', 'hr')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Expected Students</p>
                        <p className="font-semibold text-gray-900">{visitForm.expectedCandidates}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person
                        <span className="text-xs text-blue-600 ml-2"></span>
                      </label>
                      <input
                        type="text"
                        value={visitForm.contactPerson}
                        onChange={(e) => setVisitForm({...visitForm, contactPerson: e.target.value})}
                        placeholder="Admission Coordinator Name"
                        className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-full text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number
                        <span className="text-xs text-blue-600 ml-2"></span>
                      </label>
                      <input
                        type="tel"
                        value={visitForm.contactNumber}
                        onChange={(e) => setVisitForm({...visitForm, contactNumber: e.target.value})}
                        placeholder="Admission Coordinator Number"
                        className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-full text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Welcome Note Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Note</label>
                    <p className="text-sm text-gray-600 mb-3">Add a welcome note to make the invitation more personal</p>
                    <textarea
                      value={visitForm.welcomeNote}
                      onChange={(e) => setVisitForm({ ...visitForm, welcomeNote: e.target.value })}
                      placeholder="Write your welcome note here..."
                      rows={4}
                      className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 resize-none text-gray-700"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between gap-3 pt-6">
                    <button
                      onClick={() => setVisitScheduleStep(1)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowScheduleModal(false);
                          setShowRescheduleModal(false);
                          setIsRescheduleMode(false);
                          setVisitScheduleStep(1);
                          setSelectedCompanyForVisit(null);
                          setSelectedVisitForReschedule(null);
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (showRescheduleModal || isRescheduleMode) {
                            // Update existing visit
                            const updatedVisits = scheduledVisits.map(visit => 
                              visit.id === selectedVisitForReschedule.id 
                                ? { ...visit, ...visitForm, status: 'scheduled' }
                                : visit
                            );
                            setScheduledVisits(updatedVisits);
                          } else {
                            // Add new visit - scheduled from Hiring Companies
                            const newVisit = {
                              id: Date.now().toString(),
                              company: selectedCompanyForVisit,
                              ...visitForm,
                              timeSlot: `${visitForm.startTime} - ${visitForm.duration}`,
                              onCampus: visitForm.venue !== 'Online' ? visitForm.venue : 'Online',
                              createdBy: 'college',
                              status: 'scheduled',
                              scheduledAt: new Date()
                            };
                            setScheduledVisits([...scheduledVisits, newVisit]);
                          }
                          
                          // Reset form and close modal
                          setVisitForm({
                            visitDate: '',
                            startTime: '',
                            duration: '2 hours',
                            venue: 'Placement Hall',
                            expectedCandidates: 50,
                            jobRoles: [],
                            contactPerson: 'Dr. Sharma, Placement Officer',
                            contactNumber: '+91 1001001001',
                            welcomeNote: '',
                            meetingLink: ''
                          });
                          setShowScheduleModal(false);
                          setShowRescheduleModal(false);
                          setIsRescheduleMode(false);
                          setVisitScheduleStep(1);
                          setSelectedCompanyForVisit(null);
                          setSelectedVisitForReschedule(null);
                          
                          // Switch to Campus Visits tab
                          setActiveTab('visits');
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-[#2590FB] to-[#0478EB] text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                      <Send className="w-4 h-4 text-white" />
                        {showRescheduleModal || isRescheduleMode ? 'Update' : 'Send Invitation'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campus Drive Full Details Modal */}
      {showVisitRequestModal && selectedVisitRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Campus Drive Full Details</h2>
                </div>
                <button
                  onClick={() => setShowVisitRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Company Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Company</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedVisitRequest.company.name}</p>
                    <p className="text-sm text-gray-600">{selectedVisitRequest.company.location}</p>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Drive Schedule</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>{selectedVisitRequest.visitDate}</p>
                      <p>{selectedVisitRequest.startTime} - {selectedVisitRequest.endTime}</p>
                      <p>{selectedVisitRequest.interviewMode}</p>
                      <p>{selectedVisitRequest.onCampus}</p>
                      <p className="font-medium">Slots</p>
                      <p>{selectedVisitRequest.slots}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Job Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Job Details</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedVisitRequest.jobTitle}</p>
                    <p className="text-sm text-gray-600">{selectedVisitRequest.jobLocation}</p>
                    <p className="text-sm text-gray-900 mt-2">{selectedVisitRequest.jobType}  {selectedVisitRequest.salary}</p>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">HR Contact Details</h3>
                    <p className="text-base font-semibold text-gray-900 mb-2">{selectedVisitRequest.hrContact.name}</p>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-700">{selectedVisitRequest.hrContact.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-700">{selectedVisitRequest.hrContact.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campus Visit Full Details Modal (for Campus Visits tab) */}
      {showCampusVisitDetailsModal && selectedCampusVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Campus Drive Full Details</h2>
                </div>
                <button
                  onClick={() => setShowCampusVisitDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - College/Company Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">College</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedCampusVisit.company?.name || 'College Name'}</p>
                    <p className="text-sm text-gray-600">{selectedCampusVisit.company?.location || selectedCampusVisit.venue}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Drive Schedule</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900">
                        {selectedCampusVisit.visitDate ? new Date(selectedCampusVisit.visitDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'Date not set'}
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedCampusVisit.startTime || '10:00'} - {selectedCampusVisit.endTime || '17:00'}
                      </p>
                      <p className="text-sm text-gray-900">{selectedCampusVisit.venue || 'Interview Mode'}</p>
                      <p className="text-sm text-gray-900">On Campus</p>
                      <p className="text-sm text-gray-900">{selectedCampusVisit.expectedCandidates || 50} students maximum</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Job Details & Contact */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Details</h3>
                    {selectedCampusVisit.jobRoles && selectedCampusVisit.jobRoles.length > 0 ? (
                      <>
                        <p className="text-base font-semibold text-gray-900">{selectedCampusVisit.jobRoles[0]}</p>
                        <p className="text-sm text-gray-600">{selectedCampusVisit.company?.location || selectedCampusVisit.venue}</p>
                        <p className="text-sm text-gray-900 mt-2">Full-Time  $8-12 LPA</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">Job details not specified</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Placement Officer</h3>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedCampusVisit.contactPerson || 'Dr. Rajesh Kumar'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-900">placement@abc.ac.in</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-900">
                        {selectedCampusVisit.contactNumber || '+91 1011001101'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Campus Drive Modal */}
      {showRescheduleModal && selectedVisitRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-gray-900" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Reschedule Campus Drive - {selectedVisitRequest.company.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 ml-7">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedVisitRequest.company.location}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedVisitRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Company and Job Info Box */}
              <div className="bg-blue-50 rounded-2xl p-5 mb-8 border border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{selectedVisitRequest.company.name}</p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedVisitRequest.company.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{selectedVisitRequest.jobTitle}</p>
                  </div>
                </div>
              </div>

              {/* Drive Schedule Form */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Drive Schedule</h3>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Visit Date<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={visitForm.visitDate}
                      onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900"
                      placeholder="Pick a date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Interview Mode<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={visitForm.venue || "Online"}
                        onChange={(e) => setVisitForm({ ...visitForm, venue: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 appearance-none"
                      >
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Start Time<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={visitForm.startTime}
                      onChange={(e) => setVisitForm({ ...visitForm, startTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900"
                      placeholder="--:--"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      End Time<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={visitForm.duration}
                      onChange={(e) => setVisitForm({ ...visitForm, duration: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900"
                      placeholder="--:--"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Maximum Students Slots
                  </label>
                  <input
                    type="number"
                    value={visitForm.expectedCandidates}
                    onChange={(e) => setVisitForm({ ...visitForm, expectedCandidates: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Meet Link<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={visitForm.meetingLink}
                    onChange={(e) => setVisitForm({ ...visitForm, meetingLink: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900"
                    placeholder="http:str.googledemo.meetlink.co"
                  />
                </div>

                {/* Placement Officer Contact */}
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <h4 className="text-center text-sm font-medium text-gray-500 mb-4">Placement Officer Contact</h4>
                  
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                    <div className="flex items-start gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-gray-700 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{visitForm.contactPerson || 'Dr. Rajesh Kumar'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {visitForm.contactNumber || 'placement@abc.ac.in'}  {visitForm.contactNumber || '+91 1011001101'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-700 mt-1 opacity-0" />
                      <p className="text-sm text-gray-600">
                        {visitForm.contactPerson || 'Dr. Rajesh Kumar'} will receive a confirmation email and can reschedule if needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setSelectedVisitRequest(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back to Job Details
                  </button>
                  <button
                    onClick={() => {
                      // Handle save and continue - update the visit request
                      console.log('Rescheduled visit:', visitForm);
                      setShowRescheduleModal(false);
                      setSelectedVisitRequest(null);
                    }}
                    className="flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-colors"
                    style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeConnectionManager;
