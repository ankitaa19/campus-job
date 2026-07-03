import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const ApprovalPending: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Get the type from query parameters if available
    const { type } = router.query;
    
    // Redirect to the new approval-status page with the same type parameter
    const redirectUrl = type ? `/approval-status?type=${type}` : '/approval-status';
    router.push(redirectUrl);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to approval status...</p>
      </div>
    </div>
  );
};

export default ApprovalPending;
