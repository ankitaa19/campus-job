import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { BarChart3, PlusCircle, Briefcase, GraduationCap, Handshake, MessageSquare, Settings, Target, Users, TrendingUp, Calendar, Clock, MapPin, Phone, Mail } from 'lucide-react';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';

// Company Dashboard is essentially a recruiter dashboard with company-specific branding
// This creates a separate entry point for companies while reusing recruiter functionality

interface Company {
  _id: string;
  email: string;
  companyInfo: {
    name: string;
    industry: string;
    logo?: string;
  };
  isVerified: boolean;
  approvalStatus: string;
}

interface Job {
  _id: string;
  title: string;
  location: string;
  department: string;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  postedAt: string;
}

interface Application {
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

interface Invitation {
  _id: string;
  collegeId: {
    _id: string;
    collegeInfo: {
      name: string;
      establishedYear: number;
      location: {
        state: string;
        city: string;
      };
    };
  };
  jobRoles: string[];
  status: string;
  createdAt: string;
}

interface ConnectCollegeCard {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
  };
  students: number;
  courses: number;
  status: 'Active' | 'Pending' | 'Inactive';
  officer: string;
  phone: string;
  email: string;
  tags: string[];
  badges?: string[];
  requestStatus?: 'sent' | 'pending' | 'expired';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CompanyDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    totalInvitations: 0,
    pendingInvitations: 0
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Post Job Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    jobType: 'Full-Time',
    workMode: 'Full-Time',
    keySkills: '',
    workExperience: { min: 'Min', max: 'Max' },
    educationQualification: '',
    endDate: '',
    compensationType: '',
    payRange: { min: '', max: '' },
    numberOfOpenings: '0',
    location: '',
    description: '',
    // Part-Time specific
    dailyTimings: '',
    preferredWorkingDays: {
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false
    },
    // Internship specific
    internshipDuration: '',
    monthlyStipend: '',
    conversionPossibility: '',
    certificateProvided: '',
    // Contract specific
    contractDuration: '',
    paymentStructure: '',
    extensionPossibility: '',
    // Gig specific
    preferredWorkingDaysGig: {
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false
    },
    workSchedule: '',
    hoursPerSession: '',
    paymentStructureGig: '',
    gigType: '',
    commitment: '',
    specialRequirements: '',
    // Benefits (for Full-Time)
    benefits: {
      healthInsurance: false,
      flexibleWorkingHours: false,
      professionalDevelopmentBudget: false,
      stockOptions: false
    },
    // Toggles
    postToPublic: false,
    postToColleges: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Extract role from JWT token for more reliable authentication
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        if (userRole !== 'recruiter') {
          console.error(`Invalid user role for company dashboard: ${userRole}`);
          // Redirect to appropriate dashboard based on role
          if (userRole === 'student') {
            router.push('/dashboard/student');
          } else if (['college', 'college_admin', 'placement_officer'].includes(userRole)) {
            router.push('/dashboard/college');
          } else {
            router.push('/login');
          }
          return;
        }
      } catch (tokenError) {
        console.error('Error validating token:', tokenError);
        router.push('/login');
        return;
      }

      await Promise.all([
        fetchCompanyProfile(),
        fetchStats(),
        fetchJobs(),
        fetchApplications(),
        fetchInvitations()
      ]);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, { headers });
      setCompany(response.data);
    } catch (error: any) {
      console.error('Error fetching company profile:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setError('Failed to load company profile');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/jobs/company`, { headers });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/applications/company`, { headers });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/invitations/sent`, { headers });
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={company?.companyInfo?.name || 'Company'} 
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={company?.companyInfo?.name || 'Company'} 
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full Width Header */}
      <CollegeRegistrationNavbar 
        status="approved" 
        collegeName={company?.companyInfo?.name || 'Company'} 
      />
      
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-none bg-white border-r border-gray-200">
            {/* Navigation Items */}
            <div className="px-3 py-6">
              <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'overview'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Overview
              </button>
              
              <button
                onClick={() => setActiveTab('post-job')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'post-job'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PlusCircle className="mr-3 h-5 w-5" />
                Post a Job
              </button>
              
              <button
                onClick={() => setActiveTab('jobs')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'jobs'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Active Jobs
              </button>
              
              <button
                onClick={() => router.push('/colleges/connect')}
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
              >
                <GraduationCap className="mr-3 h-5 w-5" />
                Connect Colleges
              </button>
              
              <button
                onClick={() => setActiveTab('colleges')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'colleges'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Handshake className="mr-3 h-5 w-5" />
                Partner Colleges
              </button>
              
              <button
                onClick={() => setActiveTab('interviews')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'interviews'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Target className="mr-3 h-5 w-5" />
                Interviews
              </button>
              
              <button
                onClick={() => setActiveTab('communication')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'communication'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Communication
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'settings'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
              </nav>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{company?.companyInfo?.name || 'Company'}!</span>
            </h1>
            <p className="text-gray-600">Dashboard. Overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">15</p>
                  <p className="text-xs text-blue-600">+2 this week</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">156</p>
                  <p className="text-xs text-green-600">+28 today</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interview Scheduled</p>
                  <p className="text-3xl font-bold text-gray-900">8</p>
                  <p className="text-xs text-purple-600">Next: Tomorrow morning 10AM</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Offers Made</p>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-orange-600">3 Pending response</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-xl">🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Job Posts */}
              <div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Job Posts</h3>
                  <p className="text-sm text-gray-600 mb-4">Track performance of your job postings</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Senior Frontend Developer</h4>
                        <p className="text-sm text-gray-600">Full-Time</p>
                        <p className="text-xs text-gray-500">25 applications • Posted 3 days ago • 8.4-8 LPA</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">View</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Product Manager Intern</h4>
                        <p className="text-sm text-gray-600">Internship</p>
                        <p className="text-xs text-gray-500">45 applications • Posted 4 days ago • 8.4-8 LPA</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Urgent</span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">View</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Community Volunteer</h4>
                        <p className="text-sm text-gray-600">Volunteer</p>
                        <p className="text-xs text-gray-500">12 applications • Posted 2 days ago • 8.4-8 LPA</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">View</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Community Volunteer</h4>
                        <p className="text-sm text-gray-600">Full-Time</p>
                        <p className="text-xs text-gray-500">12 applications • Posted 2 days ago • 8.4-8 LPA</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Closing soon</span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">View</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Candidates */}
              <div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Candidates</h3>
                  <p className="text-sm text-gray-600 mb-4">Highest matching candidates today</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">S</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">Sarah Johnson</p>
                        <p className="text-xs text-gray-600">IIT Delhi</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-16 h-1 bg-gray-200 rounded-full">
                            <div className="h-1 bg-blue-600 rounded-full" style={{ width: '95%' }}></div>
                          </div>
                          <span className="text-xs text-gray-600">95%</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Shortlisted</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">R</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">Rahul Sharma</p>
                        <p className="text-xs text-gray-600">NIT Surathkal</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-16 h-1 bg-gray-200 rounded-full">
                            <div className="h-1 bg-blue-600 rounded-full" style={{ width: '88%' }}></div>
                          </div>
                          <span className="text-xs text-gray-600">88%</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Interview Scheduled</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">P</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">Priya Patel</p>
                        <p className="text-xs text-gray-600">IIT Bombay</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-16 h-1 bg-gray-200 rounded-full">
                            <div className="h-1 bg-blue-600 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span className="text-xs text-gray-600">92%</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Under Review</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={company?.companyInfo?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={company?.companyInfo?.industry || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={company?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {company?.isVerified && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        ✓ Verified
                      </span>
                    )}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      company?.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      company?.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company?.approvalStatus === 'approved' ? '✅ Approved' :
                       company?.approvalStatus === 'rejected' ? '❌ Rejected' :
                       '⏳ Pending Approval'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post a Job Form */}
          {activeTab === 'post-job' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Post a job - Hot vacancy</h2>
                  <p className="text-sm text-gray-600">Post job is the best talent for your company</p>
                </div>

                <div className="space-y-6">
                  {/* About Job Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About Job</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title*</label>
                        <input
                          type="text"
                          placeholder="Enter clear and specific title to get better response"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.title}
                          onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                        />
                      </div>

                      {/* Job Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Type*</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.jobType}
                          onChange={(e) => setJobForm({...jobForm, jobType: e.target.value, workMode: e.target.value})}
                        >
                          <option value="Full-Time">Full-Time</option>
                          <option value="Part-Time">Part-Time</option>
                          <option value="Internship">Internship</option>
                          <option value="Contract">Contract</option>
                          <option value="Gig/Flexible">Gig/Flexible</option>
                        </select>
                      </div>

                      {/* Key Skills */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Key Skills*</label>
                        <input
                          type="text"
                          placeholder="Add skills"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.keySkills}
                          onChange={(e) => setJobForm({...jobForm, keySkills: e.target.value})}
                        />
                      </div>

                      {/* Work Mode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode*</label>
                        <select 
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.workMode}
                          onChange={(e) => setJobForm({...jobForm, workMode: e.target.value})}
                        >
                          <option value="Select work mode">Select work mode</option>
                          <option value="Remote">Remote</option>
                          <option value="On-site">On-site</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>

                      {/* Work Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience (Years)*</label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <select 
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                              value={jobForm.workExperience.min}
                              onChange={(e) => setJobForm({...jobForm, workExperience: {...jobForm.workExperience, min: e.target.value}})}
                            >
                              <option value="Min">Min</option>
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5+</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">to</span>
                          <div className="flex-1 relative">
                            <select 
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                              value={jobForm.workExperience.max}
                              onChange={(e) => setJobForm({...jobForm, workExperience: {...jobForm.workExperience, max: e.target.value}})}
                            >
                              <option value="Max">Max</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="10+">10+</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Educational Qualification */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Educational Qualification*</label>
                        <input
                          type="text"
                          placeholder="Enter your educational qualification"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.educationQualification}
                          onChange={(e) => setJobForm({...jobForm, educationQualification: e.target.value})}
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date*</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.endDate}
                          onChange={(e) => setJobForm({...jobForm, endDate: e.target.value})}
                        />
                      </div>

                      {/* Number of Openings */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Openings*</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.numberOfOpenings}
                          onChange={(e) => setJobForm({...jobForm, numberOfOpenings: e.target.value})}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location*</label>
                        <input
                          type="text"
                          placeholder="Enter job location"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.location}
                          onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic sections based on work mode */}
                  {jobForm.workMode === 'Part-Time' && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">• Part-Time Arrangement</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Daily Timings */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Daily Timings*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select timing</option>
                            <option>Morning (9 AM - 1 PM)</option>
                            <option>Afternoon (1 PM - 5 PM)</option>
                            <option>Evening (5 PM - 9 PM)</option>
                          </select>
                        </div>

                        {/* Compensation Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Compensation Type*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select compensation</option>
                            <option>Hourly</option>
                            <option>Daily</option>
                            <option>Monthly</option>
                          </select>
                        </div>
                      </div>

                      {/* Preferred Working Days */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Preferred Working Days*</label>
                        <div className="flex flex-wrap gap-4">
                          {Object.keys(jobForm.preferredWorkingDays).map((day) => (
                            <label key={day} className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={jobForm.preferredWorkingDays[day]}
                                onChange={(e) => setJobForm({
                                  ...jobForm,
                                  preferredWorkingDays: {
                                    ...jobForm.preferredWorkingDays,
                                    [day]: e.target.checked
                                  }
                                })}
                              />
                              <span className="text-sm text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Select all days when candidate should be available to work</p>
                      </div>

                      {/* Pay Range */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pay Range*</label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-2">₹</span>
                            <input
                              type="number"
                              placeholder="Min"
                              className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={jobForm.payRange.min}
                              onChange={(e) => setJobForm({...jobForm, payRange: {...jobForm.payRange, min: e.target.value}})}
                            />
                          </div>
                          <span className="text-sm text-gray-500">to</span>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-2">₹</span>
                            <input
                              type="number"
                              placeholder="Max"
                              className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={jobForm.payRange.max}
                              onChange={(e) => setJobForm({...jobForm, payRange: {...jobForm.payRange, max: e.target.value}})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {jobForm.workMode === 'Full-Time' && (
                    <div className="space-y-6">
                      {/* Annual Salary Range */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary Range*</label>
                          <div className="flex items-center space-x-2">
                            <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>₹</option>
                            </select>
                            <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>Min</option>
                            </select>
                            <span className="text-sm text-gray-500">to</span>
                            <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>Max</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Joining Status</option>
                            <option>Immediate</option>
                            <option>15 days</option>
                            <option>30 days</option>
                            <option>60 days</option>
                          </select>
                        </div>
                      </div>

                      {/* Benefits & Perks */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'healthInsurance', label: 'Health Insurance' },
                            { key: 'flexibleWorkingHours', label: 'Flexible working hours' },
                            { key: 'professionalDevelopmentBudget', label: 'Professional development budget' },
                            { key: 'stockOptions', label: 'Stock options' }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-3"
                                checked={jobForm.benefits[key]}
                                onChange={(e) => setJobForm({
                                  ...jobForm,
                                  benefits: {
                                    ...jobForm.benefits,
                                    [key]: e.target.checked
                                  }
                                })}
                              />
                              <span className="text-sm text-gray-700">• {label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {jobForm.workMode === 'Internship' && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">• Internship Program Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Internship Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Internship Duration*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select duration</option>
                            <option>1 month</option>
                            <option>2 months</option>
                            <option>3 months</option>
                            <option>6 months</option>
                          </select>
                        </div>

                        {/* Compensation Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Compensation Type*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select compensation</option>
                            <option>Paid</option>
                            <option>Unpaid</option>
                            <option>Performance-based</option>
                          </select>
                        </div>

                        {/* Monthly Stipend */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Stipend (₹)*</label>
                          <input
                            type="number"
                            placeholder="Enter stipend amount"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter amount only for paid internships</p>
                        </div>

                        {/* Conversion Possibility */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Conversion Possibility</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select option</option>
                            <option>Yes, guaranteed</option>
                            <option>Performance-based</option>
                            <option>No</option>
                          </select>
                        </div>

                        {/* Certificate Provided */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Provided</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select certificate</option>
                            <option>Completion Certificate</option>
                            <option>Experience Certificate</option>
                            <option>Both</option>
                            <option>None</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {jobForm.workMode === 'Contract' && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">• Contract Assignment Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contract Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contract Duration*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select duration</option>
                            <option>1-3 months</option>
                            <option>3-6 months</option>
                            <option>6-12 months</option>
                            <option>1+ years</option>
                          </select>
                        </div>

                        {/* Payment Structure */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Structure*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select structure</option>
                            <option>Fixed project fee</option>
                            <option>Hourly rate</option>
                            <option>Monthly retainer</option>
                            <option>Milestone-based</option>
                          </select>
                        </div>

                        {/* Extension Possibility */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Extension Possibility</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select option</option>
                            <option>Yes, based on performance</option>
                            <option>Possible, subject to budget</option>
                            <option>No extension</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {jobForm.workMode === 'Gig/Flexible' && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">• Gig/Flexible Job Details</h3>
                      
                      {/* Preferred Working Days */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Preferred Working Days*</label>
                        <div className="flex flex-wrap gap-4">
                          {Object.keys(jobForm.preferredWorkingDaysGig).map((day) => (
                            <label key={day} className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={jobForm.preferredWorkingDaysGig[day]}
                                onChange={(e) => setJobForm({
                                  ...jobForm,
                                  preferredWorkingDaysGig: {
                                    ...jobForm.preferredWorkingDaysGig,
                                    [day]: e.target.checked
                                  }
                                })}
                              />
                              <span className="text-sm text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Select all days when candidate should be available to work</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Work Schedule */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Work Schedule*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select schedule</option>
                            <option>Flexible hours</option>
                            <option>Fixed shift</option>
                            <option>Project-based</option>
                          </select>
                        </div>

                        {/* Hours per Session */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Session*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select hours</option>
                            <option>1-2 hours</option>
                            <option>2-4 hours</option>
                            <option>4-6 hours</option>
                            <option>6+ hours</option>
                          </select>
                        </div>

                        {/* Payment Structure */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Structure*</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select payment</option>
                            <option>Per hour</option>
                            <option>Per task</option>
                            <option>Per project</option>
                            <option>Weekly</option>
                          </select>
                        </div>

                        {/* Rate Amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rate Amount (₹)*</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Gig Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gig Type</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select type</option>
                            <option>One-time project</option>
                            <option>Recurring work</option>
                            <option>Seasonal</option>
                          </select>
                        </div>

                        {/* Commitment Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Commitment Level</label>
                          <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Select commitment</option>
                            <option>Low - Flexible timing</option>
                            <option>Medium - Regular availability</option>
                            <option>High - Dedicated commitment</option>
                          </select>
                        </div>
                      </div>

                      {/* Special Requirements */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                        <textarea
                          placeholder="e.g. Own vehicle required, specific software needed, specific skills..."
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jobForm.specialRequirements}
                          onChange={(e) => setJobForm({...jobForm, specialRequirements: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Job Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description*</label>
                    <textarea
                      placeholder="Type role & responsibilities and key deliverables for this role in briefly"
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                    />
                  </div>

                  {/* Post Job Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Post This Job to Public</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={jobForm.postToPublic}
                          onChange={(e) => setJobForm({...jobForm, postToPublic: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Post This Job to Colleges</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={jobForm.postToColleges}
                          onChange={(e) => setJobForm({...jobForm, postToColleges: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4 pt-6">
                    <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      Save as Draft
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Post Job
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
