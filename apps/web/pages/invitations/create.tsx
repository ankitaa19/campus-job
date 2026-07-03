import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

interface College {
  _id: string;
  name: string;
  shortName: string;
  address: {
    city: string;
    state: string;
  };
  placementContact?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  salary: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CreateInvitationPage = () => {
  const router = useRouter();
  const { jobId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    invitationMessage: '',
    proposedDates: [
      {
        startDate: '',
        endDate: '',
        isFlexible: false,
        preferredTimeSlots: ['morning']
      }
    ],
    expiresInDays: 30
  });

  useEffect(() => {
    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Debug: Check current user role
      const role = localStorage.getItem('role');
      console.log('Current user role:', role);

      const headers = { Authorization: `Bearer ${token}` };

      // Debug: Check recruiter profile status
      try {
        const recruiterResponse = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, { headers });
        console.log('Recruiter profile:', recruiterResponse.data);
      } catch (recruiterError) {
        console.error('Recruiter profile error:', recruiterError);
        if (axios.isAxiosError(recruiterError)) {
          console.log('Recruiter error status:', recruiterError.response?.status);
          console.log('Recruiter error message:', recruiterError.response?.data);
        }
      }

      // Fetch job details
      const jobResponse = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}`, { headers });
      setJob(jobResponse.data);

      // Fetch colleges
      const collegesResponse = await axios.get(`${API_BASE_URL}/api/colleges`, { headers });
      setColleges(Array.isArray(collegesResponse.data) ? collegesResponse.data : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeToggle = (collegeId: string) => {
    setSelectedColleges(prev => 
      prev.includes(collegeId)
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColleges.length === 0) {
      alert('Please select at least one college');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('Sending invitation request:', {
        url: `${API_BASE_URL}/api/jobs/${jobId}/invitations`,
        headers,
        data: {
          targetColleges: selectedColleges,
          invitationMessage: formData.invitationMessage,
          proposedDates: formData.proposedDates,
          expiresInDays: formData.expiresInDays
        }
      });

      const response = await axios.post(`${API_BASE_URL}/api/jobs/${jobId}/invitations`, {
        targetColleges: selectedColleges,
        invitationMessage: formData.invitationMessage,
        proposedDates: formData.proposedDates,
        expiresInDays: formData.expiresInDays
      }, { headers });

      console.log('Invitation response:', response.data);
      alert('Invitations sent successfully!');
      router.push('/dashboard/recruiter?tab=invitations');
    } catch (error) {
      console.error('Error sending invitations:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        console.log('Full error response:', errorData);
        alert(`Failed to send invitations (${statusCode}): ${errorMessage}`);
      } else {
        alert('Failed to send invitations');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (college.address?.city && college.address.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Send College Invitations</h1>
          <p className="mt-2 text-gray-600">
            Invite colleges for campus recruitment for: <span className="font-semibold">{job?.title}</span>
          </p>
        </div>

        {job && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Job Title</p>
                <p className="font-medium">{job.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-medium">{job.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{job.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{job.description.substring(0, 100)}...</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* College Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Colleges</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search colleges by name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {filteredColleges.map((college) => (
                <div
                  key={college._id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedColleges.includes(college._id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleCollegeToggle(college._id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedColleges.includes(college._id)}
                      onChange={() => handleCollegeToggle(college._id)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{college.name}</p>
                      <p className="text-sm text-gray-600">
                        {college.address?.city ? `${college.address.city}${college.address?.state ? `, ${college.address.state}` : ''}` : 'Location not specified'}
                      </p>
                      {college.placementContact && (
                        <p className="text-sm text-gray-500">
                          Contact: {college.placementContact.name} - {college.placementContact.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="mt-2 text-sm text-gray-600">
              {selectedColleges.length} college{selectedColleges.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Invitation Message */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invitation Message</h2>
            <textarea
              value={formData.invitationMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, invitationMessage: e.target.value }))}
              placeholder="Write a personalized invitation message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Proposed Dates */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposed Campus Visit Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.proposedDates[0].startDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    proposedDates: [{
                      ...prev.proposedDates[0],
                      startDate: e.target.value
                    }]
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.proposedDates[0].endDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    proposedDates: [{
                      ...prev.proposedDates[0],
                      endDate: e.target.value
                    }]
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedColleges.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : `Send Invitations (${selectedColleges.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvitationPage;
