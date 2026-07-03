'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import StudentDashboardLayout from '../components/StudentDashboardLayout';
import ResumeHistory from '../components/ResumeHistory';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';
import { ArrowLeft, ArrowRight, Download, FileText, Sparkles, History, Check, Share2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { TemplatePreview } from '../components/resume/TemplatePreview';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  style: 'modern' | 'professional' | 'creative' | 'minimal' | 'executive';
}

const templates: Template[] = [
  {
    id: 'modern-1',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with bold headers',
    thumbnail: '/templates/modern-1.png',
    style: 'modern'
  },
  {
    id: 'professional-1',
    name: 'Classic Professional',
    description: 'Traditional layout perfect for corporate roles',
    thumbnail: '/templates/professional-1.png',
    style: 'professional'
  },
  {
    id: 'creative-1',
    name: 'Creative Designer',
    description: 'Stand out with unique visual elements',
    thumbnail: '/templates/creative-1.png',
    style: 'creative'
  },
  {
    id: 'minimal-1',
    name: 'Minimalist',
    description: 'Simple and elegant, focus on content',
    thumbnail: '/templates/minimal-1.png',
    style: 'minimal'
  },
  {
    id: 'executive-1',
    name: 'Executive',
    description: 'Professional design for senior positions',
    thumbnail: '/templates/executive-1.png',
    style: 'executive'
  },
  {
    id: 'modern-2',
    name: 'Tech Professional',
    description: 'Modern template designed for tech roles',
    thumbnail: '/templates/modern-2.png',
    style: 'modern'
  },
  {
    id: 'professional-2',
    name: 'Business Classic',
    description: 'Timeless design for business professionals',
    thumbnail: '/templates/professional-2.png',
    style: 'professional'
  },
  {
    id: 'creative-2',
    name: 'Bold Creative',
    description: 'Eye-catching design for creative fields',
    thumbnail: '/templates/creative-2.png',
    style: 'creative'
  },
  {
    id: 'minimal-2',
    name: 'Clean Simple',
    description: 'Minimalist approach with maximum impact',
    thumbnail: '/templates/minimal-2.png',
    style: 'minimal'
  },
  {
    id: 'executive-2',
    name: 'Senior Executive',
    description: 'Sophisticated layout for leadership roles',
    thumbnail: '/templates/executive-2.png',
    style: 'executive'
  }
];

const TEMPLATES_PER_PAGE = 6;

// Sample data for template previews
const sampleResumeData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1 234-567-8900',
    location: 'San Francisco, CA',
    title: 'Software Engineer',
    summary: 'Experienced software engineer with 5+ years of expertise in building scalable web applications.',
    socialLinks: [
      { placeholder: 'LinkedIn', url: 'linkedin.com/in/johndoe' },
      { placeholder: 'GitHub', url: 'github.com/johndoe' }
    ]
  },
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      startDate: '2021-01',
      endDate: '',
      description: 'Led development of cloud-native applications',
      isCurrentJob: true
    }
  ],
  education: [
    {
      degree: 'B.S.',
      field: 'Computer Science',
      institution: 'University of Technology',
      startDate: '2015-08',
      endDate: '2019-05',
      gpa: 3.8,
      isCompleted: true
    }
  ],
  skills: [
    { name: 'React', level: 'expert', category: 'technical' },
    { name: 'Node.js', level: 'expert', category: 'technical' },
    { name: 'TypeScript', level: 'advanced', category: 'technical' },
    { name: 'Python', level: 'advanced', category: 'technical' }
  ],
  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Built a scalable e-commerce solution serving 100K+ users',
      technologies: ['React', 'Node.js', 'MongoDB'],
      link: 'github.com/project'
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Developer',
      organization: 'Amazon Web Services',
      year: 2023
    }
  ]
};

interface ResumeRequest {
  jobDescription: string;
  templateId: string;
}

interface UserProfile {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}

interface GeneratedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

