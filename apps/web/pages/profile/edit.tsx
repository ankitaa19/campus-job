'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_ENDPOINTS, API_BASE_URL } from '../../utils/api';
import { useResumeUpload } from '../../components/ResumeUpload';

interface StudentProfile {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  studentId: string;
  enrollmentYear: number;
  graduationYear: number;
  currentSemester: number;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: 'technical' | 'soft' | 'other';
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
    gpa?: number;
  }>;
  experience: Array<{
    company: string;
    position: string;
    description: string;
    startDate: string;
    endDate: string;
    isCurrentJob: boolean;
  }>;
  jobPreferences: {
    jobTypes: string[];
    preferredLocations: string[];
    workMode: 'onsite' | 'remote' | 'hybrid' | 'any';
    expectedSalary?: {
      min: number;
      max: number;
      currency: string;
    };
  };
}

const ProfileEditContent = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    studentId: '',
    enrollmentYear: new Date().getFullYear(),
    graduationYear: new Date().getFullYear() + 4,
    currentSemester: 1,
    skills: [],
    education: [],
    experience: [],
    jobPreferences: {
      jobTypes: [],
      preferredLocations: [],
      workMode: 'any'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<any>(null);

  // Resume upload hook
  const resumeUpload = useResumeUpload({
    onUploadSuccess: (analysis) => {
      console.log('Resume upload successful with analysis:', analysis);
      setResumeInfo(analysis);
      setSuccessMessage('Resume uploaded and analyzed successfully! Profile updated with extracted information.');
      // Refresh profile data to get updated info
      fetchProfile();
    },
    onUploadError: (errorMessage) => {
      console.error('Resume upload error:', errorMessage);
      setError('Resume upload failed: ' + errorMessage);
    },
    isUploading: resumeUploading,
    setIsUploading: setResumeUploading
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_PROFILE}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setProfile({
          _id: data._id,
          firstName: data.firstName || data.personalInfo?.firstName || '',
          lastName: data.lastName || data.personalInfo?.lastName || '',
          email: data.email || data.personalInfo?.email || '',
          phoneNumber: data.phoneNumber || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          linkedinUrl: data.linkedinUrl || '',
          githubUrl: data.githubUrl || '',
          portfolioUrl: data.portfolioUrl || '',
          studentId: data.studentId || '',
          enrollmentYear: data.enrollmentYear || new Date().getFullYear(),
          graduationYear: data.graduationYear || new Date().getFullYear() + 4,
          currentSemester: data.currentSemester || 1,
          skills: data.skills || [],
          education: data.education || [],
          experience: data.experience || [],
          jobPreferences: data.jobPreferences || {
            jobTypes: [],
            preferredLocations: [],
            workMode: 'any'
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Use the profile update endpoint directly
      const response = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.STUDENT_PROFILE}`,
        profile,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success || response.data.message?.includes('updated successfully')) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // Refresh profile data
        await fetchProfile();
      } else {
        setError(response.data.error || 'Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else if (error.response?.status === 404) {
        setError('Profile not found. Please try refreshing the page.');
      } else {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to update profile. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'intermediate', category: 'technical' }]
    }));
  };

  const removeSkill = (index: number) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index: number, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 4
      }]
    }));
  };

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        position: '',
        description: '',
        startDate: '',
        endDate: '',
        isCurrentJob: false
      }]
    }));
  };

  const removeExperience = (index: number) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  // Resume upload functions
  const handleResumeButtonClick = () => {
    const fileInput = document.getElementById('resume-upload-profile') as HTMLInputElement;
    fileInput?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resumeUpload.handleFileSelect(file);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your information to get better job matches</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            {[
              { id: 'personal', label: 'Personal Info', icon: '👤' },
              { id: 'resume', label: 'Resume', icon: '📄' },
              { id: 'education', label: 'Education', icon: '🎓' },
              { id: 'skills', label: 'Skills', icon: '🛠️' },
              { id: 'experience', label: 'Experience', icon: '💼' },
              { id: 'preferences', label: 'Job Preferences', icon: '🎯' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phoneNumber}
                      onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Online Profiles</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={profile.linkedinUrl}
                      onChange={(e) => setProfile(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={profile.githubUrl}
                      onChange={(e) => setProfile(prev => ({ ...prev, githubUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={profile.portfolioUrl}
                      onChange={(e) => setProfile(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Resume & AI Analysis</h3>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 text-sm mb-2">
                    <strong>🚀 Update Profile Using Resume:</strong> Upload your resume to automatically extract and update your profile information using AI.
                  </p>
                  <p className="text-blue-600 text-xs">
                    This will analyze your resume and update your skills, experience, education, and contact information.
                  </p>
                </div>

                {resumeInfo ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm font-medium">✅ Resume analyzed successfully!</p>
                      <p className="text-green-600 text-xs mt-1">Your profile has been updated with extracted information</p>
                    </div>
                    
                    {resumeInfo.skills && resumeInfo.skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">🎯 Detected Skills ({resumeInfo.skills.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {resumeInfo.skills.slice(0, 10).map((skill: any, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {typeof skill === 'string' ? skill : skill.name || skill}
                            </span>
                          ))}
                          {resumeInfo.skills.length > 10 && (
                            <span className="text-blue-600 text-sm bg-blue-50 px-3 py-1 rounded-full">
                              +{resumeInfo.skills.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {resumeInfo.category && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">📂 Career Category:</p>
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{resumeInfo.category}</span>
                      </div>
                    )}

                    {resumeInfo.experienceLevel && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">💼 Experience Level:</p>
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{resumeInfo.experienceLevel}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleResumeButtonClick}
                      disabled={resumeUploading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {resumeUploading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analyzing Resume...
                        </span>
                      ) : (
                        'Update Resume & Refresh Profile'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Upload your resume to automatically extract and update your profile information</p>
                    
                    {resumeUploading ? (
                      <div className="border-2 border-blue-300 border-dashed rounded-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-blue-600 text-sm font-medium">Analyzing resume with AI...</p>
                        <p className="text-blue-500 text-xs mt-1">This may take a few moments</p>
                      </div>
                    ) : (
                      <div 
                        onClick={handleResumeButtonClick}
                        className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-gray-400 text-4xl mb-4">📁</div>
                        <p className="text-gray-600 text-sm mb-2 font-medium">Click to upload PDF resume</p>
                        <p className="text-gray-400 text-xs">AI will analyze and update your profile automatically</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center">
                      <span className="text-gray-400 text-xs">or</span>
                    </div>
                    
                    <a
                      href="/ai-resume-builder"
                      className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2 px-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Use AI Resume Builder →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Education</h3>
                  <button
                    onClick={addEducation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Education
                  </button>
                </div>
                
                {profile.education.map((edu, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-800">Education {index + 1}</h4>
                      <button
                        onClick={() => removeEducation(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Institution
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Degree
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Year
                        </label>
                        <input
                          type="number"
                          value={edu.startYear}
                          onChange={(e) => updateEducation(index, 'startYear', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Year
                        </label>
                        <input
                          type="number"
                          value={edu.endYear}
                          onChange={(e) => updateEducation(index, 'endYear', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GPA (Optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={edu.gpa || ''}
                          onChange={(e) => updateEducation(index, 'gpa', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {profile.education.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No education information added yet. Click "Add Education" to get started.
                  </div>
                )}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Skills</h3>
                  <button
                    onClick={addSkill}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Skill
                  </button>
                </div>
                
                {profile.skills.map((skill, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-800">Skill {index + 1}</h4>
                      <button
                        onClick={() => removeSkill(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => updateSkill(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Level
                        </label>
                        <select
                          value={skill.level}
                          onChange={(e) => updateSkill(index, 'level', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={skill.category}
                          onChange={(e) => updateSkill(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="technical">Technical</option>
                          <option value="soft">Soft Skills</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {profile.skills.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No skills added yet. Click "Add Skill" to get started.
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Experience</h3>
                  <button
                    onClick={addExperience}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Experience
                  </button>
                </div>
                
                {profile.experience.map((exp, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-800">Experience {index + 1}</h4>
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={exp.isCurrentJob}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exp.isCurrentJob}
                          onChange={(e) => updateExperience(index, 'isCurrentJob', e.target.checked)}
                          className="mr-2"
                        />
                        I currently work here
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your role and responsibilities..."
                      />
                    </div>
                  </div>
                ))}
                
                {profile.experience.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No experience added yet. Click "Add Experience" to get started.
                  </div>
                )}
              </div>
            )}

            {/* Job Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Job Preferences</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Types
                  </label>
                  <input
                    type="text"
                    value={profile.jobPreferences.jobTypes.join(', ')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      jobPreferences: {
                        ...prev.jobPreferences,
                        jobTypes: e.target.value.split(',').map(type => type.trim()).filter(type => type)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Frontend Development, Software Engineering (comma separated)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Locations
                  </label>
                  <input
                    type="text"
                    value={profile.jobPreferences.preferredLocations.join(', ')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      jobPreferences: {
                        ...prev.jobPreferences,
                        preferredLocations: e.target.value.split(',').map(loc => loc.trim()).filter(loc => loc)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mumbai, Delhi, Bangalore (comma separated)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Mode
                  </label>
                  <select
                    value={profile.jobPreferences.workMode}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      jobPreferences: {
                        ...prev.jobPreferences,
                        workMode: e.target.value as 'onsite' | 'remote' | 'hybrid' | 'any'
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="any">Any</option>
                    <option value="onsite">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Expected Salary (Optional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum
                      </label>
                      <input
                        type="number"
                        value={profile.jobPreferences.expectedSalary?.min || ''}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          jobPreferences: {
                            ...prev.jobPreferences,
                            expectedSalary: {
                              ...prev.jobPreferences.expectedSalary,
                              min: parseInt(e.target.value) || 0,
                              max: prev.jobPreferences.expectedSalary?.max || 0,
                              currency: prev.jobPreferences.expectedSalary?.currency || 'INR'
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="300000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum
                      </label>
                      <input
                        type="number"
                        value={profile.jobPreferences.expectedSalary?.max || ''}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          jobPreferences: {
                            ...prev.jobPreferences,
                            expectedSalary: {
                              ...prev.jobPreferences.expectedSalary,
                              min: prev.jobPreferences.expectedSalary?.min || 0,
                              max: parseInt(e.target.value) || 0,
                              currency: prev.jobPreferences.expectedSalary?.currency || 'INR'
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="600000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={profile.jobPreferences.expectedSalary?.currency || 'INR'}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          jobPreferences: {
                            ...prev.jobPreferences,
                            expectedSalary: {
                              ...prev.jobPreferences.expectedSalary,
                              min: prev.jobPreferences.expectedSalary?.min || 0,
                              max: prev.jobPreferences.expectedSalary?.max || 0,
                              currency: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Hidden file input for resume upload */}
        <input
          id="resume-upload-profile"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          style={{ display: 'none' }}
        />
      </main>
      <Footer />
    </>
  );
};

export default function ProfileEdit() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <ProfileEditContent />
    </ProtectedRoute>
  );
}
