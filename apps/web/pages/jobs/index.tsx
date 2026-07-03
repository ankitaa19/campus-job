'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, Search, MapPinIcon, Globe2 } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface Job {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  locations: Array<{
    city: string;
    state: string;
    country: string;
  }>;
  workMode: string;
  jobType: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  postedAt: string;
  experienceLevel: string;
  description: string;
}

// Dummy data for 6 different job types aligned with the mock
const DUMMY_JOBS: Job[] = [
  {
    _id: '1',
    title: 'Software Developer',
    companyName: 'TechFront',
    companyLogo: '/company-logos/techfront.png',
    locations: [{ city: 'Karnataka', state: 'Bangalore', country: 'India' }],
    workMode: 'Internship',
    jobType: 'internship',
    salary: { min: 2000, max: 15000, currency: 'INR' },
    postedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    experienceLevel: 'Fresher',
    description: 'Deal Jobs is Indonesia\'s largest job portal & mentoring platform. We help people easily find jobs to top Indonesian companies for internship and full-time roles.'
  },
  {
    _id: '2',
    title: 'Software Developer',
    companyName: 'Wiseck',
    companyLogo: '/company-logos/wiseck.png',
    locations: [{ city: 'New Delhi', state: 'Delhi', country: 'India' }],
    workMode: 'Full-Time',
    jobType: 'full-time',
    salary: { min: 40000, max: 42000, currency: 'INR' },
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '2 years',
    description: 'Join our dynamic team as a Full-Time Software Developer working on cutting-edge technologies.'
  },
  {
    _id: '3',
    title: 'Software Developer',
    companyName: 'Mind Inc.',
    companyLogo: '/company-logos/mind-inc.png',
    locations: [{ city: 'Mumbai', state: 'Maharashtra', country: 'India' }],
    workMode: 'Freelance Jobs',
    jobType: 'freelance',
    salary: { min: 5000, max: 0, currency: 'INR' },
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '0-2 years',
    description: 'Flexible freelance opportunity for experienced developers. Work on exciting projects remotely.'
  },
  {
    _id: '4',
    title: 'Software Developer',
    companyName: 'Demo Company',
    companyLogo: '/company-logos/demo.png',
    locations: [{ city: 'Noida', state: 'Uttar Pradesh', country: 'India' }],
    workMode: 'Full-Time',
    jobType: 'full-time',
    salary: { min: 40000, max: 42000, currency: 'INR' },
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '0-2 years',
    description: 'Entry-level position perfect for freshers looking to start their career in software development.'
  },
  {
    _id: '5',
    title: 'Software Developer',
    companyName: 'Fintech',
    companyLogo: '/company-logos/fintech.png',
    locations: [{ city: 'Noida', state: 'Uttar Pradesh', country: 'India' }],
    workMode: 'Part-Time',
    jobType: 'part-time',
    salary: { min: 8000, max: 15000, currency: 'INR' },
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '5-7 years',
    description: 'Part-time opportunity for experienced developers looking for flexible work arrangements.'
  },
  {
    _id: '6',
    title: 'Software Developer',
    companyName: 'Miller Group',
    companyLogo: '/company-logos/miller.png',
    locations: [{ city: 'Karnataka', state: 'Bangalore', country: 'India' }],
    workMode: 'Gig/Flexible',
    jobType: 'contract',
    salary: { min: 200, max: 0, currency: 'INR' },
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    experienceLevel: '0-2 years',
    description: 'Flexible gig opportunities for developers. Work on your own schedule and choose projects that interest you.'
  },
];

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(DUMMY_JOBS);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(DUMMY_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedDatePosted, setSelectedDatePosted] = useState<string>('');
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    // Try to fetch real jobs, fall back to dummy data
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/jobs/public`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setJobs(response.data);
          setFilteredJobs(response.data);
        } else {
          // Use dummy data if API returns empty array
          console.log('API returned empty, using dummy data');
          setJobs(DUMMY_JOBS);
          setFilteredJobs(DUMMY_JOBS);
        }
      } catch (error) {
        console.log('API error, using dummy data:', error);
        // Ensure dummy data is set on error
        setJobs(DUMMY_JOBS);
        setFilteredJobs(DUMMY_JOBS);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatSalary = (salary: Job['salary']) => {
    if (salary.max === 0) {
      return `₹${salary.min.toLocaleString()}/hour`;
    }
    return `₹${salary.min.toLocaleString()} - ₹${salary.max.toLocaleString()}`;
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

  const toggleSaveJob = (jobId: string) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login page
      router.push('/login?redirect=/jobs');
      return;
    }

    setSavedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <div 
          className="relative overflow-hidden"
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
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="flex gap-6 lg:gap-10 items-start">
            {/* Filters Sidebar */}
            <div className="w-72 hidden lg:block">
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
              <div className="flex items-center justify-between mb-6">
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

              <div className="space-y-5">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white border border-[#cfe3ff] rounded-2xl p-7 hover:shadow-lg transition-shadow min-h-[190px]"
                >
                  {/* Header with time and actions */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-[#e7f2ff] text-[#1484F3]"
                    >
                      {mounted ? getTimeAgo(job.postedAt) : ''}
                    </span>
                    <div className="flex items-center gap-2 text-gray-400">
                      <button
                        onClick={() => toggleSaveJob(job._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          savedJobs.includes(job._id)
                            ? 'bg-[#1484F3] text-white'
                            : 'hover:bg-gray-50'
                        }`}
                        aria-label="Bookmark job"
                      >
                        <svg className="w-5 h-5" fill={savedJobs.includes(job._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex flex-col gap-5">
                    <div className="flex gap-4 flex-1 items-center">
                      {/* Company Logo */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {job.companyLogo ? (
                          <Image src={job.companyLogo} alt={job.companyName} width={64} height={64} className="object-contain" />
                        ) : (
                          <span className="text-white text-xl font-bold">
                            {job.companyName.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                          {job.title}
                        </h3>
                        <p className="text-base text-gray-600">{job.companyName}</p>
                      </div>
                    </div>

                    {/* Job Details - Horizontal below company info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Briefcase className="w-4 h-4 flex-shrink-0 text-[#1484F3]" />
                          <span className="text-sm">{getJobTypeLabel(job.jobType)}</span>
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-4 h-4 flex-shrink-0 text-[#1484F3]" />
                          <span className="text-sm">{formatDate(job.postedAt)}</span>
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <svg className="w-4 h-4 flex-shrink-0 text-[#1484F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-sm">{formatSalary(job.salary)}</span>
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <MapPin className="w-4 h-4 flex-shrink-0 text-[#1484F3]" />
                          <span className="text-sm">{job.locations[0]?.city}, {job.locations[0]?.state}</span>
                        </span>
                      </div>

                      {/* Action Buttons - Horizontally aligned */}
                      <div className="flex gap-3 flex-shrink-0 items-center">
                        <button
                          className="px-6 py-2.5 bg-[#1484F3] text-white rounded-lg transition-colors font-semibold text-sm whitespace-nowrap hover:bg-[#0d6edb]"
                        >
                          Apply Job
                        </button>
                        <Link
                          href={`/jobs/${job._id}`}
                          className="px-6 py-2.5 rounded-lg transition-colors font-semibold text-sm inline-flex items-center justify-center whitespace-nowrap border-2 border-[#2791FC] text-[#1484F3] hover:bg-[#f6f9ff]"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-8">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  &lt;
                </button>
                <button className="px-3 py-1 bg-[#1484F3] text-white rounded">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">3</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">4</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">5</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">6</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
