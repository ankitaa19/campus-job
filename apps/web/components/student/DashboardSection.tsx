import React from 'react';
import { TrendingUp, Briefcase, Calendar, FileText, Award, CheckCircle, Clock, MessageSquare, User } from 'lucide-react';

interface DashboardSectionProps {
  studentInfo: any;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ studentInfo }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, <span className="text-[#0270DF]">{studentInfo?.firstName}</span>!
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Dashboard Overview
        </p>
      </div>
      
      <div className="px-8 py-6">

      {/* Profile Completion Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Profile <span className="text-[#0270DF]">Completion</span></h2>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div className="bg-[#3E9EFE] h-2.5 rounded-full" style={{ width: '25%' }}></div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">25% Complete</p>
          <a href="#" className="text-sm text-[#0270DF] hover:underline font-medium">Complete your profile setup</a>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
              <span className="text-gray-600">Quantify your achievements with numbers and percentages</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
              <span className="text-gray-600">Tailor your resume for each job application</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 text-red-600 mr-3" />
              <span className="text-gray-600">Add more relevant skills to your profile</span>
            </div>
          </div>

          <div className="flex gap-2 ml-6 mb-0.5">
            <button className="px-4 py-2 text-white text-sm font-medium rounded-lg transition flex items-center space-x-2" style={{ background: 'linear-gradient(to right, #2791FC, #0377EB)' }}>
              <TrendingUp className="h-4 w-4" />
              <span>Complete Profile</span>
            </button>
            <button className="px-4 py-2 bg-white border border-[#0278EE] text-[#0278EE] text-sm font-medium rounded-lg hover:bg-blue-50 transition flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Get Verified</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-[#0270DF]">Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">15</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-[#3E9EFE]" />
            </div>
          </div>
          <p className="text-xs text-gray-500">+7 This week</p>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-[#0270DF]">Interviews</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">2</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600">Next: Tomorrow morning 10AM</p>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-[#0270DF]">Assignments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">8</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">+4 Today</p>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-[#0270DF]">Enquiries</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">5</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">+3 Pending response</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Recent Applications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent <span className="text-[#0270DF]">Applications</span></h2>
            <a href="#" className="text-sm text-[#3E9EFE] hover:text-blue-700 font-medium">View All</a>
          </div>
          <p className="text-sm text-gray-500 mb-4">Track your latest job applications</p>
          
          <div className="space-y-3">
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-5 w-5 text-[#3E9EFE]" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Frontend Developer</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc • 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Interview Scheduled</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-5 w-5 text-[#3E9EFE]" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Frontend Developer</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc • 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Interview Scheduled</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-5 w-5 text-[#3E9EFE]" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Frontend Developer</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc • 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Interview Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming <span className="text-[#0270DF]">Interviews</span></h2>
            <a href="#" className="text-sm text-[#3E9EFE] hover:text-blue-700 font-medium">View All</a>
          </div>
          <p className="text-sm text-gray-500 mb-4">Prepare for your scheduled interviews</p>
          
          <div className="space-y-3">
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Backend Developer</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc • 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Virtual</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Full Stack Developer</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc • 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">In-Office</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Frontend Developer</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc • 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Virtual</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Assignments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending <span className="text-[#0270DF]">Assignments</span></h2>
            <a href="#" className="text-sm text-[#3E9EFE] hover:text-blue-700 font-medium">View All</a>
          </div>
          <p className="text-sm text-gray-500 mb-4">Complete these assignments to move forward</p>
          
          <div className="space-y-3">
            <div className="flex items-start p-4 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">React Component Challenge</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Tech Solutions Inc</p>
                    <p className="text-xs text-gray-500 mt-1">Due: Nov 15, 2025</p>
                  </div>
                  <button className="px-3 py-1 bg-[#3E9EFE] text-white text-xs font-medium rounded hover:bg-blue-700">
                    Start
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-4 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">API Integration Task</h4>
                    <p className="text-xs text-gray-600 mt-0.5">StartUp Hub</p>
                    <p className="text-xs text-gray-500 mt-1">Due: Nov 17, 2025</p>
                  </div>
                  <button className="px-3 py-1 bg-[#3E9EFE] text-white text-xs font-medium rounded hover:bg-blue-700">
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quick <span className="text-[#0270DF]">Actions</span></h2>
            <a href="#" className="text-sm text-[#3E9EFE] hover:text-blue-700 font-medium">View All</a>
          </div>
          <p className="text-sm text-gray-500 mb-4">Common tasks and shortcuts</p>
          
          <div className="space-y-3">
            <button className="w-full flex items-center p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-[#3E9EFE]" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Update Resume</span>
            </button>
            
            <button className="w-full flex items-center p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-5 w-5 text-[#3E9EFE]" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Browse Jobs</span>
            </button>
            
            <button className="w-full flex items-center p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-[#3E9EFE]" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">View Profile</span>
            </button>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default DashboardSection;
