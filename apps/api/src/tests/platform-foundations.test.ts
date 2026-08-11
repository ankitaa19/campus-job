import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';
import {
  Application,
  ConsentRecord,
  Job,
  ProductEvent,
  SourceJobSnapshot,
  Student,
  User
} from '../models';
import ApplicationSubmissionService from '../services/application-submission';
import { inspectApplicationCapability } from '../services/ats/application-capability';
import { enrichJob } from '../services/job-intelligence';
import ProductEventService from '../services/product-events';

jest.mock('axios');

describe('intelligent platform foundations', () => {
  let mongoServer: MongoMemoryServer;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GREENHOUSE_JOB_BOARD_API_KEY = 'test-greenhouse-key';
    delete process.env.ENFORCE_APPLICATION_CONSENT;
    mockedAxios.post.mockReset();
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GREENHOUSE_JOB_BOARD_API_KEY;
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('records client events idempotently for unbiased training datasets', async () => {
    const event = {
      eventId: 'device-event-1',
      name: 'job_impression' as const,
      sessionId: 'session-1',
      rank: 2,
      candidateSetSize: 40,
      modelVersion: 'hybrid-local-v2'
    };
    await ProductEventService.record(event);
    await ProductEventService.record(event);

    expect(await ProductEvent.countDocuments({ eventId: event.eventId })).toBe(1);
    expect(await ProductEvent.findOne({ eventId: event.eventId }).lean()).toMatchObject({
      name: 'job_impression',
      rank: 2,
      candidateSetSize: 40,
      modelVersion: 'hybrid-local-v2'
    });
  });

  test('keeps purpose and policy-version specific consent history', async () => {
    const user = await new User({ email: 'consent@example.com', password: 'password123', role: 'student' }).save();
    await ConsentRecord.create({
      userId: user._id,
      purpose: 'auto_apply',
      policyVersion: '2026-08',
      status: 'granted',
      grantedAt: new Date(),
      collectionMethod: 'web'
    });
    const consent = await ConsentRecord.findOneAndUpdate(
      { userId: user._id, purpose: 'auto_apply', policyVersion: '2026-08' },
      { $set: { status: 'withdrawn', withdrawnAt: new Date() } },
      { new: true }
    );
    expect(consent?.status).toBe('withdrawn');
    expect(await ConsentRecord.countDocuments({ userId: user._id, purpose: 'auto_apply' })).toBe(1);
  });

  test('deduplicates unchanged raw provider snapshots while retaining changed versions', async () => {
    const base = {
      provider: 'greenhouse',
      companySlug: 'acme',
      externalId: 'job-1',
      fetchedAt: new Date(),
      parserVersion: 1,
      rawPayload: { id: 'job-1', title: 'Engineer' },
      normalizationWarnings: []
    };
    await SourceJobSnapshot.create({ ...base, contentHash: 'hash-1' });
    await SourceJobSnapshot.updateOne(
      { provider: 'greenhouse', companySlug: 'acme', externalId: 'job-1', contentHash: 'hash-1' },
      { $setOnInsert: { ...base, contentHash: 'hash-1' } },
      { upsert: true }
    );
    await SourceJobSnapshot.create({ ...base, contentHash: 'hash-2', rawPayload: { id: 'job-1', title: 'Senior Engineer' } });
    expect(await SourceJobSnapshot.countDocuments({ externalId: 'job-1' })).toBe(2);
  });

  test('pauses applications that require an assessment before contacting the ATS', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { choices: [{ message: { content: JSON.stringify({ resumeText: 'Resume', coverLetterText: 'Letter' }) } }] }
    } as any);
    const user = await new User({
      email: 'assessment@example.com',
      password: 'password123',
      role: 'student',
      requireReview: false
    }).save();
    await new Student({
      userId: user._id,
      firstName: 'Asha',
      lastName: 'Rao',
      email: user.email,
      resumeText: 'Asha Rao React developer',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
      education: [],
      experience: [],
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: [], workMode: 'any' }
    }).save();
    const data = {
      title: 'Frontend Engineer',
      description: 'Build React products',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: 'Acme',
      source: 'company_careers',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: 'acme',
      sourceExternalId: 'gh-1',
      atsPlatform: 'greenhouse',
      atsJobId: 'gh-1',
      locations: [{ city: 'Bengaluru', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React'],
      experienceLevel: 'entry',
      minExperience: 0,
      salary: { min: 0, max: 0, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 86400000),
      totalPositions: 1,
      interviewProcess: { rounds: ['Assessment'], duration: '1 week', mode: 'online' },
      applicationConfiguration: {
        requiredFields: ['email'],
        customQuestions: [],
        requiredDocuments: ['resume'],
        requiresAuthentication: false,
        requiresAssessment: true,
        requiresCaptcha: false,
        unsupportedQuestionTypes: []
      },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true
    };
    const job = await new Job({ ...data, ...enrichJob(data) }).save();

    expect(inspectApplicationCapability(job).capability).toBe('needs_you');
    const queued = await ApplicationSubmissionService.createQueuedApplication(user._id, job._id, 0.9);
    const paused = await ApplicationSubmissionService.submitQueuedApplication(queued._id);

    expect(paused?.status).toBe('pending_review');
    expect(paused?.workflowState).toBe('needs_assessment');
    expect(paused?.intervention?.type).toBe('assessment');
    expect(await Application.countDocuments({ userId: user._id, jobId: job._id })).toBe(1);
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(0);
  });
});
