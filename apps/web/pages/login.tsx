'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';
// import { GoogleAuthProvider } from '../contexts/GoogleAuthContext'; // Temporarily disabled
import GoogleSignup from '../components/GoogleSignup';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const tabs = ['Student', 'College', 'Company'];
  const [activeTab, setActiveTab] = useState('Student');

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const role = payload.role;

        if (role === 'student') router.push('/dashboard/student');
        else if (role === 'recruiter') router.push('/dashboard/recruiter');
        else if (role === 'college_admin' || role === 'placement_officer' || role === 'college')
          router.push('/dashboard/college');
        else if (role === 'admin') router.push('/admin');
        else router.push('/login');
      } catch (error) {
        console.error('Error decoding token:', error);
        router.push('/login');
      }
    }
  }, [router]);

  // Prefetch sibling routes for snappier transitions
  useEffect(() => {
    router.prefetch('/login');
    router.prefetch('/college-login');
    router.prefetch('/company-login');
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'College') router.push('/college-login');
    else if (tab === 'Company') router.push('/company-login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      const { token } = response.data;

      localStorage.setItem('token', token);

      // Wait a moment to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const userId = payload.userId;
      const role = payload.role;

      // Validate that the user role matches student
      if (role !== 'student') {
        localStorage.removeItem('token');
        setError('Invalid account type for student login. Please use the correct login page.');
        return;
      }

      let url = '';
      if (role === 'student') {
        url = `${API_BASE_URL}${API_ENDPOINTS.STUDENT_BY_USER_ID(userId)}`;
      } else if (role === 'admin') {
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role);
        router.push('/admin');
        return;
      }

      if (url) {
        try {
          const profileResponse = await axios.get(url);
          localStorage.setItem('profileData', JSON.stringify(profileResponse.data));
          localStorage.setItem('userId', userId);
          localStorage.setItem('role', role);

          if (role === 'student' && (profileResponse.data as any).studentId) {
            // Check if there's a redirect query parameter
            const redirectUrl = router.query.redirect as string;
            if (redirectUrl) {
              router.push(redirectUrl);
            } else {
              router.push(`/dashboard/student?studentId=${(profileResponse.data as any).studentId}`);
            }
            return;
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      } else {
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role);
      }

      setTimeout(() => {
        // Check if there's a redirect query parameter
        const redirectUrl = router.query.redirect as string;
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (role === 'student') {
          router.push('/dashboard/student');
        } else {
          router.push('/login');
        }
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.response?.data?.message || 'Login failed';
      const redirectTo = err?.response?.data?.redirectTo;
      
      setError(errorMessage);
      
      // If backend suggests a redirect, show a helpful message
      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo);
        }, 3000);
      }
    }
  };

  const handleGoogleSignupSuccess = () => {
    setMessage('Google signup successful! Redirecting...');
    // The GoogleSignup component handles the redirection
  };

  const handleGoogleSignupError = (error: string) => {
    setError(error);
  };

  return (
    // GoogleAuthProvider temporarily disabled for deployment
    <>
      {/* Navbar - Show for College and Company tabs */}
      {(activeTab === 'Company' || activeTab === 'College') && (
        <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between max-w-screen mx-auto px-6 h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <Image 
                  src="/logo1.svg" 
                  alt="CampusPe Logo" 
                  width={140} 
                  height={40} 
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-8">
              {activeTab === 'College' && (
                <>
                  <Link 
                    href="/search-colleges" 
                    className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors"
                  >
                    Colleges
                  </Link>
                  <span className="text-gray-400 font-medium cursor-not-allowed" title="Coming Soon">
                    Post a Job
                  </span>
                  <span className="text-gray-400 font-medium cursor-not-allowed" title="Coming Soon">
                    Collect Fees
                  </span>
                  <span className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors cursor-pointer">
                    Connect with Companies
                  </span>
                </>
              )}
              
              {activeTab === 'Company' && (
                <>
                  <span className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors cursor-pointer">
                    Post a Job
                  </span>
                  <span className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors cursor-pointer">
                    Connect with Colleges
                  </span>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <div className={`min-h-screen bg-gradient-to-br from-[#edf9f8] via-white to-[#edf9f8] flex ${(activeTab === 'Company' || activeTab === 'College') ? 'pt-16' : ''}`}>
        {/* Left Side - Illustration */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#edf9f8] to-[#edf9f8] items-center justify-center p-12"
        >
        <motion.div layoutId="auth-illustration-card" className="text-center max-w-md">
          <motion.div
            layoutId="auth-illustration-img"
            className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center bg-transparent"
          >
            <img
              src="/wykfrtuwbtfwby3wi6428v4ywjer.png"
              alt="Student login illustration"
              className="w-full h-full object-contain"
            />
          </motion.div>

          <motion.h1 layoutId="auth-headline" className="text-3xl font-bold text-gray-800 mb-4">
            Search hundreds of <span className="text-blue-600">colleges in one go</span>
          </motion.h1>
          <motion.p layoutId="auth-subhead" className="text-gray-600 text-lg leading-relaxed">
            <span className="text-blue-600">Programs, fees, placements</span> - sorted in one view.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Right Side - Login Form (card animates height; shared layoutIds) */}
      <motion.div
        layoutId="auth-form-panel"
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative"
      >
        {/* Close Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X size={20} />
        </button>

        {/* Card wrapper */}
        <motion.div layoutId="auth-form-card" layout className="w-full max-w-md">
          <motion.h2 layoutId="auth-title" className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Welcome to your <span className="text-blue-600">Profile !!</span>
          </motion.h2>

          {/* Tabs with animated underline ONLY */}
          <div className="flex justify-center mb-8">
            <div className="relative flex w-full max-w-sm justify-between">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}

              {/* Animated underline */}
              <AnimatePresence>
                <motion.div
                  key={activeTab}
                  layoutId="underline"
                  className="absolute bottom-0 h-0.5 bg-blue-600"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    width: `${100 / tabs.length}%`,
                    left: `${tabs.indexOf(activeTab) * (100 / tabs.length)}%`,
                  }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Login Form with animated mount/unmount + height interpolation */}
          <AnimatePresence mode="popLayout">
            <motion.form
              key="student-form"
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
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

              {/* Error Message */}
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              
              {/* Success Message */}
              {message && <div className="text-green-500 text-sm text-center">{message}</div>}

              {/* Send OTP on WhatsApp */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password?type=student')}
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Forgot your password? Send OTP on
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"
                        fill="#25D366"
                      />
                    </svg>
                    WhatsApp
                  </span>
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Login
              </button>

              {/* Sign Up Link */}
              <div className="text-center text-sm">
                <span className="text-gray-600">I don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    const redirectUrl = router.query.redirect as string;
                    router.push(redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register');
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Create an Account!!
                </button>
              </div>

              {/* Google Sign Up */}
              <GoogleSignup 
                userType="student" 
                onSuccess={handleGoogleSignupSuccess}
                onError={handleGoogleSignupError}
              />
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </motion.div>
      </div>
    </>
    // GoogleAuthProvider closing tag removed
  );
}
