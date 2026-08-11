import axios from 'axios';
import { sanitizeForLog } from '../utils/safe-logging';

export const COHERE_EMBEDDING_DIMENSIONS = 1024;
export type CohereEmbeddingInputType = 'search_document' | 'search_query';

export const requireCohereKey = (serviceName: string): string => {
  const key = process.env.COHERE_API_KEY?.trim();
  if (!key) {
    throw new Error(`COHERE_API_KEY is required for ${serviceName}`);
  }
  return key;
};

const cohereHeaders = (serviceName: string) => ({
  Authorization: `Bearer ${requireCohereKey(serviceName)}`,
  'Content-Type': 'application/json'
});

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error: any): boolean => {
  const status = Number(error?.response?.status || 0);
  return [408, 429, 500, 502, 503, 504].includes(status) || ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED'].includes(String(error?.code || ''));
};

export const generateCohereEmbedding = async (
  input: string,
  inputType: CohereEmbeddingInputType,
  serviceName = 'job matching embeddings'
): Promise<number[]> => {
  const text = input.replace(/\s+/g, ' ').trim().slice(0, 12000);
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await axios.post('https://api.cohere.com/v1/embed', {
        model: process.env.COHERE_EMBEDDING_MODEL || 'embed-english-v3.0',
        texts: [text || ' '],
        input_type: inputType,
        truncate: 'END'
      }, {
        timeout: 30000,
        headers: cohereHeaders(serviceName)
      });
      const embedding = response.data?.embeddings?.[0];
      if (!Array.isArray(embedding) || embedding.length !== COHERE_EMBEDDING_DIMENSIONS) {
        throw new Error(`Cohere embedding service returned an invalid vector for ${serviceName}`);
      }
      return embedding.map((value: unknown) => Number(value));
    } catch (error) {
      lastError = error;
      if (attempt >= 3 || !shouldRetry(error)) break;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }

  console.error('❌ Cohere embedding request failed:', sanitizeForLog(lastError));
  throw lastError instanceof Error ? lastError : new Error('Cohere embedding request failed');
};

export const checkCohereHealth = async (): Promise<void> => {
  try {
    const startedAt = Date.now();
    const vector = await generateCohereEmbedding('CampusPe dependency health check', 'search_document', 'Cohere embedding health check');
    if (vector.length !== COHERE_EMBEDDING_DIMENSIONS) throw new Error(`Unexpected embedding dimensions: ${vector.length}`);
    console.log(`✅ Cohere embedding dependency connected (${Date.now() - startedAt}ms)`);
  } catch (error) {
    console.error('❌ Cohere embedding dependency failed. Check COHERE_API_KEY and model access:', sanitizeForLog(error));
    throw error;
  }
};
