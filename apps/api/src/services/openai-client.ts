import axios from 'axios';
import { sanitizeForLog } from '../utils/safe-logging';

export const requireOpenAIKey = (serviceName: string): string => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(`OPENAI_API_KEY is required for ${serviceName}`);
  }
  return key;
};

export const openAIHeaders = (serviceName: string) => ({
  Authorization: `Bearer ${requireOpenAIKey(serviceName)}`,
  'Content-Type': 'application/json'
});

export const OPENAI_EMBEDDING_DIMENSIONS = 1536;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error: any): boolean => {
  const status = Number(error?.response?.status || 0);
  return [408, 500, 502, 503, 504].includes(status) || ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED'].includes(String(error?.code || ''));
};

export const isOpenAIRateLimitError = (error: unknown): boolean =>
  Number((error as any)?.response?.status || 0) === 429;

export const generateOpenAIEmbedding = async (
  input: string,
  serviceName = 'job matching embeddings'
): Promise<number[]> => {
  const text = input.replace(/\s+/g, ' ').trim().slice(0, 12000);
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await axios.post('https://api.openai.com/v1/embeddings', {
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text || ' '
      }, {
        timeout: 30000,
        headers: openAIHeaders(serviceName)
      });
      const embedding = response.data?.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length !== OPENAI_EMBEDDING_DIMENSIONS) {
        throw new Error(`OpenAI embedding service returned an invalid vector for ${serviceName}`);
      }
      return embedding.map((value: unknown) => Number(value));
    } catch (error) {
      lastError = error;
      if (attempt >= 3 || !shouldRetry(error)) break;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }

  console.error('❌ OpenAI embedding request failed:', sanitizeForLog(lastError));
  throw lastError instanceof Error ? lastError : new Error('OpenAI embedding request failed');
};

export const checkOpenAIHealth = async (): Promise<void> => {
  try {
    await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_APPLICATION_TAILORING_MODEL || process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }]
    }, {
      timeout: 15000,
      headers: openAIHeaders('OpenAI chat health check')
    });
    console.log('✅ OpenAI dependency connected for LLM features');
  } catch (error) {
    console.error('❌ OpenAI dependency failed. Check OPENAI_API_KEY and model access:', sanitizeForLog(error));
    throw error;
  }
};

export const checkOpenAIEmbeddingHealth = async (): Promise<void> => {
  try {
    const startedAt = Date.now();
    const vector = await generateOpenAIEmbedding('CampusPe dependency health check', 'OpenAI embedding health check');
    if (vector.length !== OPENAI_EMBEDDING_DIMENSIONS) throw new Error(`Unexpected embedding dimensions: ${vector.length}`);
    console.log(`✅ OpenAI embedding dependency connected (${Date.now() - startedAt}ms)`);
  } catch (error) {
    console.error('❌ OpenAI embedding dependency failed. Check OPENAI_API_KEY and embedding model access:', sanitizeForLog(error));
    throw error;
  }
};
