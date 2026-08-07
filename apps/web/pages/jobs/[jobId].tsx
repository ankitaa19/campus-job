'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { apiClient, API_BASE_URL } from '../../utils/api';
import { Briefcase, MapPin, Clock, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface JobDetails {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  companyBanner?: string;
  companyAbout?: string;
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
  educationQualification: string;
  compensationType: string;
  contractDuration?: string;
  paymentStructure?: string;
  paymentAmount?: string;
  stipend?: string;
  hourlyRate?: string;
  numberOfOpenings: number;
  description: string;
  skills?: string[];
  benefits?: Array<{ text: string; enabled: boolean }>;
  dailyTimings?: string;
  preferredWorkingDays?: string[];
  workSchedule?: string;
  hoursPerSession?: string;
  gigType?: string;
  commitmentLevel?: string;
  internshipDuration?: string;
  certificateProvided?: string;
  conversionPossibility?: string;
  noticePeriod?: string;
  extensionPossibility?: string;
  specialRequirements?: string;
}




export default function JobDetailsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [skillsGap, setSkillsGap] = useState<string[]>([]);
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, { score: number; weight: number; evidence: string }>>({});
  const [studentProfile, setStudentProfile] = useState<{ firstName?: string; lastName?: string; collegeName?: string; profileCompleteness?: number; isPlacementReady?: boolean } | null>(null);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'submitted' | 'already_applied'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobDetails = async () => {
      try {
        // Try to fetch from API
        const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}`);
        setJob(response.data);
        setSubmissionMessage('');
      } catch {
        setJob(null);
        setSubmissionMessage('This job is unavailable or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    const fetchCurrentMatch = async () => {
      if (typeof window === 'undefined' || !jobId) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      setLoadingMatch(true);
      try {
        try {
          const analysisResponse = await apiClient.get(`/api/jobs/${jobId}/resume-analysis/current`);
          const payload = analysisResponse.data?.data || analysisResponse.data;
          const analysis = payload?.analysis || payload;

          setMatchScore(typeof analysis?.matchScore === 'number' ? analysis.matchScore : null);
          setMatchedSkills(Array.isArray(analysis?.skillsMatched) ? analysis.skillsMatched : []);
          setSkillsGap(Array.isArray(analysis?.skillsGap) ? analysis.skillsGap : []);
          setScoreBreakdown(analysis?.scoreBreakdown || {});
          if (payload?.studentProfile) {
            setStudentProfile(payload.studentProfile);
          }
          return;
        } catch (analysisError: any) {
          if (analysisError?.response?.status !== 404) {
            throw analysisError;
          }
        }

        const response = await apiClient.get('/api/jobs/recommendations', {
          params: { minimumScore: 70, limit: 100 },
        });

        const matches = response.data?.data || response.data || [];
        const currentMatch = Array.isArray(matches)
          ? matches.find((item: any) => String(item._id || item.id) === String(jobId))
          : null;

        if (currentMatch) {
          setMatchScore(typeof currentMatch.matchScore === 'number' ? currentMatch.matchScore : null);
          setMatchedSkills(Array.isArray(currentMatch.matchedSkills) ? currentMatch.matchedSkills : []);
          setSkillsGap(Array.isArray(currentMatch.skillsGap) ? currentMatch.skillsGap : []);
          setScoreBreakdown(currentMatch.scoreBreakdown || {});
        }
      } catch (error) {
        console.error('Failed to load job match score:', error);
      } finally {
        setLoadingMatch(false);
      }
    };

    fetchCurrentMatch();
  }, [jobId]);

  // Toggle save job
  const toggleSaveJob = () => {
    if (!isSaved && jobId) apiClient.post(`/api/jobs/${jobId}/interactions`, { type: 'save' }).catch(() => undefined);
    setIsSaved(!isSaved);
    // Here you can add localStorage or API call to persist the saved state
    // localStorage.setItem(`saved-job-${jobId}`, JSON.stringify(!isSaved));
  };

  useEffect(() => {
    if (!jobId || typeof window === 'undefined' || !localStorage.getItem('token')) return;
    apiClient.post(`/api/jobs/${jobId}/interactions`, { type: 'view' }).catch(() => undefined);
  }, [jobId]);

  const handleApplyJob = async () => {
    if (!jobId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }

    setApplying(true);
    setSubmissionMessage('');

    try {
      const response = await apiClient.post(
        `/api/jobs/${jobId}/apply`,
        { skipNotification: false },
      );

      if (response.data?.success) {
        const score = response.data?.data?.matchScore;
        if (typeof score === 'number') {
          setMatchScore(score);
        }
        setApplicationStatus('submitted');
        setSubmissionMessage(response.data?.message || 'Application submitted within CampusPe.');
      } else {
        setSubmissionMessage(response.data?.message || 'Unable to submit application at the moment.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit the application.';
      if (message.toLowerCase().includes('already applied')) {
        setApplicationStatus('already_applied');
      }
      setSubmissionMessage(message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
            <button
              onClick={() => router.push('/jobs')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Jobs
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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

  const formatCompensation = () => {
    if (job.jobType === 'internship' && job.compensationType?.toLowerCase() === 'unpaid') {
      return 'Unpaid internship';
    }
    if (!job.salary || (!job.salary.min && !job.salary.max)) {
      return 'Not disclosed';
    }
    if (job.salary.max > 0) {
      return `₹${job.salary.min.toLocaleString()} - ₹${job.salary.max.toLocaleString()}`;
    }
    return `₹${job.salary.min.toLocaleString()}/hour`;
  };

  const infoField = (label: string, value?: string | number) => ({
    label,
    value: value === undefined || value === null || value === '' ? '' : String(value)
  });

  const infoFields = (() => {
    const common = [
      infoField('Work Experience', job.experienceLevel),
      infoField('Educational Qualification', job.educationQualification)
    ];

    switch (job.jobType) {
      case 'internship': {
        const paid = job.compensationType?.toLowerCase() === 'paid';
        return [
          ...common,
          infoField('Internship Duration', job.internshipDuration),
          infoField('Compensation Type', job.compensationType),
          infoField('Stipend', paid ? job.stipend || formatCompensation() : 'Unpaid internship'),
          infoField('Conversion Possibility', job.conversionPossibility),
          infoField('Certificate Provided', job.certificateProvided),
          infoField('Number of Openings', job.numberOfOpenings)
        ];
      }
      case 'full-time':
        return [
          ...common,
          infoField('Notice Period', job.noticePeriod),
          infoField('Compensation Type', job.compensationType || 'Annual salary'),
          infoField('Salary', formatCompensation()),
          infoField('Number of Openings', job.numberOfOpenings)
        ];
      case 'part-time':
        return [
          ...common,
          infoField('Daily Timings', job.dailyTimings),
          infoField('Preferred Working Days', job.preferredWorkingDays?.join(', ')),
          infoField('Payment Structure', job.compensationType),
          infoField('Rate Amount', job.hourlyRate || formatCompensation()),
          infoField('Number of Openings', job.numberOfOpenings)
        ];
      case 'freelance':
        return [
          ...common,
          infoField('Contract Duration', job.contractDuration),
          infoField('Payment Structure', job.paymentStructure),
          infoField('Payment Amount', job.paymentAmount || formatCompensation()),
          infoField('Extension Possibility', job.extensionPossibility),
          infoField('Number of Openings', job.numberOfOpenings)
        ];
      case 'contract':
        return [
          ...common,
          infoField('Daily Timings', job.dailyTimings || job.workSchedule),
          infoField('Payment Structure', job.paymentStructure),
          infoField('Hours Per Session', job.hoursPerSession),
          infoField('Rate Amount', job.hourlyRate || formatCompensation()),
          infoField('Gig Type', job.gigType),
          infoField('Commitment Level', job.commitmentLevel),
          infoField('Number of Openings', job.numberOfOpenings)
        ];
      default:
        return [...common, infoField('Number of Openings', job.numberOfOpenings)];
    }
  })().filter((field) => field.value);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0d6bf2] to-[#2694f7] text-white" style={{ height: '433.85px' }}>
          <div className="absolute inset-0">
            <div className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl -right-10 top-6" />
            <div className="absolute w-40 h-40 bg-white/5 rounded-full blur-3xl left-16 -bottom-10" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Want to join our dynamic team!</h1>
            <p className="text-white/80 max-w-2xl">Apply fast if your skills matches with our requirements.</p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 relative -mt-40 z-10 pb-12">
          <div className="bg-white border border-[#1484F3] rounded-2xl shadow-md p-6 md:p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-48 h-60 relative rounded-xl overflow-hidden bg-[#f2f6ff]">
                <Image
                  src={job.companyBanner || '/3d2477bcc3a4ad8e4862577ce5caea7c9cd0c79f.png'}
                  alt={job.companyName}
                  fill
                  sizes="(min-width: 1024px) 12rem, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#e7f2ff] text-[#1484F3]">
                    {getTimeAgo(job.postedAt)}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={toggleSaveJob}
                      className={`p-2 border rounded-lg transition-colors ${
                        isSaved 
                          ? 'bg-[#1484F3] border-[#1484F3] text-white' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                      aria-label="Bookmark job"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill={isSaved ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900 mt-1">{job.title}</h2>
                  <p className="text-lg text-gray-600">{job.companyName}</p>
                  {job.companyAbout && (
                    <p className="text-gray-700 leading-relaxed">
                      {job.companyAbout}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-base text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-5 h-5 text-[#1484F3]" />
                    {getJobTypeLabel(job.jobType)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-5 h-5 text-[#1484F3]" />
                    {formatDate(job.postedAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-800">{formatCompensation()}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-[#1484F3]" />
                    {job.locations[0]?.city}, {job.locations[0]?.state}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 mb-6">
            <div className="border border-gray-200 rounded-lg inline-block">
              <button
                className="px-4 py-2 rounded-lg font-semibold bg-[#1383F3] text-white"
              >
                About
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 mb-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {infoFields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <p className="text-sm text-gray-600">{field.label}</p>
                  <p className="font-semibold text-gray-900">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-[#f6fbff] border border-[#d9ecff] rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Job Match</h3>
                  <p className="text-sm text-gray-600">Your score is generated from CampusPe profile, resume, skills, and job preference data.</p>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1484F3] shadow-sm border border-[#d9ecff]">
                  {loadingMatch ? 'Calculating...' : matchScore !== null ? `${matchScore}% match` : 'Sign in to calculate'}
                </div>
              </div>

              {matchScore !== null && (
                <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(scoreBreakdown).map(([dimension, detail]) => (
                    <div key={dimension} className="rounded-lg bg-white p-3 border border-[#e5eefc]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold capitalize text-gray-700">{dimension.replace(/([A-Z])/g, ' $1')}</p>
                        <span className="text-xs font-semibold text-[#1484F3]">{detail.score}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#1484F3]" style={{ width: `${Math.max(0, Math.min(100, detail.score))}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{detail.evidence}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 border border-[#e5eefc]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Matched skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {matchedSkills.length > 0 ? matchedSkills.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-medium text-[#0d6edb]">{skill}</span>
                      )) : <span className="text-sm text-gray-500">No skills inferred yet.</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-4 border border-[#e5eefc]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skills gap</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {skillsGap.length > 0 ? skillsGap.map((skill) => (
                        <span key={skill} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">{skill}</span>
                      )) : <span className="text-sm text-gray-500">No major gaps detected.</span>}
                    </div>
                  </div>
                </div>
                </div>
              )}

              {studentProfile && (
                <div className="rounded-lg bg-white p-4 border border-[#e5eefc] text-sm text-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {studentProfile.firstName || 'Student'} {studentProfile.lastName || ''}
                    </p>
                    <span className="text-xs text-[#1484F3]">
                      {studentProfile.profileCompleteness ?? 0}% profile complete
                    </span>
                  </div>
                  <p className="mt-1 text-gray-600">
                    {studentProfile.collegeName || 'College details unavailable'}
                    {studentProfile.isPlacementReady ? ' • Placement ready' : ' • Profile review pending'}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Job Description:</h3>
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }}
              />
              {job.specialRequirements && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Special Requirements:</h4>
                  <div className="bg-[#f0f5ff] text-gray-800 rounded-lg p-4 leading-relaxed">
                    {job.specialRequirements}
                  </div>
                </div>
              )}
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-[#f7f9f6] border border-[#e1ecfb] rounded-xl p-5 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Benefits &amp; Perks:</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="text-gray-800 border border-[#e5edfb] rounded-lg px-4 py-2 bg-white text-sm font-medium">
                      {typeof benefit === 'string' ? benefit : benefit.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleApplyJob}
                disabled={applying}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#1484F3] hover:bg-[#0d6edb] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-10 rounded-lg transition-colors"
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {applicationStatus === 'already_applied' ? 'Already Applied' : applicationStatus === 'submitted' ? 'Application Submitted' : 'Apply in CampusPe'}
              </button>
            </div>

            {submissionMessage && (
              <div className="rounded-xl border border-[#d9ecff] bg-[#f6fbff] px-5 py-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#1484F3]" />
                  <p>{submissionMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
