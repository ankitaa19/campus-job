import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import NotificationModal from './NotificationModal';

interface CompanyRegistrationNavbarProps {
  currentStep?: number;
  status?: 'pending' | 'approved' | 'rejected';
  isAfterSubmission?: boolean;
  registrationStatus?: string;
  companyName?: string;
}

const CompanyRegistrationNavbar: React.FC<CompanyRegistrationNavbarProps> = ({ 
  currentStep = 1, 
  status = 'pending',
  isAfterSubmission = false,
  registrationStatus,
  companyName = "Company"
}) => {
  // Get first letter of company name (fallback to "C")
  const profileInitial = companyName?.charAt(0).toUpperCase() || "C";
  
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
    localStorage.removeItem('recruiterData');
    setIsDropdownOpen(false);
    router.push('/login');
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    setIsDropdownOpen(false);
    router.push(path);
  };

  return (
<nav className="bg-white border-b border-gray-200">
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
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/dashboard/recruiter?section=post-job" className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors">
            Post a Job
          </Link>
          <Link href="/dashboard/recruiter?section=jobs" className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors">
            Manage Jobs
          </Link>
          <Link href="/dashboard/recruiter?section=connect-colleges" className="text-gray-700 hover:text-[#0270DF] font-medium transition-colors">
            Connect with Colleges
          </Link>
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
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white text-green-500 font-bold text-lg hover:border-green-500 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Profile Menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {profileInitial}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleNavigation('/profile/company-setup')}
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
      />
    </nav>
  );
};

export default CompanyRegistrationNavbar;
