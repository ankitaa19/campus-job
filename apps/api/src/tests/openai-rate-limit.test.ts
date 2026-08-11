import axios from 'axios';
import {
  OpenAIRateLimitError,
  callOpenAIChat,
  checkOpenAIHealth,
  isOpenAIRateLimited,
  resetOpenAIRateLimitState
} from '../services/openai-client';
import AIJobNormalizer from '../services/job-aggregation/ai-job-normalizer';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const rateLimitError = (retryAfter?: string, message = 'Rate limit reached') => Object.assign(new Error(message), {
  response: {
    status: 429,
    statusText: 'Too Many Requests',
    headers: retryAfter ? { 'retry-after': retryAfter } : {},
    data: { error: { message } }
  }
});

const jobDto = (overrides: Record<string, unknown> = {}) => ({
  source: 'company_careers',
  sourceProvider: 'ashby',
  sourceCompanySlug: 'acme',
  sourceExternalId: '5b710ddc',
  title: 'Frontend Engineer',
  companyName: 'Acme',
  description: 'Build React products for campus hiring teams.',
  jobType: 'full-time',
  department: 'Engineering',
  locations: [{ city: 'Bengaluru', state: 'Karnataka', country: 'India', isRemote: false, hybrid: true }],
  workMode: 'hybrid',
  requirements: [],
  requiredSkills: ['react'],
  experienceLevel: 'entry',
  minExperience: 0,
  educationRequirements: [],
  salary: { min: 0, max: 0, currency: 'INR', negotiable: true },
  benefits: [],
  applicationDeadline: new Date(Date.now() + 86400000),
  totalPositions: 1,
  interviewProcess: { rounds: ['Technical'], duration: '1 week', mode: 'online' },
  postedAt: new Date(),
  matchingKeywords: [],
  ...overrides
}) as any;

describe('OpenAI rate limit handling', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENAI_MIN_REQUEST_INTERVAL_MS = '0';
    process.env.AI_JOB_ENRICHMENT_ENABLED = 'true';
    mockedAxios.post.mockReset();
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    // The cooldown is process-wide by design, so reset it between cases.
    resetOpenAIRateLimitState();
    AIJobNormalizer.resetRateLimitState();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MIN_REQUEST_INTERVAL_MS;
    delete process.env.AI_JOB_ENRICHMENT_ENABLED;
  });

  test('health check reports rate limiting as available rather than throwing', async () => {
    mockedAxios.post.mockRejectedValue(rateLimitError('30'));

    await expect(checkOpenAIHealth()).resolves.toBe('rate_limited');
    expect(isOpenAIRateLimited()).toBe(true);
  });

  test('health check still fails for invalid credentials', async () => {
    mockedAxios.post.mockRejectedValue(Object.assign(new Error('Unauthorized'), {
      response: { status: 401, statusText: 'Unauthorized', headers: {}, data: {} }
    }));

    await expect(checkOpenAIHealth()).rejects.toThrow('Unauthorized');
  });

  test('a single 429 stops further OpenAI calls for the cooldown window', async () => {
    mockedAxios.post.mockRejectedValue(rateLimitError('120'));

    await expect(callOpenAIChat({ model: 'gpt-4o-mini' }, {
      serviceName: 'first caller',
      attempts: 1,
      waitForCooldown: false
    })).rejects.toBeInstanceOf(OpenAIRateLimitError);

    const callsAfterFirstFailure = mockedAxios.post.mock.calls.length;
    await expect(callOpenAIChat({ model: 'gpt-4o-mini' }, {
      serviceName: 'second caller',
      attempts: 1,
      waitForCooldown: false
    })).rejects.toBeInstanceOf(OpenAIRateLimitError);

    expect(mockedAxios.post.mock.calls).toHaveLength(callsAfterFirstFailure);
  });

  test('job enrichment keeps provider data and pauses instead of retrying per posting', async () => {
    mockedAxios.post.mockRejectedValue(rateLimitError('60'));
    const job = jobDto();

    const first = await AIJobNormalizer.enrich(job);
    expect(first.requiredSkills).toEqual(['react']);
    expect(AIJobNormalizer.isEnabled()).toBe(false);

    const callsAfterFirstJob = mockedAxios.post.mock.calls.length;
    const second = await AIJobNormalizer.enrich(jobDto({ sourceExternalId: 'e3d8dc06' }));

    expect(second.requiredSkills).toEqual(['react']);
    expect(mockedAxios.post.mock.calls).toHaveLength(callsAfterFirstJob);
  });

  test('retry-after is parsed from the OpenAI error body when no header is present', async () => {
    mockedAxios.post.mockRejectedValue(rateLimitError(undefined, 'Rate limit reached. Please try again in 2s'));

    const failure = await callOpenAIChat({ model: 'gpt-4o-mini' }, {
      serviceName: 'body parsing',
      attempts: 1,
      waitForCooldown: false
    }).catch(error => error);

    expect(failure).toBeInstanceOf(OpenAIRateLimitError);
    expect(failure.retryAfterMs).toBe(2000);
  });
});
