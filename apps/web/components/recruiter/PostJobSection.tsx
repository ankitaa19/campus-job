import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { campusRecruitmentColleges } from '../../data/campusRecruitmentColleges';
import { Job, JobDraft } from '../../types/recruiter';
import { CampusRecruitmentCollegeCard } from './CampusRecruitmentCollegeCard';

type JobType = 'Full-Time' | 'Part-Time' | 'Internship' | 'Contract' | 'Gig/Flexible';

interface JobFormState {
  title: string;
  jobType: JobType;
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultPreferredDays = DAYS.reduce<Record<string, boolean>>((acc, day) => {
  acc[day] = false;
  return acc;
}, {});

const initialJobForm: JobFormState = {
  title: '',
  jobType: 'Full-Time',
  workMode: '',
  keySkills: [],
  workExperience: { min: '', max: '' },
  isFresher: false,
  educationQualification: '',
  endDate: '',
  compensationType: '',
  payRange: { min: '', max: '' },
  numberOfOpenings: '0',
  location: '',
  description: '',
  dailyTimings: '',
  preferredWorkingDays: defaultPreferredDays,
  benefits: [
    { id: '1', text: 'Health Insurance', enabled: false },
    { id: '2', text: 'Flexible working hours', enabled: false },
    { id: '3', text: 'Professional development budget', enabled: false },
    { id: '4', text: 'Stock options', enabled: false },
  ],
  internshipDetails: {
    duration: '',
    compensation: '',
    stipend: '',
    conversionPossibility: '',
    certificateProvided: '',
  },
  fullTimeDetails: {
    preferredMode: '',
    noticePeriod: '',
    deadline: '',
    minSalary: '',
    maxSalary: '',
  },
  contractDetails: {
    duration: '',
    paymentStructure: '',
    paymentAmount: '',
    extensionPossibility: '',
  },
  gigDetails: {
    workSchedule: '',
    preferredDays: '',
    hoursPerSession: '',
    paymentStructure: '',
    rateAmount: '',
    gigType: '',
    commitmentLevel: '',
    specialRequirements: '',
    preferredWorkingDays: defaultPreferredDays,
  },
  postToPublic: false,
  postToColleges: false,
  selectedColleges: [], // Start with empty selection
  targetGraduationYears: [], // Start with empty selection
};

const cloneJobForm = (): JobFormState =>
  JSON.parse(JSON.stringify(initialJobForm)) as JobFormState;

interface PostJobSectionProps {
  onSaveDraft: (draft: JobDraft) => void;
  onJobPosted?: (job: Job) => void; // Add callback for when job is successfully posted
  onPreviewJob?: (jobData: JobFormState) => void; // Add callback for job preview
  prefillData?: Partial<JobFormState>; // Pre-filled data for "Post Similar Job"
}

const baseInputClass =
  'w-full rounded-lg border border-[#E2E6EF] bg-white px-4 py-3 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm transition focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF]';

const selectClass = `${baseInputClass} appearance-none pr-11`;
const pillSelectClass =
  'w-full appearance-none pr-11 rounded-full border border-transparent bg-[#D0D3E7] px-4 py-3 text-sm font-medium text-[#262629] placeholder:text-[#262629] shadow-sm transition focus:border-[#9CABFF] focus:outline-none focus:ring-2 focus:ring-[#D8DEFF]';

const ToggleCard = ({
  icon,
  label,
  checked,
  onChange,
  children,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}) => (
  <div className="rounded-[22px] border border-[#E4E7EF] bg-[#F9FAFF] px-6 py-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow">{icon}</span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={`relative block h-7 w-12 rounded-full transition-colors duration-200 ${checked ? 'bg-[#11E61C]' : 'bg-[#CFD6E6]'}`}>
          <span className={`absolute top-[2px] left-[2px] block h-6 w-6 rounded-full bg-white transition-transform duration-200 transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </span>
      </label>
    </div>
    {children && (
      <div className="mt-3">
        {children}
      </div>
    )}
  </div>
);

const FieldLabel = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required ? <span className="text-red-500">*</span> : null}
    </label>
    {children}
  </div>
);

const SelectInput = ({
  value,
  onChange,
  placeholder,
  options,
  variant = 'default',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  variant?: 'default' | 'pill';
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={variant === 'pill' ? pillSelectClass : selectClass}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D98B5]" />
  </div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    className={`${baseInputClass} ${className}`}
  />
);

const CardHeading = ({ dotColor, title }: { dotColor: string; title: string }) => (
  <div className="mb-6 flex items-center gap-3 text-lg font-semibold text-gray-900">
    <span className="text-2xl font-bold" style={{ color: "#4A5565" }}>
      •
    </span>
    <span>{title}</span>
  </div>
);

const SkillsInput = ({
  skills,
  onChange,
  placeholder,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder: string;
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.includes(',')) {
      const newSkills = value.split(',').map(skill => skill.trim()).filter(skill => skill);
      if (newSkills.length > 0) {
        const updatedSkills = [...skills, ...newSkills];
        onChange(updatedSkills);
        setInputValue('');
      }
    } else {
      setInputValue(value);
    }
  };

  const removeSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onChange(updatedSkills);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={skills.length === 0 ? placeholder : "Add more skills..."}
        className={baseInputClass}
      />
      <p className="mt-1 text-xs text-[#717182]">Press comma (,) to add a skill</p>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ background: 'linear-gradient(90deg, #2490FB 0%, #2490FB 100%)' }}
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="text-white hover:text-gray-200 ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PostJobSection: React.FC<PostJobSectionProps> = ({ onSaveDraft, onJobPosted, onPreviewJob, prefillData }) => {
  const [jobForm, setJobForm] = useState<JobFormState>(() => {
    const baseForm = cloneJobForm();
    // If prefillData is provided, merge it with the base form
    if (prefillData) {
      return { ...baseForm, ...prefillData };
    }
    return baseForm;
  });
  const [currentStep, setCurrentStep] = useState<'job-details' | 'college-selection'>('job-details');

  // Update form when prefillData changes (e.g., when "Post Similar Job" is clicked)
  useEffect(() => {
    if (prefillData) {
      const baseForm = cloneJobForm();
      setJobForm({ ...baseForm, ...prefillData });
      setCurrentStep('job-details'); // Reset to first step
      console.log('Form pre-filled with data:', prefillData);
    }
  }, [prefillData]);

  const createIdentifier = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const determineExperienceLevel = (form: JobFormState): string => {
    if (form.isFresher) {
      return 'entry';
    }

    const maxExperienceRaw = form.workExperience.max || form.workExperience.min;
    const maxExperience = maxExperienceRaw ? parseFloat(maxExperienceRaw) : NaN;

    if (Number.isNaN(maxExperience)) {
      return 'mid';
    }

    if (maxExperience <= 2) {
      return 'entry';
    }

    if (maxExperience <= 5) {
      return 'mid';
    }

    return 'senior';
  };

  const deriveLocation = (form: JobFormState): string => {
    if (form.workMode === 'Remote') {
      return 'Remote';
    }

    return form.location || 'Location TBD';
  };

  const createJobSummary = (form: JobFormState): Job => ({
    _id: createIdentifier('job'),
    title: form.title || 'Untitled role',
    location: deriveLocation(form),
    department: form.educationQualification || 'General',
    jobType: form.jobType.toLowerCase(),
    experienceLevel: determineExperienceLevel(form),
    isActive: true,
    postedAt: new Date().toISOString(),
  });

  const createDraftSummary = (form: JobFormState): JobDraft => ({
    id: createIdentifier('draft'),
    title: form.title || 'Untitled role',
    location: deriveLocation(form),
    jobType: form.jobType,
    experienceLevel: determineExperienceLevel(form),
    savedAt: new Date().toISOString(),
  });

  const resetForm = () => {
    setJobForm(cloneJobForm());
    setCurrentStep('job-details');
  };

  const handleSaveAsDraft = () => {
    const draftSummary = createDraftSummary(jobForm);
    onSaveDraft(draftSummary);
    resetForm();
  };

  const isPartTime = jobForm.jobType === 'Part-Time';
  const isFullTime = jobForm.jobType === 'Full-Time';
  const isInternship = jobForm.jobType === 'Internship';
  const isContract = jobForm.jobType === 'Contract';
  const isGig = jobForm.jobType === 'Gig/Flexible';

  const jobTypeOptions = useMemo(
    () => [
      { label: 'Full-Time', value: 'Full-Time' },
      { label: 'Part-Time', value: 'Part-Time' },
      { label: 'Internship', value: 'Internship' },
      { label: 'Freelance Jobs', value: 'Contract' },
      { label: 'Gig/Flexible', value: 'Gig/Flexible' },
    ] as const,
    []
  );

  useEffect(() => {
    setJobForm((prev) => {
      const updates: Partial<JobFormState> = {};

      if (jobForm.jobType !== 'Part-Time') {
        updates.dailyTimings = '';
        updates.preferredWorkingDays = defaultPreferredDays;
      }

      if (jobForm.jobType !== 'Internship') {
        updates.internshipDetails = { ...initialJobForm.internshipDetails };
      }

      if (jobForm.jobType !== 'Full-Time') {
        updates.fullTimeDetails = { ...initialJobForm.fullTimeDetails };
        updates.benefits = [...initialJobForm.benefits];
      }

      if (jobForm.jobType !== 'Contract') {
        updates.contractDetails = { ...initialJobForm.contractDetails };
      }

      if (jobForm.jobType !== 'Gig/Flexible') {
        updates.gigDetails = { ...initialJobForm.gigDetails };
      }

      if (jobForm.jobType !== 'Gig/Flexible') {
        updates.preferredWorkingDays = defaultPreferredDays;
      }

      return Object.keys(updates).length ? { ...prev, ...updates } : prev;
    });
  }, [jobForm.jobType]);

  // Scroll to top when switching to college selection step
  useEffect(() => {
    if (currentStep === 'college-selection') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  useEffect(() => {
    if (jobForm.isFresher) {
      setJobForm((prev) => ({
        ...prev,
        workExperience: { min: '', max: '' },
      }));
    }
  }, [jobForm.isFresher]);

  useEffect(() => {
    if (jobForm.workMode === 'Remote') {
      setJobForm((prev) => ({
        ...prev,
        location: '',
      }));
    }
  }, [jobForm.workMode]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    
    // If "Post This Job to Colleges" is enabled, move to college selection step
    if (jobForm.postToColleges && currentStep === 'job-details') {
      setCurrentStep('college-selection');
      return;
    }
    
    // If only public posting (no college posting), go directly to preview
    if (jobForm.postToPublic && !jobForm.postToColleges && onPreviewJob) {
      onPreviewJob(jobForm);
      return;
    }
    
    const jobSummary = createJobSummary(jobForm);
    onJobPosted?.(jobSummary);
    resetForm();
  };

  const handlePrevious = () => {
    if (currentStep === 'college-selection') {
      setCurrentStep('job-details');
    }
  };

  const handlePostJob = () => {
    // When coming from college selection, go to preview
    if (onPreviewJob) {
      onPreviewJob(jobForm);
      return;
    }
    
    const jobSummary = createJobSummary(jobForm);
    onJobPosted?.(jobSummary);
    resetForm();
  };

  return (
    <div className="bg-white">
      <div className="max-screen-6xl">
        {currentStep === 'job-details' ? (
          // Job Details Step
          <>
            <div className="mb-10">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0270DF]">Post a job</span>
                <span className="text-2xl font-bold text-[#0A0A0A]">-</span>
                <span className="text-2xl font-bold text-[#0A0A0A]">Hot vacancy</span>
              </div>
              <p className="mt-2 text-gray-600">Post a job to hire the best talent for your company.</p>
              <hr className="mt-8 border-t border-[#E5E7EB]" />
            </div>

            <form className="space-y-10" onSubmit={handleSubmit}>
          <section>
            <div className="flex flex-col gap-2 mb-8">
              <h3 className="text-xl font-semibold text-gray-900">About Job</h3>
              <p className="text-sm text-[#717182]">Share the essentials to attract the right candidates.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FieldLabel label="Job Title" required>
                <TextInput
                  value={jobForm.title}
                  onChange={(value) => setJobForm((prev) => ({ ...prev, title: value }))}
                  placeholder="Enter clear and specific title to get better response"
                />
              </FieldLabel>

              <FieldLabel label="Job Type" required>
                <div className="relative">
                  <select
                    value={jobForm.jobType}
                    onChange={(event) =>
                      setJobForm((prev) => ({
                        ...prev,
                        jobType: event.target.value as JobType,
                      }))
                    }
                    className={selectClass}
                  >
                    {jobTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D98B5]" />
                </div>
              </FieldLabel>

              <FieldLabel label="Key Skills" required>
                <SkillsInput
                  skills={jobForm.keySkills}
                  onChange={(skills) => setJobForm((prev) => ({ ...prev, keySkills: skills }))}
                  placeholder="Add skills separated by commas"
                />
              </FieldLabel>

              <FieldLabel label="Work Mode" required>
                <SelectInput
                  value={jobForm.workMode}
                  onChange={(value) => setJobForm((prev) => ({ ...prev, workMode: value }))}
                  placeholder="Select work mode"
                  options={[
                    { label: 'Remote', value: 'Remote' },
                    { label: 'On-site', value: 'On-site' },
                    { label: 'Hybrid', value: 'Hybrid' },
                  ]}
                />
              </FieldLabel>

{!isInternship && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Work Experience (Years)<span className="text-red-500">*</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: "#4A5565" }}>Fresher</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={jobForm.isFresher || false}
                        onChange={(event) => setJobForm((prev) => ({ ...prev, isFresher: event.target.checked }))}
                      />
                      <span className="relative block h-7 w-12 rounded-full bg-[#CFD6E6] transition-colors duration-200 peer-checked:bg-[#11E61C]">
                        <span className="absolute top-[2px] left-[2px] block h-6 w-6 rounded-full bg-white transition-transform duration-200 transform peer-checked:translate-x-5" />
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className={`relative ${jobForm.isFresher ? 'opacity-50 pointer-events-none' : ''}`}>
                      <SelectInput
                        value={jobForm.isFresher ? '' : jobForm.workExperience.min}
                        onChange={(value) =>
                          setJobForm((prev) => ({
                            ...prev,
                            workExperience: { ...prev.workExperience, min: value },
                          }))
                        }
                        placeholder="Min"
                        options={['0', '1', '2', '3', '4', '5'].map((label) => ({ label, value: label }))}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`relative ${jobForm.isFresher ? 'opacity-50 pointer-events-none' : ''}`}>
                      <SelectInput
                        value={jobForm.isFresher ? '' : jobForm.workExperience.max}
                        onChange={(value) =>
                          setJobForm((prev) => ({
                            ...prev,
                            workExperience: { ...prev.workExperience, max: value },
                          }))
                        }
                        placeholder="Max"
                        options={['1', '2', '3', '4', '5', '10+'].map((label) => ({ label, value: label }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              <FieldLabel label="Educational Qualification" required>
                <div className="relative">
                  <TextInput
                    value={jobForm.educationQualification}
                    onChange={(value) => {
                      if (value.length <= 10) {
                        setJobForm((prev) => ({ ...prev, educationQualification: value }));
                      }
                    }}
                    placeholder="Enter qualification"
                    className={jobForm.educationQualification.length > 10 ? 'border-red-500' : ''}
                  />
                  <p className="mt-1 text-xs text-[#717182]">
                    {jobForm.educationQualification.length}/10 characters
                  </p>
                </div>
              </FieldLabel>

              <FieldLabel label="Application End Date" required>
                <TextInput
                  value={jobForm.endDate}
                  onChange={(value) => setJobForm((prev) => ({ ...prev, endDate: value }))}
                  placeholder="dd-mm-yyyy"
                  type="date"
                />
              </FieldLabel>

              <FieldLabel label="Number of Openings" required>
                <TextInput
                  value={jobForm.numberOfOpenings}
                  onChange={(value) => setJobForm((prev) => ({ ...prev, numberOfOpenings: value }))}
                  placeholder="0"
                  type="number"
                />
              </FieldLabel>

              {isFullTime ? (
                <FieldLabel label="Annual Salary Range" required>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-[#E2E6EF] bg-white text-sm text-gray-600 shadow-sm">
                        ₹
                      </div>
                      <TextInput
                        value={jobForm.payRange.min}
                        onChange={(value) =>
                          setJobForm((prev) => ({
                            ...prev,
                            payRange: { ...prev.payRange, min: value },
                          }))
                        }
                        placeholder="Min"
                        type="number"
                      />
                    </div>
                    <span className="text-sm text-[#717182]">to</span>
                    <div className="flex-1">
                      <TextInput
                        value={jobForm.payRange.max}
                        onChange={(value) =>
                          setJobForm((prev) => ({
                            ...prev,
                            payRange: { ...prev.payRange, max: value },
                          }))
                        }
                        placeholder="Max"
                        type="number"
                      />
                    </div>
                  </div>
                </FieldLabel>
              ) : !isInternship && !isGig && !isContract ? (
                <>
                  <FieldLabel label="Compensation Type" required>
                    <SelectInput
                      value={jobForm.compensationType}
                      onChange={(value) => setJobForm((prev) => ({ ...prev, compensationType: value }))}
                      placeholder="Select compensation"
                      options={isPartTime ? [
                        { label: 'Hourly Rate (₹/hour)', value: 'Hourly Rate (₹/hour)' },
                        { label: 'Daily Basic (₹/day)', value: 'Daily Basic (₹/day)' },
                        { label: 'Monthly Salary', value: 'Monthly Salary' },
                        { label: 'Project Based', value: 'Project Based' },
                      ] : [
                        { label: 'Salary', value: 'Salary' },
                        { label: 'Stipend', value: 'Stipend' },
                        { label: 'Hourly', value: 'Hourly' },
                      ]}
                    />
                  </FieldLabel>

                  <FieldLabel label="Pay Range" required>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-[#E2E6EF] bg-white text-sm text-gray-600 shadow-sm">
                          ₹
                        </div>
                        <TextInput
                          value={jobForm.payRange.min}
                          onChange={(value) =>
                            setJobForm((prev) => ({
                              ...prev,
                              payRange: { ...prev.payRange, min: value },
                            }))
                          }
                          placeholder="Min"
                          type="number"
                        />
                      </div>
                      <span className="text-sm text-[#717182]">to</span>
                      <div className="flex-1">
                        <TextInput
                          value={jobForm.payRange.max}
                          onChange={(value) =>
                            setJobForm((prev) => ({
                              ...prev,
                              payRange: { ...prev.payRange, max: value },
                            }))
                          }
                          placeholder="Max"
                          type="number"
                        />
                      </div>
                    </div>
                  </FieldLabel>
                </>
              ) : null}

              {isFullTime && (
                <FieldLabel label="Notice Period" required>
                  <SelectInput
                    value={jobForm.fullTimeDetails.noticePeriod}
                    onChange={(value) => setJobForm((prev) => ({ 
                      ...prev, 
                      fullTimeDetails: { ...prev.fullTimeDetails, noticePeriod: value } 
                    }))}
                    placeholder="Notice Period"
                    options={[
                      { label: 'Immediate Joiner', value: 'Immediate Joiner' },
                      { label: '15 Days', value: '15 Days' },
                      { label: '30 Days', value: '30 Days' },
                    ]}
                  />
                </FieldLabel>
              )}

              {!isContract && (
                <FieldLabel label="Location" required={jobForm.workMode !== 'Remote'}>
                  <div className="relative">
                    <input
                      type="text"
                      value={jobForm.workMode === 'Remote' ? '' : jobForm.location}
                      onChange={(event) => {
                        if (jobForm.workMode !== 'Remote') {
                          setJobForm((prev) => ({ ...prev, location: event.target.value }));
                        }
                      }}
                      placeholder={jobForm.workMode === 'Remote' ? 'Location not required for remote work' : 'Enter job location'}
                      disabled={jobForm.workMode === 'Remote'}
                      className={`${baseInputClass} ${jobForm.workMode === 'Remote' ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                    />
                    {jobForm.workMode === 'Remote' && (
                      <p className="mt-1 text-xs text-[#717182]">Location is optional for remote positions</p>
                    )}
                  </div>
                </FieldLabel>
              )}
            </div>

            {/* Job Description for Full-Time only - stays in original position */}
            {isFullTime && (
              <div className="mt-8">
                <FieldLabel label="Job Description" required>
                  <textarea
                    placeholder="Type role & responsibilities and key deliverables for this role in briefly"
                    rows={6}
                    className="w-full rounded-md border border-[#E4E7EF] bg-white px-6 py-5 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF]"
                    value={jobForm.description}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                    required
                  />
                </FieldLabel>
              </div>
            )}
          </section>

          {isPartTime && (
            <section className="rounded-2xl border border-[#E0E4F4] bg-[#F5F5F7] p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3 text-lg font-semibold text-gray-900">
                <span className="text-2xl font-bold" style={{ color: "#4A5565" }}>•</span>
                <span>Part-Time Arrangement</span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FieldLabel label="Daily Timings" required>
                  <SelectInput
                    value={jobForm.dailyTimings}
                    onChange={(value) => setJobForm((prev) => ({ ...prev, dailyTimings: value }))}
                    placeholder="Select timing"
                    options={[
                      { label: 'Morning (9 AM - 1 PM)', value: 'morning' },
                      { label: 'Afternoon (1 PM - 5 PM)', value: 'afternoon' },
                      { label: 'Evening (5 PM - 9 PM)', value: 'evening' },
                      { label: 'Flexible Timing', value: 'flexible' },
                    ]}
                    variant="pill"
                  />
                </FieldLabel>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Preferred Working Days<span className="text-red-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3 text-sm font-medium text-gray-700 md:grid-cols-4">
                  {DAYS.map((day) => (
                    <label key={day} className="flex items-center gap-3">
                      <span>{day}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={jobForm.preferredWorkingDays[day]}
                        onChange={(event) =>
                          setJobForm((prev) => ({
                            ...prev,
                            preferredWorkingDays: {
                              ...prev.preferredWorkingDays,
                              [day]: event.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#717182]">Select all days when candidate should be available to work</p>
              </div>
            </section>
          )}

          {/* Job Description for Part-Time jobs */}
          {isPartTime && (
            <section>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2"></h3>
                <p className="text-sm text-[#717182]"></p>
              </div>
              <FieldLabel label="Job Description" required>
                <textarea
                  placeholder="Type role & responsibilities and key deliverables for this role in briefly"
                  rows={6}
                  className="w-full rounded-md border border-[#E4E7EF] bg-white px-6 py-5 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF]"
                  value={jobForm.description}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </FieldLabel>
            </section>
          )}

          {isFullTime && (
            <section>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Benefits & Perks</h3>
                <p className="text-sm text-[#717182]">Add additional benefits and perks to attract candidates.</p>
              </div>
              
              <div className="space-y-3">
                {jobForm.benefits.map((benefit) => (
                  <div key={benefit.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={benefit.enabled}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          benefits: prev.benefits.map((b) =>
                            b.id === benefit.id ? { ...b, enabled: event.target.checked } : b
                          ),
                        }))
                      }
                    />
                    <div className="flex-1">
                      <TextInput
                        value={benefit.text}
                        onChange={(value) =>
                          setJobForm((prev) => ({
                            ...prev,
                            benefits: prev.benefits.map((b) =>
                              b.id === benefit.id ? { ...b, text: value } : b
                            ),
                          }))
                        }
                        placeholder="Enter benefit or perk"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setJobForm((prev) => ({
                          ...prev,
                          benefits: prev.benefits.filter((b) => b.id !== benefit.id),
                        }))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const newId = Date.now().toString();
                    setJobForm((prev) => ({
                      ...prev,
                      benefits: [
                        ...prev.benefits,
                        { id: newId, text: '', enabled: false },
                      ],
                    }));
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-[#717182] transition hover:border-blue-400 hover:text-blue-600"
                >
                  + Add Benefit or Perk
                </button>
              </div>
            </section>
          )}

          {isInternship && (
            <section className="rounded-3xl border border-[#E0E4F4] bg-[#F7F8FF] p-8 shadow-sm">
              <CardHeading dotColor="#4256FF" title="Internship Program Details" />
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FieldLabel label="Internship Duration" required>
                  <SelectInput
                    value={jobForm.internshipDetails.duration}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        internshipDetails: { ...prev.internshipDetails, duration: value },
                      }))
                    }
                    placeholder="Select duration"
                    options={['1 month', '2 months', '3 months', '6 months', '12 months'].map((label) => ({
                      label,
                      value: label,
                    }))}
                    variant="pill"
                  />
                </FieldLabel>

                <FieldLabel label="Compensation Type" required>
                  <SelectInput
                    value={jobForm.internshipDetails.compensation}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        internshipDetails: { ...prev.internshipDetails, compensation: value },
                      }))
                    }
                    placeholder="Select compensation"
                    options={['Paid', 'Unpaid', 'Performance Based'].map((label) => ({ label, value: label }))}
                    variant="pill"
                  />
                </FieldLabel>
              </div>

              {jobForm.internshipDetails.compensation === 'Paid' && (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FieldLabel label="Monthly Stipend (₹)">
                    <input
                      type="number"
                      value={jobForm.internshipDetails.stipend}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          internshipDetails: { ...prev.internshipDetails, stipend: event.target.value },
                        }))
                      }
                      placeholder="Enter stipend amount"
                      className="w-full appearance-none rounded-full border border-transparent bg-[#D0D3E7] px-4 py-3 text-sm font-medium text-[#262629] placeholder:text-[#262629] shadow-sm transition focus:border-[#9CABFF] focus:outline-none focus:ring-2 focus:ring-[#D8DEFF]"
                    />
                    <p className="mt-2 text-xs text-[#717182]">Enter amount only for paid internships</p>
                  </FieldLabel>
                </div>
              )}

