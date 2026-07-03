'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import StudentDashboardLayout from '../../components/StudentDashboardLayout';
import { FileText, Sparkles, Download, Calendar, Eye } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface Resume {
  _id: string;
  resumeId: string;
  jobTitle?: string;
  fileName: string;
  cloudUrl?: string;
  generationType: 'ai' | 'manual' | 'template';
  downloadCount: number;
  createdAt: string;
}

const ResumeBuilderLanding = () => {
  const router = useRouter();
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentResumes();
  }, []);

  const fetchRecentResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/resume-builder/history?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecentResumes(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching resume history:', err);
      // Don't show error for history fetch failure, just show empty state
      setRecentResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resumeId: string, fileName: string, cloudUrl?: string) => {
    try {
      if (cloudUrl) {
        // Direct download from CDN
        window.open(cloudUrl, '_blank');
      } else {
        // Fallback to API download
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/api/resume-builder/download/${resumeId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob'
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'resume.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download resume');
    }
  };

  const handlePreview = async (resumeId: string, cloudUrl?: string) => {
    try {
      if (cloudUrl) {
        window.open(cloudUrl, '_blank');
      } else {
        window.open(`${API_BASE_URL}/api/resume-builder/preview/${resumeId}`, '_blank');
      }
    } catch (err) {
      console.error('Preview error:', err);
      alert('Failed to preview resume');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getResumeTypeLabel = (type: string) => {
    switch (type) {
      case 'ai': return 'AI Generated';
      case 'manual': return 'Manual';
      case 'template': return 'Template';
      default: return type;
    }
  };

  return (
    <StudentDashboardLayout activeTab="resume">
      <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Build Your, <span className="text-[#0270DF]">Resume</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Template: Professional, Modern, Creative & More
        </p>
      </div>

        {/* Resume Builder Options */}
        <div className="px-8 py-10 mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Manual Resume Builder Card */}
            <div
              onClick={() => router.push('/resume-builder/templates')}
              className="group cursor-pointer bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  Resume Builder <span className="text-blue-600">(Manually)</span>
                </h2>
                <p className="text-center text-gray-600 mb-6 text-sm">
                  Build your resume manually
                </p>
              </div>
            </div>

            {/* AI Resume Builder Card */}
            <div
              onClick={() => router.push('/ai-resume-builder')}
              className="group cursor-pointer bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  Resume Builder <span className="text-blue-600">(AI & JD)</span>
                </h2>
                <p className="text-center text-gray-600 mb-6 text-sm">
                  Build your resume using AI and according to your job description
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Resumes Section */}
        <div className="px-8 py-10 mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Resumes</h2>
          <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-6 text-lg">Loading your resumes...</p>
              </div>
            ) : recentResumes.length === 0 ? (
              <div className="text-center py-20">
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No resume available
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Start building your first professional resume
                </p>
                <button
                  onClick={() => router.push('/resume-builder/templates')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-base"
                >
                  Create Resume
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-5 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 truncate text-lg">
                          {resume.jobTitle || resume.fileName}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            {formatDate(resume.createdAt)}
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                            {getResumeTypeLabel(resume.generationType)}
                          </span>
                          <div className="flex items-center text-sm text-gray-500">
                            <Download className="w-4 h-4 mr-1.5" />
                            {resume.downloadCount} downloads
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => handlePreview(resume.resumeId, resume.cloudUrl)}
                        className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border-2 border-transparent hover:border-blue-200"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(resume.resumeId, resume.fileName, resume.cloudUrl)}
                        className="p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border-2 border-transparent hover:border-green-200"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentDashboardLayout>
  );
};

export default ResumeBuilderLanding;
