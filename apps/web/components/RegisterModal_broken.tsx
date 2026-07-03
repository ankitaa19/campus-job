'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import { useModals } from '../utils/useModals';

type UserType = 'student' | 'college' | 'company';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: UserType;
}

// Animation data for the left panel with cycling animations
const leftPanelData = {
  student: [
    {
      image: "/wykfrtuwbtfwby3wi6428v4ywjer.png",
      title: "Search hundreds of colleges in one go",
      subtitle: "Programs, fees, placements - sorted in one view.",
      bgGradient: "from-yellow-300 via-yellow-400 to-orange-400"
    },
    {
      image: "/bwcykufbcucantu3fr3c462eyg.png", 
      title: "Find best college or jobs with us",
      subtitle: "100% Match guarantee for your career goals.",
      bgGradient: "from-green-300 via-green-400 to-teal-400"
    }
  ],
  college: [
    {
      image: "/bwcykufbcucantu3fr3c462eyg.png",
      title: "Boost your online presence", 
      subtitle: "Connect with thousands of students instantly and showcase your college programs online.",
      bgGradient: "from-blue-300 via-blue-400 to-purple-400"
    }
  ],
  company: [
    {
      image: "/wykfrtuwbtfwby3wi6428v4ywjer.png",
      title: "Hire interns & fresh graduates",
      subtitle: "Connect with job-ready students from verified colleges - faster, smarter.",
      bgGradient: "from-orange-300 via-orange-400 to-red-400"
    }
  ]
};

export default function RegisterModal({ isOpen, onClose, defaultTab = 'student' }: RegisterModalProps) {
  const router = useRouter();
  const { openLoginModal } = useModals();
  const [activeTab, setActiveTab] = useState<UserType>(defaultTab);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);

  // Auto-slide animation for left panel (only for student which has multiple slides)
  useEffect(() => {
    const slides = leftPanelData[activeTab];
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000); // Change slide every 4 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Reset slide when user type changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeTab]);

  // Update tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Route to appropriate registration page
    onClose();
    
    if (activeTab === 'student') {
      router.push('/register/student');
    } else if (activeTab === 'college') {
      router.push('/register/college');
    } else if (activeTab === 'company') {
      router.push('/register/company');
    }
  };

  const handleSwitchToLogin = () => {
    onClose();
    openLoginModal(activeTab);
  };

  const tabs = [
    { key: 'student' as UserType, label: 'Student' },
    { key: 'college' as UserType, label: 'College' },
    { key: 'company' as UserType, label: 'Company' }
  ];

  const currentData = leftPanelData[activeTab][currentSlide];

  // Get placeholder text based on user type
  const getPlaceholderText = () => {
    switch (activeTab) {
      case 'student':
        return {
          name: 'Full Name',
          email: 'Mobile number',
          phone: 'Mobile number'
        };
      case 'college':
        return {
          name: 'College Name',
          email: 'College email Id',
          phone: 'College Contact Number'
        };
      case 'company':
        return {
          name: 'Company name',
          email: 'Company email Id',
          phone: 'Company Contact Number'
        };
    }
  };

  const placeholders = getPlaceholderText();

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex min-h-[600px]">
            {/* Left Side - Animated Illustration */}
            <motion.div
              key={`${activeTab}-${currentSlide}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${currentData.bgGradient} items-center justify-center p-12 relative overflow-hidden`}
            >
              {/* Background decorative elements */}
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
                <div className="absolute bottom-20 right-15 w-16 h-16 bg-white bg-opacity-15 rounded-full"></div>
                <div className="absolute top-1/2 right-10 w-8 h-8 bg-white bg-opacity-20 rounded-full"></div>
              </div>
              
              <div className="text-center max-w-md z-10 relative">
                {/* Main illustration */}
                <motion.div
                  key={`illustration-${activeTab}-${currentSlide}`}
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="relative w-72 h-72 mx-auto mb-8 flex items-center justify-center"
                >
                  <img
                    src={currentData.image}
                    alt={`${activeTab} illustration`}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </motion.div>

                {/* Content */}
                <motion.div
                  key={`content-${activeTab}-${currentSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                    {currentData.title.includes('colleges') ? (
                      <>
                        Search hundreds of <br />
                        <span className="text-blue-600">colleges in one go</span>
                      </>
                    ) : currentData.title.includes('online') ? (
                      <>
                        Boost your <span className="text-blue-600">online<br />presence</span>
                      </>
                    ) : (
                      <>
                        Hire interns & <br />
                        <span className="text-blue-600">fresh graduates</span>
                      </>
                    )}
                  </h1>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {currentData.subtitle.includes('Programs') ? (
                      <>
                        <span className="text-blue-600 font-medium">Programs, fees, placements</span> - sorted<br />in one view.
                      </>
                    ) : (
                      currentData.subtitle
                    )}
                  </p>
                </motion.div>

                {/* Slide indicators for student (multiple slides) */}
                {leftPanelData[activeTab].length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center mt-8 space-x-2"
                  >
                    {leftPanelData[activeTab].map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          index === currentSlide ? 'bg-blue-600' : 'bg-white bg-opacity-40'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>

              {/* Form Card */}
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    Create an <span className="text-blue-600">Account !!</span>
                  </h2>

                  {/* Tabs */}
                  <div className="flex justify-center mb-8 mt-6">
                    <div className="flex bg-gray-50 rounded-lg p-1 w-full max-w-sm">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                            activeTab === tab.key 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <div>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder={placeholders.name}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                        required
                      />
                    </div>

                    {/* Email/Phone Input */}
                    <div>
                      <input
                        type={activeTab === 'student' ? 'tel' : 'email'}
                        name={activeTab === 'student' ? 'phone' : 'email'}
                        value={activeTab === 'student' ? formData.phone : formData.email}
                        onChange={handleInputChange}
                        placeholder={activeTab === 'student' ? placeholders.phone : placeholders.email}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                        required
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        required
                      />
                      <label className="text-sm text-gray-600">
                        I have read and agree with all terms and conditions.
                      </label>
                    </div>

                    {/* Sign Up Button */}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Sign up
                    </button>

                    {/* Switch to Login */}
                    <div className="text-center">
                      <span className="text-gray-600">Already have an account? </span>
                      <button
                        type="button"
                        onClick={handleSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Login
                      </button>
                    </div>

                    {/* Google Sign Up */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-gray-700 font-medium">Sign up with google</span>
                    </button>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
