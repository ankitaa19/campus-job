import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import ProfileDisplay from '../../../components/ProfileDisplay';
import { RecruiterProfile } from '../../../types/profiles';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const RecruiterProfilePage = () => {
  const router = useRouter();
  const { recruiterId } = router.query;
  const [loading, setLoading] = useState(true);
  const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (recruiterId) {
      fetchRecruiterProfile();
    }
  }, [recruiterId]);

  const fetchRecruiterProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/${recruiterId}`, { headers });
      setRecruiter(response.data);
    } catch (error) {
      console.error('Error fetching recruiter profile:', error);
      setError('Failed to load recruiter profile');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (recruiter?.email) {
      window.location.href = `mailto:${recruiter.email}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !recruiter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || 'Recruiter profile not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ProfileDisplay
        profile={recruiter}
        type="recruiter"
        isOwnProfile={false}
        onContact={handleContact}
      />
    </div>
  );
};

export default RecruiterProfilePage;
