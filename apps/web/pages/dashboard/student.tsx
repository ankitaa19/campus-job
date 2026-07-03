import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient, API_ENDPOINTS } from '../../utils/api';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import DashboardSection from '../../components/student/DashboardSection';
import ApplicationsSection from '../../components/student/ApplicationsSection';
import InterviewsSection from '../../components/student/InterviewsSection';
import JobsSection from '../../components/student/JobsSection';
import MyCollegeSection from '../../components/student/MyCollegeSection';
import ProfileSection from '../../components/student/ProfileSection';
import EnquiriesSection from '../../components/student/EnquiriesSection';
import CommunicationsSection from '../../components/student/CommunicationsSection';
import AssignmentsSection from '../../components/student/AssignmentsSection';
import ResumeBuilderSection from '../../components/student/ResumeBuilderSection';
import {
  Home,
  Briefcase,
  FileText,
  Calendar,
  GraduationCap,
  User,
  MessageSquare,
  ClipboardList,
  FileEdit,
  LogOut,
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStudentData();
    
    // Handle section query parameter for navigation
    const section = router.query.section as string;
    if (section) {
      setActiveTab(section);
    }
  }, [router.query.section]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        localStorage.clear(); // Clear any stale data
        router.push('/login');
        return;
      }

      console.log('Fetching profile with token:', token.substring(0, 20) + '...');

      // Fetch student profile using apiClient (interceptor adds auth header automatically)
      const profileResponse = await apiClient.get(API_ENDPOINTS.STUDENT_PROFILE);
      const profileData = profileResponse.data?.data || profileResponse.data;
      
      console.log('Profile data received:', profileData);
      setStudentInfo(profileData);

    } catch (error: any) {
      console.error('Error fetching student data:', error);
      
      if (error.response?.status === 401) {
        console.log('Unauthorized - clearing storage and redirecting to login');
        localStorage.clear(); // Clear invalid token
        router.push('/login');
      } else if (error.response?.status === 404) {
        console.error('Profile not found');
        setError('Profile not found. Please contact support.');
      } else {
        console.error('Network or server error:', error.message);
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Profile</h2>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => {
                setError('');
                fetchStudentData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
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
        collegeName={`${studentInfo?.firstName || 'Student'} ${studentInfo?.lastName || ''}`}
        userRole="student"
      />
      
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-none bg-white border-r border-gray-200">
          {/* Navigation Items */}
          <div className="px-3 py-6">
            <nav className="space-y-2">
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'dashboard'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </button>

              <button
                onClick={() => handleTabChange('enquiries')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'enquiries'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="mr-3 h-5 w-5" />
                My Enquiries
              </button>

              <button
                onClick={() => handleTabChange('resume')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'resume'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileEdit className="mr-3 h-5 w-5" />
                Resume Builder
              </button>

              <button
                onClick={() => handleTabChange('applications')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'applications'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                My Applications
              </button>

              <button
                onClick={() => handleTabChange('jobs')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'jobs'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Jobs
              </button>

              <button
                onClick={() => handleTabChange('interviews')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'interviews'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Interviews
              </button>

              <button
                onClick={() => handleTabChange('assignments')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'assignments'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ClipboardList className="mr-3 h-5 w-5" />
                Assignment
              </button>

              <button
                onClick={() => handleTabChange('communications')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'communications'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Communications
              </button>

              <button
                onClick={() => handleTabChange('college')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'college'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="mr-3 h-5 w-5" />
                My College
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="mr-3 h-5 w-5" />
                My Profile
              </button>
            </nav>
          </div>
          
          {/* Logout */}
          <div className="px-3 pb-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/login');
              }}
              className="w-full flex items-center px-4 py-3 mt-4 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === 'dashboard' && <DashboardSection studentInfo={studentInfo} />}
          {activeTab === 'enquiries' && <EnquiriesSection studentInfo={studentInfo} />}
          {activeTab === 'resume' && <ResumeBuilderSection studentInfo={studentInfo} refreshData={fetchStudentData} />}
          {activeTab === 'applications' && <ApplicationsSection studentInfo={studentInfo} />}
          {activeTab === 'jobs' && <JobsSection studentInfo={studentInfo} />}
          {activeTab === 'interviews' && <InterviewsSection studentInfo={studentInfo} />}
          {activeTab === 'assignments' && <AssignmentsSection studentInfo={studentInfo} />}
          {activeTab === 'communications' && <CommunicationsSection studentInfo={studentInfo} />}
          {activeTab === 'college' && <MyCollegeSection studentInfo={studentInfo} />}
          {activeTab === 'profile' && <ProfileSection studentInfo={studentInfo} refreshData={fetchStudentData} />}
        </main>
      </div>
    </div>
  );
}
