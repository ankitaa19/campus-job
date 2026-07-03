'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import StudentDashboardLayout from '../../../components/StudentDashboardLayout';
import { TemplatePreview } from '../../../components/resume/TemplatePreview';
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  FolderGit2, 
  Link as LinkIcon,
  Save,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { API_BASE_URL } from '../../../utils/api';

interface SocialLink {
  placeholder: string; // Display name (e.g., 'LinkedIn', 'GitHub', 'Portfolio')
  url: string; // Actual URL
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  title?: string;
  summary?: string;
  profileImage?: string; // URL or base64 of profile image
  socialLinks?: SocialLink[]; // Array of social links with custom placeholders
  // Keep old fields for backward compatibility during transition
  linkedin?: string;
  github?: string;
  portfolio?: string;
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
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'technical' | 'soft' | 'language';
}

interface Project {
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
}

interface Certification {
  name: string;
  organization?: string;
  year?: number;
  credentialId?: string;
}

interface JobPreferences {
  jobTypes: string[];
  preferredLocations: string[];
  workMode: 'remote' | 'onsite' | 'hybrid' | 'any';
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
}

type SectionKey = 'personal' | 'summary' | 'preferences' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'social';

const ManualResumeBuilder = () => {
  const router = useRouter();
  const { templateId } = router.query;
  
  // Check if current template supports profile image (all except minimal-1)
  const templateSupportsProfileImage = (id: string | string[] | undefined) => {
    if (!id || typeof id !== 'string') return true;
    return id !== 'minimal-1';
  };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastResumeId, setLastResumeId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<SectionKey>('personal');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  // Form data
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    location: '',
    title: '',
    summary: '',
    profileImage: '',
    socialLinks: [] // Initialize empty social links array
  });
  
  const [jobPreferences, setJobPreferences] = useState<JobPreferences>({
    jobTypes: [],
    preferredLocations: [],
    workMode: 'any',
    expectedSalary: {
      min: 0,
      max: 0,
      currency: 'INR'
    }
  });
  
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    if (router.isReady) {
      fetchResumeData();
    }
  }, [router.isReady]);

  const fetchResumeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch student profile data directly from the database
      const response = await axios.get(`${API_BASE_URL}/api/students/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const studentData = response.data.data || response.data;
      
      if (studentData) {
        // Build socialLinks array ONLY from student data that exists
        const socialLinksArray: SocialLink[] = [];
        if (studentData.linkedinUrl && studentData.linkedinUrl.trim()) {
          socialLinksArray.push({ placeholder: 'LinkedIn', url: studentData.linkedinUrl });
        }
        if (studentData.githubUrl && studentData.githubUrl.trim()) {
          socialLinksArray.push({ placeholder: 'GitHub', url: studentData.githubUrl });
        }
        if (studentData.portfolioUrl && studentData.portfolioUrl.trim()) {
          socialLinksArray.push({ placeholder: 'Portfolio', url: studentData.portfolioUrl });
        }
        
        // Set personal info from student profile
        setPersonalInfo({
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          email: studentData.email || '',
          phone: studentData.phoneNumber || '',
          location: studentData.location || 'India',
          title: studentData.title || (studentData.experience?.[0]?.title) || 'Software Developer',
          summary: studentData.summary || studentData.bio || '',
          profileImage: studentData.profileImage || '',
          socialLinks: socialLinksArray,
          // Keep legacy fields for backward compatibility
          linkedin: studentData.linkedinUrl || '',
          github: studentData.githubUrl || '',
          portfolio: studentData.portfolioUrl || ''
        });

        // Set job preferences if available
        if (studentData.jobPreferences) {
          setJobPreferences({
            jobTypes: studentData.jobPreferences.jobTypes || [],
            preferredLocations: studentData.jobPreferences.preferredLocations || [],
            workMode: studentData.jobPreferences.workMode || 'any',
            expectedSalary: studentData.jobPreferences.expectedSalary || {
              min: 0,
              max: 0,
              currency: 'INR'
            }
          });
        }
        
        // Transform and set education data
        setEducation((studentData.education || []).map((edu: any) => ({
          degree: edu.degree || '',
          field: edu.field || '',
          institution: edu.institution || '',
          startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : '',
          endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : '',
          gpa: edu.gpa || undefined,
          isCompleted: edu.isCompleted !== undefined ? edu.isCompleted : true
        })));

        // Transform and set experience data
        setExperience((studentData.experience || []).map((exp: any) => ({
          title: exp.title || '',
          company: exp.company || '',
          location: exp.location || '',
          startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
          endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
          description: exp.description || '',
          isCurrentJob: exp.isCurrentJob || false
        })));

        // Transform and set skills data
        setSkills((studentData.skills || []).map((skill: any) => {
          if (typeof skill === 'string') {
            return {
              name: skill,
              level: 'intermediate' as const,
              category: 'technical' as const
            };
          }
          return {
            name: skill.name || '',
            level: skill.level || 'intermediate',
            category: skill.category || 'technical'
          };
        }));

        // Set projects from resumeAnalysis or direct projects field
        const projectsData = studentData.resumeAnalysis?.extractedDetails?.projects 
          || studentData.projects 
          || [];
        setProjects(projectsData.map((proj: any) => ({
          name: proj.name || proj.title || '',
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.link || proj.url || ''
        })));

        // Set certifications from resumeAnalysis or direct field
        const certificationsData = studentData.resumeAnalysis?.extractedDetails?.certifications 
          || studentData.certifications 
          || [];
        setCertifications(certificationsData.map((cert: any) => ({
          name: cert.name || cert.title || '',
          organization: cert.organization || cert.issuer || '',
          year: cert.year || (cert.date ? new Date(cert.date).getFullYear() : undefined),
          credentialId: cert.credentialId || cert.id || ''
        })));
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      alert('Failed to load your profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (section: SectionKey) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateData: any = {};

      // Map resume builder data to student profile format
      switch (section) {
        case 'personal':
        case 'social':
          updateData.firstName = personalInfo.firstName;
          updateData.lastName = personalInfo.lastName;
          updateData.email = personalInfo.email;
          updateData.phoneNumber = personalInfo.phone;
          updateData.linkedinUrl = personalInfo.linkedin;
          updateData.githubUrl = personalInfo.github;
          updateData.portfolioUrl = personalInfo.portfolio;
          updateData.location = personalInfo.location;
          updateData.title = personalInfo.title;
          updateData.summary = personalInfo.summary;
          break;
        case 'preferences':
          updateData.jobPreferences = jobPreferences;
          break;
        case 'education':
          // Transform dates to proper format for backend
          updateData.education = education.map(edu => ({
            degree: edu.degree,
            field: edu.field,
            institution: edu.institution,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
            gpa: edu.gpa,
            isCompleted: edu.isCompleted
          }));
          break;
        case 'experience':
          // Transform dates to proper format for backend
          updateData.experience = experience.map(exp => ({
            title: exp.title,
            company: exp.company,
            location: exp.location,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            description: exp.description,
            isCurrentJob: exp.isCurrentJob
          }));
          break;
        case 'skills':
          updateData.skills = skills;
          break;
        case 'projects':
          updateData.projects = projects;
          break;
        case 'certifications':
          updateData.certifications = certifications;
          break;
      }

      // Update student profile directly
      await axios.put(`${API_BASE_URL}/api/students/profile`, updateData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Section saved successfully to your profile!');
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section. Please check your input and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setGeneratingPreview(true);
    try {
      const token = localStorage.getItem('token');
      
      // Generate job title from personal info
      const jobTitle = `${personalInfo.firstName} ${personalInfo.lastName} - Resume`.trim();
      
      const response = await axios.post(
        `${API_BASE_URL}/api/resume-builder/generate`,
        { 
          templateId,
          jobTitle: jobTitle || 'My Resume'
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create a blob URL for preview
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreviewModal(true);
      
      // Extract resume ID from response headers
      const resumeId = response.headers['x-resume-id'];
      if (resumeId) {
        setLastResumeId(resumeId);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview. Please try again.');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Generate job title from personal info
      const jobTitle = `${personalInfo.firstName} ${personalInfo.lastName} - Resume`.trim();
      
      const response = await axios.post(
        `${API_BASE_URL}/api/resume-builder/generate`,
        { 
          templateId,
          jobTitle: jobTitle || 'My Resume'
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Extract resume ID from response headers
      const resumeId = response.headers['x-resume-id'];
      if (resumeId) {
        setLastResumeId(resumeId);
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${jobTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Show success message
      alert('Resume downloaded and saved to history successfully!');
      
      // Optionally refresh to show in recent resumes
      setTimeout(() => {
        router.push('/resume-builder');
      }, 1500);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Failed to download resume');
    }
  };

  const handleWhatsAppShare = async () => {
    if (!lastResumeId) {
      alert('Please download the resume first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-resume-builder/share-whatsapp`,
        { resumeId: lastResumeId },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data.shareUrl) {
        window.open(response.data.data.shareUrl, '_blank');
        alert('Resume shared successfully on WhatsApp!');
      } else {
        throw new Error('Failed to generate WhatsApp share link');
      }
    } catch (error) {
      console.error('Error sharing on WhatsApp:', error);
      alert('Failed to share resume on WhatsApp');
    }
  };

  const toggleSection = (section: SectionKey) => {
    setExpandedSection(expandedSection === section ? 'personal' : section);
  };

  const addEducation = () => {
    setEducation([...education, {
      degree: '',
      field: '',
      institution: '',
      startDate: '',
      endDate: '',
      gpa: undefined,
      isCompleted: false
    }]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const addExperience = () => {
    setExperience([...experience, {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrentJob: false
    }]);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const addSkill = () => {
    setSkills([...skills, {
      name: '',
      level: 'intermediate',
      category: 'technical'
    }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const addProject = () => {
    setProjects([...projects, {
      name: '',
      description: '',
      technologies: [],
      link: ''
    }]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      name: '',
      organization: '',
      year: new Date().getFullYear(),
      credentialId: ''
    }]);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <StudentDashboardLayout activeTab="resume">
      <div className="flex-grow">
        {/* PDF Preview Modal */}
        {showPreviewModal && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  Resume Preview
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setShowPreviewModal(false);
                      if (previewUrl) {
                        window.URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto bg-gray-100 p-4">
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[600px] bg-white rounded-lg shadow-md"
                  title="Resume Preview"
                />
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  💡 Tip: Use the download button to save this resume to your device
                </p>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    if (previewUrl) {
                      window.URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/resume-builder/templates')}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Templates
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Sidebar - Sections */}
            <div className="lg:col-span-2 space-y-4">
              {/* Personal Information Section */}
<SectionCard
  title="Personal Information"
  icon={<User className="w-5 h-5" />}
  isExpanded={expandedSection === "personal"}
  onToggle={() => toggleSection("personal")}
  onSave={() => handleSaveSection("personal")}
  saving={saving}
>
  <div className="space-y-6">
    {/* Profile photo block – like design */}
    {templateSupportsProfileImage(templateId) && (
      <div className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          {personalInfo.profileImage ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gray-300 bg-gray-100">
              <img
                src={personalInfo.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            onClick={() =>
              document.getElementById("profile-image-input")?.click()
            }
          >
            Upload Photo
          </button>

          <input
            id="profile-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPersonalInfo({
                    ...personalInfo,
                    profileImage: reader.result as string,
                  });
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <p className="text-[11px] text-gray-500 leading-snug">
            Recommended: Square image, max 5MB
            <br />
            Formats: JPG, PNG
          </p>
        </div>
      </div>
    )}

    {/* Name / Title */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Full Name*"
        value={`${personalInfo.firstName} ${personalInfo.lastName}`.trim()}
        onChange={(e) => {
          // simple split – keeps your first/last name structure
          const value = e.target.value;
          const parts = value.split(" ");
          const firstName = parts[0] || "";
          const lastName = parts.slice(1).join(" ");
          setPersonalInfo({ ...personalInfo, firstName, lastName });
        }}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />

      <input
        type="text"
        placeholder="Title* (e.g., Software Developer)"
        value={personalInfo.title}
        onChange={(e) =>
          setPersonalInfo({ ...personalInfo, title: e.target.value })
        }
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>

    {/* Email / Phone */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="email"
        placeholder="Email"
        value={personalInfo.email}
        onChange={(e) =>
          setPersonalInfo({ ...personalInfo, email: e.target.value })
        }
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />

      <input
        type="tel"
        placeholder="Phone Number"
        value={personalInfo.phone}
        onChange={(e) =>
          setPersonalInfo({ ...personalInfo, phone: e.target.value })
        }
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  </div>
</SectionCard>

{/* Professional Summary Section */}
<SectionCard
  title="Professional Summary"
  icon={<FileText className="w-5 h-5" />}
  isExpanded={expandedSection === "summary"}
  onToggle={() => toggleSection("summary" as SectionKey)}
  onSave={() => handleSaveSection("summary")}
  saving={saving}
>
  <div className="space-y-3">
    <textarea
      placeholder="Write a brief professional summary..."
      value={personalInfo.summary}
      onChange={(e) =>
        setPersonalInfo({ ...personalInfo, summary: e.target.value })
      }
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      rows={6}
    />
    <p className="text-xs text-gray-500">
      💡 Tip: Aim for 3–4 sentences summarising your experience, core skills
      and what roles you’re targeting.
    </p>
  </div>
</SectionCard>

              {/* Social Links Section */}
              <SectionCard
                title="Social Links"
                icon={<LinkIcon className="w-5 h-5" />}
                isExpanded={expandedSection === 'social'}
                onToggle={() => toggleSection('social')}
                onSave={() => handleSaveSection('social')}
                saving={saving}
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Add your professional social links with custom labels. The label will be displayed as a clickable link on your resume.
                  </p>
                  
                  {/* Display existing social links */}
                  {personalInfo.socialLinks && personalInfo.socialLinks.map((link, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Link {index + 1}</h4>
                        <button
                          onClick={() => {
                            const newLinks = personalInfo.socialLinks?.filter((_, i) => i !== index) || [];
                            setPersonalInfo({ ...personalInfo, socialLinks: newLinks });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Label (e.g., LinkedIn, GitHub, Portfolio, Twitter)"
                        value={link.placeholder}
                        onChange={(e) => {
                          const newLinks = [...(personalInfo.socialLinks || [])];
                          newLinks[index] = { ...newLinks[index], placeholder: e.target.value };
                          setPersonalInfo({ ...personalInfo, socialLinks: newLinks });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="url"
                        placeholder="URL (e.g., https://linkedin.com/in/yourname)"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...(personalInfo.socialLinks || [])];
                          newLinks[index] = { ...newLinks[index], url: e.target.value };
                          setPersonalInfo({ ...personalInfo, socialLinks: newLinks });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
                  
                  {/* Add new social link button */}
                  <button
                    onClick={() => {
                      const newLinks = [...(personalInfo.socialLinks || []), { placeholder: '', url: '' }];
                      setPersonalInfo({ ...personalInfo, socialLinks: newLinks });
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Social Link
                  </button>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Pro Tip:</strong> Use recognizable labels like "LinkedIn", "GitHub", "Portfolio" for automatic icon detection on your resume!
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Work Experience Section */}
              <SectionCard
                title="Work Experience"
                icon={<Briefcase className="w-5 h-5" />}
                isExpanded={expandedSection === 'experience'}
                onToggle={() => toggleSection('experience')}
                onSave={() => handleSaveSection('experience')}
                saving={saving}
              >
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Experience {index + 1}</h4>
                        <button
                          onClick={() => removeExperience(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={exp.location}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="month"
                          placeholder="Start Date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="month"
                          placeholder="End Date"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          disabled={exp.isCurrentJob}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                        />
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={exp.isCurrentJob}
                          onChange={(e) => updateExperience(index, 'isCurrentJob', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Currently working here</span>
                      </label>
                      <textarea
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        rows={3}
                      />
                    </div>
                  ))}
                  <button
                    onClick={addExperience}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </button>
                </div>
              </SectionCard>

              {/* Education Section */}
              <SectionCard
                title="Education"
                icon={<GraduationCap className="w-5 h-5" />}
                isExpanded={expandedSection === 'education'}
                onToggle={() => toggleSection('education')}
                onSave={() => handleSaveSection('education')}
                saving={saving}
              >
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Education {index + 1}</h4>
                        <button
                          onClick={() => removeEducation(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="month"
                          placeholder="Start Date"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="month"
                          placeholder="End Date"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="GPA (Optional)"
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(index, 'gpa', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={edu.isCompleted}
                          onChange={(e) => updateEducation(index, 'isCompleted', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Completed</span>
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={addEducation}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </button>
                </div>
              </SectionCard>

              {/* Skills Section */}
              <SectionCard
                title="Skills"
                icon={<Code className="w-5 h-5" />}
                isExpanded={expandedSection === 'skills'}
                onToggle={() => toggleSection('skills')}
                onSave={() => handleSaveSection('skills')}
                saving={saving}
              >
                <div className="space-y-4">
                  {skills.map((skill, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Skill {index + 1}</h4>
                        <button
                          onClick={() => removeSkill(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Skill Name"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={skill.level}
                          onChange={(e) => updateSkill(index, 'level', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                        <select
                          value={skill.category}
                          onChange={(e) => updateSkill(index, 'category', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="technical">Technical</option>
                          <option value="soft">Soft Skill</option>
                          <option value="language">Language</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addSkill}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skill
                  </button>
                </div>
              </SectionCard>

              {/* Projects Section */}
              <SectionCard
                title="Projects"
                icon={<FolderGit2 className="w-5 h-5" />}
                isExpanded={expandedSection === 'projects'}
                onToggle={() => toggleSection('projects')}
                onSave={() => handleSaveSection('projects')}
                saving={saving}
              >
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Project {index + 1}</h4>
                        <button
                          onClick={() => removeProject(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={project.name}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <textarea
                        placeholder="Description"
                        value={project.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        rows={2}
                      />
                      <input
                        type="url"
                        placeholder="Project Link (Optional)"
                        value={project.link}
                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addProject}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </button>
                </div>
              </SectionCard>

              {/* Certifications Section */}
              <SectionCard
                title="Certifications"
                icon={<Award className="w-5 h-5" />}
                isExpanded={expandedSection === 'certifications'}
                onToggle={() => toggleSection('certifications')}
                onSave={() => handleSaveSection('certifications')}
                saving={saving}
              >
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Certification {index + 1}</h4>
                        <button
                          onClick={() => removeCertification(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Certification Name"
                        value={cert.name}
                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Issuing Organization"
                        value={cert.organization}
                        onChange={(e) => updateCertification(index, 'organization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Year"
                          value={cert.year || ''}
                          onChange={(e) => updateCertification(index, 'year', parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Credential ID"
                          value={cert.credentialId}
                          onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addCertification}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </button>
                </div>
              </SectionCard>
            </div>

            {/* Right Side - Live Preview */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 text-center flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 mr-2 text-blue-600" />
                    Live Preview
                  </h2>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handlePreview}
                      disabled={generatingPreview}
                      className="flex items-center px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {generatingPreview ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Save Resume
                    </button>
                  </div>
                </div>
                
                {/* Template Preview */}
                <div className="bg-gray-50 overflow-auto max-h-[900px]">
                  <TemplatePreview
                    templateId={templateId as string}
                    personalInfo={personalInfo}
                    experience={experience}
                    education={education}
                    skills={skills}
                    projects={projects}
                    certifications={certifications}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentDashboardLayout>
  );
};

// Section Card Component
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  onSave,
  saving,
  children
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">{icon}</div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {children}
          
          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualResumeBuilder;
