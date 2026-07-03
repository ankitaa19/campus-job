import React from 'react';
import { ArrowLeft, MapPin, Users } from 'lucide-react';

interface JobDetails {
  id: string;
  title: string;
  jobType: string;
  workMode: string;
  city: string;
  state: string;
  location?: string;
  keySkills?: string[];
  workExperience?: { min: string; max: string };
  educationQualification?: string;
  endDate?: string;
  startDate?: string;
  numberOfOpenings: number;
  
  // Common fields
  description: string;
  postedTo: {
    colleges: number;
    public: number;
  };
  postedAgo: string;
  status?: 'active' | 'closed' | 'draft';
  
  // Internship specific
  internshipDetails?: {
    duration: string;
    compensation: string;
    stipend: string;
    conversionPossibility: string;
    certificateProvided: string;
  };
  
  // Full-time specific
  fullTimeDetails?: {
    noticePeriod: string;
    compensationType: string;
    payRange: { min: string; max: string };
  };
  
  // Part-time specific
  partTimeDetails?: {
    dailyTimings: string;
    preferredWorkingDays: string[];
    compensationType: string;
    payRange: { min: string; max: string };
  };
  
  // Contract specific
  contractDetails?: {
    duration: string;
    paymentStructure: string;
    paymentAmount: string;
    extensionPossibility: string;
  };
  
  // Gig/Flexible specific
  gigDetails?: {
    workSchedule: string;
    preferredDays: string[];
    hoursPerSession: string;
    paymentStructure: string;
    rateAmount: string;
    gigType?: string;
    commitmentLevel?: string;
  };
  
  // Benefits
  benefits?: string[];
}

interface ViewJobPageProps {
  job: JobDetails;
  onBack: () => void;
}

