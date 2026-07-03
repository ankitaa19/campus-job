import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import ApprovalStatus from '../../components/ApprovalStatus';
import Link from 'next/link';
import { useResumeUpload } from '../../components/ResumeUpload';

// Icon Components
const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const UserGroupIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BellIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const UniversityIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l8 4H4l8-4z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16v2H4z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9v10h2V9m4 0v10h2V9m4 0v10h2V9" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19h16v2H4z" />
  </svg>
);


const ProfileIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
  </svg>
);






const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Type Definitions
interface InterviewAssignment {
  _id: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  type: 'online' | 'offline';
  location?: string;
  meetingLink?: string;
  jobId?: string;
  recruiterId?: string;
}


interface JobApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'rejected' | 'selected';
  matchScore?: number;
  resumeAnalysis?: any;
  applicationNotes?: string;
}

interface StudentStats {
  totalApplications: number;
  interviewsScheduled: number;
  upcomingInterviews: number;
  profileCompleteness: number;
  averageMatchScore?: number;
  aiRecommendations?: number;
}

interface JobRecommendation {
  _id: string;
  title: string;
  companyName: string;
  company?: string; // Alternative company field
  location: string;
  workplace?: string; // Alternative location field
  salary: string | { min: number; max: number; currency: string; negotiable?: boolean; _id?: string };
  matchScore: number;
  requiredSkills: string[];
  skills?: string[]; // Alternative skills field
  postedDate: string;
  deadline?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewAssignment[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string>('');
  const [showApprovalStatus, setShowApprovalStatus] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
    totalApplications: 0,
    interviewsScheduled: 0,
    upcomingInterviews: 0,
    profileCompleteness: 0,
    averageMatchScore: 0,
    aiRecommendations: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<any>(null);
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [collegeConnections, setCollegeConnections] = useState<any[]>([]);
  const [stableJobMatches, setStableJobMatches] = useState<Map<string, number>>(new Map());

  // Resume upload hook
  const resumeUpload = useResumeUpload({
    onUploadSuccess: (analysis) => {
      console.log('Resume upload successful with analysis:', analysis);
      setResumeInfo(analysis);
      fetchStudentData(); // Refresh data after successful upload
    },
    onUploadError: (errorMessage) => {
      console.error('Resume upload error:', errorMessage);
    },
    isUploading: resumeUploading,
    setIsUploading: setResumeUploading
  });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        router.push('/login');
        return;
      }

