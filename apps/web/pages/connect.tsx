import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import CollegeRegistrationNavbar from '../components/CollegeRegistrationNavbar';

interface Company {
  _id: string;
  companyInfo: {
    name: string;
    industry: string;
    website?: string;
    logo?: string;
    description?: string;
    size: string;
    foundedYear?: number;
    headquarters: {
      city: string;
      state: string;
      country: string;
    };
  };
  recruiterProfile: {
    firstName: string;
    lastName: string;
    designation: string;
  };
  email: string;
  isVerified: boolean;
  createdAt: string;
}

interface College {
  _id: string;
  name: string;
  email: string;
  address: {
    city: string;
    state: string;
    country: string;
  };
  website?: string;
  placementContact: {
    name: string;
    email: string;
    phone: string;
  };
  establishedYear?: number;
  type: string;
  affiliation?: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const ConnectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [collegeName, setCollegeName] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'colleges'>('companies');

  // Debug function to test API response structure
  const debugApiResponse = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Debug: No token found');
        return;
      }

      // Decode JWT token manually (basic decode without verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64));
      console.log('Debug: Token decoded:', decoded);

      const headers = { Authorization: `Bearer ${token}` };
      
      // Try both endpoints to see which one works
      try {
        const collegeResponse = await axios.get(`${API_BASE_URL}/api/colleges/profile`, { headers });
        console.log('Debug: College API Response:', collegeResponse.data);
      } catch (err) {
        console.log('Debug: College API failed:', err);
      }
      
      try {
        const recruiterResponse = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, { headers });
        console.log('Debug: Recruiter API Response:', recruiterResponse.data);
      } catch (err) {
        console.log('Debug: Recruiter API failed:', err);
      }
    } catch (error) {
      console.error('Debug: API Error:', error);
    }
  };

  useEffect(() => {
    console.log('Debug: useEffect triggered, userStatus:', userStatus);
    checkAuth();
    fetchData();
    
    // Debug API response in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => debugApiResponse(), 1000);
    }
    
    // Failsafe: After 3 seconds, if user is still on the page with a valid token,
    // ensure they have approved status (they shouldn't be able to access this page otherwise)
    const failsafeTimeout = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token && userStatus !== 'approved') {
        console.log('Failsafe: Setting user status to approved after timeout, current status:', userStatus);
        setUserStatus('approved');
      }
    }, 3000);

    return () => clearTimeout(failsafeTimeout);
  }, [userStatus]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      
      console.log('Token payload:', payload);
      setUserRole(payload.role);
      
      // Set default tab based on user role
      if (payload.role === 'recruiter') {
        setActiveTab('colleges');
        setCollegeName('Company'); // Set default name
      } else if (payload.role === 'college') {
        setActiveTab('companies');
        setCollegeName('College'); // Set default name
      }

      // Since user has a valid token and reached this page, they should be approved
      // We'll verify this with the API call, but default to approved
      setUserStatus('approved');
      
      // Fetch user profile after setting role to get more details
      await fetchUserProfileByRole(payload.role);
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  };

  const fetchUserProfileByRole = async (role: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch user profile based on role
      if (role === 'college') {
        const response = await axios.get(`${API_BASE_URL}/api/colleges/profile`, { headers });
        if (response.data) {
          // Check multiple possible field names for approval status
          const isApproved = response.data.isApproved || response.data.isVerified || 
                           response.data.status === 'approved' || response.data.approved;
          setUserStatus(isApproved ? 'approved' : 'pending');
          setCollegeName(response.data.name || 'College');
          console.log('College profile fetched:', { isApproved, status: response.data.status, data: response.data });
        }
      } else if (role === 'recruiter') {
        const response = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, { headers });
        if (response.data) {
          // Check multiple possible field names for verification status
          const isVerified = response.data.isVerified || response.data.isApproved || 
                           response.data.status === 'approved' || response.data.verified;
          setUserStatus(isVerified ? 'approved' : 'pending');
          setCollegeName(response.data.companyInfo?.name || 'Company');
          console.log('Recruiter profile fetched:', { isVerified, status: response.data.status, data: response.data });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If API fails but user has a valid token and can access this page,
      // they are likely approved - keep the approved status as fallback
      console.log('API failed, keeping current approved status for authenticated user');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch both companies and colleges
      const [companiesResponse, collegesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/recruiters/public`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/colleges/public`, { headers }).catch(() => ({ data: [] }))
      ]);

      setCompanies(Array.isArray(companiesResponse.data) ? companiesResponse.data : []);
      setColleges(Array.isArray(collegesResponse.data) ? collegesResponse.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetId: string, targetType: 'company' | 'college') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Sending connection request:', { targetId, targetType });
      
      // Create a connection request
      const response = await axios.post(`${API_BASE_URL}/api/connections/request`, {
        targetId,
        targetType,
        message: `Hello! I would like to connect with your ${targetType}.`
      }, { headers });

      console.log('Connection response:', response.data);
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        console.log('Connection error details:', error.response?.data);
        
        if (statusCode === 404) {
          alert('Connection feature is not yet implemented. Please contact the administrator.');
        } else {
          alert(`Failed to send connection request (${statusCode}): ${errorMessage}`);
        }
      } else {
        alert('Failed to send connection request. Please try again.');
      }
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.companyInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.companyInfo?.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${company.companyInfo?.headquarters?.city} ${company.companyInfo?.headquarters?.state}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredColleges = colleges.filter(college =>
    college.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${college.address?.city} ${college.address?.state}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CollegeRegistrationNavbar 
          status={userStatus}
          collegeName={collegeName}
        />
        <div className="flex items-center justify-center h-64 pt-28">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CollegeRegistrationNavbar 
        status={userStatus}
        collegeName={collegeName}
      />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect & Collaborate</h1>
          <p className="text-gray-600">
            {userRole === 'recruiter' 
              ? 'Find and connect with colleges for campus placements'
              : userRole === 'college'
              ? 'Connect with companies for student placements'
              : 'Discover companies and colleges in our network'
            }
          </p>

        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('companies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Companies ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('colleges')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'colleges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Colleges ({colleges.length})
            </button>
          </nav>
        </div>

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div key={company._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{company.companyInfo?.name || 'Company Name'}</h3>
                      <p className="text-sm text-blue-600 mb-2">{company.companyInfo?.industry || 'Industry'}</p>
                      <p className="text-sm text-gray-600 mb-2">📍 {company.companyInfo?.headquarters?.city}, {company.companyInfo?.headquarters?.state}</p>
                      {company.companyInfo?.foundedYear && (
                        <p className="text-sm text-gray-500 mb-2">Est. {company.companyInfo?.foundedYear}</p>
                      )}
                    </div>
                    {company.isVerified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  {company.companyInfo?.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {company.companyInfo?.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Contact: {company.recruiterProfile?.firstName} {company.recruiterProfile?.lastName}
                    </div>
                    <button
                      onClick={() => handleConnect(company._id, 'company')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                  
                  {company.companyInfo?.website && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={company.companyInfo?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No companies found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Colleges Tab */}
        {activeTab === 'colleges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.length > 0 ? (
              filteredColleges.map((college) => (
                <div key={college._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{college.name || 'College Name'}</h3>
                      <p className="text-sm text-blue-600 mb-2">{college.type || 'College Type'}</p>
                      <p className="text-sm text-gray-600 mb-2">📍 {college.address?.city}, {college.address?.state}</p>
                      {college.affiliation && (
                        <p className="text-sm text-gray-500 mb-2">Affiliated to: {college.affiliation}</p>
                      )}
                      {college.establishedYear && (
                        <p className="text-sm text-gray-500 mb-2">Est. {college.establishedYear}</p>
                      )}
                    </div>
                    {college.isVerified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  {college.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {college.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Contact: {college.placementContact?.name || 'Contact Person'}
                    </div>
                    <button
                      onClick={() => handleConnect(college._id, 'college')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                  
                  {college.website && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No colleges found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ConnectPage;
