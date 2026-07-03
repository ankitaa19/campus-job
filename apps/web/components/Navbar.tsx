import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { useModals } from '../utils/useModals';

export default function Navbar() {
  const router = useRouter();
  const pathname = router.pathname;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isApprovalPending, setIsApprovalPending] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCollegesDropdownOpen, setIsCollegesDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('engineering');
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>('B.Tech');
  const collegesDropdownRef = useRef<HTMLDivElement>(null);

  // Modal management
  const {
    loginModal,
    registerModal,
    openLoginModal,
    openRegisterModal,
    closeLoginModal,
    closeRegisterModal,
  } = useModals();

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collegesDropdownRef.current && !collegesDropdownRef.current.contains(event.target as Node)) {
        setIsCollegesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auth + role state from token
  useEffect(() => {
    if (!isHydrated) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
        const parsedRole = payload.role || null;
        setRole(parsedRole);

        // Check if we're on approval pending page
        setIsApprovalPending(pathname?.includes('approval-status') ?? false);

        // Check approval status for college/recruiter roles
        if (parsedRole === 'college' || parsedRole === 'recruiter') {
          void checkApprovalStatus(parsedRole);
        } else {
          setIsApproved(true); // Students don't need approval
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setRole(null);
        setIsApproved(false);
      }
    } else {
      setRole(null);
      setIsApproved(false);
    }
  }, [pathname, isHydrated]);

  const checkApprovalStatus = async (userRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        setIsApproved(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint =
        userRole === 'college'
          ? `${baseUrl}/api/colleges/user/${userId}`
          : `${baseUrl}/api/recruiters/user/${userId}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setIsApproved(Boolean(data?.approvalStatus === 'approved' && data?.isActive));
      } else {
        setIsApproved(false);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setIsApproved(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setRole(null);
    setIsApproved(false);
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  // Field > Course > Stream hierarchy data
  const mainCategories = [
    { label: 'Engineering', key: 'engineering', hasSubmenu: true },
    { label: 'Management', key: 'management', hasSubmenu: true },
    { label: 'Computer Applications', key: 'computer-applications', hasSubmenu: true },
    { label: 'Commerce', key: 'commerce', hasSubmenu: true },
    { label: 'Sciences', key: 'sciences', hasSubmenu: true },
    { label: 'Arts', key: 'arts', hasSubmenu: true },
  ];

  // Field > Course > Stream mapping
  const COURSE_STREAM_MAPPING: { [field: string]: { [course: string]: string[] } } = {
    'engineering': {
      'B.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
      'M.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
    },
    'management': {
      'MBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology'],
      'BBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology'],
    },
    'computer-applications': {
      'MCA': ['Software Engineering', 'Data Science', 'Cyber Security', 'Cloud Computing', 'AI & ML', 'Mobile Application Development'],
      'BCA': ['Software Engineering', 'Data Science', 'Cyber Security', 'Cloud Computing', 'AI & ML', 'Web Development'],
    },
    'commerce': {
      'B.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'E-Commerce', 'Business Management'],
      'M.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'E-Commerce', 'Business Management'],
    },
    'sciences': {
      'B.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
      'M.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
    },
    'arts': {
      'BA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
      'MA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
    },
  };

  const navItems = [
    { href: '/employers', label: 'Employers', disabled: true },
    { href: '/jobs', label: 'Jobs' },
    { href: '/pay-fees', label: 'Pay Fees', disabled: true },
  ];

  const isLandingPage = pathname === '/';
  const showPublicActions = isLandingPage || !isLoggedIn;
  const isStudent = role === 'student';
  const isRecruiter = role === 'recruiter';
  const isCompany = role === 'company';
  const isCollegeRole = role === 'college' || role === 'college_admin' || role === 'placement_officer';

  const navConfig = (() => {
    // Unauthenticated or landing: default public nav
    if (!isLoggedIn) {
      return { showColleges: true, items: navItems };
    }

    // Student view
    if (isStudent) {
      return {
        showColleges: true,
        items: [
          { href: '/pay-fees', label: 'Pay Fees', disabled: true },
          { href: '/jobs', label: 'Search Jobs' },
        ],
      };
    }

    // Recruiter view
    if (isRecruiter) {
      return {
        showColleges: false,
        items: [
          { href: '/dashboard/recruiter?section=post-job', label: 'Post a Job' },
          { href: '/dashboard/recruiter?section=connect-colleges', label: 'Connect with Colleges' },
        ],
      };
    }

    // Company view
    if (isCompany) {
      return {
        showColleges: false,
        items: [
          { href: '/dashboard/company?section=post-job', label: 'Post a Job' },
          { href: '/dashboard/company?section=colleges', label: 'Connect Colleges' },
        ],
      };
    }

    // College / placement officer view
    if (isCollegeRole) {
      return {
        showColleges: false,
        items: [
          { href: '/dashboard/college?tab=post-job', label: 'Post a Job', disabled: true },
          { href: '/dashboard/college?tab=fees', label: 'Collect Fees', disabled: true },
          { href: '/dashboard/college?tab=connections', label: 'Connect with Companies' },
        ],
      };
    }

    // Fallback for other roles/admin
    return { showColleges: true, items: navItems };
  })();

  const canAccessDashboard = () => {
    if (!isLoggedIn || !role) return false;
    if (role === 'student') return true;
    if ((role === 'college' || role === 'recruiter') && isApproved) return true;
    return false;
  };

  const getDashboardLink = () => {
    if (role === 'student') return '/dashboard/student';
    if (role === 'recruiter') return '/dashboard/recruiter';
    if (role === 'college_admin' || role === 'placement_officer' || role === 'college') return '/dashboard/college';
    if (role === 'admin') return '/admin';
    return '/login';
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm"
        role="navigation"
        aria-label="Primary"
      >
        <div className="w-full px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Image 
                  src="/logo1.svg" 
                  alt="CampusPe" 
                  width={112} 
                  height={32} 
                  className="h-8 w-auto" 
                  priority 
                />
              </Link>
            </div>

            {/* Center: Navigation Items (Desktop) */}
            <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {/* Colleges Dropdown */}
              {navConfig.showColleges && (
                <div className="relative" ref={collegesDropdownRef}>
                  <Link
                    href="/search-colleges"
                    onMouseEnter={() => {
                      setIsCollegesDropdownOpen(true);
                      setSelectedCategory('engineering');
                      setExpandedSubcategory('B.Tech');
                    }}
                    className="flex items-center gap-1 text-[15px] font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                  >
                    Colleges
                    <ChevronDown className={`h-4 w-4 transition-transform ${isCollegesDropdownOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* Colleges Dropdown Menu */}
                  <AnimatePresence>
                    {isCollegesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 mt-2 w-[650px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                        style={{ boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)' }}
                        onMouseEnter={() => setSelectedCategory('engineering')}
                      >
                        <div className="flex">
                          {/* Left Panel - Main Categories */}
                          <div className="w-[250px] bg-white border-r border-gray-100 py-4">
                            {mainCategories.map((category) => (
                              <div key={category.key}>
                                <button
                                  onMouseEnter={() => {
                                    setSelectedCategory(category.key);
                                    // Set first course as expanded when hovering over category
                                    const courses = COURSE_STREAM_MAPPING[category.key];
                                    if (courses) {
                                      const firstCourse = Object.keys(courses)[0];
                                      setExpandedSubcategory(firstCourse);
                                    }
                                  }}
                                  onClick={() => {
                                    router.push(`/search-colleges?category=${category.key}`);
                                    setIsCollegesDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-6 py-3 text-[15px] font-medium transition-colors flex items-center justify-between ${
                                    selectedCategory === category.key
                                      ? 'text-blue-600 bg-blue-50' 
                                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {category.label}
                                  <ChevronDown className="h-4 w-4 -rotate-90" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Right Panel - Courses and Streams */}
                          <div className="flex-1 py-4 px-6 max-h-[500px] overflow-y-auto">
                            {COURSE_STREAM_MAPPING[selectedCategory] && (
                              <div className="space-y-3">
                                {Object.entries(COURSE_STREAM_MAPPING[selectedCategory]).map(([courseName, streams], index) => (
                                  <div key={index} className="mb-4">
                                    <button
                                      onClick={() => {
                                        if (expandedSubcategory === courseName) {
                                          setExpandedSubcategory(null);
                                        } else {
                                          setExpandedSubcategory(courseName);
                                        }
                                      }}
                                      className="flex items-center justify-between w-full text-left mb-2"
                                    >
                                      <h3 className="text-[15px] font-semibold text-blue-600">
                                        {courseName}
                                      </h3>
                                      <ChevronDown 
                                        className={`h-4 w-4 text-blue-600 transition-transform ${
                                          expandedSubcategory === courseName ? '' : '-rotate-90'
                                        }`} 
                                      />
                                    </button>
                                    
                                    {expandedSubcategory === courseName && streams.length > 0 && (
                                      <div className="space-y-1 ml-2">
                                        {streams.map((stream, streamIndex) => (
                                          <Link
                                            key={streamIndex}
                                            href={`/search-colleges?course=${encodeURIComponent(`${courseName} - ${stream}`)}`}
                                            className="block px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            onClick={() => setIsCollegesDropdownOpen(false)}
                                          >
                                            {stream}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Other Nav Items */}
              {navConfig.items.map((item) => (
                item.disabled ? (
                  <span
                    key={item.href}
                    className="text-[15px] font-medium text-gray-400 cursor-not-allowed py-2"
                    title="Coming Soon"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[15px] font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-4">
              {/* Desktop Actions - Hidden on mobile */}
              {!isHydrated ? (
                <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                  <div className="text-sm font-medium text-blue-700 cursor-default px-2 py-2">
                    Register{' '}
                    <span className="relative inline-block">
                      College
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] text-red-600 font-semibold animate-pulse whitespace-nowrap">Exclusive</span>
                    </span>
                  </div>
                  <Button variant="ghost" className="px-3 py-2 text-sm" disabled>
                    Login
                  </Button>
                  <Button className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700" disabled>
                    Get Started
                  </Button>
                </div>
              ) : showPublicActions ? (
                <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                  <button 
                    onClick={() => openRegisterModal('college')}
                    className="text-sm font-medium text-blue-700 hover:text-blue-600 transition-colors px-2 py-2"
                  >
                    Register{' '}
                    <span className="relative inline-block">
                      College
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] text-red-600 font-semibold animate-pulse whitespace-nowrap">Exclusive</span>
                    </span>
                  </button>
                  <Button 
                    onClick={() => openLoginModal('student')} 
                    variant="ghost" 
                    className="px-3 py-2 text-sm"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => openRegisterModal('student')} 
                    className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
                  >
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Notification Icon */}
                  <div className="relative">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">3</span>
                    </div>
                  </div>

                  {/* Settings Icon */}
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {/* User Profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">B</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence initial={false}>
            {isMobileMenuOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="lg:hidden overflow-hidden border-t border-gray-100"
              >
                <div className="py-4 space-y-4">
                  {/* Navigation Links */}
                  <nav className="space-y-1 px-4">
                    {/* Colleges - with expandable categories */}
                    {navConfig.showColleges && (
                      <div className="space-y-1">
                        <button
                          onClick={() => setIsCollegesDropdownOpen(!isCollegesDropdownOpen)}
                          className="flex items-center justify-between w-full py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg"
                        >
                          <span>Colleges</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isCollegesDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isCollegesDropdownOpen && (
                          <div className="pl-4 space-y-1 mt-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-2">
                              Categories
                            </div>
                            {mainCategories.map((category) => (
                              <Link
                                key={category.key}
                                href={`/search-colleges?category=${category.key}`}
                                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setIsCollegesDropdownOpen(false);
                                }}
                              >
                                {category.label}
                              </Link>
                            ))}
                            
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 mt-3">
                              Popular Courses
                            </div>
                            {COURSE_STREAM_MAPPING['engineering'] && Object.entries(COURSE_STREAM_MAPPING['engineering']).slice(0, 2).map(([courseName, streams]) => (
                              streams.slice(0, 3).map((stream, index) => (
                                <Link
                                  key={`${courseName}-${index}`}
                                  href={`/search-colleges?course=${encodeURIComponent(`${courseName} - ${stream}`)}`}
                                  className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setIsCollegesDropdownOpen(false);
                                  }}
                                >
                                  {courseName} - {stream}
                                </Link>
                              ))
                            ))}
                            
                            <Link
                              href="/search-colleges"
                              className="block py-2 text-sm font-semibold text-blue-600 mt-2"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsCollegesDropdownOpen(false);
                              }}
                            >
                              View All Colleges →
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Other nav items */}
                    {navConfig.items.map((item) => (
                      item.disabled ? (
                        <span
                          key={item.href}
                          className="block py-2 text-[15px] font-medium text-gray-400 cursor-not-allowed rounded-lg"
                        >
                          {item.label} (Coming Soon)
                        </span>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )
                    ))}
                  </nav>

                  {/* Actions */}
                  <div className="space-y-4 px-4">
                    {showPublicActions ? (
                      <>
                        <div className="mt-1">
                          <div className="text-[10px] font-semibold text-red-600 mb-0.5 ">Exclusive</div>
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              openRegisterModal('college');
                            }}
                            className="text-lg font-small text-gray-900 tracking-tight"
                          >
                            Register College
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 items-center">
                          <Button 
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              openLoginModal('student');
                            }}
                            variant="outline" 
                            className="w-full justify-center rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-medium py-2.5"
                          >
                            Login
                          </Button>

                          <Button 
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              openRegisterModal('student');
                            }}
                            className="w-full justify-center bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium py-2.5"
                          >
                            Get Started
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {canAccessDashboard() && (
                          <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-center rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-medium py-2.5">
                              Dashboard
                            </Button>
                          </Link>
                        )}

                        {isApproved && (role === 'recruiter' || role === 'college') && (
                          <Link href="/connect" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-center">
                              Connect
                            </Button>
                          </Link>
                        )}

                        {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                          <Link href={`/approval-status?type=${role}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full justify-center border-orange-200 text-orange-600">
                              Check Status
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full justify-center text-red-600 hover:text-red-700"
                        >
                          Logout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Modals */}
      <LoginModal 
        isOpen={loginModal.isOpen} 
        onClose={closeLoginModal}
        initialUserType={loginModal.defaultTab}
        onSwitchToRegister={openRegisterModal}
      />
      <RegisterModal 
        isOpen={registerModal.isOpen} 
        onClose={closeRegisterModal}
        initialUserType={registerModal.defaultTab}
      />
    </>
  );
}
