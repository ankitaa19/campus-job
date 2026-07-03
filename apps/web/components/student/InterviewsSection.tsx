import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Mail, Phone, Briefcase, GraduationCap, ChevronDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import JobDetailsModal from './JobDeatilsModal';
import { StudentJob } from '../../types/studentJobs';

interface InterviewsSectionProps {
  studentInfo: any;
}

interface Interview {
  id: number;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  email: string;
  college?: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'Online' | 'Offline';
  interviewMode?: string;
  duration: string;
  meetingLink?: string;
  location?: string;
  status: 'Schedule' | 'Completed' | 'Reschedule Request' | 'Offer';
  interviewRound?: string;
  rescheduleReason?: string;
  jobData?: StudentJob;
  outcome?: 'Selected' | 'On Hold' | 'Rejected';
  completedDate?: string;
  feedback?: string;
}

const InterviewsSection: React.FC<InterviewsSectionProps> = ({ studentInfo }) => {
  const [activeTab, setActiveTab] = useState<string>('Schedule');
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<StudentJob | null>(null);
  
  // Dummy job data for modal
  const getDummyJobData = (interview: Interview): StudentJob => ({
    id: interview.id,
    title: interview.jobTitle,
    company: interview.companyName,
    location: interview.location || 'New Delhi',
    salary: '₹ 15,000 - 25,000 / Month',
    date: '26 Oct, 2024',
    type: 'Full-Time',
    jobType: 'Full-Time',
    workMode: interview.interviewType === 'Online' ? 'Remote' : 'On-site',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    description: `Join ${interview.companyName} as a ${interview.jobTitle}. We are looking for talented individuals to join our growing team.`,
    experience: '0-2 Years',
    education: 'Bachelor\'s Degree',
    numberOfOpenings: 5,
    benefits: ['Health Insurance', 'Flexible Working Hours', 'Learning & Development'],
    fullTimeDetails: {
      preferredMode: interview.interviewType === 'Online' ? 'Remote' : 'On-site',
      noticePeriod: 'Immediate',
      compensationType: 'Salary',
      minSalary: '15000',
      maxSalary: '25000'
    }
  });

  const [interviews] = useState<Interview[]>([
    {
      id: 1,
      jobTitle: 'Software Developer',
      companyName: 'Digital Innovations',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 20 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Online',
      interviewMode: 'Google Meet',
      duration: '2 hrs',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'Completed',
      interviewRound: 'Round 1',
      outcome: 'Selected',
      completedDate: 'Fri, Nov 15',
      feedback: 'Excellent technical skills demonstrated. Strong problem-solving abilities and good communication. Recommended for next round.'
    },
    {
      id: 2,
      jobTitle: 'Backend Developer Intern',
      companyName: 'TechCorp Inc',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 24 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Online',
      interviewMode: 'Google Meet',
      duration: '2 hrs',
      status: 'Completed',
      interviewRound: 'Round 2',
      outcome: 'On Hold',
      completedDate: 'Thu, Nov 14',
      feedback: 'Good performance overall. Need to improve on system design concepts. Keeping on hold for further evaluation.'
    },
    {
      id: 3,
      jobTitle: 'Full Stack Developer',
      companyName: 'Cloud Services Pro',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 26 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Online',
      interviewMode: 'Google Meet',
      duration: '2 hrs',
      meetingLink: 'https://meet.google.com/xyz-abcd-efg',
      status: 'Reschedule Request',
      interviewRound: 'Round 1',
      rescheduleReason: 'Have a mid-term exam at the same time. Would prefer afternoon slots.'
    },
    {
      id: 4,
      jobTitle: 'Full Stack Developer',
      companyName: 'Cloud Services Pro',
      candidateName: 'Student',
      email: 'student@abc.university',
      interviewDate: 'Mon - Oct 26 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Online',
      duration: '2 hrs',
      status: 'Offer'
    },
    {
      id: 5,
      jobTitle: 'Software Developer',
      companyName: 'Digital Innovations',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 20 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Online',
      interviewMode: 'Google Meet',
      duration: '2 hrs',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'Schedule',
      interviewRound: 'Round 1'
    },
    {
      id: 6,
      jobTitle: 'Backend Developer Intern',
      companyName: 'TechCorp Inc',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 29 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Offline',
      location: 'Bangalore Office, Koramangala',
      duration: '2 hrs',
      status: 'Schedule',
      interviewRound: 'Round 2'
    },
    {
      id: 7,
      jobTitle: 'Full Stack Developer',
      companyName: 'Cloud Services Pro',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 26 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Online',
      interviewMode: 'Google Meet',
      duration: '2 hrs',
      meetingLink: 'https://meet.google.com/def-uvwx-yz',
      status: 'Schedule',
      interviewRound: 'Round 1'
    },
    {
      id: 8,
      jobTitle: 'UI/UX Developer Intern',
      companyName: 'TechCorp Inc',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 24 - 2025',
      interviewTime: '10:00 AM',
      interviewType: 'Offline',
      location: 'Pune Office, Hinjewadi',
      duration: '2 hrs',
      status: 'Schedule',
      interviewRound: 'Round 2'
    },
    {
      id: 9,
      jobTitle: 'Marketing Manager',
      companyName: 'Brand Solutions',
      candidateName: 'Student',
      email: 'student@abc.university',
      college: 'ABC University',
      interviewDate: 'Mon - Oct 28 - 2025',
      interviewTime: '02:00 PM',
      interviewType: 'Offline',
      location: 'Mumbai Office, Andheri East',
      duration: '1 hr',
      status: 'Schedule',
      interviewRound: 'Round 1'
    }
  ]);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showViewFeedbackModal, setShowViewFeedbackModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const tabs = [
    { key: 'Schedule', label: 'Schedule', count: interviews.filter(i => i.status === 'Schedule').length },
    { key: 'Completed', label: 'Completed', count: interviews.filter(i => i.status === 'Completed').length },
    { key: 'Reschedule Request', label: 'Reschedule Request', count: interviews.filter(i => i.status === 'Reschedule Request').length },
    { key: 'Offer', label: 'Offer', count: interviews.filter(i => i.status === 'Offer').length }
  ];

  const filteredInterviews = interviews.filter(interview => interview.status === activeTab);
  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInterviews = filteredInterviews.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getStatusConfig = (status: string) => {
    const configs = {
      'Schedule': {
        bg: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)',
        borderColor: '#C7D6F3'
      },
      'Completed': {
        bg: 'linear-gradient(90deg, #16C960 0%, #0FA44B 100%)',
        borderColor: '#C7D6F3'
      },
      'Reschedule Request': {
        bg: 'linear-gradient(90deg, #FFAE35 0%, #FF8400 100%)',
        borderColor: '#F9C892'
      },
      'Offer': {
        bg: 'linear-gradient(90deg, #FF58A6 0%, #F62192 100%)',
        borderColor: '#E8C6E1'
      }
    };
    return configs[status as keyof typeof configs] || configs['Schedule'];
  };

  const handleReschedule = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowRescheduleModal(true);
  };

  const handleViewJob = (interview: Interview) => {
    const jobData = getDummyJobData(interview);
    setSelectedJob(jobData);
    setShowJobModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-[#0270DF]">
          Interviews
        </h1>
        <p className="text-gray-600 text-sm mt-1">Manage your interview schedule and prepare effectively</p>
      </div>

      <div className="px-8 py-6">
        {/* Tabs */}
        <div className="bg-[#ECECF0]/50 rounded-full p-1 w-full mb-6">
          <div className="flex w-full">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]'
                    : 'text-[#087AED] bg-transparent'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Interviews List */}
        <div className="space-y-5">
          {paginatedInterviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600">No interviews in this tab yet</p>
            </div>
          ) : (
            paginatedInterviews.map((interview) => {
              const initials = interview.companyName
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              const statusConfig = getStatusConfig(interview.status);
              const TypeIcon = interview.interviewType === 'Online' ? Video : MapPin;
              const typeLabel = interview.interviewType === 'Online' ? 'Online Interview' : 'Offline Interview';

              return (
                <article
                  key={interview.id}
                  className="bg-white rounded-lg border-l-4 border-blue-500 hover:!border-l-[#0879EA] border border-gray-200 hover:border-blue-300 transition p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Left Section */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div
                        className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #C7A9FF 0%, #A385F5 100%)' }}
                      >
                        {initials}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {interview.jobTitle}
                          </h3>
                          {interview.interviewRound && (
                            <span className="rounded-full bg-[#E3F2FD] px-2.5 py-0.5 text-xs font-medium text-[#2196F3]">
                              {interview.interviewRound}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{interview.companyName}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      style={{ background: statusConfig.bg }}
                    >
                      {interview.status}
                    </div>
                  </div>

             {/* Details */}
                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  {interview.college && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#6F7A91]" />
                      <span>Student - {interview.college}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#6F7A91]" />
                    <span>{interview.interviewDate}</span>
                    <Clock className="h-4 w-4 text-[#6F7A91]" />
                    <span>{interview.interviewTime}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-[#6F7A91]" />
                    <span>{typeLabel}</span>
                    {interview.duration && (
                      <>
                        <Clock className="h-4 w-4 text-[#6F7A91]" />
                        <span>Duration: {interview.duration}</span>
                      </>
                    )}
                  </div>
                </div>

                  {/* Reschedule Reason */}
                  {interview.status === 'Reschedule Request' && interview.rescheduleReason && (
                    <div className="mt-5 rounded-[14px] bg-[#FFF4E6] px-4 py-3 text-sm text-[#E67817]">
                      <strong>Reschedule Reason:</strong> {interview.rescheduleReason}
                    </div>
                  )}

                  {/* Feedback Section for Completed Interviews */}
                  {interview.status === 'Completed' && interview.outcome && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#E7F9EE] px-4 py-3 text-sm text-[#0A9345]">
                      <div>
                        <span className="font-semibold">Outcome:</span>{" "}
                        {interview.outcome}
                        {interview.completedDate && (
                          <span className="ml-3 text-gray-600">
                            Completed on {interview.completedDate}
                          </span>
                        )}
                      </div>
                      {interview.feedback && (
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setShowViewFeedbackModal(true);
                          }}
                          className="text-sm font-semibold text-[#0A9345] hover:underline"
                        >
                          View Feedback
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    {interview.status === 'Schedule' && interview.interviewType === 'Online' && interview.meetingLink && (
                      <button
                        onClick={() => window.open(interview.meetingLink, '_blank')}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition"
                        style={{ background: 'linear-gradient(to right, #00C950, #00A63E)' }}
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                      </button>
                    )}

                    {(interview.status === 'Schedule' || interview.status === 'Reschedule Request') && (
                      <button
                        onClick={() => handleReschedule(interview)}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition"
                        style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                      >
                        <Calendar className="h-4 w-4" />
                        Reschedule
                      </button>
                    )}

                    {(interview.status === 'Reschedule Request' || interview.status === 'Offer' || interview.status === 'Schedule' || interview.status === 'Completed') && (
                      <button 
                        onClick={() => handleViewJob(interview)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#1383F3] text-[#1383F3] bg-white hover:bg-gray-50 px-6 py-2 text-sm font-medium transition"
                      >
                        <Eye className="h-4 w-4" />
                        View Job
                      </button>
                    )}

                    {interview.status === 'Schedule' && (
                      <button className="inline-flex items-center gap-2 rounded-lg border border-red-500 bg-white px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {paginatedInterviews.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedInterview && (
        <RescheduleModal
          interview={selectedInterview}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedInterview(null);
          }}
        />
      )}

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobModal}
          onClose={() => {
            setShowJobModal(false);
            setSelectedJob(null);
          }}
        />
      )}

      {/* View Feedback Modal */}
      {showViewFeedbackModal && selectedInterview && (
        <ViewFeedbackModal
          interview={selectedInterview}
          onClose={() => {
            setShowViewFeedbackModal(false);
            setSelectedInterview(null);
          }}
        />
      )}
    </div>
  );
};

// Reschedule Modal Component
const RescheduleModal: React.FC<{
  interview: Interview;
  onClose: () => void;
}> = ({ interview, onClose }) => {
  const [formData, setFormData] = useState({
    title: interview.jobTitle,
    interviewType: 'Online',
    interviewMode: 'Google Meet',
    time: '',
    date: '',
    interviewRound: '1st round',
    duration: '2 hours',
    meetLink: '',
    notes: ''
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reschedule Interview Request
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Reschedule an interview with {interview.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* From */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">From:</label>
            <p className="text-sm text-blue-600 font-medium">Amit Kumar</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
            <input
              type="text"
              value={interview.jobTitle}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Interview Type & Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Interview Type</label>
              <input
                type="text"
                value={interview.interviewType}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Interview Mode</label>
              <input
                type="text"
                value={interview.interviewMode || interview.location || 'N/A'}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Time & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500"
                placeholder="--:--"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500"
                placeholder="dd-mm-yyyy"
              />
            </div>
          </div>

          {/* Interview Round & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Interview Round</label>
              <input
                type="text"
                value={interview.interviewRound || 'N/A'}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Duration</label>
              <input
                type="text"
                value={interview.duration}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Meet Link - Only show for online interviews */}
          {interview.interviewType === 'Online' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Meet Video Call Link</label>
            <input
              type="text"
              value={interview.meetingLink || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          )}

          {/* Location - Only show for offline interviews */}
          {interview.interviewType === 'Offline' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
            <input
              type="text"
              value={interview.location || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-[#F5F0E8] border border-gray-200 rounded-xl text-sm text-gray-600 resize-none"
              placeholder="Have a mid term exam at the same time. Would prefer afternoon slots."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle reschedule request
              onClose();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Reschedule Request
          </button>
        </div>
      </div>
    </div>
  );
};

// View Feedback Modal Component
const ViewFeedbackModal: React.FC<{
  interview: Interview;
  onClose: () => void;
}> = ({ interview, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Interview Feedback
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Feedback for {interview.jobTitle} - {interview.interviewRound || 'Round 1'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Interview Details Card */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start space-x-4">
              <div 
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #C7A9FF 0%, #A385F5 100%)' }}
              >
                {interview.companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{interview.jobTitle}</h3>
                  {interview.interviewRound && (
                    <span className="rounded-full bg-[#E3F2FD] px-2.5 py-0.5 text-xs font-medium text-[#2196F3]">
                      {interview.interviewRound}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{interview.companyName}</p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{interview.interviewDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{interview.interviewTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outcome Badge */}
          {interview.outcome && (
            <div className="flex items-center justify-between p-4 rounded-xl" 
              style={{
                backgroundColor: interview.outcome === 'Selected' ? '#E7F9EE' : 
                                interview.outcome === 'On Hold' ? '#FFF4E6' : '#FEE2E2'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{
                  color: interview.outcome === 'Selected' ? '#0A9345' : 
                         interview.outcome === 'On Hold' ? '#E67817' : '#DC2626'
                }}>
                  Outcome:
                </span>
                <span className="font-medium" style={{
                  color: interview.outcome === 'Selected' ? '#0A9345' : 
                         interview.outcome === 'On Hold' ? '#E67817' : '#DC2626'
                }}>
                  {interview.outcome}
                </span>
              </div>
              {interview.completedDate && (
                <span className="text-sm text-gray-600">
                  Completed on {interview.completedDate}
                </span>
              )}
            </div>
          )}

          {/* Feedback Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Feedback from Recruiter</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {interview.feedback || 'No feedback provided yet.'}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Next Steps</p>
                <p className="text-sm text-blue-700">
                  {interview.outcome === 'Selected' 
                    ? 'Congratulations! You may be contacted for the next round or final offer.' 
                    : interview.outcome === 'On Hold' 
                    ? 'Your application is on hold. The recruiter will get back to you soon.'
                    : 'Thank you for your time. We encourage you to apply for other opportunities.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewsSection;