const ViewJobPage: React.FC<ViewJobPageProps> = ({ job, onBack }) => {
  const isInternship = job.jobType?.toLowerCase().includes('internship');
  const isFullTime = job.jobType?.toLowerCase().includes('full-time') || job.jobType?.toLowerCase().includes('full time');
  const isPartTime = job.jobType?.toLowerCase().includes('part-time') || job.jobType?.toLowerCase().includes('part time');
  const isContract = job.jobType?.toLowerCase().includes('contract') || job.jobType?.toLowerCase().includes('freelance');
  const isGig = job.jobType?.toLowerCase().includes('gig') || job.jobType?.toLowerCase().includes('flexible');

  const getPageTitle = () => {
    if (job.status === 'closed') return 'Closed Job';
    if (job.status === 'draft') return 'Preview Job';
    return 'View Job';
  };

  const getPageSubtitle = () => {
    if (job.status === 'closed') return 'View closed job details';
    if (job.status === 'draft') return 'Preview your draft job posting';
    return 'View your active job posting';
  };

  return (
    <div className="bg-white">
      {/* Header matching ManageJobsSection */}
      <div className="pb-6 mb-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
            <p className="mt-2 text-gray-600 ml-8">{getPageSubtitle()}</p>
          </div>
        </div>
      </div>

      {/* Job Details - Matching Post Job Section Structure */}
      <div className="space-y-8">
        {/* Job Header Card */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" 
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <span className="text-2xl font-semibold text-white">
              {job.title.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isInternship && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700"
                  style={{ border: '1px solid #E9D5FF' }}>
                  Internship
                </span>
              )}
              {isFullTime && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700"
                  style={{ border: '1px solid #DBEAFE' }}>
                  Full-Time
                </span>
              )}
              {isPartTime && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700"
                  style={{ border: '1px solid #BBF7D0' }}>
                  Part-Time
                </span>
              )}
              {isContract && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700"
                  style={{ border: '1px solid #FED7AA' }}>
                  Contract
                </span>
              )}
              {isGig && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-pink-50 text-pink-700"
                  style={{ border: '1px solid #FBCFE8' }}>
                  Gig/Flexible
                </span>
              )}
              {job.status === 'closed' && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: '#E9EAF2', color: '#9297C0', border: '1px solid #E9EAF2' }}>
                  Closed
                </span>
              )}
              {job.status === 'draft' && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(236, 27, 27, 0.1)', color: '#EC1B1B', border: '1px solid rgba(236, 27, 27, 0.2)' }}>
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin className="mr-1.5 h-4 w-4" />
              <span>{job.location || `${job.city}, ${job.state}`}</span>
              <span className="mx-2 inline-block h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-500">Posted: {job.postedAgo}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600">Posted to:</span>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                {job.postedTo.colleges} Colleges
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FEF3C7' }}>
                Public
              </span>
            </div>
          </div>
        </div>

        {/* Job Type Specific Details */}
        {isInternship && job.internshipDetails && (
          <div className="rounded-2xl border border-[#E0E4F4] bg-[#F7F8FF] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: '#4256FF' }}>•</span>
              Internship Program Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Duration</p>
                <p className="text-base font-semibold text-gray-900">{job.internshipDetails.duration || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Compensation Type</p>
                <p className="text-base font-semibold text-gray-900">{job.internshipDetails.compensation || 'Not specified'}</p>
              </div>
              {job.internshipDetails.compensation === 'Paid' && job.internshipDetails.stipend && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Monthly Stipend</p>
                  <p className="text-base font-semibold text-gray-900">₹ {job.internshipDetails.stipend}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-2">Work Mode</p>
                <p className="text-base font-semibold text-gray-900">{job.workMode}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Conversion Possibility</p>
                <p className="text-base font-semibold text-gray-900">{job.internshipDetails.conversionPossibility || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Certificate Provided</p>
                <p className="text-base font-semibold text-gray-900">{job.internshipDetails.certificateProvided || 'Not specified'}</p>
              </div>
            </div>
          </div>
        )}

        {isFullTime && job.fullTimeDetails && (
          <div className="rounded-2xl border border-[#E0E4F4] bg-[#F7F8FF] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: '#4256FF' }}>•</span>
              Employment Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Work Mode</p>
                <p className="text-base font-semibold text-gray-900">{job.workMode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Notice Period</p>
                <p className="text-base font-semibold text-gray-900">{job.fullTimeDetails.noticePeriod || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Compensation Type</p>
                <p className="text-base font-semibold text-gray-900">{job.fullTimeDetails.compensationType || 'Salary'}</p>
              </div>
              {job.fullTimeDetails.payRange && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Salary Range</p>
                  <p className="text-base font-semibold text-gray-900">
                    ₹ {job.fullTimeDetails.payRange.min} - ₹ {job.fullTimeDetails.payRange.max}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {isPartTime && job.partTimeDetails && (
          <div className="rounded-2xl border border-[#E0E4F4] bg-[#F5F5F7] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: '#4A5565' }}>•</span>
              Part-Time Arrangement
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Daily Timings</p>
                <p className="text-base font-semibold text-gray-900">{job.partTimeDetails.dailyTimings || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Work Mode</p>
                <p className="text-base font-semibold text-gray-900">{job.workMode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Compensation Type</p>
                <p className="text-base font-semibold text-gray-900">{job.partTimeDetails.compensationType || 'Hourly'}</p>
              </div>
              {job.partTimeDetails.payRange && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Pay Range</p>
                  <p className="text-base font-semibold text-gray-900">
                    ₹ {job.partTimeDetails.payRange.min} - ₹ {job.partTimeDetails.payRange.max}
                  </p>
                </div>
              )}
            </div>
            {job.partTimeDetails.preferredWorkingDays && job.partTimeDetails.preferredWorkingDays.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Preferred Working Days</p>
                <div className="flex flex-wrap gap-2">
                  {job.partTimeDetails.preferredWorkingDays.map((day) => (
                    <span key={day} className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-700">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isContract && job.contractDetails && (
          <div className="rounded-2xl border border-[#E0E4F4] bg-[#F7F8FF] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: '#4256FF' }}>•</span>
              Contract Assignment Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Contract Duration</p>
                <p className="text-base font-semibold text-gray-900">{job.contractDetails.duration || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Payment Structure</p>
                <p className="text-base font-semibold text-gray-900">{job.contractDetails.paymentStructure || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Payment Amount</p>
                <p className="text-base font-semibold text-gray-900">₹ {job.contractDetails.paymentAmount || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Extension Possibility</p>
                <p className="text-base font-semibold text-gray-900">{job.contractDetails.extensionPossibility || 'Not specified'}</p>
              </div>
            </div>
          </div>
        )}

        {isGig && job.gigDetails && (
          <div className="rounded-2xl border border-[#E0E4F4] bg-[#F7F8FF] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: '#4256FF' }}>•</span>
              Gig/Flexible Job Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Work Schedule</p>
                <p className="text-base font-semibold text-gray-900">{job.gigDetails.workSchedule || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Hours per Session</p>
                <p className="text-base font-semibold text-gray-900">{job.gigDetails.hoursPerSession || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Payment Structure</p>
                <p className="text-base font-semibold text-gray-900">{job.gigDetails.paymentStructure || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Rate Amount</p>
                <p className="text-base font-semibold text-gray-900">₹ {job.gigDetails.rateAmount || 'Not specified'}</p>
              </div>
            </div>
            {job.gigDetails.preferredDays && job.gigDetails.preferredDays.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Preferred Working Days</p>
                <div className="flex flex-wrap gap-2">
                  {job.gigDetails.preferredDays.map((day) => (
                    <span key={day} className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-700">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Skills Section */}
        {job.keySkills && job.keySkills.length > 0 && (
          <div>
            <p className="text-base font-semibold text-gray-900 mb-3">Key Skills Required</p>
            <div className="flex flex-wrap gap-2">
              {job.keySkills.map((skill, index) => (
                <span key={index} 
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
                  style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', color: '#7C3AED', border: '1px solid rgba(147, 51, 234, 0.2)' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job Description */}
        <div>
          <p className="text-base font-semibold text-gray-900 mb-3">Job Description</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Work Experience */}
        {job.workExperience && (job.workExperience.min || job.workExperience.max) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Work Experience</p>
              <p className="text-base font-semibold text-gray-900">
                {job.workExperience.min} - {job.workExperience.max} years
              </p>
            </div>
          </div>
        )}

        {/* Education Qualification */}
        {job.educationQualification && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Education Qualification</p>
            <p className="text-base font-semibold text-gray-900">{job.educationQualification}</p>
          </div>
        )}

        {/* Benefits & Perks */}
        {job.benefits && job.benefits.length > 0 && (
          <div>
            <p className="text-base font-semibold text-gray-900 mb-3">Benefits & Perks</p>
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Number of Openings */}
        <div>
          <p className="text-base font-semibold text-gray-900 mb-3">Number of Openings</p>
          <div className="inline-flex h-12 w-20 items-center justify-center rounded-lg bg-gray-100 border border-gray-200">
            <span className="text-xl font-bold text-gray-900">{job.numberOfOpenings}</span>
          </div>
        </div>

        {/* Application Deadline */}
        {job.endDate && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Application Deadline</p>
            <p className="text-base font-semibold text-gray-900">{job.endDate}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button 
            onClick={onBack} 
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Back to {job.status === 'closed' ? 'Closed' : job.status === 'draft' ? 'Draft' : 'Active'} Jobs
          </button>
          <button 
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}>
            <Users className="h-4 w-4" />
            View Applications
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewJobPage;
