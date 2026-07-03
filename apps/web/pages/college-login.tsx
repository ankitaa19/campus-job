'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

export default function CollegeLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'college',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const tabs = ['Student', 'College', 'Company'];
  const [activeTab, setActiveTab] = useState('College');

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

        if (role === 'college_admin' || role === 'placement_officer' || role === 'college') {
          router.push('/dashboard/college');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [router]);

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
    if (tab === 'Student') {
      router.push('/login');
    } else if (tab === 'Company') {
      router.push('/company-login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/college-login`, {
        email: formData.email,
        password: formData.password
      });
      const { token } = response.data;

      localStorage.setItem('token', token);

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

      // Validate that the user role matches college roles
      if (!['college', 'college_admin', 'placement_officer'].includes(role)) {
        localStorage.removeItem('token');
        setError('Invalid account type for college login. Please use the correct login page.');
        return;
      }

      try {
        const profileResponse = await axios.get(
          `${API_BASE_URL}${API_ENDPOINTS.COLLEGE_BY_USER_ID(userId)}`
        );
        localStorage.setItem('profileData', JSON.stringify(profileResponse.data));
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }

      setTimeout(() => {
        router.push('/dashboard/college');
      }, 100);
    } catch (err: any) {
      console.error('College login error:', err);
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Illustration (shares layoutId with other login pages) */}
      <motion.div
        layoutId="auth-illustration-panel"
        className="hidden lg:flex lg:w-1/2 bg-[#EDF9F8] items-center justify-center p-12"
      >
        <motion.div layoutId="auth-illustration-card" className="text-center max-w-md">
          <motion.div
            layoutId="auth-illustration-img"
            className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center bg-transparent"
          >
            <img
              src="/gceuyvgt3w4tbc34tvh3re.png"
              alt="College login illustration"
              className="w-full h-full object-contain"
            />
          </motion.div>

          <motion.h1 layoutId="auth-headline" className="text-3xl font-bold text-gray-800 mb-4">
            Boost your <span className="text-blue-600">online presence</span>
          </motion.h1>
          <motion.p layoutId="auth-subhead" className="text-gray-600 text-lg leading-relaxed">
            Connect with thousands of students instantly and showcase your college programs online.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Right Side - Login Form */}
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

        {/* Card wrapper animates height between pages */}
        <motion.div layoutId="auth-form-card" layout className="w-full max-w-md">
          <motion.h2 layoutId="auth-title" className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Welcome to your <span className="text-blue-600">Profile !!</span>
          </motion.h2>

          {/* Tabs with animated underline ONLY (no form here) */}
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

          {/* Form mounts/unmounts smoothly and animates height */}
          <AnimatePresence mode="popLayout">
            <motion.form
              key="college-form"
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

              {/* Forgot Password Link */}
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password?type=college')}
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200"
                >
                  Forgot your password?
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
                  onClick={() => router.push('/register')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}