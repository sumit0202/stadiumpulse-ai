import { describe, expect, it } from 'vitest';
import {
  corsOptions,
  createRateLimiter,
  helmetOptions,
  parseIntEnv,
  safeErrorMessage,
} from '../../../server/security';

describe('security helpers', () => {
  it('builds strict CORS options', () => {
    const options = corsOptions('http://localhost:5173');
    expect(options.origin).toBe('http://localhost:5173');
    expect(options.credentials).toBe(false);
    expect(options.methods).toEqual(['GET', 'POST']);
  });

  it('builds a hardened helmet CSP with no unsafe-inline', () => {
    const options = helmetOptions();
    const directives = options.contentSecurityPolicy.directives;
    expect(directives.defaultSrc).toEqual(["'self'"]);
    expect(directives.objectSrc).toEqual(["'none'"]);
    expect(directives.baseUri).toEqual(["'self'"]);
    expect(directives.styleSrc).not.toContain("'unsafe-inline'");
    expect(directives.scriptSrc).not.toContain("'unsafe-inline'");
    expect(options.crossOriginEmbedderPolicy).toBe(false);
  });

  it('creates a rate limiter middleware', () => {
    expect(typeof createRateLimiter(10, 1000)).toBe('function');
  });

  it('never leaks internal error details', () => {
    expect(safeErrorMessage()).toBe('Internal server error');
  });

  it('parses integer environment variables with a fallback', () => {
    expect(parseIntEnv(undefined, 5)).toBe(5);
    expect(parseIntEnv('not-a-number', 7)).toBe(7);
    expect(parseIntEnv('42', 0)).toBe(42);
  });
});
