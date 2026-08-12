import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, MapPin, Briefcase, Calendar, Eye, X, Building, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import JobDetailsModal from './JobDeatilsModal';
import { StudentJob } from '../../types/studentJobs';
import { apiClient, API_ENDPOINTS } from '../../utils/api';

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

const groupStudentJobsByCompany = (jobs: StudentJob[]): Array<{ companyName: string; jobs: StudentJob[] }> => {
  const groups = new Map<string, { companyName: string; jobs: StudentJob[] }>();
  jobs.forEach(job => {
    const companyName = String(job.company || 'Company not specified').trim() || 'Company not specified';
    const key = companyName.toLocaleLowerCase();
    const group = groups.get(key) || { companyName, jobs: [] };
    group.jobs.push(job);
    groups.set(key, group);
  });
  return [...groups.values()];
};

type StudentCompanyJobGroup = ReturnType<typeof groupStudentJobsByCompany>[number];
type AutoApplyJobStatus = 'idle' | 'applying' | 'pending_review' | 'applied' | 'error';
type AutoApplyJobState = { status: AutoApplyJobStatus; message?: string };
type BulkRunState = {
  _id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalJobs: number;
  processedCount: number;
  succeededCount: number;
  pendingReviewCount: number;
  failedCount: number;
  skippedCount: number;
  unsupportedAtsCount: number;
  failureReasons?: Record<string, number>;
  runningJobIds?: string[];
  runningCount?: number;
  pendingCount?: number;
  workerWarning?: string;
};
type BulkAutoApplyPreview = {
  count: number;
  needsYouCount: number;
  unsupportedCount: number;
  totalConsideredJobs: number;
  totalMatchedAboveThreshold: number;
};
const BULK_AUTO_APPLY_RUN_STORAGE_KEY = 'campuspe.activeBulkAutoApplyRunId';

