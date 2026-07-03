import React from 'react';
import { Edit, ArrowLeft } from 'lucide-react';

interface JobFormState {
  title: string;
  jobType: string;
  workMode: string;
  keySkills: string[];
  workExperience: { min: string; max: string };
  isFresher?: boolean;
  educationQualification: string;
  endDate: string;
  compensationType: string;
  payRange: { min: string; max: string };
  numberOfOpenings: string;
  location: string;
  description: string;
  dailyTimings: string;
  preferredWorkingDays: Record<string, boolean>;
  benefits: Array<{ id: string; text: string; enabled: boolean }>;
  internshipDetails: {
    duration: string;
    compensation: string;
    stipend: string;
    conversionPossibility: string;
    certificateProvided: string;
  };
  fullTimeDetails: {
    preferredMode: string;
    noticePeriod: string;
    deadline: string;
    minSalary: string;
    maxSalary: string;
  };
  contractDetails: {
    duration: string;
    paymentStructure: string;
    paymentAmount: string;
    extensionPossibility: string;
  };
  gigDetails: {
    workSchedule: string;
    preferredDays: string;
    hoursPerSession: string;
    paymentStructure: string;
    rateAmount: string;
    gigType: string;
    commitmentLevel: string;
    specialRequirements: string;
    preferredWorkingDays: Record<string, boolean>;
  };
  postToPublic: boolean;
  postToColleges: boolean;
  selectedColleges: string[];
  targetGraduationYears: string[];
}

interface JobPreviewSectionProps {
  jobData: JobFormState;
  onPrevious: () => void;
  onEditJob: () => void;
  onPostJob: () => void;
  onSaveDraft: () => void;
}

const JobPreviewSection: React.FC<JobPreviewSectionProps> = ({
  jobData,
  onPrevious,
  onEditJob,
  onPostJob,
  onSaveDraft
}) => {
  // Debug: Log the job data to console
  console.log('JobPreviewSection received data:', jobData);
  
  const formatWorkingDays = (days: Record<string, boolean>) => {
    const selectedDays = Object.entries(days)
      .filter(([, selected]) => selected)
      .map(([day]) => day);
    return selectedDays.length > 0 ? selectedDays.join(', ') : 'Not specified';
  };

  const formatBenefits = (benefits: Array<{ id: string; text: string; enabled: boolean }>) => {
    const enabledBenefits = benefits.filter(benefit => benefit.enabled);
    return enabledBenefits.length > 0 ? enabledBenefits.map(b => b.text).join(', ') : 'Not specified';
  };

  return (
    <div className="bg-white">
      <div className="max-screen-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0270DF]">Job Info</span>
            <span className="text-2xl font-bold text-[#0A0A0A]">-</span>
            <span className="text-2xl font-bold text-[#0A0A0A]">Preview details</span>
          </div>
          <p className="text-sm text-gray-600">View and edit job info details</p>
          <hr className="mt-8 border-t border-[#E5E7EB]" />
        </div>

        {/* Job Preview Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Job Title</h3>
              <p className="text-base text-gray-900">{jobData.title || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Job Type</h3>
              <p className="text-base text-gray-900">{jobData.jobType || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Work Mode</h3>
              <p className="text-base text-gray-900">{jobData.workMode || 'Not specified'}</p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Key Skills</h3>
              <p className="text-base text-gray-900">
                {jobData.keySkills.length > 0 ? jobData.keySkills.join(', ') : 'Not specified'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Work Experience</h3>
              <p className="text-base text-gray-900">
                {jobData.isFresher ? 'Fresher' : 
                 jobData.workExperience.min && jobData.workExperience.max 
                   ? `${jobData.workExperience.min} - ${jobData.workExperience.max} years`
                   : 'Not specified'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Qualification</h3>
              <p className="text-base text-gray-900">{jobData.educationQualification || 'Not specified'}</p>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">End Date</h3>
              <p className="text-base text-gray-900">{jobData.endDate || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Number of Openings</h3>
              <p className="text-base text-gray-900">{jobData.numberOfOpenings || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Location</h3>
              <p className="text-base text-gray-900">{jobData.location || 'Not specified'}</p>
            </div>
          </div>

          {/* Job Type Specific Details */}
          {jobData.jobType === 'Contract' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Contract Duration</h3>
                <p className="text-base text-gray-900">{jobData.contractDetails.duration || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Payment Structure</h3>
                <p className="text-base text-gray-900">{jobData.contractDetails.paymentStructure || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Extension Possibility</h3>
                <p className="text-base text-gray-900">{jobData.contractDetails.extensionPossibility || 'Not specified'}</p>
              </div>
            </div>
          )}

          {/* Job Description */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Job Description</h3>
            <p className="text-base text-gray-900 whitespace-pre-wrap">
              {jobData.description || 'Job description will be displayed here once provided.'}
            </p>
          </div>

          {/* Working Days */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Preferred Working Days</h3>
            <p className="text-base text-gray-900">
              {formatWorkingDays(jobData.preferredWorkingDays || {})}
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Benefits</h3>
            <p className="text-base text-gray-900">
              {formatBenefits(jobData.benefits || [])}
            </p>
          </div>

          {/* Compensation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Compensation Type</h3>
              <p className="text-base text-gray-900">{jobData.compensationType || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Pay Range</h3>
              <p className="text-base text-gray-900">
                {jobData.payRange?.min && jobData.payRange?.max 
                  ? `₹${jobData.payRange.min} - ₹${jobData.payRange.max}`
                  : 'Not specified'}
              </p>
            </div>
          </div>

          {/* Campus Recruitment Info (if applicable) */}
          {jobData.postToColleges && jobData.selectedColleges.length > 0 && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campus Recruitment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Selected Colleges</h4>
                  <p className="text-base text-gray-900">{jobData.selectedColleges.length} colleges selected</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Target Graduation Years</h4>
                  <p className="text-base text-gray-900">
                    {jobData.targetGraduationYears.length > 0 
                      ? jobData.targetGraduationYears.join(', ') 
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <button
            type="button"
            onClick={onPrevious}
            className="flex items-center gap-2 rounded-full border border-[#D4D8E4] px-8 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#F2F4FF]"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onEditJob}
              className="flex items-center gap-2 rounded-full border border-[#2D7BFF] px-8 py-3 text-sm font-semibold text-[#2D7BFF] transition hover:bg-[#F2F4FF]"
            >
              <Edit className="w-4 h-4" />
              Edit Job
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              className="rounded-full border border-[#D4D8E4] px-8 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#F2F4FF]"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onPostJob}
              className="rounded-full px-10 py-3 text-sm font-semibold text-white shadow-sm transition"
              style={{ background: 'linear-gradient(90deg, #0B58F4 0%, #2590FB 100%)' }}
            >
              Post Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPreviewSection;