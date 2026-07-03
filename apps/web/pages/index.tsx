'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Star, 
  ArrowRight, 
  PlayCircle, 
  Users, 
  Building2, 
  GraduationCap,
  TrendingUp,
  Plus,
  Search,
  Briefcase,
  FileText,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  CreditCard
} from 'lucide-react';

import Navbar from '../components/Navbar';
import CollegeRegistrationNavbar from '../components/CollegeRegistrationNavbar';
import CompanyRegistrationNavbar from '../components/CompanyRegistrationNavbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  MotionCard, 
  FloatingElement, 
  FadeInView, 
  StaggerContainer, 
  StaggerItem 
} from '../components/ui/MotionComponents';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
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
        setUserRole(payload.role || null);
        
        // Fetch student info if role is student
        if (payload.role === 'student') {
          fetchStudentInfo(token);
        }
        // Fetch company info if role is recruiter
        else if (payload.role === 'recruiter') {
          fetchCompanyInfo(token);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const fetchStudentInfo = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success || response.data.data) {
        const studentData = response.data.data || response.data;
        setStudentName(`${studentData.firstName || 'Student'} ${studentData.lastName || ''}`);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchCompanyInfo = async (token: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success || response.data.data) {
        const recruiterData = response.data.data || response.data;
        setCompanyName(recruiterData.companyInfo?.companyName || 'Company');
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const stats = [
    { value: '2K+', label: 'Students Placed', icon: Users },
    { value: '150+', label: 'Partner Colleges', icon: Building2 },
    { value: '100+', label: 'Hiring Companies', icon: GraduationCap },
    { value: '80%', label: 'Success Rate', icon: TrendingUp }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Choose Your Path',
      description: 'Select whether you\'re a student, college, or company',
      icon: '🎯',
      color: 'from-blue-500 to-purple-500'
    },
    {
      step: '02',
      title: 'Complete Profile',
      description: 'Build your comprehensive profile with all relevant details',
      icon: '📝',
      color: 'from-green-500 to-blue-500'
    },
    {
      step: '03',
      title: 'Smart Matching',
      description: 'Our AI connects you with the best opportunities',
      icon: '💝',
      color: 'from-pink-500 to-red-500'
    },
    {
      step: '04',
      title: 'Achieve Success',
      description: 'Land your dream job, find perfect students, or build partnerships',
      icon: '🚀',
      color: 'from-orange-500 to-yellow-500'
    }
  ];

  const studentFeatures = [
    {
      icon: '🔍',
      title: 'Search hundreds',
      description: 'Find and compare colleges easily, all in one place.',
      subtitle: 'of colleges'
    },
    {
      icon: '📚',
      title: 'One form, many colleges',
      description: 'Apply to multiple colleges that suit you from Swayam, under, post-free.',
      subtitle: ''
    },
    {
      icon: '🚀',
      title: 'Start your career early',
      description: 'Explore and apply to part-time jobs, internships, and full-time jobs with your skill, interests, and career goals.',
      subtitle: ''
    },
    {
      icon: '💰',
      title: 'Hassle-free fee payments',
      description: 'Pay securely, save bank slips, get instant updates, and access student loans.',
      subtitle: ''
    }
  ];

  const collegeFeatures = [
    {
      icon: '👥',
      title: 'Struggling to Reach Students?',
      description: 'Boost your college\'s online presence and connect with thousands of students instantly.'
    },
    {
      icon: '🤝',
      title: 'Struggling to Bring Companies for Placements?',
      description: 'Connect directly with company HRs, schedule job drives, and increase placement opportunities for your students.'
    },
    {
      icon: '👨‍🎓',
      title: 'Missing Out on Student Leads?',
      description: 'Manage all admissions leads in one place. Track, follow up faster, and boost admissions.'
    },
    {
      icon: '💰',
      title: 'Messy Fee Collections?',
      description: 'Collect fees hassle-free through unique QR codes, capture student details and track everything in real-time.'
    }
  ];

  const companyFeatures = [
    {
      icon: '🎯',
      title: 'Struggling to Hire from the Right Colleges?',
      description: 'Hire fresh graduates and interns directly from premier colleges, including Tier I Tier II, for campus drives.'
    },
    {
      icon: '📋',
      title: 'Posting Jobs One by One?',
      description: 'Post jobs to multiple colleges at once based on your hiring criteria.'
    },
    {
      icon: '📊',
      title: 'Messy Hiring Process?',
      description: 'Track and manage every application in one simple dashboard.'
    },
    {
      icon: '⏰',
      title: 'Hiring Taking Too Much Time & Cost?',
      description: 'Save time with AI-powered applicant ranking by their hiring costs.'
    }
  ];

  const testimonials = [
    {
name: 'Angelina',
      role: 'American Girl Chief',
      avatar: '/88e21d9821e24bd22f3f4cd331e57683038b99c6.png',
      quote: 'Lorem ipsum lorem, calendar, timeline, kanban, and more! The easy-to-use, visual interface lets any team member jump in and get started, no training required.',
      rating: 5
    },
    {
      name: 'Sara Ferrmante',
      role: 'Head of CS',
      avatar: '/fd93682fe6f18f4cba2ab29e72ad44c57d791012.png',
      quote: 'We ensure that any information you need is stored immediately in our systems and can be retrieved by simply contacting our team!',
      rating: 5
    }
  ];

  const faqItems = [
    "What makes CampusPe different from other learning platforms?",
    "CampusPe focuses on project-based learning with real-world applications. Our courses are taught by industry experts currently working at top companies, and we provide comprehensive career support including resume reviews, interview prep, and job placement assistance.",
    "Do I get lifetime access to the courses?", 
    "What level of support do I get as a student?",
    "Are the certificates recognized by employers?",
    "Can I get a refund if I'm not satisfied?",
    "What if I'm a complete beginner?",
    "How much time do I need to commit to learning?",
    "Do you offer team or corporate training?"
  ];

  return (<>
    <div className="overflow-x-hidden">
      {isLoggedIn && userRole === 'student' ? (
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={studentName}
          userRole="student"
        />
      ) : isLoggedIn && userRole === 'recruiter' ? (
        <CompanyRegistrationNavbar 
          status="approved" 
          companyName={companyName}
        />
      ) : (
        <Navbar />
      )}
      
<section className="hero-section relative min-h-auto bg-white overflow-hidden w-full">
  <div 
    className="floating-elements absolute inset-0 overflow-hidden w-full h-full max-w-[100vw] max-h-[100%] sm:max-h-[90%] lg:max-h-[100%] pointer-events-none z-0"
  >

          <FloatingElement className="absolute top-32 left-20" duration={6}>
            <div className="w-4 h-4 bg-teal-400 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-48 right-32" duration={8}>
            <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-48 left-32" duration={7}>
            <div className="w-4 h-4 bg-purple-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-32 right-24" duration={9}>
            <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-1/2 left-1/4" duration={5}>
            <div className="w-2 h-2 bg-green-400 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-1/3 right-1/3" duration={6}>
            <div className="w-3 h-3 bg-pink-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-1/3 left-1/3" duration={4}>
            <div className="w-2 h-2 bg-orange-400 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-2/3 right-1/4" duration={7}>
            <div className="w-4 h-4 bg-indigo-400 rounded-full opacity-80"></div>
          </FloatingElement>
        </div>

<div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-8 sm:py-16 sm:pt-20 relative">

<div className="floating-images absolute inset-0 pointer-events-none hidden lg:block">
  {/* Top Left - Student in green striped shirt */}
  <FloatingElement duration={5} className="floating-image absolute top-12 left-12 z-0">
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className="overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer"
      style={{ borderRadius: '110px / 130px', width: 200, height: 300 }}
    >
      <Image
        src="/c31e00fa1e3a6aa0b76326f5b4b6c78555c1e960.png"
        alt="Student in green striped shirt"
        width={200}
        height={280}
        className="w-full h-full object-cover"
        style={{ borderRadius: '110px / 130px' }}
      />
    </motion.div>
  </FloatingElement>

  {/* Bottom Left - Female Student with Green Background */}
  <FloatingElement duration={7} className="floating-image absolute bottom-12 left-20 z-0">
    <motion.div
      whileHover={{ scale: 1.1, rotate: -5 }}
      className="overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer"
      style={{ borderRadius: '110px / 130px', width: 200, height: 290 }}
    >
      <Image
        src="/07d8c7576ff7b5bcd8eccf277fb5e24bffa55244.png"
        alt="Female Student with laptop"
        width={200}
        height={290}
        className="w-full h-full object-cover"
        style={{ borderRadius: '110px / 130px' }}
      />
    </motion.div>
  </FloatingElement>

  {/* Top Right - Student in dark sweater */}
  <FloatingElement duration={6} className="floating-image absolute top-12 right-12 z-0">
    <motion.div
      whileHover={{ scale: 1.1, rotate: -5 }}
      className="overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer"
      style={{ borderRadius: '110px / 130px', width: 200, height: 300 }}
    >
      <Image
        src="/59097144faeb455019e32469d7d11758d5fdaed4.png"
        alt="Student in dark sweater"
        width={200}
        height={300}
        className="w-full h-full object-cover"
        style={{ borderRadius: '110px / 130px' }}
      />
    </motion.div>
  </FloatingElement>

  {/* Bottom Right - Female Student with backpack */}
  <FloatingElement duration={4.5} className="floating-image absolute bottom-12 right-20 z-0">
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className="overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer"
      style={{ borderRadius: '110px / 130px', width: 200, height: 290 }}
    >
      <Image
        src="/3b4d5529440969da813eeb7824f7dd1c42a63f19.png"
        alt="Female student with backpack"
        width={200}
        height={290}
        className="w-full h-full object-cover"
        style={{ borderRadius: '110px / 130px' }}
      />
    </motion.div>
  </FloatingElement>
</div>


          {/* Centered Content */}
         <div className="hero-content text-center min-h-[30vh] sm:min-h-[70vh] flex flex-col justify-start items-center relative z-20 mx-auto max-w-6xl pt-8 sm:pt-16">

           <motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="hero-subtitle inline-flex items-center space-x-2 text-blue-700 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-3 rounded-full text-xs sm:text-sm lg:text-base xl:text-lg font-medium hover:transition-colors cursor-pointer mb-6 sm:mb-8 -mt-10"
>
  <Star className="w-4 h-4 sm:w-4 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
  <span>Your AI-Powered Education Journey</span>
</motion.div>

<motion.h1 
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  className="hero-title text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold text-gray-900 mb-8 sm:mb-12 lg:mb-16 max-w-4xl px-2 sm:px-0 text-center leading-[1.3]"
  style={{ fontFamily: 'Inter, sans-serif' }}
>
  <span className="block lg:inline">College <span className="text-[#2463EB]">Admissions</span> & Placements</span>
  <span className="block mt-2 lg:mt-0">
    Made Simple-On <span className="text-[#2463EB]">WhatsApp</span>
  </span>
</motion.h1>


            <motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="hero-cards grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6"
>
  {/* Jobs Card */}
  <motion.div 
    whileHover={{ scale: 1.02, y: -5 }}
    className="hero-card
      bg-white 
      w-full sm:w-[348px] 
      aspect-auto sm:aspect-[348/309] 
      p-4 sm:p-5 lg:p-6 
      rounded-xl sm:rounded-2xl 
      border border-blue-400 
      hover:border-blue-400 
      hover:bg-white 
      hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] 
      shadow-md sm:shadow-lg 
      transition-all duration-300 
      cursor-pointer 
      relative z-20 
      flex flex-col 
    "
  >
<div className="flex items-center justify-between space-x-3 sm:space-x-4 mb-3 sm:mb-4">
  {/* Text on the left */}
  <div className="text-left">
    <div className="inline-block text-xs sm:text-sm text-gray-600 font-medium bg-[#F3F4F6] rounded-full px-2 py-[2px]">
      15,000+ Opportunities
    </div>
    <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
      Jobs
    </div>
  </div>

  {/* Icon on the right */}
<div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white bg-gradient-to-br from-[#AD46FF] to-[#F6339A]">
  <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
</div>
</div>

    <p className="text-gray-600 sm:mt-4 text-[18px] sm:text-base text-left mb-1 sm:mb-2 font-medium">
      Find diverse career opportunities
    </p>
    <div className="text-xs sm:mt-4 sm:text-[16px] text-gray-500 text-left leading-snug ">
      Explore jobs, internships, and placements with AI-powered matching based on your skills and goals.
    </div>
  </motion.div>

  {/* Colleges Card */}
  <motion.div 
    whileHover={{ scale: 1.02, y: -5 }}
    className="hero-card
      bg-white 
      w-full sm:w-[348px] 
      aspect-auto sm:aspect-[348/309] 
      p-4 sm:p-5 lg:p-6 
      rounded-xl sm:rounded-2xl 
      border border-blue-400 
      hover:border-blue-400  
      hover:bg-white 
      hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] 
      shadow-md sm:shadow-lg 
      transition-all duration-300 
      cursor-pointer 
      relative z-20 
      flex flex-col 
    "
  >
<div className="flex items-center justify-between space-x-3 sm:space-x-4 mb-3 sm:mb-4">
  {/* Text on the left */}
  <div className="text-left">
    <div className="inline-block text-xs sm:text-sm text-gray-600 font-medium bg-[#F3F4F6] rounded-full px-2 py-[2px]">
      1200+ Colleges
    </div>
    <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
      Colleges
    </div>
  </div>

  {/* Icon on the right */}
<div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white bg-gradient-to-br from-[#337BFF] to-[#5D62FF]">
  <Building2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
</div>
</div>

    <p className="text-gray-600 sm:mt-4 text-[18px] sm:text-base text-left mb-1 sm:mb-2 font-medium">
      Simplify your college admissions
    </p>
    <div className="text-xs sm:mt-4 sm:text-[16px] text-gray-500 text-left leading-snug">
      Explore top colleges and programs, apply once, pay fees instantly, and grab spot admission offers.
    </div>
  </motion.div>
</motion.div>

          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="pt-4 sm:pt-8 lg:pt-6 pb-4 sm:pb-8 lg:pb-6 bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <p className="text-blue-600 font-medium mb-4 text-sm sm:text-base"> Who It's For</p>

            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
              Built for <span className="text-blue-600">Students</span>, <span className="text-blue-600">Colleges</span> & <span className="text-blue-600">Companies</span>
            </h1>
          </motion.div>

        {/* For Students - Content Left, Image Right */}
<div className="mb-12 sm:mb-16 lg:mb-20">
  <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
    
    {/* Left side - Content */}
    <div className="space-y-4 sm:space-y-6 relative order-last lg:order-first">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8 text-center"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-[#2463EB]">
          For Students
        </h3>
      </motion.div>      {/* Feature 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 
                   hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 
                   transition-all duration-300 cursor-pointer lg:ml-8"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">
              Search hundreds <span className="text-[#2463EB]">of colleges</span>
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Find and compare colleges easily, all in one place.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Feature 2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 
                   hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 
                   transition-all duration-300 lg:ml-auto cursor-pointer lg:mr-8"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
              <span className="text-blue-600">One form,</span> many colleges
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Apply to multiple colleges with one simple form — faster, easier, stress-free.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Feature 3 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 
                   hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 
                   transition-all duration-300 cursor-pointer lg:ml-8"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
              Start <span className="text-[#2463EB]">your career early</span>
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Explore and apply to part-time jobs, internships, and full-time roles with real-time alerts.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Feature 4 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 
                   hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 
                   transition-all duration-300 lg:ml-auto cursor-pointer lg:mr-8"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
              <span className="text-[#2463EB]">Hassle-free</span> fee payments
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pay securely, save bank slips, get instant updates, and access student loans.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="pt-4 sm:pt-6 text-center"
      >
        <button className="bg-gradient-to-r from-[#2463EB] to-[#064BB3] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-[#064BB3] hover:to-[#2463EB] hover:scale-105 hover:shadow-2xl transition-all duration-300 font-semibold text-base sm:text-lg shadow-lg w-full sm:w-auto">
          Explore Colleges & Jobs
        </button>
      </motion.div>
    </div>

   {/* Right side - Image */}
<motion.div 
  initial={{ opacity: 0, x: 50 }}
  whileInView={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6 }}
  className="relative flex items-center justify-center h-full order-first lg:order-last"
>
  <div className="w-full h-[320px] sm:h-[420px] lg:h-[520px] rounded-2xl overflow-hidden shadow-2xl">
    <Image
      src="/hwdiuweh77.png"
      alt="Students sitting together"
      width={1500}
      height={1600}
      className="w-full h-full object-cover"
      priority
    />
  </div>
</motion.div>

          {/* Close Students grid and section wrappers */}
          </div>
        </div>

          {/* For Colleges - Images Left, Content Right */}
          <div className="mb-16 sm:mb-20 lg:mb-24">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left side - Images Grid */}
              <div className="relative order-first"> {/* Images grid fixed to match Students/Companies height */}
                <div className="w-full h-[320px] sm:h-[420px] lg:h-[520px]">
                  <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 h-full">
                  {/* Top left */}
                 <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer h-[150px] sm:h-[200px] lg:h-[250px]"
