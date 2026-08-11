import axios from 'axios';
import {
  CohereRateLimitError,
  checkCohereHealth,
  generateCohereEmbedding,
  isCohereRateLimited,
  resetCohereRateLimitState
} from '../services/cohere-client';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const trialLimitError = () => Object.assign(new Error('Request failed with status code 429'), {
  response: {
    status: 429,
    statusText: 'Too Many Requests',
    headers: {},
    data: {
      id: 'e35cd607',
      message: 'You are using a Trial key, which is limited to 100 API calls / minute.'
    }
  }
});

describe('Cohere rate limit handling', () => {
  beforeEach(() => {
    process.env.COHERE_API_KEY = 'test-cohere-key';
    process.env.COHERE_MIN_REQUEST_INTERVAL_MS = '0';
    mockedAxios.post.mockReset();
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    resetCohereRateLimitState();
  });

  afterEach(() => {
    delete process.env.COHERE_API_KEY;
    delete process.env.COHERE_MIN_REQUEST_INTERVAL_MS;
  });

  test('health check reports a throttled trial key as available', async () => {
    mockedAxios.post.mockRejectedValue(trialLimitError());

    await expect(checkCohereHealth()).resolves.toBe('rate_limited');
    expect(isCohereRateLimited()).toBe(true);
  });

  test('health check still fails when the key is invalid', async () => {
    mockedAxios.post.mockRejectedValue(Object.assign(new Error('Unauthorized'), {
      response: { status: 401, statusText: 'Unauthorized', headers: {}, data: {} }
    }));

    await expect(checkCohereHealth()).rejects.toThrow('Unauthorized');
  });

  test('embedding calls stop hitting the API while the cooldown is active', async () => {
    mockedAxios.post.mockRejectedValue(trialLimitError());

    await expect(generateCohereEmbedding('first', 'search_document', { attempts: 1 }))
      .rejects.toBeInstanceOf(CohereRateLimitError);
    const callsAfterFirstFailure = mockedAxios.post.mock.calls.length;

    await expect(generateCohereEmbedding('second', 'search_document', { attempts: 1 }))
      .rejects.toBeInstanceOf(CohereRateLimitError);

    expect(mockedAxios.post.mock.calls).toHaveLength(callsAfterFirstFailure);
  });

  test('successful embeddings are returned unchanged', async () => {
    mockedAxios.post.mockResolvedValue({ data: { embeddings: [Array(1024).fill(0.02)] } } as any);

    const vector = await generateCohereEmbedding('resume text', 'search_query');

    expect(vector).toHaveLength(1024);
    expect(vector[0]).toBeCloseTo(0.02);
  });
});
