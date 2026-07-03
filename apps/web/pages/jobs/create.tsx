'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_BASE_URL } from '../../utils/api';

const CreateJobPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'full-time',
    department: '',
    companyName: '',
    locations: [{
      city: '',
      state: '',
      country: 'India',
      isRemote: false,
      hybrid: false
    }],
    workMode: 'onsite',
    requirements: [{
      skill: '',
      level: 'intermediate',
      mandatory: true,
      category: 'technical'
    }],
    experienceLevel: 'entry',
    minExperience: 0,
    maxExperience: 5,
    educationRequirements: [{
      degree: '',
      field: '',
      mandatory: false
    }],
    salary: {
      min: 300000,
      max: 600000,
      currency: 'INR',
      negotiable: true
    },
    benefits: [],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalPositions: 1,
    targetColleges: [],
    targetCourses: [],
    allowDirectApplications: true,
    interviewProcess: {
      rounds: ['Technical Round', 'HR Round'],
      duration: '2 weeks',
      mode: 'hybrid'
    },
    isUrgent: false,
    matchingKeywords: []
  });

  const [newBenefit, setNewBenefit] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newTargetCourse, setNewTargetCourse] = useState('');
  const [availableColleges, setAvailableColleges] = useState([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);
  const [jobPostingType, setJobPostingType] = useState('general'); // 'general' or 'colleges'

  // Fetch available colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setIsLoadingColleges(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/colleges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableColleges(response.data || []);
      } catch (error) {
        console.error('Error fetching colleges:', error);
      } finally {
        setIsLoadingColleges(false);
      }
    };

    fetchColleges();
  }, []);

  const handleCollegeSelection = (collegeId: string) => {
    setFormData(prev => ({
      ...prev,
      targetColleges: prev.targetColleges.includes(collegeId)
        ? prev.targetColleges.filter(id => id !== collegeId)
        : [...prev.targetColleges, collegeId]
    }));
  };

  const handleJobPostingTypeChange = (type: string) => {
    setJobPostingType(type);
    if (type === 'general') {
      setFormData(prev => ({ ...prev, targetColleges: [] }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleLocationChange = (index: number, field: string, value: string | boolean) => {
    const updatedLocations = [...formData.locations];
    updatedLocations[index] = { ...updatedLocations[index], [field]: value };
    setFormData(prev => ({ ...prev, locations: updatedLocations }));
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { city: '', state: '', country: 'India', isRemote: false, hybrid: false }]
    }));
  };

  const removeLocation = (index: number) => {
    if (formData.locations.length > 1) {
      const updatedLocations = formData.locations.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, locations: updatedLocations }));
    }
  };

  const handleRequirementChange = (index: number, field: string, value: string | boolean) => {
    const updatedRequirements = [...formData.requirements];
    updatedRequirements[index] = { ...updatedRequirements[index], [field]: value };
    setFormData(prev => ({ ...prev, requirements: updatedRequirements }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, { skill: '', level: 'intermediate', mandatory: true, category: 'technical' }]
    }));
  };

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const updatedRequirements = formData.requirements.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, requirements: updatedRequirements }));
    }
  };

  const handleEducationChange = (index: number, field: string, value: string | boolean) => {
    const updatedEducation = [...formData.educationRequirements];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setFormData(prev => ({ ...prev, educationRequirements: updatedEducation }));
  };

  const addEducationRequirement = () => {
    setFormData(prev => ({
      ...prev,
      educationRequirements: [...prev.educationRequirements, { degree: '', field: '', mandatory: false }]
    }));
  };

  const removeEducationRequirement = (index: number) => {
    const updatedEducation = formData.educationRequirements.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, educationRequirements: updatedEducation }));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(benefit => benefit !== benefitToRemove)
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.matchingKeywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        matchingKeywords: [...prev.matchingKeywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      matchingKeywords: prev.matchingKeywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const addTargetCourse = () => {
    if (newTargetCourse.trim() && !formData.targetCourses.includes(newTargetCourse.trim())) {
      setFormData(prev => ({
        ...prev,
        targetCourses: [...prev.targetCourses, newTargetCourse.trim()]
      }));
      setNewTargetCourse('');
    }
  };

  const removeTargetCourse = (courseToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      targetCourses: prev.targetCourses.filter(course => course !== courseToRemove)
    }));
  };

  const handleInterviewRoundChange = (index: number, value: string) => {
    const updatedRounds = [...formData.interviewProcess.rounds];
    updatedRounds[index] = value;
    setFormData(prev => ({
      ...prev,
      interviewProcess: { ...prev.interviewProcess, rounds: updatedRounds }
    }));
  };

  const addInterviewRound = () => {
    setFormData(prev => ({
      ...prev,
      interviewProcess: {
        ...prev.interviewProcess,
        rounds: [...prev.interviewProcess.rounds, '']
      }
    }));
  };

  const removeInterviewRound = (index: number) => {
    if (formData.interviewProcess.rounds.length > 1) {
      const updatedRounds = formData.interviewProcess.rounds.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        interviewProcess: { ...prev.interviewProcess, rounds: updatedRounds }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Extract token from localStorage
      const token = localStorage.getItem('token');
      
      // Decode JWT token to get user ID
      let userId = null;
      if (token) {
        try {
          const base64Payload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(base64Payload));
          userId = decodedPayload.userId;
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
        }
      }

      // Validate required fields
      if (!formData.title) {
        setSubmitError('Job title is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.description) {
        setSubmitError('Job description is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.companyName) {
        setSubmitError('Company name is required');
        setIsSubmitting(false);
        return;
      }
      if (!userId) {
        setSubmitError('User authentication required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.applicationDeadline) {
        setSubmitError('Application deadline is required');
        setIsSubmitting(false);
        return;
      }

      // Filter and validate locations
      const validLocations = formData.locations.filter(loc => loc.city && loc.state);
      if (validLocations.length === 0) {
        setSubmitError('At least one valid location is required');
        setIsSubmitting(false);
        return;
      }

      // Filter and validate requirements
      const validRequirements = formData.requirements.filter(req => req.skill);
      
      // Filter and validate education requirements
      const validEducationRequirements = formData.educationRequirements.filter(edu => edu.degree);

      // Prepare job data in the specified format
      const jobData = {
        title: formData.title,
        description: formData.description,
        jobType: formData.jobType,
        department: formData.department,
        companyName: formData.companyName,
        locations: validLocations,
        workMode: formData.workMode,
        requirements: validRequirements,
        requiredSkills: validRequirements.map(req => req.skill),
        experienceLevel: formData.experienceLevel,
        minExperience: formData.minExperience,
        maxExperience: formData.maxExperience,
        educationRequirements: validEducationRequirements,
        salary: {
          min: Number(formData.salary.min),
          max: Number(formData.salary.max),
          currency: formData.salary.currency,
          negotiable: formData.salary.negotiable
        },
        benefits: formData.benefits,
        applicationDeadline: formData.applicationDeadline,
        totalPositions: formData.totalPositions,
        interviewProcess: {
          rounds: formData.interviewProcess.rounds.filter(round => round.trim()),
          duration: formData.interviewProcess.duration,
          mode: formData.interviewProcess.mode
        },
        recruiterId: userId
      };

      console.log('Submitting job data:', jobData);

      // Send request with Authorization header
      const response = await axios.post(`${API_BASE_URL}/api/jobs`, jobData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Job created successfully:', response.data);
      
      // If college-specific posting, send invitations
      if (jobPostingType === 'colleges' && formData.targetColleges.length > 0) {
        try {
          const jobId = response.data.job?._id || response.data._id;
          
          // Send invitations to selected colleges
          for (const collegeId of formData.targetColleges) {
            await axios.post(`${API_BASE_URL}/api/invitations`, {
              jobId,
              collegeId,
              message: `Invitation for ${jobData.title} position at ${jobData.companyName}`
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
          
          alert(`Job posted successfully and invitations sent to ${formData.targetColleges.length} college(s)! Our AI will automatically analyze the description, extract key skills, and match it with qualified students from the selected colleges.`);
        } catch (inviteError) {
          console.error('Error sending college invitations:', inviteError);
          alert('Job posted successfully, but there was an issue sending college invitations. You can send invitations later from the job management page.');
        }
      } else {
        // Show success message for general posting
        alert(response.data.message || 'Job posted successfully! Our AI will automatically analyze the description, extract key skills, and match it with qualified students. Matching students will receive personalized WhatsApp notifications.');
      }
      
      router.push('/dashboard/recruiter');
    } catch (error: any) {
      console.error('Error creating job:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        setSubmitError(error.response.data.errors.join(', '));
      } else if (error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else {
        setSubmitError('Failed to create job. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 mb-2">Post New Job</h1>
            <p className="text-gray-600">Create a job posting with AI-powered matching</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          {/* Job Title & Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Senior Software Engineer"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                placeholder="e.g., TechCorp India"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Work Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Mode
              </label>
              <select
                name="workMode"
                value={formData.workMode}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locations *
            </label>
            {formData.locations.map((location, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      value={location.city}
                      onChange={(e) => handleLocationChange(index, 'city', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Chennai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      value={location.state}
                      onChange={(e) => handleLocationChange(index, 'state', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Tamil Nadu"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                    <input
                      type="text"
                      value={location.country}
                      onChange={(e) => handleLocationChange(index, 'country', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., India"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={location.isRemote}
                        onChange={(e) => handleLocationChange(index, 'isRemote', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Remote OK</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={location.hybrid}
                        onChange={(e) => handleLocationChange(index, 'hybrid', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hybrid</span>
                    </label>
                  </div>
                  {formData.locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLocation}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              + Add Another Location
            </button>
          </div>

          {/* Job Type & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Engineering, Marketing"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Experience Level & Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive Level</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Experience (years)
              </label>
              <input
                type="number"
                name="minExperience"
                value={formData.minExperience}
                onChange={handleInputChange}
                min="0"
                max="20"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Experience (years)
              </label>
              <input
                type="number"
                name="maxExperience"
                value={formData.maxExperience}
                onChange={handleInputChange}
                min="0"
                max="20"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Describe the job role, responsibilities, and what you're looking for in a candidate..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements *
            </label>
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Skill</label>
                    <input
                      type="text"
                      value={requirement.skill}
                      onChange={(e) => handleRequirementChange(index, 'skill', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., React"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                    <select
                      value={requirement.level}
                      onChange={(e) => handleRequirementChange(index, 'level', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select
                      value={requirement.category}
                      onChange={(e) => handleRequirementChange(index, 'category', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="technical">Technical</option>
                      <option value="soft">Soft Skills</option>
                      <option value="language">Language</option>
                      <option value="certification">Certification</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={requirement.mandatory}
                        onChange={(e) => handleRequirementChange(index, 'mandatory', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Required</span>
                    </label>
                  </div>
                </div>
                {formData.requirements.length > 1 && (
                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Requirement
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              + Add Requirement
            </button>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Range (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="salary.min"
                value={formData.salary.min}
                onChange={handleInputChange}
                placeholder="Min salary"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                name="salary.max"
                value={formData.salary.max}
                onChange={handleInputChange}
                placeholder="Max salary"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                name="salary.currency"
                value={formData.salary.currency}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits & Perks
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        benefits: prev.benefits.filter((_, i) => i !== index)
                      }));
                    }}
                    className="ml-2 text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  const benefit = prompt('Enter a benefit:');
                  if (benefit && benefit.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      benefits: [...prev.benefits, benefit.trim()]
                    }));
                  }
                }}
                className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700 transition-colors"
              >
                + Add Benefit
              </button>
            </div>
          </div>

          {/* Application Deadline & Positions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                min={today}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Positions
              </label>
              <input
                type="number"
                name="totalPositions"
                value={formData.totalPositions}
                onChange={handleInputChange}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Job Posting Type & College Selection */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Job Posting Type
              </label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="general"
                    name="jobPostingType"
                    value="general"
                    checked={jobPostingType === 'general'}
                    onChange={(e) => handleJobPostingTypeChange(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="general" className="ml-3 text-sm font-medium text-gray-700">
                    General Job Posting
                  </label>
                  <span className="ml-2 text-xs text-gray-500">
                    (Open to all students on the platform)
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="colleges"
                    name="jobPostingType"
                    value="colleges"
                    checked={jobPostingType === 'colleges'}
                    onChange={(e) => handleJobPostingTypeChange(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="colleges" className="ml-3 text-sm font-medium text-gray-700">
                    College-Specific Posting
                  </label>
                  <span className="ml-2 text-xs text-gray-500">
                    (Send invitations to specific colleges)
                  </span>
                </div>
              </div>
            </div>

            {jobPostingType === 'colleges' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Target Colleges
                </label>
                {isLoadingColleges ? (
                  <div className="text-gray-500 text-sm">Loading colleges...</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-2">
                    {availableColleges.length === 0 ? (
                      <div className="text-gray-500 text-sm">No colleges available</div>
                    ) : (
                      availableColleges.map((college: any) => (
                        <div key={college._id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`college-${college._id}`}
                            checked={formData.targetColleges.includes(college._id)}
                            onChange={() => handleCollegeSelection(college._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`college-${college._id}`}
                            className="ml-3 text-sm text-gray-700 cursor-pointer"
                          >
                            {college.name}
                            {college.location && (
                              <span className="text-gray-500 ml-1">
                                ({college.location.city}, {college.location.state})
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {formData.targetColleges.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">
                      Selected: {formData.targetColleges.length} college(s)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Enhancement Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-500 text-xl">🤖</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">AI-Powered Enhancement</h3>
                <p className="mt-1 text-sm text-blue-600">
                  Once you submit this job, our AI will automatically analyze the description, 
                  extract key skills, and match it with qualified students. Matching students 
                  will receive personalized WhatsApp notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg text-white transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Creating Job...' : 'Post Job'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
};

export default function CreateJob() {
  return (
    <ProtectedRoute allowedRoles={['recruiter']}>
      <CreateJobPage />
    </ProtectedRoute>
  );
}
