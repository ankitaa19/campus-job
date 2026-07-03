import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

// Icons (you may need to import these from your icon library)
const UserIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Application {
  _id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'selected' | 'rejected' | 'withdrawn';
  matchScore?: number;
  applicationNotes?: string;
  lastUpdated?: string;
  interviewDate?: string;
  feedback?: string;
  
  // Enhanced real-time fields
  daysSinceApplied?: number;
  isUrgent?: boolean;
  isRecent?: boolean;
  canWithdraw?: boolean;
  requiresAction?: boolean;
  priority?: 'high' | 'medium' | 'normal';
  tags?: string[];
}

interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  college?: {
    name: string;
    shortName: string;
  };
  course?: string;
  graduationYear?: number;
  resumeUrl?: string;
  skills?: (string | { name: string; level?: string; category?: string; _id: string })[];
  profileCompleteness: number;
  totalApplications: number;
  profilePicture?: string;
  location?: string;
  bio?: string;
  education?: any;
  experience?: any;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

interface JobMatch {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  matchScore: number;
  requiredSkills: (string | { name: string; level?: string; category?: string; _id: string })[];
  salary?: string;
  postedDate: string;
}

export default function EnhancedStudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Real-time polling interval
  useEffect(() => {
    if (realTimeUpdates && activeTab === 'applications') {
      const interval = setInterval(() => {
        fetchApplications();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeUpdates, activeTab]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch student profile
      const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`, { headers });
      const profileData = profileResponse.data?.data || profileResponse.data;
      setStudent(profileData);

      // Fetch applications
      await fetchApplications();

      // Fetch job matches
      await fetchJobMatches();

    } catch (error) {
      console.error('Error fetching student data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Use the enhanced applications endpoint for real-time features
      const response = await axios.get(`${API_BASE_URL}/api/students/applications/enhanced`, { headers });
      const applicationsData = response.data?.data || response.data || [];
      
      console.log('📋 Enhanced applications response:', response.data);
      
      const formattedApplications = Array.isArray(applicationsData) ? applicationsData.map((app: any) => ({
        _id: app._id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        appliedDate: app.appliedDate,
        status: app.status,
        matchScore: app.matchScore,
        applicationNotes: app.applicationNotes,
        lastUpdated: app.lastUpdated,
        interviewDate: app.upcomingInterview?.scheduledDate,
        feedback: app.recruiterFeedback,
        daysSinceApplied: app.daysSinceApplied,
        isUrgent: app.isUrgent,
        isRecent: app.isRecent,
        canWithdraw: app.canWithdraw,
        requiresAction: app.requiresAction,
        priority: app.priority,
        tags: app.tags || []
      })) : [];

      setApplications(formattedApplications);
      
      // Update analytics if available
      if (response.data.analytics) {
        console.log('📊 Application analytics:', response.data.analytics);
      }
      
    } catch (error) {
      console.error('Error fetching enhanced applications:', error);
      // Fallback to regular applications endpoint
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const fallbackResponse = await axios.get(`${API_BASE_URL}/api/students/applications`, { headers });
        const fallbackData = fallbackResponse.data?.data || [];
        setApplications(Array.isArray(fallbackData) ? fallbackData : []);
      } catch (fallbackError) {
        console.error('Both enhanced and regular applications endpoints failed:', fallbackError);
        setApplications([]);
      }
    }
  };

  const fetchJobMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_BASE_URL}/api/student-career/${student?._id}/job-matches?limit=6`, { headers });
      const matches = response.data?.data?.matches || [];
      setJobMatches(matches);
    } catch (error) {
      console.error('Error fetching job matches:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected':
        return '🎉';
      case 'interview_scheduled':
        return '📅';
      case 'interviewed':
        return '🤝';
      case 'rejected':
        return '❌';
      case 'under_review':
        return '👀';
      default:
        return '📝';
    }
  };

  const filteredAndSortedApplications = applications
    .filter(app => statusFilter === 'all' || app.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else if (sortBy === 'match') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return 0;
    });

  const ApplicationDetailsModal = ({ application, onClose }: { application: Application; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Application Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{application.jobTitle}</h3>
                  <p className="text-lg text-gray-600">{application.companyName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Applied on {new Date(application.appliedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)} {application.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {application.matchScore && (
                    <p className="text-sm text-green-600 mt-2">
                      Match Score: {application.matchScore}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Application Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Application submitted - {new Date(application.appliedDate).toLocaleDateString()}
                  </span>
                </div>
                {application.status !== 'applied' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Status updated to "{application.status.replace('_', ' ')}" 
                      {application.lastUpdated && ` - ${new Date(application.lastUpdated).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
                {application.interviewDate && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Interview scheduled - {new Date(application.interviewDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes and Feedback */}
            {(application.applicationNotes || application.feedback) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Notes & Feedback</h4>
                {application.applicationNotes && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <p className="text-sm font-medium text-gray-700">Your Notes:</p>
                    <p className="text-sm text-gray-600 mt-1">{application.applicationNotes}</p>
                  </div>
                )}
                {application.feedback && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-700">Recruiter Feedback:</p>
                    <p className="text-sm text-blue-600 mt-1">{application.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <Link 
                href={`/jobs/${application.jobId}`}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition"
              >
                View Job Details
              </Link>
              {application.status === 'interview_scheduled' && (
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
                  Join Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Student Profile Modal Component
  const StudentProfileModal = ({ 
    student, 
    onClose, 
    onSave 
  }: { 
    student: StudentProfile | null; 
    onClose: () => void; 
    onSave: (profile: StudentProfile) => void; 
  }) => {
    const [formData, setFormData] = useState({
      firstName: student?.firstName || '',
      lastName: student?.lastName || '',
      email: student?.email || '',
      phone: student?.phone || '',
      bio: student?.bio || '',
      skills: student?.skills || [],
      education: student?.education || '',
      location: student?.location || '',
      experience: student?.experience || '',
      linkedinUrl: student?.linkedinUrl || '',
      githubUrl: student?.githubUrl || '',
      portfolioUrl: student?.portfolioUrl || ''
    });

    const [newSkill, setNewSkill] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(
          `${API_BASE_URL}/api/students/profile`, 
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          onSave({ ...student, ...formData } as StudentProfile);
          alert('Profile updated successfully!');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      }
    };

    const addSkill = () => {
      if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, newSkill.trim()]
        }));
        setNewSkill('');
      }
    };

    const removeSkill = (skillToRemove: string | { name: string; level?: string; category?: string; _id: string }) => {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(skill => {
          const currentName = typeof skill === 'object' && skill !== null ? skill.name : skill;
          const removeName = typeof skillToRemove === 'object' && skillToRemove !== null ? skillToRemove.name : skillToRemove;
          return currentName !== removeName;
        })
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  {student?.profilePicture ? (
                    <img src={student.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">
                      {student?.firstName?.charAt(0)}{student?.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Edit Profile</h2>
                  <p className="text-blue-100">Keep your information up to date</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio / About</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself, your goals, and what makes you unique..."
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a skill..."
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => {
                  const skillName = (typeof skill === 'object' && skill !== null ? skill.name : skill) as string;
                  return (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                  >
                    {skillName}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                  );
                })}
              </div>
            </div>

            {/* Education & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
                <textarea
                  value={formData.education}
                  onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your educational background..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your work experience, internships, projects..."
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, State, Country"
              />
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                CampusPe
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Student Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <UserIcon />
                <span>{student?.firstName} {student?.lastName}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Profile Summary */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white"></div>
            <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full bg-white"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center ring-4 ring-white ring-opacity-30">
                    {student?.profilePicture ? (
                      <img src={student.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold">
                        {student?.firstName?.charAt(0)}{student?.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{student?.firstName} {student?.lastName}</h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <span className="inline-flex items-center">
                      🎓 {student?.course}
                    </span>
                    <span className="inline-flex items-center">
                      🏫 {student?.college?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-blue-200 text-sm mt-2">
                    <span>📅 Graduation: {student?.graduationYear}</span>
                    {student?.location && (
                      <span>📍 {student.location}</span>
                    )}
                  </div>
                  
                  {/* Skills Preview */}
                  {student?.skills && student.skills.length > 0 && (
                    <div className="flex items-center space-x-2 mt-4">
                      <span className="text-blue-200 text-sm">Skills:</span>
                      <div className="flex flex-wrap gap-2">
                        {student.skills.slice(0, 3).map((skill, index) => {
                          const skillName = (typeof skill === 'object' && skill !== null ? skill.name : skill) as string;
                          return (
                          <span key={index} className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                            {skillName}
                          </span>
                          );
                        })}
                        {student.skills.length > 3 && (
                          <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                            +{student.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                {/* Profile Completeness */}
                <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center min-w-[200px]">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="white"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (student?.profileCompleteness || 0) / 100)}`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{student?.profileCompleteness || 0}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-100 font-medium">Profile Complete</p>
                </div>
                
                {/* Quick Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={() => window.open('/resume-builder', '_blank')}
                    className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                  >
                    📄 Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'applications', label: 'My Applications', icon: '📄' },
                { key: 'jobs', label: 'Job Matches', icon: '💼' },
                { key: 'profile', label: 'Profile', icon: '👤' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Total Applications</p>
                        <p className="text-2xl font-bold text-blue-900">{applications.length}</p>
                      </div>
                      <DocumentIcon />
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Interviews Scheduled</p>
                        <p className="text-2xl font-bold text-green-900">
                          {applications.filter(app => app.status === 'interview_scheduled').length}
                        </p>
                      </div>
                      <CalendarIcon />
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Selected</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {applications.filter(app => app.status === 'selected').length}
                        </p>
                      </div>
                      <BriefcaseIcon />
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-600 text-sm font-medium">Under Review</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {applications.filter(app => app.status === 'under_review').length}
                        </p>
                      </div>
                      <DocumentIcon />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{app.jobTitle}</p>
                          <p className="text-sm text-gray-600">{app.companyName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-6">
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">My Applications</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                        realTimeUpdates ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${realTimeUpdates ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span>Real-time Updates</span>
                    </button>
                    <button
                      onClick={fetchApplications}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                    >
                      <RefreshIcon />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex space-x-4">
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="status">By Status</option>
                    <option value="match">By Match Score</option>
                  </select>
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                  {filteredAndSortedApplications.length > 0 ? filteredAndSortedApplications.map((app) => (
                    <div 
                      key={app._id} 
                      className={`bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer relative ${
                        app.isUrgent ? 'border-red-200 bg-red-50' : 
                        app.isRecent ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedApplication(app);
                        setShowApplicationDetails(true);
                      }}
                    >
                      {/* Priority and Status Indicators */}
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        {app.requiresAction && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                            ⚠️ Action Required
                          </span>
                        )}
                        {app.isRecent && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            🆕 New
                          </span>
                        )}
                        {app.isUrgent && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            ⏰ Follow Up
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between pr-32">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{app.jobTitle}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)} {app.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{app.companyName}</p>
                          
                          {/* Enhanced Application Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                            <div>
                              <span className="font-medium">Applied:</span> {new Date(app.appliedDate).toLocaleDateString()}
                              {app.daysSinceApplied !== undefined && (
                                <span className="ml-1">({app.daysSinceApplied} days ago)</span>
                              )}
                            </div>
                            {app.lastUpdated && (
                              <div>
                                <span className="font-medium">Last Update:</span> {new Date(app.lastUpdated).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Match Score and Tags */}
                          <div className="flex items-center space-x-4">
                            {app.matchScore && typeof app.matchScore === 'number' && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs font-medium text-green-600">Match Score:</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                  {app.matchScore}%
                                </div>
                              </div>
                            )}
                            
                            {app.tags && app.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {app.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {app.tags.length > 3 && (
                                  <span className="text-gray-500 text-xs">+{app.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Interview Information */}
                          {app.interviewDate && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon />
                                <span className="text-sm font-medium text-purple-800">
                                  Interview Scheduled: {new Date(app.interviewDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Feedback */}
                          {app.feedback && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800 font-medium">Recruiter Feedback:</p>
                              <p className="text-sm text-blue-700 mt-1">{app.feedback}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Details →
                          </button>
                        </div>
                      </div>

                      {/* Real-time Status Indicator */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>ID: {app._id.slice(-8)}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Real-time updates enabled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <DocumentIcon />
                      <p className="mt-4 text-gray-500">No applications found</p>
                      <p className="text-sm text-gray-400 mb-4">Start applying for jobs to track your progress</p>
                      <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        Browse Jobs
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">AI-Powered Job Matches</h2>
                  <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Browse All Jobs
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobMatches.map((job) => (
                    <div key={job._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                          <p className="text-gray-600 text-sm">{job.companyName}</p>
                          <p className="text-gray-500 text-sm">{job.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {job.matchScore}% Match
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.requiredSkills.slice(0, 3).map((skill, index) => {
                            const skillName = (typeof skill === 'object' && skill !== null ? skill.name : skill) as string;
                            return (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skillName}
                            </span>
                            );
                          })}
                          {job.requiredSkills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{job.requiredSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Posted {new Date(job.postedDate).toLocaleDateString()}
                        </span>
                        <Link
                          href={`/jobs/${job._id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                        >
                          Apply Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
                    <p className="text-gray-600">Manage your personal and academic information</p>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg"
                  >
                    <span>✏️</span>
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Profile Picture & Basic Info */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="text-center">
                        <div className="relative inline-block">
                          <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            {student?.profilePicture ? (
                              <img src={student.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-4xl font-bold text-white">
                                {student?.firstName?.charAt(0)}{student?.lastName?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="absolute -bottom-2 right-1/2 transform translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{student?.firstName} {student?.lastName}</h3>
                        <p className="text-blue-600 font-medium mb-4">{student?.course}</p>
                        
                        {/* Profile Completion */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Profile Completion</span>
                            <span className="text-sm font-bold text-blue-600">{student?.profileCompleteness || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${student?.profileCompleteness || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-lg">👤</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                            <p className="text-gray-900 font-medium mt-1">{student?.firstName} {student?.lastName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</label>
                            <p className="text-gray-900 font-medium mt-1">{student?.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                            <p className="text-gray-900 font-medium mt-1">{student?.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</label>
                            <p className="text-gray-900 font-medium mt-1">{student?.location || 'Not specified'}</p>
                          </div>
                          {student?.bio && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Bio</label>
                              <p className="text-gray-900 mt-1 text-sm leading-relaxed">{student.bio}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-green-600 text-lg">🎓</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">College</label>
                          <p className="text-gray-900 font-medium mt-1">{student?.college?.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Course</label>
                          <p className="text-gray-900 font-medium mt-1">{student?.course || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Graduation Year</label>
                          <p className="text-gray-900 font-medium mt-1">{student?.graduationYear || 'Not specified'}</p>
                        </div>
                      </div>

                      {student?.education && (
                        <div className="mt-6">
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Education Details</label>
                          <p className="text-gray-900 mt-1 text-sm leading-relaxed">{student.education}</p>
                        </div>
                      )}
                    </div>

                    {/* Skills & Experience */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-purple-600 text-lg">⚡</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Skills & Experience</h3>
                      </div>

                      {student?.skills && student.skills.length > 0 && (
                        <div className="mb-6">
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 block">Skills</label>
                          <div className="flex flex-wrap gap-3">
                            {student.skills.map((skill, index) => {
                              const skillName = (typeof skill === 'object' && skill !== null ? skill.name : skill) as string;
                              return (
                              <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm rounded-full font-medium border border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-all duration-200">
                                {skillName}
                              </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {student?.experience && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Experience</label>
                          <p className="text-gray-900 mt-1 text-sm leading-relaxed">{student.experience}</p>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {(student?.linkedinUrl || student?.githubUrl || student?.portfolioUrl) && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-indigo-600 text-lg">🔗</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {student?.linkedinUrl && (
                            <a
                              href={student.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <span className="text-blue-600 mr-3">💼</span>
                              <span className="text-blue-700 font-medium">LinkedIn</span>
                            </a>
                          )}
                          {student?.githubUrl && (
                            <a
                              href={student.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-gray-600 mr-3">💻</span>
                              <span className="text-gray-700 font-medium">GitHub</span>
                            </a>
                          )}
                          {student?.portfolioUrl && (
                            <a
                              href={student.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              <span className="text-purple-600 mr-3">🌐</span>
                              <span className="text-purple-700 font-medium">Portfolio</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Details Modal */}
      {showApplicationDetails && selectedApplication && (
        <ApplicationDetailsModal 
          application={selectedApplication} 
          onClose={() => {
            setShowApplicationDetails(false);
            setSelectedApplication(null);
          }} 
        />
      )}

      {/* Student Profile Modal */}
      {showProfileModal && (
        <StudentProfileModal 
          student={student} 
          onClose={() => setShowProfileModal(false)}
          onSave={(updatedProfile) => {
            setStudent(updatedProfile);
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}
