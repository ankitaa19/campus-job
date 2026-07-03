import { useMemo, useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  Calendar,
  ChevronDown,
  Filter,
  GraduationCap,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Search,
  Target,
  Users,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  AlertCircle,
  ArrowRight,
  Building,
  MessageSquare,
  ExternalLink,
  Briefcase,
  Flame,
} from 'lucide-react';

// Base college interface
interface BaseCollege {
  _id: string;
  name: string;
  location: {
    city: string;
    state: string;
  };
  studentsCount: number;
  coursesCount: number;
  establishedYear?: number;
  placementOfficer: {
    name: string;
    phone: string;
    email: string;
  };
  departments: string[];
  isActive: boolean;
}

// College discovery card - Only show colleges we haven't sent invitations to and aren't connected/partnered
interface DiscoverCollegeCard extends BaseCollege {
  connectionStatus: 'none' | 'pending' | 'connected' | 'partner' | 'expired';
  canSendInvitation: boolean;
}

// Invitation from colleges to recruiter - Show invitations received from colleges
interface IncomingInvitation {
  _id: string;
  college: BaseCollege;
  invitationDate: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  jobRoles: string[];
  campusVisitDates?: {
    proposedDates: Array<{
      startDate: string;
      endDate: string;
    }>;
  };
}

// Invitation sent by recruiter to colleges - Show requests sent to colleges
interface OutgoingInvitation {
  _id: string;
  college: BaseCollege;
  sentDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expiresAt: string;
}

// Connected colleges
interface ConnectedCollege extends BaseCollege {
  connectionDate: string;
  lastInteraction: string;
  activeJobs: number;
  totalApplications: number;
}

const ConnectCollegesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'incoming' | 'status'>('discover');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvitation, setSelectedInvitation] = useState<IncomingInvitation | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<BaseCollege | null>(null);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Helper function to mask placement officer details for non-connected colleges
  const getMaskedPlacementOfficer = (
    placementOfficer: BaseCollege['placementOfficer'], 
    connectionStatus?: string,
    invitationStatus?: string
  ) => {
    const isConnected = connectionStatus === 'connected' || 
                       connectionStatus === 'partner' || 
                       invitationStatus === 'accepted';
    
    if (isConnected) {
      return placementOfficer;
    }
    
    return {
      name: 'XXXXXXXXXXXX',
      phone: '+91 XXXXXXXXXX',
      email: 'XXXXXXXX@XXXXX.XXX'
    };
  };

  // Summary statistics
  const summaryStats = useMemo(() => ({
    incoming: 4,
    outgoing: 8,
    connected: 12,
    pending: 3
  }), []);

  // Mock data for discover colleges - Only colleges where we haven't sent invitations and aren't connected
  const allColleges = useMemo<DiscoverCollegeCard[]>(() => [
    {
      _id: '1',
      name: 'Indian Institute of Technology Delhi',
      location: { city: 'New Delhi', state: 'Delhi' },
      studentsCount: 12500,
      coursesCount: 8,
      establishedYear: 1961,
      placementOfficer: {
        name: 'Dr. Rajesh Kumar',
        phone: '+91 9876543210',
        email: 'placement@iitd.ac.in'
      },
      departments: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering'],
      isActive: true,
      connectionStatus: 'none',
      canSendInvitation: true
    },
    {
      _id: '2',
      name: 'National Institute of Technology Karnataka',
      location: { city: 'Surathkal', state: 'Karnataka' },
      studentsCount: 8200,
      coursesCount: 6,
      establishedYear: 1960,
      placementOfficer: {
        name: 'Prof. Priya Sharma',
        phone: '+91 9123456789',
        email: 'placement@nitk.edu.in'
      },
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Civil Engineering'],
      isActive: true,
      connectionStatus: 'none',
      canSendInvitation: true
    },
    {
      _id: '3',
      name: 'Birla Institute of Technology and Science',
      location: { city: 'Pilani', state: 'Rajasthan' },
      studentsCount: 15000,
      coursesCount: 10,
      establishedYear: 1964,
      placementOfficer: {
        name: 'Ms. Anita Gupta',
        phone: '+91 9234567890',
        email: 'placement@bits-pilani.ac.in'
      },
      departments: ['Computer Science', 'Electronics', 'Mechanical', 'Chemical', 'Civil Engineering'],
      isActive: true,
      connectionStatus: 'none',
      canSendInvitation: true
    },
    {
      _id: '4',
      name: 'Vellore Institute of Technology',
      location: { city: 'Vellore', state: 'Tamil Nadu' },
      studentsCount: 25000,
      coursesCount: 12,
      establishedYear: 1984,
      placementOfficer: {
        name: 'Dr. Suresh Raman',
        phone: '+91 9345678901',
        email: 'placement@vit.ac.in'
      },
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Biotechnology', 'MBA'],
      isActive: true,
      connectionStatus: 'none',
      canSendInvitation: true
    },
    {
      _id: '5',
      name: 'Indian Institute of Information Technology Allahabad',
      location: { city: 'Prayagraj', state: 'Uttar Pradesh' },
      studentsCount: 6800,
      coursesCount: 4,
      establishedYear: 1999,
      placementOfficer: {
        name: 'Prof. Amit Verma',
        phone: '+91 9456789012',
        email: 'placement@iiita.ac.in'
      },
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Applied Mathematics'],
      isActive: true,
      connectionStatus: 'none',
      canSendInvitation: true
    },
    {
      _id: '6',
      name: 'Manipal Institute of Technology',
      location: { city: 'Manipal', state: 'Karnataka' },
      studentsCount: 11000,
      coursesCount: 9,
      establishedYear: 1957,
      placementOfficer: {
        name: 'Ms. Kavitha Nair',
        phone: '+91 9567890123',
        email: 'placement@manipal.edu'
      },
      departments: ['Computer Science', 'Information Technology', 'Mechanical', 'Biotechnology', 'Architecture'],
      isActive: true,
      connectionStatus: 'none',
      canSendInvitation: true
    }
  ], []);

  // Filter discover colleges - Only show colleges with 'none' status (not invited and not connected)
  const discoverColleges = useMemo(() => {
    return allColleges.filter(college => college.connectionStatus === 'none');
  }, [allColleges]);

  // Mock data for incoming invitations - Invitations received from colleges
  const incomingInvitations = useMemo<IncomingInvitation[]>(() => [
    {
      _id: 'inv-1',
      college: {
        _id: 'col-1',
        name: 'SRM Institute of Science and Technology',
        location: { city: 'Chennai', state: 'Tamil Nadu' },
        studentsCount: 18000,
        coursesCount: 7,
        placementOfficer: {
          name: 'Dr. Meera Krishnan',
          phone: '+91 9876543211',
          email: 'placement@srmist.edu.in'
        },
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical Engineering'],
        isActive: true
      },
      invitationDate: '2024-11-10',
      expiresAt: '2024-12-10',
      status: 'pending',
      message: 'We would like to partner with your company for campus placements and recruitment opportunities.',
      jobRoles: ['Software Engineer', 'Data Analyst', 'Product Manager']
    },
    {
      _id: 'inv-2',
      college: {
        _id: 'col-2',
        name: 'Jadavpur University',
        location: { city: 'Kolkata', state: 'West Bengal' },
        studentsCount: 9500,
        coursesCount: 6,
        placementOfficer: {
          name: 'Prof. Subrata Das',
          phone: '+91 9876543212',
          email: 'placement@jadavpuruniversity.in'
        },
        departments: ['Computer Science', 'Electronics', 'Mechanical', 'Chemical Engineering'],
        isActive: true
      },
      invitationDate: '2024-11-08',
      expiresAt: '2024-12-08',
      status: 'pending',
      message: 'Looking forward to establishing a mutually beneficial partnership for student placements.',
      jobRoles: ['Software Developer', 'System Analyst', 'Quality Assurance']
    },
    {
      _id: 'inv-3',
      college: {
        _id: 'col-3',
        name: 'Delhi Technological University',
        location: { city: 'New Delhi', state: 'Delhi' },
        studentsCount: 7200,
        coursesCount: 8,
        placementOfficer: {
          name: 'Ms. Neha Agarwal',
          phone: '+91 9876543213',
          email: 'placement@dtu.ac.in'
        },
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Software Engineering'],
        isActive: true
      },
      invitationDate: '2024-11-05',
      expiresAt: '2024-12-05',
      status: 'pending',
      message: 'We are interested in partnering for technical recruitment and campus hiring.',
      jobRoles: ['Full Stack Developer', 'DevOps Engineer', 'Business Analyst']
    }
  ], []);

  // Mock data for outgoing invitations - Invitations sent by recruiter to colleges
  const outgoingInvitations = useMemo<OutgoingInvitation[]>(() => [
    {
      _id: 'out-1',
      college: {
        _id: 'col-4',
        name: 'Indian Institute of Technology Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra' },
        studentsCount: 11000,
        coursesCount: 9,
        placementOfficer: {
          name: 'Prof. Anil Sharma',
          phone: '+91 9876543214',
          email: 'placement@iitb.ac.in'
        },
        departments: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering'],
        isActive: true
      },
      sentDate: '2024-11-05',
      status: 'pending',
      expiresAt: '2024-12-05',
      message: 'Looking forward to establishing a partnership with your esteemed institution.'
    },
    {
      _id: 'out-2',
      college: {
        _id: 'col-5',
        name: 'Anna University',
        location: { city: 'Chennai', state: 'Tamil Nadu' },
        studentsCount: 16000,
        coursesCount: 11,
        placementOfficer: {
          name: 'Dr. Lakshmi Raman',
          phone: '+91 9876543215',
          email: 'placement@annauniv.edu'
        },
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Civil Engineering'],
        isActive: false
      },
      sentDate: '2024-10-15',
      status: 'expired',
      expiresAt: '2024-11-15',
      message: 'We would like to establish a recruitment partnership for our technical positions.'
    },
    {
      _id: 'out-3',
      college: {
        _id: 'col-6',
        name: 'National Institute of Technology Warangal',
        location: { city: 'Warangal', state: 'Telangana' },
        studentsCount: 6500,
        coursesCount: 7,
        placementOfficer: {
          name: 'Dr. Ramesh Reddy',
          phone: '+91 9876543216',
          email: 'placement@nitw.ac.in'
        },
        departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil Engineering'],
        isActive: true
      },
      sentDate: '2024-11-01',
      status: 'declined',
      expiresAt: '2024-12-01',
      message: 'Interested in recruiting talented engineers from your institution.'
    },
    {
      _id: 'out-4',
      college: {
        _id: 'col-7',
        name: 'Indian Institute of Science Bangalore',
        location: { city: 'Bangalore', state: 'Karnataka' },
        studentsCount: 4500,
        coursesCount: 6,
        placementOfficer: {
          name: 'Prof. Vijay Kumar',
          phone: '+91 9876543217',
          email: 'placement@iisc.ac.in'
        },
        departments: ['Computer Science', 'Electrical Engineering', 'Materials Science', 'Chemical Engineering'],
        isActive: true
      },
      sentDate: '2024-11-12',
      status: 'pending',
      expiresAt: '2024-12-12',
      message: 'We would be honored to partner with IISc for research and placement opportunities.'
    }
  ], []);

  // Filtered data based on search
  const filteredDiscoverColleges = useMemo(() => {
    return discoverColleges.filter(college =>
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.location.state.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [discoverColleges, searchQuery]);

  // Filter incoming invitations - Only show pending and expired invitations (not accepted ones that became partners)
  const filteredIncomingInvitations = useMemo(() => {
    return incomingInvitations.filter(invitation =>
      (invitation.status === 'pending' || invitation.status === 'expired') &&
      (invitation.college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       invitation.college.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
       invitation.college.location.state.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [incomingInvitations, searchQuery]);

  // Filter outgoing invitations - Show all sent invitations (pending, expired, declined) but not accepted ones (they become partners)
  const filteredOutgoingInvitations = useMemo(() => {
    return outgoingInvitations.filter(invitation =>
      (invitation.status === 'pending' || invitation.status === 'expired' || invitation.status === 'declined') &&
      (invitation.college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       invitation.college.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
       invitation.college.location.state.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [outgoingInvitations, searchQuery]);

  // Event handlers
  const handleSendInvitation = async (collegeId: string) => {
    // Prevent multiple concurrent requests
    if (processingId === collegeId || loading) {
      return;
    }
    
    setProcessingId(collegeId);
    setLoading(true);
    
    const loadingToastId = toast.loading('Sending invitation...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Send POST request to /api/invitations/send
      // 2. Update local state to move college from discover to status
      // 3. Add the invitation to outgoingInvitations
      
      toast.success('Invitation sent successfully! 🎉', { id: loadingToastId });
      
      // Simulate state update - in real app, refetch data or update state
      // This would move the college from discover to status tab
      
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.', { id: loadingToastId });
      console.error('Send invitation error:', error);
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    const loadingToastId = toast.loading('Accepting invitation...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would:
      // 1. Send POST request to /api/invitations/accept
      // 2. Update the invitation status to 'accepted'
      // 3. Create a partnership/connection record
      // 4. Remove the college from discover/incoming sections
      // 5. Add the college to the partner colleges section
      
      toast.success('Partnership established successfully! 🤝', { 
        id: loadingToastId,
        duration: 4000 
      });
      
      // Simulate removing from incoming invitations
      // In real app, this would trigger a refetch or state update
      
    } catch (error) {
      toast.error('Failed to accept invitation. Please try again.', { id: loadingToastId });
      console.error('Accept invitation error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    const loadingToastId = toast.loading('Declining invitation...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would:
      // 1. Send POST request to /api/invitations/decline
      // 2. Update the invitation status to 'declined'
      // 3. Remove from incoming invitations list
      
      toast.success('Invitation declined', { id: loadingToastId });
      
    } catch (error) {
      toast.error('Failed to decline invitation. Please try again.', { id: loadingToastId });
      console.error('Decline invitation error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdrawInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    const loadingToastId = toast.loading('Withdrawing invitation...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would:
      // 1. Send DELETE request to /api/invitations/:id
      // 2. Remove the invitation from outgoingInvitations
      // 3. Move college back to discover section if applicable
      
      toast.success('Invitation withdrawn successfully', { id: loadingToastId });
      
    } catch (error) {
      toast.error('Failed to withdraw invitation. Please try again.', { id: loadingToastId });
      console.error('Withdraw invitation error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewCollege = (college: BaseCollege) => {
    setSelectedCollege(college);
    setShowCollegeModal(true);
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // College Details Modal Component
  const CollegeDetailsModal = ({ college, isOpen, onClose }: { 
    college: BaseCollege | null, 
    isOpen: boolean, 
    onClose: () => void 
  }) => {
    if (!isOpen || !college) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{college.name}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-semibold text-purple-600">
                {college.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{college.name}</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{college.location.city}, {college.location.state}</span>
                </div>
                {college.establishedYear && (
                  <p className="text-sm text-gray-500">Established: {college.establishedYear}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-gray-700">Students</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{college.studentsCount.toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-gray-700">Courses</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{college.coursesCount}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Placement Officer</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {(() => {
                  // For modal, assume not connected unless it's a connected/partner college
                  const maskedOfficer = getMaskedPlacementOfficer(college.placementOfficer, 'none');
                  return (
                    <>
                      <p className="font-medium text-gray-900">{maskedOfficer.name}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{maskedOfficer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{maskedOfficer.email}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Departments & Courses</h4>
              <div className="flex flex-wrap gap-2">
                {college.departments.map((dept, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Handle connect/send invitation action
                onClose();
                if (activeTab === 'discover') {
                  handleSendInvitation(college._id);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {activeTab === 'discover' ? 'Send Invitation' : 'View Details'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      <div className="max-w-screen bg-white">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Connect with <span className="text-blue-600">Colleges</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Build partnerships with top colleges and universities to expand your talent pipeline
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* New Invitations */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">New Invitations</h3>
              <div className="w-7 h-7 bg-gradient-to-r from-[#00C950] to-[#00A63E] rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold text-gray-900">{filteredIncomingInvitations.length}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">From Connections</span>
              </div>
            </div>
          </div>

          {/* Active Connections */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Active Connections</h3>
              <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
                <Handshake className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold text-gray-900">{summaryStats.connected}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Partner Connections</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Status</h3>
              <div className="w-7 h-7 bg-gradient-to-r from-[#008EFF] to-[#0573CB] rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold text-gray-900">{filteredOutgoingInvitations.length}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Awaiting Response</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab System */}
        <div className="space-y-6">
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search colleges by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex gap-3">
              <div className="relative">
                <select className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-8 text-sm text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All States</option>
                  <option>Maharashtra</option>
                  <option>Karnataka</option>
                  <option>Delhi</option>
                  <option>Tamil Nadu</option>
                  <option>Rajasthan</option>
                  <option>Uttar Pradesh</option>
                  <option>West Bengal</option>
                  <option>Telangana</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="relative">
                <select className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-8 text-sm text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All Courses</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                  <option>Electronics Engineering</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Chemical Engineering</option>
                  <option>MBA</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="relative">
                <select className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-8 text-sm text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All Streams</option>
                  <option>Engineering</option>
                  <option>Technology</option>
                  <option>Management</option>
                  <option>Science</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              
              <button className="flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Tab System */}
          <div className="flex w-full rounded-full bg-gray-100 p-1">
            {[
              { key: 'discover', label: 'Discover Colleges' },
              { key: 'incoming', label: 'Invitation', count: filteredIncomingInvitations.length },
              { key: 'status', label: 'Status' }
            ].map(({ key, label, count }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition shadow-sm ${
                    isActive ? 'text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={isActive ? { background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' } : {}}
                >
                  {count !== undefined ? `${label} (${count})` : label}
                </button>
              );
            })}
          </div>

          {/* Discover Tab Content */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Discover Colleges</h2>
                  <p className="text-slate-600">Explore, connect and send partnership invitations to colleges</p>
                </div>
              </div>
              
              {/* College Cards */}
              <div className="space-y-6">
                {filteredDiscoverColleges.map((college) => (
                  <div
                    key={college._id}
                    className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-semibold text-purple-600">
                          {college.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{college.name}</h3>
                            <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="h-4 w-4" />
                            <span>{college.location.city}, {college.location.state}</span>
                          </div>
                          
                          <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Basic Info</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">
                                    <span className="font-medium text-blue-600">{college.studentsCount.toLocaleString('en-IN')}</span>
                                    <span className="text-gray-600"> Students</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">
                                    <span className="font-medium text-green-600">{college.coursesCount}</span>
                                    <span className="text-gray-600"> Courses</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Placement Officer</p>
                              {(() => {
                                const maskedOfficer = getMaskedPlacementOfficer(college.placementOfficer, college.connectionStatus);
                                return (
                                  <>
                                    <p className="text-sm text-gray-900 font-medium pb-1">{maskedOfficer.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="h-4 w-4" />
                                      <span>{maskedOfficer.phone}</span>
                                      <Mail className="h-4 w-4" />
                                      <span>{maskedOfficer.email}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Courses Offered</p>
                            <div className="flex flex-wrap gap-2">
                              {college.departments.slice(0, 3).map((dept, index) => (
                                <span
                                  key={`${college._id}-dept-${index}`}
                                  className="rounded-md bg-[rgba(204,177,255,0.2)] px-2 py-1 text-xs font-medium text-[#7F3DFF]"
                                >
                                  {dept}
                                </span>
                              ))}
                              {college.departments.length > 3 && (
                                <span className="rounded-md bg-[rgba(204,177,255,0.2)] px-2 py-1 text-xs font-medium text-[#7F3DFF]">
                                  +{college.departments.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {college.canSendInvitation ? (
                          <button
                            onClick={() => handleSendInvitation(college._id)}
                            disabled={loading || processingId === college._id}
                            className="text-white rounded-lg px-6 py-3 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                          >
                            {processingId === college._id ? 'Sending...' : 'Send Partner Request'}
                          </button>
                        ) : (
                          <div className="bg-gray-100 px-6 py-3 rounded-lg text-center text-sm font-medium text-gray-500">
                            {college.connectionStatus === 'pending' ? 'Request Sent' :
                             college.connectionStatus === 'connected' ? 'Connected' :
                             college.connectionStatus === 'partner' ? 'Partner' :
                             college.connectionStatus === 'expired' ? 'Expired' : 'Not Available'}
                          </div>
                        )}
                        <button 
                          onClick={() => handleViewCollege(college)}
                          className="rounded-lg border border-blue-600 px-6 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>View College</span>
                          </div>
                        </button>
                        <div className="bg-gray-100 px-4 py-2 rounded-lg text-center text-xs text-gray-500">
                          <div className="flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Full details visible after accepting the request</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDiscoverColleges.length === 0 && (
                  <div className="py-12 text-center">
                    <Building className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No colleges found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Try adjusting your search query to find more colleges.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incoming Invitations Tab Content */}
          {activeTab === 'incoming' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Incoming Invitations</h2>
                  <p className="text-slate-600">Review and respond to partnership invitations from colleges</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {filteredIncomingInvitations.map((invitation, index) => (
                  <div
                    key={invitation._id}
                    className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-semibold text-purple-600">
                          {invitation.college.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{invitation.college.name}</h3>
                            <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Active
                            </span>
                            {index === 0 && invitation.jobRoles && invitation.jobRoles.length > 0 && (
                              <div
                                className="flex items-center overflow-hidden rounded-2xl border border-[#F77E22] bg-[#FFF8F0]"
                                style={{
                                  boxShadow: '0 3px 8px rgba(247, 126, 34, 0.1)',
                                  transform: 'translateY(-1px)'
                                }}
                              >
                                <div
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                                  style={{
                                    backgroundColor: '#F77E22',
                                    borderTopLeftRadius: '16px',
                                    borderBottomLeftRadius: '16px'
                                  }}
                                >
                                  <Flame className="h-3 w-3" />
                                  Invitation For
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 text-[13px] font-semibold text-[#C05A00]">
                                  <Briefcase className="h-3.5 w-3.5 text-[#C05A00]" />
                                  <span className="leading-none">{invitation.jobRoles[0]}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="h-4 w-4" />
                            <span>{invitation.college.location.city}, {invitation.college.location.state}</span>
                          </div>
                          
                          <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Basic info</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">
                                    <span className="font-medium text-blue-600">{invitation.college.studentsCount.toLocaleString('en-IN')}</span>
                                    <span className="text-gray-600"> Students</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">
                                    <span className="font-medium text-green-600">{invitation.college.coursesCount}</span>
                                    <span className="text-gray-600"> Courses</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Placement Officer</p>
                              {(() => {
                                const maskedOfficer = getMaskedPlacementOfficer(invitation.college.placementOfficer, undefined, invitation.status);
                                return (
                                  <>
                                    <p className="text-sm text-gray-900 font-medium pb-1">{maskedOfficer.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="h-4 w-4" />
                                      <span>{maskedOfficer.phone}</span>
                                      <Mail className="h-4 w-4" />
                                      <span>{maskedOfficer.email}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Courses Offered</p>
                            <div className="flex flex-wrap gap-2">
                              {invitation.college.departments.slice(0, 3).map((dept, index) => (
                                <span
                                  key={`${invitation._id}-dept-${index}`}
                                  className="rounded-md bg-[rgba(204,177,255,0.2)] px-2 py-1 text-xs font-medium text-[#7F3DFF]"
                                >
                                  {dept}
                                </span>
                              ))}
                              {invitation.college.departments.length > 3 && (
                                <span className="rounded-md bg-[rgba(204,177,255,0.2)] px-2 py-1 text-xs font-medium text-[#7F3DFF]">
                                  +{invitation.college.departments.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => handleAcceptInvitation(invitation._id)}
                          disabled={processingId === invitation._id}
                          className="bg-gradient-to-r from-[#44BF06] to-[#2FA400] hover:opacity-90 text-white rounded-lg px-6 py-3 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>{processingId === invitation._id ? 'Accepting...' : 'Accept Invitations'}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation._id)}
                          disabled={processingId === invitation._id}
                          className="rounded-lg border border-red-600 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <XCircle className="h-4 w-4" />
                            <span>{processingId === invitation._id ? 'Declining...' : 'Decline Invitations'}</span>
                          </div>
                        </button>
                        <button 
                          onClick={() => handleViewCollege(invitation.college)}
                          className="rounded-lg border border-blue-600 px-6 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>View College</span>
                          </div>
                        </button>
                        <div className="bg-gray-100 px-4 py-2 rounded-lg text-center text-xs text-gray-500">
                          <div className="flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Full details visible after accepting the request</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredIncomingInvitations.length === 0 && (
                  <div className="py-12 text-center">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No invitations yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Colleges haven't sent you any invitations yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Tab Content */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Invitation Status</h2>
                  <p className="text-slate-600">Track your sent invitations, manage pending requests, and handle expired connections</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {filteredOutgoingInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-semibold text-purple-600">
                          {invitation.college.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{invitation.college.name}</h3>
                            <div className="flex gap-2">
                              <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                                invitation.college.isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {invitation.college.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                                invitation.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                                invitation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                invitation.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {invitation.status === 'pending' ? 'Pending' : 
                                 invitation.status === 'accepted' ? 'Accepted' :
                                 invitation.status === 'declined' ? 'Declined' : 'Request Expired'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="h-4 w-4" />
                            <span>{invitation.college.location.city}, {invitation.college.location.state}</span>
                          </div>
                          
                          <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Basic info</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">
                                    <span className="font-medium text-blue-600">{invitation.college.studentsCount.toLocaleString('en-IN')}</span>
                                    <span className="text-gray-600"> Students</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">
                                    <span className="font-medium text-green-600">{invitation.college.coursesCount}</span>
                                    <span className="text-gray-600"> Courses</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Placement Officer</p>
                              {(() => {
                                const maskedOfficer = getMaskedPlacementOfficer(invitation.college.placementOfficer, undefined, invitation.status);
                                return (
                                  <>
                                    <p className="text-sm text-gray-900 font-medium pb-1">{maskedOfficer.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="h-4 w-4" />
                                      <span>{maskedOfficer.phone}</span>
                                      <Mail className="h-4 w-4" />
                                      <span>{maskedOfficer.email}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Courses Offered</p>
                            <div className="flex flex-wrap gap-2">
                              {invitation.college.departments.slice(0, 3).map((dept, index) => (
                                <span
                                  key={`${invitation._id}-dept-${index}`}
                                  className="rounded-md bg-[rgba(204,177,255,0.2)] px-2 py-1 text-xs font-medium text-[#7F3DFF]"
                                >
                                  {dept}
                                </span>
                              ))}
                              {invitation.college.departments.length > 3 && (
                                <span className="rounded-md bg-[rgba(204,177,255,0.2)] px-2 py-1 text-xs font-medium text-[#7F3DFF]">
                                  +{invitation.college.departments.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {invitation.status === 'pending' && (
                          <>
                            <div className="bg-gray-100 px-6 py-3 rounded-lg text-center text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Invitation Request Sent</span>
                            </div>
                            <button 
                              onClick={() => handleWithdrawInvitation(invitation._id)}
                              disabled={processingId === invitation._id}
                              className="bg-gradient-to-r from-[#D8A714] via-[#E1B016] via-50% to-[#E9BC19] hover:opacity-90 text-white rounded-lg px-6 py-3 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span>{processingId === invitation._id ? 'Withdrawing...' : 'Withdraw'}</span>
                            </button>
                          </>
                        )}
                        {invitation.status === 'expired' && (
                          <div className="bg-gray-100 px-6 py-3 rounded-lg text-center text-sm font-medium text-gray-500">
                            Invitation expired
                          </div>
                        )}
                        {invitation.status === 'declined' && (
                          <div className="bg-red-100 px-6 py-3 rounded-lg text-center text-sm font-medium text-red-700">
                            Invitation declined
                          </div>
                        )}
                        <button 
                          onClick={() => handleViewCollege(invitation.college)}
                          className="rounded-lg border border-blue-600 px-6 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>View College</span>
                          </div>
                        </button>
                        <div className="bg-gray-100 px-4 py-2 rounded-lg text-center text-xs text-gray-500">
                          <div className="flex items-center justify-center gap-1">
                            <span>🔒</span>
                            <span>Full details visible after partnership approval</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOutgoingInvitations.length === 0 && (
                  <div className="py-12 text-center">
                    <Send className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No sent invitations</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      You haven't sent any invitations to colleges yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* College Details Modal */}
      <CollegeDetailsModal 
        college={selectedCollege}
        isOpen={showCollegeModal}
        onClose={() => {
          setShowCollegeModal(false);
          setSelectedCollege(null);
        }}
      />
    </div>
  );
};

export default ConnectCollegesSection;
