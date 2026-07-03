console.log('=== SIMPLE SERVER STARTING ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('PWD:', process.cwd());

const express = require('express');
const app = express();

// Unique deployment ID
const DEPLOYMENT_ID = `DEPLOY_${Date.now()}`;
console.log('Deployment ID:', DEPLOYMENT_ID);

// CORS configuration for frontend access
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://dev.campuspe.com',
    'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Basic middleware
app.use(express.json());

// Routes with unique deployment marker
app.get('/', (req, res) => {
  console.log('Root route hit at:', new Date().toISOString());
  res.status(200).json({ 
    message: 'SIMPLE SERVER IS WORKING!',
    deployment: DEPLOYMENT_ID,
    timestamp: new Date().toISOString(),
    server: 'simple-express',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  console.log('Health check at:', new Date().toISOString());
  res.status(200).json({ 
    status: 'healthy',
    deployment: DEPLOYMENT_ID,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/test', (req, res) => {
  console.log('Test route hit at:', new Date().toISOString());
  res.status(200).json({ 
    test: 'passed',
    deployment: DEPLOYMENT_ID,
    headers: req.headers,
    query: req.query
  });
});

// API routes that frontend expects
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  // Create a more realistic JWT token structure for testing
  const payload = {
    id: 'test-user',
    userId: 'test-user-id',
    email: req.body.email || 'test@example.com',
    role: 'student', // Default role for testing
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Create a mock JWT token (header.payload.signature)
  const header = Buffer.from(JSON.stringify({typ: 'JWT', alg: 'HS256'})).toString('base64');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'simple-server-signature';
  const token = `${header}.${payloadBase64}.${signature}`;
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    deployment: DEPLOYMENT_ID,
    token: token, // Frontend expects token directly in response.data
    user: {
      id: payload.id,
      userId: payload.userId,
      email: payload.email,
      name: 'Test User',
      role: payload.role
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  console.log('Auth me request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  // Mock user data for testing
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    user: {
      id: 'test-user',
      userId: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student'
    }
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check at:', new Date().toISOString());
  res.status(200).json({
    status: 'healthy',
    api: 'working',
    deployment: DEPLOYMENT_ID,
    timestamp: new Date().toISOString()
  });
});

// Student profile endpoint (the one frontend actually calls)
app.get('/api/students/profile', (req, res) => {
  console.log('Student profile request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      _id: 'test-student-id',
      userId: 'test-user-id',
      name: 'Test Student',
      email: 'test@example.com',
      college: 'Test College',
      collegeName: 'Test College',
      branch: 'Computer Science',
      year: 3,
      skills: ['JavaScript', 'React', 'Node.js'],
      cgpa: 8.5,
      phone: '+91-9876543210',
      isProfileComplete: true,
      resumeUrl: null
    }
  });
});

// Student applications endpoint
app.get('/api/students/applications', (req, res) => {
  console.log('Student applications request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'app1',
        jobId: 'job1',
        jobTitle: 'Software Developer',
        companyName: 'Test Company',
        status: 'applied',
        appliedAt: new Date().toISOString()
      },
      {
        _id: 'app2',
        jobId: 'job2',
        jobTitle: 'Frontend Developer',
        companyName: 'Another Company',
        status: 'shortlisted',
        appliedAt: new Date(Date.now() - 24*60*60*1000).toISOString()
      }
    ]
  });
});

// Student applications enhanced endpoint
app.get('/api/students/applications/enhanced', (req, res) => {
  console.log('Student enhanced applications request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'app1',
        jobId: {
          _id: 'job1',
          title: 'Software Developer',
          company: 'Test Company',
          location: 'Bangalore',
          type: 'Full-time',
          salary: '₹8-12 LPA'
        },
        status: 'applied',
        appliedAt: new Date().toISOString()
      }
    ]
  });
});

// Student job matches/recommendations endpoint
app.get('/api/students/:studentId/matches', (req, res) => {
  console.log('Student matches request for:', req.params.studentId);
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        company: 'Test Company',
        location: 'Bangalore',
        type: 'Full-time',
        salary: '₹8-12 LPA',
        skills: ['JavaScript', 'React'],
        matchScore: 85
      },
      {
        _id: 'job2',
        title: 'Frontend Developer',
        company: 'Another Company',
        location: 'Mumbai',
        type: 'Full-time',
        salary: '₹6-10 LPA',
        skills: ['React', 'CSS'],
        matchScore: 78
      }
    ]
  });
});

