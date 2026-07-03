'use client';

import React from 'react';

interface GoogleSignupProps {
  userType: 'student' | 'college' | 'recruiter';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

const GoogleSignup: React.FC<GoogleSignupProps> = ({ 
  userType, 
  onSuccess, 
  onError, 
  className = '' 
}) => {
  // Google Signup feature temporarily disabled for deployment stability
  return (
    <div className={`w-full bg-gray-100 text-gray-500 font-medium py-3 rounded-lg border-2 border-dashed border-gray-300 text-center ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-gray-400 font-bold text-lg">G</span>
        <span>Google Sign-up (Coming Soon)</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">Feature temporarily disabled</p>
    </div>
  );
};

export default GoogleSignup;