const AIResumeBuilder = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Resume history modal
  const [showResumeHistory, setShowResumeHistory] = useState(false);
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Form data
  const [resumeRequest, setResumeRequest] = useState<ResumeRequest>({
    jobDescription: '',
    templateId: ''
  });
  
  // Generated resume data
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (typeof window === 'undefined') return; // Skip during SSR
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access the resume builder');
        return;
      }

      console.log('🔍 Fetching user profile...');
      console.log('📡 API Base URL:', API_BASE_URL);

      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_PROFILE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
        console.log('✅ User profile loaded');
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      if (error.response?.status === 401) {
        setError('Please login to access the resume builder');
      }
      // Don't show error here, user can still use the builder
    }
  };

  const handleInputChange = (field: keyof ResumeRequest, value: string) => {
    setResumeRequest(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear any previous errors
    setError(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setResumeRequest(prev => ({
      ...prev,
      templateId
    }));
  };

  const getStyleColor = (style: string) => {
    const colors: Record<string, string> = {
      modern: 'from-blue-500 to-cyan-500',
      professional: 'from-slate-600 to-slate-800',
      creative: 'from-purple-500 to-pink-500',
      minimal: 'from-gray-600 to-gray-800',
      executive: 'from-indigo-600 to-blue-700'
    };
    return colors[style] || 'from-blue-500 to-cyan-500';
  };

    const generateResumeWithAI = async () => {
    if (!resumeRequest.jobDescription || !resumeRequest.templateId) {
      setError('Please provide job description and select a template');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (typeof window === 'undefined') {
        setError('Resume generation requires client-side execution');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to generate resumes');
        return;
      }

      console.log('🚀 Generating AI resume...');
      console.log('📋 Request data:', {
        templateId: resumeRequest.templateId,
        jobDescription: resumeRequest.jobDescription.substring(0, 100) + '...'
      });

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AI_RESUME_GENERATE}`, {
        jobDescription: resumeRequest.jobDescription,
        templateId: resumeRequest.templateId,
        includeProfileData: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 AI Resume Response:', response.data);

      if (response.data.success) {
        setGeneratedResume(response.data.data.resume);
        setGeneratedResumeId(response.data.data.resumeId);
        setCurrentStep(3);
        setSuccess('Resume generated successfully using AI!');
        console.log('✅ Resume generated successfully');
        console.log('📋 Resume ID:', response.data.data.resumeId);
      } else {
        setError(response.data.message || 'Failed to generate resume');
      }
    } catch (error: any) {
      console.error('❌ Error generating resume:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        setError('Please login to access the resume builder');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to generate resume. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadResumePDF = async () => {
    if (!generatedResume) return;

    setLoading(true);
    try {
      if (typeof window === 'undefined') {
        setError('PDF download requires client-side execution');
        return;
      }

      let response;
      
      console.log('📥 Downloading resume PDF...');
      console.log('📋 Resume ID:', generatedResumeId);

      // If we have a generatedResumeId, use the public download endpoint
      if (generatedResumeId) {
        const downloadUrl = `${API_BASE_URL}/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`;
        console.log('🔗 Download URL:', downloadUrl);
        
        response = await axios.get(downloadUrl, {
          responseType: 'blob'
        });
      } else {
        // Fallback to the AI resume builder download endpoint
        const token = localStorage.getItem('token');
        response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AI_RESUME_DOWNLOAD}`, {
          resume: generatedResume
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        });
      }

      // Create blob URL for download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const fileName = generatedResumeId 
        ? `Resume_${generatedResumeId}_${Date.now()}.pdf`
        : `AI_Resume_${Date.now()}.pdf`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Resume downloaded successfully');
      setSuccess('Resume downloaded successfully!');
    } catch (error: any) {
      console.error('❌ Error downloading resume:', error);
      setError('Failed to download resume: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const shareOnWhatsApp = async () => {
    if (!generatedResume || !generatedResumeId) return;

    try {
      console.log('📱 Sharing resume via WABB webhook:', generatedResumeId);
      
      // Call the new WhatsApp share endpoint
      const response = await axios.post(`${API_BASE_URL}/api/generated-resume/whatsapp-share`, {
        resumeId: generatedResumeId
      });

      if (response.data.success) {
        if (response.data.data.whatsappUrl) {
          // Open WhatsApp with pre-filled message
          window.open(response.data.data.whatsappUrl, '_blank');
          setSuccess('WhatsApp opened with resume details!');
        } else {
          setSuccess('Resume shared successfully on WhatsApp!');
        }
        console.log('✅ WhatsApp share initiated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to share');
      }
    } catch (error: any) {
      console.error('❌ Error sharing on WhatsApp:', error);
      setError('Failed to share resume on WhatsApp: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetBuilder = () => {
    setCurrentStep(1);
    setSelectedTemplate(null);
    setGeneratedResume(null);
    setGeneratedResumeId(null);
    setError(null);
    setSuccess(null);
    setResumeRequest({
      jobDescription: '',
      templateId: ''
    });
  };

  const handleCustomizeTemplate = () => {
    if (!generatedResume) return;
    
    // Go back to step 1 (template selection) but keep the JD and generated data
    setCurrentStep(1);
    setSuccess(null);
  };

  const applyNewTemplate = async (newTemplateId: string) => {
    if (!generatedResume || !generatedResumeId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to change template');
        return;
      }

      console.log('🎨 Applying new template to existing resume...');
      console.log('📋 Resume ID:', generatedResumeId);
      console.log('🎨 New Template ID:', newTemplateId);

      // Call backend to regenerate PDF with new template but same content
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-resume-builder/change-template`,
        {
          resumeId: generatedResumeId,
          newTemplateId: newTemplateId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update template ID in state
        setResumeRequest(prev => ({
          ...prev,
          templateId: newTemplateId
        }));
        setSelectedTemplate(newTemplateId);
        
        // Update resume ID if new one was generated
        if (response.data.data.resumeId) {
          setGeneratedResumeId(response.data.data.resumeId);
        }

        setCurrentStep(3);
        setSuccess('✨ Template changed successfully! Your resume content remains the same.');
        console.log('✅ Template applied successfully');
      } else {
        setError(response.data.message || 'Failed to change template');
      }
    } catch (error: any) {
      console.error('❌ Error changing template:', error);
      setError('Failed to change template: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

return (
  <StudentDashboardLayout activeTab="resume">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Previous Button - Top Left */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/resume-builder')}
          className="inline-flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600">
          🤖 AI‑Powered Resume Builder
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600/90 max-w-3xl mx-auto leading-relaxed">
          Generate professional, tailored resumes using advanced AI technology.
          Simply provide your details and job description, and let our AI craft a polished resume for you.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => setShowResumeHistory(true)}
          className="group inline-flex items-center gap-2 bg-indigo-600 text-white px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80"
        >
          <History className="w-5 h-5" />
          <span className="font-semibold">View Resume History</span>
          <span className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
        </button>

        {currentStep === 3 && (
          <button
            onClick={resetBuilder}
            className="inline-flex items-center gap-2 bg-white text-slate-800 px-5 sm:px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
          >
            <span className="text-lg">🔄</span>
            <span className="font-semibold">Create New Resume</span>
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl border border-red-200/70 bg-red-50/70 text-red-800 shadow-sm">
          <p className="font-medium">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/70 text-emerald-800 shadow-sm">
          <p className="font-medium">✅ {success}</p>
        </div>
      )}

      {/* Step 1: Template Selection */}
      {currentStep === 1 && (
        <div className="max-w-6xl mx-auto">
          {generatedResume && (
            <div className="mb-6 p-4 rounded-xl border border-purple-200 bg-purple-50 text-purple-800">
              <p className="font-medium">🎨 Customize Mode: Select a new template to regenerate your resume</p>
            </div>
          )}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {generatedResume ? 'Choose a New Template' : 'Choose Your Template'}
            </h2>
            <p className="text-slate-600">Select a professional template for your AI-generated resume</p>
          </div>

          {/* Templates Grid - 2 columns, 3 rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
            {templates.slice((currentPage - 1) * TEMPLATES_PER_PAGE, currentPage * TEMPLATES_PER_PAGE).map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  handleTemplateSelect(template.id);
                  // If we have a generated resume, apply new template directly
                  if (generatedResume && generatedResumeId) {
                    applyNewTemplate(template.id);
                  } else {
                    // Otherwise continue to job description immediately
                    setCurrentStep(2);
                    setError(null);
                  }
                }}
                className={`group cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md aspect-square flex flex-col ${
                  selectedTemplate === template.id
                    ? 'border-indigo-500 shadow-indigo-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="relative flex-1 bg-white overflow-hidden border-b border-slate-200">
                  <div className={`absolute top-3 right-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                    selectedTemplate === template.id
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'bg-white border-slate-300 group-hover:border-indigo-400'
                  }`}>
                    {selectedTemplate === template.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {/* Scaled-down preview of actual template */}
                  <div className="scale-[0.50] origin-top-left" style={{ width: '200%', height: '200%' }}>
                    <TemplatePreview
                      templateId={template.id}
                      personalInfo={sampleResumeData.personalInfo}
                      experience={sampleResumeData.experience}
                      education={sampleResumeData.education}
                      skills={sampleResumeData.skills}
                      projects={sampleResumeData.projects}
                      certifications={sampleResumeData.certifications}
                    />
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-slate-900 mb-1 text-base">{template.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{template.description}</p>
                  <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {templates.length > TEMPLATES_PER_PAGE && (
            <div className="flex justify-center items-center gap-4 mb-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-600">
                Page {currentPage} of {Math.ceil(templates.length / TEMPLATES_PER_PAGE)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(templates.length / TEMPLATES_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(templates.length / TEMPLATES_PER_PAGE)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}


        </div>
      )}

      {/* Step 2: Job Description Input */}
      {currentStep === 2 && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          {generatedResume && (
            <div className="mb-4 p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 text-sm">
              <p className="font-medium">✨ Regenerating with new template. Review your job description below.</p>
            </div>
          )}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Job Description</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Job Description / Position Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={resumeRequest.jobDescription}
                onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                placeholder="Paste the job description or describe the role you're applying for...&#10;&#10;Include:&#10;• Job title and requirements&#10;• Required skills and technologies&#10;• Responsibilities and qualifications&#10;&#10;The more detailed, the better AI can tailor your resume!"
                rows={12}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-transparent focus:ring-2 focus:ring-indigo-500/80 outline-none transition-shadow placeholder:text-slate-400 resize-vertical"
                required
              />
              <p className="text-sm text-slate-500 mt-2">
                💡 AI will analyze this description and optimize your resume accordingly
              </p>
            </div>

            <button
              onClick={generateResumeWithAI}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white py-4 px-6 rounded-2xl shadow-lg shadow-fuchsia-600/20 hover:shadow-xl hover:shadow-fuchsia-600/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/80"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="mr-3 h-6 w-6 rounded-full border-2 border-white border-b-transparent animate-spin"></span>
                  {generatedResume ? 'Regenerating Resume...' : 'Generating Your AI Resume...'}
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{generatedResume ? 'Regenerate with New Template' : 'Generate AI Resume'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Resume Preview */}
      {currentStep === 3 && generatedResume && (
        <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Your AI‑Generated Resume</h2>
              <button
                onClick={handleCustomizeTemplate}
                className="inline-flex items-center gap-2 border-2 border-purple-500 text-purple-600 px-4 py-2 rounded-xl hover:bg-purple-50 transition-all duration-200 font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Customize Template
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={downloadResumePDF}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 font-semibold"
              >
                <Download className="w-5 h-5" />
                <span>{loading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                disabled={!generatedResumeId}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 font-semibold"
              >
                <Share2 className="w-5 h-5" />
                <span>Share on WhatsApp</span>
              </button>

              <button
                onClick={resetBuilder}
                className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-5 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Create New</span>
              </button>
            </div>
          </div>

          {/* Resume Preview */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-6 bg-slate-50/70 max-h-[32rem] overflow-y-auto shadow-inner">
            {/* Personal Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {generatedResume.personalInfo.name}
              </h1>
              <div className="text-slate-600 mt-2 space-y-1">
                <p className="text-sm sm:text-base">
                  {generatedResume.personalInfo.email} | {generatedResume.personalInfo.phone}
                </p>
                {generatedResume.personalInfo.location && (
                  <p className="text-sm sm:text-base">{generatedResume.personalInfo.location}</p>
                )}
                {(generatedResume.personalInfo.linkedin || generatedResume.personalInfo.github) && (
                  <p className="text-sm sm:text-base space-x-4">
                    {generatedResume.personalInfo.linkedin && (
                      <span className="underline underline-offset-2 decoration-slate-300 hover:text-slate-900 transition-colors">
                        {generatedResume.personalInfo.linkedin}
                      </span>
                    )}
                    {generatedResume.personalInfo.github && (
                      <span className="underline underline-offset-2 decoration-slate-300 hover:text-slate-900 transition-colors">
                        {generatedResume.personalInfo.github}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Professional Summary</h2>
              <p className="text-slate-700 leading-relaxed">{generatedResume.summary}</p>
            </div>

            {/* Skills */}
            {generatedResume.skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Technical Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {generatedResume.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {generatedResume.experience.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Professional Experience</h2>
                {generatedResume.experience.map((exp, index) => (
                  <div key={index} className="mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                        <p className="text-slate-600">{exp.company}</p>
                      </div>
                      <span className="text-sm text-slate-500 mt-1 sm:mt-0">{exp.duration}</span>
                    </div>
                    <ul className="mt-2 text-slate-700 text-sm space-y-1.5 list-disc pl-5">
                      {exp.description.map((desc, i) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {generatedResume.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Education</h2>
                {generatedResume.education.map((edu, index) => (
                  <div key={index} className="mb-2">
                    <h3 className="font-medium text-slate-900">{edu.degree}</h3>
                    <p className="text-slate-600">{edu.institution} — {edu.year}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {generatedResume.projects.length > 0 && (
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Projects</h2>
                {generatedResume.projects.map((project, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-medium text-slate-900">{project.name}</h3>
                    <p className="text-slate-700 text-sm mt-1 leading-relaxed">{project.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Technologies: {project.technologies.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* Resume History Modal */}
      <ResumeHistory
        isOpen={showResumeHistory}
        onClose={() => setShowResumeHistory(false)}
      />
    </div>
  </StudentDashboardLayout>
);
};

export default AIResumeBuilder;