>
                    <Image
                      src="/9b8314d0fa4d8e29be5d546499a9494a0c5b8dc7.jpg"
                      alt="College building"
                      width={200}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Top right */}
                 <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer h-[150px] sm:h-[200px] lg:h-[250px]"
>
                    <Image
                      src="/59a78b0511f4680d63e4da78954e55d310d7f67b.jpg"
                      alt="College campus"
                      width={200}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Bottom - Full width */}
                <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer col-span-2 h-[150px] sm:h-[200px] lg:h-[250px]"
>
                    <Image
                      src="/c5b0a7b4156f17ba1a6a8a2ad3549156ff210e7f.jpg"
                      alt="Students in college"
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  </div>
                </div>
              </div>

              {/* Right side - Content Cards with alternating positions */}
              <div className="space-y-4 sm:space-y-6 relative order-last lg:order-last">
                {/* Title centered above the cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="mb-8 sm:mb-12 text-center"
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2463EB]">For Colleges</h3>
                </motion.div>

                {/* Feature 1 - Struggling to Reach Students - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}

                  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300 lg:ml-8 cursor-pointer"
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        Struggling to <span className="text-[#2463EB]">Reach Students?</span>
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Boost your college's online presence and connect with thousands of students instantly.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2 - Struggling to Bring Companies - Left positioned */}
                <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-auto cursor-pointer lg:mr-8"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        Struggling to <span className="text-blue-600">Bring</span> Companies for Placements?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Connect directly with company HRs, invite them for campus drives, and increase opportunities for your students.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 - Missing Out on Student Leads - Right positioned */}
               <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-8 cursor-pointer"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        <span className="text-[#2463EB]">Missing Out</span> on Student Leads?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Manage all admissions leads in one place. Track, follow up faster, and boost admissions.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 4 - Messy Fee Collections - Left positioned */}
               <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-auto cursor-pointer lg:mr-8"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        <span className="text-blue-600">Messy Fee</span> Collections?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Collect fees hassle-free through unique QR codes, capture student details and track everything in real-time.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Register Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}

                  className="pt-4 sm:pt-6 text-center"
                >
                  <button className="bg-gradient-to-r from-[#2463EB] to-[#064BB3] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-[#064BB3] hover:to-[#2463EB] transition-all duration-300 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl w-full sm:w-auto">
                    Register as a College
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* For Companies - Content Left, Image Right */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left side - Content Cards with alternating positions */}
              <div className="space-y-4 sm:space-y-6 relative order-last lg:order-first">
                {/* Title centered above the cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8 text-center"
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2463EB]">For Companies</h3>
                </motion.div>

                {/* Feature 1 - Struggling to Hire from Right Colleges - Right positioned */}
              <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-8 cursor-pointer"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        Struggling to <span className="text-[#2463EB]">Hire from the Right Colleges?</span>
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Hire fresh graduates and interns directly from premier colleges, including Tier I Tier II, for campus drives.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2 - Posting jobs One by One - Left positioned */}
                <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-auto cursor-pointer lg:mr-8"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        <span className="text-blue-600">Posting jobs</span> One by One?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Post jobs to multiple colleges at once based on your hiring criteria.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 - Messy Hiring Process - Right positioned */}
               <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-8 cursor-pointer"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        <span className="text-[#2463EB]">Messy</span> Hiring Process?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Track and manage every application in one simple dashboard.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 4 - Hiring Taking Too Much Time & Cost - Left positioned */}
               <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-[#FEFBFB] p-4 sm:p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 lg:ml-auto cursor-pointer lg:mr-8"
>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2463EB] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                        <span className="text-blue-600">Hiring Taking</span> Too Much Time & Cost?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Save time with AI-powered applicant ranking by their hiring costs.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Register Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}

                  className="pt-4 sm:pt-6 text-center"
                >
                  <button className="bg-gradient-to-r from-[#2463EB] to-[#064BB3] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-[#064BB3] hover:to-[#2463EB] transition-all duration-300 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl w-full sm:w-auto">
                    Register as a Company
                  </button>
                </motion.div>
              </div>

              {/* Right side - Image (match Students image sizing) */}
              <div className="relative order-first lg:order-last ">
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="relative flex items-center justify-center h-full"
                >
                  <div className="w-full h-[280px] sm:h-[360px] lg:h-[440px] rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/035983e2bf746be19a4ec95fcd501fd434b3a9c3.jpg"
                      alt="Company meeting room with team collaboration"
                      width={1500}
                      height={1600}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How CampusPe Platform Works Section */}
      <section className="py-4 sm:py-8 lg:py-12 bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}

            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How CampusPe <span className="text-blue-600">Platform Works</span>
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Simple steps to connect talent with opportunity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.03 }}
  className="bg-[#FEFBFB] p-8 rounded-3xl shadow-lg border border-gray-100 
             hover:border-transparent hover:bg-[#FEFBFB] 
             hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:z-10 transform-gpu
             transition-all duration-300 text-center relative cursor-pointer z-0"
             
>
  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
      <CheckCircle className="w-6 h-6 text-white" />
    </div>
  </div>
  <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Your Path</h3>
  <p className="text-gray-600 text-sm leading-relaxed">
    Select whether you're a student, college, or company
  </p>
  
  {/* Step indicator */}
  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 ">
    <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      Step 01
    </div>
  </div>
</motion.div>

{/* Step 2 */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.03 }}
  className="bg-[#FEFBFB] p-8 rounded-3xl shadow-lg border border-gray-100 
             hover:border-transparent hover:bg-[#FEFBFB] 
             hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:z-10 transform-gpu
             transition-all duration-300 cursor-pointer relative text-center z-0"
>
  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
      <FileText className="w-6 h-6 text-white" />
    </div>
  </div>
  <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Profile</h3>
  <p className="text-gray-600 text-sm leading-relaxed">
    Build your comprehensive profile with all relevant details
  </p>
  
  {/* Step indicator */}
  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
    <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      Step 02
    </div>
  </div>
</motion.div>

{/* Step 3 */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.03 }}
  className="bg-[#FEFBFB] p-8 rounded-3xl shadow-lg border border-gray-100 
             hover:border-transparent hover:bg-[#FEFBFB] 
             hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:z-10 transform-gpu
             transition-all duration-300 text-center relative cursor-pointer z-0"
>
  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
      <Users className="w-6 h-6 text-white" />
    </div>
  </div>
  <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Matching</h3>
  <p className="text-gray-600 text-sm leading-relaxed">
    Our AI connects you with the best opportunities
  </p>
  
  {/* Step indicator */}
  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
    <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      Step 03
    </div>
  </div>
</motion.div>

{/* Step 4 */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.03 }}
  className="bg-[#FEFBFB] p-8 rounded-3xl shadow-lg border border-gray-100 
             hover:border-transparent hover:bg-[#FEFBFB] 
             hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:z-10 transform-gpu
             transition-all duration-300 text-center relative cursor-pointer z-0"
>
  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-white" />
    </div>
  </div>
  <h3 className="text-xl font-bold text-gray-900 mb-3">Achieve Success</h3>
  <p className="text-gray-600 text-sm leading-relaxed">
    Land your dream job, find perfect students, or build partnerships
  </p>
  
  {/* Step indicator */}
  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
    <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      Step 04
    </div>
  </div>
</motion.div>
          </div>
        </div>
      </section>

      {/* Save time with Automations Section */}
      <section className="pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-8 lg:pb-12 bg-[#FEFBFB]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left side - Content (First on mobile, left on desktop) */}
            <div className="order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}

                className="mb-6 sm:mb-8"
              >
                <div className="flex items-center space-x-2 mb-4">
                 <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"> Got Questions?
                 </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Save Time With <span className="text-blue-600">Automation</span>
                </h2>
                
                <div className="w-12 sm:w-16 h-1 bg-orange-400 rounded-full mb-6 sm:mb-8"></div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Students Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-lg">Students</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        WhatsApp alerts for so you can focus on what matters. CampusPe keeps everyone on track with instant alerts and smart workflows.
                      </p>
                    </div>
                  </motion.div>

                  {/* College Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-lg">College</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        Admissions lead assignment, fee tracking with unique QR codes, and real-time dashboards.
                      </p>
                    </div>
                  </motion.div>

                  {/* Companies Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-lg">Companies</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        AI-powered matching and one-click shortlists - reduce-time-to-hire and costs.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Right side - Circular Image with decorative elements (Second on mobile, right on desktop) */}
            <div className="relative order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg mx-auto h-56 sm:h-80 lg:h-96 flex items-center justify-center"
              >
                {/* Outer dashed circle - responsive sizing */}
                <div className="absolute inset-0 w-56 h-56 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full border-2 border-gray-300 border-dashed mx-auto"></div>
                
                {/* Inner gradient circle with image - responsive sizing */}
                <div className="relative w-48 h-48 sm:w-72 sm:h-72 lg:w-80 lg:h-80 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-2 sm:p-3">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <Image
                          src="/2af36fa8acaa80e0e2b028fea9915a5e0f5a2157.jpg"
                          alt="Woman using phone for automation"
                          width={320}
                          height={320}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating decorative dots - responsive positioning */}
                <FloatingElement duration={4} className="absolute top-8 sm:top-12 left-8 sm:left-12">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>
                
                <FloatingElement duration={5} className="absolute top-10 sm:top-16 right-6 sm:right-8">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-pink-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>
                
                <FloatingElement duration={6} className="absolute bottom-10 sm:bottom-16 left-6 sm:left-8">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>

                {/* Additional decorative dots for better balance */}
                <FloatingElement duration={7} className="absolute bottom-8 sm:bottom-12 right-8 sm:right-12">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-4 sm:py-8 lg:py-12 bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center bg-[#F5F3FF] rounded-3xl p-12 shadow-lg border border-gray-100"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 text-auto sm:text-lg mb-6 max-w-md mx-auto">
              Our support team is here to help you succeed. Get in touch anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-300">
                Contact Support
              </button>
              <button className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-colors duration-300">
                Schedule a Call
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-4 sm:py-8 lg:py-12 bg-[#FAFAFF] from-gray-50 to-blue-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            {/* Trust indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
  <div className="flex items-center space-x-1">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    ))}
  </div>
  <span className="text-gray-600 text-sm">Trusted by 50,000+ users</span>
