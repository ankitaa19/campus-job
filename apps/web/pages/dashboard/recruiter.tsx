import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { PlusCircle, GraduationCap, Target, Users, Briefcase, BarChart3, Handshake, MessageSquare, Settings, LogOut, Calendar, FileText } from 'lucide-react';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import PostJobSection from '../../components/recruiter/PostJobSection';
import JobsWrapper from '../../components/recruiter/JobsWrapper';
import PartnerCollegesSection from '../../components/recruiter/PartnerCollegesSection';
import ConnectCollegesSection from '../../components/recruiter/ConnectCollegesSection';
import InterviewsSection from '../../components/recruiter/InterviewsSection';
import CommunicationSection from '../../components/recruiter/CommunicationSection';
import SettingsSection from '../../components/recruiter/SettingsSection';
import AssignmentsSection, { Assignment } from '../../components/recruiter/AssignmentsSection';
import { Company, Job, JobDraft, Invitation } from '../../types/recruiter';

// Recruiter Dashboard with modern UI design
// Main dashboard for recruiters with comprehensive hiring management functionality
//
// DATABASE INTEGRATION MAPPING:
// - Company Data: Recruiter model (IRecruiter) -> companyInfo, recruiterProfile, hiringInfo
// - Jobs Data: Job model (IJob) -> title, description, jobType, department, locations, etc.
// - Applications: Application model (IApplication) -> studentId, jobId, currentStatus, interviews
// - College Connections: Connection model -> requester, target, status, createdAt
// - Statistics: Aggregated from multiple models via /api/recruiters/stats
// - Real-time Activities: Activity/Notification models for live updates

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const RecruiterDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Handle section query parameter for navigation
  useEffect(() => {
    const section = router.query.section as string;
    if (section) {
      setActiveTab(section);
    }
  }, [router.query.section]);
  
  // Company Profile Data Structure - matches Recruiter model in backend
  // Future DB Integration: Fetch from /api/recruiters/profile endpoint
  // Fields match IRecruiter interface: companyInfo, recruiterProfile, hiringInfo, etc.
  const [company, setCompany] = useState<Company | null>({
    _id: '674d1a1b2c3d4e5f6g7h8i9o',
    email: 'company@techcorp.com',
    companyInfo: {
      name: 'TechCorp Solutions',
      industry: 'Technology',
      logo: 'https://via.placeholder.com/150/0066cc/ffffff?text=TechCorp',
      website: 'www.techcorp.com',
      description: 'We are a leading technology company specializing in innovative software solutions.',
      size: 'medium',
      foundedYear: 2015,
      headquarters: {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      }
    },
    recruiterProfile: {
      firstName: 'John',
      lastName: 'Doe',
      designation: 'HR Manager',
      department: 'Human Resources'
    },
    phone: '+91 9876543210',
    whatsappNumber: '+91 9876543210',
    recruiterEmail: 'hr@techcorp.com',
    verificationDocuments: [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    ],
    isVerified: true,
    approvalStatus: 'approved'
  });
  // Dashboard Statistics - matches backend stats structure
  // Future DB Integration: Fetch from /api/recruiters/stats endpoint
  // Aggregates data from Job, Application, and Connection models
  const [stats, setStats] = useState({
    totalJobs: 15,
    activeJobs: 12,
    totalApplications: 156,
    pendingApplications: 23,
    acceptedApplications: 8,
    totalInvitations: 5,
    pendingInvitations: 2,
    interviewsScheduled: 8,
    offersMade: 5,
    companiesConnected: 4
  });
  
  // Assignments state - stored globally for all jobs
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recruiter-assignments');
      if (saved) {
        return JSON.parse(saved);
      }
      // Sample data for testing
      return [
        {
          id: 'asn-001',
          candidateId: 'cand-001',
          candidateName: 'Aditi Sharma',
          candidateEmail: 'aditi.sharma@example.com',
          college: 'ABC University',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-25',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          assignedAt: '2025-10-20',
          status: 'Sent',
        },
        {
          id: 'asn-002',
          candidateId: 'cand-002',
          candidateName: 'Priya Singh',
          candidateEmail: 'priya.singh@example.com',
          college: 'ABC University',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-25',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          assignedAt: '2025-10-20',
          status: 'Sent',
        },
        {
          id: 'asn-003',
          candidateId: 'cand-003',
          candidateName: 'Saurav Patel',
          candidateEmail: 'saurav.patel@example.com',
          college: 'ABC University',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-25',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          assignedAt: '2025-10-20',
          status: 'Sent',
        },
        {
          id: 'asn-004',
          candidateId: 'cand-004',
          candidateName: 'Kriti Sanon',
          candidateEmail: 'kriti.sanon@example.com',
          college: 'ABC University',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-25',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          assignedAt: '2025-10-20',
          status: 'Sent',
        },
        {
          id: 'asn-005',
          candidateId: 'cand-005',
          candidateName: 'Karan Singh',
          candidateEmail: 'karan.singh@example.com',
          college: 'ABC College',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-22',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          submittedFiles: [
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            },
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            }
          ],
          assignedAt: '2025-10-20',
          status: 'Received',
        },
        {
          id: 'asn-006',
          candidateId: 'cand-006',
          candidateName: 'Divyansh Patel',
          candidateEmail: 'divyansh.patel@example.com',
          college: 'ABC University',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-22',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          submittedFiles: [
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            },
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            }
          ],
          assignedAt: '2025-10-20',
          status: 'Received',
        },
        {
          id: 'asn-007',
          candidateId: 'cand-007',
          candidateName: 'Rohan Kumar',
          candidateEmail: 'rohan.kumar@example.com',
          college: 'ABC University',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-22',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          submittedFiles: [
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            },
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            }
          ],
          assignedAt: '2025-10-20',
          status: 'Received',
        },
        {
          id: 'asn-008',
          candidateId: 'cand-008',
          candidateName: 'Raj Dokaniya',
          candidateEmail: 'raj.dokaniya@example.com',
          college: 'ABC College',
          note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
          deadline: '2025-10-22',
          assignmentFile: {
            name: 'Assignment_Task_T1.pdf',
            size: 3450000,
            url: '#'
          },
          submittedFiles: [
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            },
            {
              name: 'Report_name_T1.pdf',
              size: 3350000,
              submittedAt: '2025-10-21'
            }
          ],
          assignedAt: '2025-10-20',
          status: 'Reviewed',
          reviewAction: 'Approved'
        }
      ];
    }
    return [];
  });

  // Persist assignments to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recruiter-assignments', JSON.stringify(assignments));
    }
  }, [assignments]);

  // Jobs Data - matches Job model structure (IJob interface)
  // Future DB Integration: Fetch from /api/jobs/recruiter endpoint
  // Fields: title, description, jobType, department, recruiterId, locations, etc.
  const [activeJobs, setActiveJobs] = useState<Job[]>([
    {
      _id: '674d1a1b2c3d4e5f6g7h8i9j',
      title: 'Senior Frontend Developer',
      location: 'Mumbai, Maharashtra',
      department: 'Engineering',
      jobType: 'full-time',
      experienceLevel: 'senior',
      isActive: true,
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      _id: '674d1a1b2c3d4e5f6g7h8i9k',
      title: 'Product Manager Intern',
      location: 'Bangalore, Karnataka',
      department: 'Product',
      jobType: 'internship',
      experienceLevel: 'entry',
      isActive: true,
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '674d1a1b2c3d4e5f6g7h8i9l',
      title: 'Community Volunteer',
      location: 'Delhi, NCR',
      department: 'Community',
      jobType: 'part-time',
      experienceLevel: 'entry',
      isActive: true,
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '674d1a1b2c3d4e5f6g7h8i9m',
      title: 'Data Scientist',
      location: 'Pune, Maharashtra',
      department: 'Data Science',
      jobType: 'full-time',
      experienceLevel: 'mid',
      isActive: false,
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [draftJobs, setDraftJobs] = useState<JobDraft[]>([]);
  const [jobPrefillData, setJobPrefillData] = useState<any>(null); // Store prefill data for "Post Similar Job"
  // College Invitations/Connections Data - matches Connection model
  // Future DB Integration: Fetch from /api/invitations/recruiter or /api/connections
  // Relationships between recruiters and colleges for campus recruitment
  const [invitations, setInvitations] = useState<Invitation[]>([
    {
      _id: '674d1a1b2c3d4e5f6g7h8i9n',
      companyId: '674d1a1b2c3d4e5f6g7h8i9o',
      collegeId: {
        _id: '674d1a1b2c3d4e5f6g7h8i9p',
        collegeInfo: {
          name: 'IIT Bombay',
          establishedYear: 1958,
          location: {
            state: 'Maharashtra',
            city: 'Mumbai'
          }
        }
      },
      jobRoles: ['Software Engineer', 'Data Scientist'],
      status: 'accepted',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '674d1a1b2c3d4e5f6g7h8i9q',
      companyId: '674d1a1b2c3d4e5f6g7h8i9o',
      collegeId: {
        _id: '674d1a1b2c3d4e5f6g7h8i9r',
        collegeInfo: {
          name: 'BITS Pilani',
          establishedYear: 1964,
          location: {
            state: 'Rajasthan',
            city: 'Pilani'
          }
        }
      },
      jobRoles: ['Product Manager', 'UX Designer'],
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    
    // Handle tab query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
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
      
      // Merge with default values to ensure all properties exist
      const defaultStats = {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        acceptedApplications: 0,
        totalInvitations: 0,
        pendingInvitations: 0,
        interviewsScheduled: 0,
        offersMade: 0,
        companiesConnected: 0
      };
      
      setStats({ ...defaultStats, ...response.data });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      // Keep the dummy data if API fails
      console.log('Using dummy stats data due to API error');
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/jobs/recruiter`, { headers });
      setActiveJobs(response.data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/invitations/recruiter`, { headers });
      setInvitations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={company?.companyInfo?.name || 'Company'}
          userRole="employer"
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={company?.companyInfo?.name || 'Company'}
          userRole="employer"
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Full Width Header */}
      <CollegeRegistrationNavbar 
        status="approved" 
        collegeName={company?.companyInfo?.name || 'Company'}
        userRole="employer"
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
                    : 'text-gray-600 hover:bg-blue-50'
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
                    : 'text-gray-600 hover:bg-blue-50'
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
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Manage Jobs
              </button>
              
              <button
                onClick={() => setActiveTab('connect-colleges')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'connect-colleges'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <GraduationCap className="mr-3 h-5 w-5" />
                Connect Colleges
              </button>
              
              <button
                onClick={() => setActiveTab('colleges')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'colleges'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-blue-50'
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
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <Target className="mr-3 h-5 w-5" />
                Interviews
              </button>
              
              <button
                onClick={() => setActiveTab('assignments')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'assignments'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                Assignments
              </button>
              
              <button
                onClick={() => setActiveTab('communication')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'communication'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-blue-50'
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
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
            </nav>
          </div>
          
          {/* Logout */}
          <div className="px-3 pb-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="w-full flex items-center px-4 py-3 mt-4 text-sm font-medium rounded-md text-gray-600 hover:bg-blue-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6 relative">
          {activeTab === 'overview' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Campus, <span className="text-blue-600">Placements</span>
                </h1>
                <p className="mt-2 text-gray-600">Track student placements and company partnerships at a glance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Active Jobs', value: (stats.activeJobs || 0).toString(), caption: '+2 This week', accent: '#2590FB', icon: Briefcase },
                  { title: 'Total Applications', value: (stats.totalApplications || 0).toString(), caption: '+23 Today', accent: '#22C55E', icon: Users },
                  { title: 'Interview Scheduled', value: (stats.interviewsScheduled || 0).toString(), caption: 'Next: Tomorrow 10AM', accent: '#8B5CF6', icon: Calendar },
                  { title: 'Offers Made', value: (stats.offersMade || 0).toString(), caption: '3 Pending response', accent: '#F97316', icon: Target }
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
                        <p className="mt-1 text-xs font-medium" style={{ color: card.accent }}>
                          {card.caption}
                        </p>
                      </div>
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white"
                        style={{ background: `linear-gradient(135deg, ${card.accent} 0%, ${card.accent} 100%)` }}
                      >
                        <card.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Overview Tab - Additional Sections */}
          {activeTab === 'overview' && (
            <div className="space-y-6 mt-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                {/* Recent Job Posts */}
                <div className="lg:col-span-7">
                  <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Job Posts</h3>
                    <p className="text-sm text-gray-500 mb-4">Track performance of your job postings</p>
                    
                    <div className="space-y-6">
                      {activeJobs.slice(0, 4).map((job, index) => {
                        const applicationCounts = [23, 45, 12, 8];
                        const salaryRanges = ['₹4-8 LPA', '₹2-3 LPA', 'Unpaid', '₹6-12 LPA'];
                        const statusInfo = job.isActive 
                          ? { color: '#00C950', text: 'Active' }
                          : index === 3 
                            ? { color: '#DF3C3C', text: 'Closing soon' }
                            : { color: '#FFA500', text: 'Paused' };
                        
                        const jobTypeDisplayMap: { [key: string]: string } = {
                          'full-time': 'Full-Time',
                          'part-time': 'Part-Time',
                          'internship': 'Internship',
                          'contract': 'Contract',
                          'freelance': 'Freelance'
                        };

                        const daysAgo = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <div key={job._id} className="flex items-center justify-between p-6 bg-white rounded-lg border" style={{borderColor: '#B8BBD2'}}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-3 flex-wrap">
                                <h4 className="font-normal text-gray-900 text-base">{job.title}</h4>
                                <span className="px-3 py-1 text-xs rounded-full border border-white text-black bg-white">
                                  {jobTypeDisplayMap[job.jobType] || job.jobType}
                                </span>
                                <span className="px-3 py-1 text-xs rounded-full text-white" style={{backgroundColor: statusInfo.color}}>
                                  {statusInfo.text}
                                </span>
                                {job.jobType === 'internship' && index === 1 && (
                                  <span className="px-3 py-1 text-xs rounded-full text-white" style={{backgroundColor: '#7F3DFF'}}>Unpaid</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {applicationCounts[index]} applications • Posted {daysAgo} days ago • {salaryRanges[index]}
                              </p>
                            </div>
                            <div className="flex items-center ml-4">
                              <button 
                                className="text-black text-sm font-medium hover:text-blue-600 transition-colors"
                                onClick={() => router.push(`/jobs/${job._id}`)}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Candidates */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Candidates</h3>
                    <p className="text-sm text-gray-600 mb-4">Highest matching candidates today</p>
                    
                    <div className="space-y-6">
                      {[
                        {
                          id: '674d1a1b2c3d4e5f6g7h8i91',
                          name: 'Sarah Johnson',
                          college: 'IIT Bombay',
                          position: 'Frontend Developer',
                          matchScore: 95,
                          status: 'Shortlisted',
                          statusColor: '#B8BBD2'
                        },
                        {
                          id: '674d1a1b2c3d4e5f6g7h8i92',
                          name: 'Rahul Sharma',
                          college: 'NIT Delhi',
                          position: 'Data Scientist',
                          matchScore: 88,
                          status: 'Interview Scheduled',
                          statusColor: '#B8BBD2'
                        },
                        {
                          id: '674d1a1b2c3d4e5f6g7h8i93',
                          name: 'Priya Patel',
                          college: 'BITS Pilani',
                          position: 'Product Manager',
                          matchScore: 92,
                          status: 'Under Review',
                          statusColor: '#B8BBD2'
                        }
                      ].map((candidate) => (
                        <div key={candidate.id}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-black text-base">{candidate.name}</p>
                            <span className="text-xl font-bold text-black">{candidate.matchScore}%</span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">{candidate.college}</p>
                          <p className="text-sm text-gray-400 mb-3">{candidate.position}</p>
                          <div className="flex items-center justify-end mb-2">
                            <span 
                              className="px-3 py-1 text-xs rounded-full border bg-white text-black" 
                              style={{borderColor: candidate.statusColor}}
                            >
                              {candidate.status}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ width: `${candidate.matchScore}%`, backgroundColor: '#448FFE' }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* College Connections */}
            {activeTab === 'overview' && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">College Connections</h3>
                <p className="text-sm text-gray-600 mb-6">Your connected colleges and their reach</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      collegeId: '674d1a1b2c3d4e5f6g7h8i9p',
                      name: 'IIT Bombay',
                      establishedYear: 1958,
                      location: { city: 'Mumbai', state: 'Maharashtra' },
                      studentsCount: 2450,
                      activeJobs: 8,
                      connectionStatus: 'connected',
                      statusColor: '#00A63E',
                      statusText: 'Connected'
                    },
                    {
                      collegeId: '674d1a1b2c3d4e5f6g7h8i9s',
                      name: 'NIT Delhi',
                      establishedYear: 1961,
                      location: { city: 'New Delhi', state: 'Delhi' },
                      studentsCount: 1890,
                      activeJobs: 6,
                      connectionStatus: 'connected',
                      statusColor: '#00A63E',
                      statusText: 'Connected'
                    },
                    {
                      collegeId: '674d1a1b2c3d4e5f6g7h8i9r',
                      name: 'BITS Pilani',
                      establishedYear: 1964,
                      location: { city: 'Pilani', state: 'Rajasthan' },
                      studentsCount: 3200,
                      activeJobs: 4,
                      connectionStatus: 'pending',
                      statusColor: '#F5C310',
                      statusText: 'Pending'
                    },
                    {
                      collegeId: '674d1a1b2c3d4e5f6g7h8i9t',
                      name: 'DTU',
                      establishedYear: 1941,
                      location: { city: 'New Delhi', state: 'Delhi' },
                      studentsCount: 2800,
                      activeJobs: 5,
                      connectionStatus: 'connected',
                      statusColor: '#00A63E',
                      statusText: 'Connected'
                    }
                  ].map((college) => (
                    <div key={college.collegeId} className="p-6 bg-white rounded-lg border" style={{borderColor: '#E9E4F2'}}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 text-lg">{college.name}</h4>
                        <span 
                          className="px-3 py-1 text-xs rounded-full text-white" 
                          style={{backgroundColor: college.statusColor}}
                        >
                          {college.statusText}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Users className="w-4 h-4" />
                        <span>{college.studentsCount.toLocaleString()} students</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                        <Briefcase className="w-4 h-4" />
                        <span>{college.activeJobs} active jobs</span>
                      </div>
                      <div className="flex justify-center">
                        <button 
                          className="px-6 py-2 rounded-full text-sm hover:bg-blue-100 transition-colors" 
                          style={{backgroundColor: '#E6F2FD', color: '#0377EB'}}
                          onClick={() => router.push(`/colleges/${college.collegeId}/profile`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-Time Activity */}
            {activeTab === 'overview' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      {
                        id: '674d1a1b2c3d4e5f6g7h8i94',
                        type: 'application',
                        color: '#00C950',
                        message: 'New application from Amit Kumar for Frontend Developer',
                        studentId: '674d1a1b2c3d4e5f6g7h8i95',
                        jobId: '674d1a1b2c3d4e5f6g7h8i9j',
                        timestamp: '2 mins ago'
                      },
                      {
                        id: '674d1a1b2c3d4e5f6g7h8i96',
                        type: 'college_approval',
                        color: '#1484F3',
                        message: 'IIT Madras accepted campus drive request',
                        collegeId: '674d1a1b2c3d4e5f6g7h8i97',
                        timestamp: '15 mins ago'
                      },
                      {
                        id: '674d1a1b2c3d4e5f6g7h8i98',
                        type: 'interview',
                        color: '#7F3DFF',
                        message: 'Interview scheduled with Sneha Readdy',
                        studentId: '674d1a1b2c3d4e5f6g7h8i99',
                        interviewId: '674d1a1b2c3d4e5f6g7h8i9a',
                        timestamp: '1 hour ago'
                      }
                    ].map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: activity.color}}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {activity.type === 'application' && (
                              <>New application from <span className="font-medium">Amit Kumar</span> for Frontend Developer</>
                            )}
                            {activity.type === 'college_approval' && (
                              <>IIT Madras accepted campus drive request</>
                            )}
                            {activity.type === 'interview' && (
                              <>Interview scheduled with <span className="font-medium">Sneha Readdy</span></>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {activeTab === 'colleges' ? (
            <PartnerCollegesSection
              invitations={invitations}
              onCreateInvitation={() => router.push('/invitations/create')}
            />
          ) : null}

          {activeTab === 'connect-colleges' ? (
            <ConnectCollegesSection />
          ) : null}

          {activeTab === 'jobs' ? (
            <JobsWrapper
              onCreateJob={() => {
                setJobPrefillData(null); // Clear prefill data when creating new job
                setActiveTab('post-job');
              }}
              onPostSimilarJob={(jobData) => {
                console.log('Post Similar Job - navigating to post-job with data:', jobData);
                setJobPrefillData(jobData); // Store prefill data
                setActiveTab('post-job');
              }}
            />
          ) : null}

          {activeTab === 'post-job' ? (
            <PostJobSection
              prefillData={jobPrefillData} // Pass prefill data to form
              onSaveDraft={(draft) => {
                setDraftJobs((prev) => [draft, ...prev]);
                setJobPrefillData(null); // Clear prefill data after saving
                setActiveTab('jobs');
              }}
              onJobPosted={(job) => {
                setActiveJobs((prev) => [job, ...prev]);
                setStats((prev) => ({
                  ...prev,
                  totalJobs: prev.totalJobs + 1,
                  activeJobs: prev.activeJobs + 1,
                }));
                setJobPrefillData(null); // Clear prefill data after posting
                setActiveTab('jobs');
              }}
            />
          ) : null}

          {activeTab === 'interviews' ? (
            <InterviewsSection />
          ) : null}

          {activeTab === 'assignments' ? (
            <AssignmentsSection assignments={assignments} />
          ) : null}

          {activeTab === 'communication' ? (
            <CommunicationSection />
          ) : null}

          {activeTab === 'settings' ? (
            <SettingsSection company={company} />
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
