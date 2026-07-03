'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

interface College {
  _id: string;
  name: string;
  domainCode: string;
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [sessionId, setSessionId] = useState(''); // Add sessionId for SMS OTP
  const [otpMethod, setOtpMethod] = useState('whatsapp'); // WhatsApp or SMS
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // Timer for OTP resend
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeAnalysisId, setResumeAnalysisId] = useState('');

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    whatsappNumber: '',
    dateOfBirth: '',
    gender: '',
    
    // College Info
    collegeId: '',
    studentId: '',
    enrollmentYear: new Date().getFullYear(),
    graduationYear: '',
    currentSemester: '',
    
    // Additional Info
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    
    // OTP
    otp: ''
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  // Handle pre-filled verified data from registration modal
  useEffect(() => {
    if (router.isReady && (router.query.verified_phone || router.query.verified_firstName)) {
      setFormData(prev => ({
        ...prev,
        ...(router.query.verified_phone && { 
          phoneNumber: decodeURIComponent(router.query.verified_phone as string),
          whatsappNumber: decodeURIComponent(router.query.verified_phone as string)
        }),
        ...(router.query.verified_firstName && { 
          firstName: decodeURIComponent(router.query.verified_firstName as string)
        }),
        ...(router.query.verified_lastName && { 
          lastName: decodeURIComponent(router.query.verified_lastName as string)
        })
      }));
      // Move to step 2 if coming from verification
      if (router.query.step === '2') {
        setStep(2);
      }
    }
  }, [router.isReady, router.query.verified_phone, router.query.verified_firstName, router.query.verified_lastName, router.query.step]);

  // OTP timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

