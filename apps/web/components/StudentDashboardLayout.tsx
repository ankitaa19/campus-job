import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import CollegeRegistrationNavbar from './CollegeRegistrationNavbar';
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
  LogOut 
} from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

interface StudentDashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const StudentDashboardLayout: React.FC<StudentDashboardLayoutProps> = ({ children, activeTab = 'resume' }) => {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    fetchStudentInfo();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_PROFILE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success || response.data.data) {
        setStudentInfo(response.data.data || response.data);
      }
    } catch (err: any) {
      console.error('Error fetching student info:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        console.log('Unauthorized - clearing token and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        router.push('/login');
      }
    }
  };

  const handleTabChange = (tab: string) => {
    router.push('/dashboard/student');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CollegeRegistrationNavbar 
        status="approved" 
        collegeName={`${studentInfo?.firstName || 'Student'} ${studentInfo?.lastName || ''}`} 
      />
      
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-none bg-white border-r border-gray-200">
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
                onClick={() => router.push('/resume-builder')}
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboardLayout;
