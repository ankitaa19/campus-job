import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Calendar, Eye, Building, X, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import JobDetailsModal from './JobDeatilsModal';
import { apiClient } from '../../utils/api';

interface ApplicationsSectionProps {
  studentInfo: any;
}

const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ studentInfo }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortBy, setSortBy] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');

  // MongoDB is the only source of truth for applications. Browser storage and
  // sample records must never appear in the student's tracked application list.
  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      setApplicationsError('');
      try {
        const response = await apiClient.get('/api/students/applications');
        const records = Array.isArray(response.data?.data) ? response.data.data : [];
        setApplications(records.map((record: any) => {
          const snapshot = record.jobSnapshot || {};
          const rawLocation = Array.isArray(record.jobLocation) ? record.jobLocation[0] : record.jobLocation;
          const location = typeof rawLocation === 'string'
            ? rawLocation
            : [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ');
          const salary = record.salary;
          const salaryText = salary && (salary.min || salary.max)
            ? `${salary.currency || 'INR'} ${Number(salary.min || 0).toLocaleString()} - ${Number(salary.max || 0).toLocaleString()}`
            : 'Salary not disclosed';
          const status = String(record.currentStatus || record.status || 'applied')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
          return {
            ...record,
            id: record._id,
            title: record.jobTitle,
            company: record.companyName,
            location: location || '',
            salary: salaryText,
            type: snapshot.jobType || '',
            jobType: snapshot.jobType || 'Full-Time',
            workMode: record.workMode || snapshot.workMode || '',
            match: typeof record.matchScore === 'number' ? `${record.matchScore}% Match` : '',
            skills: snapshot.requiredSkills || [],
            description: snapshot.description || '',
            experience: snapshot.experienceLevel || '',
            appliedDate: record.appliedDate || record.dateApplied,
            status,
            statusHistory: (record.statusHistory || []).map((history: any) => ({
              status: String(history.status || '').replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
              date: history.updatedAt || history.date,
              description: history.notes || history.description || 'Status updated in CampusPe'
            }))
          };
        }));
      } catch (error: any) {
        setApplications([]);
        setApplicationsError(error?.response?.data?.message || 'Unable to load applications from CampusPe.');
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

  const handleViewJobDetails = (application: any) => {
    setSelectedJobDetails(application);
    setShowJobDetailsModal(true);
  };

  const getFilteredApplications = () => {
    let filtered = [...applications];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.title?.toLowerCase().includes(query) ||
        app.company?.toLowerCase().includes(query) ||
        app.location?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Sort
    if (sortBy === 'Most Recent' || sortBy === '') {
      filtered.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
    } else if (sortBy === 'Oldest First') {
      filtered.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string; label: string } } = {
      'Applied': { bg: 'rgba(39, 145, 252, 0.1)', text: '#0377EB', label: 'Applied' },
      'Shortlisted': { bg: 'rgba(0, 201, 80, 0.1)', text: '#00C950', label: 'Shortlisted' },
      'Interviewed': { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333EA', label: 'Interviewed' },
      'Offered': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', label: 'Offered' },
      'Hired': { bg: 'rgba(0, 201, 80, 0.15)', text: '#00C950', label: 'Hired' },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', label: 'Rejected' },
      'Interviewing': { bg: 'rgba(255, 184, 0, 0.1)', text: '#FFB800', label: 'Interviewing' }
    };

    const statusStyle = statusMap[status] || statusMap['Applied'];
    
    return (
      <span 
        className="px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ 
          backgroundColor: statusStyle.bg,
          color: statusStyle.text 
        }}
      >
        {statusStyle.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDetailedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get timeline based on application status history - only show actual company updates
  const getApplicationTimeline = (application: any) => {
    // Get status history from application (only what company has actually updated)
    const statusHistory = application.statusHistory || [
      { status: 'Applied', date: application.appliedDate, description: 'Your application has been received' }
    ];

    // Build timeline only from actual status history (no planned/pending steps)
    const timeline = statusHistory.map((history: any) => ({
      status: history.status,
      label: history.status,
      description: history.description || 'Status updated',
      date: history.date,
      completed: true
    }));

    return timeline;
  };

  const handleViewDetails = (application: any) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">My Applications</h1>
        <p className="text-gray-600 text-sm mt-1">Track and manage all your job applications in one place</p>
      </div>

      <div className="px-8 py-6">
        {/* Search and Filters */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search colleges by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium appearance-none cursor-pointer"
              style={{ minWidth: '150px' }}
            >
              <option value="All Status">All Status</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Interviewing">Interviewing</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium appearance-none cursor-pointer"
              style={{ minWidth: '150px' }}
            >
              <option value="">Select option</option>
              <option value="Most Recent">Most Recent</option>
              <option value="Oldest First">Oldest First</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">Loading your applications…</div>
        ) : applicationsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center text-amber-900">{applicationsError}</div>
        ) : getFilteredApplications().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchQuery ? 'No applications match your search criteria.' : 'Start applying to jobs and track all your applications here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredApplications().map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-lg border-l-4 border-blue-500 hover:!border-l-[#0879EA] border border-gray-200 hover:border-blue-300 transition p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Logo */}
                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="h-8 w-8 text-purple-600" />
                    </div>

                    {/* Job Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{application.title}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-medium border border-[#0377EB] text-[#064BB3]" 
                                  style={{ backgroundColor: 'rgba(39, 145, 252, 0.1)' }}>
                              {application.match}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-700">{application.company}</p>
                          <p className={`mt-1 text-xs font-medium ${application.employerDeliveryStatus === 'delivered_to_campuspe_employer' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {application.employerDeliveryStatus === 'delivered_to_campuspe_employer'
                              ? 'Delivered to employer in CampusPe'
                              : 'Tracked in CampusPe · Employer connection pending · Auto-delivery enabled'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          {getStatusBadge(application.status)}
                        </div>
                      </div>

                      {/* Job Info */}
                      <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mb-4 w-full">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1.5" />
                          {application.workMode?.toLowerCase() === 'remote' ? 'Remote' : application.workMode?.toLowerCase() === 'hybrid' ? `${application.location}, Hybrid` : application.location}
                        </div>
                        <div className="flex items-center">
                          {application.salary}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          {formatDate(application.appliedDate)}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1.5" />
                          {application.type}
                        </div>
                      </div>

                      {/* Top Skills and Action Buttons - Horizontal Layout */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-2">Top Skills:</p>
                          <div className="flex items-center flex-wrap gap-2">
                            {application.skills?.map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-lg text-xs font-medium text-[#7F3DFF]"
                                style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <button
                            onClick={() => handleViewDetails(application)}
                            className="px-6 py-2.5 rounded-xl border border-[#1383F3] text-[#1383F3] bg-white hover:bg-gray-50 transition flex items-center space-x-2 font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleViewJobDetails(application)}
                            className="px-6 py-2.5 rounded-xl text-white transition font-medium"
                            style={{ 
                              background: 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                            }}
                          >
                            Job Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
<div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
  
  {/* Title + Description stacked */}
  <div className="flex flex-col">
    <h2 className="text-xl font-semibold text-gray-900">
      Application Details
    </h2>
    <p className="text-sm text-gray-600">
      Complete information about your job application
    </p>
  </div>

  <button
    onClick={() => setShowDetailsModal(false)}
    className="text-gray-400 hover:text-gray-600 transition"
  >
    <X className="h-6 w-6" />
  </button>
</div>


            {/* Modal Content */}
            <div className="px-6 py-5">
              

              {/* Application Header Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{selectedApplication.title}</h3>
                        <p className="text-base font-medium text-gray-700">{selectedApplication.company}</p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(selectedApplication.status)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Submitted: {formatDetailedDate(selectedApplication.appliedDate)}</p>
                    <p className={`mt-1 text-xs font-medium ${selectedApplication.employerDeliveryStatus === 'delivered_to_campuspe_employer' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedApplication.employerDeliveryStatus === 'delivered_to_campuspe_employer'
                        ? 'Employer received this application in CampusPe'
                        : 'Stored and tracked in CampusPe. It will be delivered automatically when the employer connects.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Timeline - Always shown, updates when company updates status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Timeline</h3>
                <p className="text-sm text-gray-600 mb-4">Track your application journey step by step</p>

                <div className="space-y-0">
                  {getApplicationTimeline(selectedApplication).map((item: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      {/* Timeline Icon */}
                      <div className="flex flex-col items-center" style={{ position: 'relative', width: '40px' }}>
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: item.status === 'Rejected' ? '#EF4444' : (item.completed ? '#00C950' : '#E5E7EB'),
                            position: 'relative',
                            zIndex: 2
                          }}
                        >
                          {item.status === 'Rejected' ? (
                            <XCircle className="h-5 w-5 text-white" />
                          ) : item.completed ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        {index < getApplicationTimeline(selectedApplication).length - 1 && (
                          <div 
                            style={{ 
                              width: '3px',
                              height: '72px',
                              backgroundColor: item.status === 'Rejected' ? '#EF4444' : (item.completed ? '#00C950' : '#E5E7EB'),
                              position: 'absolute',
                              top: '40px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              zIndex: 1
                            }}
                          />
                        )}
                      </div>

                      {/* Timeline Content */}
                      <div className="flex-1 pb-8 pt-2">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">{item.label}</h4>
                        <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                        {item.date && (
                          <p className="text-xs text-gray-500">{formatDetailedDate(item.date)}</p>
                        )}
                        {!item.completed && (
                          <p className="text-xs text-gray-500">
                            {item.status === 'Rejected' ? 'Pending' : 'In Progress'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents Submitted */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents Submitted</h3>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-5 py-2.5 border border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Resume</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJobDetails && (
        <JobDetailsModal
          job={selectedJobDetails}
          isOpen={showJobDetailsModal}
          onClose={() => setShowJobDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default ApplicationsSection;
