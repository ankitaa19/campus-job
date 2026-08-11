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

export class OpenAIRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'OpenAIRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export type OpenAIDependencyStatus = 'ok' | 'rate_limited';

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60_000;
const MAX_RATE_LIMIT_COOLDOWN_MS = 15 * 60_000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * OpenAI enforces per-key limits, so every caller in this process shares one
 * cooldown. Without it, each concurrent sync worker keeps sending requests that
 * are already guaranteed to be rejected, which both extends the throttling and
 * floods the logs.
 */
let rateLimitedUntil = 0;
let lastRequestAt = 0;
let activeRequests = 0;
const waiters: Array<() => void> = [];

const statusOf = (error: any): number => Number(error?.response?.status || 0);

const retryAfterMsFrom = (error: any): number => {
  const header = error?.response?.headers?.['retry-after'] ?? error?.response?.headers?.['Retry-After'];
  const headerSeconds = Number(header);
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
    return Math.min(headerSeconds * 1000, MAX_RATE_LIMIT_COOLDOWN_MS);
  }
  // OpenAI also reports the wait inside the error body, e.g. "try again in 1.5s".
  const message = String(error?.response?.data?.error?.message || error?.message || '');
  const inlineMatch = message.match(/try again in ([\d.]+)\s*(ms|s|m)/i);
  if (inlineMatch) {
    const value = Number(inlineMatch[1]);
    const unit = inlineMatch[2].toLowerCase();
    const multiplier = unit === 'ms' ? 1 : unit === 'm' ? 60_000 : 1000;
    if (Number.isFinite(value) && value > 0) {
      return Math.min(value * multiplier, MAX_RATE_LIMIT_COOLDOWN_MS);
    }
  }
  return DEFAULT_RATE_LIMIT_COOLDOWN_MS;
};

const maxConcurrency = (): number => Math.max(1, Math.min(8, Number(process.env.OPENAI_MAX_CONCURRENCY || 2)));
const minRequestIntervalMs = (): number => Math.max(0, Number(process.env.OPENAI_MIN_REQUEST_INTERVAL_MS || 250));

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

export const openAIRateLimitCooldownMs = (): number => Math.max(0, rateLimitedUntil - Date.now());
export const isOpenAIRateLimited = (): boolean => openAIRateLimitCooldownMs() > 0;

/** Clears the shared cooldown, e.g. after rotating to a key with fresh quota. */
export const resetOpenAIRateLimitState = (): void => {
  rateLimitedUntil = 0;
  lastRequestAt = 0;
};

export interface OpenAIChatOptions {
  serviceName: string;
  timeout?: number;
  attempts?: number;
  /** When false, a request during an active cooldown fails fast instead of waiting. */
  waitForCooldown?: boolean;
  maxCooldownWaitMs?: number;
}

/**
 * Single entry point for chat completions so rate limiting, retries, and the
 * shared cooldown behave identically for every feature.
 */
export const callOpenAIChat = async <T = any>(payload: Record<string, unknown>, options: OpenAIChatOptions): Promise<T> => {
  const {
    serviceName,
    timeout = 30_000,
    attempts = 3,
    waitForCooldown = true,
    maxCooldownWaitMs = 10_000
  } = options;
  const headers = openAIHeaders(serviceName);
  let lastRateLimitError: OpenAIRateLimitError | undefined;

  for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
    const cooldown = openAIRateLimitCooldownMs();
    if (cooldown > 0) {
      if (!waitForCooldown || cooldown > maxCooldownWaitMs) {
        throw new OpenAIRateLimitError(
          `OpenAI is rate limited for ${serviceName}; retry in ${Math.ceil(cooldown / 1000)}s`,
          cooldown
        );
      }
      await sleep(cooldown);
    }

    await acquireSlot();
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { timeout, headers });
      return response.data as T;
    } catch (error) {
      const status = statusOf(error);
      if (status === 429) {
        const retryAfterMs = retryAfterMsFrom(error);
        rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + retryAfterMs);
        lastRateLimitError = new OpenAIRateLimitError(
          `OpenAI rate limited ${serviceName}; retry in ${Math.ceil(retryAfterMs / 1000)}s`,
          retryAfterMs
        );
        if (attempt >= attempts) throw lastRateLimitError;
        continue;
      }
      if ([408, 500, 502, 503, 504].includes(status) && attempt < attempts) {
        await sleep(1000 * Math.pow(2, attempt - 1));
        continue;
      }
      throw error;
    } finally {
      releaseSlot();
    }
  }

  throw lastRateLimitError || new Error(`OpenAI request failed for ${serviceName}`);
};

/**
 * Reports reachability of the OpenAI dependency. A 429 means the credential is
 * valid and the service is reachable, so it is surfaced as a degraded state
 * rather than an outage; only auth/model/network faults are failures.
 */
export const checkOpenAIHealth = async (): Promise<OpenAIDependencyStatus> => {
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
    return 'ok';
  } catch (error) {
    if (statusOf(error) === 429) {
      const retryAfterMs = retryAfterMsFrom(error);
      rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + retryAfterMs);
      console.warn(`⚠️  OpenAI is rate limited (retry in ${Math.ceil(retryAfterMs / 1000)}s). Credentials are valid; LLM features will retry automatically.`);
      return 'rate_limited';
    }
    console.error('❌ OpenAI dependency failed. Check OPENAI_API_KEY and model access:', sanitizeForLog(error));
    throw error;
  }
};
