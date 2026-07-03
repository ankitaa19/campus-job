import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { API_BASE_URL } from '../../../utils/api';

interface InterviewSlot {
  _id: string;
  dateTime: string;
  duration: number;
  type: 'technical' | 'hr' | 'group_discussion' | 'coding_test';
  location: {
    type: 'online' | 'offline';
    details: string;
    meetingLink?: string;
  };
  maxCandidates: number;
  assignedStudents: Array<{
    studentId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      rollNumber?: string;
    };
    confirmed: boolean;
    joinedAt?: string;
  }>;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

interface JobDetails {
  _id: string;
  title: string;
  companyName: string;
  description: string;
}

const InterviewSlotsPage = () => {
  const router = useRouter();
  const { jobId } = router.query;
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [newSlot, setNewSlot] = useState({
    dateTime: '',
    duration: 60,
    type: 'technical' as const,
    locationType: 'online' as const,
    locationDetails: '',
    meetingLink: '',
    maxCandidates: 1
  });

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchInterviewSlots();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const fetchInterviewSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}/interview-slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data.data || []);
    } catch (error) {
      console.error('Error fetching interview slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInterviewSlot = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...newSlot,
        location: {
          type: newSlot.locationType,
          details: newSlot.locationDetails,
          ...(newSlot.locationType === 'online' && { meetingLink: newSlot.meetingLink })
        }
      };

      await axios.post(`${API_BASE_URL}/jobs/${jobId}/interview-slots`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Interview slot created successfully!');
      setShowCreateModal(false);
      setNewSlot({
        dateTime: '',
        duration: 60,
        type: 'technical',
        locationType: 'online',
        locationDetails: '',
        meetingLink: '',
        maxCandidates: 1
      });
      fetchInterviewSlots();
    } catch (error: any) {
      console.error('Error creating interview slot:', error);
      alert(error.response?.data?.message || 'Failed to create interview slot');
    }
  };

  const autoAssignStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/jobs/${jobId}/auto-assign-interviews`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Students auto-assigned to interview slots successfully!');
      setShowAutoAssignModal(false);
      fetchInterviewSlots();
    } catch (error: any) {
      console.error('Error auto-assigning students:', error);
      alert(error.response?.data?.message || 'Failed to auto-assign students');
    }
  };

  const updateSlotStatus = async (slotId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/interview-slots/${slotId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Slot status updated to ${newStatus}!`);
      fetchInterviewSlots();
    } catch (error: any) {
      console.error('Error updating slot status:', error);
      alert(error.response?.data?.message || 'Failed to update slot status');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-purple-100 text-purple-800';
      case 'hr': return 'bg-green-100 text-green-800';
      case 'group_discussion': return 'bg-orange-100 text-orange-800';
      case 'coding_test': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSlots = slots.filter(slot => {
    if (selectedTab === 'all') return true;
    return slot.status === selectedTab;
  });

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['recruiter', 'company']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading interview slots...</div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['recruiter', 'company']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Back
            </button>
            {jobDetails && (
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Interview Slots - {jobDetails.title}
                </h1>
                <p className="text-gray-600">{jobDetails.companyName}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Interview Slot
            </button>
            <button
              onClick={() => setShowAutoAssignModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Auto-Assign Students
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Slots</h3>
              <p className="text-3xl font-bold text-blue-600">{slots.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Scheduled</h3>
              <p className="text-3xl font-bold text-blue-600">
                {slots.filter(slot => slot.status === 'scheduled').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
              <p className="text-3xl font-bold text-green-600">
                {slots.filter(slot => slot.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
              <p className="text-3xl font-bold text-purple-600">
                {slots.reduce((total, slot) => total + slot.assignedStudents.length, 0)}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      selectedTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.replace('_', ' ')} ({tab === 'all' ? slots.length : slots.filter(slot => slot.status === tab).length})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Slots List */}
          <div className="space-y-6">
            {filteredSlots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">No interview slots found for the selected filter.</p>
              </div>
            ) : (
              filteredSlots.map(slot => (
                <div key={slot._id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {formatDateTime(slot.dateTime)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getTypeColor(slot.type)}`}>
                          {slot.type.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(slot.status)}`}>
                          {slot.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Duration: {slot.duration} minutes</p>
                        <p>Location: {slot.location.type === 'online' ? 'Online' : 'Offline'} - {slot.location.details}</p>
                        {slot.location.meetingLink && (
                          <p>Meeting Link: <a href={slot.location.meetingLink} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{slot.location.meetingLink}</a></p>
                        )}
                        <p>Max Candidates: {slot.maxCandidates}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {slot.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateSlotStatus(slot._id, 'in_progress')}
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => updateSlotStatus(slot._id, 'cancelled')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {slot.status === 'in_progress' && (
                        <button
                          onClick={() => updateSlotStatus(slot._id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Students */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Assigned Students ({slot.assignedStudents.length}/{slot.maxCandidates})
                    </h4>
                    {slot.assignedStudents.length === 0 ? (
                      <p className="text-gray-500 text-sm">No students assigned yet</p>
                    ) : (
                      <div className="space-y-2">
                        {slot.assignedStudents.map((assignment, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-gray-800">
                                {assignment.studentId.firstName} {assignment.studentId.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {assignment.studentId.email}
                                {assignment.studentId.rollNumber && ` • ${assignment.studentId.rollNumber}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                assignment.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {assignment.confirmed ? 'Confirmed' : 'Pending'}
                              </span>
                              {assignment.joinedAt && (
                                <span className="text-xs text-gray-500">
                                  Joined: {new Date(assignment.joinedAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Created: {formatDateTime(slot.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Slot Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create Interview Slot</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newSlot.dateTime}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, dateTime: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newSlot.duration}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="15"
                      max="240"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                    <select
                      value={newSlot.type}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="technical">Technical</option>
                      <option value="hr">HR</option>
                      <option value="group_discussion">Group Discussion</option>
                      <option value="coding_test">Coding Test</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                    <select
                      value={newSlot.locationType}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, locationType: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Details</label>
                    <input
                      type="text"
                      value={newSlot.locationDetails}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, locationDetails: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder={newSlot.locationType === 'online' ? 'Platform name (e.g., Zoom, Google Meet)' : 'Room/Address'}
                      required
                    />
                  </div>

                  {newSlot.locationType === 'online' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                      <input
                        type="url"
                        value={newSlot.meetingLink}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, meetingLink: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Candidates</label>
                    <input
                      type="number"
                      value={newSlot.maxCandidates}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, maxCandidates: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createInterviewSlot}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto Assign Modal */}
        {showAutoAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Auto-Assign Students</h3>
                <p className="text-gray-600 mb-6">
                  This will automatically assign eligible students to available interview slots based on their preferences and slot capacity.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAutoAssignModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={autoAssignStudents}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Auto-Assign
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

export default InterviewSlotsPage;
