import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';
import { User, Student, Job } from '../models';
import { JobMatch } from '../models/JobMatch';
import JobMatchingRagService from '../services/job-matching-rag';
import { enrichJob } from '../services/job-intelligence';

jest.mock('axios');

describe('JobMatchingRagService', () => {
  let mongoServer: MongoMemoryServer;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    process.env.COHERE_API_KEY = 'test-cohere-key';
    mockedAxios.post.mockReset();
    mockedAxios.post.mockResolvedValue({ data: { embeddings: [Array(1024).fill(0.01)] } });
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    delete process.env.COHERE_API_KEY;
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const jobFixture = (overrides: any = {}) => {
    const base = {
      title: 'Frontend Engineer',
      description: 'Build React and TypeScript web applications.',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: 'Product Co',
      locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React', 'TypeScript'],
      experienceLevel: 'mid',
      minExperience: 2,
      salary: { min: 1000000, max: 1800000, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalPositions: 2,
      interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true
    };
    return { ...base, ...overrides };
  };

  test('returns filtered ranked matches and persists job_matches rows', async () => {
    const user = await new User({ email: 'student@example.com', password: 'password123', role: 'student' }).save();
    await new Student({
      userId: user._id,
      firstName: 'Maya',
      lastName: 'Iyer',
      skills: [
        { name: 'React', level: 'advanced', category: 'technical' },
        { name: 'TypeScript', level: 'advanced', category: 'technical' }
      ],
      experience: [{
        title: 'Frontend Engineer',
        company: 'Product Co',
        location: 'Bangalore',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2024-01-01'),
        description: 'Built React applications',
        isCurrentJob: false
      }],
      education: [],
      jobPreferences: {
        jobTypes: ['full-time'],
        preferredLocations: ['Bangalore'],
        preferredRoles: ['Frontend Engineer'],
        workMode: 'hybrid'
      }
    }).save();

    const matchingJobData = jobFixture();
    const filteredJobData = jobFixture({
      title: 'Backend Engineer',
      description: 'Build Python services.',
      requiredSkills: ['Python'],
      requirements: [{ skill: 'Python', level: 'intermediate', mandatory: true, category: 'technical' }]
    });

    const matchingJob = await new Job({ ...matchingJobData, ...enrichJob(matchingJobData) }).save();
    await new Job({ ...filteredJobData, ...enrichJob(filteredJobData) }).save();

    const matches = await JobMatchingRagService.getMatches(user._id, 10);
    const persisted = await JobMatch.find({ userId: user._id }).lean();

    expect(matches).toHaveLength(1);
    expect(matches[0].job._id.toString()).toBe(matchingJob._id.toString());
    expect(matches[0].score).toBeGreaterThan(0);
    expect(matches[0].matchedSkills).toEqual(expect.arrayContaining(['react', 'typescript']));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].jobId.toString()).toBe(matchingJob._id.toString());
  });
});
