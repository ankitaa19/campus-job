'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import CompanyRegistrationNavbar from '../../components/CompanyRegistrationNavbar';
import Footer from '../../components/Footer';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

// Step-wise state management
type Step = 1 | 2 | 3 | 4;

interface College {
  _id: string;
  name: string;
}

interface CompanyFormData {
  // Step 1: Account Creation
  companyName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
  
  // Email Verification
  emailOtp: string;
  
  // Step 2: Company Information
  companyMailID: string;
  hrName: string;
  hrPhoneNumber: string;
  hrMailID: string;
  companyWebsite: string;
  pincode: string;
  city: string;
  companyAddress: string;
  industry: string;
  foundedYear: string;
  companySize: string;
  companyLogo: File | null;
  companyDocuments: File | null;
  aboutCompany: string;
  
  // Step 3: Legacy fields for backward compatibility
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber: string;
  designation: string;
  department: string;
  linkedinUrl: string;
  companyDescription: string;
  state: string;
  country: string;
  
  // Step 4: Hiring Preferences
  preferredColleges: string[];
  preferredCourses: string[];
  hiringSeasons: string[];
  averageHires: number;
  workLocations: string[];
  remoteWork: boolean;
  internshipOpportunities: boolean;
  preferredContactMethod: string;
  