// Student profile endpoint by userId (backup)
app.get('/api/students/user/:userId', (req, res) => {
  console.log('Student profile request for userId:', req.params.userId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      id: 'test-student-id',
      userId: req.params.userId,
      name: 'Test Student',
      email: 'test@example.com',
      college: 'Test College',
      branch: 'Computer Science',
      year: 3
    }
  });
});

// College profile endpoint
app.get('/api/colleges/:collegeId', (req, res) => {
  console.log('College profile request for collegeId:', req.params.collegeId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      _id: req.params.collegeId,
      name: 'Test College',
      email: 'test@college.edu',
      location: 'Test City',
      type: 'Engineering',
      description: 'A premier engineering college'
    }
  });
});

// College connections endpoint
app.get('/api/colleges/:collegeId/connections', (req, res) => {
  console.log('College connections request for collegeId:', req.params.collegeId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'conn1',
        companyName: 'Test Company',
        connectionType: 'placement_partner',
        establishedDate: new Date().toISOString()
      }
    ]
  });
});

// Student interviews endpoint
app.get('/api/interviews/student/assignments', (req, res) => {
  console.log('Student interview assignments request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'interview1',
        jobTitle: 'Software Developer',
        companyName: 'Test Company',
        scheduledAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
        status: 'scheduled',
        type: 'technical'
      }
    ]
  });
});

// Student applications endpoint (primary one frontend calls)
app.get('/api/students/applications', (req, res) => {
  console.log('Student applications request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'app1',
        jobId: 'job1',
        jobTitle: 'Software Developer',
        companyName: 'Test Company',
        appliedDate: new Date().toISOString(),
        status: 'applied',
        matchScore: 85
      },
      {
        _id: 'app2',
        jobId: 'job2',
        jobTitle: 'Data Analyst',
        companyName: 'Tech Corp',
        appliedDate: new Date(Date.now() - 24*60*60*1000).toISOString(),
        status: 'under_review',
        matchScore: 92
      }
    ]
  });
});

// Applications by student ID endpoint
app.get('/api/applications/student/:studentId', (req, res) => {
  console.log('Applications by student ID request:', req.params.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'app1',
        jobId: 'job1',
        jobTitle: 'Software Developer',
        companyName: 'Test Company',
        appliedDate: new Date().toISOString(),
        status: 'applied',
        matchScore: 85
      }
    ]
  });
});

// Student career job matches endpoint
app.get('/api/student-career/:studentId/job-matches', (req, res) => {
  console.log('Student career job matches request:', req.params.studentId, req.query);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Frontend Developer',
        company: 'Tech Startup',
        location: 'Remote',
        matchScore: 88,
        description: 'Looking for a skilled frontend developer...',
        requirements: ['React', 'JavaScript', 'CSS'],
        salaryRange: '₹5-8 LPA',
        type: 'full-time'
      },
      {
        _id: 'job2',
        title: 'Full Stack Developer',
        company: 'Innovation Labs',
        location: 'Bangalore',
        matchScore: 92,
        description: 'Seeking a full stack developer...',
        requirements: ['Node.js', 'React', 'MongoDB'],
        salaryRange: '₹8-12 LPA',
        type: 'full-time'
      }
    ]
  });
});

// Student matches endpoint
app.get('/api/students/:studentId/matches', (req, res) => {
  console.log('Student matches request:', req.params.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Frontend Developer',
        company: 'Tech Startup',
        matchScore: 88
      },
      {
        _id: 'job2',
        title: 'Backend Developer',
        company: 'Dev Corp',
        matchScore: 85
      }
    ]
  });
});

// Job recommendations endpoint
app.get('/api/jobs/recommendations/:studentId', (req, res) => {
  console.log('Job recommendations request:', req.params.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Engineer',
        company: 'TechCorp',
        location: 'Hyderabad',
        matchScore: 90,
        salaryRange: '₹6-10 LPA'
      }
    ]
  });
});

// Job matches with query params endpoint
app.get('/api/jobs/matches', (req, res) => {
  console.log('Job matches request:', req.query);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'React Developer',
        company: 'Startup Inc',
        matchScore: 87
      }
    ]
  });
});

// Jobs endpoint with pagination
app.get('/api/jobs', (req, res) => {
  console.log('Jobs request:', req.query);
  const limit = parseInt(req.query.limit) || 10;
  
  const jobs = Array(limit).fill(null).map((_, index) => ({
    _id: `job${index + 1}`,
    title: `Job Title ${index + 1}`,
    company: `Company ${index + 1}`,
    location: 'Test Location',
    description: `Job description ${index + 1}`,
    requirements: ['Skill 1', 'Skill 2'],
    salaryRange: '₹5-8 LPA',
    type: 'full-time',
    createdAt: new Date().toISOString()
  }));
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: jobs,
    total: jobs.length
  });
});