</div>

            {/* Main heading */}
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Career Starts Here  <span className="text-blue-600">Don't Wait</span>
            </h2>
            
            <p className="text-gray-600 text-auto max-w-3xl mx-auto mb-8">
              Whether you're a student aiming for your dream job, a college looking to empower placements, or a 
              company hiring the next big talent — we've built the perfect platform for you.
            </p>

            {/* Action buttons */}
         <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
  {/* Student */}
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold 
               flex items-center justify-center space-x-2 transition-colors duration-300"
  >
    <GraduationCap className="w-5 h-5" />
    <span>Join as a Student</span>
    <ArrowRight className="w-4 h-4" />
  </motion.button>
  
  {/* College */}
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl 
               font-semibold flex items-center justify-center space-x-2 transition-colors duration-300"
  >
    <Building2 className="w-5 h-5" />
    <span>Join as a College</span>
    <ArrowRight className="w-4 h-4" />
  </motion.button>
  
  {/* Employer */}
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl 
               font-semibold flex items-center justify-center space-x-2 transition-colors duration-300"
  >
    <Briefcase className="w-5 h-5" />
    <span>Join as an Employer</span>
    <ArrowRight className="w-4 h-4" />
  </motion.button>
</div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">2K+</div>
                <div className="text-gray-600 text-sm font-medium">Students Placed</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">150+</div>
                <div className="text-gray-600 text-sm font-medium">Partner Colleges</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">100+</div>
                <div className="text-gray-600 text-sm font-medium">Hiring Companies</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">80%</div>
                <div className="text-gray-600 text-sm font-medium">Success Rate</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  </>);
}
