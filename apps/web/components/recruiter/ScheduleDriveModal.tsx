import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Users, Building, Briefcase, CheckCircle, ArrowRight, ArrowLeft, Eye } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Job {
  _id: string;
  title: string;
  jobType: string;
  workMode: string;
  location?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
}

interface ScheduleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  college: {
    _id: string;
    name: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
  };
  onSuccess?: () => void;
}

type InterviewMode = 'Offline' | 'Online';

const ScheduleDriveModal: React.FC<ScheduleDriveModalProps> = ({ 
  isOpen, 
  onClose, 
  college,
  onSuccess 
}) => {
  // Step management (1: Select Job, 2: Drive Details, 3: Review)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Job Selection
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  
  // Step 2: Drive Details
  const [visitDate, setVisitDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('Offline');
  const [meetLink, setMeetLink] = useState('');
  const [location, setLocation] = useState('');
  const [maxStudents, setMaxStudents] = useState('50');
  
  // Placement Officer (fetched from college data)
  const [placementOfficer, setPlacementOfficer] = useState({
    name: 'Dr. Rajesh Kumar',
    email: 'placement@abc.ac.in',
    phone: '+91 1011001101'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available jobs when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 1) {
      fetchAvailableJobs();
    }
  }, [isOpen, currentStep]);

  const fetchAvailableJobs = async () => {
    try {
      setLoadingJobs(true);
      const token = localStorage.getItem('token');
      
      // Dummy jobs data for demonstration
      const dummyJobs: Job[] = [
        {
          _id: 'job1',
          title: 'Frontend Developer',
          jobType: 'Full-Time',
          workMode: 'Hybrid',
          location: 'Bangalore, Karnataka',
          salaryRange: { min: 8, max: 12 }
        },
        {
          _id: 'job2',
          title: 'Backend Developer',
          jobType: 'Full-Time',
          workMode: 'Remote',
          location: 'Mumbai, Maharashtra',
          salaryRange: { min: 10, max: 15 }
        },
        {
          _id: 'job3',
          title: 'Data Analyst',
          jobType: 'Full-Time',
          workMode: 'On-site',
          location: 'Delhi, NCR',
          salaryRange: { min: 6, max: 10 }
        },
        {
          _id: 'job4',
          title: 'Product Manager',
          jobType: 'Full-Time',
          workMode: 'Hybrid',
          location: 'Pune, Maharashtra',
          salaryRange: { min: 15, max: 25 }
        },
        {
          _id: 'job5',
          title: 'UI/UX Designer',
          jobType: 'Full-Time',
          workMode: 'Remote',
          location: 'Hyderabad, Telangana',
          salaryRange: { min: 7, max: 12 }
        }
      ];

      // Use dummy jobs instead of API call
      setAvailableJobs(dummyJobs);
      
      // Uncomment below to use real API
      // const response = await axios.get(`${API_BASE_URL}/api/jobs/active`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setAvailableJobs(response.data || dummyJobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      // Fallback to dummy jobs on error
      const fallbackJobs: Job[] = [
        {
          _id: 'job1',
          title: 'Frontend Developer',
          jobType: 'Full-Time',
          workMode: 'Hybrid',
          location: 'Bangalore, Karnataka',
          salaryRange: { min: 8, max: 12 }
        }
      ];
      setAvailableJobs(fallbackJobs);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleScheduleDrive = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const driveData = {
        id: `cvr-${Date.now()}`,
        collegeId: college._id,
        collegeName: college.name,
        jobId: selectedJob?._id,
        jobTitle: selectedJob?.title,
        visitDate,
        interviewMode,
        startTime,
        endTime,
        timeSlot: `${startTime} - ${endTime}`,
        meetLink: interviewMode === 'Online' ? meetLink : undefined,
        location: interviewMode === 'Offline' ? location : undefined,
        onCampus: interviewMode === 'Offline' ? location : undefined,
        venue: interviewMode,
        meetingType: 'Campus Visit',
        slots: maxStudents,
        maxStudents: parseInt(maxStudents),
        status: 'pending',
        createdBy: 'company',
        timestamp: new Date().toISOString(),
        hrContact: {
          name: placementOfficer.name,
          email: placementOfficer.email,
          phone: placementOfficer.phone
        },
        meetingAgenda: `Campus recruitment drive for ${selectedJob?.title} positions`,
        company: {
          name: 'TechCorp Solutions', // This should come from the logged-in company's profile
          location: 'Bangalore, India',
          industry: 'Technology',
          logo: 'TC'
        }
      };

      try {
        // Try to make the API call
        await axios.post(`${API_BASE_URL}/api/campus-visits/schedule`, driveData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError: any) {
        console.log('API endpoint not yet implemented, storing locally');
        
        // Store in localStorage as fallback (for demo purposes)
        const existingRequests = JSON.parse(localStorage.getItem('campus-visit-requests') || '[]');
        localStorage.setItem('campus-visit-requests', JSON.stringify([...existingRequests, driveData]));
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error scheduling campus drive:', err);
      setError(err.response?.data?.message || 'Failed to schedule campus drive. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedJob(null);
    setVisitDate('');
    setStartTime('');
    setEndTime('');
    setInterviewMode('Offline');
    setMeetLink('');
    setLocation('');
    setMaxStudents('50');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedJob) {
        setError('Please select a job to continue');
        return;
      }
      setError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validation for drive details
      if (!visitDate || !startTime || !endTime) {
        setError('Please fill in date and time fields');
        return;
      }
      if (interviewMode === 'Online' && !meetLink) {
        setError('Please provide a meeting link for online mode');
        return;
      }
      if (interviewMode === 'Offline' && !location) {
        setError('Please provide a location for offline mode');
        return;
      }
      setError('');
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  if (!isOpen) return null;

  const getStepName = (step: number) => {
    switch (step) {
      case 1: return 'Select Job';
      case 2: return 'Drive Details';
      case 3: return 'Review';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-gray-700 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Plan a Campus Drive - {college.name}
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {college.location.city}, {college.location.state}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep >= step ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {getStepName(step)}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Select Job */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Create or Select a Job</h3>
                <p className="text-sm text-gray-600">
                  Choose an existing job or create a new one for {college.name}
                </p>
              </div>

              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">How would you like to proceed?</h4>
                
                <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start gap-2 mb-3">
                    <input
                      type="radio"
                      id="select-existing"
                      name="job-option"
                      checked={true}
                      readOnly
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="select-existing" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Select an existing job
                      </label>
                      <p className="text-xs text-gray-600 mt-0.5">Choose from your active job postings</p>
                    </div>
                  </div>

                  {loadingJobs ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      Loading available jobs...
                    </div>
                  ) : availableJobs.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500 mb-3">No active jobs found</p>
                      <button
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => {/* Navigate to create job */}}
                      >
                        + Create a new job posting
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Choose a job to share
                        </label>
                        <select
                          value={selectedJob?._id || ''}
                          onChange={(e) => {
                            const job = availableJobs.find(j => j._id === e.target.value);
                            setSelectedJob(job || null);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a job...</option>
                          {availableJobs.map((job) => (
                            <option key={job._id} value={job._id}>
                              {job.title} - {job.jobType} - ₹{job.salaryRange?.min}-{job.salaryRange?.max} LPA
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedJob && (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-gray-900">{selectedJob.title}</h5>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  {selectedJob.jobType}
                                </span>
                              </div>
                              {selectedJob.salaryRange && (
                                <p className="text-sm text-gray-600">
                                  ₹{selectedJob.salaryRange.min}-{selectedJob.salaryRange.max} LPA
                                </p>
                              )}
                            </div>
                            <button
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                // View job details
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              View job
                            </button>
                          </div>
                          <div className="mt-2 p-2 bg-green-100 rounded-md flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-green-700">
                              {selectedJob.title} will be shared exclusively with {college.name} for this drive
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Drive Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Add Drive Details</h3>
                <p className="text-sm text-gray-600">Set up your campus drive schedule and logistics</p>
              </div>

              {/* College and Job Info */}
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-start gap-2 mb-2">
                  <Building className="w-4 h-4 text-gray-600 mt-0.5" />
                  <h4 className="font-semibold text-gray-900">{college.name}</h4>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />
                  {college.location.city}, {college.location.state}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Briefcase className="w-3 h-3" />
                  {selectedJob?.title}
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">Drive Schedule</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visit Date*
                    </label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      placeholder="Pick a date"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interview Mode*
                    </label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value as InterviewMode)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Offline">Offline</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time*
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="--:--"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time*
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="--:--"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Students Slots
                  </label>
                  <input
                    type="number"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {interviewMode === 'Online' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meet Link*
                    </label>
                    <input
                      type="url"
                      value={meetLink}
                      onChange={(e) => setMeetLink(e.target.value)}
                      placeholder="http:str.googledemo.meetlink.co"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {interviewMode === 'Offline' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location*
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Campus location"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Placement Officer */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Placement Officer Contact</h4>
                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-start gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600 mt-0.5" />
                    <h5 className="font-semibold text-gray-900">{placementOfficer.name}</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{placementOfficer.email}</p>
                  <p className="text-sm text-gray-600 mb-2">{placementOfficer.phone}</p>
                  <p className="text-xs text-gray-500">
                    {placementOfficer.name} will receive a confirmation email and can reschedule if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Review & Confirm Drive</h3>
                <p className="text-sm text-gray-600">Please verify all details before sending to the college</p>
              </div>

              {/* Success Message */}
              <div className="p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">All details verified and ready to send</p>
              </div>

              {/* Company Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2.5">Company</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-base font-semibold text-gray-900 mb-1">XYZ Company</p>
                  <p className="text-sm text-gray-600">New Delhi, India</p>
                </div>
              </div>

              {/* Job Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2.5">Job Details</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-base font-semibold text-gray-900">{selectedJob?.title || 'Backend Developer'}</h5>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium whitespace-nowrap">
                      Exclusive to this college
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{college.location.city}, {college.location.state}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-700 font-medium">
                      {selectedJob?.jobType || 'Full-Time'}
                    </span>
                    {selectedJob?.salaryRange && (
                      <span className="text-xs text-gray-600">
                        ${selectedJob.salaryRange.min}-{selectedJob.salaryRange.max} LPA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Drive Schedule */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2.5">Drive Schedule</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-medium">
                        {visitDate ? new Date(visitDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'October 15th, 2025'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-medium">{startTime} - {endTime}</span>
                    </div>
                    
                    <hr className="border-gray-200" />
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Interview Mode</p>
                      <p className="text-sm text-gray-900 font-medium">{interviewMode === 'Offline' ? 'On Campus' : interviewMode}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Slots</p>
                      <p className="text-sm text-gray-900 font-medium">
                        <Calendar className="w-4 h-4 inline mr-1 text-gray-600" />
                        {maxStudents} students maximum
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placement Officer */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2.5">Placement Officer</h4>
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start gap-2.5 mb-2">
                    <Users className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{placementOfficer.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{placementOfficer.email} · {placementOfficer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      {placementOfficer.name} will receive a confirmation email and can reschedule if needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start gap-2 mb-2.5">
                  <span className="text-lg">💡</span>
                  <h4 className="text-sm font-semibold text-gray-900">What happens next</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">{placementOfficer.name} will receive a confirmation email</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">The college can accept, reschedule, or request changes</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">You'll be notified instantly for any updates</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">Students will see this job once confirmed by the college</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {currentStep === 2 ? 'Back to Job Details' : 'Back to Drive Details'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
              >
                {currentStep === 1 ? 'Continue to Drive Details' : 'Continue to Drive Details'}
              </button>
            ) : (
              <button
                onClick={handleScheduleDrive}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)' }}
              >
                {loading ? 'Scheduling...' : 'Confirm & Notify College'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDriveModal;
