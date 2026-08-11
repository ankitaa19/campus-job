const SECRET_KEY_PATTERN = /authorization|api[-_]?key|token|secret|password|credential|cookie|redis_url|openai_api_key/i;

const redactString = (value: string): string => value
  .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
  .replace(/Basic\s+[A-Za-z0-9+/=_-]+/gi, 'Basic [REDACTED]')
  .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[REDACTED]')
  .replace(/(redis|rediss):\/\/([^:\s]+):([^@\s]+)@/gi, '$1://$2:[REDACTED]@');

export const sanitizeForLog = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) {
    const error = value as Error & Record<string, any>;
    return {
      name: error.name,
      message: redactString(error.message),
      stack: error.stack ? redactString(error.stack) : undefined,
      code: error.code,
      status: error.status,
      response: error.response ? sanitizeForLog({
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      }, seen) : undefined,
      config: error.config ? sanitizeForLog({
        method: error.config.method,
        url: error.config.url,
        timeout: error.config.timeout,
        headers: error.config.headers
      }, seen) : undefined
    };
  }

  if (Array.isArray(value)) return value.map(item => sanitizeForLog(item, seen));

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
    acc[key] = SECRET_KEY_PATTERN.test(key) ? '[REDACTED]' : sanitizeForLog(nestedValue, seen);
    return acc;
  }, {});
};
