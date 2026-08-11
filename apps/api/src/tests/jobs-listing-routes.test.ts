import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jobsRouter from '../routes/jobs';
import { Job, Student, User } from '../models';
import { enrichJob } from '../services/job-intelligence';
import JobMatchingRagService from '../services/job-matching-rag';

describe('Jobs listing routes', () => {
  let mongoServer: MongoMemoryServer;
  let app: express.Express;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(bodyParser.json());
    app.use('/api/jobs', jobsRouter);
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const createJob = async (index: number) => {
    const jobData = {
      title: `Software Engineer ${index}`,
      description: 'Build React and TypeScript products.',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: `Company ${index}`,
      locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React', 'TypeScript'],
      experienceLevel: 'entry',
      minExperience: 0,
      salary: { min: 800000, max: 1200000, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalPositions: 2,
      interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true
    };
    return new Job({ ...jobData, ...enrichJob(jobData) }).save();
  };

  test('authenticated matches listing preserves the public full job count', async () => {
    const user = await new User({ email: 'student@example.com', password: 'password123', role: 'student' }).save();
    await new Student({
      userId: user._id,
      firstName: 'Maya',
      lastName: 'Iyer',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
      education: [],
      experience: [],
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: ['Bangalore'], workMode: 'hybrid' }
    }).save();
    await Promise.all(Array.from({ length: 5 }, (_, index) => createJob(index + 1)));
    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET!);

    const publicResponse = await request(app).get('/api/jobs/public?limit=2&page=1').expect(200);
    const loggedInResponse = await request(app)
      .get('/api/jobs/matches?limit=2&page=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Number(publicResponse.headers['x-total-count'])).toBe(5);
    expect(publicResponse.body[0].applicationCapability).toBe('unsupported');
    expect(Number(loggedInResponse.headers['x-total-count'])).toBe(5);
    expect(loggedInResponse.body.total).toBe(5);
    expect(loggedInResponse.body.data).toHaveLength(2);
    expect(loggedInResponse.body.data[0].applicationCapability).toBe('unsupported');
  });

  test('authenticated matches listing falls back to plain jobs when match annotation fails', async () => {
    const user = await new User({ email: 'fallback@example.com', password: 'password123', role: 'student' }).save();
    await new Student({
      userId: user._id,
      firstName: 'Riya',
      lastName: 'Shah',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
      education: [],
      experience: [],
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: ['Bangalore'], workMode: 'hybrid' }
    }).save();
    await Promise.all(Array.from({ length: 3 }, (_, index) => createJob(index + 1)));
    jest.spyOn(JobMatchingRagService, 'annotateJobsForUser').mockRejectedValueOnce(new Error('connection timed out'));
    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET!);

    const response = await request(app)
      .get('/api/jobs/matches?limit=2&page=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.total).toBe(3);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].matchScore).toBeUndefined();
  });
});
