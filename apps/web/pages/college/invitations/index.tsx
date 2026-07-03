import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { API_BASE_URL } from '../../../utils/api';

interface JobInvitation {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    companyName: string;
    description: string;
    salary: {
      min: number;
      max: number;
      currency: string;
    };
    experienceLevel: string;
  };
  recruiterId: {
    _id: string;
    companyInfo: {
      companyName: string;
    };
  };
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
  campusVisitWindow: {
    startDate: string;
    endDate: string;
    confirmedStartDate?: string;
    confirmedEndDate?: string;
    isFlexible: boolean;
    preferredTimeSlots: string[];
  };
  eligibilityCriteria: {
    courses: string[];
    minCGPA: number;
    graduationYear: number;
    maxBacklogs: number;
  };
  studentLimits: {
    minStudents: number;
    maxStudents: number;
  };
  sentAt: string;
  expiresAt: string;
  invitationMessage?: string;
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
}

const CollegeInvitationsPage = () => {
  // const router = useRouter();
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedInvitation, setSelectedInvitation] = useState<JobInvitation | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'accept' | 'decline' | 'counter'>('accept');
  const [responseData, setResponseData] = useState({
    message: '',
    confirmedDates: {
      startDate: '',
      endDate: ''
    },
    alternativeDates: [{
      startDate: '',
      endDate: ''
    }]
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Use the correct endpoint that gets invitations based on authenticated user
      const response = await axios.get(`${API_BASE_URL}/api/colleges/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Invitations response:', response.data);
      setInvitations(response.data.data?.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!selectedInvitation) return;

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      const payload: Record<string, unknown> = { message: responseData.message };

      switch (responseType) {
        case 'accept':
          endpoint = `${API_BASE_URL}/api/colleges/invitations/${selectedInvitation._id}/accept`;
          if (responseData.confirmedDates.startDate && responseData.confirmedDates.endDate) {
            payload.campusVisitWindow = responseData.confirmedDates;
          }
          break;
        case 'decline':
          endpoint = `${API_BASE_URL}/api/colleges/invitations/${selectedInvitation._id}/decline`;
          payload.reason = responseData.message;
          break;
        case 'counter':
          endpoint = `${API_BASE_URL}/api/colleges/invitations/${selectedInvitation._id}/counter`;
          payload.alternativeDates = responseData.alternativeDates.filter(date => 
            date.startDate && date.endDate
          );
          break;
      }

      await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Invitation ${responseType}ed successfully!`);
      setShowResponseModal(false);
      setSelectedInvitation(null);
      fetchInvitations();
    } catch (error: unknown) {
      console.error('Error responding to invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to respond to invitation';
      alert(errorMessage);
    }
  };

  const openResponseModal = (invitation: JobInvitation, type: 'accept' | 'decline' | 'counter') => {
    setSelectedInvitation(invitation);
    setResponseType(type);
    setResponseData({
      message: '',
      confirmedDates: {
        startDate: invitation.campusVisitWindow.startDate,
        endDate: invitation.campusVisitWindow.endDate
      },
      alternativeDates: [{
        startDate: '',
        endDate: ''
      }]
    });
    setShowResponseModal(true);
  };

  const addAlternativeDate = () => {
    setResponseData(prev => ({
      ...prev,
      alternativeDates: [...prev.alternativeDates, { startDate: '', endDate: '' }]
    }));
  };

  const updateAlternativeDate = (index: number, field: 'startDate' | 'endDate', value: string) => {
    setResponseData(prev => ({
      ...prev,
      alternativeDates: prev.alternativeDates.map((date, i) => 
        i === index ? { ...date, [field]: value } : date
      )
    }));
  };

  const removeAlternativeDate = (index: number) => {
    setResponseData(prev => ({
      ...prev,
      alternativeDates: prev.alternativeDates.filter((_, i) => i !== index)
    }));
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

  const formatSalary = (min: number, max: number, currency: string) => {
    return `${currency} ${(min / 100000).toFixed(1)}L - ${(max / 100000).toFixed(1)}L`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['college', 'tpo', 'college_admin']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading invitations...</div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['college', 'tpo', 'college_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Campus Recruitment Invitations</h1>
            <p className="text-gray-600">Manage job invitations from recruiters</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Invitations</h3>
              <p className="text-3xl font-bold text-blue-600">{invitations.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Pending Response</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {invitations.filter(inv => inv.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Accepted</h3>
              <p className="text-3xl font-bold text-green-600">
                {invitations.filter(inv => inv.status === 'accepted').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">In Negotiation</h3>
              <p className="text-3xl font-bold text-blue-600">
                {invitations.filter(inv => inv.status === 'negotiating').length}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['pending', 'accepted', 'declined', 'negotiating', 'all'].map(tab => (
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
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {invitation.jobId.title}
                      </h3>
                      <p className="text-lg text-blue-600 font-medium">
                        {invitation.jobId.companyName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatSalary(invitation.jobId.salary.min, invitation.jobId.salary.max, invitation.jobId.salary.currency)} • {invitation.jobId.experienceLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                      {invitation.status === 'pending' && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {getTimeRemaining(invitation.expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Campus Visit Window</h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(invitation.campusVisitWindow.startDate)} - {formatDate(invitation.campusVisitWindow.endDate)}
                      </p>
                      {invitation.campusVisitWindow.isFlexible && (
                        <p className="text-xs text-green-600 mt-1">Flexible dates allowed</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Student Requirements</h4>
                      <p className="text-sm text-gray-600">
                        Min CGPA: {invitation.eligibilityCriteria.minCGPA} • 
                        Graduation: {invitation.eligibilityCriteria.graduationYear} • 
                        Students: {invitation.studentLimits.minStudents}-{invitation.studentLimits.maxStudents}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Courses: {invitation.eligibilityCriteria.courses.join(', ')}
                      </p>
                    </div>
                  </div>

                  {invitation.invitationMessage && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Message from Recruiter</h4>
                      <p className="text-sm text-gray-600">{invitation.invitationMessage}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {invitation.status === 'pending' && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openResponseModal(invitation, 'accept')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Accept Invitation
                      </button>
                      <button
                        onClick={() => openResponseModal(invitation, 'counter')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Propose Alternative Dates
                      </button>
                      <button
                        onClick={() => openResponseModal(invitation, 'decline')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        Decline Invitation
                      </button>
                    </div>
                  )}

                  {/* Response Details */}
                  {invitation.tpoResponse && (
                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Your Response</h4>
                      <p className="text-sm text-gray-600 mb-2">{invitation.tpoResponse.responseMessage}</p>
                      <p className="text-xs text-gray-500">
                        Responded on: {formatDate(invitation.tpoResponse.responseDate)}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Invitation sent: {formatDate(invitation.sentAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 capitalize">
                  {responseType} Invitation - {selectedInvitation.jobId.title}
                </h3>

                <div className="space-y-4">
                  {responseType === 'accept' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Visit Dates (Optional - uses proposed dates if empty)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={responseData.confirmedDates.startDate}
                          onChange={(e) => setResponseData(prev => ({
                            ...prev,
                            confirmedDates: { ...prev.confirmedDates, startDate: e.target.value }
                          }))}
                          className="p-2 border border-gray-300 rounded"
                        />
                        <input
                          type="date"
                          value={responseData.confirmedDates.endDate}
                          onChange={(e) => setResponseData(prev => ({
                            ...prev,
                            confirmedDates: { ...prev.confirmedDates, endDate: e.target.value }
                          }))}
                          className="p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  )}

                  {responseType === 'counter' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alternative Dates
                      </label>
                      {responseData.alternativeDates.map((date, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="date"
                            value={date.startDate}
                            onChange={(e) => updateAlternativeDate(index, 'startDate', e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded"
                            placeholder="Start Date"
                          />
                          <input
                            type="date"
                            value={date.endDate}
                            onChange={(e) => updateAlternativeDate(index, 'endDate', e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded"
                            placeholder="End Date"
                          />
                          {responseData.alternativeDates.length > 1 && (
                            <button
                              onClick={() => removeAlternativeDate(index)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addAlternativeDate}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      >
                        Add Alternative Date
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {responseType === 'decline' ? 'Reason for declining' : 'Message (Optional)'}
                    </label>
                    <textarea
                      value={responseData.message}
                      onChange={(e) => setResponseData(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder={responseType === 'decline' ? 'Please provide a reason...' : 'Add a message...'}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResponse}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${
                      responseType === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                      responseType === 'decline' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {responseType === 'accept' ? 'Accept Invitation' :
                     responseType === 'decline' ? 'Decline Invitation' :
                     'Send Counter Proposal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default CollegeInvitationsPage;
