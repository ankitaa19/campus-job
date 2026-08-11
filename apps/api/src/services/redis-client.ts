import IORedis, { RedisOptions } from 'ioredis';
import { sanitizeForLog } from '../utils/safe-logging';

const extractRedisUrl = (rawValue = ''): string => {
  const raw = rawValue.trim();
  if (!raw) return '';
  if (!raw.startsWith('redis-cli')) return raw;
  const match = raw.match(/\s-u\s+([^\s]+)/);
  const url = match?.[1] || '';
  return raw.includes('--tls') && url.startsWith('redis://')
    ? url.replace(/^redis:\/\//, 'rediss://')
    : url;
};

export const getRedisUrl = (): string => extractRedisUrl(process.env.REDIS_URL || '');

const redisOptions = (clientName: string): RedisOptions => ({
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectionName: clientName
});

export const createRedisConnection = (clientName: string): IORedis => {
  const url = getRedisUrl();
  if (!url) {
    throw new Error('REDIS_URL is required for bulk auto-apply queue processing');
  }
  return new IORedis(url, redisOptions(clientName));
};

export const checkRedisHealth = async (): Promise<void> => {
  const client = createRedisConnection('campuspe-healthcheck');
  try {
    await client.connect();
    const response = await client.ping();
    if (response !== 'PONG') throw new Error(`Unexpected Redis ping response: ${response}`);
    console.log('✅ Redis queue dependency connected');
  } catch (error) {
    console.error('❌ Redis queue dependency failed. Check REDIS_URL and network/TLS settings:', sanitizeForLog(error));
    throw error;
  } finally {
    client.disconnect();
  }
};
