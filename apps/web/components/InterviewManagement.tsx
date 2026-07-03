import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Users,
  FileText,
  Plus,
  Filter,
  Eye,
  MessageCircle,
  User,
  Building2,
  Mail,
  Phone,
  CircleCheck,
  BadgeCheck,
  TrendingUp,
  Briefcase,
  CircleX
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import TabButtons from './ui/TabButtons';

// ===== TYPE DEFINITIONS =====
interface InterviewData {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateAvatar?: string;
  company: string;
  position: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewType?: 'online' | 'offline' | 'phone';
  status: 'applied' | 'shortlisted' | 'scheduled' | 'selected' | 'rejected';
  department: string;
  year: string;
  cgpa: number;
  appliedDate: string;
  resumeUrl?: string;
  notes?: string;
  offerLetterStatus?: 'inprogress' | 'sent' | 'accepted';
  interviewRound?: string;
  mode?: 'Mail' | 'Post' | 'Online' | 'Offline';
}

// Generate sample data - 20 students per status
const generateStudentData = () => {
  const names = [
    'Amit Kumar', 'Rohan Thakur', 'Priya Sharma', 'Vikash Singh', 'Neha Gupta',
    'Rajesh Patel', 'Sonia Yadav', 'Arjun Mishra', 'Kavya Reddy', 'Rahul Verma',
    'Pooja Agarwal', 'Suresh Kumar', 'Divya Joshi', 'Karan Kapoor', 'Ritu Singh',
    'Mohit Sharma', 'Ankita Das', 'Varun Malik', 'Shreya Nair', 'Deepak Rao'
  ];
  
  const companies = ['TechCorp', 'XYZ Company', 'InfoTech Ltd', 'DataSoft Inc', 'CodeWorks'];
  const positions = ['Software Engineer', 'Mechanical Engineer', 'Data Analyst', 'Web Developer', 'Business Analyst'];
  const departments = ['Computer Science', 'Mechanical Engineer', 'Information Technology', 'Electronics', 'Business Administration'];
  const cgpas = [9.2, 8.5, 9.6, 9.1, 8.7, 9.0, 8.8, 9.3, 8.9, 9.4];
  const dates = ['2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29', '2025-10-30'];
  const times = ['10:00 AM', '11:30 AM', '2:30 PM', '3:45 PM', '9:15 AM'];
  const modes: ('Mail' | 'Post' | 'Online' | 'Offline')[] = ['Mail', 'Post', 'Online', 'Offline'];
  const rounds = ['Technical Round', 'HR Round', 'Managerial Round'];

  const students: InterviewData[] = [];
  let idCounter = 1;

  // Generate for each status
  const statuses: Array<'applied' | 'shortlisted' | 'scheduled' | 'selected' | 'rejected'> = 
    ['applied', 'shortlisted', 'scheduled', 'selected', 'rejected'];

  statuses.forEach(status => {
    for (let i = 0; i < 20; i++) {
      const nameIndex = i % names.length;
      const companyIndex = i % companies.length;
      const positionIndex = i % positions.length;
      const deptIndex = i % departments.length;
      const cgpaIndex = i % cgpas.length;
      const dateIndex = i % dates.length;
      const timeIndex = i % times.length;
      const modeIndex = i % modes.length;
      const roundIndex = i % rounds.length;

      const baseStudent: InterviewData = {
        id: `${status}-${idCounter++}`,
        candidateName: names[nameIndex],
        candidateEmail: `${names[nameIndex].toLowerCase().replace(' ', '.')}${i}@college.com`,
        company: companies[companyIndex],
        position: positions[positionIndex],
        status: status,
        department: departments[deptIndex],
        year: 'Final Year',
        cgpa: cgpas[cgpaIndex],
        appliedDate: dates[dateIndex]
      };

      // Add status-specific fields
      if (status === 'scheduled') {
        baseStudent.interviewDate = dates[dateIndex];
        baseStudent.interviewTime = times[timeIndex];
        baseStudent.interviewType = i % 3 === 0 ? 'online' : i % 3 === 1 ? 'offline' : 'phone';
      }

      if (status === 'selected') {
        baseStudent.offerLetterStatus = 'inprogress';
        baseStudent.mode = modes[modeIndex] as 'Mail' | 'Post' | 'Online' | 'Offline';
      }

      if (status === 'rejected') {
        baseStudent.interviewRound = rounds[roundIndex];
      }

      students.push(baseStudent);
    }
  });

  return students;
};

const sampleInterviews: InterviewData[] = generateStudentData();