// Notifications endpoint
app.get('/api/notifications', (req, res) => {
  console.log('Notifications request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'notif1',
        title: 'New Job Match',
        message: 'We found a new job that matches your profile!',
        type: 'job_match',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'notif2',
        title: 'Application Update',
        message: 'Your application status has been updated.',
        type: 'application_update',
        read: true,
        createdAt: new Date(Date.now() - 24*60*60*1000).toISOString()
      }
    ]
  });
});

// College by ID endpoint
app.get('/api/colleges/:collegeId', (req, res) => {
  console.log('College by ID request:', req.params.collegeId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      _id: req.params.collegeId,
      name: 'Test College',
      location: 'Test City',
      type: 'Engineering',
      email: 'contact@testcollege.edu',
      website: 'https://testcollege.edu',
      establishedYear: 2000,
      accreditation: 'NAAC A+'
    }
  });
});

// College connections endpoint
app.get('/api/colleges/:collegeId/connections', (req, res) => {
  console.log('College connections request:', req.params.collegeId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'connection1',
        recruiterId: 'recruiter1',
        companyName: 'Test Company',
        connectionType: 'placement_partner',
        establishedDate: new Date().toISOString()
      }
    ]
  });
});
app.get('/api/applications/student/:studentId', (req, res) => {
  console.log('Applications for student:', req.params.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'app1',
        jobId: 'job1',
        jobTitle: 'Software Developer',
        companyName: 'Test Company',
        status: 'applied',
        appliedAt: new Date().toISOString()
      }
    ]
  });
});

// Job recommendations endpoints (multiple variants the frontend tries)
app.get('/api/student-career/:studentId/job-matches', (req, res) => {
  console.log('Student career job matches for:', req.params.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        company: 'Test Company',
        location: 'Bangalore',
        type: 'Full-time',
        salary: '₹8-12 LPA',
        matchScore: 85
      }
    ]
  });
});

app.get('/api/jobs/recommendations/:studentId', (req, res) => {
  console.log('Job recommendations for student:', req.params.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        company: 'Test Company',
        location: 'Bangalore',
        type: 'Full-time',
        salary: '₹8-12 LPA'
      }
    ]
  });
});

app.get('/api/jobs/matches', (req, res) => {
  console.log('Job matches request with studentId:', req.query.studentId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        company: 'Test Company',
        location: 'Bangalore',
        type: 'Full-time',
        salary: '₹8-12 LPA'
      }
    ]
  });
});

app.get('/api/jobs', (req, res) => {
  console.log('General jobs request with limit:', req.query.limit);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        company: 'Test Company',
        location: 'Bangalore',
        type: 'Full-time',
        salary: '₹8-12 LPA',
        description: 'Looking for talented developers'
      },
      {
        _id: 'job2',
        title: 'Frontend Developer',
        company: 'Another Company',
        location: 'Mumbai',
        type: 'Full-time',
        salary: '₹6-10 LPA',
        description: 'React developer needed'
      }
    ]
  });
});

// Notifications endpoint
app.get('/api/notifications', (req, res) => {
  console.log('Notifications request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'notif1',
        title: 'Application Update',
        message: 'Your application for Software Developer has been reviewed',
        type: 'application',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'notif2',
        title: 'New Job Match',
        message: 'A new job matching your profile is available',
        type: 'job_match',
        isRead: true,
        createdAt: new Date(Date.now() - 60*60*1000).toISOString()
      }
    ]
  });
});

// Recruiter profile endpoint
app.get('/api/recruiters/user/:userId', (req, res) => {
  console.log('Recruiter profile request for userId:', req.params.userId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      id: 'test-recruiter-id',
      userId: req.params.userId,
      name: 'Test Recruiter',
      email: 'test@example.com',
      company: 'Test Company',
      position: 'HR Manager'
    }
  });
});

// College profile endpoint by userId
app.get('/api/colleges/user/:userId', (req, res) => {
  console.log('College profile request for userId:', req.params.userId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      id: 'test-college-id',
      userId: req.params.userId,
      name: 'Test College',
      email: 'test@example.com',
      location: 'Test City',
      type: 'Engineering'
    }
  });
});

// Recruiter profile endpoint
app.get('/api/recruiters/profile', (req, res) => {
  console.log('Recruiter profile request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      _id: 'recruiter1',
      userId: 'test-user-id',
      companyInfo: {
        name: 'Test Company',
        industry: 'Technology',
        size: '100-500',
        website: 'https://testcompany.com'
      },
      contactInfo: {
        email: 'recruiter@testcompany.com',
        phone: '+91-9876543210'
      },
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        position: 'HR Manager'
      },
      status: 'approved'
    }
  });
});

