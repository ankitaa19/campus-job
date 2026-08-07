'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Briefcase, MapPin, Search, MapPinIcon, Building2, Share2, Users, GraduationCap, BadgeCheck, X, CalendarDays, Upload, Gift, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL, apiClient } from '../../utils/api';
import Image from 'next/image';
import type { JobSeed } from '../../data/jobSeeds';

type Job = Omit<JobSeed, 'skills' | 'benefits' | 'locations'> & {
  locations: Array<{ city: string; state: string; country: string; isRemote?: boolean; hybrid?: boolean }>;
  skills?: Array<string | { skill?: string; name?: string }>;
  applications?: number | unknown[];
  applicants?: number;
  matchPercentage?: number;
  requirements?: Array<{ skill: string; level?: string; mandatory?: boolean }>;
  requiredSkills?: string[];
  canonicalSkills?: string[];
  matchingKeywords?: string[];
  minExperience?: number;
  maxExperience?: number;
  applicationDeadline?: string;
  educationRequirements?: Array<{ degree: string; field?: string }>;
  benefits?: Array<string | { text?: string; enabled?: boolean }>;
  interviewProcess?: { rounds?: string[]; duration?: string; mode?: string };
  department?: string;
  attributionName?: string;
  attributionUrl?: string;
  source?: 'campuspe' | 'company_careers' | 'job_board';
  sourceProvider?: string;
  recruiterId?: unknown;
  aiGeneratedDescription?: string;
  companyJobCount?: number;
};

const groupJobsByCompany = (jobs: Job[]): Array<{ companyName: string; jobs: Job[] }> => {
  const groups = new Map<string, { companyName: string; jobs: Job[] }>();
  jobs.forEach(job => {
    const companyName = String(job.companyName || 'Company not specified').trim() || 'Company not specified';
    const key = companyName.toLocaleLowerCase();
    const group = groups.get(key) || { companyName, jobs: [] };
    group.jobs.push(job);
    groups.set(key, group);
  });
  return [...groups.values()];
};

