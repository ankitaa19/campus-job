import React from 'react';
import { X, MapPin, Calendar, Award } from 'lucide-react';

interface JobDetails {
  id: string;
  title: string;
  jobType: string;
  workMode: string;
  city: string;
  state: string;
  startDate: string;
  duration?: string;
  payRange?: string;
  stipend?: string;
  paymentStructure?: string;
  skills: string[];
  description: string;
  postedTo: {
    colleges: number;
    public: number;
  };
  numberOfOpenings: number;
  jobOffer?: boolean;
  benefits?: string[];
  activityHiringSince?: string;
  conversionPossibility?: string;
  certificateProvided?: string;
  postedAgo: string;
  status?: 'active' | 'closed' | 'draft';
}

interface ViewJobModalProps {
  job: JobDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewJobModal: React.FC<ViewJobModalProps> = ({ job, isOpen, onClose }) => {
  if (!isOpen || !job) return null;

  const isInternship = job.jobType?.toLowerCase().includes('internship');
  const isFreelance = job.jobType?.toLowerCase().includes('freelance');
  const isPartTime = job.jobType?.toLowerCase().includes('part-time');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  View <span className="text-blue-600">Job</span>
                </h2>
                <p className="mt-1 text-sm text-gray-600">Manage your jobs</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Job Header */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{job.title}</h3>
                
                <div className="mt-4 flex items-start gap-5">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <span className="text-2xl font-semibold text-purple-600">
                      {job.title.charAt(0)}
                    </span>
                  </div>

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                      
                      {/* Badges */}
                      {isInternship && (
                        <span className="rounded-md bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                          Internship
                        </span>
                      )}
                      {isFreelance && (
                        <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Freelance
                        </span>
                      )}
                      {job.status === 'closed' && (
                        <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Closed
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="mb-3 flex items-center text-sm text-gray-600">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>{job.city}, {job.state}</span>
                    </div>

                    {/* Posted To */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-600">Posted to:</span>
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {job.postedTo.colleges} Colleges
                      </span>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Public
                      </span>
                    </div>
                  </div>

                  {/* Posted Date */}
                  <div className="text-xs text-gray-500">
                    Posted: {job.postedAgo}
                  </div>
                </div>
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="mt-1 font-medium text-gray-900">{job.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="mt-1 font-medium text-gray-900">{job.duration || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Work mode</p>
                  <p className="mt-1 font-medium text-gray-900">{job.workMode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {isInternship ? 'Stipend' : isFreelance ? 'Payment Structure' : 'Pay Range'}
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {job.stipend || job.paymentStructure || job.payRange || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Top Skills */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Top Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: 'rgba(204, 177, 255, 0.2)',
                        color: '#7F3DFF'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  <button className="text-sm font-medium text-blue-600 hover:underline">
                    +2 more
                  </button>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Job Description</p>
                <p className="text-sm leading-relaxed text-gray-600">{job.description}</p>
              </div>

              {/* Benefits & Perks (for internships) */}
              {isInternship && job.benefits && (
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">Benefits & Perks</p>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Number of Openings */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Number of Openings</p>
                <div className="inline-flex h-10 w-16 items-center justify-center rounded-lg bg-gray-100">
                  <span className="font-medium text-gray-900">{job.numberOfOpenings}</span>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Additional Information</p>
                
                <div>
                  <p className="text-sm text-gray-600">
                    Job Offer: <span className="font-medium text-gray-900">{job.jobOffer ? 'Yes' : 'No'}</span>
                  </p>
                </div>

                {isInternship && (
                  <>
                    {job.conversionPossibility && (
                      <div>
                        <p className="text-sm text-gray-600">Conversion Possibility</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{job.conversionPossibility}</p>
                      </div>
                    )}
                    
                    {job.certificateProvided && (
                      <div>
                        <p className="text-sm text-gray-600">Certificate Provided</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{job.certificateProvided}</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <p className="text-sm text-gray-600">Activity on CampusPe</p>
                </div>

                {job.activityHiringSince && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Activity Hiring Since {job.activityHiringSince}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Active Jobs
              </button>
              <button
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg, #8B9DC3 0%, #6B7FA3 100%)'
                }}
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewJobModal;
