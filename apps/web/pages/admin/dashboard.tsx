import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';
import { 
  Users, 
  Building, 
  TrendingUp, 
  Activity, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  Mail,
  Phone,
  Globe,
  Calendar,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  Download,
  Eye,
  Trash2,
  Edit,
  UserX,
  UserCheck,
  Ban,
  UnlockKeyhole
} from 'lucide-react';

// Admin API functions
const adminApi = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // College management
  getAllColleges: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/colleges`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  approveCollege: async (collegeId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/approve`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  rejectCollege: async (collegeId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/reject`, 
      { reason }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  deactivateCollege: async (collegeId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/deactivate`, 
      { reason }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  activateCollege: async (collegeId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/activate`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  reactivateCollege: async (collegeId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/reactivate`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  suspendCollege: async (collegeId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/suspend`, 
      { reason }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  // Recruiter management
  getAllRecruiters: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/recruiters`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  approveRecruiter: async (recruiterId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/approve`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  rejectRecruiter: async (recruiterId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/reject`, 
      { reason }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  deactivateRecruiter: async (recruiterId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/deactivate`, 
      { reason }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  activateRecruiter: async (recruiterId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/activate`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  reactivateRecruiter: async (recruiterId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/reactivate`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  suspendRecruiter: async (recruiterId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/suspend`, 
      { reason }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  // Messaging
  sendMessageToCollege: async (collegeId: string, subject: string, message: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/colleges/${collegeId}/message`, 
      { subject, message }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  sendMessageToRecruiter: async (recruiterId: string, subject: string, message: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/recruiters/${recruiterId}/message`, 
      { subject, message }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  sendBroadcastToColleges: async (subject: string, message: string, filterApproved: boolean = false) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/broadcast/colleges`, 
      { subject, message, filterApproved }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },

  sendBroadcastToRecruiters: async (subject: string, message: string, filterApproved: boolean = false) => {
    const response = await axios.post(`${API_BASE_URL}/api/admin/broadcast/recruiters`, 
      { subject, message, filterApproved }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  }
};

interface College {
  _id: string;
  name: string;
  domainCode?: string;
  email: string;
  recognizedBy: string;
  aboutCollege: string;
  primaryContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated';
  approvedBy?: string;
  approvedAt?: Date;
  isVerified?: boolean;
  verificationDocuments?: string[];
  isActive?: boolean;
  submittedDocuments?: string[];
  resubmissionNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Recruiter {
  _id: string;
  companyInfo?: {
    name?: string;
    industry?: string;
  };
  recruiterProfile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  personalInfo?: {
    name?: string;
    phone?: string;
  };
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated';
  approvedBy?: string;
  approvedAt?: Date;
  isActive?: boolean;
  submittedDocuments?: string[];
  resubmissionNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  _id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminStats {
  totalColleges: number;
  totalRecruiters: number;
  pendingColleges: number;
  pendingRecruiters: number;
  approvedColleges: number;
  approvedRecruiters: number;
  rejectedColleges: number;
  rejectedRecruiters: number;
}

const AdminPanel: React.FC = () => {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalColleges: 0,
    totalRecruiters: 0,
    pendingColleges: 0,
    pendingRecruiters: 0,
    approvedColleges: 0,
    approvedRecruiters: 0,
    rejectedColleges: 0,
    rejectedRecruiters: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<College | Recruiter | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'colleges' | 'recruiters'>('colleges');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated'>('all');
  
  // Action states
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | 'message' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      const [collegesData, recruitersData, statsData] = await Promise.all([
        adminApi.getAllColleges().catch(err => {
          console.error('Error loading colleges:', err);
          return [];
        }),
        adminApi.getAllRecruiters().catch(err => {
          console.error('Error loading recruiters:', err);
          return [];
        }),
        adminApi.getDashboardStats().catch(err => {
          console.error('Error loading stats:', err);
          return {
            totalColleges: 0,
            totalRecruiters: 0,
            pendingColleges: 0,
            pendingRecruiters: 0,
            approvedColleges: 0,
            approvedRecruiters: 0,
            rejectedColleges: 0,
            rejectedRecruiters: 0
          };
        })
      ]);

      setColleges(Array.isArray(collegesData) ? collegesData : []);
      setRecruiters(Array.isArray(recruitersData) ? recruitersData : []);
      setStats(statsData || {
        totalColleges: 0,
        totalRecruiters: 0,
        pendingColleges: 0,
        pendingRecruiters: 0,
        approvedColleges: 0,
        approvedRecruiters: 0,
        rejectedColleges: 0,
        rejectedRecruiters: 0
      });
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entity: College | Recruiter) => {
    try {
      if (activeTab === 'colleges') {
        await adminApi.approveCollege(entity._id);
      } else {
        await adminApi.approveRecruiter(entity._id);
      }

      setSuccess(`${activeTab === 'colleges' ? 'College' : 'Recruiter'} approved successfully`);
      await loadData();
      setShowModal(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (entity: College | Recruiter, reason: string) => {
    try {
      if (activeTab === 'colleges') {
        await adminApi.rejectCollege(entity._id, reason);
      } else {
        await adminApi.rejectRecruiter(entity._id, reason);
      }

      setSuccess(`${activeTab === 'colleges' ? 'College' : 'Recruiter'} rejected successfully`);
      await loadData();
      setShowModal(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDelete = async (entity: College | Recruiter) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      if (activeTab === 'colleges') {
        await adminApi.deactivateCollege(entity._id, 'Admin deletion');
      } else {
        await adminApi.deactivateRecruiter(entity._id, 'Admin deletion');
      }

      setSuccess(`${activeTab === 'colleges' ? 'College' : 'Recruiter'} deleted successfully`);
      await loadData();
      setShowModal(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleReactivate = async (entity: College | Recruiter) => {
    try {
      if (activeTab === 'colleges') {
        await adminApi.reactivateCollege(entity._id);
      } else {
        await adminApi.reactivateRecruiter(entity._id);
      }

      setSuccess(`${activeTab === 'colleges' ? 'College' : 'Recruiter'} reactivated successfully`);
      await loadData();
      setShowModal(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reactivate');
    }
  };

  const handleSendMessage = async (entity: College | Recruiter, subject: string, message: string) => {
    try {
      if (activeTab === 'colleges') {
        await adminApi.sendMessageToCollege(entity._id, subject, message);
      } else {
        await adminApi.sendMessageToRecruiter(entity._id, subject, message);
      }

      setSuccess('Message sent successfully');
      setShowModal(false);
      setMessageSubject('');
      setMessageContent('');
      setActionType(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send message');
    }
  };

  const getFilteredData = () => {
    const data = activeTab === 'colleges' ? colleges : recruiters;
    if (filter === 'all') return data;
    return data.filter(item => item.approvalStatus === filter);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reverify': return 'bg-orange-100 text-orange-800';
      case 'deactivated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (entity: College | Recruiter) => {
    // Check if this is a reverification case (has resubmitted documents)
    if (entity.submittedDocuments && entity.submittedDocuments.length > 0 && entity.resubmissionNotes) {
      return 'REVERIFY';
    }
    // For other cases, use the actual status or default to PENDING
    const status = entity.approvalStatus || 'pending';
    return status.toUpperCase();
  };

  const renderEntityDetails = (entity: College | Recruiter) => {
    const isCollege = 'domainCode' in entity;
    
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-gray-700">
                {isCollege ? 'College Name' : 'Company Name'}:
              </label>
              <p className="text-gray-600">
                {isCollege ? (entity as College).name : (entity as Recruiter).companyInfo?.name || 'N/A'}
              </p>
            </div>
            {isCollege && (
              <>
                <div>
                  <label className="font-medium text-gray-700">Domain Code:</label>
                  <p className="text-gray-600">{(entity as College).domainCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Email:</label>
                  <p className="text-gray-600">{(entity as College).email || 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Primary Contact:</label>
                  <p className="text-gray-600">{(entity as College).primaryContact?.name || 'N/A'}</p>
                </div>
              </>
            )}
            {!isCollege && (
              <>
                <div>
                  <label className="font-medium text-gray-700">Industry:</label>
                  <p className="text-gray-600">{(entity as Recruiter).companyInfo?.industry || 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Company Name:</label>
                  <p className="text-gray-600">{(entity as Recruiter).companyInfo?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Industry:</label>
                  <p className="text-gray-600">{(entity as Recruiter).companyInfo?.industry || 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Recruiter Name:</label>
                  <p className="text-gray-600">
                    {(entity as Recruiter).recruiterProfile?.firstName && (entity as Recruiter).recruiterProfile?.lastName
                      ? `${(entity as Recruiter).recruiterProfile!.firstName} ${(entity as Recruiter).recruiterProfile!.lastName}` 
                      : 'N/A'}
                  </p>
                </div>
              </>
            )}
            <div>
              <label className="font-medium text-gray-700">Contact Email:</label>
              <p className="text-gray-600">
                {isCollege ? (entity as College).email || 'N/A' : (entity as Recruiter).recruiterProfile?.email || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-gray-700">Contact Person:</label>
              <p className="text-gray-600">
                {isCollege 
                  ? (entity as College).primaryContact?.name || 'N/A'
                  : `${(entity as Recruiter).recruiterProfile?.firstName || ''} ${(entity as Recruiter).recruiterProfile?.lastName || ''}`.trim() || 'N/A'
                }
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Designation:</label>
              <p className="text-gray-600">
                {isCollege 
                  ? 'Administrator'
                  : 'Recruiter'
                }
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Email:</label>
              <p className="text-gray-600">
                {isCollege 
                  ? (entity as College).primaryContact?.email || (entity as College).email || 'N/A'
                  : (entity as Recruiter).recruiterProfile?.email || 'N/A'
                }
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Phone:</label>
              <p className="text-gray-600">
                {isCollege 
                  ? (entity as College).primaryContact?.phone || 'N/A'
                  : (entity as Recruiter).personalInfo?.phone || 'N/A'
                }
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Entity ID:</label>
              <p className="text-gray-600 text-sm">
                {entity._id || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information - Only for colleges or if available */}
        {(isCollege && (entity as College).address) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-gray-700">City:</label>
                <p className="text-gray-600">{(entity as College).address!.city || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">State:</label>
                <p className="text-gray-600">{(entity as College).address!.state || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Country:</label>
                <p className="text-gray-600">{(entity as College).address!.country || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Status & Verification</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-gray-700">Approval Status:</label>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(entity.approvalStatus || 'pending')}`}>
                {(entity.approvalStatus || 'PENDING').toUpperCase()}
              </span>
            </div>
            <div>
              <label className="font-medium text-gray-700">Verified:</label>
              <p className="text-gray-600">
                {(isCollege ? (entity as College).isVerified : true) ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Active:</label>
              <p className="text-gray-600">{entity.isActive ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Created:</label>
              <p className="text-gray-600">{new Date(entity.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {entity.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Rejection Reason:</p>
              <p className="text-red-700">{entity.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        {(isCollege ? (entity as College).verificationDocuments : (entity as Recruiter).submittedDocuments) && 
         (isCollege ? (entity as College).verificationDocuments : (entity as Recruiter).submittedDocuments)!.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {isCollege ? 'Verification Documents' : 'Submitted Documents'}
            </h3>
            <div className="space-y-2">
              {(isCollege ? (entity as College).verificationDocuments : (entity as Recruiter).submittedDocuments)!.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Document {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage colleges and recruiters</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Colleges</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalColleges}</p>
            <p className="text-sm text-gray-500">
              {stats.pendingColleges} pending, {stats.approvedColleges} approved
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Recruiters</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalRecruiters}</p>
            <p className="text-sm text-gray-500">
              {stats.pendingRecruiters} pending, {stats.approvedRecruiters} approved
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingColleges + stats.pendingRecruiters}
            </p>
            <p className="text-sm text-gray-500">Requires attention</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Rejected</h3>
            <p className="text-3xl font-bold text-red-600">
              {stats.rejectedColleges + stats.rejectedRecruiters}
            </p>
            <p className="text-sm text-gray-500">Need review</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('colleges')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'colleges'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Colleges ({stats.totalColleges})
              </button>
              <button
                onClick={() => setActiveTab('recruiters')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'recruiters'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Recruiters ({stats.totalRecruiters})
              </button>
            </nav>
          </div>
          
          <div className="p-4">
            <div className="flex space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reverify">Reverify</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'colleges' ? 'College' : 'Company'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredData().map((entity) => (
                  <tr key={entity._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {activeTab === 'colleges' 
                                ? (entity as College).name?.charAt(0) || 'C'
                                : (entity as Recruiter).companyInfo?.name?.charAt(0) || 'R'
                              }
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activeTab === 'colleges' 
                              ? (entity as College).name || 'Unknown College'
                              : (entity as Recruiter).companyInfo?.name || 'Unknown Company'
                            }
                          </div>
                          <div className="text-sm text-gray-500">
                            {activeTab === 'colleges' 
                              ? (entity as College).domainCode || 'No domain code'
                              : (entity as Recruiter).companyInfo?.industry || 'Unknown industry'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activeTab === 'colleges' 
                          ? (entity as College).primaryContact?.name || 'No contact info'
                          : `${(entity as Recruiter).recruiterProfile?.firstName || ''} ${(entity as Recruiter).recruiterProfile?.lastName || ''}`.trim() || 'No contact info'
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {activeTab === 'colleges' 
                          ? (entity as College).primaryContact?.email || 'No email'
                          : 'Contact via admin panel'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(entity.approvalStatus || 'pending')}`}>
                        {getStatusText(entity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            if (activeTab === 'colleges') {
                              router.push(`/admin/college-details?id=${entity._id}`);
                            } else {
                              router.push(`/admin/recruiter-details?id=${entity._id}`);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedEntity && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {actionType === 'reject' ? 'Reject Application' :
                       actionType === 'message' ? 'Send Message' :
                       `${activeTab === 'colleges' ? 'College' : 'Recruiter'} Details`}
                    </h3>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setActionType(null);
                        setRejectionReason('');
                        setMessageSubject('');
                        setMessageContent('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {actionType === 'reject' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          placeholder="Please provide a reason for rejection..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(selectedEntity, rejectionReason)}
                          disabled={!rejectionReason.trim()}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : actionType === 'message' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={messageSubject}
                          onChange={(e) => setMessageSubject(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          placeholder="Enter message subject..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Message
                        </label>
                        <textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          rows={4}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          placeholder="Enter your message..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendMessage(selectedEntity, messageSubject, messageContent)}
                          disabled={!messageSubject.trim() || !messageContent.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {renderEntityDetails(selectedEntity)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
