import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import net from 'net';

const BOT_NAME = 'CampusPeJobDiscoveryBot';
const USER_AGENT = process.env.JOB_SOURCE_USER_AGENT
  || `${BOT_NAME}/1.0 (+https://campuspe.com; contact: support@campuspe.com)`;
const MIN_DELAY_MS = Math.max(0, Number(process.env.JOB_SOURCE_MIN_DELAY_MS || 350));
const JITTER_MS = Math.max(0, Number(process.env.JOB_SOURCE_JITTER_MS || 250));
const MAX_RETRIES = Math.min(5, Math.max(0, Number(process.env.JOB_SOURCE_MAX_RETRIES || 2)));
const ROBOTS_CACHE_MS = 24 * 60 * 60 * 1000;

interface RobotsCacheEntry { fetchedAt: number; body?: string; fetchFailed?: boolean; }
interface PublicRequestOptions extends AxiosRequestConfig {
  checkRobots?: boolean;
}

const robotsCache = new Map<string, RobotsCacheEntry>();
const hostQueues = new Map<string, Promise<void>>();
const lastRequestAt = new Map<string, number>();
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const isPrivateHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (!net.isIP(host)) return false;
  if (host === '::1' || host === '0.0.0.0' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
  const octets = host.split('.').map(Number);
  return net.isIPv4(host) && (octets[0] === 10 || octets[0] === 127 || octets[0] === 0
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168));
};

const publicHttpsUrl = (value: string): URL => {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Job sources must use public HTTPS URLs');
  if (url.username || url.password) throw new Error('Authenticated source URLs are not supported');
  if (isPrivateHost(url.hostname)) throw new Error('Private and local network job sources are not supported');
  return url;
};

const waitForHost = async (url: URL): Promise<void> => {
  const key = url.origin;
  const previous = hostQueues.get(key) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(resolve => { release = resolve; });
  hostQueues.set(key, previous.then(() => current));
  await previous;
  const elapsed = Date.now() - (lastRequestAt.get(key) || 0);
  const delay = MIN_DELAY_MS + Math.floor(Math.random() * (JITTER_MS + 1));
  if (elapsed < delay) await sleep(delay - elapsed);
  lastRequestAt.set(key, Date.now());
  release();
};

const robotsAllows = (body: string, target: URL): boolean => {
  const groups: Array<{ agents: string[]; rules: Array<{ allow: boolean; path: string }> }> = [];
  let current: typeof groups[number] | undefined;
  let rulesStarted = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === 'user-agent') {
      if (!current || rulesStarted) {
        current = { agents: [], rules: [] };
        groups.push(current);
        rulesStarted = false;
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === 'allow' || field === 'disallow') && current) {
      rulesStarted = true;
      if (value) current.rules.push({ allow: field === 'allow', path: value.split('*')[0] });
    }
  }
  const named = groups.filter(group => group.agents.some(agent => agent === BOT_NAME.toLowerCase()));
  const applicable = named.length ? named : groups.filter(group => group.agents.includes('*'));
  const matches = applicable.flatMap(group => group.rules).filter(rule => rule.path && target.pathname.startsWith(rule.path));
  if (!matches.length) return true;
  matches.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matches[0].allow;
};

const assertRobotsAllowed = async (target: URL, failClosed = false): Promise<void> => {
  let cached = robotsCache.get(target.origin);
  if (!cached || Date.now() - cached.fetchedAt > ROBOTS_CACHE_MS) {
    try {
      await waitForHost(target);
      const response = await axios.get<string>(`${target.origin}/robots.txt`, {
        timeout: 7000, responseType: 'text', maxRedirects: 2,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' }, validateStatus: status => status >= 200 && status < 500
      });
      cached = { fetchedAt: Date.now(), body: response.status === 200 ? String(response.data || '') : undefined };
    } catch {
      cached = { fetchedAt: Date.now(), fetchFailed: true };
    }
    robotsCache.set(target.origin, cached);
  }
  if (failClosed && cached.fetchFailed) throw new Error(`Unable to verify ${target.origin}/robots.txt; Selenium access was stopped`);
  if (cached.body && !robotsAllows(cached.body, target)) throw new Error(`Crawling disallowed by ${target.origin}/robots.txt`);
};

const retryDelay = (response: AxiosResponse | undefined, attempt: number): number => {
  const retryAfter = response?.headers?.['retry-after'];
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(60_000, seconds * 1000);
  return Math.min(10_000, 500 * (2 ** attempt) + Math.floor(Math.random() * 300));
};

const request = async <T>(method: 'GET' | 'POST', value: string, data: unknown, options: PublicRequestOptions = {}): Promise<AxiosResponse<T>> => {
  const url = publicHttpsUrl(value);
  const { checkRobots = false, ...config } = options;
  if (checkRobots) await assertRobotsAllowed(url);
  for (let attempt = 0; ; attempt += 1) {
    await waitForHost(url);
    try {
      const response = await axios.request<T>({
        ...config, method, url: url.toString(), data, timeout: config.timeout || 30_000,
        maxRedirects: Math.min(Number(config.maxRedirects ?? 4), 5),
        maxContentLength: config.maxContentLength ?? 5 * 1024 * 1024,
        maxBodyLength: config.maxBodyLength ?? 1024 * 1024,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/html;q=0.9, application/xml;q=0.8', ...(config.headers || {}) }
      });
      const finalUrl = (response.request as any)?.res?.responseUrl;
      if (finalUrl) publicHttpsUrl(finalUrl);
      return response;
    } catch (error: any) {
      const status = error?.response?.status;
      const retryable = status === 429 || status >= 500 || !error?.response;
      if (!retryable || attempt >= MAX_RETRIES) throw error;
      await sleep(retryDelay(error?.response, attempt));
    }
  }
};

export const publicSourceHttp = {
  get: <T>(url: string, options?: PublicRequestOptions) => request<T>('GET', url, undefined, options),
  post: <T>(url: string, body: unknown, options?: PublicRequestOptions) => request<T>('POST', url, body, options),
  assertRobotsAllowed: (url: string) => assertRobotsAllowed(publicHttpsUrl(url)),
  assertRobotsAllowedStrict: (url: string) => assertRobotsAllowed(publicHttpsUrl(url), true)
};