type CompanyJobGroup = ReturnType<typeof groupJobsByCompany>[number];

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedDatePosted, setSelectedDatePosted] = useState<string>('');
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [mounted, setMounted] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showResumeStep, setShowResumeStep] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [jobsReloadKey, setJobsReloadKey] = useState(0);
  const [detectedLocation, setDetectedLocation] = useState('');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalCompanyGroups, setTotalCompanyGroups] = useState(0);
  const [serverGroupedCatalogue, setServerGroupedCatalogue] = useState(false);
  const [activeJobByCompany, setActiveJobByCompany] = useState<Record<string, number>>({});
  const [expandedCompany, setExpandedCompany] = useState<CompanyJobGroup | null>(null);
  const [expandedCompanyLoading, setExpandedCompanyLoading] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    setMounted(true);
    const savedLocation = localStorage.getItem('campuspe_detected_location') || '';
    const locationDecision = localStorage.getItem('campuspe_location_permission');
    if (savedLocation) setDetectedLocation(savedLocation);
    if (!locationDecision && !savedLocation) setShowLocationPrompt(true);
  }, []);

  const requestLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location access is not supported by this browser. You can enter a location manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await apiClient.get('/api/jobs/location/reverse', {
          params: { latitude: position.coords.latitude, longitude: position.coords.longitude },
          timeout: 10000
        });
        const place = response.data?.data;
        const location = place?.city || place?.state || place?.country || '';
        if (!location) throw new Error('Location could not be identified');
        setDetectedLocation(location);
        localStorage.setItem('campuspe_detected_location', location);
        localStorage.setItem('campuspe_location_permission', 'granted');
        setShowLocationPrompt(false);
      } catch {
        setLocationError('We could not identify your area. Enter a city in the location filter instead.');
      } finally {
        setLocating(false);
      }
    }, (error) => {
      setLocating(false);
      localStorage.setItem('campuspe_location_permission', error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      setLocationError(error.code === error.PERMISSION_DENIED
        ? 'Location access was declined. You can still enter a city manually.'
        : 'Your current location is unavailable. Enter a city manually.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 15 * 60 * 1000 });
  };

  const dismissLocationPrompt = () => {
    localStorage.setItem('campuspe_location_permission', 'dismissed');
    setShowLocationPrompt(false);
    setLocationError('');
  };

  const clearDetectedLocation = () => {
    setDetectedLocation('');
    localStorage.removeItem('campuspe_detected_location');
    localStorage.setItem('campuspe_location_permission', 'dismissed');
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const selectedType = selectedJobTypes[0];
        const experience = selectedExperience[0]?.toLowerCase();
        const params: Record<string, string | number | undefined> = {
          limit: token ? 500 : pageSize,
          page: token ? 1 : currentPage,
          search: searchQuery.trim() || undefined,
          // A location explicitly typed by the user always overrides browser location.
          location: locationFilter.trim() || detectedLocation || undefined,
          includeRemote: !locationFilter.trim() && Boolean(detectedLocation) ? 'true' : undefined,
          jobType: selectedType ? ({ 'Full-Time': 'full-time', 'Part-Time': 'part-time', Internship: 'internship', Freelance: 'freelance', 'Gig/Flexible': 'contract' } as Record<string, string>)[selectedType] : undefined,
          workMode: selectedWorkModes[0] ? selectedWorkModes[0].toLowerCase().replace('on-site', 'onsite') : undefined,
          minSalary: minSalary || undefined,
          maxExperience: experience === 'fresher' ? 0 : experience === 'entry' ? 2 : undefined,
          minExperience: experience === 'expert' ? 5 : undefined,
          postedWithinDays: selectedDatePosted === 'Last 24 hours' ? 1 : selectedDatePosted === 'Last 7 Days' ? 7 : selectedDatePosted === 'Last 15 Days' ? 15 : undefined,
          sort: selectedSort
        };
        let response;
        let personalizedResponse = Boolean(token);
        if (token) {
          try {
            // Use a request without the global auth interceptor here. The jobs catalogue is
            // public, so an expired saved session must fall back instead of redirecting.
            response = await axios.get(`${API_BASE_URL}/api/jobs/recommendations`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { ...params, minimumScore: 70 },
              timeout: 30000,
              signal: controller.signal
            });
          } catch (recommendationError: any) {
            // Expired sessions and authenticated non-student accounts can still browse jobs.
            if (![401, 404].includes(recommendationError?.response?.status)) throw recommendationError;
            personalizedResponse = false;
            if (recommendationError?.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('profileData');
            }
            response = await axios.get(`${API_BASE_URL}/api/jobs/public/companies`, { params, timeout: 20000, signal: controller.signal });
          }
        } else {
          response = await axios.get(`${API_BASE_URL}/api/jobs/public/companies`, { params, timeout: 20000, signal: controller.signal });
        }
        const groupedResponse = Array.isArray(response.data?.groups);
        const payload = personalizedResponse && response.data?.success
          ? response.data.data
          : groupedResponse
            ? response.data.groups.flatMap((group: CompanyJobGroup & { jobCount?: number }) => group.jobs.map(job => ({ ...job, companyJobCount: group.jobCount || group.jobs.length })))
            : response.data;
        const liveJobs = (Array.isArray(payload) ? payload : []).map((job: any) => ({
          ...job,
          matchPercentage: typeof job.matchScore === 'number' ? job.matchScore : undefined
        }));
        const responseTotal = Number(response.data?.totalJobs ?? response.headers?.['x-total-count']);
        const responseCompanies = Number(response.data?.totalCompanies ?? response.headers?.['x-total-companies']);
        setServerGroupedCatalogue(groupedResponse);
        setTotalCompanyGroups(groupedResponse && Number.isFinite(responseCompanies) ? responseCompanies : groupJobsByCompany(liveJobs).length);
        setTotalJobs(personalizedResponse && !groupedResponse ? liveJobs.length : Number.isFinite(responseTotal) ? responseTotal : liveJobs.length);
        setJobs(liveJobs);
        setFilteredJobs(liveJobs);
      } catch (error: any) {
        if (error?.code === 'ERR_CANCELED') return;
        console.error('Unable to load CampusPe jobs:', error);
        setJobs([]);
        setFilteredJobs([]);
        setTotalJobs(0);
        setTotalCompanyGroups(0);
        setServerGroupedCatalogue(false);
        setJobsError(
          error?.response?.status === 503 || error?.response?.data?.code === 'DATABASE_UNAVAILABLE'
            ? 'CampusPe is reconnecting to the database. Please retry in a few seconds.'
            : 'Jobs could not be loaded right now. Please check the API connection and try again.'
        );
      } finally {
        if (!controller.signal.aborted) setJobsLoading(false);
      }
    };

    const timer = window.setTimeout(fetchJobs, searchQuery.trim() ? 300 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [jobsReloadKey, searchQuery, locationFilter, detectedLocation, selectedJobTypes, selectedExperience, selectedWorkModes, selectedDatePosted, minSalary, selectedSort, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationFilter, detectedLocation, selectedJobTypes, selectedExperience, selectedWorkModes, selectedDatePosted, minSalary, selectedSort]);

  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'recently';
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
    const minimum = Number(salary?.min || 0);
    const maximum = Number(salary?.max || 0);
    if (!salary || (!minimum && !maximum)) return 'Salary not disclosed';
    const currency = salary.currency || 'INR';
    const symbol = ({ INR: '₹', USD: '$', EUR: '€', GBP: '£' } as Record<string, string>)[currency] || `${currency} `;
    if (maximum === 0) {
      return `${symbol}${minimum.toLocaleString()}/hour`;
    }
    if (currency === 'INR' && (minimum >= 100000 || maximum >= 100000)) {
      return `₹${(minimum / 100000).toFixed(1).replace('.0', '')}-${(maximum / 100000).toFixed(1).replace('.0', '')} LPA`;
    }
    return `${symbol}${minimum.toLocaleString()} - ${symbol}${maximum.toLocaleString()}${currency === 'INR' ? '' : ' / year'}`;
  };

  const getSkills = (job: Job) => {
    const source = job.requiredSkills?.length
      ? job.requiredSkills
      : job.canonicalSkills?.length
        ? job.canonicalSkills
        : job.requirements?.length
          ? job.requirements
          : job.skills?.length
            ? job.skills
            : job.matchingKeywords || [];
    return [...new Set(source.map((skill) => typeof skill === 'string' ? skill : skill.skill || skill.name || '').map(skill => skill.trim()).filter(Boolean))];
  };

  const getExperience = (job: Job) => {
    if (typeof job.minExperience === 'number' || typeof job.maxExperience === 'number') {
      const minimum = job.minExperience || 0;
      const maximum = job.maxExperience ?? minimum;
      if (minimum === 0 && maximum === 0) return 'Fresher';
      if (minimum === maximum) return `${minimum} ${minimum === 1 ? 'yr' : 'yrs'}`;
      return `${minimum}-${maximum} yrs`;
    }
    return job.experienceLevel || 'Fresher';
  };

  const getLocationLabel = (job: Job) => {
    const location = job.locations?.[0];
    if (job.workMode?.toLowerCase() === 'remote' || location?.isRemote) return 'Remote';
    const country = ({ in: 'India', us: 'United States', gb: 'United Kingdom', ca: 'Canada', au: 'Australia' } as Record<string, string>)[String(location?.country || '').toLowerCase()] || location?.country;
    const values = [location?.city, location?.state, country]
      .map(value => String(value || '').trim())
      .filter(value => value && !/^not specified$/i.test(value));
    return [...new Set(values)].join(', ') || 'Location not specified';
  };

  const getWorkModeLabel = (value = '') => {
    const normalized = value.toLowerCase().replace(/[-_ ]/g, '');
    if (normalized === 'remote') return 'Remote';
    if (normalized === 'hybrid') return 'Hybrid';
    if (normalized === 'onsite') return 'On-site';
    return value || 'Not specified';
  };

  const openJobDetails = async (job: Job) => {
    setSelectedJob(job);
    setShowResumeStep(false);
    setApplicationMessage('');
    setApplicationSubmitted(false);
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

  const submitApplication = async () => {
    if (!selectedJob?._id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push(`/login?redirect=/jobs/${selectedJob._id}`);
      return;
    }
    setApplying(true);
    setApplicationMessage('');
    try {
      const response = await apiClient.post(`/api/jobs/${selectedJob._id}/apply`, {});
      setApplicationMessage(response.data?.message || 'Application submitted successfully within CampusPe.');
      setApplicationSubmitted(true);
    } catch (error: any) {
      setApplicationMessage(error.response?.data?.message || 'Unable to submit your application.');
    } finally {
      setApplying(false);
    }
  };

  const getApplicationCount = (job: Job) => Array.isArray(job.applications)
    ? job.applications.length
    : Number(job.applications ?? job.applicants ?? 0);

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'internship':
        return 'Internship';
      case 'full-time':
        return 'Full-Time';
      case 'part-time':
        return 'Part-Time';
      case 'freelance':
        return 'Freelance';
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
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  const openAllCompanyJobs = async (companyGroup: CompanyJobGroup) => {
    setExpandedCompany(companyGroup);
    setExpandedCompanyLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      let personalizedResponse = Boolean(token);
      let response;
      if (token) {
        try {
          response = await axios.get(`${API_BASE_URL}/api/jobs/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { company: companyGroup.companyName, minimumScore: 70, limit: 500, sort: selectedSort },
            timeout: 30000
          });
        } catch (recommendationError: any) {
          if (![401, 404].includes(recommendationError?.response?.status)) throw recommendationError;
          personalizedResponse = false;
          if (recommendationError?.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('profileData');
          }
          response = await axios.get(`${API_BASE_URL}/api/jobs/public`, {
            params: { company: companyGroup.companyName, limit: 500, page: 1, sort: selectedSort },
            timeout: 20000
          });
        }
      } else {
        response = await axios.get(`${API_BASE_URL}/api/jobs/public`, {
          params: { company: companyGroup.companyName, limit: 500, page: 1, sort: selectedSort },
          timeout: 20000
        });
      }
      const payload = personalizedResponse && response.data?.success ? response.data.data : response.data;
      const exactCompanyJobs = (Array.isArray(payload) ? payload : []).map((job: any) => ({
        ...job,
        matchPercentage: typeof job.matchScore === 'number' ? job.matchScore : job.matchPercentage
      })).filter((job: Job) =>
        String(job.companyName || '').trim().toLocaleLowerCase() === companyGroup.companyName.toLocaleLowerCase()
      );
      if (exactCompanyJobs.length) setExpandedCompany({ companyName: companyGroup.companyName, jobs: exactCompanyJobs });
    } catch (error) {
      console.warn(`Unable to load all ${companyGroup.companyName} jobs`, error);
      // Keep the jobs already present in the card available to the student.
    } finally {
      setExpandedCompanyLoading(false);
    }
  };

  const companyGroups = groupJobsByCompany(filteredJobs);
  const totalPages = Math.max(1, Math.ceil((serverGroupedCatalogue ? totalCompanyGroups : companyGroups.length) / pageSize));
  const visibleCompanyGroups = serverGroupedCatalogue ? companyGroups : companyGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasActiveFilters = Boolean(searchQuery.trim() || locationFilter.trim() || selectedJobTypes.length || selectedExperience.length || selectedDatePosted || selectedWorkModes.length || minSalary);
  const paginationStart = Math.min(Math.max(1, currentPage - 2), Math.max(1, totalPages - 5));
  const paginationPages = Array.from({ length: Math.min(6, totalPages) }, (_, index) => paginationStart + index);

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
          <div className="mb-8 ">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
                <p className="mt-1 text-lg text-gray-600">{jobsLoading ? 'Loading jobs…' : jobsError ? 'Jobs temporarily unavailable' : `${totalJobs} jobs match your filters`}</p>
              </div>
              <p className="text-sm text-gray-500">Home&nbsp; / &nbsp;<span className="text-gray-900">Find job</span></p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm sm:p-7">
              {showLocationPrompt && (
                <div className="mb-5 flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="rounded-full bg-white p-2 text-[#1484F3]"><MapPin className="h-5 w-5" /></span>
                    <div>
                      <p className="font-semibold text-gray-900">Find jobs near you</p>
                      <p className="mt-0.5 text-sm text-gray-600">Allow location access to start with nearby and remote opportunities. You can override it anytime with the location filter.</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={dismissLocationPrompt} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white">Not now</button>
                    <button onClick={requestLocation} disabled={locating} className="rounded-lg bg-[#1484F3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d6edb] disabled:opacity-60">{locating ? 'Detecting…' : 'Use my location'}</button>
                  </div>
                </div>
              )}
              {locationError && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{locationError}</div>}
              <div className="flex h-12 items-center rounded-lg border border-[#cfdaef] px-4 focus-within:border-[#1484F3] focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="mr-3 h-5 w-5 shrink-0 text-[#0675df]" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-full w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" placeholder="Search by: Job title, Position, Keyword..." />
              </div>
              <p className="mb-3 mt-5 font-semibold text-gray-900">Job Type</p>
              <div className="flex flex-wrap gap-2.5">
                {['All Types', 'Full-Time', 'Part-Time', 'Internship', 'Freelance', 'Gig/Flexible'].map((type) => {
                  const active = type === 'All Types' ? selectedJobTypes.length === 0 : selectedJobTypes.includes(type);
                  return <button key={type} onClick={() => setSelectedJobTypes(type === 'All Types' ? [] : [type])} className={`rounded-full border px-5 py-2 text-sm transition-colors ${active ? 'border-[#1484F3] bg-blue-50 text-[#0878e4]' : 'border-[#cfdaef] text-gray-700 hover:border-[#1484F3]'}`}>{type}</button>;
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-[2fr_repeat(5,1fr)]">
                <div className="col-span-2 flex h-11 items-center rounded-full border border-[#cfdaef] px-4 md:col-span-1">
                  <MapPin className="mr-2 h-4 w-4" /><input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="Location" />
                </div>
                <select value={selectedWorkModes[0] || ''} onChange={(event) => setSelectedWorkModes(event.target.value ? [event.target.value] : [])} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Work Mode</option><option>Remote</option><option>On-site</option><option>Hybrid</option></select>
                <select value={selectedExperience[0] || ''} onChange={(event) => setSelectedExperience(event.target.value ? [event.target.value] : [])} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Experience</option><option>Fresher</option><option>Entry</option><option>Expert</option></select>
                <select value={selectedSort} onChange={(event) => setSelectedSort(event.target.value)} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="newest">Latest</option><option value="oldest">Oldest</option><option value="deadline">Deadline</option></select>
                <select value={minSalary || ''} onChange={(event) => setMinSalary(Number(event.target.value))} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Salary</option><option value="300000">₹3 LPA+</option><option value="600000">₹6 LPA+</option><option value="1000000">₹10 LPA+</option></select>
                <select value={selectedDatePosted} onChange={(event) => setSelectedDatePosted(event.target.value)} className="h-11 rounded-full border border-[#cfdaef] bg-white px-4 text-gray-700 outline-none"><option value="">Posted</option><option>Last 24 hours</option><option>Last 7 Days</option><option>Last 15 Days</option></select>
              </div>
              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button onClick={resetFilters} className="rounded-full px-4 py-1.5 text-sm font-semibold text-[#0878e4] hover:bg-blue-50">Clear all filters</button>
                </div>
              )}
              {detectedLocation && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-[#0878e4]">
                    <MapPin className="h-3.5 w-3.5" /> Using current location: {detectedLocation}
                    <button onClick={clearDetectedLocation} className="ml-1 rounded-full p-0.5 hover:bg-blue-100" aria-label="Stop using current location"><X className="h-3.5 w-3.5" /></button>
                  </span>
                  {locationFilter.trim() && <span className="text-gray-500">Manual location “{locationFilter.trim()}” is currently overriding it.</span>}
                </div>
              )}
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
                    {['Full-Time', 'Part-Time', 'Internship', 'Freelance', 'Gig/Flexible'].map(type => {
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

              <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {jobsLoading && Array.from({ length: 6 }).map((_, index) => (
                <div key={`job-loading-${index}`} className="h-[390px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
              ))}
              {!jobsLoading && jobsError && (
                <div className="col-span-full rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
                  <p className="font-semibold text-amber-900">Unable to load jobs</p>
                  <p className="mt-2 text-sm text-amber-800">{jobsError}</p>
                  <button onClick={() => setJobsReloadKey(value => value + 1)} className="mt-5 rounded-lg bg-[#1484F3] px-5 py-2.5 font-semibold text-white hover:bg-[#0d6edb]">Retry</button>
                </div>
              )}
              {!jobsLoading && !jobsError && filteredJobs.length === 0 && (
                <div className="col-span-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-600">
                  <p>No active jobs match the selected filters.</p>
                  <button onClick={resetFilters} className="mt-4 rounded-lg border border-[#1484F3] px-5 py-2 text-sm font-semibold text-[#1484F3]">Clear all filters</button>
                </div>
              )}
              {visibleCompanyGroups.map(companyGroup => {
                const companyKey = companyGroup.companyName.toLocaleLowerCase();
                const activeIndex = Math.min(activeJobByCompany[companyKey] || 0, companyGroup.jobs.length - 1);
                const job = companyGroup.jobs[activeIndex];
                return (
                <div
                  key={companyKey}
                  className="group flex h-full min-h-[440px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d8dadd] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1484F3] hover:shadow-lg"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <span className="text-xl font-bold text-[#1484F3]">{(job.companyName || 'C').charAt(0)}</span>
                        {job.companyLogo ? (
                          <Image src={job.companyLogo} alt="" fill sizes="64px" className="bg-white object-contain p-1.5" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                        ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-base font-semibold text-gray-900 sm:text-lg" title={job.companyName || 'Company not specified'}>{job.companyName || 'Company not specified'}</p>
                        {(job.source === 'campuspe' || Boolean(job.recruiterId)) && <BadgeCheck className="h-5 w-5 shrink-0 fill-[#2584f5] text-white" aria-label="Verified CampusPe employer" />}
                        {(job.companyJobCount || companyGroup.jobs.length) > 1 && <span className="shrink-0 text-xs font-medium text-gray-500">{job.companyJobCount || companyGroup.jobs.length} jobs</span>}
                      </div>
                      <button onClick={() => openJobDetails(job)} title={job.title || 'Untitled opportunity'} className="mt-0.5 line-clamp-2 min-h-[45px] break-words text-left text-lg font-semibold leading-tight text-black hover:text-[#1484F3]">
                        {job.title || 'Untitled opportunity'}
                      </button>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                      {typeof job.matchPercentage === 'number' && <div className="relative flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `conic-gradient(#08bf63 ${job.matchPercentage * 3.6}deg, #e5e7eb 0deg)` }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-gray-900">
                          {job.matchPercentage}%
                        </div>
                      </div>}
                      <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1484F3]" aria-label={`Share ${job.title}`}>
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-[30px] break-words text-lg font-bold leading-snug text-[#05a84f] sm:text-xl">
                    {formatSalary(job.salary)} <span className="mx-2 text-gray-300">|</span><span className="font-semibold">{getJobTypeLabel(job.jobType)}</span>
                  </p>

                  <div className="mt-5 flex min-h-[52px] flex-wrap content-start items-center gap-y-2 text-sm font-medium text-gray-600 sm:text-base">
                    <span className="flex min-w-0 max-w-full items-center gap-1.5 pr-3">
                      <MapPin className="h-5 w-5 shrink-0" />
                      <span className="truncate" title={getLocationLabel(job)}>{getLocationLabel(job)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 border-l border-gray-300 px-3">
                      <Building2 className="h-5 w-5" /> {getWorkModeLabel(job.workMode)}
                    </span>
                    <span className="flex items-center gap-1.5 border-l border-gray-300 pl-3">
                      <Briefcase className="h-5 w-5" /> {getExperience(job)}
                    </span>
                  </div>

                  <div className="mt-5 min-h-[82px]">
                    <p className="mb-3 text-base font-semibold text-gray-900">Skills Required</p>
                    <div className="flex flex-wrap gap-2">
                      {getSkills(job).slice(0, 3).map((skill, index) => (
                        <span key={index} title={skill} className="max-w-[145px] truncate rounded-md border border-gray-200 px-3 py-1.5 text-center text-sm font-medium text-gray-800">
                          {skill}
                        </span>
                      ))}
                      {getSkills(job).length > 3 && (
                        <span className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-800">+{getSkills(job).length - 3}</span>
                      )}
                      {getSkills(job).length === 0 && <span className="text-sm text-gray-500">See the job description for requirements</span>}
                    </div>
                  </div>

                  <div className="mb-2 mt-4 flex min-h-[24px] flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                    <GraduationCap className="h-5 w-5" />
                    <span>Posted {mounted ? getTimeAgo(job.postedAt) : ''}</span>
                    <span aria-hidden="true">•</span>
                    <Users className="h-4 w-4" />
                    <span>{getApplicationCount(job)} applied</span>
                    <span aria-hidden="true">•</span>
                    <span>{job.totalPositions || 1} openings</span>
                  </div>

                  {job.attributionName && (
                    <p className="mb-3 text-xs font-medium text-gray-500">Imported from {job.attributionName} · Apply and track only in CampusPe</p>
                  )}

                  <div className="mb-3 mt-auto flex min-h-10 items-center justify-between gap-3 border-t border-gray-200 pt-3">
                    {companyGroup.jobs.length > 1 && <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveJobByCompany(previous => ({ ...previous, [companyKey]: (activeIndex - 1 + companyGroup.jobs.length) % companyGroup.jobs.length }))}
                        className="rounded-full p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-[#1484F3]"
                        aria-label={`Previous ${companyGroup.companyName} job`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5" aria-label={`Job ${activeIndex + 1} of ${companyGroup.jobs.length}`}>
                        {companyGroup.jobs.slice(0, 5).map((companyJob, index) => (
                          <button
                            key={companyJob._id}
                            type="button"
                            onClick={() => setActiveJobByCompany(previous => ({ ...previous, [companyKey]: index }))}
                            className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-[#1484F3]' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                            aria-label={`Show job ${index + 1}`}
                          />
                        ))}
                        {companyGroup.jobs.length > 5 && <span className="ml-1 text-xs font-medium text-gray-500">{activeIndex + 1}/{companyGroup.jobs.length}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveJobByCompany(previous => ({ ...previous, [companyKey]: (activeIndex + 1) % companyGroup.jobs.length }))}
                        className="rounded-full p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-[#1484F3]"
                        aria-label={`Next ${companyGroup.companyName} job`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>}
                    <button
                      type="button"
                      onClick={() => openAllCompanyJobs(companyGroup)}
                      className="shrink-0 text-xs font-semibold text-[#1484F3] hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  <button
                    onClick={() => openJobDetails(job)}
                    className="mt-auto w-full rounded-md bg-[#0d83f7] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[#086fd4] focus:outline-none focus:ring-2 focus:ring-[#1484F3] focus:ring-offset-2 sm:text-lg"
                  >
                    View &amp; Apply
                  </button>
                </div>
                );
              })}
              </div>

              {/* Pagination */}
              {!jobsLoading && !jobsError && filteredJobs.length > 0 && <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                  &lt;
                </button>
                {paginationPages.map(page => <button key={page} onClick={() => setCurrentPage(page)} aria-current={page === currentPage ? 'page' : undefined} className={`px-3 py-1 rounded-full transition-colors ${page === currentPage ? 'bg-[#1484F3] text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>{page}</button>)}
                <button onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                  &gt;
                </button>
              </div>}
            </div>
          </div>
        </div>

        {expandedCompany && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`${expandedCompany.companyName} jobs`}>
            <button className="absolute inset-0" onClick={() => setExpandedCompany(null)} aria-label="Close company jobs" />
            <section className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-gray-950">{expandedCompany.companyName}</h2>
                  <p className="text-sm text-gray-500">{expandedCompanyLoading ? 'Loading every vacancy…' : `${expandedCompany.jobs.length} available ${expandedCompany.jobs.length === 1 ? 'job' : 'jobs'}`}</p>
                </div>
                <button onClick={() => setExpandedCompany(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close company jobs"><X className="h-5 w-5" /></button>
              </header>
              <div className="max-h-[calc(92vh-82px)] overflow-y-auto bg-gray-50/70 p-4 sm:p-6">
                {expandedCompanyLoading && <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">Loading all company jobs…</div>}
                {!expandedCompanyLoading && <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {expandedCompany.jobs.map(companyJob => (
                    <article key={companyJob._id} className="group flex min-h-[340px] min-w-0 flex-col rounded-2xl border border-[#d8dadd] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1484F3] hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-600">{companyJob.companyName}</p>
                          <h3 className="mt-1 line-clamp-3 break-words text-lg font-bold leading-snug text-gray-950">{companyJob.title}</h3>
                        </div>
                        {typeof companyJob.matchPercentage === 'number' && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{companyJob.matchPercentage}% Match</span>}
                      </div>
                      <p className="mt-4 text-base font-bold text-[#05a84f]">{formatSalary(companyJob.salary)} <span className="mx-1 text-gray-300">|</span> {getJobTypeLabel(companyJob.jobType)}</p>
                      <div className="mt-4 space-y-2 text-sm font-medium text-gray-600">
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{getLocationLabel(companyJob)}</span></p>
                        <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0" />{getExperience(companyJob)}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {getSkills(companyJob).slice(0, 4).map(skill => <span key={skill} className="max-w-[135px] truncate rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">{skill}</span>)}
                        {getSkills(companyJob).length === 0 && <span className="text-xs text-gray-500">Requirements are in the full description</span>}
                      </div>
                      <p className="mb-4 mt-auto pt-4 text-xs text-gray-500">Posted {mounted ? getTimeAgo(companyJob.postedAt) : ''}</p>
                      <button onClick={() => { setExpandedCompany(null); openJobDetails(companyJob); }} className="w-full rounded-lg bg-[#1484F3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d6edb]">View &amp; Apply</button>
                    </article>
                  ))}
                </div>}
              </div>
            </section>
          </div>
        )}

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
                    {typeof selectedJob.matchPercentage === 'number' && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-500 text-xs font-semibold">{selectedJob.matchPercentage}%</div>
                    )}
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
                {selectedJob.attributionName && (
                  <p className="mt-3 text-sm font-medium text-gray-500">Imported from {selectedJob.attributionName} · No external redirect</p>
                )}

                {detailsLoading ? (
                  <div className="flex flex-1 items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#1484F3]" /></div>
                ) : showResumeStep ? (
                  <div className="mt-10 flex flex-1 flex-col">
                    <div className="rounded-2xl border border-gray-300 p-6 text-center sm:p-10">
                      <Upload className="mx-auto mb-3 h-7 w-7 text-[#1484F3]" />
                      <p className="font-semibold text-gray-900">Apply using your CampusPe profile and uploaded resume</p>
                      <p className="mt-2 text-sm text-gray-500">Your application and status tracking will remain entirely inside CampusPe.</p>
                      {applicationMessage && <p className="mt-4 text-sm font-medium text-[#0878e4]">{applicationMessage}</p>}
                    </div>
                    <button onClick={submitApplication} disabled={applying || applicationSubmitted} className="mt-auto w-full rounded-md bg-[#0d83f7] px-5 py-3 font-semibold text-white hover:bg-[#086fd4] disabled:cursor-not-allowed disabled:opacity-60">
                      {applying ? 'Submitting...' : applicationSubmitted ? 'Application Submitted' : 'Submit Application on CampusPe'}
                    </button>
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