      // Validate user role first
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        if (userRole !== 'student') {
          console.error(`Invalid user role for student dashboard: ${userRole}`);
          localStorage.removeItem('token');
          localStorage.removeItem('profileData');
          localStorage.removeItem('userId');
          localStorage.removeItem('role');
          
          // Redirect to appropriate login page
          if (userRole === 'recruiter') {
            router.push('/company-login');
          } else if (['college', 'college_admin', 'placement_officer'].includes(userRole)) {
            router.push('/college-login');
          } else {
            router.push('/login');
          }
          return;
        }
      } catch (error) {
        console.error('Error validating token:', error);
        router.push('/login');
        return;
      }

      console.log('Token exists and role validated, making API call...');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch student profile with enhanced error handling
      let studentData: any = null;
      try {
        console.log('Attempting to fetch student profile...');
        const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`, { headers });
        console.log('Profile response status:', profileResponse.status);
        console.log('Profile response data:', profileResponse.data);
        
        // Handle the API response structure - check if data is wrapped in success/data object
        if (profileResponse.data.success && profileResponse.data.data) {
          studentData = profileResponse.data.data;
        } else {
          studentData = profileResponse.data;
        }
        
        // Validate student data before proceeding
        if (!studentData) {
          console.error('No student data received from API');
          return;
        }
        
        if (!studentData._id) {
          console.error('Student data missing _id field:', studentData);
          console.error('Available keys in studentData:', Object.keys(studentData));
          return;
        }
        
        console.log('Valid student data received:', studentData);
        setStudentInfo(studentData);

        // Extract resume info if available
        if (studentData?.resumeAnalysis) {
          setResumeInfo(studentData.resumeAnalysis);
        }

      } catch (profileError: any) {
        console.error('Error fetching student profile:', profileError);
        console.error('Profile error response:', profileError?.response?.data);
        console.error('Profile error status:', profileError?.response?.status);
        
        // If it's a 401, redirect to login
        if (profileError?.response?.status === 401) {
          console.log('Authentication error, redirecting to login...');
          localStorage.removeItem('token');
          router.push('/login');
        }
        
        // For other errors, don't continue with other API calls
        console.log('Profile fetch failed, skipping other API calls');
        return;
      }

      // Only continue if we have valid student data
      if (!studentData || !studentData._id) {
        console.error('Cannot continue without valid student data');
        return;
      }

      console.log('Continuing with student ID:', studentData._id);

      // Fetch college information if collegeId exists
      if (studentData?.collegeId) {
        try {
          // Try the college profile endpoint first, then fallback to public endpoint
          let collegeResponse;
          try {
            collegeResponse = await axios.get(`${API_BASE_URL}/api/colleges/${studentData.collegeId._id || studentData.collegeId}`, { headers });
          } catch (error) {
            // Fallback to populate data from student profile
            if (studentData.collegeId && typeof studentData.collegeId === 'object') {
              setCollegeInfo({
                _id: studentData.collegeId._id,
                name: studentData.collegeId.name,
                collegeName: studentData.collegeId.name,
                address: studentData.collegeId.address,
                location: studentData.collegeId.address
              });
            }
          }
          
          if (collegeResponse) {
            console.log('College data:', collegeResponse.data);
            setCollegeInfo(collegeResponse.data);
          }
          
          // Fetch college connections using the correct endpoint
          const collegeId = studentData.collegeId._id || studentData.collegeId;
          try {
            const connectionsResponse = await axios.get(`${API_BASE_URL}/api/colleges/${collegeId}/connections`, { headers });
            console.log('College connections:', connectionsResponse.data);
            setCollegeConnections(connectionsResponse.data?.data || []);
          } catch (error) {
            console.log('College connections API call failed:', error);
            setCollegeConnections([]);
          }
        } catch (error) {
          console.log('College info API call failed:', error);
          setCollegeInfo(null);
        }
      }

      // Fetch upcoming interviews
      let interviews: any[] = [];
      try {
        const interviewsResponse = await axios.get(`${API_BASE_URL}/api/interviews/student/assignments`, { headers });
        interviews = interviewsResponse.data?.data || interviewsResponse.data || [];
        setUpcomingInterviews(Array.isArray(interviews) ? interviews.slice(0, 5) : []);
      } catch (error) {
        console.log('Interviews API call failed:', error);
        setUpcomingInterviews([]);
      }

      // Fetch recent applications - Use correct endpoint and data handling
      let applications: any[] = [];
      try {
        console.log('Fetching student applications...');
        
        // Use the dedicated student applications endpoint
        const applicationsResponse = await axios.get(`${API_BASE_URL}/api/students/applications`, { headers });
        console.log('Applications response:', applicationsResponse.data);
        
        // Handle the response properly based on API structure
        const applicationsData = applicationsResponse.data?.data || applicationsResponse.data || [];
        console.log('Raw applications data:', applicationsData);
        
        // Transform applications to ensure proper structure
        applications = Array.isArray(applicationsData) ? applicationsData.map((app: any) => ({
          _id: app._id,
          jobId: app.jobId?._id || app.jobId,
          jobTitle: app.jobId?.title || app.jobTitle || 'Job Title',
          companyName: app.jobId?.companyName || app.companyName || 'Company',
          appliedDate: app.dateApplied || app.appliedDate || app.createdAt,
          status: app.status || 'applied',
          matchScore: app.matchAnalysis?.overallMatch || app.matchScore || null,
          applicationNotes: app.notes || app.applicationNotes || '',
          resumeAnalysis: app.matchAnalysis || null
        })) : [];
        
        console.log('Transformed applications:', applications);
        setRecentApplications(Array.isArray(applications) ? applications.slice(0, 5) : []);
        
      } catch (error) {
        console.log('Student applications API call failed:', error);
        
        // Try fallback endpoints with proper error handling
        try {
          console.log('Trying fallback application endpoint...');
          const fallbackResponse = await axios.get(`${API_BASE_URL}/api/applications/student/${studentData._id}`, { headers });
          const fallbackApps = fallbackResponse.data?.data || fallbackResponse.data || [];
          
          // Transform fallback data
          applications = Array.isArray(fallbackApps) ? fallbackApps.map((app: any) => ({
            _id: app._id,
            jobId: app.jobId?._id || app.jobId,
            jobTitle: app.jobTitle || 'Job Title',
            companyName: app.companyName || 'Company',
            appliedDate: app.appliedDate || app.createdAt,
            status: app.status || 'applied',
            matchScore: app.matchScore || null,
            applicationNotes: app.applicationNotes || ''
          })) : [];
          
          setRecentApplications(Array.isArray(applications) ? applications.slice(0, 5) : []);
        } catch (fallbackError) {
          console.log('All application endpoints failed:', fallbackError);
          setRecentApplications([]);
          applications = [];
        }
      }

      // Fetch job recommendations based on profile - Enhanced with stable matching
      let recommendations: any[] = [];
      try {
        console.log('Fetching job recommendations for student:', studentData._id);
        
        // Try multiple endpoints for job matches with proper error handling
        let recommendationsResponse;
        try {
          // First try the student-career specific job matches endpoint
          recommendationsResponse = await axios.get(`${API_BASE_URL}/api/student-career/${studentData._id}/job-matches?limit=8&threshold=10`, { headers });
          console.log('Student-career job matches response:', recommendationsResponse.data);
          
          // Extract matches from the structured response
          recommendations = recommendationsResponse.data?.data?.matches || [];
        } catch (err) {
          try {
            // Fallback to students job matches endpoint
            recommendationsResponse = await axios.get(`${API_BASE_URL}/api/students/${studentData._id}/matches`, { headers });
            console.log('Students matches response:', recommendationsResponse.data);
            recommendations = recommendationsResponse.data?.matches || recommendationsResponse.data?.data || recommendationsResponse.data || [];
          } catch (err2) {
            try {
              // Fallback to general recommendations endpoint
              recommendationsResponse = await axios.get(`${API_BASE_URL}/api/jobs/recommendations/${studentData._id}`, { headers });
              console.log('Jobs recommendations response:', recommendationsResponse.data);
              recommendations = recommendationsResponse.data?.data || recommendationsResponse.data || [];
            } catch (err3) {
              // Fallback to general job search with student preferences
              recommendationsResponse = await axios.get(`${API_BASE_URL}/api/jobs/matches?studentId=${studentData._id}`, { headers });
              console.log('Jobs matches response:', recommendationsResponse.data);
              recommendations = recommendationsResponse.data?.data || recommendationsResponse.data || [];
            }
          }
        }
        
        console.log('Fetched job recommendations:', recommendations);
        
        // Filter out jobs that the student has already applied for
        const appliedJobIds = applications.map((app: any) => app.jobId || app._id);
        const filteredRecommendations = Array.isArray(recommendations) ? recommendations.filter((job: any) => 
          !appliedJobIds.includes(job._id)
        ) : [];
        
        // Apply stable matching scores
        const recommendationsWithStableScores = filteredRecommendations.map((job: any) => {
          let matchScore = job.matchScore;
          
          // Check if we already have a stable score for this job
          if (stableJobMatches.has(job._id)) {
            matchScore = stableJobMatches.get(job._id);
          } else {
            // Use existing match score if available, otherwise calculate stable score
            if (typeof matchScore === 'number') {
              setStableJobMatches(prev => new Map(prev.set(job._id, matchScore)));
            } else {
              // Generate a stable score based on job and student data
              matchScore = calculateStableMatchScore(job, studentData);
              setStableJobMatches(prev => new Map(prev.set(job._id, matchScore)));
            }
          }
          
          return {
            ...job,
            matchScore,
            // Ensure required fields are present
            title: job.title || job.jobTitle || 'Job Title',
            companyName: job.companyName || job.company?.name || 'Company',
            location: job.location || job.workplace || 'Location',
            requiredSkills: job.requiredSkills || job.skills || []
          };
        });
        
        setJobRecommendations(Array.isArray(recommendationsWithStableScores) ? recommendationsWithStableScores.slice(0, 4) : []);
      } catch (error) {
        console.log('Job recommendations API calls failed:', error);
        // Try general jobs endpoint as fallback
        try {
          console.log('Trying general jobs fallback...');
          const fallbackResponse = await axios.get(`${API_BASE_URL}/api/jobs?limit=8`, { headers });
          const fallbackJobs = fallbackResponse.data?.data || fallbackResponse.data || [];
          console.log('Fallback jobs:', fallbackJobs);
          
          // Filter out jobs that the student has already applied for
          const appliedJobIds = applications.map((app: any) => app.jobId || app._id);
          const filteredFallbackJobs = Array.isArray(fallbackJobs) ? fallbackJobs.filter((job: any) => 
            !appliedJobIds.includes(job._id)
          ) : [];
          
          // Transform general jobs to match recommendation format with stable scores
          const transformedJobs = filteredFallbackJobs.map((job: any) => {
            let matchScore;
            if (stableJobMatches.has(job._id)) {
              matchScore = stableJobMatches.get(job._id);
            } else {
              matchScore = calculateStableMatchScore(job, studentData);
              setStableJobMatches(prev => new Map(prev.set(job._id, matchScore)));
            }
            
            return {
              ...job,
              matchScore,
              title: job.title || 'Job Title',
              companyName: job.company?.name || job.companyName || 'Unknown Company',
              location: job.location || 'Location not specified',
              requiredSkills: job.skills || job.requiredSkills || []
            };
          });
          setJobRecommendations(Array.isArray(transformedJobs) ? transformedJobs.slice(0, 4) : []);
        } catch (fallbackError) {
          console.log('All job recommendation endpoints failed:', fallbackError);
          setJobRecommendations([]);
        }
      }

      // Fetch notifications
      try {
        const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
        const notifs = notificationsResponse.data?.data || notificationsResponse.data || [];
        setNotifications(Array.isArray(notifs) ? notifs.slice(0, 5) : []);
      } catch (error) {
        console.log('Notifications API call failed:', error);
        setNotifications([]);
      }

      // Calculate comprehensive stats
      const completeness = calculateProfileCompleteness(studentData);
      const avgMatch = applications.length > 0 
        ? applications.reduce((sum: number, app: any) => sum + (app.matchScore || 0), 0) / applications.length 
        : 0;

      setStats({
        totalApplications: applications.length || 0,
        interviewsScheduled: interviews.length || 0,
        upcomingInterviews: interviews.filter((i: any) => 
          new Date(i.interviewDate) > new Date() && i.status === 'confirmed'
        ).length || 0,
        profileCompleteness: completeness,
        averageMatchScore: Math.round(avgMatch),
        aiRecommendations: recommendations.length || 0
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = (profile: any) => {
    const fields = [
      profile?.phoneNumber,
      profile?.dateOfBirth,
      profile?.education?.length > 0,
      profile?.skills?.length > 0,
      profile?.resumeFile || resumeInfo,
      profile?.experience?.length > 0,
      profile?.linkedinUrl,
      profile?.portfolioUrl
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const calculateStableMatchScore = (job: any, student: any) => {
    // Create a deterministic score based on job and student characteristics
    let score = 50; // Base score
    
    // Skill matching (30 points max)
    const studentSkills = (student.skills || []).map((s: string) => s.toLowerCase());
    const jobSkills = (job.requiredSkills || job.skills || []).map((s: string) => s.toLowerCase());
    const matchingSkills = studentSkills.filter((skill: string) => 
      jobSkills.some((jobSkill: string) => jobSkill.includes(skill) || skill.includes(jobSkill))
    );
    if (jobSkills.length > 0) {
      score += Math.round((matchingSkills.length / jobSkills.length) * 30);
    }
    
    // Experience matching (20 points max)
    const studentExp = student.experience?.length || 0;
    if (studentExp > 0) {
      score += Math.min(20, studentExp * 5);
    }
    
    // Create deterministic variation based on job ID and student ID
    const hashInput = `${job._id}-${student._id}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Add deterministic variation (-10 to +10)
    const variation = (Math.abs(hash) % 21) - 10;
    score += variation;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'selected': return 'text-green-600 bg-green-100';
      case 'pending': case 'under_review': case 'applied': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': case 'rejected': return 'text-red-600 bg-red-100';
      case 'interview_scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleResumeButtonClick = () => {
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resumeUpload.handleFileSelect(file);
    }
  };

  const handleApplyForJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStudentData(); // Refresh data after application
    } catch (error) {
      console.error('Error applying for job:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {studentInfo?.firstName || 'Student'}!
          </h1>
          <p className="text-gray-600">
            Track your job applications, manage interviews, and build your career.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: ChartIcon },
              { id: 'jobs', label: 'Job Matches', icon: BriefcaseIcon },
              { id: 'applications', label: 'Applications', icon: DocumentIcon },
              { id: 'interviews', label: 'Interviews', icon: CalendarIcon },
              { id: 'college', label: 'My College', icon: UniversityIcon },
              { id: 'profile', label: 'Profile', icon: ProfileIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <BriefcaseIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Interviews</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.upcomingInterviews}</p>
                  </div>
                  <CalendarIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                    <p className="text-3xl font-bold text-green-600">{stats.profileCompleteness}%</p>
                  </div>
                  <UserGroupIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Match Score</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.averageMatchScore || 0}%</p>
                  </div>
                  <TrendingUpIcon />
                </div>
              </div>
            </div>

            {/* Resume Upload & AI Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI-Powered Resume Analysis
              </h2>
              
              {resumeInfo ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-medium">✅ Resume analyzed successfully!</p>
                    <p className="text-green-600 text-xs mt-1">AI matching active for job recommendations</p>
                  </div>
                  
                  {resumeInfo.skills && resumeInfo.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">🎯 Detected Skills ({resumeInfo.skills.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeInfo.skills.slice(0, 8).map((skill: any, idx: number) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {typeof skill === 'string' ? skill : skill.name || skill}
                          </span>
                        ))}
                        {resumeInfo.skills.length > 8 && (
                          <span className="text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-full">
                            +{resumeInfo.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleResumeButtonClick}
                      disabled={resumeUploading}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {resumeUploading ? 'Updating...' : 'Update Resume'}
                    </button>
                    <Link href="/ai-resume-builder" className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                      Build AI Resume
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Upload your resume for AI-powered job matching and personalized recommendations</p>
                  
                  {resumeUploading ? (
                    <div className="border-2 border-blue-300 border-dashed rounded-lg p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-blue-600 text-sm">Analyzing resume with AI...</p>
                    </div>
                  ) : (
                    <div 
                      onClick={handleResumeButtonClick}
                      className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <div className="text-gray-400 text-3xl mb-3">�</div>
                      <p className="text-gray-600 text-sm mb-2">Click to upload PDF resume</p>
                      <p className="text-gray-400 text-xs">AI will analyze & extract skills for job matching</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/jobs" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <BriefcaseIcon />
                  <span className="font-medium">Browse Jobs</span>
                </Link>
                
                <Link href="/profile/edit" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <UserGroupIcon />
                  <span className="font-medium">Edit Profile</span>
                </Link>
                
                <Link href="/ai-resume-builder" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                  <DocumentIcon />
                  <span className="font-medium">AI Resume Builder</span>
                </Link>
                
                <button onClick={() => setActiveTab('interviews')} className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                  <CalendarIcon />
                  <span className="font-medium">My Interviews</span>
                </button>
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BellIcon />
                    <span className="ml-2">Recent Notifications</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {Array.isArray(notifications) && notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                        onClick={() => !notification.read && markNotificationRead(notification._id)}
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                        )}
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No notifications available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Matches Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">AI-Powered Job Recommendations</h2>
                <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Browse All Jobs
                </Link>
              </div>
              
              {Array.isArray(jobRecommendations) && jobRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobRecommendations.map((job) => (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{job.title || 'Untitled Job'}</h3>
                          <p className="text-gray-600">{job.companyName || job.company || 'Company Name'}</p>
                          <p className="text-sm text-gray-500">
                            {job.location || job.workplace || 'Location not specified'} • 
                            <span>
                              {typeof job.salary === 'object' && job.salary ? 
                                `${job.salary.currency || '₹'} ${job.salary.min?.toLocaleString() || '0'} - ${job.salary.max?.toLocaleString() || '0'}` : 
                                (job.salary as string || 'Salary not disclosed')
                              }
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {job.matchScore}% Match
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {(job.requiredSkills || []).slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {(job.requiredSkills || []).length > 4 && (
                            <span className="text-gray-500 text-xs">+{(job.requiredSkills || []).length - 4} more</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Posted {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Recently'}
                        </span>
                        <button
                          onClick={() => handleApplyForJob(job._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BriefcaseIcon />
                  <p className="mt-4 text-gray-500">No job recommendations yet</p>
                  <p className="text-sm text-gray-400 mb-4">Upload your resume to get AI-powered job matches</p>
                  <button
                    onClick={handleResumeButtonClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
              <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Apply for Jobs
              </Link>
            </div>
            
            {Array.isArray(recentApplications) && recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application._id || Math.random()} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{application.jobTitle || 'Job Title'}</h3>
                      <p className="text-sm text-gray-600">{application.companyName || 'Company'}</p>
                      <p className="text-sm text-gray-500">
                        Applied on {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'Recently'}
                      </p>
                      {application.matchScore && typeof application.matchScore === 'number' && (
                        <p className="text-xs text-green-600 mt-1">
                          Match Score: {application.matchScore}%
                        </p>
                      )}
                      {application.resumeAnalysis && (
                        <p className="text-xs text-blue-600 mt-1">
                          ✓ AI Resume Analysis Available
                        </p>
                      )}
                      {application.applicationNotes && (
                        <p className="text-xs text-gray-500 mt-1">
                          Notes: {application.applicationNotes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status || 'applied')}`}>
                        {(application.status || 'applied').replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {(application._id || '000000').slice(-6)}
                      </p>
                      {application.jobId && (
                        <p className="text-xs text-gray-400 mt-1">
                          Job: {(application.jobId || '000000').slice(-6)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show total count if there are more applications */}
                {recentApplications.length === 5 && (
                  <div className="text-center py-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing 5 most recent applications. 
                      <Link href="/applications" className="text-blue-600 hover:text-blue-800 ml-1">
                        View all applications
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentIcon />
                <p className="mt-4 text-gray-500">No applications yet</p>
                <p className="text-sm text-gray-400 mb-4">Start applying for jobs to track your progress</p>
                <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Interview Schedule</h2>
              <Link href="/dashboard/interviews" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Detailed View
              </Link>
            </div>
            
            {Array.isArray(upcomingInterviews) && upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{interview.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{interview.companyName}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>📅 {new Date(interview.interviewDate).toLocaleDateString()}</span>
                          <span>🕒 {interview.interviewTime}</span>
                          <span className={interview.type === 'online' ? '💻' : '🏢'}>{interview.type}</span>
                        </div>
                        {interview.type === 'online' && interview.meetingLink && (
                          <a 
                            href={interview.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            🔗 Join Meeting
                          </a>
                        )}
                        {interview.location && interview.type === 'offline' && (
                          <p className="text-sm text-gray-500 mt-1">📍 {interview.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon />
                <p className="mt-4 text-gray-500">No interviews scheduled</p>
                <p className="text-sm text-gray-400 mb-4">Apply for jobs to get interview invitations</p>
                <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {/* My College Tab */}
        {activeTab === 'college' && (
          <div className="space-y-6">
            {/* College Information */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My College</h2>
                {collegeInfo && (
                  <Link href={`/profile/college/${collegeInfo._id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    View College Profile
                  </Link>
                )}
              </div>
              
              {collegeInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {collegeInfo.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{collegeInfo.name || 'College Name'}</h3>
                        <p className="text-gray-600">{collegeInfo.shortName || collegeInfo.domainCode || 'College Code'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-gray-600">
                          {collegeInfo.address ? 
                            `${collegeInfo.address.street || ''} ${collegeInfo.address.city || ''}, ${collegeInfo.address.state || ''} ${collegeInfo.address.zipCode || ''}`.trim() :
                            'Not provided'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Placement Contact</p>
                        <p className="text-gray-600">{collegeInfo.placementContact?.email || 'Not provided'}</p>
                        {collegeInfo.placementContact?.phone && (
                          <p className="text-gray-600">{collegeInfo.placementContact.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Website</p>
                        {collegeInfo.website ? (
                          <a href={collegeInfo.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:text-blue-800">
                            {collegeInfo.website}
                          </a>
                        ) : (
                          <p className="text-gray-600">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Established</span>
                        <span className="font-medium">{collegeInfo.establishedYear || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Type</span>
                        <span className="font-medium">{collegeInfo.type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Affiliation</span>
                        <span className="font-medium">{collegeInfo.affiliation || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Students Enrolled</span>
                        <span className="font-medium">{collegeInfo.stats?.totalStudents || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">College information not available</p>
                  <p className="text-sm text-gray-400">Please contact your placement officer to update college details</p>
                </div>
              )}
            </div>

            {/* Company Connections */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Partnerships</h3>
              
              {Array.isArray(collegeConnections) && collegeConnections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collegeConnections.slice(0, 9).map((connection, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {connection.companyName?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{connection.companyName || 'Company'}</h4>
                          <p className="text-sm text-gray-500">{connection.industry || 'Industry not specified'}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Connected
                            </span>
                            {connection.activeJobs > 0 && (
                              <span className="text-xs text-blue-600 ml-2">
                                {connection.activeJobs} open positions
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BriefcaseIcon className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No company partnerships yet</p>
                  <p className="text-sm text-gray-400">Your college is working to establish partnerships with companies</p>
                </div>
              )}
              
              {collegeConnections.length > 9 && (
                <div className="text-center mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    and {collegeConnections.length - 9} more companies
                  </p>
                </div>
              )}
            </div>

            {/* Placement Statistics */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Placement Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{collegeInfo?.placementStats?.placementRate || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Placement Rate</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{collegeInfo?.placementStats?.averagePackage || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Avg Package</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{collegeInfo?.placementStats?.highestPackage || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Highest Package</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{collegeInfo?.placementStats?.recruitingCompanies || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Recruiting Companies</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Management</h2>
                <Link href="/profile/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Edit Profile
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span>{studentInfo?.firstName} {studentInfo?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span>{studentInfo?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span>{studentInfo?.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">LinkedIn:</span>
                      <span>{studentInfo?.linkedinUrl ? '✅ Connected' : '❌ Not connected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Portfolio:</span>
                      <span>{studentInfo?.portfolioUrl ? '✅ Added' : '❌ Not added'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Academic & Professional</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Skills:</span>
                      <span>{studentInfo?.skills?.length || 0} skills added</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Education:</span>
                      <span>{studentInfo?.education?.length || 0} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Experience:</span>
                      <span>{studentInfo?.experience?.length || 0} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Resume:</span>
                      <span>{resumeInfo ? '✅ Uploaded & Analyzed' : '❌ Not uploaded'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Profile Completeness</h3>
                <div className="bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.profileCompleteness}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{stats.profileCompleteness}% Complete</span>
                  <span className="text-green-600 font-medium">
                    {stats.profileCompleteness === 100 ? '🎉 Profile Complete!' : `${100 - stats.profileCompleteness}% remaining`}
                  </span>
                </div>
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Resume & AI Analysis</h3>
              {resumeInfo ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-medium">✅ Resume uploaded and analyzed</p>
                    <p className="text-green-600 text-xs mt-1">Last updated: {new Date(resumeInfo.uploadDate).toLocaleDateString()}</p>
                  </div>
                  
                  {resumeInfo.extractedDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Extracted Information</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Skills: {resumeInfo.skills?.length || 0} detected</li>
                          <li>• Experience: {resumeInfo.extractedDetails.experience?.length || 0} entries</li>
                          <li>• Education: {resumeInfo.extractedDetails.education?.length || 0} entries</li>
                          <li>• Projects: {resumeInfo.extractedDetails.projects?.length || 0} entries</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Analysis Quality</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Confidence: {resumeInfo.confidence || 0}%</li>
                          <li>• Category: {resumeInfo.category || 'General'}</li>
                          <li>• Level: {resumeInfo.experienceLevel || 'Entry'}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleResumeButtonClick}
                    disabled={resumeUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {resumeUploading ? 'Updating...' : 'Update Resume'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">Upload your resume to enable AI-powered job matching and get personalized recommendations</p>
                  <button
                    onClick={handleResumeButtonClick}
                    disabled={resumeUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Quick Profile Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/ai-resume-builder" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                  <DocumentIcon />
                  <div>
                    <p className="font-medium">AI Resume Builder</p>
                    <p className="text-xs text-gray-500">Create tailored resumes</p>
                  </div>
                </Link>
                
                <Link href="/profile/edit" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <UserGroupIcon />
                  <div>
                    <p className="font-medium">Edit Information</p>
                    <p className="text-xs text-gray-500">Update personal details</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

      {/* Hidden file input for resume upload */}
      <input
        id="resume-upload"
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
        style={{ display: 'none' }}
      />
    </main>
  </>
  );
}
