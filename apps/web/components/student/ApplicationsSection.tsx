import React, { useCallback, useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Calendar, Eye, Building, X, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import JobDetailsModal from './JobDeatilsModal';
import { apiClient } from '../../utils/api';

interface ApplicationsSectionProps {
  studentInfo: any;
}

const BULK_AUTO_APPLY_RUN_STORAGE_KEY = 'campuspe.activeBulkAutoApplyRunId';
type ApplicationTab = 'ongoing' | 'needs_you' | 'unsuccessful';

const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ studentInfo }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [activeApplicationTab, setActiveApplicationTab] = useState<ApplicationTab>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortBy, setSortBy] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');

  const getTrackingStatus = (application: any) => {
    const sourceStatus = String(application.status || '').toLowerCase();
    const recruiterStatus = String(application.currentStatus || '').toLowerCase();
    if (sourceStatus === 'queued') return 'Submitting';
    if (sourceStatus === 'pending_review') return 'Pending Review';
    if (sourceStatus === 'failed') return 'Failed';
    if (sourceStatus === 'submitted' || sourceStatus === 'confirmed') return 'Completed';
    if (recruiterStatus === 'interview_scheduled' || recruiterStatus === 'interview_completed') return 'Interviewing';
    if (recruiterStatus === 'selected') return 'Selected';
    if (recruiterStatus === 'rejected') return 'Rejected';
    if (recruiterStatus === 'shortlisted' || recruiterStatus === 'screening') return 'Shortlisted';
    return 'Applied';
  };

  const getTrackingDescription = (application: any) => {
    if (application.status === 'Submitting') return 'Submitting through CampusPe';
    if (application.status === 'Pending Review') return 'Needs you to complete this application';
    if (application.status === 'Failed') {
      return `Action needed${application.failureReason ? ` · ${String(application.failureReason).replace(/_/g, ' ')}` : ''}`;
    }
    if (application.status === 'Completed') return 'Completed and tracked in CampusPe';
    if (application.employerDeliveryStatus === 'delivered_to_campuspe_employer') return 'Delivered to employer in CampusPe';
    return 'Tracked in CampusPe';
  };

  const getApplicationBucket = (application: any): ApplicationTab => {
    if (application.status === 'Pending Review') return 'needs_you';
    if (application.status === 'Failed' || application.status === 'Rejected') return 'unsuccessful';
    return 'ongoing';
  };

  // MongoDB is the only source of truth for applications. Browser storage and
  // sample records must never appear in the student's tracked application list.
  const loadApplications = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setApplicationsError('');
    try {
      const response = await apiClient.get('/api/applications', {
        params: { status: 'queued,submitted,confirmed,pending_review,failed' }
      });
      const records = Array.isArray(response.data?.data) ? response.data.data : [];
      setApplications(records.map((record: any) => {
          const job = record.jobId && typeof record.jobId === 'object' ? record.jobId : {};
          const snapshot = record.jobSnapshot || {};
          const rawLocation = Array.isArray(job.locations || snapshot.locations)
            ? (job.locations || snapshot.locations)[0]
            : (job.location || snapshot.location || record.jobLocation);
          const location = typeof rawLocation === 'string'
            ? rawLocation
            : [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ');
          const salary = job.salary || snapshot.salary || record.salary;
          const salaryText = salary && (salary.min || salary.max)
            ? `${salary.currency || 'INR'} ${Number(salary.min || 0).toLocaleString()} - ${Number(salary.max || 0).toLocaleString()}`
            : 'Salary not disclosed';
          const status = getTrackingStatus(record);
          const appliedDate = record.createdAt || record.appliedAt || record.updatedAt;
          const portalDescription = getTrackingDescription({
            status,
            failureReason: record.failureReason,
            employerDeliveryStatus: record.employerDeliveryStatus
          });
          return {
            ...record,
            id: record._id,
            title: job.title || snapshot.title || 'Job',
            company: job.companyName || snapshot.companyName || 'Company',
            location: location || '',
            salary: salaryText,
            type: job.jobType || snapshot.jobType || '',
            jobType: snapshot.jobType || 'Full-Time',
            workMode: job.workMode || record.workMode || snapshot.workMode || '',
            match: typeof record.matchScore === 'number' ? `${record.matchScore}% Match` : '',
            skills: job.requiredSkills || snapshot.requiredSkills || [],
            description: job.description || snapshot.description || '',
            experience: job.experienceLevel || snapshot.experienceLevel || '',
            appliedDate,
            status,
            rawStatus: record.status,
            failureReason: record.failureReason,
            atsPlatform: job.atsPlatform || snapshot.atsPlatform || record.sourcePlatform,
            statusHistory: [
              { status, date: appliedDate, description: portalDescription },
              ...(record.statusHistory || [])
                .map((history: any) => ({
                  status: String(history.status || '').replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
                  date: history.updatedAt || history.date,
                  description: history.notes || history.description || 'Status updated in CampusPe'
                }))
                .filter((history: any) => history.status !== status)
            ]
          };
      }));
    } catch (error: any) {
      setApplications([]);
      setApplicationsError(error?.response?.data?.message || 'Unable to load applications from CampusPe.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications(true);
  }, [loadApplications]);

  useEffect(() => {
    let cancelled = false;
    const refreshWhileBulkRunActive = async () => {
      const runId = localStorage.getItem(BULK_AUTO_APPLY_RUN_STORAGE_KEY);
      if (!runId) return;
      try {
        const response = await apiClient.get(`/api/jobs/auto-apply/runs/${runId}`);
        if (cancelled) return;
        const run = response.data?.data;
        await loadApplications(false);
        if (run?.status === 'completed' || run?.status === 'failed' || run?.status === 'cancelled') {
          localStorage.removeItem(BULK_AUTO_APPLY_RUN_STORAGE_KEY);
        }
      } catch {
        if (!cancelled) await loadApplications(false);
      }
    };
    refreshWhileBulkRunActive();
    const interval = window.setInterval(refreshWhileBulkRunActive, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadApplications]);

  const handleViewJobDetails = (application: any) => {
    setSelectedJobDetails(application);
    setShowJobDetailsModal(true);
  };

  const getFilteredApplications = () => {
    let filtered = applications.filter(app => getApplicationBucket(app) === activeApplicationTab);

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

  const applicationTabCounts = applications.reduce((counts, application) => {
    counts[getApplicationBucket(application)] += 1;
    return counts;
  }, { ongoing: 0, needs_you: 0, unsuccessful: 0 } as Record<ApplicationTab, number>);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string; label: string } } = {
      'Applied': { bg: 'rgba(39, 145, 252, 0.1)', text: '#0377EB', label: 'Applied' },
      'Submitting': { bg: 'rgba(255, 184, 0, 0.12)', text: '#B45309', label: 'Submitting' },
      'Pending Review': { bg: 'rgba(147, 51, 234, 0.1)', text: '#7E22CE', label: 'Pending Review' },
      'Completed': { bg: 'rgba(0, 201, 80, 0.1)', text: '#047857', label: 'Completed' },
      'Failed': { bg: 'rgba(239, 68, 68, 0.1)', text: '#DC2626', label: 'Failed' },
      'Shortlisted': { bg: 'rgba(0, 201, 80, 0.1)', text: '#00C950', label: 'Shortlisted' },
      'Interviewed': { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333EA', label: 'Interviewed' },
      'Offered': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', label: 'Offered' },
      'Hired': { bg: 'rgba(0, 201, 80, 0.15)', text: '#00C950', label: 'Hired' },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', label: 'Rejected' },
      'Interviewing': { bg: 'rgba(255, 184, 0, 0.1)', text: '#FFB800', label: 'Interviewing' },
      'Selected': { bg: 'rgba(34, 197, 94, 0.1)', text: '#16A34A', label: 'Selected' }
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
    const fallbackDescription = application.status === 'Submitting'
      ? 'CampusPe has created your application and is submitting it.'
      : application.status === 'Pending Review'
        ? 'Tailored materials are ready and waiting for your approval.'
        : application.status === 'Failed'
          ? `Auto Apply failed${application.failureReason ? `: ${String(application.failureReason).replace(/_/g, ' ')}` : ''}.`
          : application.status === 'Completed'
            ? 'CampusPe completed this application attempt.'
            : 'Your application has been received.';
    const statusHistory = application.statusHistory?.length ? application.statusHistory : [
      { status: application.status || 'Applied', date: application.appliedDate, description: fallbackDescription }
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
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {([
            { key: 'ongoing' as const, label: 'Ongoing', description: 'Submitting and completed applications' },
            { key: 'needs_you' as const, label: 'Needs You', description: 'Applications requiring your action' },
            { key: 'unsuccessful' as const, label: 'Unsuccessful', description: 'Failed or rejected applications' }
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveApplicationTab(tab.key);
                setStatusFilter('All Status');
              }}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                activeApplicationTab === tab.key
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  activeApplicationTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {applicationTabCounts[tab.key].toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{tab.description}</p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search job role, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {searchQuery
                ? 'No applications match your search criteria.'
                : activeApplicationTab === 'needs_you'
                  ? 'Applications that need manual action will appear here.'
                  : activeApplicationTab === 'unsuccessful'
                    ? 'Failed or rejected applications will appear here.'
                    : 'Submitting and completed applications will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredApplications().map((application) => (
              <div
                key={application.id}
                className={`rounded-lg border bg-white p-5 transition hover:border-blue-300 ${
                  application.status === 'Failed' ? 'border-l-4 border-l-red-500'
                    : application.status === 'Pending Review' ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                      <Building className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-lg font-semibold text-gray-900">{application.title}</h3>
                        {application.match && (
                          <span className="rounded-full border border-[#0377EB] px-2.5 py-1 text-xs font-medium text-[#064BB3]"
                                style={{ backgroundColor: 'rgba(39, 145, 252, 0.1)' }}>
                            {application.match}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{application.company}</p>
                      <p className={`mt-1 text-sm font-medium ${
                        application.status === 'Failed' ? 'text-red-700'
                          : application.status === 'Pending Review' ? 'text-amber-700'
                            : application.status === 'Completed' ? 'text-emerald-700'
                              : 'text-blue-700'
                      }`}>
                        {getTrackingDescription(application)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                        <span className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" />{application.workMode?.toLowerCase() === 'remote' ? 'Remote' : application.location || 'Location not specified'}</span>
                        <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" />{formatDate(application.appliedDate)}</span>
                        <span className="flex items-center"><Briefcase className="mr-1.5 h-4 w-4" />{application.type || 'Role'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-3">
                    {getStatusBadge(application.status)}
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="flex items-center gap-2 rounded-lg border border-[#1383F3] bg-white px-4 py-2 text-sm font-medium text-[#1383F3] transition hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Status</span>
                    </button>
                    {(activeApplicationTab === 'needs_you' || activeApplicationTab === 'unsuccessful') && (
                      <button
                        onClick={() => handleViewJobDetails(application)}
                        className="rounded-lg bg-[#1484F3] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d6edb]"
                      >
                        Job Details
                      </button>
	                    )}
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
                    <p className="text-sm text-gray-600">Started: {formatDetailedDate(selectedApplication.appliedDate)}</p>
                    <p className={`mt-1 text-xs font-medium ${
                      selectedApplication.status === 'Failed' ? 'text-red-700'
                        : selectedApplication.status === 'Submitting' || selectedApplication.status === 'Pending Review' ? 'text-amber-700'
                          : 'text-emerald-700'
                    }`}>
                      {getTrackingDescription(selectedApplication)}
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
