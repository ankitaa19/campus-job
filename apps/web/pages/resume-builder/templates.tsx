'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import StudentDashboardLayout from '../../components/StudentDashboardLayout';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { TemplatePreview } from '../../components/resume/TemplatePreview';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  style: 'modern' | 'professional' | 'creative' | 'minimal' | 'executive';
}

const templates: Template[] = [
  {
    id: 'professional-1',
    name: 'Professional',
    description: 'A clean, professional template suitable for most industries',
    thumbnail: '/templates/professional-1.png',
    style: 'professional'
  },
  {
    id: 'modern-1',
    name: 'Modern',
    description: 'A modern, stylish template with accent colors',
    thumbnail: '/templates/modern-1.png',
    style: 'modern'
  },
  {
    id: 'executive-1',
    name: 'Executive',
    description: 'A sophisticated template for senior-level positions',
    thumbnail: '/templates/executive-1.png',
    style: 'executive'
  },
  {
    id: 'technical-1',
    name: 'Technical',
    description: 'Optimized for software developers and technical roles',
    thumbnail: '/templates/technical-1.png',
    style: 'modern'
  },
  {
    id: 'creative-1',
    name: 'Creative',
    description: 'A bold template for creative professionals',
    thumbnail: '/templates/creative-1.png',
    style: 'creative'
  },
  {
    id: 'minimal-1',
    name: 'Minimal',
    description: 'Simple and elegant, focus on content',
    thumbnail: '/templates/minimal-1.png',
    style: 'minimal'
  }
];

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

// No pagination needed for 6 templates

const TemplateSelection = () => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { from } = router.query; // Check if coming from manual builder
  const currentTemplateId = router.query.current as string; // Get current template if switching

  // Since we only have 6 templates, show all on one page
  const currentTemplates = templates;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Navigate to manual builder with selected template
    setTimeout(() => {
      router.push(`/resume-builder/manual/${templateId}`);
    }, 300);
  };

  const handlePrevious = () => {
    if (from === 'manual' && currentTemplateId) {
      // If coming from manual builder, go back to that template
      router.push(`/resume-builder/manual/${currentTemplateId}`);
    } else {
      router.push('/resume-builder');
    }
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'modern': return 'from-blue-500 to-cyan-500';
      case 'professional': return 'from-gray-700 to-gray-900';
      case 'creative': return 'from-purple-500 to-pink-500';
      case 'minimal': return 'from-green-500 to-teal-500';
      case 'executive': return 'from-indigo-600 to-blue-700';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <StudentDashboardLayout activeTab="resume">
      <div className="min-h-screen bg-white">
        {/* Header with Back Button */}
        <div className="px-8 py-6">
          <button
            onClick={handlePrevious}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </button>
          
        <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Choose a, <span className="text-blue-600">Template !</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Select a template to start building your resume
        </p>
      </div>
        </div>

        {/* Info Banner if switching templates */}
        {from === 'manual' && currentTemplateId && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
            <p className="text-blue-800 text-center font-medium">
              <span className="font-bold">💡 Switching Templates:</span> Your resume content will be automatically applied to the new template you select.
            </p>
          </div>
        )}

        {/* Templates Grid - 2 columns, 3 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-6 mb-12 mx-auto">
          {currentTemplates.map((template) => {
            const isCurrentTemplate = currentTemplateId === template.id;
            return (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border flex flex-col ${
                selectedTemplate === template.id 
                  ? 'border-blue-500 shadow-blue-100' 
                  : isCurrentTemplate
                  ? 'border-green-500 shadow-green-100'
                  : 'border-gray-200 hover:border-gray-300'
              } overflow-hidden`}
            >
              {/* Template Preview */}
              <div className="relative bg-gray-50 overflow-hidden border-b border-gray-200" style={{ height: '320px' }}>
                {/* Scaled-down preview of actual template */}
                <div className="scale-[0.42] origin-top-left" style={{ width: '238%', height: '238%' }}>
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

                {/* Selected Checkmark */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
                
                {/* Current Template Badge */}
                {isCurrentTemplate && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-md shadow-sm">
                      Current
                    </span>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4 bg-white">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {template.name}
                </h3>
                <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                  {template.description}
                </p>
              
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </StudentDashboardLayout>
  );
};

export default TemplateSelection;
