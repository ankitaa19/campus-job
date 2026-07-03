import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { validatePassword, PasswordValidation } from '../utils/passwordValidator';

type UserType = 'student' | 'college' | 'company';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserType?: UserType;
  onSwitchToLogin?: (userType: UserType) => void;
}

export default function RegisterModal({ isOpen, onClose, initialUserType = 'student', onSwitchToLogin }: RegisterModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserType>(initialUserType);
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({
    // Student fields
    fullName: '',
    mobile: '',
    password: '',
    
    // College fields
    collegeName: '',
    collegeEmail: '',
    
    // Company fields
    companyName: '',
    companyEmail: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpId, setOtpId] = useState('');
  const [otpMethod, setOtpMethod] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const [passwordErrorTimer, setPasswordErrorTimer] = useState<NodeJS.Timeout | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Student slideshow index for left illustration
  const [studentSlide, setStudentSlide] = useState(0);
  // College slideshow index for left illustration
  const [collegeSlide, setCollegeSlide] = useState(0);
  // Company slideshow index for left illustration
  const [companySlide, setCompanySlide] = useState(0);

  // Rotate student images every ~2.5 seconds only on Student tab
  useEffect(() => {
    if (activeTab !== 'student') return;
    const interval = setInterval(() => {
      setStudentSlide((i) => (i + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Rotate college images every ~2.5 seconds only on College tab
  useEffect(() => {
    if (activeTab !== 'college') return;
    const interval = setInterval(() => {
      setCollegeSlide((i) => (i + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Rotate company images every ~2.5 seconds only on Company tab
  useEffect(() => {
    if (activeTab !== 'company') return;
    const interval = setInterval(() => {
      setCompanySlide((i) => (i + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Always start slides from first image when opening or switching tabs
  useEffect(() => {
    if (isOpen) {
      setStudentSlide(0);
      setCollegeSlide(0);
      setCompanySlide(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'student') setStudentSlide(0);
    if (activeTab === 'college') setCollegeSlide(0);
    if (activeTab === 'company') setCompanySlide(0);
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate password in real-time but don't show errors while typing
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  // Function to show password validation errors temporarily
  const showPasswordValidationErrors = () => {
    // Clear any existing timer
    if (passwordErrorTimer) {
      clearTimeout(passwordErrorTimer);
    }
    
    // Show errors
    setShowPasswordErrors(true);
    
    // Hide errors after 3 seconds
    const timer = setTimeout(() => {
      setShowPasswordErrors(false);
    }, 3000);
    
    setPasswordErrorTimer(timer);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (passwordErrorTimer) {
        clearTimeout(passwordErrorTimer);
      }
    };
  }, [passwordErrorTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`register-otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`register-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    // Validate password before proceeding
    if (!passwordValidation || !passwordValidation.isValid) {
      showPasswordValidationErrors(); // Show validation errors for 3 seconds
      setError('Please enter a valid password that meets all requirements');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Send OTP for verification instead of direct registration
      let otpData = {};

      if (activeTab === 'student') {
        // Parse name into first and last name for WhatsApp OTP
        const nameParts = formData.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        otpData = {
          phoneNumber: formData.mobile,
          firstName: firstName,
          lastName: lastName,
          userType: 'student',
          preferredMethod: 'whatsapp'
        };
      } else if (activeTab === 'college') {
        otpData = {
          email: formData.collegeEmail,
          userType: 'college',
          preferredMethod: 'email'
        };
      } else if (activeTab === 'company') {
        otpData = {
          email: formData.companyEmail,
          userType: 'recruiter', // API expects 'recruiter' for companies
          preferredMethod: 'email'
        };
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, otpData);
      
      // Store OTP ID and method for verification
      if (response.data.otpId) {
        setOtpId(response.data.otpId);
        setOtpMethod(response.data.method || (activeTab === 'student' ? 'whatsapp' : 'email'));
      }
      
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const otpString = otp.join('');
      if (otpString.length !== 6) {
        setError('Please enter complete 6-digit OTP');
        setLoading(false);
        return;
      }

      if (activeTab === 'student') {
        // Step 1: Verify OTP
        await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
          otpId: otpId,
          otp: otpString,
          userType: 'student',
          method: otpMethod
        });

        // Step 2: Auto-register minimal student account
        const nameParts = formData.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Generate a fallback email for students (required by API)
        const fallbackEmail = `student_${formData.mobile}@campuspe.local`;

        const registerRes = await axios.post(`${API_BASE_URL}/api/auth/register`, {
          role: 'student',
          email: fallbackEmail,
          phoneNumber: formData.mobile,
          password: formData.password,
          userType: 'student',
          profileData: {
            firstName,
            lastName,
            phoneNumber: formData.mobile,
            whatsappNumber: formData.mobile
          }
        });

        const data = registerRes.data;
        if (data?.token) {
          try {
            const mod = await import('../utils/auth');
            await mod.handleLoginSuccess(data, router);
          } catch {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user?.id || '');
            localStorage.setItem('role', data.user?.role || 'student');
            router.push('/dashboard/student');
          }
          onClose();
          return;
        } else {
          setError('Registration failed after OTP verification');
          return;
        }
      } else if (activeTab === 'college') {
        // Verify OTP for college
        await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
          otpId: otpId,
          otp: otpString,
          userType: 'college',
          method: otpMethod
        });

        // Close modal and redirect with verified data
        onClose();
        // Pass verified data to college registration
        const queryParams = new URLSearchParams({
          step: '2',
          verified_name: formData.collegeName,
          verified_email: formData.collegeEmail,
          verified_password: formData.password
        });
        router.push(`/register/college?${queryParams.toString()}`);
      } else if (activeTab === 'company') {
        // Verify OTP for company (recruiter)
        await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
          otpId: otpId,
          otp: otpString,
          userType: 'recruiter',
          method: otpMethod
        });

        // Close modal and redirect with verified data
        onClose();
        // Pass verified data to company registration
        const queryParams = new URLSearchParams({
          step: '2',
          verified_name: formData.companyName,
          verified_email: formData.companyEmail,
          verified_password: formData.password
        });
        router.push(`/register/company?${queryParams.toString()}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'student' as UserType, label: 'Student' },
    { key: 'college' as UserType, label: 'College' },
    { key: 'company' as UserType, label: 'Company' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[750px] max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full min-h-[750px]">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 h-full bg-gradient-to-br from-[#edf9f8] to-[#edf9f8] items-center justify-center p-12">
              <div className="text-center max-w-md">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center bg-transparent"
                >
                  {activeTab === 'student' && (
                    <>
                      {/* Simple fading slideshow for student signup */}
                      <motion.img
                        key={studentSlide}
                        src={
                          [
                            '/wykfrtuwbtfwby3wi6428v4ywjer.png',
                            '/kebwcrytit73i46w3r.png',
                            '/bywux4r6ktwxkberh.png',
                          ][studentSlide]
                        }
                        alt="Student registration illustration"
                        className={`w-full h-full object-contain origin-center ${studentSlide === 0 ? 'scale-100' : 'scale-110'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                    </>
                  )}
                  {activeTab === 'college' && (
                    <motion.img
                      key={collegeSlide}
                      src={[
                        '/gceuyvgt3w4tbc34tvh3re.png',
                        '/nescikrnwr4wrcynworow.png',
                        '/nkwaci7r57w3r4hw347.png',
                      ][collegeSlide]}
                      alt="College registration illustration"
                      className={`w-full h-full object-contain origin-center ${collegeSlide === 0 ? 'scale-100' : 'scale-110'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                  {activeTab === 'company' && (
                    <motion.img
                      key={companySlide}
                      src={[
                        '/bwcykufbcucantu3fr3c462eyg.png',
                        '/wc34hi7i434.png',
                        '/hw7c4n83.png',
                      ][companySlide]}
                      alt="Company registration illustration"
                      className={`w-full h-full object-contain origin-center ${companySlide === 0 ? 'scale-100' : 'scale-110'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </motion.div>

                <motion.div
                  key={activeTab === 'student' ? `student-copy-${studentSlide}` : `${activeTab}-content`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {activeTab === 'student' && (
                    <>
                      {studentSlide === 0 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Search hundreds of <span className="text-blue-600">colleges in one go</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Programs, fees, placements — sorted in one view.
                          </p>
                        </>
                      )}
                      {studentSlide === 1 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Your college officials are just <span className="text-blue-600">a text away</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Skip middlemen. Chat directly with verified college staff and book your seat with confidence.
                          </p>
                        </>
                      )}
                      {studentSlide === 2 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Start your career with <span className="text-blue-600">studying</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Get part-time jobs, internships, and placements — with real-time alerts on WhatsApp.
                          </p>
                        </>
                      )}
                    </>
                  )}
                  {activeTab === 'college' && (
                    <>
                      {collegeSlide === 0 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Boost your <span className="text-blue-600">online presence</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Connect with thousands of students instantly and showcase your college programs online.
                          </p>
                        </>
                      )}
                      {collegeSlide === 1 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Get more student enquiries and <span className="text-blue-600">admissions with ease</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Manage all student enquiries in one dashboard and boost admissions.
                          </p>
                        </>
                      )}
                      {collegeSlide === 2 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Connect with <span className="text-blue-600">companies</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Connect directly with recruiters — open more opportunities for your students.
                          </p>
                        </>
                      )}
                    </>
                  )}
                  {activeTab === 'company' && (
                    <>
                      {companySlide === 0 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Hire interns & <span className="text-blue-600">fresh graduates</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Connect with job-ready students from verified colleges — faster, smarter.
                          </p>
                        </>
                      )}
                      {companySlide === 1 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Post once, <span className="text-blue-600">reach many</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Share your openings with multiple colleges in one click — no extra effort.
                          </p>
                        </>
                      )}
                      {companySlide === 2 && (
                        <>
                          <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Simplify your <span className="text-blue-600">hiring process</span>
                          </h1>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            Track and shortlist in one dashboard — cut hiring time and costs in half.
                          </p>
                        </>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Slide indicators placed below image + text for Student signup */}
                {activeTab === 'student' && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`w-3 h-3 rounded-full ${studentSlide === i ? 'bg-blue-600' : 'bg-gray-400'}`}
                      />
                    ))}
                  </div>
                )}
                {activeTab === 'college' && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`w-3 h-3 rounded-full ${collegeSlide === i ? 'bg-blue-600' : 'bg-gray-400'}`}
                      />
                    ))}
                  </div>
                )}
                {activeTab === 'company' && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`w-3 h-3 rounded-full ${companySlide === i ? 'bg-blue-600' : 'bg-gray-400'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative h-full">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>

              {/* Form Card */}
              <div className="w-full max-w-md h-full flex flex-col py-6">
                {step === 'register' ? (
                  <>
                    {/* Fixed Header */}
                    <div className="flex-none pt-6 pb-4">
                      <h2 className="text-3xl font-bold text-gray-900 text-left">
                        Create an <span className="text-blue-600">Account !!</span>
                      </h2>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 flex flex-col max-h-[650px] overflow-y-auto justify-start pt-4">

                    {/* Tabs */}
                    <div className="flex justify-start mb-8">
                      <div className="relative flex gap-8">
                        {tabs.map((tab, index) => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-2 py-2 text-sm font-medium transition-colors ${
                              activeTab === tab.key ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {tab.label}
                            {/* Moving underline */}
                            {activeTab === tab.key && (
                              <motion.div
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                layoutId="register-underline"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Register Form */}
                    <form onSubmit={handleRegister} className="space-y-6">
                      <AnimatePresence mode="wait">
                        {activeTab === 'student' && (
                          <motion.div
                            key="student-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <input
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              placeholder="Full Name"
                              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                              required
                            />
                            
                            <input
                              type="tel"
                              name="mobile"
                              value={formData.mobile}
                              onChange={handleInputChange}
                              placeholder="Mobile number"
                              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                              required
                            />
                            
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 pr-12"
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

                            {/* Password validation display */}
                            {formData.password && passwordValidation && (
                          <div className="mt-2 sm:text-center sm:text-[10.8px] text-sm text-gray-500 text-whitespace-nowrap sm:whitespace-wrap">

  <span className="text-gray-600">
    <span className={showPasswordErrors && !passwordValidation.requirements.minLength ? 'text-red-500' : ''}>
      Atleast 8 characters
    </span>, 
    <span className={showPasswordErrors && !passwordValidation.requirements.hasUppercase ? 'text-red-500' : ''}>
      one upper case
    </span>, 
    <span className={showPasswordErrors && !passwordValidation.requirements.hasDigit ? 'text-red-500' : ''}>
      one number
    </span>, 
    <span className={showPasswordErrors && !passwordValidation.requirements.hasLowercase ? 'text-red-500' : ''}>
      one lower case
    </span>, 
    <span className={showPasswordErrors && !passwordValidation.requirements.hasSpecialChar ? 'text-red-500' : ''}>
      one special character
    </span>
  </span>
</div>


                            )}
                          </motion.div>
                        )}

                        {activeTab === 'college' && (
                          <motion.div
                            key="college-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <input
                              type="text"
                              name="collegeName"
                              value={formData.collegeName}
                              onChange={handleInputChange}
                              placeholder="College Name"
                              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                              required
                            />
                            
                            <input
                              type="email"
                              name="collegeEmail"
                              value={formData.collegeEmail}
                              onChange={handleInputChange}
                              placeholder="College email id"
                              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                              required
                            />
                            
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 pr-12"
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

                            {/* Password validation display */}
                            {formData.password && passwordValidation && (
                              <div className="mt-2 sm:text-center sm:text-[10.8px] text-sm text-gray-500 text-whitespace-nowrap sm:whitespace-wrap">
                                <span className="text-gray-600">
                                  <span className={showPasswordErrors && !passwordValidation.requirements.minLength ? 'text-red-500' : ''}>
                                    Atleast 8 characters
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasUppercase ? 'text-red-500' : ''}>
                                    one upper case
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasDigit ? 'text-red-500' : ''}>
                                    one number
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasLowercase ? 'text-red-500' : ''}>
                                    one lower case
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasSpecialChar ? 'text-red-500' : ''}>
                                    one special character
                                  </span>
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeTab === 'company' && (
                          <motion.div
                            key="company-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <input
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              placeholder="Company name"
                              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                              required
                            />
                            
                            <input
                              type="email"
                              name="companyEmail"
                              value={formData.companyEmail}
                              onChange={handleInputChange}
                              placeholder="Company email id"
                              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                              required
                            />
                            
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 pr-12"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>

                            {/* Password validation display */}
                            {formData.password && passwordValidation && (
                              <div className="mt-2 sm:text-center sm:text-[10.8px] text-sm text-gray-500 text-whitespace-nowrap sm:whitespace-wrap">
                                <span className="text-gray-600">
                                  <span className={showPasswordErrors && !passwordValidation.requirements.minLength ? 'text-red-500' : ''}>
                                    Atleast 8 characters
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasUppercase ? 'text-red-500' : ''}>
                                    one upper case
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasDigit ? 'text-red-500' : ''}>
                                    one number
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasLowercase ? 'text-red-500' : ''}>
                                    one lower case
                                  </span>
                                  , 
                                  <span className={showPasswordErrors && !passwordValidation.requirements.hasSpecialChar ? 'text-red-500' : ''}>
                                    one special character
                                  </span>
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                      {/* Terms and Conditions */}
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="agreeTerms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                          I have read and agree with all terms and conditions.
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Creating Account...' : 'Sign up'}
                      </button>

                      <div className="text-center text-sm">
                        <span className="text-gray-600">Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            // Use the prop function to switch to login modal
                            onClose();
                            onSwitchToLogin?.(activeTab);
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Login
                        </button>
                      </div>
                    </form>

                    {/* Google Sign up - Only for Students */}
                    {activeTab === 'student' && (
                      <>
                        <div className="text-center my-4">
                          <span className="text-gray-400 text-sm">OR</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Handle Google signup for students
                            console.log('Google signup for student');
                          }}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign up with google
                        </button>
                      </>
                    )}
                    </div>
                  </>
                ) : (
                  /* OTP Verification Step */
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-full max-w-sm mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification code</h2>
                      <p className="text-gray-600 mb-8">
                        Enter the 6 digits code that we have send through your {activeTab === 'student' ? 'mobile number' :  'email'}
                      </p>

                      <div className="flex justify-center gap-3 mb-8">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`register-otp-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            maxLength={1}
                          />
                        ))}
                      </div>

                      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

                      <button
                        onClick={verifyOtp}
                        disabled={loading || otp.some(digit => !digit)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-all duration-200 mb-6 disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>

                      <div className="text-center">
                        <span className="text-gray-600">Did not receive code? </span>
                        <button
                          onClick={() => handleRegister({ preventDefault: () => {} } as React.FormEvent)}
                          className="text-green-600 hover:underline font-medium"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}