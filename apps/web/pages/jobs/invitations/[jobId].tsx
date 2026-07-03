import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { API_BASE_URL } from '../../../utils/api';

interface Invitation {
  _id: string;
  jobId: string;
  collegeId: {
    _id: string;
    name: string;
    shortName: string;
    location: {
      city: string;
      state: string;
    };
  };
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
  campusVisitWindow: {
    startDate: string;
    endDate: string;
    confirmedStartDate?: string;
    confirmedEndDate?: string;
    isFlexible: boolean;
  };
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
  tpoResponse?: {
    responseDate: string;
    responseMessage: string;
    counterProposal?: {
      alternativeDates: Array<{
        startDate: string;
        endDate: string;
      }>;
    };
  };
  negotiationHistory: Array<{
    timestamp: string;
    actor: 'recruiter' | 'tpo';
    action: string;
    details: string;
  }>;
}

interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  status: string;
}

const JobInvitationsPage = () => {
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    if (jobId) {
      fetchJobData();
      fetchInvitations();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJob(response.data.data);
    } catch (error) {
      console.error('Error fetching job:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    if (selectedTab === 'all') return true;
    return invitation.status === selectedTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'negotiating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['recruiter']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['recruiter']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Back to Jobs
            </button>
            
            {job && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h1>
                <p className="text-gray-600 mb-2">{job.companyName}</p>
                <p className="text-sm text-gray-500">Job ID: {job._id}</p>
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Invitations</h3>
              <p className="text-3xl font-bold text-blue-600">{invitations.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Accepted</h3>
              <p className="text-3xl font-bold text-green-600">
                {invitations.filter(inv => inv.status === 'accepted').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {invitations.filter(inv => inv.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Negotiating</h3>
              <p className="text-3xl font-bold text-blue-600">
                {invitations.filter(inv => inv.status === 'negotiating').length}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['all', 'pending', 'accepted', 'declined', 'negotiating'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      selectedTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab} ({tab === 'all' ? invitations.length : invitations.filter(inv => inv.status === tab).length})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Invitations List */}
          <div className="space-y-6">
            {filteredInvitations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">No invitations found for the selected filter.</p>
              </div>
            ) : (
              filteredInvitations.map(invitation => (
                <div key={invitation._id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {invitation.collegeId.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {invitation.collegeId.shortName} • {invitation.collegeId.location.city}, {invitation.collegeId.location.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Proposed Visit Window:</strong><br />
                        {formatDate(invitation.campusVisitWindow.startDate)} - {formatDate(invitation.campusVisitWindow.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Sent:</strong> {formatDate(invitation.sentAt)}
                      </p>
                      {invitation.respondedAt && (
                        <p className="text-sm text-gray-600">
                          <strong>Responded:</strong> {formatDate(invitation.respondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default JobInvitationsPage;
