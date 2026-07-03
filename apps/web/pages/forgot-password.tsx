'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';

export default function ForgotPassword() {
  const router = useRouter();
  const { type } = router.query;

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digit OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [otpMethod, setOtpMethod] = useState('whatsapp'); // default method
  const [resendTimer, setResendTimer] = useState(0);
  const [userType, setUserType] = useState<'student' | 'college' | 'recruiter'>('student');

  // Set user type based on URL parameter
  useEffect(() => {
    if (type && ['student', 'college', 'recruiter'].includes(type as string)) {
      setUserType(type as 'student' | 'college' | 'recruiter');
    }
  }, [type]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Update otpMethod based on userType
  useEffect(() => {
    if (userType === 'student') {
      setOtpMethod('whatsapp');
    } else {
      setOtpMethod('email');
    }
  }, [userType]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otpRequestCount >= 3) {
      setError('Maximum OTP requests reached. Please try again later.');
      return;
    }

    // Validate input based on userType
    if (userType === 'student' && !phone) {
      setError('Please enter your phone number.');
      return;
    }
    if ((userType === 'college' || userType === 'recruiter') && !email) {
      setError('Please enter your email.');
      return;
    }

    try {
      const payload = userType === 'student' ? { phone } : { email };
      
      // Map frontend userType to backend expected values
      const backendUserType = userType === 'college' ? 'college_admin' : userType;
      
      console.log('Sending OTP request:', { ...payload, preferredMethod: otpMethod, userType: backendUserType });
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`, { 
        ...payload, 
        preferredMethod: otpMethod,
        userType: backendUserType // Use mapped user type
      });
      
      console.log('OTP Response:', response.data);
      if (response.data && response.data.otpId) {
        setOtpSent(true);
        setOtpId(response.data.otpId);
        setMessage(`OTP has been sent to your ${otpMethod === 'whatsapp' ? 'WhatsApp' : 'email'}.`);
        setOtpRequestCount(otpRequestCount + 1);
        setResendTimer(60); // 60 seconds timer for resend
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const otpValue = otp.join(''); // Join array to create string
    if (otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      // Map frontend userType to backend expected values
      const backendUserType = userType === 'college' ? 'college_admin' : userType;
      
      console.log('Verifying OTP with:', { otpId, otp: otpValue, userType: backendUserType });
      
      // For forgot password, we need to use the verifyOTPAndLogin endpoint
      // which handles auto-login after OTP verification
      const requestPayload = {
        otpId,
        otp: otpValue,
        userType: backendUserType,
        method: otpMethod,
        phone: userType === 'student' ? phone : undefined,
        email: userType !== 'student' ? email : undefined
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp-login`, requestPayload);
      
      console.log('Verify OTP Response:', response.data);

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('role', response.data.user.role);

        if (response.data.user.role === 'student') {
          try {
            const studentResponse = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_BY_USER_ID(response.data.user.id)}`);
            if (studentResponse.data) {
              localStorage.setItem('profileData', JSON.stringify(studentResponse.data));
            } else {
              const studentProfile = {
                id: response.data.user.id,
                email: response.data.user.email,
                role: response.data.user.role,
                isVerified: response.data.user.isVerified,
                studentId: response.data.user.studentId
              };
              localStorage.setItem('profileData', JSON.stringify(studentProfile));
            }
          } catch (error) {
            console.error('Error fetching full student profile:', error);
            const studentProfile = {
              id: response.data.user.id,
              email: response.data.user.email,
              role: response.data.user.role,
              isVerified: response.data.user.isVerified,
              studentId: response.data.user.studentId
            };
            localStorage.setItem('profileData', JSON.stringify(studentProfile));
          }
        }

        import('../utils/auth').then(({ handleLoginSuccess }) => {
          handleLoginSuccess(response.data, router).then(() => {
            if (response.data.user.role === 'student') {
              router.push('/dashboard/student');
            } else if (response.data.user.role === 'college') {
              router.push('/dashboard/college');
            } else if (response.data.user.role === 'recruiter') {
              router.push('/dashboard/recruiter');
            }
          }).catch((err) => {
            setError('Login failed: ' + err.message);
          });
        });
        setMessage('OTP verified. Logging you in...');
      } else {
        setError('OTP verification failed.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'OTP verification failed.');
    }
  };

  const handleResendOtp = () => {
    if (resendTimer === 0) {
      setOtpSent(false);
      setOtp(['', '', '', '', '', '']); // Reset to empty array for 6 digits
      setOtpId('');
      setMessage('');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 items-center justify-center p-12">
        <div className="text-center max-w-md">
          {/* Illustration Container */}
          <div className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center bg-transparent">
            <img 
              src="/hkwserhtetbyf34fihirudgwrgheu.png" 
              alt="Forgot password illustration" 
              className="w-full h-full object-contain"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Let's get started
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Connect directly with recruiters open more opportunities for your students.
          </p>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        {/* Close Button */}
        <button
          onClick={() => {
            if (userType === 'college') {
              router.push('/college-login');
            } else if (userType === 'recruiter') {
              router.push('/company-login');
            } else {
              router.push('/login');
            }
          }}
          className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X size={20} />
        </button>

        <div className="w-full max-w-md">
          {error && <p className="text-red-500 text-center text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
          {message && <p className="text-green-600 text-center text-sm mb-4 bg-green-50 p-3 rounded-lg">{message}</p>}

          {!otpSent ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Let's get started
                </h2>
                <p className="text-gray-600">
                  Connect directly with recruiters open more opportunities for your students.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                {/* User Type Selection - Hidden, managed by URL parameter */}
                <input type="hidden" value={userType} />

                {/* Phone Input (for students) */}
                {userType === 'student' && (
                  <div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                )}

                {/* Email Input (for college/recruiter) */}
                {(userType === 'college' || userType === 'recruiter') && (
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                )}

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={otpRequestCount >= 3}
                  className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                    otpRequestCount >= 3 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {otpRequestCount >= 3 ? 'Max attempts reached' : 'Send OTP'}
                </button>
              </form>
            </div>
          ) : (
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Let's get started
                </h2>
                <p className="text-gray-600">
                  Connect directly with recruiters open more opportunities for your students.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Verification code</label>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Enter the 6 digits code that we have <br />
                  sent through your {userType === 'student' ? 'WhatsApp' : 'email'}
                </p>
                
                {/* 6-Digit OTP Input */}
                <div className="flex justify-center space-x-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      value={digit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 1 && /^\d*$/.test(value)) {
                          const newOtp = [...otp];
                          newOtp[index] = value;
                          setOtp(newOtp);
                          
                          // Auto-focus next input
                          if (value && index < 5) {
                            const nextInput = document.getElementById(`otp-${index + 1}`);
                            if (nextInput) nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = document.getElementById(`otp-${index - 1}`);
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      id={`otp-${index}`}
                      className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        error && error.includes('Invalid') ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      maxLength={1}
                    />
                  ))}
                </div>

                {/* Error Display */}
                {error && error.includes('Invalid') && (
                  <p className="text-red-500 text-sm text-center mb-4">Invalid code</p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={otp.join('').length !== 6}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                  otp.join('').length === 6
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Verify
              </button>

              {/* Resend Button */}
              <div className="text-center">
                <span className="text-gray-600 text-sm">Did not receive code </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    resendTimer > 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:underline'
                  }`}
                >
                  {resendTimer > 0 ? `Resend in 00:${resendTimer.toString().padStart(2, '0')} Sces` : 'Resend'}
                </button>
              </div>

              {/* Back to Input */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp(['', '', '', '', '', '']);
                    setOtpId('');
                    setError('');
                    setMessage('');
                  }}
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200"
                >
                  ← Change {userType === 'student' ? 'phone number' : 'email'}
                </button>
              </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
