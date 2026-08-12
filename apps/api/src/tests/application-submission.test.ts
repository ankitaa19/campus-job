import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';
import { User, Student, Job, Application } from '../models';
import ApplicationSubmissionService from '../services/application-submission';
import AutoApplyService from '../services/auto-apply';
import { enrichJob } from '../services/job-intelligence';

jest.mock('axios');

describe('ApplicationSubmissionService', () => {
  let mongoServer: MongoMemoryServer;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GREENHOUSE_JOB_BOARD_API_KEY = 'test-greenhouse-key';
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

  test('queues before Greenhouse submission and stores submitted field receipt', async () => {
    mockedAxios.post.mockImplementation(async (url: any) => {
      if (String(url).includes('api.openai.com')) {
        return {
          data: {
            choices: [{ message: { content: JSON.stringify({ resumeText: 'Maya Iyer\nSkills: React\nFrontend Engineer at Product Co.', coverLetterText: 'I am applying for the Frontend Engineer role using my React experience.' }) } }]
          }
        };
      }
      const application = await Application.findOne({ status: 'queued', submittedVia: 'this_portal' });
      expect(application).toBeTruthy();
      expect(application?.externalSubmissionAttempted).toBe(true);
      return { status: 200, statusText: 'OK', data: { id: 'candidate-1' } };
    });
    const user = await new User({ email: 'maya@example.com', password: 'password123', role: 'student' }).save();
    await new Student({
      userId: user._id,
      firstName: 'Maya',
      lastName: 'Iyer',
      email: 'maya@example.com',
      phoneNumber: '+919999999999',
      resumeFile: '/tmp/maya-resume.pdf',
      resumeText: 'Maya Iyer Frontend Engineer React applications Product Co',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
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
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: ['Bangalore'], workMode: 'hybrid' }
    }).save();

    const jobData = {
      title: 'Frontend Engineer',
      description: 'Build React applications.',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: 'Acme',
      source: 'company_careers',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: 'acme',
      sourceExternalId: '123',
      locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React'],
      experienceLevel: 'mid',
      minExperience: 2,
      salary: { min: 1000000, max: 1800000, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalPositions: 1,
      interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true
    };
    const job = await new Job({ ...jobData, ...enrichJob(jobData) }).save();

    const queued = await ApplicationSubmissionService.createQueuedApplication(user._id, job._id, 0.9);
    expect(queued.status).toBe('queued');
    expect(queued.submittedVia).toBe('this_portal');

    const submitted = await ApplicationSubmissionService.submitQueuedApplication(queued._id);
    expect(submitted?.status).toBe('confirmed');
    expect(submitted?.submittedFieldsJson?.submittedVia).toBe('this_portal');
    expect(submitted?.submittedFieldsJson?.resume_text).toContain('React');
    expect(submitted?.submittedFieldsJson?.cover_letter_text).toContain('Frontend Engineer');
    expect(submitted?.atsResponseRaw?.status).toBe(200);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://boards-api.greenhouse.io/v1/boards/acme/jobs/123',
      expect.objectContaining({ first_name: 'Maya', email: 'maya@example.com', resume_text: expect.any(String) }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Basic /) }) })
    );
  });

  test('creates pending review when review is required and submits on approval', async () => {
    mockedAxios.post.mockImplementation(async (url: any) => {
      if (String(url).includes('api.openai.com')) {
        return {
          data: {
            choices: [{ message: { content: JSON.stringify({ resumeText: 'Riya Shah\nSkills: React\nFrontend Engineer at Product Co.', coverLetterText: 'I am applying for the Frontend Engineer role using my React experience.' }) } }]
          }
        };
      }
      return { status: 200, statusText: 'OK', data: { id: 'candidate-2' } };
    });
    const user = await new User({
      email: 'review@example.com',
      password: 'password123',
      role: 'student',
      requireReview: true,
      autoApplyThreshold: 0.5
    }).save();
    await new Student({
      userId: user._id,
      firstName: 'Riya',
      lastName: 'Shah',
      email: 'review@example.com',
      resumeFile: '/tmp/riya-resume.pdf',
      resumeText: 'Riya Shah Frontend Engineer React applications Product Co',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
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
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: ['Bangalore'], workMode: 'hybrid' }
    }).save();
    const jobData = {
      title: 'Frontend Engineer',
      description: 'Build React applications.',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: 'Acme',
      source: 'company_careers',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: 'acme',
      sourceExternalId: '456',
      locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React'],
      experienceLevel: 'mid',
      minExperience: 2,
      salary: { min: 1000000, max: 1800000, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalPositions: 1,
      interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true
    };
    const job = await new Job({ ...jobData, ...enrichJob(jobData) }).save();

    const decision = await AutoApplyService.handleMatchedJob(user._id, job._id, 0.9);
    expect(decision.action).toBe('pending_review');
    expect(decision.application?.status).toBe('pending_review');
    expect(decision.application?.submittedFieldsJson?.coverLetterText).toContain('Frontend Engineer');
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(0);

    const approved = await ApplicationSubmissionService.approveApplication(decision.application!._id, user._id);
    expect(approved?.status).toBe('confirmed');
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(1);
  });

  test('explicit Auto Apply force-submits real adapter jobs without review', async () => {
    mockedAxios.post.mockImplementation(async (url: any) => {
      if (String(url).includes('api.openai.com')) {
        return {
          data: {
            choices: [{ message: { content: JSON.stringify({ resumeText: 'Dev Patel\nSkills: React\nFrontend Engineer at Product Co.', coverLetterText: 'I am applying directly using my React experience.' }) } }]
          }
        };
      }
      return { status: 200, statusText: 'OK', data: { id: 'candidate-force-submit' } };
    });
    const user = await new User({
      email: 'force-submit@example.com',
      password: 'password123',
      role: 'student',
      requireReview: true,
      autoApplyThreshold: 0.5
    }).save();
    await new Student({
      userId: user._id,
      firstName: 'Dev',
      lastName: 'Patel',
      email: 'force-submit@example.com',
      resumeFile: '/tmp/dev-resume.pdf',
      resumeText: 'Dev Patel Frontend Engineer React applications Product Co',
      skills: [{ name: 'React', level: 'advanced', category: 'technical' }],
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
      jobPreferences: { jobTypes: ['full-time'], preferredLocations: ['Bangalore'], workMode: 'hybrid' }
    }).save();
    const jobData = {
      title: 'Frontend Engineer',
      description: 'Build React applications.',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: 'Acme',
      source: 'company_careers',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: 'acme',
      sourceExternalId: '789',
      locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React'],
      experienceLevel: 'mid',
      minExperience: 2,
      salary: { min: 1000000, max: 1800000, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalPositions: 1,
      interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true
    };
    const job = await new Job({ ...jobData, ...enrichJob(jobData) }).save();

    const decision = await AutoApplyService.handleMatchedJob(user._id, job._id, 0.9, { forceSubmit: true });
    expect(decision.action).toBe('submitted');
    expect(decision.application?.status).toBe('confirmed');
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(1);
  });
});
