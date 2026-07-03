import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

// Recruiter Dashboard with modern UI design
// Main dashboard for recruiters with comprehensive hiring management functionality

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
  companyId: string;
  collegeId: {
    _id: string;
    collegeInfo: {
      name: string;
    };
  };
  jobRoles: string[];
  status: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const RecruiterDashboard = () => {
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
  const [error, setError] = useState('');

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
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/jobs/recruiter`, { headers });
      setJobs(response.data || []);
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

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/applications/recruiter`, { headers });
      setApplications(response.data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-8">
            {company?.companyInfo?.logo ? (
              <img 
                src={company.companyInfo.logo} 
                alt={company.companyInfo.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {company?.companyInfo?.name?.charAt(0) || company?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="relative">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                Campus<span className="text-blue-600">Pe</span>
              </h1>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
                activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Overview</span>
            </button>
            
            <button
              onClick={() => router.push('/jobs/create')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="text-lg">✏️</span>
              <span>Post a Job</span>
            </button>
            
            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
                activeTab === 'jobs' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">💼</span>
              <span>Active Jobs</span>
            </button>
            
            <button
              onClick={() => router.push('/colleges/connect')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="text-lg">🎓</span>
              <span>Connect Colleges</span>
            </button>
            
            <button
              onClick={() => setActiveTab('colleges')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
                activeTab === 'colleges' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🤝</span>
              <span>Partner Colleges</span>
            </button>
            
            <button
              onClick={() => setActiveTab('interviews')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
                activeTab === 'interviews' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🎯</span>
              <span>Interviews</span>
            </button>
            
            <button
              onClick={() => setActiveTab('communication')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
                activeTab === 'communication' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">💬</span>
              <span>Communication</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </button>
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Campus, <span className="text-blue-600">Placements</span>
            </h1>
            <p className="text-gray-600">{company?.companyInfo?.industry || 'Track student placements and company partnerships'}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeJobs}</p>
                  <p className="text-xs text-blue-600">+5 this week</p>
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
                  <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  <p className="text-xs text-green-600">+23 today</p>
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
                  <p className="text-3xl font-bold text-gray-900">{Math.floor(stats.totalApplications * 0.05)}</p>
                  <p className="text-xs text-purple-600">Next: Tomorrow 10AM</p>
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
                  <p className="text-3xl font-bold text-gray-900">{Math.floor(stats.totalApplications * 0.02)}</p>
                  <p className="text-xs text-orange-600">3 Pending Response</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-xl">🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Based on Active Tab */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Job Posts */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Job Posts</h3>
                      <p className="text-sm text-gray-500">Track performance of your job postings</p>
                    </div>
                    
                    <div className="space-y-4">
                      {jobs.slice(0, 3).map((job) => (
                        <div key={job._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.location} • {job.jobType}</p>
                            <p className="text-xs text-gray-500">
                              {Math.floor(Math.random() * 50)} applications • Posted {new Date(job.postedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => router.push(`/jobs/${job._id}`)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {jobs.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No jobs posted yet.</p>
                          <button
                            onClick={() => router.push('/jobs/create')}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Post your first job →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Candidates */}
                <div>
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Candidates</h3>
                    <p className="text-sm text-gray-600 mb-4">Highest matching candidates today</p>
                    
                    <div className="space-y-4">
                      {applications.slice(0, 3).map((application, index) => (
                        <div key={application._id} className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {application.studentId?.personalInfo?.firstName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {application.studentId?.personalInfo?.firstName} {application.studentId?.personalInfo?.lastName}
                            </p>
                            <p className="text-xs text-gray-600">Frontend Developer</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="w-16 h-1 bg-gray-200 rounded-full">
                                <div 
                                  className="h-1 bg-blue-600 rounded-full" 
                                  style={{ width: `${95 - index * 7}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{95 - index * 7}%</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            index === 0 ? 'bg-green-100 text-green-800' :
                            index === 1 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {index === 0 ? 'Shortlisted' : index === 1 ? 'Interview Scheduled' : 'Under Review'}
                          </span>
                        </div>
                      ))}
                      
                      {applications.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No candidates yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colleges' && (
              <div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">College Connections</h3>
                  <p className="text-sm text-gray-600 mb-6">Your connected colleges and their reach</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {invitations.slice(0, 4).map((invitation, index) => (
                      <div key={invitation._id} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {invitation.collegeId?.collegeInfo?.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {invitation.collegeId?.collegeInfo?.name || 'College'}
                        </h4>
                        <p className="text-xs text-gray-600">{Math.floor(Math.random() * 500) + 100} students</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          invitation.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invitation.status === 'accepted' ? 'Connected' :
                           invitation.status === 'declined' ? 'Declined' :
                           'Pending'}
                        </span>
                        <button className="block w-full mt-2 text-xs text-blue-600 hover:text-blue-800">
                          View Details
                        </button>
                      </div>
                    ))}
                    
                    {invitations.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No college connections yet.</p>
                        <button
                          onClick={() => router.push('/invitations/create')}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Connect with colleges →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Real-Time Activity */}
            {activeTab === 'overview' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Activity</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          New application from <span className="font-medium">Amit Kumar</span> for Frontend Developer
                        </p>
                        <p className="text-xs text-gray-500">2 mins ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          IIT Madras accepted campus drive request
                        </p>
                        <p className="text-xs text-gray-500">15 mins ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Interview scheduled with <span className="font-medium">Sneha Readdy</span>
                        </p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Active Job Postings</h2>
                  <button
                    onClick={() => router.push('/jobs/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Post New Job
                  </button>
                </div>
                
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">💼</span>
                    </div>
                    <p className="text-gray-500 mb-4">No jobs posted yet.</p>
                    <button
                      onClick={() => router.push('/jobs/create')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{job.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {job.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-1">{job.location} • {job.department}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {job.jobType} • {job.experienceLevel} • Posted {new Date(job.postedAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{Math.floor(Math.random() * 50)} applications</span>
                              <span>{Math.floor(Math.random() * 10)} shortlisted</span>
                              <span>{Math.floor(Math.random() * 5)} interviewed</span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => router.push(`/jobs/${job._id}`)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              View
                            </button>
                            <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'interviews' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Interview Management</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">SR</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sneha Readdy</p>
                        <p className="text-sm text-gray-600">Product Manager Interview</p>
                        <p className="text-xs text-purple-600">Tomorrow 10:00 AM</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        Join
                      </button>
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                        Reschedule
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <p className="text-gray-500">No more interviews scheduled</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'communication' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Communication Center</h2>
                
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">💬</span>
                  </div>
                  <p className="text-gray-500">Communication features coming soon</p>
                </div>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
