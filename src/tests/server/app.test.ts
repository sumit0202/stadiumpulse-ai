import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server/index';

const validBody = {
  message: 'Where is the nearest step-free route?',
  context: {
    persona: 'fan',
    language: 'en',
    accessibility: ['wheelchair'],
    zone: 'Section 101',
    crowdSummary: 'North is busy',
  },
};

const originalEnv = { ...process.env };

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_SERVER_API_KEY;
  delete process.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.RATE_LIMIT_MAX = '30';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('Express app (security & routing)', () => {
  it('serves health in demo mode', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', mode: 'demo' });
  });

  it('reports all eight APIs as ready for a live key', async () => {
    const res = await request(createApp()).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.statuses).toHaveLength(8);
    expect(res.body.statuses.every((s: { mode: string }) => s.mode === 'ready')).toBe(true);
  });

  it('sets Helmet security headers including a hardened CSP', async () => {
    const res = await request(createApp()).get('/api/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('applies a strict CORS allow-origin', async () => {
    const res = await request(createApp())
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('answers the assistant endpoint in demo mode', async () => {
    const res = await request(createApp()).post('/api/assistant').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('mock');
  });

  it('rejects an oversized request body safely', async () => {
    const huge = { message: 'x'.repeat(20_000), context: validBody.context };
    const res = await request(createApp()).post('/api/assistant').send(huge);
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('Internal server error');
  });

  it('enforces the assistant rate limit', async () => {
    process.env.RATE_LIMIT_MAX = '2';
    const app = createApp();
    await request(app).post('/api/assistant').send(validBody);
    await request(app).post('/api/assistant').send(validBody);
    const limited = await request(app).post('/api/assistant').send(validBody);
    expect(limited.status).toBe(429);
  });
});
