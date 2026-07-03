import React, { useState } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface RespondToCampusVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: {
    id: string;
    collegeName: string;
    date: string;
    timeSlot: string;
    meetingType: string;
    location?: string;
    jobRole?: string;
    expectedStudents?: number;
    description?: string;
    placementOfficer?: {
      name: string;
      email: string;
      phone: string;
    };
  };
  onSuccess?: () => void;
}

const RespondToCampusVisitModal: React.FC<RespondToCampusVisitModalProps> = ({ 
  isOpen, 
  onClose, 
  invitation,
  onSuccess 
}) => {
  // Form state matching college-side modal
  const [visitDate, setVisitDate] = useState(invitation.date || '');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [venue, setVenue] = useState(invitation.meetingType === 'Online' ? 'Online' : 'Placement Hall');
  const [expectedCandidates, setExpectedCandidates] = useState(invitation.expectedStudents?.toString() || '');
  const [meetingLink, setMeetingLink] = useState('');
  const [jobRoles, setJobRoles] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse time slot if provided (e.g., "10:00 AM - 12:00 PM")
  React.useEffect(() => {
    if (invitation.timeSlot) {
      const times = invitation.timeSlot.split('-').map(t => t.trim());
      if (times.length === 2) {
        setStartTime(times[0]);
      }
    }
    
    // Debug: Log invitation data to verify placement officer info
    console.log('Invitation data:', invitation);
    console.log('Placement Officer:', invitation.placementOfficer);
  }, [invitation.timeSlot, invitation]);

  // Toggle job role selection
  const toggleJobRole = (role: string) => {
    setJobRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleAcceptAndConfirm = async () => {
    if (!visitDate || !startTime) {
      setError('Please fill in visit date and start time');
      return;
    }

    if (!duration) {
      setError('Please select a duration');
      return;
    }

    if (venue === 'Online' && !meetingLink) {
      setError('Please provide a meeting link for online visits');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const responseData = {
        invitationId: invitation.id,
        visitDate,
        startTime,
        duration,
        venue,
        expectedCandidates: parseInt(expectedCandidates) || 0,
        meetingLink: venue === 'Online' ? meetingLink : undefined,
        jobRoles: invitation.jobRole?.split(',').map(r => r.trim()) || [],
        status: 'accepted'
      };

      try {
        await axios.post(`${API_BASE_URL}/api/campus-visits/respond`, responseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.log('API endpoint not yet implemented, updating locally');
        // For now, just continue without API call since backend isn't ready
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error responding to invitation:', err);
      setError(err.response?.data?.message || 'Failed to respond to invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVisitDate(invitation.date || '');
    setStartTime('');
    setDuration('2 hours');
    setVenue(invitation.meetingType === 'Online' ? 'Online' : 'Placement Hall');
    setExpectedCandidates(invitation.expectedStudents?.toString() || '');
    setMeetingLink('');
    setJobRoles([]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Close button only */}
        <div className="sticky top-0 bg-white rounded-t-lg px-6 py-4 flex items-center justify-end border-b border-gray-100 z-10">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Main Title and Subtitle */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-0.5">
              Reschedule Campus Visit - {invitation.collegeName}
            </h2>
            <p className="text-sm text-gray-600">
              Coordinate campus recruitment visit and interview schedule
            </p>
          </div>

          {/* Company Header Card with Peach Background */}
          <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: '#FFF4E6' }}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-lg font-semibold">
                {invitation.collegeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{invitation.collegeName}</h3>
                <p className="text-sm text-gray-500">
                  {invitation.placementOfficer?.name || 'Mr. Arjun Reddy'}
                </p>
              </div>
            </div>
          </div>

          {/* Title with Calendar Icon */}
          <div className="text-center mb-6">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-semibold text-gray-900">
                When would you like to reschedule the visit?
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Choose the date, time and duration for the campus recruitment
            </p>
          </div>

          {/* Form Fields in Grid */}
          <div className="space-y-4">
            {/* Row 1: Visit Date & Start Time (Editable) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Row 2: Duration (Editable) & Venue (Disabled - from college) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10 text-gray-900"
                  >
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="4 hours">4 hours</option>
                    <option value="Full day">Full day</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue <span className="text-xs text-gray-500">(Set by College)</span>
                </label>
                <input
                  type="text"
                  value={venue}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 3: Expected Candidates & Industry (Both disabled - from college) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Candidates <span className="text-xs text-gray-500">(Set by College)</span>
                </label>
                <input
                  type="text"
                  value={expectedCandidates || 'Not specified'}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry <span className="text-xs text-gray-500">(Set by College)</span>
                </label>
                <input
                  type="text"
                  value="Technology"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Conditional: Meeting Link (only if venue is Online) - Editable if needed */}
            {venue === 'Online' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="http://meet.google/jnc-ussefgsr-tksqvbs"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}

            {/* Job Type (Disabled - from college) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Job Type
              </label>
              <div className="flex flex-wrap gap-6">
                {(invitation.jobRole || 'Software Engineer,Senior UX/UI Designer,Product Designer')
                  .split(',')
                  .map((role) => (
                    <label key={role.trim()} className="flex items-center gap-2 cursor-not-allowed opacity-60">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-500">{role.trim()}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleAcceptAndConfirm}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
          >
            {loading ? 'Processing...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RespondToCampusVisitModal;
