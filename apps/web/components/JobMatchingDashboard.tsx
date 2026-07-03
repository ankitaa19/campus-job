import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

interface MatchedStudent {
  studentId: string;
  matchScore: number;
  skillMatch: number;
  toolMatch: number;
  categoryMatch: number;
  workModeMatch: number;
  semanticSimilarity: number;
  matchedSkills: string[];
  matchedTools: string[];
  studentDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    whatsappNumber: string;
    collegeName: string;
    collegeShortName: string;
    skills: any[];
    graduationYear: number;
    cgpa: number;
    profileCompleteness: number;
    isPlacementReady: boolean;
  };
}

interface NotificationHistoryItem {
  id: string;
  studentName: string;
  title: string;
  message: string;
  status: string;
  sentAt: string;
  channels: any;
  priority: string;
}

interface JobMatchingDashboardProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
}

const JobMatchingDashboard: React.FC<JobMatchingDashboardProps> = ({
  jobId,
  jobTitle,
  companyName,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'notifications' | 'controls'>('matches');
  const [matchedStudents, setMatchedStudents] = useState<MatchedStudent[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [threshold, setThreshold] = useState(70);
  const [sending, setSending] = useState(false);
  
  // Stats
  const [totalMatches, setTotalMatches] = useState(0);
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    sent: 0,
    failed: 0
  });

  useEffect(() => {
    if (activeTab === 'matches') {
      fetchMatchedStudents();
    } else if (activeTab === 'notifications') {
      fetchNotificationHistory();
    }
  }, [activeTab, jobId, threshold]);

  const fetchMatchedStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          threshold: threshold / 100, 
          limit: 50, 
          includeDetails: true 
        }
      });

      if (response.data.success) {
        console.log('🔍 Raw API Response:', response.data);
        console.log('🎯 Matches Data:', response.data.data.matches);
        
        const matches = response.data.data.matches;
        if (matches.length > 0) {
          console.log('📋 First match sample:', matches[0]);
          console.log('👤 Student details sample:', matches[0].studentDetails);
        }
        
        setMatchedStudents(response.data.data.matches);
        setTotalMatches(response.data.data.totalMatches);
      }
    } catch (error) {
      console.error('Error fetching matched students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotificationHistory(response.data.data.notifications);
        
        // Calculate stats
        const notifications = response.data.data.notifications;
        const total = notifications.length;
        const sent = notifications.filter((n: any) => n.status === 'sent').length;
        const failed = notifications.filter((n: any) => n.status === 'failed').length;
        setNotificationStats({ total, sent, failed });
      }
    } catch (error) {
      console.error('Error fetching notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === matchedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(matchedStudents.map(s => s.studentId));
    }
  };

  const sendWhatsAppMessages = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/jobs/${jobId}/whatsapp`,
        {
          studentIds: selectedStudents,
          customMessage: customMessage.trim() || undefined,
          includeJobDetails: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(response.data.message);
        setSelectedStudents([]);
        setCustomMessage('');
        // Refresh notification history
        if (activeTab === 'notifications') {
          fetchNotificationHistory();
        }
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp messages:', error);
      alert(error.response?.data?.message || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{jobTitle}</h2>
            <p className="text-gray-600">{companyName} • Job Matching Dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'matches'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Matched Students ({totalMatches})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            WhatsApp History ({notificationStats.total})
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'controls'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Auto-Notifications & Custom Messages
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'matches' && (
            <div className="h-full flex flex-col">
              {/* Controls */}
              <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Min Match Score:</label>
                    <select
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value={50}>50%</option>
                      <option value={60}>60%</option>
                      <option value={70}>70%</option>
                      <option value={80}>80%</option>
                      <option value={90}>90%</option>
                    </select>
                  </div>
                  <button
                    onClick={selectAllStudents}
                    className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                  >
                    {selectedStudents.length === matchedStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedStudents.length} selected
                  </span>
                  <button
                    onClick={() => setActiveTab('controls')}
                    disabled={selectedStudents.length === 0}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                  >
                    Send Custom Message
                  </button>
                </div>
              </div>

              {/* Students List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchedStudents.map((student) => (
                      <div
                        key={student.studentId}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.studentId)}
                              onChange={() => handleStudentSelect(student.studentId)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {student.studentDetails.firstName} {student.studentDetails.lastName}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(student.matchScore)}`}>
                                  {student.matchScore}% Match
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>📧 {student.studentDetails.email || 'No email'}</p>
                                <p>📞 {student.studentDetails.whatsappNumber || student.studentDetails.phone || 'No phone'}</p>
                                <p>🏫 {student.studentDetails.collegeName || student.studentDetails.collegeShortName || 'Unknown College'} • Class of {student.studentDetails.graduationYear || 'N/A'}</p>
                                <p>📊 Profile: {student.studentDetails.profileCompleteness || 0}% • CGPA: {student.studentDetails.cgpa || 'N/A'}</p>
                              </div>

                              <div className="mt-3 space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Matched Skills: </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {student.matchedSkills.map((skill, idx) => (
                                      <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex space-x-4 text-xs text-gray-500">
                                  <span>Skills: {student.skillMatch}%</span>
                                  <span>Tools: {student.toolMatch}%</span>
                                  <span>Category: {student.categoryMatch ? '✓' : '✗'}</span>
                                  <span>Work Mode: {student.workModeMatch ? '✓' : '✗'}</span>
                                  <span>Semantic: {student.semanticSimilarity}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="h-full flex flex-col">
              {/* Stats */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{notificationStats.total}</div>
                    <div className="text-sm text-gray-600">Total Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{notificationStats.sent}</div>
                    <div className="text-sm text-gray-600">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{notificationStats.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notificationHistory.map((notification) => (
                      <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{notification.studentName}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                              {notification.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.sentAt).toLocaleDateString()} {new Date(notification.sentAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="h-full flex flex-col p-6">
              <div className="space-y-6">
                {/* Auto-Notification Status */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">🤖 Auto-Notifications Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800 font-medium">ACTIVE: Auto-notifications enabled</span>
                    </div>
                    <p className="text-sm text-green-700">
                      ✅ Students with 70%+ match scores automatically receive WhatsApp notifications when they apply.
                    </p>
                    <p className="text-xs text-green-600">
                      No action needed - this happens automatically for all high-match applications.
                    </p>
                  </div>
                </div>

                {/* Manual Override for Custom Messages */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">📱 Manual Message Override</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Students: {selectedStudents.length}
                      </label>
                      <p className="text-sm text-gray-600">
                        Go to "Matched Students" tab to select specific students for custom messages.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Message (for special announcements)
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Enter custom message for special announcements or follow-ups"
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={sendWhatsAppMessages}
                      disabled={selectedStudents.length === 0 || sending}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {sending ? 'Sending...' : `Send Custom Message to ${selectedStudents.length} Students`}
                    </button>
                    <p className="text-xs text-blue-600">
                      Use this only for special announcements. Regular job matching notifications are sent automatically.
                    </p>
                  </div>
                </div>

                {/* Custom Message Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">📝 Custom Message Preview</h3>
                  <div className="bg-white border rounded-lg p-3 text-sm">
                    {customMessage ? (
                      <p>{customMessage}</p>
                    ) : (
                      <div className="text-gray-500 italic">
                        <p>No custom message - will send default job notification</p>
                        <div className="mt-2 text-xs">
                          <p className="font-medium">Default format includes:</p>
                          <p>• Job title and company</p>
                          <p>• Location and salary details</p>
                          <p>• Individual match score</p>
                          <p>• Personalized message</p>
                          <p>• Direct job application link</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Students with 70%+ match scores already receive automatic notifications when they apply.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMatchingDashboard;
