import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ChangePasswordSectionProps {
  userEmail: string;
  onBack: () => void;
}

type Step = 'email' | 'otp' | 'newPassword';


const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({ userEmail, onBack }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(userEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  console.log('ChangePasswordSection rendered with email:', userEmail);

  // Timer countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle Send OTP
  const handleSendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email, preferredMethod: 'email' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStep('otp');
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(false);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/auth/verify-reset-otp`,
        { email, otp: otpCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStep('newPassword');
      setOtpError(false);
    } catch (err: any) {
      setOtpError(true);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setOtp(['', '', '', '', '', '']);
    setOtpError(false);
    await handleSendOTP();
  };

  // Update Password
  const handleUpdatePassword = async () => {
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*]/.test(newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }

    if (newPassword !== retypePassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/auth/reset-password`,
        { email, otp: otp.join(''), newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Password updated successfully!');
      onBack();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Set New <span className="text-blue-600">Password</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Atleast 8 characters, one upper case, one number, one lower case, one special character
          </p>
        </div>
      </div>

      {/* Illustration */}
      <div className="flex justify-center mb-8">
        <img 
          src="/qitbwrkeywbegdwo3ygrw.svg" 
          alt="Security illustration" 
          className="w-64 h-64 object-contain"
        />
      </div>

      {/* Step 1: Email Input */}
      {step === 'email' && (
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-xl font-semibold text-center mb-6">Change Password</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="xyzdemo@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleSendOTP}
            disabled={loading || !email}
            className="w-full bg-[#4285F4] text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>

          <button
            onClick={onBack}
            className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
          >
            Back to Settings
          </button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification code</h2>
            <p className="text-sm text-gray-500">
              Enter the 4 digits code that we have<br />
              send through your email
            </p>
          </div>

          <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className={`w-14 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  otpError 
                    ? 'border-red-500' 
                    : digit 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.join('').length !== 6}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              otp.join('').length === 6
                ? 'bg-[#4285F4] text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Did not receive code </span>
            <button
              onClick={handleResendOTP}
              disabled={resendTimer > 0}
              className={`font-medium ${
                resendTimer > 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:underline'
              }`}
            >
              Resend
            </button>
            {resendTimer > 0 && (
              <span className="text-gray-500"> in 00:{resendTimer.toString().padStart(2, '0')} Secs</span>
            )}
          </div>
        </div>
      )}

      {/* Step 3: New Password */}
      {step === 'newPassword' && (
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-xl font-semibold text-center mb-6">Change Password</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retype Password</label>
            <div className="relative">
              <input
                type={showRetypePassword ? 'text' : 'password'}
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowRetypePassword(!showRetypePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showRetypePassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleUpdatePassword}
            disabled={loading || !newPassword || !retypePassword}
            className="w-full bg-[#4285F4] text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordSection;
