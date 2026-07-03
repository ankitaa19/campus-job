import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { API_BASE_URL } from '../../../utils/api';

interface StudentInterview {
  _id: string;
  interviewSlot: {
    _id: string;
    dateTime: string;
    duration: number;
    type: 'technical' | 'hr' | 'group_discussion' | 'coding_test';
    location: {
      type: 'online' | 'offline';
      details: string;
      meetingLink?: string;
    };
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  };
  jobId: {
    _id: string;
    title: string;
    companyName: string;
    description: string;
  };
  confirmed: boolean;
  joinedAt?: string;
  assignedAt: string;
  feedback?: {
    rating: number;
    comments: string;
    submittedAt: string;
  };
}

const StudentInterviewsPage = () => {
  const router = useRouter();
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<StudentInterview | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comments: ''
  });

  useEffect(() => {
    fetchStudentInterviews();
  }, []);

  const fetchStudentInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/students/me/interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(response.data.data || []);
    } catch (error) {
      console.error('Error fetching student interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmInterview = async (interviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/interview-assignments/${interviewId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Interview confirmed successfully!');
      fetchStudentInterviews();
    } catch (error: any) {
      console.error('Error confirming interview:', error);
      alert(error.response?.data?.message || 'Failed to confirm interview');
    }
  };

  const joinInterview = async (interviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/interview-assignments/${interviewId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Joined interview successfully!');
      fetchStudentInterviews();
    } catch (error: any) {
      console.error('Error joining interview:', error);
      alert(error.response?.data?.message || 'Failed to join interview');
    }
  };

  const submitFeedback = async () => {
    if (!selectedInterview) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/interview-assignments/${selectedInterview._id}/feedback`, 
        feedbackData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      setSelectedInterview(null);
      setFeedbackData({ rating: 5, comments: '' });
      fetchStudentInterviews();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      alert(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const openFeedbackModal = (interview: StudentInterview) => {
    setSelectedInterview(interview);
    setFeedbackData({ rating: 5, comments: '' });
    setShowFeedbackModal(true);
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

  const isUpcoming = (interview: StudentInterview) => {
    const now = new Date();
    const interviewDate = new Date(interview.interviewSlot.dateTime);
    return interviewDate > now && interview.interviewSlot.status !== 'cancelled';
  };

  const isCompleted = (interview: StudentInterview) => {
    return interview.interviewSlot.status === 'completed';
  };

  const canJoin = (interview: StudentInterview) => {
    const now = new Date();
    const interviewDate = new Date(interview.interviewSlot.dateTime);
    const timeDiff = interviewDate.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff <= 15 && minutesDiff >= -interview.interviewSlot.duration && 
           interview.interviewSlot.status === 'in_progress' && interview.confirmed;
  };

  const getTimeUntilInterview = (dateString: string) => {
    const now = new Date();
    const interviewDate = new Date(dateString);
    const diffMs = interviewDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    return 'now';
  };

  const filteredInterviews = interviews.filter(interview => {
    switch (selectedTab) {
      case 'upcoming':
        return isUpcoming(interview);
      case 'completed':
        return isCompleted(interview);
      case 'all':
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading your interviews...</div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Interviews</h1>
            <p className="text-gray-600">Manage your scheduled interviews and provide feedback</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Interviews</h3>
              <p className="text-3xl font-bold text-blue-600">{interviews.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Upcoming</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {interviews.filter(interview => isUpcoming(interview)).length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
              <p className="text-3xl font-bold text-green-600">
                {interviews.filter(interview => isCompleted(interview)).length}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['upcoming', 'completed', 'all'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      selectedTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab} ({
                      tab === 'upcoming' ? interviews.filter(interview => isUpcoming(interview)).length :
                      tab === 'completed' ? interviews.filter(interview => isCompleted(interview)).length :
                      interviews.length
                    })
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Interviews List */}
          <div className="space-y-6">
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">No interviews found for the selected filter.</p>
              </div>
            ) : (
              filteredInterviews.map(interview => (
                <div key={interview._id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {interview.jobId.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(interview.interviewSlot.type)}`}>
                          {interview.interviewSlot.type.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(interview.interviewSlot.status)}`}>
                          {interview.interviewSlot.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-lg text-blue-600 font-medium mb-2">
                        {interview.jobId.companyName}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Date & Time:</strong> {formatDateTime(interview.interviewSlot.dateTime)}</p>
                        <p><strong>Duration:</strong> {interview.interviewSlot.duration} minutes</p>
                        <p><strong>Location:</strong> {interview.interviewSlot.location.type === 'online' ? 'Online' : 'Offline'} - {interview.interviewSlot.location.details}</p>
                        {interview.interviewSlot.location.meetingLink && (
                          <p><strong>Meeting Link:</strong> <a href={interview.interviewSlot.location.meetingLink} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{interview.interviewSlot.location.meetingLink}</a></p>
                        )}
                        {isUpcoming(interview) && (
                          <p className="text-orange-600 font-medium">
                            Starts {getTimeUntilInterview(interview.interviewSlot.dateTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        interview.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interview.confirmed ? 'Confirmed' : 'Pending Confirmation'}
                      </span>
                      
                      {!interview.confirmed && interview.interviewSlot.status === 'scheduled' && (
                        <button
                          onClick={() => confirmInterview(interview._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Confirm
                        </button>
                      )}
                      
                      {canJoin(interview) && (
                        <button
                          onClick={() => joinInterview(interview._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Join Interview
                        </button>
                      )}
                      
                      {interview.interviewSlot.status === 'completed' && !interview.feedback && (
                        <button
                          onClick={() => openFeedbackModal(interview)}
                          className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          Give Feedback
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Display */}
                  {interview.feedback && (
                    <div className="bg-purple-50 p-4 rounded-lg mt-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Your Feedback</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`text-lg ${star <= interview.feedback!.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{interview.feedback.comments}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {formatDateTime(interview.feedback.submittedAt)}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Assigned: {formatDateTime(interview.assignedAt)}
                    {interview.joinedAt && (
                      <span className="ml-4">Joined: {formatDateTime(interview.joinedAt)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback Modal */}
        {showFeedbackModal && selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Interview Feedback - {selectedInterview.jobId.title}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                          className={`text-2xl ${star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={feedbackData.comments}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Share your experience about the interview process..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFeedback}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Submit Feedback
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

export default StudentInterviewsPage;
