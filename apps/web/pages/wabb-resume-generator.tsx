import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface WABBRequest {
  email: string;
  phone: string;
  name: string;
  jobDescription: string;
}

interface ResumeData {
  personalInfo: any;
  summary: string;
  skills: any[];
  experience: any[];
  education: any[];
  projects: any[];
}

export default function WABBResumeGenerator() {
  const router = useRouter();
  const [requestData, setRequestData] = useState<WABBRequest | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);

  // Parse URL parameters on page load
  useEffect(() => {
    const { email, phone, name, jobDescription } = router.query;
    
    if (email && phone && jobDescription) {
      const request: WABBRequest = {
        email: email as string,
        phone: phone as string,
        name: name as string || '',
        jobDescription: jobDescription as string
      };
      
      setRequestData(request);
      generateResume(request);
    }
  }, [router.query]);

  const generateResume = async (request: WABBRequest) => {
    setIsGenerating(true);
    
    try {
      console.log('🎯 Starting AI resume generation for WABB request...');
      
      // Send initial WhatsApp notification
      await axios.post('/api/wabb/send-initial-notification', {
        phone: request.phone,
        name: request.name
      });

      // Use the existing AI resume generation endpoint (same as the working one)
      const response = await axios.post('/api/ai-resume/debug-no-auth', {
        email: request.email,
        jobDescription: request.jobDescription
      });

      if (response.data.success) {
        setResumeData(response.data.data);
        setIsPreviewReady(true);
        
        // Automatically save and send after preview is ready
        setTimeout(() => {
          saveAndSendResume(response.data.data, request);
        }, 2000); // 2 second delay to show preview
        
      } else {
        throw new Error(response.data.message || 'Failed to generate resume');
      }
      
    } catch (error: any) {
      console.error('❌ Resume generation failed:', error);
      alert('Failed to generate resume: ' + (error.response?.data?.message || error.message));
      
      // Send error notification to WhatsApp
      try {
        await axios.post('/api/wabb/send-error-notification', {
          phone: request.phone,
          error: error.message
        });
      } catch (notificationError) {
        console.error('Failed to send error notification:', notificationError);
      }
      
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAndSendResume = async (resumeData: ResumeData, request: WABBRequest) => {
    setIsSending(true);
    
    try {
      console.log('💾 Saving resume and sending via WhatsApp...');
      
      // Transform resume data to match the database schema
      const transformedResumeData = {
        ...resumeData,
        education: resumeData.education?.map((edu: any) => ({
          ...edu,
          field: edu.field || 'Computer Science', // Add required field
          startDate: edu.startDate || new Date(edu.year || '2020-01-01'), // Add required startDate
          endDate: edu.endDate || new Date(edu.year || '2025-12-31'),
          isCompleted: edu.isCompleted || false
        })) || [],
        experience: resumeData.experience?.map((exp: any) => ({
          ...exp,
          company: exp.company || 'Unknown Company',
          startDate: new Date(exp.duration?.split(' - ')[0] || '2024-01-01'),
          endDate: exp.duration?.includes('Present') ? null : new Date(exp.duration?.split(' - ')[1] || '2025-01-01'),
          isCurrentJob: exp.duration?.includes('Present') || false
        })) || []
      };
      
      // Save the resume using the same endpoint as the working AI resume builder
      const saveResponse = await axios.post('/api/ai-resume/save-resume', {
        resumeData: transformedResumeData,
        jobDescription: request.jobDescription,
        email: request.email
      });

      if (saveResponse.data.success) {
        const resumeId = saveResponse.data.resumeId;
        setGeneratedResumeId(resumeId);
        
        // Send resume via WhatsApp using the existing working endpoint
        const whatsappResponse = await axios.post('/api/ai-resume/send-to-whatsapp', {
          resumeId,
          phoneNumber: request.phone.replace(/\D/g, ''), // Clean phone number
          jobTitle: extractJobTitle(request.jobDescription)
        });

        if (whatsappResponse.data.success) {
          console.log('✅ Resume sent successfully via WhatsApp');
          
          // Send final success notification via WABB webhook
          await axios.post('/api/wabb/send-success-webhook', {
            resumeId,
            phone: request.phone
          });
          
          alert('Resume generated and sent successfully!');
          
        } else {
          throw new Error('Failed to send resume via WhatsApp');
        }
        
      } else {
        throw new Error('Failed to save resume');
      }
      
    } catch (error: any) {
      console.error('❌ Save and send failed:', error);
      alert('Failed to send resume: ' + (error.response?.data?.message || error.message));
      
      // Send error via WABB webhook
      await axios.post('/api/wabb/send-error-webhook', {
        phone: request.phone,
        error: error.message
      });
      
    } finally {
      setIsSending(false);
    }
  };

  const extractJobTitle = (jobDescription: string): string => {
    // Simple job title extraction
    const lines = jobDescription.split('\n');
    const firstLine = lines[0]?.toLowerCase() || '';
    
    if (firstLine.includes('software engineer')) return 'Software Engineer';
    if (firstLine.includes('developer')) return 'Developer';
    if (firstLine.includes('analyst')) return 'Analyst';
    if (firstLine.includes('manager')) return 'Manager';
    
    return 'AI Generated Resume';
  };

  const ResumePreview = ({ resumeData }: { resumeData: ResumeData }) => (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {resumeData.personalInfo?.name || 'Resume Preview'}
        </h1>
        <div className="text-gray-600 mt-2">
          <p>{resumeData.personalInfo?.email}</p>
          <p>{resumeData.personalInfo?.phone}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Professional Summary</h2>
        <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
      </div>

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.slice(0, 10).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Experience</h2>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="mb-4 p-4 border-l-4 border-blue-200">
              <h3 className="font-semibold text-gray-800">{exp.title}</h3>
              <p className="text-gray-600">{exp.company} • {exp.duration}</p>
              {exp.description && (
                <div className="mt-2 text-gray-700">
                  {Array.isArray(exp.description) ? (
                    <ul className="list-disc list-inside">
                      {exp.description.map((desc, i) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{exp.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Education</h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
              <h3 className="font-semibold text-gray-800">{edu.degree}</h3>
              <p className="text-gray-600">{edu.institution} • {edu.year}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {resumeData.projects && resumeData.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Projects</h2>
          {resumeData.projects.map((project, index) => (
            <div key={index} className="mb-4 p-4 border-l-4 border-green-200">
              <h3 className="font-semibold text-gray-800">{project.name}</h3>
              <p className="text-gray-700 mt-1">{project.description}</p>
              {project.technologies && project.technologies.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Technologies: </span>
                  <span className="text-sm text-gray-800">
                    {project.technologies.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 AI Resume Generator
          </h1>
          <p className="text-gray-600">
            Generating personalized resume via WhatsApp
          </p>
        </div>

        {/* Status Cards */}
        <div className="flex justify-center space-x-4 mb-8">
          <div className={`p-4 rounded-lg ${requestData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="flex items-center">
              <span className="mr-2">📝</span>
              <span>Request Received</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isGenerating ? 'bg-blue-100 text-blue-800' : resumeData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="flex items-center">
              <span className="mr-2">🤖</span>
              <span>AI Generation</span>
              {isGenerating && <span className="ml-2 animate-spin">⏳</span>}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isPreviewReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="flex items-center">
              <span className="mr-2">👁️</span>
              <span>Preview Ready</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isSending ? 'bg-blue-100 text-blue-800' : generatedResumeId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="flex items-center">
              <span className="mr-2">📱</span>
              <span>WhatsApp Sent</span>
              {isSending && <span className="ml-2 animate-spin">⏳</span>}
            </div>
          </div>
        </div>

        {/* Request Info */}
        {requestData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Request Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{requestData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{requestData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900">{requestData.phone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Job Description</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{requestData.jobDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Generating Your AI Resume...
            </h2>
            <p className="text-gray-600">
              Our AI is analyzing the job description and crafting your perfect resume
            </p>
            <div className="mt-4">
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Resume Preview */}
        {resumeData && isPreviewReady && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                ✨ Resume Preview
              </h2>
              <p className="text-gray-600">
                {isSending ? 'Saving and sending to WhatsApp...' : 'Resume generated successfully!'}
              </p>
            </div>
            <ResumePreview resumeData={resumeData} />
          </div>
        )}

        {/* Success State */}
        {generatedResumeId && (
          <div className="text-center py-12 bg-green-50 rounded-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              Resume Sent Successfully!
            </h2>
            <p className="text-green-600 mb-4">
              Your personalized resume has been generated and sent to WhatsApp
            </p>
            <p className="text-sm text-gray-600">
              Resume ID: {generatedResumeId}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Powered by CampusPe AI Resume Builder</p>
        </div>
      </div>
    </div>
  );
}
