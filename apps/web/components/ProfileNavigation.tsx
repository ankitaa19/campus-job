import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface ProfileNavigationProps {
  currentUserType: 'student' | 'college' | 'recruiter';
  currentUserId: string;
  targetProfileType: 'student' | 'college' | 'recruiter';
  targetProfileId: string;
  targetProfileName: string;
  className?: string;
  showIcon?: boolean;
}

const ProfileNavigation: React.FC<ProfileNavigationProps> = ({
  currentUserType,
  currentUserId,
  targetProfileType,
  targetProfileId,
  targetProfileName,
  className = "text-blue-600 hover:text-blue-800",
  showIcon = true
}) => {
  const router = useRouter();

  const getProfileUrl = () => {
    switch (targetProfileType) {
      case 'student':
        return `/profile/student/${targetProfileId}`;
      case 'college':
        return `/profile/college/${targetProfileId}`;
      case 'recruiter':
        return `/profile/recruiter/${targetProfileId}`;
      default:
        return '#';
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconClass = "w-4 h-4 mr-2";
    
    switch (targetProfileType) {
      case 'student':
        return <span className={`${iconClass} inline-block`}>👨‍🎓</span>;
      case 'college':
        return <span className={`${iconClass} inline-block`}>🏫</span>;
      case 'recruiter':
        return <span className={`${iconClass} inline-block`}>🏢</span>;
      default:
        return null;
    }
  };

  // Check if user has permission to view this profile
  const canViewProfile = () => {
    // Own profile - always viewable
    if (currentUserId === targetProfileId) {
      return true;
    }

    // Cross-platform viewing rules
    switch (currentUserType) {
      case 'recruiter':
        // Recruiters can view student and college profiles
        return targetProfileType === 'student' || targetProfileType === 'college';
      
      case 'college':
        // Colleges can view student and recruiter profiles
        return targetProfileType === 'student' || targetProfileType === 'recruiter';
      
      case 'student':
        // Students can view college and recruiter profiles
        return targetProfileType === 'college' || targetProfileType === 'recruiter';
      
      default:
        return false;
    }
  };

  if (!canViewProfile()) {
    return (
      <span className="text-gray-400 cursor-not-allowed">
        {getIcon()}
        {targetProfileName}
      </span>
    );
  }

  return (
    <Link href={getProfileUrl()}>
      <a className={className}>
        {getIcon()}
        {targetProfileName}
      </a>
    </Link>
  );
};

export default ProfileNavigation;
