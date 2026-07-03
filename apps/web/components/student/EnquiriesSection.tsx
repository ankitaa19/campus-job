import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Video, User, Phone, Mail, Eye, X } from 'lucide-react';
import axios from 'axios';

interface EnquiriesSectionProps {
  studentInfo: any;
}

interface Enquiry {
  _id: string;
  studentName: string;
  email: string;
  phone: string;
  courseId: {
    name: string;
    streamType?: string;
  };
  collegeId: {
    name: string;
  };
  status: string;
  createdAt: string;
  notes?: string;
  source?: string;
  meeting?: {
    date: string;
    time: string;
    duration: string;
    mode: string;
    placementOfficer: {
      name: string;
      email: string;
      phone: string;
    };
    meetingLink?: string;
  };
}

interface Meeting {
  _id: string;
  enquiryId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  collegeName: string;
  courseName: string;
  date: string;
  startTime: string;
  duration: string;
  meetingLink: string;
  placementOfficer: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'pending' | 'accepted' | 'declined';
}

interface RescheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry;
  onSave: (data: any) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Reschedule Meeting Modal Component
const RescheduleMeetingModal: React.FC<RescheduleMeetingModalProps> = ({ isOpen, onClose, enquiry, onSave }) => {
  const [formData, setFormData] = useState({
    name: enquiry.studentName,
    email: enquiry.email,
    phone: enquiry.phone,
    date: '',
    startTime: '10:00 AM',
    duration: '30 mins',
    meetingLink: enquiry.meeting?.meetingLink || ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
<div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
  <div className="flex flex-col">
    <div className="flex items-center gap-2">
      <Calendar className="h-5 w-5 text-gray-600" />
      <h2 className="text-lg font-semibold text-gray-900">Reschedule Meet</h2>
    </div>

    <p className="text-sm text-gray-600 mt-1">
      Schedule a meeting with college for admission enquiry.
    </p>
  </div>

  <button
    onClick={onClose}
    className="text-gray-400 hover:text-gray-600"
  >
    <X className="h-6 w-6" />
  </button>
</div>


        <div className="px-6 py-5">
          <div className="mb-6">
            <div className="flex flex-col items-center text-center mb-4">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    When would you like to reschedule the meet?
                  </h3>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Choose the date and time for the meet with college.
                </p>
              </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30 mins">30 mins</option>
                  <option value="45 mins">45 mins</option>
                  <option value="1 hour">1 hour</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
              <input
                type="text"
                value={formData.meetingLink}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border-4 border-dotted border-gray-200 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Placement Officer</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-900 font-medium">{enquiry.meeting?.placementOfficer.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">{enquiry.meeting?.placementOfficer.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Phone:</span>
                <span className="text-gray-900">{enquiry.meeting?.placementOfficer.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
          <button 
            onClick={handleSave}
            className="px-6 py-3 rounded-lg text-white font-medium transition"
            style={{ background: 'linear-gradient(to right, #3A9CFF, #0F7FEE)' }}
          >
            Save Changes
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dummy data for testing
const dummyEnquiries: Enquiry[] = [
  {
    _id: '1',
    studentName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543210',
    courseId: {
      name: 'Bachelor of Science in Computer Science',
    },
    collegeId: {
      name: 'ABC University'
    },
    status: 'contacted',
    createdAt: '2025-10-15T10:30:00Z',
    notes: 'Thank you for your interest in ABC University. Our admission team has reviewed your enquiry. Please check your email for detailed information about the CS program. We would like to schedule a meet with you...',
    source: 'Referral',
    meeting: {
      date: 'Nov 15, 2025',
      time: '10:00 AM - 10:30 AM IST',
      duration: '30 mins',
      mode: 'Online',
      placementOfficer: {
        name: 'Dr. Rajesh Kumar',
        email: 'placement@abc.ac.in',
        phone: '+91 1011001101'
      },
      meetingLink: 'http://meet.google.j/uc-uselglepr-lkkpkls'
    }
  },
  {
    _id: '2',
    studentName: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91 9876543211',
    courseId: {
      name: 'Bachelor of Science in Computer Science',
    },
    collegeId: {
      name: 'MIT University'
    },
    status: 'interested',
    createdAt: '2025-10-15T14:20:00Z',
    source: 'Referral'
  },
  {
    _id: '3',
    studentName: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '+91 9876543212',
    courseId: {
      name: 'Bachelor of Science in Computer Science',
    },
    collegeId: {
      name: 'VIT University'
    },
    status: 'contacted',
    createdAt: '2025-10-15T09:15:00Z',
    notes: 'Thank you for your interest in ABC University. Our admission team has reviewed your enquiry. Please check your email for detailed information about the CS program. We would like to schedule a meet with you...',
    source: 'Referral',
    meeting: {
      date: 'Nov 15, 2025',
      time: '10:00 AM - 11:30 AM IST',
      duration: '30 mins',
      mode: 'Online',
      placementOfficer: {
        name: 'Dr. Vivek Anand (Admission Counselor)',
        email: 'placement@abc.ac.in',
        phone: '+91 1011001101'
      },
      meetingLink: 'http://meet.google.j/uc-uselglepr-lkkpkls'
    }
  },
  {
    _id: '4',
    studentName: 'Alice Williams',
    email: 'alice.williams@example.com',
    phone: '+91 9876543213',
    courseId: {
      name: 'Bachelor of Science in Computer Science',
    },
    collegeId: {
      name: 'XYZ University'
    },
    status: 'closed',
    createdAt: '2025-10-20T11:45:00Z',
    notes: 'Enquiry closed as requested by student.',
    source: 'Referral'
  }
];

const EnquiriesSection: React.FC<EnquiriesSectionProps> = ({ studentInfo }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(dummyEnquiries);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleEnquiry, setRescheduleEnquiry] = useState<Enquiry | null>(null);

  // Fetch enquiries from API
  useEffect(() => {
    const fetchEnquiries = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/admission-enquiries/student`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.data.length > 0) {
          setEnquiries(response.data.data);
        } else {
          // Use dummy data if no real data available
          setEnquiries(dummyEnquiries);
        }
      } catch (error) {
        console.error('Error fetching enquiries:', error);
        // Use dummy data on error
        setEnquiries(dummyEnquiries);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'contacted':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Contacted' };
      case 'interested':
        return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Interested' };
      case 'converted':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Converted' };
      case 'closed':
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Closed' };
      default:
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: status };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredEnquiries = enquiries.filter(enquiry =>
    enquiry.collegeId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enquiry.courseId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enquiry.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-6 py-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          My College <span className="text-[#0270DF]">Enquiries</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Track your college enquiry forms and responses stays in one place.
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{enquiries.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total Enquiries</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">this week</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {enquiries.filter(e => e.status.toLowerCase() === 'contacted').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Response Received</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Interview/meeting RSVP</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
                <p className="text-sm text-gray-600 mt-1">Scheduled Meeting</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Today</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {enquiries.filter(e => ['interested', 'contacted'].includes(e.status.toLowerCase())).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Pending</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Pending response</p>
          </div>
        </div>


        {/* Enquiries List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEnquiries.length > 0 ? (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => {
              const statusBadge = getStatusBadge(enquiry.status);
              return (
                <div
                  key={enquiry._id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-600">
                            {enquiry.collegeId?.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {enquiry.collegeId?.name || 'College Name'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {enquiry.courseId?.name || 'Course Name'}
                            {enquiry.courseId?.streamType && ` • ${enquiry.courseId.streamType}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Enquiry Source:</span>
                          <span className="font-medium">{enquiry.source || 'Referral'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Submitted:</span>
                          <span className="font-medium">{formatDate(enquiry.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* College Response Section - Only show for "contacted" status */}
                  {enquiry.status.toLowerCase() === 'contacted' && enquiry.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900 mb-1">
                              College Response (Oct 18, 2025):
                            </p>
                            <p className="text-sm text-green-800">
                              {enquiry.notes}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Meeting Details - Only show if meeting exists */}
                      {enquiry.meeting && (
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mt-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-sm font-semibold text-purple-900">Scheduled Meeting</h4>
                                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                                    {enquiry.meeting.mode}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-sm text-purple-800">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{enquiry.meeting.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{enquiry.meeting.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{enquiry.meeting.placementOfficer.name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-16">
                              {enquiry.meeting.meetingLink && (
                                <button
                                  onClick={() => window.open(enquiry.meeting?.meetingLink, '_blank')}
                                  className="px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 transition"
                                  style={{ background: 'linear-gradient(to right, #00C950, #00A63E)' }}
                                >
                                  <Video className="h-4 w-4" />
                                  Join Meeting
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setRescheduleEnquiry(enquiry);
                                  setShowRescheduleModal(true);
                                }}
                                className="px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 transition"
                                style={{ background: 'linear-gradient(to right, #2590FB, #0478EB)' }}
                              >
                                <Clock className="h-4 w-4" />
                                Reschedule
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* View Details Button - Always at bottom */}
                  <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedEnquiry(enquiry);
                        setShowEnquiryModal(true);
                      }}
                      className="px-4 py-2 rounded-lg border border-[#1383F3] text-[#1383F3] bg-white hover:bg-blue-50 transition flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <Mail className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No enquiries found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery ? 'Try adjusting your search' : 'Start by submitting enquiries to colleges'}
            </p>
          </div>
        )}
      </div>

      {/* Enquiry Details Modal */}
      {showEnquiryModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
<div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
  <div className="flex flex-col">
    <div className="flex items-center gap-2">
      <Calendar className="h-5 w-5 text-gray-600" />
      <h2 className="text-lg font-semibold text-gray-900">Enquiry Details</h2>
    </div>

    <p className="text-sm text-gray-600 mt-1">
      Complete information about your submitted enquiry
    </p>
  </div>

  <button
    onClick={() => setShowEnquiryModal(false)}
    className="text-gray-400 hover:text-gray-600"
  >
    <X className="h-6 w-6" />
  </button>
</div>

            {/* Modal Content */}
            <div className="px-6 py-5">

              {/* College Info */}
              <div className="bg-[linear-gradient(to_right,rgba(187,217,255,0.35),rgba(235,215,255,0.35))] rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center border border-blue-200">
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedEnquiry.collegeId?.name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedEnquiry.collegeId?.name || 'College Name'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedEnquiry.courseId?.name || 'Course Name'}
                      {selectedEnquiry.courseId?.streamType && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {selectedEnquiry.courseId.streamType}
                        </span>
                      )}
                    </p>
                      <p className="text-sm text-gray-600">Submission Date: {formatDate(selectedEnquiry.createdAt)}</p>
                  </div>
                  <div>
                  <div>
                    {(() => {
                      const badge = getStatusBadge(selectedEnquiry.status);
                      return (
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                </div>
              </div>


              {/* College Response - Only show for contacted status */}
              {selectedEnquiry.status.toLowerCase() === 'contacted' && selectedEnquiry.notes && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">College Response:</h4>
                  <p className="text-sm text-green-800">{selectedEnquiry.notes}</p>
                </div>
              )}

              {/* Scheduled Meeting - Only show for contacted status with meeting */}
              {selectedEnquiry.status.toLowerCase() === 'contacted' && selectedEnquiry.meeting && (
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Scheduled Meeting
                  </h4>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-700 font-medium">Date:</span>
                      <span className="text-purple-900">{selectedEnquiry.meeting.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-700 font-medium">Time:</span>
                      <span className="text-purple-900">{selectedEnquiry.meeting.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-700 font-medium">Duration:</span>
                      <span className="text-purple-900">{selectedEnquiry.meeting.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-700 font-medium">Mode:</span>
                      <span className="text-purple-900">{selectedEnquiry.meeting.mode}</span>
                    </div>
                  </div>



                  <div className="flex gap-3">
                    {selectedEnquiry.meeting.meetingLink && (
                      <button
                        onClick={() => window.open(selectedEnquiry.meeting?.meetingLink, '_blank')}
                        className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition"
                        style={{ background: 'linear-gradient(to right, #00C950, #00A63E)' }}
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setRescheduleEnquiry(selectedEnquiry);
                        setShowRescheduleModal(true);
                        setShowEnquiryModal(false);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 transition"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              )}
              {selectedEnquiry.meeting?.placementOfficer && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border-4 border-dotted border-gray-200 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Placement Officer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedEnquiry.meeting.placementOfficer.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900">
                        {selectedEnquiry.meeting.placementOfficer.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-gray-900">
                        {selectedEnquiry.meeting.placementOfficer.phone}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {/* Reschedule Meeting Modal */}
      {showRescheduleModal && rescheduleEnquiry && (
        <RescheduleMeetingModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setRescheduleEnquiry(null);
          }}
          enquiry={rescheduleEnquiry}
          onSave={(formData) => {
            console.log('Reschedule data:', formData);
            // Here you would typically make an API call to update the meeting
            // For now, we'll just log it
          }}
        />
      )}
    </div>
  );
};

export default EnquiriesSection;
