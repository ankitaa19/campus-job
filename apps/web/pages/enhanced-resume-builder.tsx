'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  location?: string;
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  isCompleted: boolean;
}

interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentJob: boolean;
}

interface Skill {
  name: string;
  level: string;
  category: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface Certification {
  name: string;
  year: number;
  organization: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

export default function EnhancedResumeBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      location: 'India'
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: []
  });

  // Load existing resume data
  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/resume-builder/data', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setResumeData(response.data.data);
      }
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load resume data');
      setLoading(false);
    }
  };

  const saveResumeData = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      await axios.put('/api/resume-builder/data', resumeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Resume data saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError('Failed to save resume data');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');

      const response = await axios.post('/api/resume-builder/generate', {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeData.personalInfo.firstName}_${resumeData.personalInfo.lastName}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('Resume PDF generated and downloaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const previewResume = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/resume-builder/preview?token=${token}`, '_blank');
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        field: '',
        institution: '',
        startDate: '',
        endDate: '',
        gpa: undefined,
        isCompleted: false
      }]
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        isCurrentJob: false
      }]
    }));
  };

  const addSkill = () => {
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        name: '',
        level: 'intermediate',
        category: 'technical'
      }]
    }));
  };

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: '',
        description: '',
        technologies: [],
        link: ''
      }]
    }));
  };

  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        name: '',
        year: new Date().getFullYear(),
        organization: ''
      }]
    }));
  };

  const removeItem = (section: keyof ResumeData, index: number) => {
    setResumeData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((_, i) => i !== index)
    }));
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resume builder...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certifications', label: 'Certifications', icon: '🏆' },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-700 mb-4">
              🚀 Enhanced Resume Builder
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create a professional resume with our advanced builder. Your data is automatically 
              synced with your CampusPe profile for seamless job applications.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <button
              onClick={saveResumeData}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>💾 Save Progress</>
              )}
            </button>
            
            <button
              onClick={previewResume}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              👁️ Preview Resume
            </button>
            
            <button
              onClick={generatePDF}
              disabled={generating}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>📄 Download PDF</>
              )}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto bg-white rounded-lg shadow-sm border mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="text-lg mb-1">{tab.icon}</div>
                <div className="text-sm font-medium">{tab.label}</div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.firstName}
                      onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.lastName}
                      onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={resumeData.personalInfo.linkedin || ''}
                      onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                    <input
                      type="url"
                      value={resumeData.personalInfo.github || ''}
                      onChange={(e) => updatePersonalInfo('github', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/johndoe"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">🎓 Education</h2>
                  <button
                    onClick={addEducation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add Education
                  </button>
                </div>
                
                {resumeData.education.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No education entries yet. Click "Add Education" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
                        <button
                          onClick={() => removeItem('education', index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="Bachelor of Technology"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study *</label>
                            <input
                              type="text"
                              value={edu.field}
                              onChange={(e) => updateEducation(index, 'field', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="Computer Science"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="XYZ University"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                            <input
                              type="date"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                              type="date"
                              value={edu.endDate || ''}
                              onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              disabled={!edu.isCompleted}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GPA</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={edu.gpa || ''}
                              onChange={(e) => updateEducation(index, 'gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="8.5"
                            />
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={edu.isCompleted}
                              onChange={(e) => updateEducation(index, 'isCompleted', e.target.checked)}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700">Completed</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">💼 Experience</h2>
                  <button
                    onClick={addExperience}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add Experience
                  </button>
                </div>
                
                {resumeData.experience.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No experience entries yet. Click "Add Experience" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {resumeData.experience.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
                        <button
                          onClick={() => removeItem('experience', index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateExperience(index, 'title', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="Software Developer"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="Tech Company Inc."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                              type="text"
                              value={exp.location || ''}
                              onChange={(e) => updateExperience(index, 'location', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="Mumbai, India"
                            />
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exp.isCurrentJob}
                              onChange={(e) => updateExperience(index, 'isCurrentJob', e.target.checked)}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700">Current Job</label>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                            <input
                              type="date"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                              type="date"
                              value={exp.endDate || ''}
                              onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              disabled={exp.isCurrentJob}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              value={exp.description || ''}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              rows={3}
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">⚡ Skills</h2>
                  <button
                    onClick={addSkill}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add Skill
                  </button>
                </div>
                
                {resumeData.skills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No skills added yet. Click "Add Skill" to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resumeData.skills.map((skill, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <button
                          onClick={() => removeItem('skills', index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                              placeholder="React.js"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                            <select
                              value={skill.level}
                              onChange={(e) => updateSkill(index, 'level', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                              <option value="expert">Expert</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={skill.category}
                              onChange={(e) => updateSkill(index, 'category', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                            >
                              <option value="technical">Technical</option>
                              <option value="soft">Soft Skills</option>
                              <option value="language">Language</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">🚀 Projects</h2>
                  <button
                    onClick={addProject}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add Project
                  </button>
                </div>
                
                {resumeData.projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No projects added yet. Click "Add Project" to showcase your work.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {resumeData.projects.map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
                        <button
                          onClick={() => removeItem('projects', index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                            <input
                              type="text"
                              value={project.name}
                              onChange={(e) => updateProject(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="E-commerce Website"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea
                              value={project.description}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              rows={3}
                              placeholder="A full-stack e-commerce application with user authentication, payment integration, and admin panel..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                            <input
                              type="text"
                              value={project.technologies.join(', ')}
                              onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="React, Node.js, MongoDB, Express"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Link</label>
                            <input
                              type="url"
                              value={project.link || ''}
                              onChange={(e) => updateProject(index, 'link', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                              placeholder="https://github.com/username/project"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">🏆 Certifications</h2>
                  <button
                    onClick={addCertification}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add Certification
                  </button>
                </div>
                
                {resumeData.certifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No certifications added yet. Click "Add Certification" to highlight your achievements.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resumeData.certifications.map((cert, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <button
                          onClick={() => removeItem('certifications', index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name *</label>
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => updateCertification(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              placeholder="AWS Certified Developer"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                            <input
                              type="text"
                              value={cert.organization}
                              onChange={(e) => updateCertification(index, 'organization', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              placeholder="Amazon Web Services"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input
                              type="number"
                              min="1990"
                              max={new Date().getFullYear() + 10}
                              value={cert.year}
                              onChange={(e) => updateCertification(index, 'year', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              placeholder="2024"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Integration Info */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-2xl">📱</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  🚀 WhatsApp Resume Builder
                </h3>
                <p className="text-gray-700 mb-3">
                  Create tailored resumes instantly via WhatsApp! Send us a job description along with your email, 
                  and get a customized resume within minutes.
                </p>
                <div className="text-sm text-gray-600">
                  <p><strong>How it works:</strong></p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Send your email and job description to our WhatsApp</li>
                    <li>Our AI analyzes the job requirements</li>
                    <li>We fetch your CampusPe profile data</li>
                    <li>Generate a tailored resume matching the job</li>
                    <li>Receive professional PDF instantly!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
