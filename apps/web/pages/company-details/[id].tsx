import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CompanyDetailsView from '../../components/CompanyDetailsView';
import { getCompanyData } from '../../utils/companyData';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
  Home,
  Users,
  Briefcase,
  Building2,
  Server,
  Book,
  BarChart2,
  Mic,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Activity,
  Settings2,
  UserCog,
} from 'lucide-react';

export default function CompanyDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [company, setCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('connections');

  useEffect(() => {
    if (id) {
      const companies = getCompanyData();
      const foundCompany = companies.find(c => c._id === id);
      setCompany(foundCompany || null);
    }
  }, [id]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      router.push('/dashboard/college');
    } else if (tab === 'students') {
      router.push('/dashboard/college');
    } else if (tab === 'connections') {
      router.push('/dashboard/college');
    } else if (tab === 'database') {
      router.push('/dashboard/college');
    } else if (tab === 'courses') {
      router.push('/dashboard/college');
    } else if (tab === 'interviews') {
      router.push('/dashboard/college');
    } else if (tab === 'fees') {
      router.push('/dashboard/college');
    } else if (tab === 'communications') {
      router.push('/dashboard/college');
    } else if (tab === 'analytics') {
      router.push('/dashboard/college');
    } else if (tab === 'automation') {
      router.push('/dashboard/college');
    } else if (tab === 'profile') {
      router.push('/dashboard/college');
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['college']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Full Width Navbar */}
        <CollegeRegistrationNavbar 
          collegeName="Demo College" 
          status="approved" 
        />

        <div className="flex flex-1 w-full overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 flex-none bg-white border-r border-gray-200">
              {/* Navigation Items */}
              <div className="px-3 py-6">
                <nav className="space-y-2">
                <button
                  onClick={() => handleTabChange('overview')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'overview'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className="mr-3 h-5 w-5" />
                  Dashboard
                </button>

                <button
                  onClick={() => handleTabChange('students')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'students'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  Admission Enquiries
                </button>

                <button
                  onClick={() => handleTabChange('placements')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'placements'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="mr-3 h-5 w-5" />
                  Connect Companies
                </button>

                <button
                  onClick={() => handleTabChange('connections')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'connections'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="mr-3 h-5 w-5" />
                  Hiring Companies
                </button>

                <button
                  onClick={() => handleTabChange('database')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'database'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Server className="mr-3 h-5 w-5" />
                  Student Database
                </button>

                <button
                  onClick={() => handleTabChange('courses')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'courses'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Book className="mr-3 h-5 w-5" />
                  Courses
                </button>

                <button
                  onClick={() => handleTabChange('interviews')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'interviews'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CalendarCheck className="mr-3 h-5 w-5" />
                  Interviews
                </button>

                <button
                  onClick={() => handleTabChange('fees')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'fees'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  Pay Fees
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
                  onClick={() => handleTabChange('analytics')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'analytics'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart2 className="mr-3 h-5 w-5" />
                  Analytics
                </button>

                <button 
                  onClick={() => handleTabChange('automation')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'automation'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings2 className="mr-3 h-5 w-5" />
                  Automation
                </button>

                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'profile'
                      ? 'bg-[#0270DF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <UserCog className="mr-3 h-5 w-5" />
                    User Management
                  </button>
                </nav>

                {/* Today's Summary */}
                <div className="mt-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-lg font-medium text-black mb-4">Today's Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Enquiries</span>
                        <span className="bg-blue-100 border border-blue-300 text-blue-600 text-sm px-2 py-1 rounded-lg">234</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Interviews</span>
                        <span className="bg-orange-100 border border-orange-300 text-orange-600 text-sm px-2 py-1 rounded-lg">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Job Invitations</span>
                        <span className="bg-green-100 border border-green-400 text-green-600 text-sm px-2 py-1 rounded-lg">18</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Logout */}
            <div className="px-3 pb-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  router.push('/login');
                }}
                className="w-full flex items-center px-4 py-3 mt-4 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 overflow-x-hidden">
            <CompanyDetailsView 
              company={company} 
              onBack={() => router.push('/dashboard/college')} 
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}