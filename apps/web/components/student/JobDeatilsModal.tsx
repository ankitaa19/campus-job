import React from 'react';
import { X, MapPin, Calendar, Briefcase, Building, FileText, Heart, CalendarCheck, TrendingUp, Award } from 'lucide-react';
import { StudentJob } from '../../types/studentJobs';

interface JobDetailsModalProps {
  job: StudentJob;
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, isOpen, onClose, onApply }) => {
  if (!isOpen || !job) return null;

  const jobTypeValue = job.jobType?.toLowerCase() || '';
  const isInternship = jobTypeValue.includes('intern');
  const isFullTime = jobTypeValue.includes('full');
  const isFreelance = jobTypeValue.includes('freelance') || jobTypeValue.includes('contract');
  const isGig = jobTypeValue.includes('gig') || jobTypeValue.includes('flexible');
  const isPartTime = jobTypeValue.includes('part');

  const salaryDisplay = job.salary?.split('/')[0]?.trim() || job.salary || '';
  const description = job.description || '';
  const truncatedDescription =
    description.length > 250 ? `${description.substring(0, 250)}...` : description;
  const skills =
    (job.allSkills && job.allSkills.length > 0
      ? job.allSkills
      : job.skills && job.skills.length > 0
        ? job.skills
        : job.keySkills) || [];

  const benefits = (job.benefits || [])
    .map((benefit) => {
      if (typeof benefit === 'string') return benefit;
      if (benefit.enabled === false) return null;
      return benefit.text;
    })
    .filter((benefit): benefit is string => Boolean(benefit));

  const formatCurrencyValue = (value?: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('₹')) return trimmed;
    return `₹ ${trimmed}`;
  };

  const formatExperience = () => {
    if (job.experience) return job.experience;
    if (job.workExperience?.min || job.workExperience?.max) {
      return `${job.workExperience?.min || '0'}-${job.workExperience?.max || '0'} Years`;
    }
    return '';
  };

  const formatPreferredDays = (
    value?: string | string[] | Record<string, boolean>
  ): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    const activeDays = Object.entries(value)
      .filter(([, enabled]) => enabled)
      .map(([day]) => day);
    return activeDays.length ? activeDays.join(', ') : undefined;
  };

  const noticePeriod =
    job.fullTimeDetails?.noticePeriod ||
    (isInternship || isGig ? job.fullTimeDetails?.noticePeriod : undefined);
  const qualification = job.education || job.educationQualification || '';
  const workMode = job.workMode || job.fullTimeDetails?.preferredMode || '';

  const DetailChip = ({ label, value }: { label: string; value?: string }) =>
    value ? (
        <div className="flex flex-col border-r border-gray-200 last:border-r-0">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}:</p>

        <div className="rounded-full px-4 py-1.5 w-max"
            style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}>
            <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
        </div>
    ) : null;

  const DetailCard = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex-1 border-r border-gray-200 last:border-r-0 flex flex-col">
        <p className="text-sm font-semibold text-gray-900 mb-1.5">{label}:</p>
        <div className="flex">
          <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
      </div>
    ) : null;

  const buildJobTypeDetails = () => {
    if (isInternship && job.internshipDetails) {
      return {
        title: 'Internship Details',
        items: [
          { label: 'Duration', value: job.internshipDetails.duration },
          { label: 'Compensation Type', value: job.internshipDetails.compensation },
          {
            label: 'Conversion Possibility',
            value: job.internshipDetails.conversionPossibility,
          },
          {
            label: 'Certification Provided',
            value: job.internshipDetails.certificateProvided,
          },
        ],
      };
    }

    if (isFullTime && job.fullTimeDetails) {
      const payRangeMin = job.fullTimeDetails.payRange?.min || job.fullTimeDetails.minSalary;
      const payRangeMax = job.fullTimeDetails.payRange?.max || job.fullTimeDetails.maxSalary;
      const composedRange =
        payRangeMin || payRangeMax
          ? [payRangeMin, payRangeMax].filter(Boolean).join(' - ')
          : job.salary;
      return {
        title: 'Full-Time Role Details',
        items: [
          {
            label: 'Compensation Type',
            value: job.fullTimeDetails.compensationType || job.compensationType || 'Salary',
          },
          { label: 'Salary Range', value: composedRange },
          {
            label: 'Preferred Work Mode',
            value: job.fullTimeDetails.preferredMode || job.workMode,
          },
        ],
      };
    }

    if (isFreelance && job.contractDetails) {
      return {
        title: 'Freelance Job Details',
        items: [
          { label: 'Contract Duration', value: job.contractDetails.duration },
          { label: 'Payment Structure', value: job.contractDetails.paymentStructure },
          {
            label: 'Payment Amount',
            value: formatCurrencyValue(job.contractDetails.paymentAmount),
          },
          {
            label: 'Extension Possibility',
            value: job.contractDetails.extensionPossibility,
          },
        ],
      };
    }

    if (isGig && job.gigDetails) {
      return {
        title: 'Gig/Flexible Job Details',
        items: [
          { label: 'Work Schedule', value: job.gigDetails.workSchedule },
          { label: 'Payment Structure', value: job.gigDetails.paymentStructure },
          { label: 'Hours Per Session', value: job.gigDetails.hoursPerSession },
          { label: 'Commitment Level', value: job.gigDetails.commitmentLevel },
          { label: 'Rate Amount', value: job.gigDetails.rateAmount },
          { label: 'Gig Type', value: job.gigDetails.gigType },
        ],
      };
    }

    if (isPartTime && job.partTimeDetails) {
      return {
        title: 'Part-Time Role Details',
        items: [
          { label: 'Daily Timings', value: job.partTimeDetails.dailyTimings },
          {
            label: 'Preferred Working Days',
            value: formatPreferredDays(job.partTimeDetails.preferredWorkingDays),
          },
          { label: 'Compensation Type', value: job.partTimeDetails.compensationType },
          { label: 'Hourly Rate', value: formatCurrencyValue(job.partTimeDetails.hourlyRate) },
        ],
      };
    }

    return null;
  };

  const jobTypeDetails = buildJobTypeDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-1/2 overflow-y-auto overflow-x-hidden rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-blue-200 bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">{job.company} - Job Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Authentic job information stored and managed inside CampusPe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600 -mt-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(125, 90, 226, 0.1)', color: '#7D5AE2' }}>
                  New post
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 w-full">
                <span className="inline-flex items-center">
                  <MapPin className="mr-1 h-3.5 w-3.5" />
                  {job.workMode?.toLowerCase() === 'remote' ? 'Remote' : job.workMode?.toLowerCase() === 'hybrid' ? `${job.location || ''}, Hybrid` : job.location}
                </span>
                <span className="text-gray-400">·</span>
                <span className="inline-flex items-center">
                  <Briefcase className="mr-1 h-3.5 w-3.5" />
                  {job.type || job.jobType}
                </span>
                <span className="text-gray-400">·</span>
                <span>₹ {salaryDisplay.replace('₹', '').trim()}</span>
                <span className="text-gray-400">·</span>
                <span className="inline-flex items-center">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {job.date}
                </span>
              </div>
            </div>
          </div>

          <div className="-mx-6">
            <div className="px-6 py-2" style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}>
              <div className="inline-block px-3 py-1 text-white rounded text-xs font-medium" style={{ backgroundColor: '#7F3DFF' }}>
                About
              </div>
            </div>
            <div className="px-6 pb-4 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Job description</h4>
              {description && <p className="text-sm leading-relaxed text-gray-700">{description}</p>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-4">
            <DetailChip label="Work Mode" value={workMode} />
            <DetailChip label="Experience" value={formatExperience()} />
            <DetailChip label="Qualification" value={qualification} />
            <DetailChip label="Notice Period" value={noticePeriod} />
          </div>

          {jobTypeDetails && jobTypeDetails.items.length > 0 && (
<div className="mt-5">
  <div className="flex flex-wrap -mx-3">
    {jobTypeDetails.items.map((item, index) => (
      <div
        key={item.label}
        className={`px-3 mb-6 w-full sm:w-1/2 lg:w-1/4`}
      >
        <DetailCard label={item.label} value={item.value} />
      </div>
    ))}
  </div>
</div>

          )}

          {job.numberOfOpenings != null && <div className="mt-5">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Number of Openings:</h5>
            <div className="inline-flex items-center justify-center px-4 py-2" style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)', borderRadius: '8px' }}>
              <p className="text-lg text-gray-900">{job.numberOfOpenings}</p>
            </div>
          </div>}

          {benefits.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Benefits & Perks:</h4>
              <div className="flex flex-wrap gap-2.5">
                {benefits.map((benefit) => {
                  let IconComponent = Award;
                  if (benefit.includes('Health')) IconComponent = Heart;
                  else if (benefit.includes('Working Hours')) IconComponent = CalendarCheck;
                  else if (benefit.includes('Stock')) IconComponent = TrendingUp;
                  else if (benefit.includes('Development')) IconComponent = Award;
                  
                  return (
                    <div
                      key={benefit}
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ backgroundColor: 'rgba(204, 177, 255, 0.35)', borderRadius: '24px' }}
                    >
                      <IconComponent className="h-4 w-4" style={{ color: '#7F3DFF' }} />
                      <span className="text-sm font-medium" style={{ color: '#7F3DFF' }}>{benefit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills:</h4>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 text-sm font-medium"
                    style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)', color: '#7F3DFF', borderRadius: '8px' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Skills will be shared soon.</p>
            )}
          </div>

          {onApply && <div className="mt-6 flex items-center justify-end">
            <button onClick={onApply} className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600">Apply in CampusPe</button>
          </div>}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
