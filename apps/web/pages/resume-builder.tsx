'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ResumeBuilder() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to enhanced resume builder
    router.push('/enhanced-resume-builder');
  }, [router]);

  return (
    <>
      <Navbar />

      <main className="pt-24 px-6 max-w-2xl mx-auto min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4 text-blue-700">Redirecting to Enhanced Resume Builder...</h1>
          <p className="text-gray-600">
            We've upgraded our resume builder with advanced features including PDF generation, 
            WhatsApp integration, and job-specific tailoring.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
