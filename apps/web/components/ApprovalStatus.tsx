'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import CollegeRegistrationNavbar from './CollegeRegistrationNavbar';
import CompanyRegistrationNavbar from './CompanyRegistrationNavbar';
import Footer from './Footer';
import { API_BASE_URL } from '../utils/api';

interface UserData {
  name?: string;
  isActive: boolean;
  approvalStatus: string;
}

interface ApprovalStatusProps {
  userRole?: 'college' | 'recruiter';
  statusData?: any;
}

export default function ApprovalStatus({ userRole = 'college', statusData: propStatusData }: ApprovalStatusProps) {
  const router = useRouter();
  const [statusData, setStatusData] = useState(propStatusData || {
    approvalStatus: 'pending',
    isActive: true,
    name: userRole === 'college' ? 'College Name' : 'Company Name',
    rejectionReason: null
  });
  const [loading, setLoading] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [resubmissionNotes, setResubmissionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    size: number;
    status: 'uploading' | 'completed' | 'failed';
    progress: number;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch status when component mounts if no statusData provided
  useEffect(() => {
    if (!propStatusData) {
      fetchStatus();
    }
  }, [propStatusData]);

  const fetchStatus = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      const role = payload.role;

      // Fetch approval status based on role
      const endpoint = role === 'college' 
        ? `/api/colleges/user/${userId}`
        : `/api/recruiters/user/${userId}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatusData(data);
        
        // Redirect to dashboard if approved and active
        if (data.approvalStatus === 'approved' && data.isActive) {
          const dashboardPath = role === 'college' ? '/dashboard/college' : '/dashboard/recruiter';
          router.push(dashboardPath);
        }
      } else if (response.status === 403) {
        // Handle API response for non-approved users
        const errorData = await response.json();
        setStatusData(prevData => ({
          ...prevData,
          approvalStatus: errorData.status || 'pending',
          rejectionReason: errorData.rejectionReason || null
        }));
      } else {
        console.error('Failed to fetch status');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Add to uploadedFiles with initial status
    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload progress
    files.forEach((_, index) => {
      const startIndex = uploadedFiles.length + index;
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setUploadedFiles(prev => {
            const updated = [...prev];
            if (updated[startIndex]) {
              updated[startIndex].progress = progress;
              if (progress === 100) {
                updated[startIndex].status = 'completed';
              }
            }
            return updated;
          });
        }
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleResubmit = () => {
    setShowResubmitForm(true);
  };

  const handleResubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('notes', resubmissionNotes); // Changed from resubmissionNotes to notes
      
      // Append files with the correct field name that backend expects
      selectedFiles.forEach((file) => {
        formData.append('supportingDocuments', file);
      });

      // Get user info from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      // Use correct resubmission endpoint based on role
      const endpoint = role === 'college' 
        ? `${API_BASE_URL}/api/colleges/resubmit`
        : `${API_BASE_URL}/api/recruiters/resubmit`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setShowResubmitForm(false);
        setResubmissionNotes('');
        setSelectedFiles([]);
        setUploadedFiles([]);
        // Show success message
        console.log(`Application resubmitted successfully with ${result.uploadedDocuments || 0} documents uploaded`);
        // Refresh status after successful resubmission
        fetchStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit resubmission');
      }
    } catch (error) {
      console.error('Error submitting resubmission:', error);
      setError('An error occurred while submitting your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header - Choose appropriate navbar based on user role */}
      {userRole === 'college' ? (
        <CollegeRegistrationNavbar
          status={statusData?.approvalStatus as 'pending' | 'approved' | 'rejected' || "pending"}
          registrationStatus={statusData?.approvalStatus || "pending"}
          collegeName={statusData?.name || "College"}
        />
      ) : (
        <CompanyRegistrationNavbar
          status={statusData?.approvalStatus as 'pending' | 'approved' | 'rejected' || "pending"}
          registrationStatus={statusData?.approvalStatus || "pending"}
          companyName={statusData?.name || statusData?.companyName || "Company"}
        />
      )}

      {/* Main Content - Match college dashboard styling */}
      <main className="min-h-auto bg-[#F5F7FF]">
        <div className="container mx-auto px-4 py-8">
          
          {/* VERIFICATION IN PROGRESS */}
{statusData.approvalStatus === 'pending' && (
  <>
    {/* Header Text - Match college dashboard header styling */}
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Verification in Progress
      </h1>
      <p className="text-gray-600">
        We're reviewing your details.
      </p>
    </div>

    {/* Content Card */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 lg:p-16 flex flex-col items-center">
      {/* Illustration */}
      <img
        src="/VerificationinProgress.png"
        alt="Verification Illustration"
        className="max-w-md mb-12"
      />

      {/* Thank You Message */}
      <div className="text-center mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-blue-600 mb-6 lg:mb-8">
          Thank you for providing us the information
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-lg lg:text-xl">
            Your account is under verification.
          </p>
          <p className="text-gray-600 text-lg lg:text-xl">
            Our team will reach out shortly to confirm the information.
          </p>
        </div>
      </div>

      {/* Pending Review Button */}
      <div className="flex justify-center">
        <button 
          onClick={fetchStatus}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 text-white font-medium px-8 py-3 rounded-full flex items-center justify-center gap-2 min-w-[200px] shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Checking Status...
            </>
          ) : (
            'Check Status'
          )}
        </button>
      </div>
    </div>
  </>
)}


{/* VERIFICATION FAILED */}
{statusData.approvalStatus === 'rejected' && !showResubmitForm && (
  <>
    {/* Header */}
<div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Verification Failed !
      </h1>
      <p className="text-gray-600">
        Unfortunately your verification is failed.
      </p>
    </div>

    {/* Content Card */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 lg:p-16">
      
      {/* Illustration */}
      <div className="flex justify-center mb-12">
        <img 
          src="/VerificationFailed&Reverification.png" 
          alt="Verification Failed Illustration" 
          className="max-w-xs lg:max-w-md"
        />
      </div>

      {/* Rejection Message */}
      <div className="text-center mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-blue-600 mb-6">
          Rejected.
        </h2>
        <p className="text-gray-900 text-lg">
          Your application is rejected.
        </p>
        {statusData.rejectionReason && (
          <p className="text-gray-900 text-lg">
            Reason: {statusData.rejectionReason}
          </p>
        )}
        <p className="text-gray-600 text-base mt-4">
          Do you want to make a reverify request?
        </p>
      </div>

      {/* Reverify Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowResubmitForm(true)}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-medium px-8 py-3 rounded-full min-w-[200px] shadow-lg hover:shadow-xl"
        >
          Reverify Request
        </button>
      </div>
    </div>
  </>
)}


{/* REVERIFICATION FORM */}
{statusData.approvalStatus === 'rejected' && showResubmitForm && (
  <>
    {/* Header */}
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Reverification !
      </h1>
      <p className="text-gray-600">
        Provide required details and documents to reverify your {userRole === 'college' ? 'college' : 'company'}.
      </p>
    </div>

    {/* Content Card */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 lg:p-16">
      
      {/* Illustration */}
      <div className="flex justify-center mb-12">
        <img 
          src="/VerificationFailed&Reverification.png" 
          alt="Reverification Illustration" 
          className="max-w-xs lg:max-w-md"
        />
      </div>

      {/* Form */}
      <form onSubmit={handleResubmission} className="max-w-3xl mx-auto space-y-10">
        
        {/* Reason for Reverify */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Reason for Reverify</h3>
          <textarea
            value={resubmissionNotes}
            onChange={(e) => setResubmissionNotes(e.target.value)}
            placeholder="Please explain why your application should be reconsidered..."
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* File Upload */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Upload Supporting Document</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-gray-700 font-medium mb-2">Choose a file or drag & drop it here</p>
              <p className="text-gray-500 text-sm mb-4">JPEG, PNG, PDF formats, up to 50MB</p>
              <button 
                type="button" 
                className="bg-white border-2 border-gray-300 text-gray-600 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors"
              >
                Browse File
              </button>
            </label>
          </div>

          {/* Display selected files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <div className="flex items-center">
                      {file.status === 'uploading' && (
                        <div className="flex items-center mr-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{file.progress}%</span>
                        </div>
                      )}
                      {file.status === 'completed' && (
                        <div className="flex items-center mr-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-green-600 ml-1">Ready</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl">
            <p className="font-medium">Error occurred</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setShowResubmitForm(false);
              setResubmissionNotes('');
              setSelectedFiles([]);
              setUploadedFiles([]);
              setError(null);
            }}
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors min-w-[120px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !resubmissionNotes.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[200px] shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Submitting...
              </div>
            ) : (
              'Submit Verify Request'
            )}
          </button>
        </div>
      </form>
    </div>
  </>
)}


{/* VERIFICATION SUCCESSFUL */}
{statusData.approvalStatus === 'approved' && statusData.isActive && (
  <>
    {/* Header */}
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Verification Successful 🎉
      </h1>
      <p className="text-gray-600">
        Your details have been verified successfully.
      </p>
    </div>

    {/* Content Card */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 lg:p-16 flex flex-col items-center">
      
      {/* Success Illustration */}
      <img
        src="/VerificationSuccess.png"
        alt="Verification Successful Illustration"
        className="max-w-md mb-12"
      />

      {/* Success Message */}
      <div className="text-center mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-blue-600 mb-6 lg:mb-8">
          Approved.
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-lg lg:text-xl">
            Your application is accepted.
          </p>
          <p className="text-gray-600 text-lg lg:text-xl">
            You now have full access to all features.
          </p>
        </div>
      </div>

      {/* Go to Dashboard Button */}
      <div className="flex flex-col items-center space-y-4">
        <button 
          onClick={() => router.push(userRole === 'college' ? '/dashboard/college' : '/dashboard/recruiter')}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-medium px-8 py-3 rounded-lg flex items-center justify-center gap-2 min-w-[200px] shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span>Go to Dashboard</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Extra Links */}
        <div className="flex items-center text-blue-600 text-sm space-x-4">
          <button 
            onClick={() => window.open('mailto:support@campuspe.com?subject=Issue Report', '_blank')}
            className="underline cursor-pointer hover:text-blue-800 transition-colors"
          >
            Report an issue
          </button>
          <span className="text-gray-400">|</span>
          <button 
            onClick={() => window.open('mailto:support@campuspe.com?subject=Update Details Request', '_blank')}
            className="underline cursor-pointer hover:text-blue-800 transition-colors"
          >
            Need to update details?
          </button>
        </div>
      </div>
    </div>
  </>
)}

          {/* Account Deactivated State */}
          {!statusData.isActive && statusData.approvalStatus === 'approved' && (
            <div className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-800 mb-2">Account Deactivated</h3>
                <p className="text-gray-700 text-sm mb-4">
                  Your account has been temporarily deactivated by our admin team. 
                  Please contact support for assistance or to request reactivation.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <a 
                    href="mailto:contactus@campuspe.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Contact Support
                  </a>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">contactus@campuspe.com</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
