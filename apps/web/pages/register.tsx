'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'recruiter' | 'college' | null>(null);

  const handleRoleSelection = (role: 'student' | 'recruiter' | 'college') => {
    setSelectedRole(role);
    // Redirect to role-specific registration page with redirect parameter if present
    const redirectUrl = router.query.redirect as string;
    router.push(redirectUrl ? `/register/${role}?redirect=${encodeURIComponent(redirectUrl)}` : `/register/${role}`);
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Join Our Platform</h1>
          <p className="text-lg text-gray-600">Choose your role to get started with your registration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Student Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer"
               onClick={() => handleRoleSelection('student')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-blue-700 mb-3">Student</h3>
              <p className="text-gray-600 mb-4">
                Register as a student to find internships and job opportunities
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Create your profile</li>
                <li>• Upload resume</li>
                <li>• Apply to jobs</li>
                <li>• Track applications</li>
                <li>• WhatsApp verification</li>
              </ul>
            </div>
          </div>

          {/* Recruiter Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-transparent hover:border-green-500 transition-all cursor-pointer"
               onClick={() => handleRoleSelection('recruiter')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M8 10h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-3">Recruiter</h3>
              <p className="text-gray-600 mb-4">
                Register as a recruiter to post jobs and find talented candidates
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Post job opportunities</li>
                <li>• Search candidates</li>
                <li>• Manage applications</li>
                <li>• Connect with colleges</li>
                <li>• WhatsApp verification</li>
              </ul>
            </div>
          </div>

          {/* College Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-transparent hover:border-purple-500 transition-all cursor-pointer"
               onClick={() => handleRoleSelection('college')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-purple-700 mb-3">College</h3>
              <p className="text-gray-600 mb-4">
                Register as a college to manage student placements
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Manage student profiles</li>
                <li>• Connect with recruiters</li>
                <li>• Track placements</li>
                <li>• Manage placement drives</li>
                <li>• WhatsApp verification</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Already have an account?</p>
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in here
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
