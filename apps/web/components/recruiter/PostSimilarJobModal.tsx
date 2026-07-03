import React, { useState } from 'react';
import { X, Copy, AlertCircle } from 'lucide-react';

interface JobData {
  id: string;
  title: string;
  jobType: string;
  workMode: string;
  keySkills: string[];
  location: string;
  endDate: string;
  educationalQualification: string;
  numberOfOpenings: number;
  description: string;
  internshipDuration?: string;
  compensationType?: string;
  monthlyStipend?: string;
  conversionPossibility?: string;
  certificateProvided?: string;
  benefits?: string[];
  postedToPublic: boolean;
  postedToColleges: boolean;
}

interface PostSimilarJobModalProps {
  originalJob: JobData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: Partial<JobData>) => void;
}

const PostSimilarJobModal: React.FC<PostSimilarJobModalProps> = ({
  originalJob,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<JobData>>({
    title: originalJob?.title || '',
    jobType: originalJob?.jobType || '',
    workMode: originalJob?.workMode || '',
    keySkills: originalJob?.keySkills || [],
    location: originalJob?.location || '',
    educationalQualification: originalJob?.educationalQualification || '',
    numberOfOpenings: originalJob?.numberOfOpenings || 0,
    description: originalJob?.description || '',
    internshipDuration: originalJob?.internshipDuration || '',
    compensationType: originalJob?.compensationType || '',
    monthlyStipend: originalJob?.monthlyStipend || '',
    conversionPossibility: originalJob?.conversionPossibility || '',
    certificateProvided: originalJob?.certificateProvided || '',
    benefits: originalJob?.benefits || [],
    postedToPublic: originalJob?.postedToPublic || false,
    postedToColleges: originalJob?.postedToColleges || false,
  });

  const [skillInput, setSkillInput] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!isOpen || !originalJob) return null;

  const isInternship = formData.jobType?.toLowerCase().includes('internship');

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.keySkills?.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        keySkills: [...(formData.keySkills || []), skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      keySkills: formData.keySkills?.filter(s => s !== skill) || []
    });
  };

  const handleSubmit = () => {
    onSubmit({ ...formData, endDate });
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Post a job - <span className="text-blue-600">Hot vacancy</span>
                </h2>
                <p className="mt-1 text-sm text-gray-600">Post job to hire best talent for your company</p>
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
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 p-4">
              <Copy className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Creating similar job posting
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  Fields have been pre-filled from the original job. Review and modify as needed.
                </p>
              </div>
            </div>

            {/* About Job Section */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">About Job</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter new and specific job as per talent response"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select your job type</option>
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Key Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add skill"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddSkill}
                      type="button"
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.keySkills?.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2.5 py-1 text-sm font-medium text-purple-700"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:text-purple-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Work Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select work mode</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={today}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Educational Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.educationalQualification}
                    onChange={(e) => setFormData({ ...formData, educationalQualification: e.target.value })}
                    placeholder="Enter your qualifying skill level"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter job location"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Number of Openings <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfOpenings}
                    onChange={(e) => setFormData({ ...formData, numberOfOpenings: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Internship Program Details (conditional) */}
              {isInternship && (
                <div className="rounded-lg bg-purple-50 p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                    Internship Program Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Internship Duration <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.internshipDuration}
                        onChange={(e) => setFormData({ ...formData, internshipDuration: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select duration</option>
                        <option value="1 month">1 month</option>
                        <option value="2 months">2 months</option>
                        <option value="3 months">3 months</option>
                        <option value="6 months">6 months</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Compensation Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.compensationType}
                        onChange={(e) => setFormData({ ...formData, compensationType: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select compensation</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Monthly Stipend (₹)
                      </label>
                      <input
                        type="text"
                        value={formData.monthlyStipend}
                        onChange={(e) => setFormData({ ...formData, monthlyStipend: e.target.value })}
                        placeholder="Enter stipend amount"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Enter amount only for paid internships</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Conversion Possibility
                      </label>
                      <select
                        value={formData.conversionPossibility}
                        onChange={(e) => setFormData({ ...formData, conversionPossibility: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Performance-based">Performance-based</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Certificate Provided
                      </label>
                      <select
                        value={formData.certificateProvided}
                        onChange={(e) => setFormData({ ...formData, certificateProvided: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select certificate</option>
                        <option value="Completion Certificate">Completion Certificate</option>
                        <option value="Experience Certificate">Experience Certificate</option>
                        <option value="No Certificate">No Certificate</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Type rule & responsibilities for this role in briefly"
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Benefits & Perks */}
              <div className="rounded-lg bg-gray-50 p-5">
                <h4 className="mb-4 text-base font-semibold text-gray-900">Benefits & Perks</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Health insurance</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Flexible working hours</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Professional development budget</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Stocks options</span>
                  </label>
                </div>
              </div>

              {/* Post This Job To */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    🌍
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Post This Job to Public</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={formData.postedToPublic}
                      onChange={(e) => setFormData({ ...formData, postedToPublic: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                  </label>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    🎓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Post This Job to Colleges</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={formData.postedToColleges}
                      onChange={(e) => setFormData({ ...formData, postedToColleges: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                  </label>
                </div>
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
                Save as Draft
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)'
                }}
              >
                Post Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSimilarJobModal;