interface InterviewManagementProps {
  onScheduleInterview?: () => void;
}

const InterviewManagement: React.FC<InterviewManagementProps> = ({ onScheduleInterview }) => {
  const [activeTab, setActiveTab] = useState('applied');
  const [searchTerm, setSearchTerm] = useState('');
  const [interviews] = useState<InterviewData[]>(sampleInterviews);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tabItems = [
    { value: 'applied', label: 'Applied', icon: CheckCircle2, color: '#4F80F0' },
    { value: 'shortlisted', label: 'Shortlisted', icon: FileText, color: '#FFA500' },
    { value: 'scheduled', label: 'Interviews', icon: Calendar, color: '#077AEC' },
    { value: 'selected', label: 'Hired', icon: User, color: '#00AF54' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: '#F04438' }
  ];

  const overviewCards = [
    {
      key: 'scheduled',
      title: 'Scheduled',
      color: '#077AEC',
      icon: Calendar
    },
    {
      key: 'selected',
      title: 'Selected',
      color: '#00AF54',
      icon: CheckCircle2
    },
    {
      key: 'rejected',
      title: 'Rejected',
      color: '#F04438',
      icon: XCircle
    }
  ] as const;

  // Filter interviews based on search term and active tab
  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = interview.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInterviews = filteredInterviews.slice(startIndex, endIndex);

  // Reset to page 1 when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getVisiblePages = () => {
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    let end = start + maxPagesToShow - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxPagesToShow + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  // Count interviews by status
  const getStatusCount = (status: string) => {
    return interviews.filter(interview => interview.status === status).length;
  };

  const statusDisplay: Record<InterviewData['status'], {
    label: string;
    color: string;
    icon: React.ElementType;
    textColor?: string;
    bg?: string;
  }> = {
    applied: {
      label: 'Applied',
      color: '#17C900',
      icon: CircleCheck
    },
    shortlisted: {
      label: 'Shortlisted',
      color: '#7F3DFF',
      icon: BadgeCheck
    },
    scheduled: {
      label: 'Interview',
      color: '#FF8400',
      icon: TrendingUp
    },
    selected: {
      label: 'Hired',
      color: '#00C950',
      icon: Briefcase
    },
    rejected: {
      label: 'Rejected',
      color: '#DF3C3C',
      icon: CircleX
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'online':
        return '🖥️';
      case 'offline':
        return '🏢';
      case 'phone':
        return '📞';
      default:
        return '📅';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen mx-auto space-y-8 p-6 lg:p-8 bg-white">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              <span style={{ color: '#0270DF' }}>Interview</span>{' '}
              <span style={{ color: '#0A0A0A' }}>Management</span>
            </h1>
            <p className="text-gray-600">Track and manage campus placement interviews</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 lg:w-80">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search anything..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            
            {/* Schedule New Interview Button */}
            <Button 
              onClick={onScheduleInterview}
              className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] hover:from-[#2a8cf5] hover:to-[#036ed4] text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Schedule New Interview
            </Button>
          </div>
        </div>

{/* KPI Dashboard Overview */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* Scheduled */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Scheduled</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#077AEC] to-[#055BB5] rounded-lg flex items-center justify-center">
        <Calendar className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{getStatusCount("scheduled")}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Hired */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Hired</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#00AF54] to-[#008F43] rounded-lg flex items-center justify-center">
        <CheckCircle2 className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{getStatusCount("selected")}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Rejected */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Rejected</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#F04438] to-[#C72D24] rounded-lg flex items-center justify-center">
        <XCircle className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{getStatusCount("rejected")}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>
</div>

        {/* Tabs for Interview Status */}
        <TabButtons
          tabs={tabItems.map(item => ({
            id: item.value,
            label: item.label,
            count: getStatusCount(item.value),
            showCount: true
          }))}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mb-8"
        />

        {/* Tab Content */}
        <div className="space-y-4">
          {filteredInterviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} interviews found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria.' : `No interviews in ${activeTab} status.`}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Table Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {activeTab === 'applied' && 'Job Applied Student List'}
                    {activeTab === 'shortlisted' && 'Job Applied Student List'}
                    {activeTab === 'scheduled' && 'Interviews'}
                    {activeTab === 'selected' && 'Interviews'}
                    {activeTab === 'rejected' && 'Interviews'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'applied' && 'Manage all scheduled and completed interviews'}
                    {activeTab === 'shortlisted' && 'Review and process student applications'}
                    {activeTab === 'scheduled' && 'Manage all scheduled and completed interviews'}
                    {activeTab === 'selected' && 'Manage all scheduled and completed interviews'}
                    {activeTab === 'rejected' && 'Manage all scheduled and completed interviews'}
                  </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        
                        {activeTab === 'applied' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                          </>
                        )}
                        
                        {activeTab === 'shortlisted' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                          </>
                        )}
                        
                        {activeTab === 'scheduled' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                          </>
                        )}
                        
                        {activeTab === 'selected' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Letter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                          </>
                        )}
                        
                        {activeTab === 'rejected' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview Round</th>
                        )}
                        
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentInterviews.map((interview) => (
                        <tr key={interview.id} className="hover:bg-gray-50">
                          {/* Student Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{interview.candidateName}</div>
                            <div className="text-sm text-gray-500">{interview.department}</div>
                          </td>
                          
                          {/* Job Title */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.position}
                          </td>
                          
                          {/* CGPA */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              interview.cgpa >= 9.0 ? 'bg-green-100 text-green-800' :
                              interview.cgpa >= 8.0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {interview.cgpa}
                            </span>
                          </td>
                          
                          {/* Company */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.company}
                          </td>
                          
                          {/* Applied Date (for applied and shortlisted) */}
                          {(activeTab === 'applied' || activeTab === 'shortlisted') && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {interview.appliedDate}
                              </div>
                            </td>
                          )}
                          
                          {/* Date & Time (for scheduled) */}
                          {activeTab === 'scheduled' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>{interview.interviewDate}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>{interview.interviewTime}</span>
                                </div>
                              </div>
                            </td>
                          )}
                          
                          {/* Mode (for scheduled) */}
                          {activeTab === 'scheduled' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                interview.interviewType === 'online' ? 'bg-blue-100 text-blue-800' :
                                interview.interviewType === 'offline' ? 'bg-gray-100 text-gray-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {interview.interviewType === 'online' && '🖥️'}
                                {interview.interviewType === 'offline' && '🏢'}
                                {interview.interviewType === 'phone' && '📞'}
                                {' '}
                                {interview.interviewType?.charAt(0).toUpperCase() + interview.interviewType?.slice(1)}
                              </span>
                            </td>
                          )}
                          
                          {/* Resume (for applied, shortlisted, scheduled) */}
                          {(activeTab === 'applied' || activeTab === 'shortlisted' || activeTab === 'scheduled') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3ECFF] bg-white text-gray-900 transition-colors hover:bg-[#F5F7FB]"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                            </td>
                          )}
                          
                          {/* Offer Letter (for selected) */}
                          {activeTab === 'selected' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                <span className="text-sm text-gray-600">Inprogress</span>
                              </div>
                            </td>
                          )}
                          
                          {/* Mode (for selected) */}
                          {activeTab === 'selected' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {interview.mode}
                            </td>
                          )}
                          
                          {/* Interview Round (for rejected) */}
                          {activeTab === 'rejected' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {interview.interviewRound}
                            </td>
                          )}
                          
                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const { label, color, icon: StatusIcon } = statusDisplay[interview.status];
                              return (
                                <span
                                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                                  style={{ backgroundColor: color }}
                                >
                                  <StatusIcon className="h-4 w-4" />
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      {(() => {
                        const paginationBaseClass = "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-all";
                        const pageNumbers = getVisiblePages();
                        const prevDisabled = currentPage === 1;
                        const nextDisabled = currentPage === totalPages;

                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => goToPage(currentPage - 1)}
                              disabled={prevDisabled}
                              className={`${paginationBaseClass} ${
                                prevDisabled
                                  ? 'cursor-not-allowed border-[#E6E9F0] text-gray-400'
                                  : 'border-[#3575E2] text-[#111827] hover:bg-[#3575E2]/10'
                              }`}
                            >
                              ‹
                            </button>

                            {pageNumbers.map((page) => {
                              const isActive = currentPage === page;
                              return (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => goToPage(page)}
                                  className={`${paginationBaseClass} ${
                                    isActive
                                      ? 'border-[#3575E2] bg-[#3575E2] text-white'
                                      : 'border-[#3575E2] bg-white text-[#3575E2] hover:bg-[#3575E2]/10'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => goToPage(currentPage + 1)}
                              disabled={nextDisabled}
                              className={`${paginationBaseClass} ${
                                nextDisabled
                                  ? 'cursor-not-allowed border-[#E6E9F0] text-gray-400'
                                  : 'border-[#3575E2] text-[#111827] hover:bg-[#3575E2]/10'
                              }`}
                            >
                              ›
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default InterviewManagement;