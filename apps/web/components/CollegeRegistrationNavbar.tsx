import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import NotificationModal from './NotificationModal';

interface CollegeRegistrationNavbarProps {
  currentStep?: number;
  status?: 'pending' | 'approved' | 'rejected';
  isAfterSubmission?: boolean;
  registrationStatus?: string;
  collegeName?: string;
  userRole?: 'student' | 'college' | 'employer';
}

const CollegeRegistrationNavbar: React.FC<CollegeRegistrationNavbarProps> = ({ 
  currentStep = 1, 
  status = 'pending',
  isAfterSubmission = false,
  registrationStatus,
  collegeName = "College",
  userRole = 'college'
}) => {
  // Get first letter of college name (fallback to "C")
  const profileInitial = collegeName?.charAt(0).toUpperCase() || "C";
  
  // State for dropdown and notifications
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check if user is approved (dropdown should only show for approved users)
  // But notifications should be available for pending users too
  const isApproved = status === 'approved';
  const canShowNotifications = status === 'approved' || status === 'pending';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('collegeData');
    setIsDropdownOpen(false);
    router.push('/login');
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    setIsDropdownOpen(false);
    router.push(path);
  };

  // Use userRole prop to determine if this is a student
  const isStudentDashboard = userRole === 'student';

  return (
<nav className="bg-white border-b border-gray-200">
    <div className="flex items-center justify-between max-w-screen mx-auto px-6 h-16">

        {/* Logo Section */}
        <div className="flex items-center">
          <Link 
            href={isStudentDashboard ? "/dashboard/student" : "/"} 
            className="flex items-center space-x-3"
          >
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
          {userRole === 'student' && (
            <>
              <Link 
                href="/search-colleges" 
                className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors"
              >
                Colleges
              </Link>
              <span className="text-gray-400 font-medium cursor-not-allowed" title="Coming Soon">
                Pay Fees
              </span>
              <Link 
                href="/dashboard/student?section=jobs" 
                className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors"
              >
                Search Jobs
              </Link>
            </>
          )}
          
          {userRole === 'college' && (
            <>
              <span className="text-gray-400 font-medium cursor-not-allowed" title="Coming Soon">
                Post a Job
              </span>
              <span className="text-gray-400 font-medium cursor-not-allowed" title="Coming Soon">
                Collect Fees
              </span>
              <Link 
                href="/dashboard/college?tab=placements" 
                className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors"
              >
                Connect with Companies
              </Link>
            </>
          )}
          
          {userRole === 'employer' && (
            <>
              <Link 
                href="/dashboard/recruiter?section=post-job" 
                className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors"
              >
                Post a Job
              </Link>
              <Link 
                href="/dashboard/recruiter?section=connect-colleges" 
                className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors"
              >
                Connect with Colleges
              </Link>
            </>
          )}
        </div>

        {/* Profile Section */}
        <div className="relative flex items-center space-x-3" ref={dropdownRef}>
          {canShowNotifications && (
            <>
              {/* Notification Icon */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5V9a4 4 0 00-8 0v3l-5 5h5a3 3 0 006 0z" />
                  </svg>
                </button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </div>
              
              {/* Settings Icon - Show same as notifications for consistency */}
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
            </>
          )}
          
          {isApproved ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isStudentDashboard 
                    ? 'bg-green-100 text-green-600 border-2 border-green-300 hover:border-green-500 focus:ring-green-500' 
                    : 'border-2 border-gray-300 bg-white text-green-500 hover:border-green-500 focus:ring-green-500'
                }`}
                aria-label="Profile Menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {profileInitial}
              </button>

              {/* Dropdown Menu - Different for Students vs College/Employer */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  {isStudentDashboard ? (
                    /* Student Dropdown - Only Profile and Logout */
                    <>
                      <button
                        onClick={() => handleNavigation('/dashboard/student?section=profile')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </>
                  ) : (
                    /* College/Employer Dropdown - Full menu */
                    <>
                      <button
                        onClick={() => handleNavigation('/profile/setup')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>
                      
                      <button
                        onClick={() => handleNavigation('/dashboard/college')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0" />
                        </svg>
                        Dashboard
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button 
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold text-lg cursor-not-allowed"
              aria-label="Profile (Pending Approval)"
              disabled
            >
              {profileInitial}
            </button>
          )}
        </div>
      </div>
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onMarkAllRead={() => {
          // TODO: Implement mark all as read functionality
          console.log('Mark all notifications as read');
        }}
        onClearAll={() => {
          // TODO: Implement clear all notifications functionality
          console.log('Clear all notifications');
        }}
        onMarkAsRead={(notificationId) => {
          // TODO: Implement mark specific notification as read
          console.log('Mark notification as read:', notificationId);
        }}
        onDismiss={(notificationId) => {
          // TODO: Implement dismiss notification functionality
          console.log('Dismiss notification:', notificationId);
        }}
        onActionClick={(notification) => {
          // TODO: Implement action click functionality
          console.log('Action clicked for notification:', notification);
        }}
      />
    </nav>
  );
};

export default CollegeRegistrationNavbar;
