import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchStatuses, requestAssistant } from '../../lib/api';
import type { AssistantRequest, AssistantResponse } from '../../types';

const request: AssistantRequest = {
  message: 'hello',
  context: { persona: 'fan', language: 'en', accessibility: [], zone: 'A', crowdSummary: '' },
};

const response: AssistantResponse = {
  reply: 'hi',
  language: 'en',
  source: 'mock',
  recommendation: {
    summary: 's',
    action: 'a',
    reason: 'r',
    risk: 'low',
    timeImpactMinutes: 1,
    accessibilityNote: 'n',
    sustainabilityNote: 'n',
    simulated: true,
  },
};

function stubFetch(impl: (url: string, init?: unknown) => Promise<unknown>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

afterEach(() => vi.unstubAllGlobals());

describe('requestAssistant', () => {
  it('returns the parsed response on success', async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => response }));
    await expect(requestAssistant(request)).resolves.toEqual(response);
  });

  it('throws the backend error message on failure', async () => {
    stubFetch(async () => ({ ok: false, status: 400, json: async () => ({ error: 'bad input' }) }));
    await expect(requestAssistant(request)).rejects.toThrow('bad input');
  });

  it('throws a generic error when the body cannot be parsed', async () => {
    stubFetch(async () => ({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    }));
    await expect(requestAssistant(request)).rejects.toThrow('Request failed (500)');
  });
});

describe('fetchStatuses', () => {
  it('returns the statuses array on success', async () => {
    const statuses = [
      { name: 'gemini', label: 'G', purpose: 'p', scope: 'backend', mode: 'ready' },
    ];
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ statuses }) }));
    await expect(fetchStatuses()).resolves.toEqual(statuses);
  });

  it('throws on a failed status request', async () => {
    stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchStatuses()).rejects.toThrow('Request failed (503)');
  });
});
