import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, MapPin, Briefcase, Calendar, Eye, X, Building, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import JobDetailsModal from './JobDeatilsModal';
import { sampleJobDetails } from '../../data/sampleJobDetails';
import { StudentJob } from '../../types/studentJobs';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

interface JobsSectionProps {
  studentInfo: any;
}

// Salary slider styles
const salarySliderStyles = `
  .salary-slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1484F3;
    cursor: pointer;
    border: none;
    box-shadow: 0 3px 6px rgba(20, 132, 243, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  .salary-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1484F3;
    cursor: pointer;
    border: none;
    box-shadow: 0 3px 6px rgba(20, 132, 243, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15);
  }
`;

const buildJobsBySource = (source: 'college' | 'all'): StudentJob[] =>
  sampleJobDetails.map((job, index) => ({
    ...job,
    id: source === 'college' ? index + 1 : index + 101,
    source,
    via: source === 'college' ? 'Via: ABC University' : 'Via: Job Portal',
    postedDays:
      source === 'college'
        ? job.postedDays || `${index + 1} days ago`
        : job.postedDays || `${index + 2} days ago`,
  }));

const collegeJobs = buildJobsBySource('college');
const allJobsData = buildJobsBySource('all');

const JobsSection: React.FC<JobsSectionProps> = ({ studentInfo }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('college');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<StudentJob | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [minSalary, setMinSalary] = useState(15000);
  const [locationSearch, setLocationSearch] = useState('');
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [publicJobs, setPublicJobs] = useState<StudentJob[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch public jobs from API
  useEffect(() => {
    const fetchPublicJobs = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/jobs/public`);
        if (response.data && Array.isArray(response.data)) {
          // Transform API data to match StudentJob interface
          const transformedJobs = response.data.map((job: any, index: number) => ({
            id: job._id || index,
            title: job.title,
            company: job.companyName,
            location: job.locations?.[0] ? `${job.locations[0].city}, ${job.locations[0].state}` : 'Remote',
            workType: job.jobType,
            workMode: job.workMode,
            salary: job.salary ? `₹${job.salary.min.toLocaleString()} - ₹${job.salary.max.toLocaleString()}` : 'Not disclosed',
            postedDays: getTimeAgo(job.postedAt),
            description: job.description,
            source: 'all' as const,
            via: 'Via: Public Job Portal',
            skills: job.requiredSkills || [],
            experience: job.experienceLevel || 'entry',
            openings: job.totalPositions || 1,
            applicationDeadline: job.applicationDeadline
          }));
          setPublicJobs(transformedJobs);
        }
      } catch (error) {
        console.error('Error fetching public jobs:', error);
        // Fall back to dummy data on error
        setPublicJobs(allJobsData);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicJobs();
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Load applied jobs from localStorage on mount
  useEffect(() => {
    const storedApplications = localStorage.getItem('studentApplications');
    if (storedApplications) {
      try {
        const applications = JSON.parse(storedApplications);
        const appliedJobIds = applications.map((app: any) => app.id);
        setAppliedJobs(appliedJobIds);
      } catch (error) {
        console.error('Error loading applications from localStorage:', error);
      }
    }
  }, []);
  
  // Filter states
  const [filters, setFilters] = useState({
    datePosted: '',
    workType: [] as string[],
    workMode: [] as string[],
    locations: [] as string[]
  });

  const locations = [
    'Bidar, Karnataka',
    'Bangalore Urban, Karnataka',
    'Pehowa, Haryana',
    'Dhuri, Punjab',
    'Pilibanga, Rajasthan',
    'Mumbai, Maharashtra',
    'Pune, Maharashtra',
    'Hyderabad, Telangana',
    'Delhi, NCR',
    'Gurugram, Haryana'
  ];

  const handleFilterChange = (category: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[category as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const resetFilters = () => {
    setFilters({
      datePosted: '',
      workType: [],
      workMode: [],
      locations: []
    });
    setMinSalary(15000);
    setCurrentPage(1);
  };

  const handleViewJob = (job: StudentJob) => {
    router.push(`/jobs/${job.id}`);
  };

  const [notInterestedJobs, setNotInterestedJobs] = useState<number[]>([]);

  // Get all jobs based on active tab
  const getAllJobs = (): StudentJob[] => {
    // Use publicJobs for "all" tab, which includes jobs from the API
    const allAvailableJobs = publicJobs.length > 0 ? publicJobs : allJobsData;
    
    if (activeTab === 'college') return collegeJobs;
    if (activeTab === 'all') return [...collegeJobs, ...allAvailableJobs];
    if (activeTab === 'applied') return [...collegeJobs, ...allAvailableJobs].filter(job => appliedJobs.includes(job.id));
    if (activeTab === 'saved') return [...collegeJobs, ...allAvailableJobs].filter(job => savedJobs.includes(job.id));
    return [];
  };

  const toggleInterested = (jobId: number) => {
    setNotInterestedJobs(prev => [...prev, jobId]);
  };

  const toggleSaved = (jobId: number) => {
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleApply = (jobId: number) => {
    // Find the job details
    const allAvailableJobs = publicJobs.length > 0 ? publicJobs : allJobsData;
    const allJobs = [...collegeJobs, ...allAvailableJobs];
    const job = allJobs.find(j => j.id === jobId);
    
    if (job) {
      // Get existing applications from localStorage
      const storedApplications = localStorage.getItem('studentApplications');
      let applications = [];
      
      if (storedApplications) {
        try {
          applications = JSON.parse(storedApplications);
        } catch (error) {
          console.error('Error parsing applications from localStorage:', error);
        }
      }
      
      const appliedDate = new Date().toISOString();
      
      // Add new application with additional metadata and status history
      const newApplication = {
        ...job,
        appliedDate: appliedDate,
        status: 'Applied',
        statusHistory: [
          {
            status: 'Applied',
            date: appliedDate,
            description: 'Your application has been received'
          }
        ]
      };
      
      applications.push(newApplication);
      
      // Save to localStorage
      localStorage.setItem('studentApplications', JSON.stringify(applications));
      
      // Update state
      setAppliedJobs(prev => [...prev, jobId]);
    }
  };

  // Filter jobs based on search and filters
  const getFilteredJobs = () => {
    let filteredJobs = getAllJobs();

    // Filter out applied jobs from college and all tabs
    if (activeTab === 'college' || activeTab === 'all') {
      filteredJobs = filteredJobs.filter(job => !appliedJobs.includes(job.id));
    }

    // Filter out not interested jobs (only for all jobs tab)
    if (activeTab === 'all') {
      filteredJobs = filteredJobs.filter(job => !notInterestedJobs.includes(job.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Filter by salary
    const jobSalary = (job: StudentJob) => {
      const salaryStr = job.salary.replace(/[^0-9]/g, '');
      return parseInt(salaryStr) || 0;
    };
    filteredJobs = filteredJobs.filter(job => jobSalary(job) >= minSalary);

    // Filter by date posted
    if (filters.datePosted === '24hours') {
      filteredJobs = filteredJobs.filter(job => job.postedDays.includes('1 day') || job.postedDays.includes('hours'));
    } else if (filters.datePosted === '7days') {
      filteredJobs = filteredJobs.filter(job => {
        const days = parseInt(job.postedDays);
        return days <= 7;
      });
    }

    // Filter by work type
    if (filters.workType.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.workType.includes(job.type)
      );
    }

    // Filter by work mode (this would need workMode field in job data, for now we'll skip)
    // if (filters.workMode.length > 0) {
    //   filteredJobs = filteredJobs.filter(job => filters.workMode.includes(job.workMode));
    // }

    // Filter by locations
    if (filters.locations.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.locations.some(loc => job.location.includes(loc.split(',')[0]))
      );
    }

    return filteredJobs;
  };

  // Get paginated jobs
  const getPaginatedJobs = (jobs: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return jobs.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = (jobs: any[]) => {
    return Math.ceil(jobs.length / itemsPerPage);
  };

  // Reset to page 1 when filters change
  const handleFilterChangeWithReset = (category: string, value: string) => {
    handleFilterChange(category, value);
    setCurrentPage(1);
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Reset to page 1 when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{salarySliderStyles}</style>
      {/* Header */}
      <div className="bg-white px-6 py-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Job <span className="text-[#0270DF]">Opportunities</span></h1>
        <p className="text-gray-600 text-sm mt-1">Discover jobs from companies partnered with your college</p>
      </div>

      <div className="px-6 py-4">
      {/* Navigation Tabs */}
        <div className="bg-[#ECECF0]/50 rounded-full p-1 w-full mb-4">
          <div className="flex w-full">
    <button
      onClick={() => handleTabChange("college")}
      className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
        activeTab === "college"
          ? "text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]"
          : "text-[#087AED] bg-transparent"
      }`}
    >
      Jobs from My College
    </button>

    <button
      onClick={() => handleTabChange("all")}
      className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
        activeTab === "all"
          ? "text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]"
          : "text-[#087AED] bg-transparent"
      }`}
    >
      All Jobs
    </button>

    <button
      onClick={() => handleTabChange("applied")}
      className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
        activeTab === "applied"
          ? "text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]"
          : "text-[#087AED] bg-transparent"
      }`}
    >
      Applied Jobs
    </button>

    <button
      onClick={() => handleTabChange("saved")}
      className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
        activeTab === "saved"
          ? "text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]"
          : "text-[#087AED] bg-transparent"
      }`}
    >
      Saved Jobs
    </button>
  </div>
</div>

      <div className="flex gap-4">
        {/* Sidebar Filters - Show for college, all, applied, and saved tabs */}
        {(activeTab === 'college' || activeTab === 'all' || activeTab === 'applied' || activeTab === 'saved') && (
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Filter By</h2>
            <button 
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Date Posted */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Date Posted</h3>
            <div className="space-y-1.5">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="datePosted"
                  value="all"
                  checked={filters.datePosted === 'all'}
                  onChange={(e) => setFilters({...filters, datePosted: e.target.value})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="datePosted"
                  value="24hours"
                  checked={filters.datePosted === '24hours'}
                  onChange={(e) => setFilters({...filters, datePosted: e.target.value})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Last 24 hours</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="datePosted"
                  value="7days"
                  checked={filters.datePosted === '7days'}
                  onChange={(e) => setFilters({...filters, datePosted: e.target.value})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Last 7 days</span>
              </label>
            </div>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Salary */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Salary</h3>
            <p className="text-xs text-gray-600 mb-2">Minimum monthly salary</p>
            <div className="relative">
              <div 
                className="text-white px-3 py-1 rounded-full text-xs inline-block mb-2 transition-all duration-200" 
                style={{ 
                  backgroundColor: '#0270DF',
                  position: 'relative',
                  left: `calc(${(minSalary / 100000) * 100}% - ${(minSalary / 100000) * 60}px)`
                }}
              >
                INR {minSalary.toLocaleString()}
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer salary-slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Work Type */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Type</h3>
            <div className="space-y-1.5">
              {['Full-Time', 'Part-Time', 'Internship', 'Gig/Flexible', 'Freelance Jobs'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.workType.includes(type)}
                    onChange={() => handleFilterChangeWithReset('workType', type)}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Work Mode */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Mode</h3>
            <div className="space-y-1.5">
              {['On-Site', 'Remote', 'Hybrid'].map((mode) => (
                <label key={mode} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.workMode.includes(mode)}
                    onChange={() => handleFilterChangeWithReset('workMode', mode)}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-700">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Location */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Location</h3>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {locations
                .filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase()))
                .map((location) => (
                <label key={location} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.locations.includes(location)}
                    onChange={() => handleFilterChangeWithReset('locations', location)}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-700">{location}</span>
                </label>
              ))}
            </div>
          </div>
          </div>
        </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === 'college' || activeTab === 'all' || activeTab === 'applied' ? (
            <>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies or industries..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-4">
            {getFilteredJobs().filter(job => !savedJobs.includes(job.id)).length > 0 ? (
              <>
                {getPaginatedJobs(getFilteredJobs().filter(job => !savedJobs.includes(job.id))).map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg border-l-4 border-blue-500 hover:!border-l-[#0879EA] border border-gray-200 hover:border-blue-300 transition p-5"
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Logo */}
                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="h-8 w-8 text-purple-600" />
                    </div>

                    {/* Job Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {activeTab === 'applied' && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium border border-[#0377EB] text-[#064BB3]" 
                                    style={{ backgroundColor: 'rgba(39, 145, 252, 0.1)' }}>
                                {job.match}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Posted {job.postedDays}</p>
                            {activeTab === 'all' && (
                              <button
                                onClick={() => toggleInterested(job.id)}
                                className="text-xs flex items-center gap-1 transition"
                                style={{ color: '#1383F3' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#0F6FD1'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#1383F3'}
                              >
                                Not intrested
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          {(activeTab === 'college' || activeTab === 'all') && (
                            <button
                              onClick={() => toggleSaved(job.id)}
                              className={`p-2 rounded-lg border transition ${
                                savedJobs.includes(job.id)
                                  ? 'bg-[#1484F3] border-[#1484F3] text-white'
                                  : 'bg-white border-gray-300 text-gray-400 hover:text-[#1484F3] hover:border-[#1484F3]'
                              }`}
                            >
                              <Bookmark className={`h-5 w-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Job Info - Full Width */}
                      <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4 w-full">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.workMode?.toLowerCase() === 'remote' ? 'Remote' : job.workMode?.toLowerCase() === 'hybrid' ? `${job.location}, Hybrid` : job.location}
                        </div>
                        <div className="flex items-center">
                          {job.salary}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {job.date}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.type}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex items-center space-x-2 mb-4">
                        {job.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-[#7F3DFF]"
                            style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Via and Action Buttons */}
                      <div className="flex items-center justify-between">
                        {activeTab === 'college' && <p className="text-sm text-blue-600">{job.via}</p>}
                        
                        <div className="flex items-center space-x-3 ml-auto">
                          <button
                            onClick={() => handleViewJob(job)}
                            className="px-6 py-2 rounded-lg border border-[#1383F3] text-[#1383F3] bg-white hover:bg-gray-50 transition flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Job</span>
                          </button>
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={activeTab === 'applied' || appliedJobs.includes(job.id)}
                            className={`px-6 py-2 rounded-lg text-white transition ${
                              activeTab === 'applied' || appliedJobs.includes(job.id)
                                ? 'cursor-not-allowed' 
                                : 'hover:opacity-90'
                            }`}
                            style={{ 
                              background: activeTab === 'applied' || appliedJobs.includes(job.id)
                                ? 'linear-gradient(to right, #B8BBD2, #9297C0)'
                                : 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                            }}
                          >
                            {appliedJobs.includes(job.id) ? 'Applied' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ))}
                
                {/* Pagination Controls */}
                {getFilteredJobs().filter(job => !savedJobs.includes(job.id)).length > 0 && getTotalPages(getFilteredJobs().filter(job => !savedJobs.includes(job.id))) > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg border transition ${
                        currentPage === 1
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: getTotalPages(getFilteredJobs().filter(job => !savedJobs.includes(job.id))) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(getFilteredJobs().filter(job => !savedJobs.includes(job.id)))))}
                      disabled={currentPage === getTotalPages(getFilteredJobs().filter(job => !savedJobs.includes(job.id)))}
                      className={`p-2 rounded-lg border transition ${
                        currentPage === getTotalPages(getFilteredJobs().filter(job => !savedJobs.includes(job.id)))
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
              </div>
            )}
          </div>
          </>
          ) : activeTab === 'saved' ? (
            <>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies or industries..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Saved Job Cards */}
              {savedJobs.length > 0 ? (
                <div className="space-y-4">
                  {getFilteredJobs().filter(job => savedJobs.includes(job.id)).length > 0 ? (
                    <>
                      {getPaginatedJobs(getFilteredJobs().filter(job => savedJobs.includes(job.id))).map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-lg border-l-4 border-blue-500 hover:!border-l-[#0879EA] border border-gray-200 hover:border-blue-300 transition p-5"
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Company Logo */}
                          <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building className="h-8 w-8 text-purple-600" />
                          </div>

                          {/* Job Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                  <span className="px-3 py-1 rounded-full text-xs font-medium border border-[#0377EB] text-[#064BB3]" 
                                        style={{ backgroundColor: 'rgba(39, 145, 252, 0.1)' }}>
                                    {job.match}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{job.company}</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Posted {job.postedDays}</p>
                                </div>
                                <button
                                  onClick={() => toggleSaved(job.id)}
                                  className="p-2 rounded-lg border transition bg-blue-50 border-blue-500 text-blue-600"
                                >
                                  <Bookmark className="h-5 w-5 fill-current" />
                                </button>
                              </div>
                            </div>

                            {/* Job Info - Full Width */}
                            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4 w-full">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.workMode?.toLowerCase() === 'remote' ? 'Remote' : job.workMode?.toLowerCase() === 'hybrid' ? `${job.location}, Hybrid` : job.location}
                              </div>
                              <div className="flex items-center">
                                {job.salary}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {job.date}
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {job.type}
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="flex items-center space-x-2 mb-4">
                              {job.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-lg text-xs font-medium text-[#7F3DFF]"
                                  style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>

                            {/* Via and Action Buttons */}
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-blue-600">{job.via}</p>
                              
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleViewJob(job)}
                                  className="px-6 py-2 rounded-lg border border-[#1383F3] text-[#1383F3] bg-white hover:bg-gray-50 transition flex items-center space-x-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Job</span>
                                </button>
                                <button
                                  onClick={() => handleApply(job.id)}
                                  disabled={appliedJobs.includes(job.id)}
                                  className={`px-6 py-2 rounded-lg text-white transition ${
                                    appliedJobs.includes(job.id) ? 'cursor-not-allowed' : 'hover:opacity-90'
                                  }`}
                                  style={{ 
                                    background: appliedJobs.includes(job.id)
                                      ? 'linear-gradient(to right, #B8BBD2, #9297C0)'
                                      : 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                                  }}
                                >
                                  {appliedJobs.includes(job.id) ? 'Applied' : 'Apply'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                      
                      {/* Pagination Controls for Saved Jobs */}
                      {getFilteredJobs().filter(job => savedJobs.includes(job.id)).length > 0 && getTotalPages(getFilteredJobs().filter(job => savedJobs.includes(job.id))) > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border transition ${
                              currentPage === 1
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: getTotalPages(getFilteredJobs().filter(job => savedJobs.includes(job.id))) }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 rounded-lg font-medium transition ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(getFilteredJobs().filter(job => savedJobs.includes(job.id)))))}
                            disabled={currentPage === getTotalPages(getFilteredJobs().filter(job => savedJobs.includes(job.id)))}
                            className={`p-2 rounded-lg border transition ${
                              currentPage === getTotalPages(getFilteredJobs().filter(job => savedJobs.includes(job.id)))
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500 text-lg">No saved jobs found matching your criteria.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 text-lg">No saved jobs yet.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg">No jobs available in this section yet.</p>
            </div>
          )}
        </main>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobModal}
          onClose={() => setShowJobModal(false)}
        />
      )}
      </div>
    </div>
  );
};

export default JobsSection;
