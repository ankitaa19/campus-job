'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Briefcase, MapPin, Search, MapPinIcon, Building2, Share2, Users, GraduationCap, BadgeCheck, X, CalendarDays, Upload, Gift, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import Image from 'next/image';
import { JOB_SEEDS, type JobSeed } from '../../data/jobSeeds';

type Job = Omit<JobSeed, 'skills' | 'benefits'> & {
  skills?: Array<string | { skill?: string; name?: string }>;
  applications?: number;
  applicants?: number;
  matchPercentage?: number;
  requirements?: Array<{ skill: string; level?: string; mandatory?: boolean }>;
  requiredSkills?: string[];
  minExperience?: number;
  maxExperience?: number;
  applicationDeadline?: string;
  educationRequirements?: Array<{ degree: string; field?: string }>;
  benefits?: Array<string | { text?: string; enabled?: boolean }>;
  interviewProcess?: { rounds?: string[]; duration?: string; mode?: string };
  department?: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(JOB_SEEDS);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(JOB_SEEDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedDatePosted, setSelectedDatePosted] = useState<string>('');
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showResumeStep, setShowResumeStep] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prefer live jobs, using the shared seed records if the API is unavailable.
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/jobs/public`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setJobs(response.data);
          setFilteredJobs(response.data);
        } else {
          setJobs(JOB_SEEDS);
          setFilteredJobs(JOB_SEEDS);
        }
      } catch (error) {
        console.log('API error, using seeded jobs:', error);
        setJobs(JOB_SEEDS);
        setFilteredJobs(JOB_SEEDS);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = [...jobs];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Location filter (search text and selected list)
    if (locationFilter.trim()) {
      filtered = filtered.filter(job =>
        job.locations.some(loc =>
          loc.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
          loc.state.toLowerCase().includes(locationFilter.toLowerCase())
        )
      );
    }

    if (selectedLocations.length > 0) {
      filtered = filtered.filter(job =>
        job.locations.some(loc =>
          selectedLocations.some(sel =>
            loc.city.toLowerCase().includes(sel.toLowerCase()) || loc.state.toLowerCase().includes(sel.toLowerCase())
          )
        )
      );
    }

    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter(job => selectedJobTypes.includes(getJobTypeLabel(job.jobType)));
    }

    if (selectedExperience.length > 0) {
      filtered = filtered.filter(job => selectedExperience.some(exp => job.experienceLevel.toLowerCase().includes(exp.toLowerCase())));
    }

    if (selectedWorkModes.length > 0) {
      filtered = filtered.filter(job => selectedWorkModes.some(mode => job.workMode.toLowerCase().includes(mode.toLowerCase())));
    }

    if (selectedDatePosted) {
      filtered = filtered.filter(job => {
        const diffDays = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (selectedDatePosted === 'Last 24 hours') return diffDays < 1;
        if (selectedDatePosted === 'Last 7 Days') return diffDays < 7;
        if (selectedDatePosted === 'Last 15 Days') return diffDays < 15;
        return true;
      });
    }

    if (minSalary > 0) {
      filtered = filtered.filter(job => job.salary.min >= minSalary);
    }

    setFilteredJobs(filtered);
  }, [searchQuery, locationFilter, jobs, selectedExperience, selectedJobTypes, selectedWorkModes, selectedLocations, selectedDatePosted, minSalary]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `${Math.max(diffInMinutes, 1)} mins ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return 'Salary not disclosed';
    if (salary.max === 0) {
      return `₹${salary.min.toLocaleString()}/hour`;
    }
    if (salary.min >= 100000 || salary.max >= 100000) {
      return `₹${(salary.min / 100000).toFixed(1).replace('.0', '')}-${(salary.max / 100000).toFixed(1).replace('.0', '')} LPA`;
    }
    return `₹${salary.min.toLocaleString()} - ₹${salary.max.toLocaleString()}`;
  };

  const getSkills = (job: Job) => {
    const source = job.requiredSkills?.length ? job.requiredSkills : job.requirements?.length ? job.requirements : job.skills || [];
    return source.map((skill) => typeof skill === 'string' ? skill : skill.skill || skill.name || '').filter(Boolean);
  };

  const getExperience = (job: Job) => {
    if (typeof job.minExperience === 'number' || typeof job.maxExperience === 'number') {
      return `${job.minExperience || 0}-${job.maxExperience ?? job.minExperience ?? 0} yrs`;
    }
    return job.experienceLevel || 'Fresher';
  };

  const openJobDetails = async (job: Job) => {
    setSelectedJob(job);
    setShowResumeStep(false);
    setDetailsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/${job._id}`);
      setSelectedJob(response.data?.job || response.data || job);
    } catch {
      setSelectedJob(job);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'internship':
        return 'Internship';
      case 'full-time':
        return 'Full-Time';
      case 'part-time':
        return 'Part-Time';
      case 'freelance':
        return 'Freelance Jobs';
      case 'contract':
        return 'Gig/Flexible';
      default:
        return type;
    }
  };

  const formatPreferredDays = (days?: string[] | string) => {
    if (!days) return '';
    return Array.isArray(days) ? days.filter(Boolean).join(', ') : days;
  };

  const getJobTypeDetails = (job: Job) => {
    const type = job.jobType.toLowerCase();
    const detail = (label: string, value?: string | number) => ({
      label,
      value: value === undefined || value === null || value === '' ? '' : String(value)
    });
    const internship = job.internshipDetails;
    const fullTime = job.fullTimeDetails;
    const partTime = job.partTimeDetails;
    const freelance = job.contractDetails;
    const gig = job.gigDetails;
    const experience = getExperience(job);
    const openings = job.totalPositions || 1;

    if (type.includes('intern')) {
      const compensation = internship?.compensation || job.compensationType || 'Not specified';
      const isPaid = compensation.toLowerCase() === 'paid';
      return [
        detail('Work Experience', experience),
        detail('Internship Duration', internship?.duration),
        detail('Compensation Type', compensation),
        detail('Stipend', isPaid ? internship?.stipend || formatSalary(job.salary) : 'Unpaid internship'),
        detail('Conversion Possibility', internship?.conversionPossibility),
        detail('Certificate Provided', internship?.certificateProvided),
        detail('Number of Openings', openings)
      ].filter((item) => item.value);
    }

    if (type.includes('full')) {
      const payRange = fullTime?.payRange;
      const salaryRange = payRange?.min || payRange?.max
        ? [payRange.min, payRange.max].filter(Boolean).join(' - ')
        : formatSalary(job.salary);
      return [
        detail('Work Experience', experience),
        detail('Notice Period', fullTime?.noticePeriod || job.noticePeriod || 'Not specified'),
        detail('Compensation Type', fullTime?.compensationType || job.compensationType || 'Annual salary'),
        detail('Salary', salaryRange),
        detail('Number of Openings', openings)
      ].filter((item) => item.value);
    }

    if (type.includes('part')) {
      return [
        detail('Work Experience', experience),
        detail('Daily Timings', partTime?.dailyTimings || job.dailyTimings),
        detail('Preferred Working Days', formatPreferredDays(partTime?.preferredWorkingDays || job.preferredWorkingDays)),
        detail('Payment Structure', partTime?.compensationType || job.compensationType || 'Not specified'),
        detail('Rate Amount', partTime?.hourlyRate || formatSalary(job.salary)),
        detail('Number of Openings', openings)
      ].filter((item) => item.value);
    }

    if (type.includes('freelance')) {
      return [
        detail('Work Experience', experience),
        detail('Contract Duration', freelance?.duration || job.contractDuration),
        detail('Payment Structure', freelance?.paymentStructure || job.paymentStructure),
        detail('Payment Amount', freelance?.paymentAmount || job.paymentAmount || formatSalary(job.salary)),
        detail('Extension Possibility', freelance?.extensionPossibility || job.extensionPossibility),
        detail('Number of Openings', openings)
      ].filter((item) => item.value);
    }

    if (type.includes('contract') || type.includes('gig') || type.includes('flexible')) {
      return [
        detail('Work Experience', experience),
        detail('Daily Timings', gig?.workSchedule || job.dailyTimings),
        detail('Payment Structure', gig?.paymentStructure || job.paymentStructure),
        detail('Hours Per Session', gig?.hoursPerSession || job.hoursPerSession),
        detail('Rate Amount', gig?.rateAmount || formatSalary(job.salary)),
        detail('Gig Type', gig?.gigType || job.gigType),
        detail('Commitment Level', gig?.commitmentLevel || job.commitmentLevel),
        detail('Number of Openings', openings)
      ].filter((item) => item.value);
    }

    return [
      detail('Work Experience', experience),
      detail('Compensation', formatSalary(job.salary)),
      detail('Number of Openings', openings)
    ];
  };

  const resetFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setSelectedLocations([]);
    setSelectedJobTypes([]);
    setSelectedExperience([]);
    setSelectedDatePosted('');
    setSelectedWorkModes([]);
    setMinSalary(0);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <div 
          className="relative hidden overflow-hidden"
          style={{ backgroundColor: 'rgba(204, 177, 255, 0.12)' }}
        >
          <div className="relative max-w-[1400px] mx-auto px-6 py-16 lg:py-20">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-medium text-black leading-tight">
                  Find a job that suits
                  <br />
                  your interest &amp; skills.
                </h1>
                <p className="text-black max-w-xl leading-relaxed">
                  Aliquam vitae turpis in diam convallis finibus in at diam.
                  <br />
                  Nullam in scelerisque leo, eget sollicitudin velit vestibulum.
                </p>

                {/* Search Bar */}
                <div 
                  className="bg-white rounded-full shadow-lg p-2 flex flex-col sm:flex-row sm:items-center gap-3 w-full"
                  style={{ 
                    maxWidth: '920px',
                    border: '2px solid #1484F3'
                  }}
                >
                  <div className="flex items-center flex-1 px-4">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Job title or keywords"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full outline-none text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  <span className="hidden sm:block h-10 w-px bg-gray-200" />
                  <div className="flex items-center flex-1 px-4">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full outline-none text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    className="text-white px-8 py-3 rounded-full font-semibold transition-colors whitespace-nowrap"
                    style={{ backgroundColor: '#1484F3' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d6edb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1484F3'}
                    aria-label="Search jobs"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative hidden lg:flex justify-end">
                <div className="relative">
                  <Image
                    src="/Group 1410107368.png"
                    alt="Job Search"
                    width={1000}
                    height={820}
                    className="relative z-10 object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-8">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
                <p className="mt-1 text-lg text-gray-600">{filteredJobs.length} jobs match your filters</p>
              </div>
              <p className="text-sm text-gray-500">Home&nbsp; / &nbsp;<span className="text-gray-900">Find job</span></p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm sm:p-7">
              <div className="flex h-12 items-center rounded-lg border border-[#cfdaef] px-4 focus-within:border-[#1484F3] focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="mr-3 h-5 w-5 shrink-0 text-[#0675df]" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-full w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" placeholder="Search by: Job title, Position, Keyword..." />
              </div>
              <p className="mb-3 mt-5 font-semibold text-gray-900">Job Type</p>
              <div className="flex flex-wrap gap-2.5">
                {['All Types', 'Full-Time', 'Part-Time', 'Internship', 'Freelance Jobs', 'Gig/Flexible'].map((type) => {
                  const active = type === 'All Types' ? selectedJobTypes.length === 0 : selectedJobTypes.includes(type);
                  return <button key={type} onClick={() => setSelectedJobTypes(type === 'All Types' ? [] : [type])} className={`rounded-full border px-5 py-2 text-sm transition-colors ${active ? 'border-[#1484F3] bg-blue-50 text-[#0878e4]' : 'border-[#cfdaef] text-gray-700 hover:border-[#1484F3]'}`}>{type === 'Freelance Jobs' ? 'Freelance' : type}</button>;
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-[2fr_repeat(5,1fr)]">
                <div className="col-span-2 flex h-11 items-center rounded-full border border-[#cfdaef] px-4 md:col-span-1">
                  <MapPin className="mr-2 h-4 w-4" /><input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="Location" />
                </div>
                <select value={selectedWorkModes[0] || ''} onChange={(event) => setSelectedWorkModes(event.target.value ? [event.target.value] : [])} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Work Mode</option><option>Remote</option><option>On-site</option><option>Hybrid</option></select>
                <select value={selectedExperience[0] || ''} onChange={(event) => setSelectedExperience(event.target.value ? [event.target.value] : [])} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Experience</option><option>Fresher</option><option>Entry</option><option>Expert</option></select>
                <select className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option>Sort By</option><option>Latest</option><option>Salary</option></select>
                <select value={minSalary || ''} onChange={(event) => setMinSalary(Number(event.target.value))} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Salary</option><option value="300000">₹3 LPA+</option><option value="600000">₹6 LPA+</option><option value="1000000">₹10 LPA+</option></select>
                <select value={selectedDatePosted} onChange={(event) => setSelectedDatePosted(event.target.value)} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Posted</option><option>Last 24 hours</option><option>Last 7 Days</option><option>Last 15 Days</option></select>
              </div>
            </div>
          </div>
          <div className="flex gap-6 lg:gap-10 items-start">
            {/* Filters Sidebar */}
            <div className="hidden w-72">
              <div className="sticky top-24 bg-white border border-[#e1ecfb] rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Filter By</h3>
                  <button
                    onClick={resetFilters}
                    className="text-sm font-semibold"
                    style={{ color: '#1484F3' }}
                  >
                    Reset All
                  </button>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh'].map(location => {
                      const checked = selectedLocations.includes(location);
                      return (
                        <label key={location} className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-2 accent-[#1484F3]"
                            checked={checked}
                            onChange={() =>
                              setSelectedLocations(prev =>
                                checked ? prev.filter(l => l !== location) : [...prev, location]
                              )
                            }
                          />
                          {location}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Job Type Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Job Type</h4>
                  <div className="space-y-2">
                    {['Full-Time', 'Part-Time', 'Internship', 'Gig/Flexible', 'Freelance Jobs'].map(type => {
                      const checked = selectedJobTypes.includes(type);
                      return (
                        <label key={type} className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-2 accent-[#1484F3]"
                            checked={checked}
                            onChange={() =>
                              setSelectedJobTypes(prev =>
                                checked ? prev.filter(t => t !== type) : [...prev, type]
                              )
                            }
                          />
                          {type}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Level Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Experience Level</h4>
                  <div className="space-y-2">
                    {['Fresher', 'Expert'].map(level => {
                      const checked = selectedExperience.includes(level);
                      return (
                        <label key={level} className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-2 accent-[#1484F3]"
                            checked={checked}
                            onChange={() =>
                              setSelectedExperience(prev =>
                                checked ? prev.filter(l => l !== level) : [...prev, level]
                              )
                            }
                          />
                          {level}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Date Posted Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Date Posted</h4>
                  <div className="space-y-2">
                    {['Last 24 hours', 'Last 7 Days', 'Last 15 Days'].map(date => (
                      <label key={date} className="flex items-center text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="date-posted"
                          className="mr-2 accent-[#1484F3]"
                          checked={selectedDatePosted === date}
                          onChange={() => setSelectedDatePosted(prev => (prev === date ? null : date))}
                        />
                        {date}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Mode Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Work Mode</h4>
                  <div className="space-y-2">
                    {['Remote', 'On-site', 'Hybrid'].map(mode => {
                      const checked = selectedWorkModes.includes(mode);
                      return (
                        <label key={mode} className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-2 accent-[#1484F3]"
                            checked={checked}
                            onChange={() =>
                              setSelectedWorkModes(prev =>
                                checked ? prev.filter(m => m !== mode) : [...prev, mode]
                              )
                            }
                          />
                          {mode}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Salary Filter */}
                <div className="mb-2">
                  <h4 className="font-medium text-gray-900 mb-3">Salary</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      value={minSalary}
                      onChange={(e) => setMinSalary(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Min ₹{minSalary.toLocaleString()}</span>
                      <span>Max</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="flex-1">
              {/* Showing Results and Sort By - Inline */}
              <div className="hidden items-center justify-between mb-6">
                <p className="text-gray-700">
                  Showing <span className="font-semibold text-gray-900">{filteredJobs.length > 0 ? '1-' : '0-'}{filteredJobs.length}</span> of <span className="font-semibold text-gray-900">{jobs.length}</span> results
                </p>
                <div className="relative">
                  <select 
                    className="appearance-none border border-[#40444D] bg-white rounded-lg pl-4 pr-9 py-2.5 text-sm text-[#40444D] outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                    defaultValue="latest"
                  >
                    <option value="latest">Latest</option>
                    <option value="salary-high">Salary: High to Low</option>
                    <option value="salary-low">Salary: Low to High</option>
                    <option value="experience">Experience</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <svg className="h-5 w-5 text-[#40444D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="group flex min-h-[410px] flex-col rounded-2xl border border-[#d8dadd] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1484F3] hover:shadow-lg"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <span className="text-xl font-bold text-[#1484F3]">{job.companyName.charAt(0)}</span>
                        {job.companyLogo ? (
                          <Image src={job.companyLogo} alt="" fill sizes="64px" className="bg-white object-contain p-1.5" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                        ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-base font-semibold text-gray-900 sm:text-lg">{job.companyName}</p>
                        <BadgeCheck className="h-5 w-5 shrink-0 fill-[#2584f5] text-white" aria-label="Verified company" />
                      </div>
                      <button onClick={() => openJobDetails(job)} className="mt-0.5 block text-left text-lg font-semibold leading-tight text-black hover:text-[#1484F3]">
                        {job.title}
                      </button>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `conic-gradient(#08bf63 ${(job.matchPercentage || 92) * 3.6}deg, #e5e7eb 0deg)` }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-gray-900">
                          {job.matchPercentage || 92}%
                        </div>
                      </div>
                      <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1484F3]" aria-label={`Share ${job.title}`}>
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-5 text-xl font-bold text-[#05a84f]">
                    {formatSalary(job.salary)} <span className="mx-2 text-gray-300">|</span><span className="font-semibold">{getJobTypeLabel(job.jobType)}</span>
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-y-3 text-sm font-medium text-gray-600 sm:text-base">
                    <span className="flex min-w-0 items-center gap-1.5 pr-3">
                      <MapPin className="h-5 w-5 shrink-0" />
                      <span className="truncate">{job.locations?.[0]?.city || 'Location'}, {job.locations?.[0]?.state || 'not specified'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 border-l border-gray-300 px-3">
                      <Building2 className="h-5 w-5" /> {job.workMode || 'On-site'}
                    </span>
                    <span className="flex items-center gap-1.5 border-l border-gray-300 pl-3">
                      <Briefcase className="h-5 w-5" /> {getExperience(job)}
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-base font-semibold text-gray-900">Skills Required</p>
                    <div className="flex flex-wrap gap-2">
                      {getSkills(job).slice(0, 3).map((skill, index) => (
                        <span key={index} className="min-w-[76px] rounded-md border border-gray-200 px-3 py-1.5 text-center text-sm font-medium text-gray-800">
                          {skill}
                        </span>
                      ))}
                      {getSkills(job).length > 3 && (
                        <span className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-800">+{getSkills(job).length - 3}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                    <GraduationCap className="h-5 w-5" />
                    <span>Posted {mounted ? getTimeAgo(job.postedAt) : ''}</span>
                    <span aria-hidden="true">•</span>
                    <Users className="h-4 w-4" />
                    <span>{job.applications ?? job.applicants ?? '1.2k'} applied</span>
                    <span aria-hidden="true">•</span>
                    <span>{job.totalPositions || 1} openings</span>
                  </div>

                  <button
                    onClick={() => openJobDetails(job)}
                    className="mt-auto w-full rounded-md bg-[#0d83f7] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[#086fd4] focus:outline-none focus:ring-2 focus:ring-[#1484F3] focus:ring-offset-2 sm:text-lg"
                  >
                    View &amp; Apply
                  </button>
                </div>
              ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-8">
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  &lt;
                </button>
                <button className="px-3 py-1 bg-[#1484F3] text-white rounded-full">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">3</button>
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">4</button>
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">5</button>
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">6</button>
                <button className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedJob && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/55 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`${selectedJob.title} details`}>
            <button onClick={() => setSelectedJob(null)} className="absolute inset-0 cursor-default" aria-label="Close job details" />
            <aside className="relative h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-[770px]">
              <button onClick={() => setSelectedJob(null)} className="fixed right-4 top-4 z-10 rounded-full bg-gray-900/75 p-2 text-white hover:bg-gray-900 sm:right-[790px] sm:top-1/2" aria-label="Close">
                <X className="h-6 w-6" />
              </button>
              <div className="flex min-h-full flex-col p-5 sm:p-10">
                <div className="flex items-start gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <span className="text-2xl font-bold text-[#1484F3]">{selectedJob.companyName?.charAt(0) || 'C'}</span>
                    {selectedJob.companyLogo && <Image src={selectedJob.companyLogo} alt="" fill sizes="64px" className="bg-white object-contain p-1" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-lg font-semibold text-gray-600">{selectedJob.companyName}<BadgeCheck className="h-5 w-5 fill-[#2584f5] text-white" /></div>
                    <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">{selectedJob.title}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-semibold" style={{ background: 'radial-gradient(white 58%, transparent 60%), conic-gradient(#08bf63 331deg, #e5e7eb 0)' }}>92%</div>
                    <Share2 className="h-8 w-8 text-gray-500" />
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-gray-600">
                  <span className="flex items-center gap-2"><Clock className="h-5 w-5" />{getJobTypeLabel(selectedJob.jobType)}</span>
                  <span className="flex items-center gap-2"><MapPin className="h-5 w-5" />{selectedJob.locations?.[0]?.city}, {selectedJob.locations?.[0]?.state}</span>
                  <span className="flex items-center gap-2"><Building2 className="h-5 w-5" />{selectedJob.workMode}</span>
                  {/* <span className="flex items-center gap-2"><Banknote className="h-5 w-5" />{formatSalary(selectedJob.salary)}</span> */}
                  <span className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Posted: {new Date(selectedJob.postedAt).toLocaleDateString('en-GB')}</span>
                </div>

                {detailsLoading ? (
                  <div className="flex flex-1 items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#1484F3]" /></div>
                ) : showResumeStep ? (
                  <div className="mt-10 flex flex-1 flex-col">
                    <div className="rounded-2xl border border-gray-300 p-6 sm:p-10">
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-[#cfdaef] p-5 text-center hover:bg-blue-50">
                        <Upload className="mb-2 h-7 w-7 text-[#1484F3]" />
                        <span className="font-semibold text-[#0878e4]">Upload latest resume</span>
                        <span className="mt-1 text-sm text-gray-500">DOC, DOCX, RTF or PDF · Max 5MB</span>
                        <input type="file" accept=".doc,.docx,.rtf,.pdf" className="sr-only" />
                      </label>
                    </div>
                    <button className="mt-auto w-full rounded-md bg-[#0d83f7] px-5 py-3 font-semibold text-white hover:bg-[#086fd4]">Continue Application</button>
                  </div>
                ) : (
                  <div className="mt-10 flex flex-1 flex-col">
                    <section>
                      <h3 className="text-xl font-bold text-gray-950">Job Description</h3>
                      <p className="mt-4 whitespace-pre-line leading-7 text-gray-600">{selectedJob.description}</p>
                    </section>

                    <section className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                      {getJobTypeDetails(selectedJob).map((item) => (
                        <div key={item.label}>
                          <p className="font-semibold text-gray-800">{item.label}</p>
                          <p className="mt-2 text-gray-600">{item.value}</p>
                        </div>
                      ))}
                    </section>

                    {getSkills(selectedJob).length > 0 && (
                      <section className="mt-8">
                        <h3 className="font-semibold text-gray-800">Skills</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getSkills(selectedJob).map((skill) => (
                            <span key={skill} className="rounded-lg bg-blue-100 px-5 py-2 text-[#7948ff]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {selectedJob.benefits?.length ? (
                      <section className="mt-8">
                        <h3 className="font-semibold text-gray-800">Benefits &amp; Perks</h3>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {selectedJob.benefits
                            .filter((benefit) => typeof benefit === 'string' || benefit.enabled !== false)
                            .map((benefit, index) => (
                              <span key={index} className="flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-[#7948ff]">
                                <Gift className="h-4 w-4" />
                                {typeof benefit === 'string' ? benefit : benefit.text}
                              </span>
                            ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="mt-8">
                      <h3 className="font-semibold text-gray-800">About Company</h3>
                      <p className="mt-3 leading-7 text-gray-600">
                        {selectedJob.companyAbout || `${selectedJob.companyName} is hiring talented candidates for this opportunity.`}
                      </p>
                    </section>

                    <button onClick={() => setShowResumeStep(true)} className="mt-12 w-full rounded-md bg-[#0d83f7] px-5 py-3 font-semibold text-white hover:bg-[#086fd4]">Continue Application</button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
