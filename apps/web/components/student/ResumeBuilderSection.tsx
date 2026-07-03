import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FileText, Download, Sparkles, Calendar, Eye, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

interface ResumeBuilderSectionProps {
  studentInfo: any;
  refreshData: () => void;
}

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

const ResumeBuilderSection: React.FC<ResumeBuilderSectionProps> = ({ studentInfo, refreshData }) => {
  const router = useRouter();
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentResumes();
  }, []);

  const fetchRecentResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/resume-builder/history?limit=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecentResumes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching resume history:', err);
      setRecentResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resumeId: string, fileName: string, cloudUrl?: string) => {
    try {
      if (cloudUrl) {
        window.open(cloudUrl, '_blank');
      } else {
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
    <div>
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Resume Builder</h1>
        <p className="text-gray-600 text-sm mt-1">Build and manage your professional resume</p>
      </div>

      <div className="px-8 py-8">

        {/* Resume Builder Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Manual Resume Builder Card */}
          <div
            onClick={() => router.push('/resume-builder/templates')}
            className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 mb-4 mx-auto group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Resume Builder
              </h2>
              <p className="text-lg font-semibold text-blue-600 mb-3 text-center">
                (Manually)
              </p>
              
              <ul className="space-y-2 mb-5 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  <span className="text-gray-600">Choose from 10 professional templates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  <span className="text-gray-600">Real-time preview as you edit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  <span className="text-gray-600">Section-by-section customization</span>
                </li>
              </ul>

              <div className="flex items-center justify-center">
                <button className="flex items-center px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all text-sm">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Resume Builder Card */}
          <div
            onClick={() => router.push('/ai-resume-builder')}
            className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Resume Builder
              </h2>
              <p className="text-lg font-semibold text-purple-600 mb-3 text-center">
                (AI & JD)
              </p>
              
              <ul className="space-y-2 mb-5 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-0.5">•</span>
                  <span className="text-gray-600">AI-powered content optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-0.5">•</span>
                  <span className="text-gray-600">Job description analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-0.5">•</span>
                  <span className="text-gray-600">Keyword matching & ATS optimization</span>
                </li>
              </ul>

              <div className="flex items-center justify-center">
                <button className="flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-sm">
                  Build with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Resumes */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Resumes</h2>
            <button
              onClick={() => router.push('/resume-builder')}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-3 text-sm">Loading your resumes...</p>
            </div>
          ) : recentResumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Resume Available
              </h3>
              <p className="text-gray-600 mb-5 text-sm">
                Start building your first professional resume
              </p>
              <button
                onClick={() => router.push('/resume-builder/templates')}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
              >
                Create Resume
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResumes.map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate text-sm">
                        {resume.jobTitle || resume.fileName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(resume.createdAt)}
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {getResumeTypeLabel(resume.generationType)}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Download className="w-3 h-3 mr-1" />
                          {resume.downloadCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => handlePreview(resume.resumeId, resume.cloudUrl)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(resume.resumeId, resume.fileName, resume.cloudUrl)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderSection;