// Recruiter stats endpoint
app.get('/api/recruiters/stats', (req, res) => {
  console.log('Recruiter stats request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      totalJobs: 12,
      activeJobs: 8,
      totalApplications: 145,
      pendingApplications: 23,
      interviewsScheduled: 8,
      placementsMade: 15
    }
  });
});

// Recruiter jobs endpoint
app.get('/api/jobs/recruiter', (req, res) => {
  console.log('Recruiter jobs request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        department: 'Engineering',
        type: 'full-time',
        status: 'active',
        applicantsCount: 25,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'job2',
        title: 'Data Analyst',
        department: 'Analytics',
        type: 'full-time',
        status: 'active',
        applicantsCount: 18,
        createdAt: new Date(Date.now() - 24*60*60*1000).toISOString()
      }
    ]
  });
});

// Recruiter jobs (alternative endpoint)
app.get('/api/jobs/recruiter-jobs', (req, res) => {
  console.log('Recruiter jobs (alternative) request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json([
    {
      _id: 'job1',
      title: 'Software Developer',
      applicantsCount: 25,
      status: 'active'
    }
  ]);
});

// Recruiter applications endpoint
app.get('/api/applications/recruiter', (req, res) => {
  console.log('Recruiter applications request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'app1',
        studentId: 'student1',
        studentName: 'Alice Johnson',
        jobTitle: 'Software Developer',
        appliedDate: new Date().toISOString(),
        status: 'under_review',
        matchScore: 88
      }
    ]
  });
});

// Recruiter invitations endpoint
app.get('/api/invitations/recruiter', (req, res) => {
  console.log('Recruiter invitations request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'inv1',
        collegeId: 'college1',
        collegeName: 'Test College',
        jobTitle: 'Software Developer',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// College profile endpoint
app.get('/api/colleges/profile', (req, res) => {
  console.log('College profile request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      _id: 'college1',
      userId: 'test-user-id',
      name: 'Test Engineering College',
      type: 'Engineering',
      location: 'Test City',
      establishedYear: 2000,
      accreditation: 'NAAC A+',
      website: 'https://testcollege.edu',
      contactInfo: {
        email: 'admin@testcollege.edu',
        phone: '+91-9876543210'
      },
      status: 'approved'
    }
  });
});

// College stats endpoint
app.get('/api/colleges/stats', (req, res) => {
  console.log('College stats request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      totalStudents: 1250,
      activeStudents: 1100,
      graduatedStudents: 2500,
      placementRate: 85,
      averagePackage: '₹6.5 LPA',
      topPackage: '₹25 LPA',
      recruitingCompanies: 45
    }
  });
});

// College students endpoint
app.get('/api/colleges/students', (req, res) => {
  console.log('College students request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'student1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@testcollege.edu',
        branch: 'Computer Science',
        year: 3,
        cgpa: 8.5,
        status: 'active'
      },
      {
        _id: 'student2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@testcollege.edu',
        branch: 'Information Technology',
        year: 4,
        cgpa: 9.1,
        status: 'active'
      }
    ]
  });
});

// College jobs endpoint
app.get('/api/colleges/jobs', (req, res) => {
  console.log('College jobs request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'job1',
        title: 'Software Developer',
        companyName: 'Tech Corp',
        package: '₹8 LPA',
        applicationsCount: 25,
        status: 'active'
      }
    ]
  });
});

// College placements endpoint
app.get('/api/colleges/placements', (req, res) => {
  console.log('College placements request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'placement1',
        studentName: 'John Doe',
        companyName: 'Tech Corp',
        package: '₹8 LPA',
        role: 'Software Developer',
        placementDate: new Date().toISOString()
      }
    ]
  });
});

// College events endpoint
app.get('/api/colleges/events', (req, res) => {
  console.log('College events request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: [
      {
        _id: 'event1',
        title: 'Campus Placement Drive',
        description: 'Tech companies hiring for various roles',
        date: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        type: 'placement',
        status: 'upcoming'
      }
    ]
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  console.log('Unknown route:', req.originalUrl, 'at:', new Date().toISOString());
  res.status(404).json({ 
    error: 'Route not found',
    deployment: DEPLOYMENT_ID,
    path: req.originalUrl,
    method: req.method
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`=== SIMPLE SERVER RUNNING ON PORT ${port} ===`);
  console.log(`Deployment ID: ${DEPLOYMENT_ID}`);
  console.log('Server ready at:', new Date().toISOString());
});

// Handle process events
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
