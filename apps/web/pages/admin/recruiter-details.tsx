import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

interface Recruiter {
  _id: string;
  userId: {
    email: string;
    phone: string;
    createdAt: string;
  };
  companyInfo: {
    name: string;
    website?: string;
    size?: string;
    industry?: string;
    logo?: string;
    headquarters: {
      city: string;
      state: string;
      country: string;
    };
  };
  recruiterProfile: {
    firstName: string;
    lastName: string;
    designation: string;
    department?: string;
    linkedinUrl?: string;
    profilePicture?: string;
  };
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated';
  rejectionReason?: string;
  resubmissionNotes?: string;
  submittedDocuments?: string[];
  verificationDocuments?: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

const RecruiterDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchRecruiterDetails(id);
    }
  }, [id]);

  const fetchRecruiterDetails = async (recruiterId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setRecruiter(response.data);
    } catch (err: any) {
      console.error('Error fetching recruiter details:', err);
      setError(err.response?.data?.message || 'Failed to fetch recruiter details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected', reason?: string) => {
    if (!recruiter) return;
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      
      await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiter._id}/${endpoint}`, {
        ...(reason && { reason })
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh recruiter details
      await fetchRecruiterDetails(recruiter._id);
      alert(`Recruiter ${status} successfully!`);
    } catch (err: any) {
      console.error(`Error ${status} recruiter:`, err);
      alert(err.response?.data?.message || `Failed to ${status} recruiter`);
    }
  };

  const handleReverify = async () => {
    if (!recruiter) return;
    
    const reason = prompt('Please provide a reason for requesting reverification:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiter._id}/reverify`, {
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh recruiter details
      await fetchRecruiterDetails(recruiter._id);
      alert('Recruiter reverification requested successfully!');
    } catch (err: any) {
      console.error('Error requesting reverification:', err);
      alert(err.response?.data?.message || 'Failed to request reverification');
    }
  };

  const handleDeactivate = async () => {
    if (!recruiter || !deactivationReason.trim()) {
      alert('Please provide a reason for deactivation');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiter._id}/deactivate`, {
        reason: deactivationReason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh recruiter details
      await fetchRecruiterDetails(recruiter._id);
      setShowDeactivateModal(false);
      setDeactivationReason('');
      alert('Recruiter deactivated successfully!');
    } catch (err: any) {
      console.error('Error deactivating recruiter:', err);
      alert(err.response?.data?.message || 'Failed to deactivate recruiter');
    }
  };

  const handleReactivate = async () => {
    if (!recruiter) return;
    
    if (!confirm('Are you sure you want to reactivate this recruiter? This will change its status to approved and make it active again.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiter._id}/reactivate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh recruiter details
      await fetchRecruiterDetails(recruiter._id);
      alert('Recruiter reactivated successfully!');
    } catch (err: any) {
      console.error('Error reactivating recruiter:', err);
      alert(err.response?.data?.message || 'Failed to reactivate recruiter');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        // Check if this is a reverification case
        if (recruiter?.submittedDocuments && recruiter.submittedDocuments.length > 0 && recruiter.resubmissionNotes) {
          return 'bg-orange-100 text-orange-800';
        }
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'pending' && recruiter?.submittedDocuments && recruiter.submittedDocuments.length > 0 && recruiter.resubmissionNotes) {
      return 'REVERIFY';
    }
    return status.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading recruiter details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!recruiter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">Recruiter not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(recruiter.approvalStatus)}`}>
            {getStatusText(recruiter.approvalStatus)}
          </span>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-6">
            <div className="flex items-center space-x-4">
              {recruiter.companyInfo?.logo && (
                <img
                  src={recruiter.companyInfo.logo}
                  alt={`${recruiter.companyInfo.name} Logo`}
                  className="w-16 h-16 rounded-lg bg-white p-2 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{recruiter.companyInfo.name}</h1>
                <p className="text-purple-100 text-lg">{recruiter.recruiterProfile.firstName} {recruiter.recruiterProfile.lastName}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Company Information */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recruiter ID</label>
                    <p className="text-gray-900">{recruiter._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <p className="text-gray-900">{recruiter.companyInfo.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="text-gray-900">
                      {recruiter.companyInfo.website ? (
                        <a href={`https://${recruiter.companyInfo.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {recruiter.companyInfo.website}
                        </a>
                      ) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Size</label>
                    <p className="text-gray-900">{recruiter.companyInfo.size || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                    <p className="text-gray-900">{recruiter.companyInfo.industry || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{recruiter.recruiterProfile.firstName} {recruiter.recruiterProfile.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <p className="text-gray-900">{recruiter.recruiterProfile.designation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">
                      <a href={`mailto:${recruiter.userId.email}`} className="text-blue-600 hover:underline">
                        {recruiter.userId.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{recruiter.userId.phone}</p>
                  </div>
                  {recruiter.recruiterProfile.linkedinUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                      <p className="text-gray-900">
                        <a href={recruiter.recruiterProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {recruiter.recruiterProfile.linkedinUrl}
                        </a>
                      </p>
                    </div>
                  )}
                  {recruiter.companyInfo.headquarters && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Address</label>
                      <div className="text-gray-900">
                        <p>
                          {[recruiter.companyInfo.headquarters.city, recruiter.companyInfo.headquarters.state]
                            .filter(Boolean)
                            .join(', ') || 'Not provided'}
                        </p>
                        {recruiter.companyInfo.headquarters.country && <p>{recruiter.companyInfo.headquarters.country}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            {(recruiter.submittedDocuments && recruiter.submittedDocuments.length > 0) || 
             (recruiter.verificationDocuments && recruiter.verificationDocuments.length > 0) ? (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Documents</h3>
                
                {recruiter.submittedDocuments && recruiter.submittedDocuments.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Submitted Documents (Reverification)</label>
                    <div className="space-y-2">
                      {recruiter.submittedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm text-blue-800">Resubmitted Doc {index + 1}</span>
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {recruiter.verificationDocuments && recruiter.verificationDocuments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Documents</label>
                    <div className="space-y-2">
                      {recruiter.verificationDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-700">Document {index + 1}</span>
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Status Information */}
            {(recruiter.resubmissionNotes || recruiter.rejectionReason) && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Status Information</h3>
                
                {recruiter.resubmissionNotes && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Resubmission Notes</label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800">{recruiter.resubmissionNotes}</p>
                    </div>
                  </div>
                )}
                
                {recruiter.rejectionReason && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                    <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-800">{recruiter.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Actions</h3>
              <div className="flex flex-wrap gap-4">
                {recruiter.approvalStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Approve Recruiter
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide a reason for rejection:');
                        if (reason) {
                          handleStatusUpdate('rejected', reason);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reject Recruiter
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleReverify}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Reverify Recruiter
                </button>
                
                {recruiter.approvalStatus === 'deactivated' ? (
                  <button
                    onClick={handleReactivate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Reactivate Recruiter
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Deactivate Recruiter
                  </button>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p>{new Date(recruiter.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p>{new Date(recruiter.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Deactivate Recruiter
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for deactivating this recruiter. The recruiter will be notified and will need to address this reason to reactivate their account.
              </p>
              <textarea
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Enter deactivation reason..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
                required
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivationReason('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  disabled={!deactivationReason.trim()}
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDetails;
