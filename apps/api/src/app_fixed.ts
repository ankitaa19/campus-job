import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import studentResumeRoutes from './routes/students-resume';
import studentResumeAIRoutes from './routes/students-resume-ai';
import collegeRoutes from './routes/colleges';
import recruiterRoutes from './routes/recruiters';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';
import studentCareerRoutes from './routes/student-career';
import careerAdminRoutes from './routes/career-admin';
import resumeBuilderRoutes from './routes/resume-builder';
import aiResumeBuilderRoutes from './routes/ai-resume-builder';
import generatedResumeRoutes from './routes/generated-resume';
import wabbResumeRoutes from './routes/wabb-resume';
import invitationRoutes from './routes/invitations';
import interviewSlotRoutes from './routes/interview-slots';

import { connectDB } from './utils/database';
import SimpleScheduler from './services/simple-scheduler';

const app = express(); // ✅ create the app

// Azure defaults
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

// Body parsers first
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow Postman/mobile
      const ok = allowedOrigins.includes(origin);
      if (ok) return cb(null, true);
      console.log('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200,
  })
);

// Make sure preflight is answered
app.options('*', cors());

// Timeouts
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('analyze-resume') || req.path.includes('upload')) {
    req.setTimeout(120000);
    res.setTimeout(120000);
  } else {
    req.setTimeout(30000);
    res.setTimeout(30000);
  }
  next();
});

// Health / root
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'CampusPe API is running',
    health: '/health',
    version: '1.5.0',
    deployment: 'github-actions',
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'CampusPe API with Job Matching is running',
    timestamp: new Date().toISOString(),
  });
});

// DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentResumeAIRoutes);
app.use('/api/students', studentResumeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes); // ✅ split line
app.use('/api/admin', adminRoutes);
app.use('/api/student-career', studentCareerRoutes);
app.use('/api/career-admin', careerAdminRoutes);
app.use('/api/resume-builder', resumeBuilderRoutes);
app.use('/api/ai-resume', aiResumeBuilderRoutes);
app.use('/api/generated-resume', generatedResumeRoutes);
app.use('/api/wabb', wabbResumeRoutes);
app.use('/api', invitationRoutes);
app.use('/api', interviewSlotRoutes);
app.use('/api/interviews', interviewSlotRoutes);
app.use('/api/webhook', webhookRoutes);

// Start
app.listen(PORT, HOST, () => {
  console.log(`🚀 CampusPe API is running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
  console.log(`🤖 Career Opportunity Alert System initialized`);
  SimpleScheduler.init();
});