const fetchColleges = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.COLLEGES}`);

    // Ensure colleges is an array
    const collegeList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data.colleges)
        ? response.data.colleges
        : [];

    setColleges(collegeList);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    setColleges([]); // fallback to empty array to prevent .map crash
  }
};


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setResumeFile(file);
    setError('');
  };

  const uploadAndAnalyzeResume = async () => {
    if (!resumeFile) return null;

    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      // Use the registration-specific endpoint that doesn't require authentication
      const response = await axios.post(
        `${API_BASE_URL}/api/students/analyze-resume-registration`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        console.log('Resume analysis successful:', response.data);
        // The registration endpoint returns data with analysisId
        return response.data.data;
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setError('Failed to upload and analyze resume. Please try again.');
    } finally {
      setResumeUploading(false);
    }
    return null;
  };

const sendOTP = async () => {
    if (!formData.phoneNumber) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Check if email already exists
      const emailCheckResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CHECK_EMAIL}`, { email: formData.email });
      if (!emailCheckResponse.data.available) {
        const redirectUrl = router.query.redirect as string;
        router.push(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login');
        setLoading(false);
        return;
      }

      // Check if phone number already exists
      const phoneCheckResponse = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CHECK_PHONE}`,
        { phone: formData.phoneNumber }
      );
      if (!phoneCheckResponse.data.available) {
        const redirectUrl = router.query.redirect as string;
        router.push(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        phoneNumber: formData.phoneNumber,
        userType: 'student',
        preferredMethod: otpMethod,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      setOtpId(response.data.otpId);
      setSessionId(response.data.sessionId); // Store sessionId for verification
      setOtpSent(true);
      setOtpTimer(60); // Start 60 second timer for resend
      
      if (response.data.method === 'whatsapp') {
        setError(''); // Clear any previous errors
        // Show success message for WhatsApp
        alert('🔐 OTP sent to your WhatsApp! Please check your messages and enter the 6-digit code below.');
      }
      
      console.log('OTP sent successfully:', response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.otp || !otpId) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload: any = {
        otpId,
        otp: formData.otp,
        userType: 'student',
        method: otpMethod
      };

      // Add sessionId if available (required for SMS OTP)
      if (sessionId) {
        payload.sessionId = sessionId;
      }

      console.log('Verifying OTP with payload:', payload);
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`,
        payload
      );

      if (response.data.verified) {
        setStep(2);
        console.log('OTP verified successfully');
        // Clear OTP-related state
        setFormData(prev => ({ ...prev, otp: '' }));
      } else {
        setError('OTP verification failed');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (otpTimer > 0) return;
    
    setOtpSent(false);
    setOtpId('');
    setSessionId('');
    setFormData(prev => ({ ...prev, otp: '' }));
    await sendOTP();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle different steps
    if (step === 1) {
      if (!otpSent) {
        sendOTP();
      } else {
        verifyOTP();
      }
      return;
    }

    if (step === 2) {
      // Validate college selection
      if (!formData.collegeId || formData.collegeId.trim() === '') {
        setError('Please select a college.');
        return;
      }

      // Upload and analyze resume if provided
      let resumeAnalysis = null;
      if (resumeFile) {
        setLoading(true);
        resumeAnalysis = await uploadAndAnalyzeResume();
        if (!resumeAnalysis) {
          setLoading(false);
          return; // Error already set in upload function
        }
        // Store the resume analysis ID for submission
        setResumeAnalysisId(resumeAnalysis.analysisId || '');
        setLoading(false);
      }

      // Proceed directly to final registration submission
      setError('');
      setLoading(true);

      try {
        // Check if email already exists before submitting registration
        const emailCheckResponse = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.CHECK_EMAIL}`,
          { email: formData.email }
        );
        if (!emailCheckResponse.data.available) {
          const redirectUrl = router.query.redirect as string;
          router.push(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login');
          setLoading(false);
          return;
        }

        // Check if phone number already exists before submitting registration
        const phoneCheckResponse = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.CHECK_PHONE}`,
          { phone: formData.phoneNumber }
        );
        if (!phoneCheckResponse.data.available) {
          const redirectUrl = router.query.redirect as string;
          router.push(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login');
          setLoading(false);
          return;
        }

        const registrationData = {
          email: formData.email,  
          password: formData.password,
          role: 'student',
          phoneNumber: formData.phoneNumber,
          whatsappNumber: formData.whatsappNumber || formData.phoneNumber,
          otpId,
          sessionId, // Include sessionId for verification
          profileData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
            gender: formData.gender === '' ? undefined : formData.gender,
            phoneNumber: formData.phoneNumber,
            linkedinUrl: formData.linkedinUrl,
            githubUrl: formData.githubUrl,
            portfolioUrl: formData.portfolioUrl,
            collegeId: formData.collegeId && formData.collegeId.trim() !== '' ? formData.collegeId : null,
            studentId: formData.studentId,
            enrollmentYear: Number(formData.enrollmentYear) || new Date().getFullYear(),
            graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
            currentSemester: formData.currentSemester ? Number(formData.currentSemester) : undefined,
            skills: [], // Initialize with empty skills array since we removed step 3
            resumeAnalysisId: resumeAnalysisId, // Include resume analysis ID
            jobPreferences: {
              jobTypes: [],
              preferredLocations: [],
              workMode: 'any',
              expectedSalary: {
                min: 0,
                max: 0,
                currency: 'INR'
              }
            }
          }
        };

        console.log('Submitting registration:', registrationData);
        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.REGISTER}`,
          registrationData
        );
        
        console.log('Registration response:', response.data);
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);

          // Decode token to get userId and store in localStorage
          const token = response.data.token;
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join(''));
          const payload = JSON.parse(jsonPayload);
          const userId = payload.userId;
          localStorage.setItem('userId', userId);
          console.log('Stored userId in localStorage after registration:', userId);

          console.log('Token stored, redirecting...');
          router.push('/dashboard/student');
        } else {
          setError('Registration succeeded but no token received.');
          console.error('No token in registration response:', response.data);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Registration failed');
        console.error('Registration error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Note: Step 3 (Skills & Preferences) has been removed as per user request
    // Registration is now completed after Step 2
  };

  const nextStep = () => {
    if (step === 1 && !otpSent) {
      sendOTP();
    } else if (step === 1 && otpSent) {
      verifyOTP();
    } else if (step < 2) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">Student Registration</h1>
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Basic Information & Verification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  readOnly={!!router.query.verified_firstName}
                  style={router.query.verified_firstName ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  readOnly={!!router.query.verified_lastName}
                  style={router.query.verified_lastName ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  readOnly={!!router.query.verified_phone}
                  style={router.query.verified_phone ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                />
              </div>

              {!otpSent ? (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">📱 Phone Verification Required</h3>
                  
                  {/* OTP Method Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose verification method:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="otpMethod"
                          value="whatsapp"
                          checked={otpMethod === 'whatsapp'}
                          onChange={(e) => setOtpMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">📱 WhatsApp (Recommended)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="otpMethod"
                          value="sms"
                          checked={otpMethod === 'sms'}
                          onChange={(e) => setOtpMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">💬 SMS</span>
                      </label>
                    </div>
                  </div>
                  
                  <p className="text-blue-600 text-sm mb-4">
                    {otpMethod === 'whatsapp' 
                      ? "We'll send a verification code to your WhatsApp number. Make sure you have WhatsApp installed and accessible."
                      : "We'll send a verification code via SMS to your phone number."
                    }
                  </p>
                  
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={loading || !formData.phoneNumber}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : (
                      `${otpMethod === 'whatsapp' ? '📱 Send WhatsApp OTP' : '💬 Send SMS OTP'}`
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    {otpMethod === 'whatsapp' ? '📱 WhatsApp OTP Sent!' : '💬 SMS OTP Sent!'}
                  </h3>
                  <p className="text-green-600 text-sm mb-4">
                    {otpMethod === 'whatsapp' 
                      ? `Check your WhatsApp messages for a 6-digit verification code sent to: ${formData.phoneNumber}`
                      : `Check your SMS messages for a 6-digit verification code sent to: ${formData.phoneNumber}`
                    }
                  </p>
                  
                  {otpMethod === 'whatsapp' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> You can also reply directly to our WhatsApp message with the 6-digit code, 
                        or enter it in the field below.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
                      <input
                        name="otp"
                        type="text"
                        placeholder="000000"
                        className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 px-4 py-3 rounded-md text-center text-lg font-mono tracking-widest"
                        value={formData.otp}
                        onChange={handleInputChange}
                        maxLength={6}
                        pattern="[0-9]{6}"
                        autoComplete="one-time-code"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={verifyOTP}
                        disabled={loading || formData.otp.length !== 6}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </span>
                        ) : (
                          '✅ Verify OTP'
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={resendOTP}
                        disabled={otpTimer > 0}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      >
                        {otpTimer > 0 ? `⏱️ Resend in ${otpTimer}s` : '🔄 Resend OTP'}
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center mt-3">
                      Didn't receive the OTP? Check your {otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} or click "Resend OTP"
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6">Resume Upload & College Selection</h2>
              
              {/* Resume Upload Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  📄 Upload Your Resume
                  <span className="text-sm font-normal text-gray-500 ml-2">(Optional but recommended)</span>
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {!resumeFile ? (
                    <div>
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-gray-600 mb-2">
                        <label htmlFor="resume-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">Click to upload</span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">PDF, DOC, or DOCX (max 5MB)</p>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{resumeFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                
                {resumeFile && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Your resume will be analyzed using AI to extract skills, experience, and match with relevant job opportunities.
                    </p>
                  </div>
                )}
              </div>

              {/* College Selection Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  🎓 College Information
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Your College <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="collegeId"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.collegeId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select College</option>
                      {colleges.map(college => (
                        <option key={college._id} value={college._id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="studentId"
                      type="text"
                      placeholder="Enter your student ID"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enrollment Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="enrollmentYear"
                      type="number"
                      placeholder="2020"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.enrollmentYear}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Graduation Year
                    </label>
                    <input
                      name="graduationYear"
                      type="number"
                      placeholder="2024"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Semester
                    </label>
                    <input
                      name="currentSemester"
                      type="number"
                      placeholder="6"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.currentSemester}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      name="dateOfBirth"
                      type="date"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                Previous
              </button>
            )}
            
            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading || resumeUploading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 ml-auto"
              >
                {resumeUploading ? 'Uploading Resume...' : loading ? 'Please wait...' : (otpSent && step === 1 ? 'Verify OTP' : 'Next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-auto"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}