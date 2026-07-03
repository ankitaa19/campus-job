import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';

interface CompanyProfile {
  _id: string;
  email: string;
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
    phoneNumber?: string;
    linkedinUrl?: string;
  };
  isVerified: boolean;
  approvalStatus: string;
  verificationStatus: string;
  createdAt: string;
  stats?: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    hiredCandidates: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// StatCard Component
interface StatCardProps {
  emoji: string;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ emoji, label, value, trend, color = "blue" }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{emoji}</span>
      {trend && <span className="text-sm text-white/80">{trend}</span>}
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-white/80">{label}</div>
  </div>
);

// TabButton Component
interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
      isActive
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

const CompanyProfilePage = () => {
  const router = useRouter();
  const { companyId } = router.query;
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (companyId) {
      fetchCompanyProfile();
    }
  }, [companyId]);

  const fetchCompanyProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      // Use the correct recruiter endpoint
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/${companyId}`, { headers });
      setCompany(response.data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      setError('Failed to load company profile');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
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

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || 'Company profile not found'}</p>
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
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-8">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              {company.companyInfo?.logo ? (
                <img 
                  src={company.companyInfo.logo} 
                  alt={company.companyInfo.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/20 shadow-2xl">
                  <span className="text-white font-bold text-5xl">
                    {company.companyInfo?.name?.charAt(0) || company.email?.charAt(0)?.toUpperCase() || 'C'}
                  </span>
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-grow text-white">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-4xl lg:text-5xl font-bold">
                  {company.companyInfo?.name || 'Company Name'}
                </h1>
                {company.isVerified && (
                  <span className="bg-green-500/20 backdrop-blur-sm text-green-100 px-3 py-1 rounded-full text-sm font-medium border border-green-400/30">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="space-y-3 text-white/90">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏢</span>
                  <span className="text-lg font-medium">{company.companyInfo?.industry || 'Industry'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📧</span>
                  <span className="text-sm font-medium">{company.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📍</span>
                  <span className="text-sm font-medium">
                    {company.companyInfo?.headquarters ? 
                      `${company.companyInfo.headquarters.city}, ${company.companyInfo.headquarters.state}` :
                      'Location not specified'
                    }
                  </span>
                </div>
                {company.companyInfo?.website && (
                  <a
                    href={company.companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-white transition-colors"
                  >
                    <span className="text-lg">🌐</span>
                    <span className="text-sm font-medium">Company Website</span>
                  </a>
                )}
              </div>

              {company.companyInfo?.description && (
                <p className="text-lg text-white/90 leading-relaxed max-w-2xl mt-6">
                  {company.companyInfo.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <a
              href={`mailto:${company.email}`}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              Contact Company
            </a>
            {company.companyInfo?.website && (
              <a
                href={company.companyInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-all duration-300"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              emoji="💼"
              label="Total Jobs"
              value={company.stats?.totalJobs || 0}
            />
            <StatCard
              emoji="✅"
              label="Active Jobs"
              value={company.stats?.activeJobs || 0}
            />
            <StatCard
              emoji="📊"
              label="Applications"
              value={company.stats?.totalApplications || 0}
            />
            <StatCard
              emoji="🎯"
              label="Hired"
              value={company.stats?.hiredCandidates || 0}
            />
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <TabButton 
                id="overview"
                label="Overview" 
                isActive={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')} 
              />
              <TabButton 
                id="details"
                label="Company Details" 
                isActive={activeTab === 'details'} 
                onClick={() => setActiveTab('details')} 
              />
              <TabButton 
                id="contact"
                label="Contact" 
                isActive={activeTab === 'contact'} 
                onClick={() => setActiveTab('contact')} 
              />
              <TabButton 
                id="verification"
                label="Verification" 
                isActive={activeTab === 'verification'} 
                onClick={() => setActiveTab('verification')} 
              />
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
                  {company.companyInfo?.description ? (
                    <p className="text-gray-600 leading-relaxed">{company.companyInfo.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No company description available</p>
                  )}
                </div>

                {company.stats && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{company.stats.totalJobs}</div>
                        <div className="text-sm text-gray-600">Total Jobs Posted</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{company.stats.activeJobs}</div>
                        <div className="text-sm text-gray-600">Currently Hiring</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{company.stats.totalApplications}</div>
                        <div className="text-sm text-gray-600">Total Applications</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{company.stats.hiredCandidates}</div>
                        <div className="text-sm text-gray-600">Successful Hires</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Since</h3>
                  <p className="text-gray-600">
                    {new Date(company.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Industry</span>
                      <p className="text-gray-900 font-medium">{company.companyInfo?.industry || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Company Size</span>
                      <p className="text-gray-900 font-medium">{company.companyInfo?.size || 'Not specified'}</p>
                    </div>
                    {company.companyInfo?.foundedYear && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-600">Founded</span>
                        <p className="text-gray-900 font-medium">{company.companyInfo.foundedYear}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Headquarters</span>
                      <p className="text-gray-900 font-medium">
                        {company.companyInfo?.headquarters ? 
                          `${company.companyInfo.headquarters.city}, ${company.companyInfo.headquarters.state}, ${company.companyInfo.headquarters.country}` :
                          'Not specified'
                        }
                      </p>
                    </div>
                    {company.companyInfo?.website && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-600">Website</span>
                        <a 
                          href={company.companyInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium block"
                        >
                          {company.companyInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-lg">
                        {company.recruiterProfile?.firstName?.charAt(0)}{company.recruiterProfile?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {company.recruiterProfile?.firstName} {company.recruiterProfile?.lastName}
                      </h4>
                      <p className="text-gray-600">{company.recruiterProfile?.designation || 'Recruiter'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href={`mailto:${company.email}`} 
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xl">📧</span>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{company.email}</p>
                      </div>
                    </a>
                    
                    {company.recruiterProfile?.phoneNumber && (
                      <a 
                        href={`tel:${company.recruiterProfile.phoneNumber}`} 
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-xl">📞</span>
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-gray-600">{company.recruiterProfile.phoneNumber}</p>
                        </div>
                      </a>
                    )}
                    
                    {company.recruiterProfile?.linkedinUrl && (
                      <a 
                        href={company.recruiterProfile.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-xl">💼</span>
                        <div>
                          <p className="font-medium text-gray-900">LinkedIn</p>
                          <p className="text-sm text-gray-600">Professional Profile</p>
                        </div>
                      </a>
                    )}

                    {company.companyInfo?.website && (
                      <a 
                        href={company.companyInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-xl">🌐</span>
                        <div>
                          <p className="font-medium text-gray-900">Website</p>
                          <p className="text-sm text-gray-600">Company Portal</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification & Approval Status</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Company Verification</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        company.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {company.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {company.isVerified 
                        ? 'This company has been verified and is approved to post jobs and recruit candidates.'
                        : 'Company verification is still in progress. Some features may be limited until verification is complete.'
                      }
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Approval Status</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        company.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        company.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {company.approvalStatus === 'approved' ? '✅ Approved' :
                         company.approvalStatus === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending Approval'}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {company.approvalStatus === 'approved' 
                        ? 'This company has been approved by our administrators and can fully utilize all platform features.'
                        : company.approvalStatus === 'rejected'
                        ? 'This company\'s application has been rejected. Please contact support for more information.'
                        : 'This company\'s registration is under review by our administrators.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            
            <div className="flex space-x-3">
              <a
                href={`mailto:${company.email}`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Company
              </a>
              {company.companyInfo?.website && (
                <a
                  href={company.companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CompanyProfilePage;