  // Mobile Verification
  mobileOtp: string;
}

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtpId, setEmailOtpId] = useState('');
  const [mobileOtpId, setMobileOtpId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [otpMethod, setOtpMethod] = useState('whatsapp');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'email' | 'mobile'>('email');
  const [otpTimer, setOtpTimer] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const otpInputRefs = useRef<HTMLInputElement[]>([]);

  const [formData, setFormData] = useState<CompanyFormData>({
    // Step 1: Account Creation
    companyName: '',
    email: '',
    password: '',
    agreeTerms: false,
    
    // Email Verification
    emailOtp: '',
    
    // Step 2: Company Information
    companyMailID: '',
    hrName: '',
    hrPhoneNumber: '',
    hrMailID: '',
    companyWebsite: '',
    pincode: '',
    city: '',
    companyAddress: '',
    industry: '',
    foundedYear: '',
    companySize: 'medium',
    companyLogo: null,
    companyDocuments: null,
    aboutCompany: '',
    
    // Step 3: Legacy fields
    firstName: '',
    lastName: '',
    phoneNumber: '',
    whatsappNumber: '',
    designation: '',
    department: '',
    linkedinUrl: '',
    companyDescription: '',
    state: '',
    country: 'India',
    
    // Step 4: Hiring Preferences
    preferredColleges: [] as string[],
    preferredCourses: [''],
    hiringSeasons: [] as string[],
    averageHires: 0,
    workLocations: [''],
    remoteWork: false,
    internshipOpportunities: false,
    preferredContactMethod: 'email',
    
    // Mobile Verification
    mobileOtp: ''
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  // Handle step from URL parameter
  useEffect(() => {
    if (router.isReady && router.query.step) {
      const stepParam = parseInt(router.query.step as string);
      if (stepParam >= 1 && stepParam <= 4) {
        setStep(stepParam as Step);
      }
    }
  }, [router.isReady, router.query.step]);

  // Handle pre-filled verified data from registration modal
  useEffect(() => {
    if (router.isReady && (router.query.verified_name || router.query.verified_email)) {
      setFormData(prev => ({
        ...prev,
        ...(router.query.verified_name && { 
          companyName: decodeURIComponent(router.query.verified_name as string)
        }),
        ...(router.query.verified_email && { 
          email: decodeURIComponent(router.query.verified_email as string)
        })
      }));
      setStep(2);
    }
  }, [router.isReady, router.query.verified_name, router.query.verified_email]);

  const fetchColleges = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.COLLEGES}`);
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Create preview for logo
      if (name === 'companyLogo') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCollegeSelection = (collegeId: string) => {
    setFormData(prev => ({
      ...prev,
      preferredColleges: prev.preferredColleges.includes(collegeId)
        ? prev.preferredColleges.filter(id => id !== collegeId)
        : [...prev.preferredColleges, collegeId]
    }));
  };

  const handleHiringSeasonSelection = (season: string) => {
    setFormData(prev => ({
      ...prev,
      hiringSeasons: prev.hiringSeasons.includes(season)
        ? prev.hiringSeasons.filter(s => s !== season)
        : [...prev.hiringSeasons, season]
    }));
  };

  const handleArrayInputChange = (index: number, field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: keyof CompanyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayField = (index: number, field: keyof CompanyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        userType: 'recruiter'
      });
      
      setEmailOtpId(response.data.otpId);
      setOtpSent(true);
      setError('');
      
      console.log('OTP sent successfully:', response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.emailOtp || !emailOtpId) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId: emailOtpId,
        otp: formData.emailOtp,
        userType: 'recruiter'
      });

      if (response.data.verified) {
        setStep(2);
        setError('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: 'recruiter',
        userType: 'recruiter',
        phoneNumber: formData.hrPhoneNumber || formData.phoneNumber,
        whatsappNumber: formData.hrPhoneNumber || formData.whatsappNumber || formData.phoneNumber,
        otpId: emailOtpId,
        profileData: {
          firstName: formData.firstName || formData.hrName.split(' ')[0] || '',
          lastName: formData.lastName || formData.hrName.split(' ')[1] || '',
          designation: formData.designation,
          department: formData.department,
          linkedinUrl: formData.linkedinUrl,
          companyName: formData.companyName,
          industry: formData.industry,
          website: formData.companyWebsite,
          companyDescription: formData.aboutCompany || formData.companyDescription,
          companySize: formData.companySize,
          foundedYear: formData.foundedYear ? Number(formData.foundedYear) : undefined,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          preferredColleges: formData.preferredColleges.filter(id => id && id.trim() !== '' && /^[a-fA-F0-9]{24}$/.test(id)),
          preferredCourses: formData.preferredCourses.filter(course => course.trim() !== ''),
          hiringSeasons: formData.hiringSeasons,
          averageHires: formData.averageHires,
          workLocations: formData.workLocations.filter(location => location.trim() !== ''),
          remoteWork: formData.remoteWork,
          internshipOpportunities: formData.internshipOpportunities,
          preferredContactMethod: formData.preferredContactMethod,
          whatsappNumber: formData.hrPhoneNumber || formData.whatsappNumber
        }
      };

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, registrationData);

      localStorage.setItem('token', response.data.token);

      const token = response.data.token;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const payload = JSON.parse(jsonPayload);
      const userId = payload.userId;
      localStorage.setItem('userId', userId);

      router.push('/approval-status?type=recruiter');
    } catch (err: any) {
      console.error('Registration error response:', err.response?.data);
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !otpSent) {
      sendOTP();
    } else if (step === 1 && otpSent) {
      verifyOTP();
    } else if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  // Check if form is submitted and redirect to approval status
  if (router.query.submitted === 'true') {
    router.push('/approval-status?type=recruiter');
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FF' }}>
      <CompanyRegistrationNavbar 
        currentStep={step}
        registrationStatus={step === 1 ? 'company_info' : step === 2 ? 'company_info' : 'hr_info'}
        companyName={formData.companyName}
      />
      
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        {/* Step 1: Create Account */}
        {step === 1 && (
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F7FF' }}>
            <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full">
              {/* Left Side - Illustration */}
              <div className="w-1/2 bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col justify-center">
                <div className="text-center">
                  <div className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center">
                    <Image
                      src="/wykfrtuwbtfwby3wi6428v4ywjer.png"
                      alt="Company registration illustration"
                      width={320}
                      height={320}
                      className="object-contain"
                    />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Connect with <span className="text-green-600">top talent</span> across India
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    <span className="text-green-600">Campus recruitment made simple</span> - find the right candidates for your company.
                  </p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="w-1/2 p-12 flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Company Account</h2>
                  <p className="text-gray-600">Let's get your company profile set up for campus recruitment</p>
                </div>

                <form className="space-y-6">
                  <div>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Company Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      readOnly={!!router.query.verified_name}
                      style={router.query.verified_name ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Company Email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      readOnly={!!router.query.verified_email}
                      style={router.query.verified_email ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {otpSent && (
                    <div>
                      <input
                        type="text"
                        name="emailOtp"
                        value={formData.emailOtp}
                        onChange={handleInputChange}
                        placeholder="Enter Email OTP"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        maxLength={6}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        OTP sent to {formData.email}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      required
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the <a href="/terms" className="text-green-600 hover:underline">Terms & Conditions</a> and <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {success && <div className="text-green-500 text-sm">{success}</div>}

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading || !formData.agreeTerms}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Please wait...' : (otpSent ? 'Verify Email & Continue' : 'Send Verification Code')}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => router.push('/company-login')}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Information */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
                <p className="text-gray-600">Please provide your company details</p>
              </div>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Logo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo*</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        name="companyLogo"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Upload Company Logo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF up to 5MB</p>
                    </div>
                  </div>
                </div>

                <input
                  type="email"
                  name="companyMailID"
                  value={formData.companyMailID}
                  onChange={handleInputChange}
                  placeholder="Company Mail ID*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <input
                  type="text"
                  name="hrName"
                  value={formData.hrName}
                  onChange={handleInputChange}
                  placeholder="Hr Name*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <input
                  type="tel"
                  name="hrPhoneNumber"
                  value={formData.hrPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="Hr Phone Number*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <input
                  type="email"
                  name="hrMailID"
                  value={formData.hrMailID}
                  onChange={handleInputChange}
                  placeholder="Hr Mail ID*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <input
                  type="url"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  placeholder="Company Website"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="Pincode*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Industry*</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="consulting">Consulting</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="number"
                  name="foundedYear"
                  value={formData.foundedYear}
                  onChange={handleInputChange}
                  placeholder="Founded Year*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="startup">Startup (1-10 employees)</option>
                  <option value="small">Small (11-50 employees)</option>
                  <option value="medium">Medium (51-200 employees)</option>
                  <option value="large">Large (201-1000 employees)</option>
                  <option value="enterprise">Enterprise (1000+ employees)</option>
                </select>

                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  placeholder="Company Address*"
                  rows={3}
                  className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                {/* Company Document Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Document Upload*</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      name="companyDocuments"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-green-600 hover:underline">Choose a file or drag & drop it here</span>
                        </p>
                        <p className="text-xs text-gray-500">JPEG, PNG, PDF, DOC formats, up to 50MB</p>
                      </div>
                    </label>
                  </div>
                </div>

                <textarea
                  name="aboutCompany"
                  value={formData.aboutCompany}
                  onChange={handleInputChange}
                  placeholder="About the company*"
                  rows={4}
                  className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </form>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Hiring Preferences */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hiring Preferences</h2>
                <p className="text-gray-600">Tell us about your recruitment needs</p>
              </div>

              <form className="space-y-8">
                {/* Preferred Colleges */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Preferred Colleges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {colleges.map(college => (
                      <label key={college._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.preferredColleges.includes(college._id)}
                          onChange={() => handleCollegeSelection(college._id)}
                          className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm">{college.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Courses */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Preferred Courses/Streams</h3>
                  {formData.preferredCourses.map((course, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Course/Stream name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={course}
                        onChange={(e) => handleArrayInputChange(index, 'preferredCourses', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'preferredCourses')}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('preferredCourses')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Course
                  </button>
                </div>

                {/* Hiring Seasons */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Hiring Seasons</h3>
                  <div className="space-y-2">
                    {['summer', 'winter', 'continuous'].map(season => (
                      <label key={season} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hiringSeasons.includes(season)}
                          onChange={() => handleHiringSeasonSelection(season)}
                          className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="capitalize">{season}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="number"
                    name="averageHires"
                    value={formData.averageHires}
                    onChange={handleInputChange}
                    placeholder="Average Annual Hires"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    name="preferredContactMethod"
                    value={formData.preferredContactMethod}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {/* Work Locations */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Work Locations</h3>
                  {formData.workLocations.map((location, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Work location"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={location}
                        onChange={(e) => handleArrayInputChange(index, 'workLocations', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'workLocations')}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('workLocations')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Location
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="remoteWork"
                      checked={formData.remoteWork}
                      onChange={handleInputChange}
                      className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    Offers Remote Work
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="internshipOpportunities"
                      checked={formData.internshipOpportunities}
                      onChange={handleInputChange}
                      className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    Offers Internships
                  </label>
                </div>
              </form>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg">{error}</div>}
        {success && <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg">{success}</div>}
      </div>
      
      <Footer />
    </div>
  );
}
