import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { API_BASE_URL } from '../../utils/api';

interface College {
  _id: string;
  name: string;
  email: string;
  shortName?: string;
  domainCode?: string;
  website?: string;
  logo?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  primaryContact: {
    name?: string;
    email?: string;
    phone?: string;
    designation?: string;
  };
  establishedYear?: number;
  affiliation?: string;
  recognizedBy?: string;
  aboutCollege?: string;
  accreditation?: string[];
  departments?: string[];
  courses?: string[];
  students?: any[];
  approvedRecruiters?: any[];
  pendingRecruiters?: any[];
  placementStats?: any[];
  isPlacementActive?: boolean;
  placementCriteria?: {
    minimumCGPA?: number;
    allowedBranches?: string[];
    noOfBacklogs?: number;
  };
  isVerified?: boolean;
  verificationDocuments?: string[];
  isActive?: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated';
  rejectionReason?: string;
  resubmissionNotes?: string;
  submittedDocuments?: string[];
  allowDirectApplications?: boolean;
  notifications?: any[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

const CollegeDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchCollegeDetails(id);
    }
  }, [id]);

  const fetchCollegeDetails = async (collegeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/colleges/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setCollege(response.data);
    } catch (err: any) {
      console.error('Error fetching college details:', err);
      setError(err.response?.data?.message || 'Failed to fetch college details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected', reason?: string) => {
    if (!college) return;
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      
      await axios.post(`${API_BASE_URL}/api/admin/colleges/${college._id}/${endpoint}`, {
        ...(reason && { reason })
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh college details
      await fetchCollegeDetails(college._id);
      alert(`College ${status} successfully!`);
    } catch (err: any) {
      console.error(`Error ${status} college:`, err);
      alert(err.response?.data?.message || `Failed to ${status} college`);
    }
  };

  const handleReverify = async () => {
    if (!college) return;
    
    const reason = prompt('Please provide a reason for requesting reverification:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/admin/colleges/${college._id}/reverify`, {
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh college details
      await fetchCollegeDetails(college._id);
      alert('College reverification requested successfully!');
    } catch (err: any) {
      console.error('Error requesting reverification:', err);
      alert(err.response?.data?.message || 'Failed to request reverification');
    }
  };

  const handleDeactivate = async () => {
    if (!college || !deactivationReason.trim()) {
      alert('Please provide a reason for deactivation');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/admin/colleges/${college._id}/deactivate`, {
        reason: deactivationReason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh college details
      await fetchCollegeDetails(college._id);
      setShowDeactivateModal(false);
      setDeactivationReason('');
      alert('College deactivated successfully!');
    } catch (err: any) {
      console.error('Error deactivating college:', err);
      alert(err.response?.data?.message || 'Failed to deactivate college');
    }
  };

  const handleReactivate = async () => {
    if (!college) return;
    
    if (!confirm('Are you sure you want to reactivate this college? This will change its status to approved and make it active again.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/admin/colleges/${college._id}/reactivate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh college details
      await fetchCollegeDetails(college._id);
      alert('College reactivated successfully!');
    } catch (err: any) {
      console.error('Error reactivating college:', err);
      alert(err.response?.data?.message || 'Failed to reactivate college');
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
        if (college?.submittedDocuments && college.submittedDocuments.length > 0 && college.resubmissionNotes) {
          return 'bg-orange-100 text-orange-800';
        }
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'pending' && college?.submittedDocuments && college.submittedDocuments.length > 0 && college.resubmissionNotes) {
      return 'REVERIFY';
    }
    return status.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading college details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">College not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </button>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(college.approvalStatus)}`}>
            {getStatusText(college.approvalStatus)}
          </span>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header with Logo and College Name */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-6">
            <div className="flex items-center space-x-4">
              {college.logo && (
                <img
                  src={college.logo}
                  alt={`${college.name} Logo`}
                  className="w-16 h-16 rounded-lg bg-white p-2 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{college.name}</h1>
                {college.shortName && (
                  <p className="text-blue-100 text-lg">({college.shortName})</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">College ID</label>
                    <p className="text-gray-900">{college._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Short Name</label>
                    <p className="text-gray-900">{college.shortName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Domain Code</label>
                    <p className="text-gray-900">{college.domainCode || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="text-gray-900">
                      {college.website ? (
                        <a href={`https://${college.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {college.website}
                        </a>
                      ) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Founded Year</label>
                    <p className="text-gray-900">{college.establishedYear || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Affiliation</label>
                    <p className="text-gray-900">{college.affiliation || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recognized By</label>
                    <p className="text-gray-900">{college.recognizedBy || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">About College</label>
                    <p className="text-gray-900">{college.aboutCollege || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Accreditation</label>
                    <p className="text-gray-900">
                      {college.accreditation && college.accreditation.length > 0 
                        ? college.accreditation.join(', ') 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departments</label>
                    <p className="text-gray-900">
                      {college.departments && college.departments.length > 0 
                        ? college.departments.join(', ') 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Courses Offered</label>
                    <p className="text-gray-900">
                      {college.courses && college.courses.length > 0 
                        ? college.courses.join(', ') 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Students</label>
                    <p className="text-gray-900">{college.students?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <div className="text-gray-900">
                      {college.address?.street && <p>{college.address.street}</p>}
                      <p>
                        {[college.address?.city, college.address?.state, college.address?.zipCode]
                          .filter(Boolean)
                          .join(', ') || 'Not provided'}
                      </p>
                      {college.address?.country && <p>{college.address.country}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Contact</label>
                    <div className="text-gray-900">
                      <p><strong>{college.primaryContact?.name || 'Not provided'}</strong></p>
                      {college.primaryContact?.designation && (
                        <p className="text-sm text-gray-600">{college.primaryContact.designation}</p>
                      )}
                      {college.primaryContact?.email && (
                        <p className="text-sm">
                          <a href={`mailto:${college.primaryContact.email}`} className="text-blue-600 hover:underline">
                            {college.primaryContact.email}
                          </a>
                        </p>
                      )}
                      {college.primaryContact?.phone && (
                        <p className="text-sm">{college.primaryContact.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Academic Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Placement Active</label>
                  <p className="text-gray-900">{college.isPlacementActive ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Direct Applications</label>
                  <p className="text-gray-900">{college.allowDirectApplications ? 'Allowed' : 'Not Allowed'}</p>
                </div>
                {college.placementCriteria && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Minimum CGPA</label>
                      <p className="text-gray-900">{college.placementCriteria.minimumCGPA || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Backlogs</label>
                      <p className="text-gray-900">{college.placementCriteria.noOfBacklogs || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Documents</h3>
              
              {college.submittedDocuments && college.submittedDocuments.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submitted Documents (Reverification)</label>
                  <div className="space-y-2">
                    {college.submittedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
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
              
              {college.verificationDocuments && college.verificationDocuments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Documents</label>
                  <div className="space-y-2">
                    {college.verificationDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
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

            {/* Status Information */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Status Information</h3>
              
              {college.resubmissionNotes && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Resubmission Notes</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800">{college.resubmissionNotes}</p>
                  </div>
                </div>
              )}
              
              {college.rejectionReason && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800">{college.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Actions</h3>
              <div className="flex flex-wrap gap-4">
                {college.approvalStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Approve College
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
                      Reject College
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleReverify}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Reverify College
                </button>
                
                {college.approvalStatus === 'deactivated' ? (
                  <button
                    onClick={handleReactivate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Reactivate College
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Deactivate College
                  </button>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p>{new Date(college.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p>{new Date(college.updatedAt).toLocaleString()}</p>
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
                Deactivate College
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for deactivating this college. The college will be notified and will need to address this reason to reactivate their account.
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

export default CollegeDetails;