const JobsSection: React.FC<JobsSectionProps> = ({ studentInfo }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<StudentJob | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [minSalary, setMinSalary] = useState(0);
  const [locationSearch, setLocationSearch] = useState('');
  const [savedJobs, setSavedJobs] = useState<Array<string | number>>([]);
  const [appliedJobs, setAppliedJobs] = useState<Array<string | number>>([]);
  const [submittingJobs, setSubmittingJobs] = useState<Array<string | number>>([]);
  const [appliedJobCards, setAppliedJobCards] = useState<StudentJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [publicJobs, setPublicJobs] = useState<StudentJob[]>([]);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeJobByCompany, setActiveJobByCompany] = useState<Record<string, number>>({});
  const [expandedCompany, setExpandedCompany] = useState<StudentCompanyJobGroup | null>(null);
  const [autoApplyState, setAutoApplyState] = useState<Record<string, AutoApplyJobState>>({});
  const [pendingReviewJobs, setPendingReviewJobs] = useState<Array<string | number>>([]);
  const [bulkRun, setBulkRun] = useState<BulkRunState | null>(null);
  const [bulkRunId, setBulkRunId] = useState('');
  const [bulkAutoApplyBusy, setBulkAutoApplyBusy] = useState(false);
  const [bulkAutoApplyCancelling, setBulkAutoApplyCancelling] = useState(false);
  const [bulkAutoApplyError, setBulkAutoApplyError] = useState('');
  const [bulkAutoApplyPreview, setBulkAutoApplyPreview] = useState<BulkAutoApplyPreview | null>(null);
  const [filters, setFilters] = useState({
    datePosted: '',
    workType: [] as string[],
    workMode: [] as string[],
    locations: [] as string[]
  });

  const buildCurrentJobFilters = () => {
    const workType = filters.workType.find(type => type !== 'All Types');
    const workMode = filters.workMode[0];
    const selectedLocation = filters.locations[0];
    return {
      search: searchQuery.trim() || undefined,
      jobType: workType ? ({
        'Full-Time': 'full-time',
        'Part-Time': 'part-time',
        Internship: 'internship',
        Freelance: 'freelance',
        'Gig/Flexible': 'contract'
      } as Record<string, string>)[workType] : undefined,
      workMode: workMode ? workMode.toLowerCase().replace('on-site', 'onsite') : undefined,
      location: selectedLocation,
      minSalary: minSalary || undefined,
      postedWithinDays: filters.datePosted === '24hours' ? 1 : filters.datePosted === '7days' ? 7 : undefined,
      sort: 'newest'
    };
  };

  const loadApplicationState = async () => {
    try {
      const response = await apiClient.get('/api/applications', { params: { status: 'queued,submitted,confirmed,pending_review,failed' } });
      const records = Array.isArray(response.data?.data) ? response.data.data : [];
      const submittedRecords = records.filter((record: any) => ['submitted', 'confirmed'].includes(record.status));
      setSubmittingJobs(records
        .filter((record: any) => record.status === 'queued')
        .map((record: any) => String(record.jobId?._id || record.jobId))
        .filter(Boolean));
      setAppliedJobs(records
        .filter((record: any) => ['submitted', 'confirmed'].includes(record.status))
        .map((record: any) => String(record.jobId?._id || record.jobId))
        .filter(Boolean));
      setAppliedJobCards(submittedRecords
        .map((record: any): StudentJob | null => {
          const job = record.jobId;
          if (!job || typeof job !== 'object') return null;
          const salaryMin = Number(job.salary?.min || 0);
          const salaryMax = Number(job.salary?.max || 0);
          const salaryCurrency = String(job.salary?.currency || 'INR');
          const rawLocation = job.locations?.[0];
          const location = job.workMode === 'remote' || rawLocation?.isRemote
            ? 'Remote'
            : [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ') || job.location || 'Location not specified';
          return {
            id: String(job._id),
            title: job.title || 'Job',
            company: job.companyName || 'Company not specified',
            location,
            date: record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Applied',
            type: job.jobType || 'Full-Time',
            jobType: job.jobType || 'Full-Time',
            workMode: job.workMode || 'onsite',
            salary: salaryMin || salaryMax ? `${salaryCurrency} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}` : 'Not disclosed',
            salaryMin,
            salaryMax,
            salaryCurrency,
            postedDays: 'Applied',
            description: job.description || '',
            source: 'campuspe',
            via: 'Via: CampusPe',
            skills: job.requiredSkills || [],
            experience: job.experienceLevel || 'entry',
            numberOfOpenings: job.totalPositions || 1,
          };
        })
        .filter((job: StudentJob | null): job is StudentJob => Boolean(job)));
      setPendingReviewJobs(records
        .filter((record: any) => record.status === 'pending_review')
        .map((record: any) => String(record.jobId?._id || record.jobId))
        .filter(Boolean));
    } catch {
      setAppliedJobs([]);
      setSubmittingJobs([]);
      setAppliedJobCards([]);
      setPendingReviewJobs([]);
    }
  };

  useEffect(() => {
    loadApplicationState();
  }, []);

  // Fetch the full active job catalogue and annotate match scores when present.
  useEffect(() => {
    const fetchPublicJobs = async () => {
      setLoading(true);
      setJobsError('');
      try {
        const response = await apiClient.get('/api/jobs/matches', {
          params: {
            limit: itemsPerPage,
            page: currentPage,
            ...buildCurrentJobFilters()
          }
        });
        const jobs = response.data?.data;
        if (Array.isArray(jobs)) {
          // Transform API data to match StudentJob interface
          const transformedJobs = jobs.map((job: any, index: number) => {
            const displayJobType = ({
              'full-time': 'Full-Time',
              'part-time': 'Part-Time',
              internship: 'Internship',
              freelance: 'Freelance',
              contract: 'Gig/Flexible'
            } as Record<string, StudentJob['jobType']>)[String(job.jobType || '').toLowerCase()] || 'Full-Time';
            const rawLocation = job.locations?.[0];
            const locationParts = [rawLocation?.city, rawLocation?.state, rawLocation?.country]
              .map(value => String(value || '').trim())
              .filter(value => value && !/^not specified$/i.test(value));
            const location = job.workMode === 'remote' || rawLocation?.isRemote
              ? 'Remote'
              : [...new Set(locationParts)].join(', ') || 'Location not specified';
            const salaryMin = Number(job.salary?.min || 0);
            const salaryMax = Number(job.salary?.max || 0);
            const salaryCurrency = String(job.salary?.currency || 'INR');
            return ({
            id: job._id || index,
            title: job.title,
            company: job.companyName,
            location,
            date: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Open',
            type: displayJobType,
            jobType: displayJobType,
            workType: job.jobType,
            workMode: job.workMode,
            match: typeof job.matchScore === 'number' ? `${Math.round(job.matchScore)}% Match` : undefined,
            matchScore: typeof job.matchScore === 'number' ? Math.round(job.matchScore) : undefined,
            matchingModel: job.matchingModel,
            ruleBasedScore: job.ruleBasedScore,
            aiScore: job.aiScore,
            scoreBreakdown: job.scoreBreakdown,
            atsEvaluation: job.atsEvaluation,
            salary: salaryMin || salaryMax ? `${salaryCurrency} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}` : 'Not disclosed',
            salaryMin,
            salaryMax,
            salaryCurrency,
            postedDays: getTimeAgo(job.postedAt),
            description: job.description,
            source: job.source || 'campuspe',
            via: job.sourceProvider ? `Via: ${job.sourceProvider}` : 'Via: CampusPe',
            skills: job.requiredSkills || [],
            experience: job.experienceLevel || 'entry',
            openings: job.totalPositions || 1,
            applicationDeadline: job.applicationDeadline
            });
          });
          setPublicJobs(transformedJobs);
          setTotalJobCount(Number(response.data?.total ?? response.headers?.['x-total-count'] ?? transformedJobs.length));
        }
      } catch (error: any) {
        console.warn('Jobs request failed:', error?.response?.status || error?.code, error?.response?.data?.message || error?.message);
        setPublicJobs([]);
        setTotalJobCount(0);
        setJobsError(error?.response?.status === 503
          ? 'CampusPe is reconnecting to the database. Please retry in a few seconds.'
          : 'Unable to load jobs right now.');
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(fetchPublicJobs, searchQuery.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [searchQuery, reloadKey, currentPage, filters.workType, filters.workMode, filters.locations, filters.datePosted, minSalary]);

  useEffect(() => {
    setBulkAutoApplyPreview(null);
    setBulkAutoApplyError('');
  }, [searchQuery, filters.workType, filters.workMode, filters.locations, filters.datePosted, minSalary, activeTab]);

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

  const locations = [...new Set(publicJobs
    .map(job => job.location)
    .filter(location => location && !/^remote$|^location not specified$/i.test(location)))]
    .sort((left, right) => left.localeCompare(right));

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
    setMinSalary(0);
    setCurrentPage(1);
  };

  const handleViewJob = (job: StudentJob) => {
    apiClient.post(`/api/jobs/${job.id}/interactions`, { type: 'click' }).catch(() => undefined);
    router.push(`/jobs/${job.id}`);
  };

  const [notInterestedJobs, setNotInterestedJobs] = useState<Array<string | number>>([]);

  // Get all jobs based on active tab
  const getAllJobs = (): StudentJob[] => {
    if (activeTab === 'college') return publicJobs.filter(job => job.source === 'campuspe');
    if (activeTab === 'all') return publicJobs;
    if (activeTab === 'applied') return appliedJobCards;
    if (activeTab === 'saved') return publicJobs.filter(job => savedJobs.includes(job.id));
    return [];
  };

  const toggleInterested = (jobId: string | number) => {
    setNotInterestedJobs(prev => [...prev, jobId]);
    apiClient.post(`/api/jobs/${jobId}/interactions`, { type: 'dismiss' }).catch(() => undefined);
  };

  const toggleSaved = (jobId: string | number) => {
    const isSaving = !savedJobs.includes(jobId);
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
    if (isSaving) apiClient.post(`/api/jobs/${jobId}/interactions`, { type: 'save' }).catch(() => undefined);
  };

  const normalizeJobId = (jobId: string | number) => String(jobId);
  const includesJobId = (jobIds: Array<string | number>, jobId: string | number) => jobIds.map(String).includes(normalizeJobId(jobId));
  const getAutoApplyState = (jobId: string | number): AutoApplyJobState => autoApplyState[normalizeJobId(jobId)] || { status: 'idle' };
  const setJobAutoApplyState = (jobId: string | number, state: AutoApplyJobState) => {
    setAutoApplyState(prev => ({ ...prev, [normalizeJobId(jobId)]: state }));
  };

  const validateAutoApplyProfile = () => {
    const missing: string[] = [];
    const hasResume = Boolean(studentInfo?.resumeFile || studentInfo?.resumeText || studentInfo?.resumeAnalysis?.resumeText);
    const hasFirstName = Boolean(String(studentInfo?.firstName || '').trim());
    const hasLastName = Boolean(String(studentInfo?.lastName || '').trim());
    const hasEmail = Boolean(String(studentInfo?.email || '').trim());

    if (!hasResume) missing.push('resume');
    if (!hasFirstName || !hasLastName) missing.push('name');
    if (!hasEmail) missing.push('email');

    return missing.length ? `Complete your profile before using Auto Apply. Missing: ${missing.join(', ')}.` : '';
  };

  const getAutoApplyLabel = (jobId: string | number) => {
    if (includesJobId(submittingJobs, jobId)) return 'Submitting';
    if (includesJobId(appliedJobs, jobId)) return 'Applied';
    if (includesJobId(pendingReviewJobs, jobId)) return 'Pending Review';
    const state = getAutoApplyState(jobId);
    if (state.status === 'applying') return 'Auto Applying...';
    if (state.status === 'pending_review') return 'Pending Review';
    if (state.status === 'applied') return 'Applied';
    if (state.status === 'error') return 'Auto Apply Failed';
    return 'Auto Apply';
  };

  const isAutoApplyDisabled = (jobId: string | number) => {
    const state = getAutoApplyState(jobId);
    return activeTab === 'applied'
      || includesJobId(appliedJobs, jobId)
      || includesJobId(submittingJobs, jobId)
      || includesJobId(pendingReviewJobs, jobId)
      || state.status === 'applying'
      || state.status === 'pending_review'
      || state.status === 'applied';
  };

  const handleAutoApply = async (job: StudentJob) => {
    const jobId = normalizeJobId(job.id);
    const profileError = validateAutoApplyProfile();
    if (profileError) {
      setJobAutoApplyState(job.id, { status: 'error', message: profileError });
      return;
    }

    try {
      setJobAutoApplyState(job.id, { status: 'applying' });
      const response = await apiClient.post(API_ENDPOINTS.JOB_AUTO_APPLY(jobId), {
        ...(typeof job.matchScore === 'number' ? { score: job.matchScore } : {})
      });

      const action = response.data?.action;
      const status = response.data?.application?.status;
      if (action === 'pending_review' || status === 'pending_review') {
        setPendingReviewJobs(prev => prev.map(String).includes(jobId) ? prev : [...prev, jobId]);
        setJobAutoApplyState(job.id, { status: 'pending_review' });
        return;
      }

      setAppliedJobs(prev => prev.map(String).includes(jobId) ? prev : [...prev, jobId]);
      setJobAutoApplyState(job.id, { status: 'applied' });
    } catch (error: any) {
      setJobAutoApplyState(job.id, {
        status: 'error',
        message: error?.response?.data?.message || 'Auto Apply failed. Please try again.'
      });
    }
  };

  const handleBulkAutoApply = async () => {
    setBulkAutoApplyError('');
    setBulkAutoApplyBusy(true);
    try {
      const currentFilters = { ...buildCurrentJobFilters(), autoApplyScope: 'all', includeAllJobs: true };
      const preview = await apiClient.get('/api/jobs/auto-apply/preview-count', { params: currentFilters });
      const previewState: BulkAutoApplyPreview = {
        count: Number(preview.data?.count || 0),
        needsYouCount: Number(preview.data?.needsYouCount || 0),
        unsupportedCount: Number(preview.data?.unsupportedCount || 0),
        totalConsideredJobs: Number(preview.data?.totalConsideredJobs || 0),
        totalMatchedAboveThreshold: Number(preview.data?.totalMatchedAboveThreshold || 0)
      };
      setBulkAutoApplyPreview(previewState);
      const count = previewState.count;
      if (!count) {
        setBulkAutoApplyError(previewState.needsYouCount
          ? `${previewState.needsYouCount.toLocaleString()} jobs need manual application because their ATS is not automated yet. No automatic applications were created.`
          : 'No jobs are ready for automatic submission with the current filters.');
        return;
      }
      const unsupportedText = previewState.unsupportedCount
        ? ` ${previewState.unsupportedCount.toLocaleString()} unsupported jobs will not be submitted.`
        : '';
      const needsYouText = previewState.needsYouCount
        ? ` ${previewState.needsYouCount.toLocaleString()} matched jobs need manual action and will not be submitted by Auto Apply.`
        : '';
      const confirmationText = `This will submit ${count.toLocaleString()} applications automatically from ${previewState.totalConsideredJobs.toLocaleString()} jobs in the current result set.${needsYouText}${unsupportedText} Continue?`;
      const confirmed = window.confirm(confirmationText);
      if (!confirmed) return;
      const response = await apiClient.post('/api/jobs/auto-apply/bulk', { filters: currentFilters });
      const runId = String(response.data?.runId || '');
      setBulkRunId(runId);
      if (runId) localStorage.setItem(BULK_AUTO_APPLY_RUN_STORAGE_KEY, runId);
      setBulkRun({
        _id: runId,
        status: 'pending',
        totalJobs: count,
        processedCount: 0,
        succeededCount: 0,
        pendingReviewCount: 0,
        failedCount: 0,
        skippedCount: 0,
        unsupportedAtsCount: 0,
        runningJobIds: []
      });
    } catch (error: any) {
      setBulkAutoApplyError(error?.response?.data?.message || 'Unable to start bulk Auto Apply.');
    } finally {
      setBulkAutoApplyBusy(false);
    }
  };

  const isBulkRunActive = bulkRun?.status === 'pending' || bulkRun?.status === 'running';
  const bulkAutoApplyActionableCount = Number(bulkAutoApplyPreview?.count || 0) + Number(bulkAutoApplyPreview?.needsYouCount || 0);
  const bulkAutoApplyDisabledByPreview = Boolean(bulkAutoApplyPreview && bulkAutoApplyActionableCount === 0);
  const bulkProgressLabel = bulkRun
    ? `${Number(bulkRun.processedCount || 0).toLocaleString()}/${Number(bulkRun.totalJobs || 0).toLocaleString()}`
    : '';

  const handleCancelBulkAutoApply = async () => {
    if (!bulkRunId && !bulkRun?._id) return;
    setBulkAutoApplyError('');
    setBulkAutoApplyCancelling(true);
    try {
      const runId = bulkRunId || bulkRun?._id;
      const response = await apiClient.post(`/api/jobs/auto-apply/runs/${runId}/cancel`);
      const run = response.data?.data;
      if (run) setBulkRun(run);
      setBulkRunId('');
      localStorage.removeItem(BULK_AUTO_APPLY_RUN_STORAGE_KEY);
      await loadApplicationState();
      setReloadKey(value => value + 1);
    } catch (error: any) {
      setBulkAutoApplyError(error?.response?.data?.message || 'Unable to stop bulk Auto Apply.');
    } finally {
      setBulkAutoApplyCancelling(false);
    }
  };

  useEffect(() => {
    const storedRunId = localStorage.getItem(BULK_AUTO_APPLY_RUN_STORAGE_KEY);
    if (!bulkRunId && storedRunId) {
      setBulkRunId(storedRunId);
      return;
    }
    if (!bulkRunId) return;
    let cancelled = false;
    const loadRun = async () => {
      try {
        const response = await apiClient.get(`/api/jobs/auto-apply/runs/${bulkRunId}`);
        if (cancelled) return;
        const run = response.data?.data;
        setBulkRun(run);
        if (run?.status === 'completed' || run?.status === 'failed' || run?.status === 'cancelled') {
          setBulkRunId('');
          localStorage.removeItem(BULK_AUTO_APPLY_RUN_STORAGE_KEY);
          await loadApplicationState();
          setReloadKey(value => value + 1);
        }
      } catch (error: any) {
        if (!cancelled) setBulkAutoApplyError(error?.response?.data?.message || 'Unable to refresh bulk Auto Apply progress.');
      }
    };
    loadRun();
    const interval = window.setInterval(loadRun, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bulkRunId]);

  // Filter jobs based on search and filters
  const getFilteredJobs = () => {
    let filteredJobs = getAllJobs();

    // Filter out applied jobs from college tab. All Jobs intentionally remains
    // the full catalogue; applied jobs show a disabled Applied state there.
    if (activeTab === 'college') {
      filteredJobs = filteredJobs.filter(job => !appliedJobs.includes(job.id));
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
    if (minSalary > 0) filteredJobs = filteredJobs.filter(job => Number(job.salaryMin || 0) >= minSalary);

    // Filter by date posted
    if (filters.datePosted === '24hours') {
      filteredJobs = filteredJobs.filter(job => job.postedDays === 'Today' || job.postedDays.includes('hours'));
    } else if (filters.datePosted === '7days') {
      filteredJobs = filteredJobs.filter(job => {
        if (job.postedDays === 'Today' || job.postedDays.includes('hours')) return true;
        const days = parseInt(job.postedDays);
        return Number.isFinite(days) && days <= 7 && !job.postedDays.includes('weeks') && !job.postedDays.includes('months');
      });
    }

    // Filter by work type
    if (filters.workType.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.workType.includes(job.type)
      );
    }

    if (filters.workMode.length > 0) {
      const selectedModes = filters.workMode.map(mode => mode.toLowerCase().replace('-', ''));
      filteredJobs = filteredJobs.filter(job => selectedModes.includes(String(job.workMode || '').toLowerCase().replace('-', '')));
    }

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
    if (activeTab === 'all') return Math.max(1, Math.ceil(totalJobCount / itemsPerPage));
    return Math.ceil(jobs.length / itemsPerPage);
  };

  const getVisiblePages = (totalPages: number) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, index) => start + index);
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

  const renderedJobs = getFilteredJobs();
  const renderedJobGroups = activeTab === 'all'
    ? renderedJobs.map(job => ({ companyName: `${job.company}-${job.id}`, jobs: [job] }))
    : groupStudentJobsByCompany(renderedJobs.filter(job => !savedJobs.includes(job.id)));
  const visibleJobGroups = activeTab === 'all' ? renderedJobGroups : getPaginatedJobs(renderedJobGroups);
  const totalPages = getTotalPages(activeTab === 'all' ? renderedJobs : renderedJobGroups);
  const displayedJobCount = activeTab === 'all' ? totalJobCount : renderedJobs.length;
  const displayStart = displayedJobCount > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
  const displayEnd = displayedJobCount > 0 ? Math.min(currentPage * itemsPerPage, displayedJobCount) : 0;
  const bulkApplyingJobIds = new Set((bulkRun?.runningJobIds || []).map(String));
  const countLabel = activeTab === 'college'
    ? 'jobs from your college'
    : activeTab === 'applied'
      ? 'applied jobs'
      : activeTab === 'saved'
        ? 'saved jobs'
        : 'jobs available';

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

      <div className="flex min-w-0 items-start gap-4">
        {/* Sidebar Filters - Show for college, all, applied, and saved tabs */}
        {(activeTab === 'college' || activeTab === 'all' || activeTab === 'applied' || activeTab === 'saved') && (
        <aside className="hidden w-64 flex-shrink-0 lg:block">
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
              {['All Types', 'Full-Time', 'Part-Time', 'Internship', 'Freelance', 'Gig/Flexible'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={type === 'All Types' ? filters.workType.length === 0 : filters.workType.includes(type)}
                    onChange={() => type === 'All Types'
                      ? setFilters(previous => ({ ...previous, workType: [] }))
                      : handleFilterChangeWithReset('workType', type)}
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
        <main className="min-w-0 flex-1">
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
	            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
	              <div>
	                <p className="text-sm font-semibold text-gray-900">
	                  {displayedJobCount.toLocaleString()} {countLabel}
	                </p>
	                <p className="text-xs text-gray-600">
	                  {displayedJobCount > 0
	                    ? `Showing ${displayStart.toLocaleString()}-${displayEnd.toLocaleString()} of ${displayedJobCount.toLocaleString()}`
	                    : 'No jobs match the current filters'}
	                </p>
	                {activeTab !== 'applied' && bulkAutoApplyPreview && (
	                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
	                    <span className={`rounded-full px-2.5 py-1 font-semibold ${
	                      bulkAutoApplyPreview.count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
	                    }`}>
	                      {bulkAutoApplyPreview.count.toLocaleString()} ready for automatic submission
	                    </span>
	                    {bulkAutoApplyPreview.needsYouCount > 0 && (
	                      <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
	                        {bulkAutoApplyPreview.needsYouCount.toLocaleString()} need your action
	                      </span>
	                    )}
	                    {bulkAutoApplyPreview.unsupportedCount > 0 && (
	                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">
	                        {bulkAutoApplyPreview.unsupportedCount.toLocaleString()} unsupported
	                      </span>
	                    )}
	                    {bulkAutoApplyPreview.count === 0 && bulkAutoApplyPreview.totalConsideredJobs > 0 && (
	                      <span className="basis-full text-gray-600">
	                        Checked {bulkAutoApplyPreview.totalConsideredJobs.toLocaleString()} jobs in the current result set; none can be submitted automatically yet.
	                      </span>
	                    )}
	                  </div>
	                )}
	              </div>
		              <div className="flex flex-wrap items-center justify-end gap-2">
		                {loading && <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700">Updating jobs...</span>}
		                {activeTab !== 'applied' && (
		                  <button
		                    onClick={isBulkRunActive ? handleCancelBulkAutoApply : handleBulkAutoApply}
		                    disabled={bulkAutoApplyBusy || bulkAutoApplyCancelling || (!isBulkRunActive && bulkAutoApplyDisabledByPreview)}
		                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-400 ${
		                      isBulkRunActive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1484F3] hover:bg-[#0d6edb]'
		                    }`}
		                  >
		                    {isBulkRunActive
		                      ? bulkAutoApplyCancelling ? 'Stopping...' : `Stop (${bulkProgressLabel})`
		                      : bulkAutoApplyBusy ? 'Checking...' : bulkAutoApplyDisabledByPreview ? 'No Auto Apply Jobs' : 'Auto Apply'}
		                  </button>
		                )}
		              </div>
		            </div>
		            {bulkRun && (
		              <div className="mt-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
		                {bulkRun.status === 'pending' || bulkRun.status === 'running' ? (
		                  <p>
		                    Applying: {bulkRun.processedCount.toLocaleString()} / {bulkRun.totalJobs.toLocaleString()}
		                    {Number(bulkRun.runningCount || 0) > 0 ? ` — ${Number(bulkRun.runningCount || 0).toLocaleString()} currently submitting` : ''}
		                    {' — '}{bulkRun.failedCount.toLocaleString()} failed
		                    {' — '}{bulkRun.pendingReviewCount.toLocaleString()} need review
		                  </p>
		                ) : bulkRun.status === 'cancelled' ? (
		                  <p>
		                    Bulk Auto Apply stopped: {bulkRun.succeededCount.toLocaleString()} applied,
		                    {' '}{bulkRun.pendingReviewCount.toLocaleString()} pending review,
		                    {' '}{bulkRun.failedCount.toLocaleString()} failed,
		                    {' '}{bulkRun.skippedCount.toLocaleString()} skipped
		                  </p>
		                ) : (
		                  <p>
		                    Bulk Auto Apply complete: {bulkRun.succeededCount.toLocaleString()} applied,
		                    {' '}{bulkRun.pendingReviewCount.toLocaleString()} pending review,
		                    {' '}{bulkRun.failedCount.toLocaleString()} failed
		                    {bulkRun.unsupportedAtsCount ? ` (${bulkRun.unsupportedAtsCount.toLocaleString()} jobs skipped: ATS not yet supported)` : ''}
		                  </p>
		                )}
		                {bulkRun.failureReasons && Object.keys(bulkRun.failureReasons).length > 0 && (
		                  <p className="mt-1 text-xs text-gray-500">
		                    Reasons: {Object.entries(bulkRun.failureReasons).map(([reason, count]) => `${reason.replace(/_/g, ' ')}: ${count.toLocaleString()}`).join(', ')}
		                  </p>
		                )}
		                {bulkRun.workerWarning && (
		                  <p className="mt-1 text-xs font-medium text-amber-700">{bulkRun.workerWarning}</p>
		                )}
		              </div>
		            )}
		            {bulkAutoApplyError && <p className="mt-2 text-sm font-medium text-red-600">{bulkAutoApplyError}</p>}
		          </div>

          {/* Job Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-gray-500">Loading jobs…</div>
            ) : jobsError ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-6 text-center">
                <p className="font-medium text-amber-900">{jobsError}</p>
                <button onClick={() => setReloadKey(value => value + 1)} className="mt-4 rounded-lg bg-[#1484F3] px-5 py-2 text-sm font-semibold text-white">Retry</button>
              </div>
            ) : renderedJobs.length > 0 ? (
              <>
                {visibleJobGroups.map(companyGroup => {
                const companyKey = companyGroup.companyName.toLocaleLowerCase();
                const activeIndex = Math.min(activeJobByCompany[companyKey] || 0, companyGroup.jobs.length - 1);
                const job = companyGroup.jobs[activeIndex];
                return (
                <section key={companyGroup.companyName.toLocaleLowerCase()} className="flex flex-col gap-y-3">
                <div
                  key={job.id}
                  className="min-w-0 w-full overflow-hidden rounded-lg border border-l-4 border-gray-200 border-l-blue-500 bg-white p-4 transition hover:border-blue-300 hover:!border-l-[#0879EA] sm:p-5"
                >
                <div className="flex min-w-0 items-start">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                    {/* Company Logo */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-200 sm:h-16 sm:w-16">
                      <Building className="h-6 w-6 text-purple-600 sm:h-8 sm:w-8" />
                    </div>

                    {/* Job Details */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex min-w-0 flex-wrap items-start gap-2 sm:gap-3">
                            <h3 className="line-clamp-2 min-w-0 flex-1 break-words text-base font-semibold leading-snug text-gray-900 sm:text-lg" title={job.title}>{job.title}</h3>
	                            {typeof job.matchScore === 'number' && (
	                              <span className="shrink-0 rounded-full border border-[#0377EB] px-2.5 py-1 text-xs font-medium text-[#064BB3]"
	                                    style={{ backgroundColor: 'rgba(39, 145, 252, 0.1)' }}>
	                                {job.matchScore}% Match
	                              </span>
	                            )}
	                            {bulkApplyingJobIds.has(String(job.id)) && (
	                              <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
	                                Applying...
	                              </span>
	                            )}
	                          </div>
                          <p className="truncate text-sm text-gray-600" title={job.company}>{job.company}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-right sm:gap-3">
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
                                Not interested
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
                      <div className="mb-4 flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 sm:gap-x-6">
                        <div className="flex min-w-0 items-center">
                          <MapPin className="mr-1 h-4 w-4 shrink-0" />
                          <span className="max-w-[240px] truncate" title={job.location}>{job.location || 'Location not specified'}</span>
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
                      <div className="mb-4 flex min-h-7 flex-wrap items-center gap-2">
                        {job.skills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-[#7F3DFF]"
                            style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 6 && <span className="text-xs font-medium text-gray-500">+{job.skills.length - 6} more</span>}
                      </div>

                      {/* Via and Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {activeTab === 'college' && <p className="text-sm text-blue-600">{job.via}</p>}
                        
                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                          <button
                            onClick={() => handleViewJob(job)}
                            className="flex items-center gap-2 rounded-lg border border-[#1383F3] bg-white px-4 py-2 text-sm text-[#1383F3] transition hover:bg-gray-50 sm:px-6"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Job</span>
                          </button>
                          <button
                            onClick={() => handleAutoApply(job)}
                            disabled={isAutoApplyDisabled(job.id)}
                            title={getAutoApplyState(job.id).message}
                            className={`rounded-lg px-4 py-2 text-sm text-white transition sm:px-6 ${
                              isAutoApplyDisabled(job.id)
                                ? 'cursor-not-allowed' 
                                : 'hover:opacity-90'
                            }`}
                            style={{ 
                              background: getAutoApplyState(job.id).status === 'error'
                                ? 'linear-gradient(to right, #EF4444, #DC2626)'
                                : isAutoApplyDisabled(job.id)
                                ? 'linear-gradient(to right, #B8BBD2, #9297C0)'
                                : 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                            }}
                          >
                            {getAutoApplyLabel(job.id)}
                          </button>
                          {getAutoApplyState(job.id).status === 'error' && (
                            <p className="basis-full text-right text-xs font-medium text-red-600">{getAutoApplyState(job.id).message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex min-h-10 items-center justify-between gap-3 border-t border-gray-200 pt-3">
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
                      {companyGroup.jobs.slice(0, 5).map((companyJob: StudentJob, index: number) => (
                        <button
                          key={companyJob.id}
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
                  {activeTab !== 'all' && <button
                    type="button"
                    onClick={() => setExpandedCompany(companyGroup)}
                    className="shrink-0 text-xs font-semibold text-[#1484F3] hover:underline"
                  >
                    View all
                  </button>}
                </div>
              </div>
                </section>
                );
                })}
                
                {/* Pagination Controls */}
                {renderedJobs.length > 0 && totalPages > 1 && (
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
                    
                    {getVisiblePages(totalPages).map((page) => (
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg border transition ${
                        currentPage === totalPages
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
	                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
	                  <p className="text-sm font-semibold text-gray-900">
	                    {displayedJobCount.toLocaleString()} {countLabel}
	                  </p>
	                  <p className="text-xs text-gray-600">
	                    {displayedJobCount > 0
	                      ? `Showing ${displayStart.toLocaleString()}-${displayEnd.toLocaleString()} of ${displayedJobCount.toLocaleString()}`
	                      : 'No saved jobs match the current filters'}
	                  </p>
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
                        className="min-w-0 w-full overflow-hidden rounded-lg border border-l-4 border-gray-200 border-l-blue-500 bg-white p-4 transition hover:border-blue-300 hover:!border-l-[#0879EA] sm:p-5"
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                          {/* Company Logo */}
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-200 sm:h-16 sm:w-16">
                            <Building className="h-6 w-6 text-purple-600 sm:h-8 sm:w-8" />
                          </div>

                          {/* Job Details */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex min-w-0 flex-wrap items-start gap-2 sm:gap-3">
                                  <h3 className="line-clamp-2 min-w-0 flex-1 break-words text-base font-semibold leading-snug text-gray-900 sm:text-lg" title={job.title}>{job.title}</h3>
                                  <span className="shrink-0 rounded-full border border-[#0377EB] px-2.5 py-1 text-xs font-medium text-[#064BB3]"
                                        style={{ backgroundColor: 'rgba(39, 145, 252, 0.1)' }}>
                                    {job.match}
                                  </span>
                                </div>
                                <p className="truncate text-sm text-gray-600" title={job.company}>{job.company}</p>
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
                            <div className="mb-4 flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 sm:gap-x-6">
                              <div className="flex min-w-0 items-center">
                                <MapPin className="mr-1 h-4 w-4 shrink-0" />
                                <span className="max-w-[240px] truncate" title={job.location}>{job.workMode?.toLowerCase() === 'remote' ? 'Remote' : job.workMode?.toLowerCase() === 'hybrid' ? `${job.location}, Hybrid` : job.location || 'Location not specified'}</span>
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
                            <div className="mb-4 flex min-h-7 flex-wrap items-center gap-2">
                              {job.skills.slice(0, 6).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-lg text-xs font-medium text-[#7F3DFF]"
                                  style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)' }}
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 6 && <span className="text-xs font-medium text-gray-500">+{job.skills.length - 6} more</span>}
                            </div>

                            {/* Via and Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm text-blue-600">{job.via}</p>
                              
                              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                                <button
                                  onClick={() => handleViewJob(job)}
                                  className="px-6 py-2 rounded-lg border border-[#1383F3] text-[#1383F3] bg-white hover:bg-gray-50 transition flex items-center space-x-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Job</span>
                                </button>
                                <button
                                  onClick={() => handleAutoApply(job)}
                                  disabled={isAutoApplyDisabled(job.id)}
                                  title={getAutoApplyState(job.id).message}
                                  className={`px-6 py-2 rounded-lg text-white transition ${
                                    isAutoApplyDisabled(job.id) ? 'cursor-not-allowed' : 'hover:opacity-90'
                                  }`}
                                  style={{ 
                                    background: getAutoApplyState(job.id).status === 'error'
                                      ? 'linear-gradient(to right, #EF4444, #DC2626)'
                                      : isAutoApplyDisabled(job.id)
                                      ? 'linear-gradient(to right, #B8BBD2, #9297C0)'
                                      : 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                                  }}
                                >
                                  {getAutoApplyLabel(job.id)}
                                </button>
                                {getAutoApplyState(job.id).status === 'error' && (
                                  <p className="basis-full text-right text-xs font-medium text-red-600">{getAutoApplyState(job.id).message}</p>
                                )}
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
                          
                      {getVisiblePages(getTotalPages(getFilteredJobs().filter(job => savedJobs.includes(job.id)))).map((page) => (
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

      {expandedCompany && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`${expandedCompany.companyName} jobs`}>
          <button className="absolute inset-0" onClick={() => setExpandedCompany(null)} aria-label="Close company jobs" />
          <section className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-gray-950">{expandedCompany.companyName}</h2>
                <p className="text-sm text-gray-500">{expandedCompany.jobs.length} personalized {expandedCompany.jobs.length === 1 ? 'job' : 'jobs'}</p>
              </div>
              <button onClick={() => setExpandedCompany(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close company jobs"><X className="h-5 w-5" /></button>
            </header>
            <div className="max-h-[calc(92vh-82px)] overflow-y-auto bg-gray-50/70 p-4 sm:p-6">
              <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {expandedCompany.jobs.map(companyJob => (
                  <article key={companyJob.id} className="group flex min-h-[320px] min-w-0 flex-col rounded-2xl border border-[#d8dadd] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1484F3] hover:shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-600">{companyJob.company}</p>
                        <h3 className="mt-1 line-clamp-3 break-words text-lg font-bold leading-snug text-gray-950">{companyJob.title}</h3>
                      </div>
                      {typeof companyJob.matchScore === 'number' && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{companyJob.matchScore}% Match</span>}
                    </div>
                    <p className="mt-4 text-base font-bold text-[#05a84f]">{companyJob.salary} <span className="mx-1 text-gray-300">|</span> {companyJob.type}</p>
                    <div className="mt-4 space-y-2 text-sm font-medium text-gray-600">
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{companyJob.location}</span></p>
                      <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0" />{companyJob.experience}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {companyJob.skills.slice(0, 4).map(skill => <span key={skill} className="max-w-[135px] truncate rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">{skill}</span>)}
                    </div>
                    <div className="mt-auto flex gap-2 pt-5">
                      <button onClick={() => handleViewJob(companyJob)} className="flex-1 rounded-lg border border-[#1484F3] px-4 py-2.5 text-sm font-semibold text-[#1484F3] hover:bg-blue-50">View Job</button>
                      <button
                        onClick={() => handleAutoApply(companyJob)}
                        disabled={isAutoApplyDisabled(companyJob.id)}
                        title={getAutoApplyState(companyJob.id).message}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed ${
                          getAutoApplyState(companyJob.id).status === 'error'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-[#1484F3] hover:bg-[#0d6edb] disabled:bg-gray-400'
                        }`}
                      >
                        {getAutoApplyLabel(companyJob.id)}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobModal}
          onClose={() => setShowJobModal(false)}
          onApply={() => handleAutoApply(selectedJob)}
        />
      )}
      </div>
    </div>
  );
};

export default JobsSection;
