import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

interface Recruiter {
  _id: string;
  userId: string;
  companyInfo: {
    name: string;
    industry: string;
    website?: string;
    description?: string;
    size: string;
    headquarters: {
      city: string;
      state: string;
      country: string;
    };
  };
  profile?: {
    firstName: string;
    lastName: string;
    designation: string;
  };
  email: string;
  approvalStatus: string;
  isVerified: boolean;
}

interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  jobType: string;
  experienceLevel: string;
  locations: Array<{
    city: string;
    state: string;
    country: string;
  }>;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  applicationDeadline: string;
  recruiterId: string;
  status: string;
}

interface CollegeJobManagerProps {
  onRefresh?: () => void;
}

const CollegeJobManager: React.FC<CollegeJobManagerProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'available-jobs' | 'sent-invitations'>('available-jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [invitationMessage, setInvitationMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch available jobs
      const jobsResponse = await axios.get(`${API_BASE_URL}/api/jobs`, { headers });
      setJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : jobsResponse.data?.data || []);

      // Fetch approved recruiters for connection requests
      const recruitersResponse = await axios.get(`${API_BASE_URL}/api/recruiters/approved`, { headers }).catch(() => ({ data: [] }));
      setRecruiters(Array.isArray(recruitersResponse.data) ? recruitersResponse.data : []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendConnectionRequest = async (recruiterId: string) => {
    try {
      setActionLoading(recruiterId);
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/connections/request`, {
        targetId: recruiterId,
        targetType: 'company',
        message: 'We would like to connect to explore placement opportunities for our students.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Connection request sent successfully!');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      const message = error.response?.data?.message || 'Failed to send connection request';
      alert(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendJobInvitation = async () => {
    if (!selectedJob) return;

    try {
      setActionLoading(selectedJob._id);
      const token = localStorage.getItem('token');
      
      // Send invitation to the recruiter for student placements
      await axios.post(`${API_BASE_URL}/api/connections/request`, {
        targetId: selectedJob.recruiterId,
        targetType: 'company',
        message: invitationMessage || `We are interested in the ${selectedJob.title} position at ${selectedJob.companyName}. We would like to send our qualified students for this opportunity.`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Placement invitation sent successfully!');
      setShowInviteModal(false);
      setSelectedJob(null);
      setInvitationMessage('');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error sending job invitation:', error);
      const message = error.response?.data?.message || 'Failed to send invitation';
      alert(message);
    } finally {
      setActionLoading(null);
    }
  };

  const openInviteModal = (job: Job) => {
    setSelectedJob(job);
    setInvitationMessage(`We are interested in the ${job.title} position at ${job.companyName}. We would like to send our qualified students for this opportunity. Our students have relevant skills and experience that would be a great fit for this role.`);
    setShowInviteModal(true);
  };

  const formatSalary = (salary: any) => {
    if (!salary) return 'Not specified';
    const { min, max, currency = 'INR' } = salary;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return min ? `${currency} ${min.toLocaleString()}+` : 'Negotiable';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Job & Placement Management</h3>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Job & Placement Management</h3>
        <button
          onClick={fetchData}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('available-jobs')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'available-jobs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Available Jobs
        </button>
        <button
          onClick={() => setActiveTab('sent-invitations')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sent-invitations'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Company Connections
        </button>
      </div>

      {/* Available Jobs Tab */}
      {activeTab === 'available-jobs' && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Browse available job opportunities and send placement invitations to recruiters for your students.
          </p>
          
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.slice(0, 10).map(job => (
                <div key={job._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-blue-600">{job.title}</h4>
                      <p className="text-gray-600 font-medium">{job.companyName}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <span className="capitalize">{job.jobType}</span>
                        <span className="capitalize">{job.experienceLevel} Level</span>
                        {job.locations?.[0] && (
                          <span>{job.locations[0].city}, {job.locations[0].state}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-medium text-green-600">
                          {formatSalary(job.salary)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => openInviteModal(job)}
                        disabled={actionLoading === job._id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {actionLoading === job._id ? 'Sending...' : 'Send Invitation'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 01 2 2v6M8 6V4a2 2 0 01 2-2h4a2 2 0 01 2 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">No jobs available</h3>
              <p className="text-sm text-gray-500 mt-1">
                Check back later for new job opportunities.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Company Connections Tab */}
      {activeTab === 'sent-invitations' && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Connect with companies and recruiters to explore placement opportunities.
          </p>
          
          {recruiters.length > 0 ? (
            <div className="space-y-4">
              {recruiters.slice(0, 10).map(recruiter => (
                <div key={recruiter._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-blue-600">
                        {recruiter.companyInfo.name}
                      </h4>
                      <p className="text-gray-600">{recruiter.companyInfo.industry}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {recruiter.profile?.firstName || 'Unknown'} {recruiter.profile?.lastName || ''} - {recruiter.profile?.designation || 'Recruiter'}
                      </p>
                      {recruiter.companyInfo.headquarters && (
                        <p className="text-sm text-gray-500">
                          {recruiter.companyInfo.headquarters.city}, {recruiter.companyInfo.headquarters.state}
                        </p>
                      )}
                      {recruiter.companyInfo.description && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {recruiter.companyInfo.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleSendConnectionRequest(recruiter._id)}
                        disabled={actionLoading === recruiter._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {actionLoading === recruiter._id ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">No companies available</h3>
              <p className="text-sm text-gray-500 mt-1">
                Companies will appear here once they are approved.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Invitation Modal */}
      {showInviteModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Placement Invitation</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedJob(null);
                  setInvitationMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{selectedJob.title}</h4>
              <p className="text-sm text-gray-600">{selectedJob.companyName}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitation Message
              </label>
              <textarea
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Write your invitation message..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSendJobInvitation}
                disabled={!invitationMessage.trim() || actionLoading === selectedJob._id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === selectedJob._id ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedJob(null);
                  setInvitationMessage('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeJobManager;
