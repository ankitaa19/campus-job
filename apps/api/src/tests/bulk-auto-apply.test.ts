import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';
import { Application, BulkAutoApplyRun, BulkAutoApplyTask, Job, Student, User } from '../models';
import BulkAutoApplyService from '../services/bulk-auto-apply';
import { enrichJob } from '../services/job-intelligence';
import JobMatchingRagService from '../services/job-matching-rag';

jest.mock('axios');

describe('BulkAutoApplyService', () => {
  let mongoServer: MongoMemoryServer;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GREENHOUSE_JOB_BOARD_API_KEY = 'test-greenhouse-key';
    process.env.COHERE_API_KEY = 'test-cohere-key';
    mockedAxios.post.mockReset();
    mockedAxios.post.mockImplementation(async (url: any) => {
      if (String(url).includes('api.cohere.com/v1/embed')) {
        return { data: { embeddings: [Array(1024).fill(0.01)] } };
      }
      if (String(url).includes('api.openai.com/v1/chat/completions')) {
        return {
          data: {
            choices: [{ message: { content: JSON.stringify({ resumeText: 'Maya Iyer\nSkills: React\nFrontend Engineer at Product Co.', coverLetterText: 'I am applying for the Frontend Engineer role using my React experience.' }) } }]
          }
        };
      }
      return { status: 200, statusText: 'OK', data: { id: 'candidate-1' } };
    });
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GREENHOUSE_JOB_BOARD_API_KEY;
    delete process.env.COHERE_API_KEY;
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const createUserAndStudent = async (email: string) => {
    const user = await new User({
      email,
      password: 'password123',
      role: 'student',
      requireReview: false,
      autoApplyThreshold: 0
    }).save();
    await new Student({
      userId: user._id,
      firstName: 'Maya',
      lastName: 'Iyer',
      email,
      resumeFile: '/tmp/resume.pdf',
      resumeText: 'Maya Iyer React TypeScript Frontend Engineer',
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
    return user;
  };

  const createJob = async (overrides: Record<string, unknown>) => {
    const jobData = {
      title: 'Frontend Engineer',
      description: 'Build React applications.',
      jobType: 'full-time',
      department: 'Engineering',
      companyName: 'Acme',
      locations: [{ city: 'Bangalore', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
      workMode: 'hybrid',
      requirements: [],
      requiredSkills: ['React'],
      experienceLevel: 'mid',
      minExperience: 1,
      salary: { min: 1000000, max: 1800000, currency: 'INR', negotiable: true },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalPositions: 1,
      interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
      status: 'active',
      isPublic: true,
      allowDirectApplications: true,
      ...overrides
    };
    return new Job({ ...jobData, ...enrichJob(jobData) }).save();
  };

  const createRunAndTask = async (user: any, job: any, score = 0.9) => {
    const run = await new BulkAutoApplyRun({
      userId: user._id,
      status: 'pending',
      filters: {},
      totalJobs: 1,
      failureReasons: {}
    }).save();
    const task = await new BulkAutoApplyTask({
      runId: run._id,
      userId: user._id,
      jobId: job._id,
      status: 'pending',
      atsPlatform: job.atsPlatform || job.sourceProvider || 'other',
      score
    }).save();
    return { run, task };
  };

  const createRunAndTasks = async (user: any, jobs: any[], score = 0.9) => {
    const run = await new BulkAutoApplyRun({
      userId: user._id,
      status: 'pending',
      filters: {},
      totalJobs: jobs.length,
      failureReasons: {}
    }).save();
    const tasks = await BulkAutoApplyTask.insertMany(jobs.map(job => ({
      runId: run._id,
      userId: user._id,
      jobId: job._id,
      status: 'pending',
      atsPlatform: job.atsPlatform || job.sourceProvider || 'other',
      score
    })));
    return { run, tasks };
  };

  const processTask = async (run: any, task: any, user: any, jobId = task.jobId) => {
    await BulkAutoApplyService.processTaskJob({
      runId: String(run._id),
      taskId: String(task._id),
      userId: String(user._id),
      jobId: String(jobId)
    });
  };

  test('unsupported ATS jobs are marked failed, not submitted', async () => {
    const user = await createUserAndStudent('unsupported@example.com');
    const job = await createJob({ atsPlatform: 'other', sourceProvider: 'other' });
    const { run, task } = await createRunAndTask(user, job);

    await processTask(run, task, user, job._id);

    const application = await Application.findOne({ userId: user._id });
    expect(application?.status).toBe('failed');
    expect(application?.failureReason).toBe('unsupported_ats');
    expect(application?.submittedVia).toBe('this_portal');
    const completedRun = await BulkAutoApplyRun.findById(run._id);
    expect(completedRun?.failedCount).toBe(1);
    expect(completedRun?.unsupportedAtsCount).toBe(1);
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(0);
  });

  test('bulk selection only returns auto-apply capable jobs and counts needs-you jobs separately', async () => {
    const user = await createUserAndStudent('selection@example.com');
    await Promise.all([
      createJob({
        title: 'Greenhouse Role',
        atsPlatform: 'greenhouse',
        sourceProvider: 'greenhouse',
        sourceCompanySlug: 'acme',
        atsJobId: 'gh-1'
      }),
      createJob({ title: 'Workday Role', atsPlatform: 'workday', sourceProvider: 'workday' }),
      createJob({ title: 'Other Role', atsPlatform: 'other', sourceProvider: 'other' })
    ]);

    const selection = await JobMatchingRagService.findBulkAutoApplySelection(user._id, {});

    expect(selection.matches).toHaveLength(1);
    expect(selection.matches[0].job.atsPlatform).toBe('greenhouse');
    expect(selection.needsYouCount).toBe(1);
    expect(selection.unsupportedCount).toBe(1);
    expect(selection.totalMatchedAboveThreshold).toBe(3);
  });

  test('bulk Greenhouse path creates queued Application before ATS call', async () => {
    const user = await createUserAndStudent('bulk-greenhouse@example.com');
    const job = await createJob({
      atsPlatform: 'greenhouse',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: 'acme',
      atsJobId: 'job-123'
    });
    mockedAxios.post.mockImplementation(async (url: any) => {
      if (String(url).includes('api.cohere.com/v1/embed')) {
        return { data: { embeddings: [Array(1024).fill(0.01)] } };
      }
      if (String(url).includes('api.openai.com/v1/chat/completions')) {
        return {
          data: {
            choices: [{ message: { content: JSON.stringify({ resumeText: 'Maya Iyer\nSkills: React\nFrontend Engineer at Product Co.', coverLetterText: 'I am applying for the Frontend Engineer role using my React experience.' }) } }]
          }
        };
      }
      const queued = await Application.findOne({ userId: user._id, submittedVia: 'this_portal' });
      expect(queued).toBeTruthy();
      expect(queued?.status).toBe('queued');
      return { status: 200, statusText: 'OK', data: { id: 'candidate-1' } };
    });
    const { run, task } = await createRunAndTask(user, job);

    await processTask(run, task, user, job._id);

    const application = await Application.findOne({ userId: user._id });
    expect(application?.status).toBe('confirmed');
    expect(application?.atsResponseRaw?.status).toBe(200);
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(1);
    const completedTask = await BulkAutoApplyTask.findOne({ runId: run._id });
    expect(completedTask?.status).toBe('succeeded');
  });

  test('remaining needs-you tasks can be processed after a simulated worker restart and counters stay accurate', async () => {
    const user = await createUserAndStudent('restart@example.com');
    const jobs = await Promise.all(Array.from({ length: 5 }, (_, index) => createJob({
      title: `Frontend Engineer ${index}`,
      atsPlatform: 'workday',
      sourceProvider: 'workday',
      applicationConfiguration: {
        requiredFields: ['email'],
        customQuestions: [],
        requiredDocuments: ['resume'],
        requiresAuthentication: true,
        requiresAssessment: false,
        requiresCaptcha: false,
        unsupportedQuestionTypes: []
      }
    })));
    const { run, tasks } = await createRunAndTasks(user, jobs);

    await Promise.all(tasks.slice(0, 2).map(task => processTask(run, task, user)));
    const partiallyProcessedRun = await BulkAutoApplyRun.findById(run._id);
    expect(partiallyProcessedRun?.processedCount).toBe(2);
    expect(partiallyProcessedRun?.status).toBe('running');

    await Promise.all(tasks.slice(2).map(task => processTask(run, task, user)));

    const completedRun = await BulkAutoApplyRun.findById(run._id);
    expect(completedRun?.status).toBe('completed');
    expect(completedRun?.processedCount).toBe(5);
    expect(completedRun?.pendingReviewCount).toBe(5);
    expect(completedRun?.failedCount).toBe(0);
    expect(completedRun?.unsupportedAtsCount).toBe(0);
    expect(await BulkAutoApplyTask.countDocuments({ runId: run._id, status: 'pending_review' })).toBe(5);
  });

  test('processing the same task twice does not create duplicate Applications or double-count the run', async () => {
    const user = await createUserAndStudent('idempotent@example.com');
    const job = await createJob({
      atsPlatform: 'greenhouse',
      sourceProvider: 'greenhouse',
      sourceCompanySlug: 'acme',
      atsJobId: 'job-idempotent'
    });
    const { run, task } = await createRunAndTask(user, job);

    await processTask(run, task, user, job._id);
    await processTask(run, task, user, job._id);

    expect(await Application.countDocuments({ userId: user._id, jobId: job._id })).toBe(1);
    const completedRun = await BulkAutoApplyRun.findById(run._id);
    expect(completedRun?.processedCount).toBe(1);
    expect(completedRun?.succeededCount).toBe(1);
    expect(completedRun?.status).toBe('completed');
    expect(mockedAxios.post.mock.calls.filter(call => String(call[0]).includes('boards-api.greenhouse.io'))).toHaveLength(1);
  });

  test('cancelling a run skips pending tasks but leaves running tasks alone', async () => {
    const user = await createUserAndStudent('cancel@example.com');
    const jobs = await Promise.all([
      createJob({ title: 'Pending Job A', atsPlatform: 'workday' }),
      createJob({ title: 'Running Job B', atsPlatform: 'workday' }),
      createJob({ title: 'Pending Job C', atsPlatform: 'workday' })
    ]);
    const { run, tasks } = await createRunAndTasks(user, jobs);
    await BulkAutoApplyTask.findByIdAndUpdate(tasks[1]._id, {
      $set: { status: 'running', startedAt: new Date() }
    });

    const cancelledRun = await BulkAutoApplyService.cancelRun(run._id, user._id);

    expect(cancelledRun?.status).toBe('cancelled');
    expect(cancelledRun?.processedCount).toBe(2);
    expect(cancelledRun?.skippedCount).toBe(2);
    expect(cancelledRun?.failureReasons?.cancelled).toBe(2);
    expect(await BulkAutoApplyTask.countDocuments({ runId: run._id, status: 'skipped', failureReason: 'cancelled' })).toBe(2);
    const runningTask = await BulkAutoApplyTask.findById(tasks[1]._id);
    expect(runningTask?.status).toBe('running');
  });
});