              <div className="mt-6">
                <FieldLabel label="Conversion Possibility">
                  <SelectInput
                    value={jobForm.internshipDetails.conversionPossibility}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        internshipDetails: { ...prev.internshipDetails, conversionPossibility: value },
                      }))
                    }
                    placeholder="Select option"
                    options={['Yes - Performance Based', 'Maybe - Based on requirements', 'No - Internship Only'].map((label) => ({
                      label,
                      value: label,
                    }))}
                    variant="pill"
                  />
                </FieldLabel>
              </div>

              <div className="mt-6">
                <FieldLabel label="Certificate Provided">
                  <SelectInput
                    value={jobForm.internshipDetails.certificateProvided}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        internshipDetails: { ...prev.internshipDetails, certificateProvided: value },
                      }))
                    }
                    placeholder="Select certificate"
                    options={['Internship Certificate', 'Letter of Recommendation', 'No certificate'].map((label) => ({
                      label,
                      value: label,
                    }))}
                    variant="pill"
                  />
                </FieldLabel>
              </div>
            </section>
          )}

          {/* Job Description for Internship */}
          {isInternship && (
            <section>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2"></h3>
                <p className="text-sm text-[#717182]"></p>
              </div>
              <FieldLabel label="Job Description" required>
                <textarea
                  placeholder="Type role & responsibilities and key deliverables for this internship in briefly"
                  rows={6}
                  className="w-full rounded-md border border-[#E4E7EF] bg-white px-6 py-5 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF]"
                  value={jobForm.description}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </FieldLabel>
            </section>
          )}

          {isContract && (
            <section className="rounded-3xl border border-[#E0E4F4] bg-[#F7F8FF] p-8 shadow-sm">
              <CardHeading dotColor="#4256FF" title="Contract Assignment Details" />
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FieldLabel label="Contract Duration" required>
                  <SelectInput
                    value={jobForm.contractDetails.duration}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        contractDetails: { ...prev.contractDetails, duration: value },
                      }))
                    }
                    placeholder="Select duration"
                    options={['Short term', 'Mid term', 'Long term'].map((label) => ({ label, value: label }))}
                    variant="pill"
                  />
                </FieldLabel>

                <FieldLabel label="Payment Structure" required>
                  <SelectInput
                    value={jobForm.contractDetails.paymentStructure}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        contractDetails: { ...prev.contractDetails, paymentStructure: value },
                      }))
                    }
                    placeholder="Select structure"
                    options={['Monthly', 'Milestone-based', 'Hourly rate', 'Project completion'].map((label) => ({
                      label,
                      value: label,
                    }))}
                    variant="pill"
                  />
                </FieldLabel>

                <FieldLabel label="Payment Amount (₹)" required>
                  <input
                    type="number"
                    value={jobForm.contractDetails.paymentAmount}
                    onChange={(event) =>
                      setJobForm((prev) => ({
                        ...prev,
                        contractDetails: { ...prev.contractDetails, paymentAmount: event.target.value },
                      }))
                    }
                    placeholder="Enter payment amount"
                    className="w-full appearance-none rounded-full border border-transparent bg-[#D0D3E7] px-4 py-3 text-sm font-medium text-[#262629] placeholder:text-[#262629] shadow-sm transition focus:border-[#9CABFF] focus:outline-none focus:ring-2 focus:ring-[#D8DEFF]"
                  />
                </FieldLabel>

                <FieldLabel label="Extension Possibility">
                  <SelectInput
                    value={jobForm.contractDetails.extensionPossibility}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        contractDetails: { ...prev.contractDetails, extensionPossibility: value },
                      }))
                    }
                    placeholder="Select option"
                    options={['Yes - Performance Based', 'Maybe - Based on requirements'].map((label) => ({ label, value: label }))}
                    variant="pill"
                  />
                </FieldLabel>
              </div>
            </section>
          )}

          {/* Job Description for Contract/Freelance */}
          {isContract && (
            <section>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2"></h3>
                <p className="text-sm text-[#717182]"></p>
              </div>
              <FieldLabel label="Job Description" required>
                <textarea
                  placeholder="Type project scope, deliverables and key requirements for this contract work"
                  rows={6}
                  className="w-full rounded-md border border-[#E4E7EF] bg-white px-6 py-5 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF]"
                  value={jobForm.description}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </FieldLabel>
            </section>
          )}

          {isGig && (
            <section className="rounded-3xl border border-[#E0E4F4] bg-[#F7F8FF] p-8 shadow-sm">
              <CardHeading dotColor="#4256FF" title="Gig/Flexible Job Details" />
              
              {/* Preferred Working Days */}
              <div className="mb-6">
                <span className="text-sm font-medium text-gray-700 mb-4 block">
                  Preferred Working Days<span className="text-red-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3 text-sm font-medium text-gray-700 md:grid-cols-4">
                  {DAYS.map((day) => (
                    <label key={day} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={jobForm.gigDetails.preferredWorkingDays[day]}
                        onChange={(event) =>
                          setJobForm((prev) => ({
                            ...prev,
                            gigDetails: {
                              ...prev.gigDetails,
                              preferredWorkingDays: {
                                ...prev.gigDetails.preferredWorkingDays,
                                [day]: event.target.checked,
                              },
                            },
                          }))
                        }
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#717182] mt-2">Select all days when candidate should be available to work</p>
              </div>

              {/* Work Schedule and Hours per Session */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                <FieldLabel label="Work Schedule" required>
                  <SelectInput
                    value={jobForm.gigDetails.workSchedule}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, workSchedule: value },
                      }))
                    }
                    placeholder="Select schedule"
                    options={[
                      { label: 'Morning Shifts (6 AM - 12 PM)', value: 'morning' },
                      { label: 'Afternoon Shifts (12 PM - 6 PM)', value: 'afternoon' },
                      { label: 'Evening Shifts (6 PM - 12 AM)', value: 'evening' },
                      { label: 'Night Shifts (12 AM - 6 AM)', value: 'night' },
                      { label: 'Flexible Timing', value: 'flexible' },
                      { label: 'On-Demand Basis', value: 'ondemand' },
                    ]}
                    variant="pill"
                  />
                </FieldLabel>

                <FieldLabel label="Hours per Session" required>
                  <SelectInput
                    value={jobForm.gigDetails.hoursPerSession}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, hoursPerSession: value },
                      }))
                    }
                    placeholder="Select hours"
                    options={[
                      { label: '2 hours/session', value: '2' },
                      { label: '4 hours/session', value: '4' },
                      { label: '6 hours/session', value: '6' },
                      { label: '8 hours/session', value: '8' },
                      { label: 'Flexible hours', value: 'flexible' },
                    ]}
                    variant="pill"
                  />
                </FieldLabel>
              </div>

              {/* Payment Structure and Rate Amount */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                <FieldLabel label="Payment Structure" required>
                  <SelectInput
                    value={jobForm.gigDetails.paymentStructure}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, paymentStructure: value },
                      }))
                    }
                    placeholder="Select payment"
                    options={[
                      { label: 'Hourly Rate (₹/hour)', value: 'hourly' },
                      { label: 'Daily Rate (₹/day)', value: 'daily' },
                      { label: 'Per Task/Order', value: 'pertask' },
                      { label: 'Weekly Payment', value: 'weekly' },
                    ]}
                    variant="pill"
                  />
                </FieldLabel>

                <FieldLabel label="Rate Amount (₹)" required>
                  <input
                    type="number"
                    value={jobForm.gigDetails.rateAmount}
                    onChange={(event) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, rateAmount: event.target.value },
                      }))
                    }
                    placeholder="e.g. 500"
                    className="w-full appearance-none rounded-full border border-transparent bg-[#D0D3E7] px-4 py-3 text-sm font-medium text-[#262629] shadow-sm transition focus:border-[#9CABFF] focus:outline-none focus:ring-2 focus:ring-[#D8DEFF] placeholder:text-[#262629]"
                  />
                </FieldLabel>
              </div>

              {/* Gig Type and Commitment Level */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                <FieldLabel label="Gig Type" required>
                  <SelectInput
                    value={jobForm.gigDetails.gigType}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, gigType: value },
                      }))
                    }
                    placeholder="Select type"
                    options={[
                      { label: 'Delivery & Logistics', value: 'delivery' },
                      { label: 'Events & Promotions', value: 'events' },
                      { label: 'Tech & Digital Tasks', value: 'tech' },
                      { label: 'Retail & Customer Services', value: 'retail' },
                      { label: 'Creative & Content', value: 'creative' },
                      { label: 'Other', value: 'other' },
                    ]}
                    variant="pill"
                  />
                </FieldLabel>

                <FieldLabel label="Commitment Level" required>
                  <SelectInput
                    value={jobForm.gigDetails.commitmentLevel}
                    onChange={(value) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, commitmentLevel: value },
                      }))
                    }
                    placeholder="Select commitment"
                    options={[
                      { label: 'One-time Gig', value: 'onetime' },
                      { label: 'Weekly Commitment', value: 'weekly' },
                      { label: 'Monthly Commitment', value: 'monthly' },
                      { label: 'Ongoing Opportunity', value: 'ongoing' },
                      { label: 'Seasonal Work', value: 'seasonal' },
                    ]}
                    variant="pill"
                  />
                </FieldLabel>
              </div>

              {/* Requirements */}
              <div>
                <FieldLabel label="Requirements">
                  <textarea
                    value={jobForm.gigDetails.specialRequirements}
                    onChange={(event) =>
                      setJobForm((prev) => ({
                        ...prev,
                        gigDetails: { ...prev.gigDetails, specialRequirements: event.target.value },
                      }))
                    }
                    placeholder="e.g. Own vechile required, smartphone needed, specific skills..."
                    rows={3}
                    className="w-full rounded-lg border border-[#E2E6EF] bg-[#D0D3E7] px-4 py-3 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm transition focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF] resize-none"
                  />
                </FieldLabel>
              </div>
            </section>
          )}

          {/* Job Description for Gig/Flexible */}
          {isGig && (
            <section>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2"></h3>
                <p className="text-sm text-[#717182]"></p>
              </div>
              <FieldLabel label="Job Description" required>
                <textarea
                  placeholder="Type gig work description, tasks and key expectations for this flexible role"
                  rows={6}
                  className="w-full rounded-md border border-[#E4E7EF] bg-white px-6 py-5 text-sm text-[#262629] placeholder:text-[#262629] shadow-sm focus:border-[#2D7BFF] focus:outline-none focus:ring-2 focus:ring-[#D6E6FF]"
                  value={jobForm.description}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </FieldLabel>
            </section>
          )}

          {isInternship && (
            <section>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Benefits & Perks</h3>
                <p className="text-sm text-[#717182]">Add additional benefits and perks to attract candidates.</p>
              </div>
              
              <div className="space-y-3">
                {jobForm.benefits.map((benefit) => (
                  <div key={benefit.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={benefit.enabled}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          benefits: prev.benefits.map((b) =>
                            b.id === benefit.id ? { ...b, enabled: event.target.checked } : b
                          ),
                        }))
                      }
                    />
                    <div className="flex-1">
                      <TextInput
                        value={benefit.text}
                        onChange={(value) =>
                          setJobForm((prev) => ({
                            ...prev,
                            benefits: prev.benefits.map((b) =>
                              b.id === benefit.id ? { ...b, text: value } : b
                            ),
                          }))
                        }
                        placeholder="Enter benefit or perk"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setJobForm((prev) => ({
                          ...prev,
                          benefits: prev.benefits.filter((b) => b.id !== benefit.id),
                        }))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const newId = Date.now().toString();
                    setJobForm((prev) => ({
                      ...prev,
                      benefits: [
                        ...prev.benefits,
                        { id: newId, text: '', enabled: false },
                      ],
                    }));
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-[#717182] transition hover:border-blue-400 hover:text-blue-600"
                >
                  + Add Benefit or Perk
                </button>
              </div>
            </section>
          )}

                    <section className="space-y-4">
            <ToggleCard
              icon="🌍"
              label="Post This Job to Public"
              checked={jobForm.postToPublic}
              onChange={(checked) => setJobForm((prev) => ({ ...prev, postToPublic: checked }))}
            >
              {jobForm.postToPublic && (
                <div className="rounded-lg bg-[#6CE771]/20 px-4 py-3 text-sm text-[#1E361F]">
                  Job will be visible to all candidates on CampusPe, including non-campus students
                </div>
              )}
            </ToggleCard>
            <ToggleCard
              icon="🎓"
              label="Post This Job to Colleges"
              checked={jobForm.postToColleges}
              onChange={(checked) => setJobForm((prev) => ({ ...prev, postToColleges: checked }))}
            >
              {jobForm.postToColleges && (
                <div className="mt-6">
                  <div className="rounded-lg border border-[#00C950] bg-[#6CE771]/10 px-4 py-3 text-sm text-[#00A63E]">
                    Job will be shared directly with selected colleges for targeted campus recruitment
                  </div>
                </div>
              )}
            </ToggleCard>
          </section>

          <div className="flex flex-col gap-3 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="rounded-full border border-[#D4D8E4] px-8 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#F2F4FF]"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="rounded-full px-10 py-3 text-sm font-semibold text-white shadow-sm transition"
              style={{ background: 'linear-gradient(90deg, #0B58F4 0%, #2590FB 100%)' }}
            >
              {jobForm.postToColleges ? 'Next' : 'Post Job'}
            </button>
          </div>
        </form>
        </>
        ) : (
          // College Selection Step
          <>
            <div className="mb-10">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0270DF]">Campus Recruitment</span>
              </div>
              <p className="text-sm text-gray-600">Job will be shared directly with selected colleges for targeted campus recruitment</p>
              <hr className="mt-8 border-t border-[#E5E7EB]" />
            </div>

            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All Degrees</option>
                  <option>B.Tech</option>
                  <option>M.Tech</option>
                  <option>MBA</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All Specializations</option>
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Target Graduation Years Section */}
            <div className="rounded-2xl border border-[#008EFF] p-6 mb-8" style={{ backgroundColor: 'rgba(0, 142, 255, 0.08)' }}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-medium text-[#008EFF] flex items-center gap-2">
                  <span className="text-[#008EFF]">🎯</span>
                  Target Graduation Years
                </h2>
                <span 
                  className="inline-block rounded-full px-3 py-1 text-sm font-medium"
                  style={{ backgroundColor: 'rgba(68, 143, 254, 0.1)', color: '#008EFF' }}
                >
                  {jobForm.targetGraduationYears.length} years selected
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {['Batch of 2023', 'Batch of 2024', 'Batch of 2025', 'Batch of 2026'].map((year) => (
                  <label key={year} className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={jobForm.targetGraduationYears.includes(year)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setJobForm(prev => ({
                            ...prev,
                            targetGraduationYears: isChecked
                              ? [...prev.targetGraduationYears, year]
                              : prev.targetGraduationYears.filter(y => y !== year)
                          }));
                        }}
                        className="h-4 w-4 rounded-sm border-2 appearance-none focus:ring-2"
                        style={{
                          borderRadius: '2px',
                          borderColor: '#0377EB',
                          backgroundColor: jobForm.targetGraduationYears.includes(year) ? 'rgba(39, 145, 252, 0.15)' : 'transparent',
                        }}
                      />
                      {jobForm.targetGraduationYears.includes(year) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-3 h-3 text-[#0377EB]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-[#0377EB]">{year}</span>
                  </label>
                ))}
              </div>
              
              <p className="text-sm text-[#0377EB] flex items-center gap-1">
                <span>💡</span>
                Select multiple graduation years to maximize your candidate pool
              </p>
            </div>

            {/* Selection Summary */}
            <div className="mb-8">
              <div className="rounded-2xl border border-[#22C55E] bg-[#F0FFF4] p-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#CFF7D6] px-4 py-2 text-sm font-semibold text-[#15803D]">
                  <span>{jobForm.selectedColleges.length} colleges</span>
                  <span className="text-[#22C55E]">•</span>
                  <span>{jobForm.targetGraduationYears.length} graduation years selected</span>
                </span>
              </div>
            </div>

            {/* Colleges Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campusRecruitmentColleges.map((college) => (
                <CampusRecruitmentCollegeCard
                  key={college.id}
                  college={college}
                  selected={jobForm.selectedColleges.includes(college.id)}
                  onToggle={(nextSelected) => {
                    setJobForm((prev) => ({
                      ...prev,
                      selectedColleges: nextSelected
                        ? [...prev.selectedColleges, college.id]
                        : prev.selectedColleges.filter((id) => id !== college.id),
                    }));
                  }}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8">
              <button
                type="button"
                onClick={handlePrevious}
                className="rounded-full border border-[#D4D8E4] px-8 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#F2F4FF]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handlePostJob}
                className="rounded-full px-10 py-3 text-sm font-semibold text-white shadow-sm transition"
                style={{ background: 'linear-gradient(90deg, #0B58F4 0%, #2590FB 100%)' }}
              >
                Post Job
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostJobSection;
