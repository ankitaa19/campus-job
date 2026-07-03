import axios from 'axios';

// API Configuration
// Get the raw API URL from environment variable and trim whitespace
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

// Define default API URL based on environment
// For development (localhost), use local API server
// For production, use the staging Azure endpoint
const DEFAULT_API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001' 
  : 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net';

// Resolve API URL using environment variable or fallback
let apiBaseUrl = rawApiUrl || DEFAULT_API_URL;

// Ensure the URL parses correctly and strip any trailing slash
try {
  const parsed = new URL(
    apiBaseUrl.includes('://') ? apiBaseUrl : `https://${apiBaseUrl}`
  );
  apiBaseUrl = parsed.toString().replace(/\/$/, '');
} catch {
  apiBaseUrl = DEFAULT_API_URL;
}

// Ensure the URL includes a protocol
if (!/^https?:\/\//i.test(apiBaseUrl)) {
  apiBaseUrl = `https://${apiBaseUrl}`;
}

export const API_BASE_URL = apiBaseUrl;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on auth errors
      localStorage.removeItem('token');
      localStorage.removeItem('profileData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_OTP: '/api/auth/verify-otp',
  SEND_OTP: '/api/auth/send-otp',
  CHECK_EMAIL: '/api/auth/check-email',
  CHECK_PHONE: '/api/auth/check-phone',

  // Students
  STUDENT_PROFILE: '/api/students/profile',
  STUDENT_UPDATE: (id: string) => `/api/students/${id}`,
  STUDENT_UPDATE_PROFILE: (id: string) => `/api/students/${id}/profile`,
  STUDENT_JOB_MATCHES: '/api/students/job-matches',
  STUDENT_ANALYZE_RESUME: '/api/students/analyze-resume-ai', // Back to full AI analysis
  STUDENT_BY_USER_ID: (userId: string) => `/api/students/user/${userId}`,

  // Jobs
  JOBS: '/api/jobs',
  JOB_BY_ID: (id: string) => `/api/jobs/${id}`,
  JOB_APPLY: (id: string) => `/api/jobs/${id}/apply`,
  JOB_CREATE: '/api/jobs',
  JOB_RESUME_ANALYSIS: (id: string) => `/api/jobs/${id}/resume-analysis/current`,
  JOB_ANALYZE_RESUME: (id: string) => `/api/jobs/${id}/analyze-resume`,

  // Recruiters
  RECRUITER_BY_USER_ID: (userId: string) => `/api/recruiters/user/${userId}`,
  RECRUITER_PROFILE: (id: string) => `/api/recruiters/${id}/profile`,
  RECRUITER_BY_ID: (id: string) => `/api/recruiters/${id}`,

  // Colleges
  COLLEGES: '/api/colleges',
  COLLEGE_BY_USER_ID: (userId: string) => `/api/colleges/user/${userId}`,
  COLLEGE_PROFILE: (id: string) => `/api/colleges/${id}/profile`,
  COLLEGE_BY_ID: (id: string) => `/api/colleges/${id}`,

  // Students (for profile viewing)
  STUDENT_PROFILE_BY_ID: (id: string) => `/api/students/${id}/profile`,
  STUDENT_BY_ID: (id: string) => `/api/students/${id}`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',

  // AI Resume Builder
  AI_RESUME_GENERATE: '/api/ai-resume-builder/generate-ai',
  AI_RESUME_DOWNLOAD: '/api/ai-resume-builder/download-pdf',
  AI_RESUME_HISTORY: '/api/ai-resume-builder/history',
  WABB_CREATE_RESUME: '/api/wabb/create-resume',
  WABB_GENERATE_AND_SHARE: '/api/wabb/generate-and-share',

  // Admin
  ADMIN_DASHBOARD_STATS: '/api/admin/dashboard/stats',
  ADMIN_PENDING_APPROVALS: '/api/admin/pending-approvals',
  ADMIN_APPROVE: (type: string, id: string) => `/api/admin/${type === 'college' ? 'colleges' : 'recruiters'}/${id}/approve`,
  ADMIN_REJECT: (type: string, id: string) => `/api/admin/${type === 'college' ? 'colleges' : 'recruiters'}/${id}/reject`,

  // Resubmission
  COLLEGE_RESUBMIT: '/api/colleges/resubmit',
  RECRUITER_RESUBMIT: '/api/recruiters/resubmit',

  // Health check
  HEALTH: '/health',
};

export default apiClient;