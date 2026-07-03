import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const VerificationProgress: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to approval-status page
    router.push('/approval-status');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to verification status...</p>
      </div>
    </div>
  );
};

export default VerificationProgress;
