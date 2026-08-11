import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';
import { Job, Student, User } from '../models';
import JobMatchingRagService from '../services/job-matching-rag';
import { resetCohereRateLimitState } from '../services/cohere-client';
import { enrichJob } from '../services/job-intelligence';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const embedCalls = () => mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('api.cohere.com/v1/embed'));

describe('bulk auto-apply embedding budget', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    process.env.COHERE_API_KEY = 'test-cohere-key';
    process.env.COHERE_MIN_REQUEST_INTERVAL_MS = '0';
    process.env.BULK_AUTO_APPLY_EMBEDDING_BUDGET = '5';
    mockedAxios.post.mockReset();
    mockedAxios.post.mockResolvedValue({ data: { embeddings: [Array(1024).fill(0.01)] } } as any);
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    resetCohereRateLimitState();
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    delete process.env.COHERE_API_KEY;
    delete process.env.COHERE_MIN_REQUEST_INTERVAL_MS;
    delete process.env.BULK_AUTO_APPLY_EMBEDDING_BUDGET;
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const createJob = async (index: number) => {
    const data = {
      title: `Warehouse Operations Opening ${index}`,
      description: 'Seasonal full time hourly warehouse operations role.',
      jobType: 'full-time',
      department: 'Operations',
      companyName: `Employer ${index}`,
      locations: [{ city: 'Bengaluru', state: 'Karnataka', country: 'India', isRemote: false, hybrid: false }],
      workMode: 'onsite',
      requirements: [],
      requiredSkills: ['react'],
      experienceLevel: 'entry',
      minExperience: 0,
      salary: { min: 0, max: 0, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 86400000),
      totalPositions: 1,
      interviewProcess: { rounds: ['Interview'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true,
      atsPlatform: 'greenhouse',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: `employer-${index}`,
      atsJobId: `job-${index}`,
      source: 'company_careers',
      sourceExternalId: `job-${index}`,
      // Imported jobs are only publicly visible while verified on the source.
      sourceLifecycleStatus: 'active',
      lastVerifiedAt: new Date()
    };
    return new Job({ ...data, ...enrichJob(data) }).save();
  };

  test('scanning a large catalogue caps embedding calls instead of one per job', async () => {
    const user = await new User({
      email: 'budget@example.com',
      password: 'password123',
      role: 'student',
      autoApplyThreshold: 0
    }).save();
    await new Student({
      userId: user._id,
      firstName: 'Asha',
      lastName: 'Rao',
      email: user.email,
      resumeText: 'Asha Rao warehouse operations associate',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
      education: [],
      experience: [],
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: [], workMode: 'any' }
    }).save();
    await Promise.all(Array.from({ length: 60 }, (_, index) => createJob(index)));

    const selection = await JobMatchingRagService.findBulkAutoApplySelection(user._id, {});

    // 1 resume embedding + at most the configured job-embedding budget.
    expect(embedCalls().length).toBeLessThanOrEqual(6);
    expect(selection.totalMatchedAboveThreshold).toBe(60);
    expect(selection.matches.length).toBeGreaterThan(0);
  });

  test('a throttled key still produces a selection using skill-only scores', async () => {
    const user = await new User({
      email: 'throttled@example.com',
      password: 'password123',
      role: 'student',
      autoApplyThreshold: 0
    }).save();
    await new Student({
      userId: user._id,
      firstName: 'Dev',
      lastName: 'Patel',
      email: user.email,
      resumeText: 'Dev Patel React developer',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
      education: [],
      experience: [],
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: [], workMode: 'any' }
    }).save();
    await Promise.all(Array.from({ length: 10 }, (_, index) => createJob(index)));
    mockedAxios.post.mockRejectedValue(Object.assign(new Error('Request failed with status code 429'), {
      response: {
        status: 429,
        headers: {},
        data: { message: 'You are using a Trial key, which is limited to 100 API calls / minute.' }
      }
    }));

    const selection = await JobMatchingRagService.findBulkAutoApplySelection(user._id, {});

    expect(selection.totalMatchedAboveThreshold).toBe(10);
    expect(selection.matches.length).toBeGreaterThan(0);
  });
});
