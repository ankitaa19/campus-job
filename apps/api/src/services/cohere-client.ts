import axios from 'axios';
import { sanitizeForLog } from '../utils/safe-logging';

export const COHERE_EMBEDDING_DIMENSIONS = 1024;
export type CohereEmbeddingInputType = 'search_document' | 'search_query';
export type CohereDependencyStatus = 'ok' | 'rate_limited';

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

export class CohereRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'CohereRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60_000;
const MAX_RATE_LIMIT_COOLDOWN_MS = 15 * 60_000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Cohere limits are per key, so the cooldown is shared across every caller in
 * this process. Trial keys allow only 100 calls/minute, which a single bulk
 * request can exhaust in one burst.
 */
let rateLimitedUntil = 0;
let lastRequestAt = 0;
let activeRequests = 0;
let lastRateLimitLogAt = 0;
let suppressedRateLimitLogs = 0;
const waiters: Array<() => void> = [];

const statusOf = (error: any): number => Number(error?.response?.status || 0);

const retryAfterMsFrom = (error: any): number => {
  const header = error?.response?.headers?.['retry-after'] ?? error?.response?.headers?.['Retry-After'];
  const headerSeconds = Number(header);
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
    return Math.min(headerSeconds * 1000, MAX_RATE_LIMIT_COOLDOWN_MS);
  }
  // Trial keys are limited per minute, so wait out the current window.
  const message = String(error?.response?.data?.message || error?.message || '');
  if (/per minute|\/ minute|calls \/ minute/i.test(message)) return DEFAULT_RATE_LIMIT_COOLDOWN_MS;
  return DEFAULT_RATE_LIMIT_COOLDOWN_MS;
};

const maxConcurrency = (): number => Math.max(1, Math.min(16, Number(process.env.COHERE_MAX_CONCURRENCY || 4)));
const minRequestIntervalMs = (): number => Math.max(0, Number(process.env.COHERE_MIN_REQUEST_INTERVAL_MS || 150));

const acquireSlot = async (): Promise<void> => {
  if (activeRequests >= maxConcurrency()) {
    await new Promise<void>(resolve => waiters.push(resolve));
  }
  activeRequests += 1;
  const spacing = minRequestIntervalMs();
  const sinceLastRequest = Date.now() - lastRequestAt;
  if (spacing && sinceLastRequest < spacing) await sleep(spacing - sinceLastRequest);
  lastRequestAt = Date.now();
};

const releaseSlot = (): void => {
  activeRequests = Math.max(0, activeRequests - 1);
  waiters.shift()?.();
};

export const cohereRateLimitCooldownMs = (): number => Math.max(0, rateLimitedUntil - Date.now());
export const isCohereRateLimited = (): boolean => cohereRateLimitCooldownMs() > 0;

/** Clears the shared cooldown, e.g. after upgrading from a trial key. */
export const resetCohereRateLimitState = (): void => {
  rateLimitedUntil = 0;
  lastRequestAt = 0;
  lastRateLimitLogAt = 0;
  suppressedRateLimitLogs = 0;
};

const reportRateLimit = (retryAfterMs: number): void => {
  suppressedRateLimitLogs += 1;
  if (Date.now() - lastRateLimitLogAt < 60_000) return;
  console.warn(`⚠️  Cohere rate limit reached; embeddings paused for ${Math.ceil(retryAfterMs / 1000)}s (${suppressedRateLimitLogs} request(s) fell back to skill-only scoring).`);
  lastRateLimitLogAt = Date.now();
  suppressedRateLimitLogs = 0;
};

export interface CohereEmbeddingOptions {
  serviceName?: string;
  /** When false, a request during an active cooldown fails fast instead of waiting. */
  waitForCooldown?: boolean;
  maxCooldownWaitMs?: number;
  attempts?: number;
}

export const generateCohereEmbedding = async (
  input: string,
  inputType: CohereEmbeddingInputType,
  serviceNameOrOptions: string | CohereEmbeddingOptions = 'job matching embeddings'
): Promise<number[]> => {
  const options: CohereEmbeddingOptions = typeof serviceNameOrOptions === 'string'
    ? { serviceName: serviceNameOrOptions }
    : serviceNameOrOptions;
  const {
    serviceName = 'job matching embeddings',
    waitForCooldown = false,
    maxCooldownWaitMs = 5_000,
    attempts = 3
  } = options;
  const text = input.replace(/\s+/g, ' ').trim().slice(0, 12000);
  let lastError: unknown;

  for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
    const cooldown = cohereRateLimitCooldownMs();
    if (cooldown > 0) {
      if (!waitForCooldown || cooldown > maxCooldownWaitMs) {
        const error = new CohereRateLimitError(
          `Cohere is rate limited for ${serviceName}; retry in ${Math.ceil(cooldown / 1000)}s`,
          cooldown
        );
        reportRateLimit(cooldown);
        throw error;
      }
      await sleep(cooldown);
    }

    await acquireSlot();
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
      if (statusOf(error) === 429) {
        const retryAfterMs = retryAfterMsFrom(error);
        rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + retryAfterMs);
        const rateLimitError = new CohereRateLimitError(
          `Cohere rate limited ${serviceName}; retry in ${Math.ceil(retryAfterMs / 1000)}s`,
          retryAfterMs
        );
        reportRateLimit(retryAfterMs);
        if (attempt >= attempts || !waitForCooldown) throw rateLimitError;
        lastError = rateLimitError;
        continue;
      }
      if (attempt >= attempts || ![408, 500, 502, 503, 504].includes(statusOf(error))) break;
      await sleep(1000 * Math.pow(2, attempt - 1));
    } finally {
      releaseSlot();
    }
  }

  console.error('❌ Cohere embedding request failed:', sanitizeForLog(lastError));
  throw lastError instanceof Error ? lastError : new Error('Cohere embedding request failed');
};

/**
 * Reports reachability of the Cohere dependency. A 429 means the credential is
 * valid and the service is reachable, so it is surfaced as a degraded state
 * rather than an outage.
 */
export const checkCohereHealth = async (): Promise<CohereDependencyStatus> => {
  try {
    const startedAt = Date.now();
    const vector = await generateCohereEmbedding('CampusPe dependency health check', 'search_document', {
      serviceName: 'Cohere embedding health check',
      attempts: 1
    });
    if (vector.length !== COHERE_EMBEDDING_DIMENSIONS) throw new Error(`Unexpected embedding dimensions: ${vector.length}`);
    console.log(`✅ Cohere embedding dependency connected (${Date.now() - startedAt}ms)`);
    return 'ok';
  } catch (error) {
    if (error instanceof CohereRateLimitError || statusOf(error) === 429) {
      const retryAfterMs = error instanceof CohereRateLimitError ? error.retryAfterMs : retryAfterMsFrom(error);
      rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + retryAfterMs);
      console.warn(`⚠️  Cohere is rate limited (retry in ${Math.ceil(retryAfterMs / 1000)}s). Credentials are valid; matching falls back to skill-only scoring.`);
      return 'rate_limited';
    }
    console.error('❌ Cohere embedding dependency failed. Check COHERE_API_KEY and model access:', sanitizeForLog(error));
    throw error;
  }
};
