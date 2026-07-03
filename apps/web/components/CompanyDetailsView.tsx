import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Star,
  TrendingUp,
  UserCheck, 
  Clock, 
  Users, 
  Briefcase,
  Calendar,
  User,
  Eye,
  Share2,
  Globe,
  Phone,
  Mail,
  ChevronDown,
  Filter,
  X,
  ExternalLink,
  GraduationCap,
  IndianRupee,
  AlertTriangle,
  DollarSign,
  Coffee,
  Shirt,
  Heart
} from 'lucide-react';
import { Company, getCompanyData } from '../utils/companyData';

interface CompanyDetailsViewProps {
  company: Company;
  onBack: () => void;
  onViewCompany?: (company: Company) => void;
}

// Additional Companies Section Component with Pagination
const AdditionalCompaniesSection: React.FC<{
  currentCompanyId: string;
  onViewCompany?: (company: Company) => void;
}> = ({ currentCompanyId, onViewCompany }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 2;
  
  const allCompanies = getCompanyData();
  const otherCompanies = allCompanies.filter(comp => comp._id !== currentCompanyId && comp.name);
  
  // Calculate pagination
  const totalPages = Math.ceil(otherCompanies.length / companiesPerPage);
  const startIndex = (currentPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const currentCompanies = otherCompanies.slice(startIndex, endIndex);
  
  const getCompanyLogo = (name: string) => {
    const initials = name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    const colors = ['#FF339F', '#FFC700', '#CCB1FF'];
    const colorIndex = name.length % colors.length;
    
    return (
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {initials}
      </div>
    );
  };

  const getPartnershipBadge = (type: string) => {
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-transparent"
        style={{ 
          backgroundColor: '#EAFFF3', 
          color: '#00A34B' 
        }}
      >
        <svg 
          className="w-3.5 h-3.5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#00A34B" 
          strokeWidth="2.5"
        >
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Partnered
      </span>
    );
  };

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#0270DF] mb-2">Other Partner Companies</h2>
      </div>

      {/* Companies List - Matching Attached Design */}
      <div className="space-y-4 mb-6">
        {currentCompanies.map((partnerCompany) => (
          <div 
            key={partnerCompany._id} 
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              {/* Left Side - Company Info */}
              <div className="flex items-center gap-4">
                {getCompanyLogo(partnerCompany.name)}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{partnerCompany.name}</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Hiring Now
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                      ✨ Active Jobs: {partnerCompany.jobs.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{partnerCompany.industry}</span>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{partnerCompany.location}</span>
                    <span>•</span>
                    <span>Connected: {partnerCompany.lastContact || new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Company Profile Button */}
              <button 
                onClick={() => {
                  if (onViewCompany) {
                    console.log('🔵 Company Profile Button Clicked:', partnerCompany.name);
                    console.log('✅ Calling onViewCompany callback');
                    onViewCompany(partnerCompany);
                  } else {
                    console.warn('⚠️ onViewCompany not provided');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-[#CCB1FF] bg-[#CCB1FF40] text-gray-700 rounded-lg hover:bg-[#CCB1FF50] text-sm font-medium transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Company Profile
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border ${
              currentPage === 1
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
            }`}
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm ${
                currentPage === page
                  ? 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border ${
              currentPage === totalPages
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
            }`}
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      )}
    </div>
  );
};

const CompanyDetailsView: React.FC<CompanyDetailsViewProps> = ({ company, onBack, onViewCompany }) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);



  const getCompanyLogo = (name: string) => {
    const initials = name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    const colors = ['#FF339F', '#FFC700', '#CCB1FF'];
    const colorIndex = name.length % colors.length;
    
    return (
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {initials}
      </div>
    );
  };

  const getPartnershipBadge = (type: string) => {
    // Always show "Partnered" badge regardless of type
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-transparent"
        style={{ 
          backgroundColor: '#EAFFF3', 
          color: '#00A34B' 
        }}
      >
        <svg 
          className="w-3.5 h-3.5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#00A34B" 
          strokeWidth="2.5"
        >
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Partnered
      </span>
    );
  };

  // Job Details Modal Component - Matching Reference Image
  const JobDetailsModal = () => {
    if (!selectedJob) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Simple White Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{company.name} - Job Details</h1>
            </div>
            <button 
              onClick={() => {
                setSelectedJob(null);
                setShowModal(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="px-6 pb-6">
            {/* Subtitle */}
            <p className="text-sm text-gray-600 mb-6">
              View complete job details, interview scheduling, and candidate management for {company.name}
            </p>
          
            {/* Job Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h2>
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#7D5AE233', color: '#7D5AE2' }}>
                      New post
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedJob.location || 'On-site'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedJob.type || 'Full time'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      <span>{selectedJob.salaryRange || '₹3.0-6.0 LPA'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedJob.schedule || 'Mon-Fri'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Recently posted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility and Experience */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Eligibility:</h3>
                  <p className="text-gray-600 text-sm">{selectedJob.education || 'B.Tech/BE - Any'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Experience:</h3>
                  <p className="text-gray-600 text-sm">{selectedJob.experience || 'Fresher'}</p>
                </div>
              </div>
            </div>

            {/* About Tab */}
            <div className="mb-6" style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)', padding: '2px', borderRadius: '8px' }}>
              <div className="inline-block rounded-lg overflow-hidden">
                <div className="px-4 py-2" style={{ backgroundColor: '#7F3DFF' }}>
                  <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>About</span>
                </div>
              </div>
            </div>

            {/* About Content */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">About {company.name}:</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                {company.description || `${company.name} is a leading company in ${company.industry.toLowerCase()}. We focus on delivering innovative solutions and creating exceptional value for our clients through cutting-edge technology and expertise.`}
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Benefits:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Competitive Salary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Free Food and Snack</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">International Exposure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">THR / Binus System</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shirt className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Casual Dress Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Free Lunch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Paid Sick Days</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Skills Required:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob?.skillsRequired?.map((skill, index) => (
                  <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
                {(!selectedJob?.skillsRequired || selectedJob.skillsRequired.length === 0) && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">No specific skills required</span>
                )}
              </div>
            </div>

            {/* Share Button */}
            <div className="flex justify-end">
              <button className="flex items-center gap-2 bg-white border px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: '#1383F3', color: '#1383F3' }}>
                <Share2 className="w-4 h-4" style={{ color: '#1383F3' }} />
                Share with Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white h-screen">
      {/* Header Section - Matching dashboard header structure */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">
                <span className="text-[#0270DF]">{company.name}</span>
                <span className="text-[#0A0A0A]"> - Job Details</span>
              </h1>
              <p className="text-gray-600 text-sm mt-2 mb-2">
                View complete job details, interview scheduling, and candidate management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {getPartnershipBadge(company.partnershipType)}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPI Company Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* Active Jobs */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Active Jobs</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#00C950] to-[#00A63E] rounded-lg flex items-center justify-center">
        <Briefcase className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{company.metrics.activeJobs}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Avg Package */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Avg Package</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{company.metrics.avgPackage}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Past Placements */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Past Placements</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#008EFF] to-[#0573CB] rounded-lg flex items-center justify-center">
        <UserCheck className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{company.metrics.pastPlacements || 25}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>
</div>


        {/* Company Container with All Jobs - Matching Reference Image */}
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#FF8400' }}>
          {/* Company Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              {getCompanyLogo(company.name)}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-semibold text-gray-900">{company.name}</h2>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    Hiring Now
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                    ✨ Active Jobs: {company.jobs.length}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{company.industry}</span>
                  <span>•</span>
                  <span>Multiple Locations</span>
                  <span>•</span>
                  <span>Connected: {company.lastContact || new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowJobDetails(!showJobDetails)}
              className="flex items-center gap-2 px-4 py-2 border border-[#CCB1FF] bg-[#CCB1FF40] text-gray-700 rounded-lg hover:bg-[#CCB1FF50] text-sm font-medium transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Company Profile
              <ChevronDown className={`w-4 h-4 transition-transform ${showJobDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Individual Job Cards - Each job in separate container */}
          <div className="space-y-4 mt-2">
            {(showJobDetails ? company.jobs : company.jobs.slice(0, 1)).map((job, index) => (
              <div key={job._id} className="bg-white border border-gray-200 rounded-xl p-6">
                {/* Job Header - Matching Reference Image */}
                <div className="flex items-start justify-between mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-medium">
                          New post
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                          ⚡ Instant Hiring
                        </span>
                      </div>
                      <div className="flex items-center gap-8 text-sm text-gray-500 mb-0">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location || company.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <Clock className="w-4 h-4" />
                          <span>{job.schedule || 'Full time'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>₹{job.salaryRange || '50-55k'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <Calendar className="w-4 h-4" />
                          <span>Mon-Fri</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="text-sm font-medium text-red-500">
                      {job.openings || '5'} days left
                    </div>
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-xs">⚠</span>
                    </div>
                  </div>
                </div>

                {/* Job Requirements - Reference Image Layout */}
                <div className="mb-8">
                  {/* Top Row: Eligibility (left) and Skills Required (right) */}
                  <div className="flex items-start mb-6">
                    {/* Eligibility - Left Side */}
                    <div className="flex items-start gap-3 w-2/5">
                      <Building2 className="w-6 h-6 text-gray-900 mt-0.5" />
                      <div>
                        <span className="text-base font-semibold text-gray-900">Eligibility: </span>
                        <span className="text-base text-gray-600">{job.education || 'CSE, IT, CGPA 7+'}</span>
                      </div>
                    </div>
                    
                    {/* Skills Required - Right Side with Better Positioning */}
                    <div className="flex items-start gap-3 w-3/5">
                      <Users className="w-6 h-6 text-gray-900 mt-0.5" />
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-base font-semibold text-gray-900 whitespace-nowrap">Skills Required: </span>
                        <div className="flex items-center flex-wrap gap-2">
                          {(job.skillsRequired || ['React', 'Node.js', 'MongoDB']).map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-base font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Experience (left side, under Eligibility) */}
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-6 h-6 text-gray-900 mt-0.5" />
                    <div>
                      <span className="text-base font-semibold text-gray-900">Experience: </span>
                      <span className="text-base text-gray-600">{job.experience || 'Fresher'}</span>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-6">
                  <p className="text-base text-gray-600 leading-relaxed">
                    {job.description || 
                      'Mollit in laborum tempor Lorem incididunt irure. Aute eu ex ad sunt. Pariatur sint culpa do incididunt eiusmod elusmod culpa. laborum tempor Lorem incididunt.'}
                  </p>
                </div>

                {/* Action Buttons - Reference Image Styling */}
                <div className="flex items-center justify-end gap-4 mt-8">
                  <button 
                    onClick={() => {
                      setSelectedJob(job);
                      setShowModal(true);
                    }}
                    className="text-base font-medium border rounded-lg px-5 py-2.5 transition-colors"
                    style={{ 
                      color: '#5B5B5B',
                      borderColor: '#5B5B5B',
                      backgroundColor: 'white'
                    }}
                  >
                    View full details
                  </button>
                  <button 
                    className="flex items-center gap-2 bg-white text-[#1383F3] border border-[#1383F3] px-5 py-2.5 rounded-lg text-base font-medium hover:bg-blue-50 transition-colors"
                    style={{ 
                      color: '#1383F3', 
                      borderColor: '#1383F3',
                      backgroundColor: 'white'
                    }}
                  >
                    <Share2 className="w-5 h-5" style={{ color: '#1383F3' }} />
                    Share with Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Companies - Matching First Design Image */}
        <AdditionalCompaniesSection 
          currentCompanyId={company._id} 
          onViewCompany={onViewCompany}
        />
      </div>

      {/* Modal */}
      {showModal && <JobDetailsModal />}
    </div>
  );
};

export default CompanyDetailsView;
