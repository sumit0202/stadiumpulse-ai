import type { AssistantRequest, AssistantResponse, ApiStatus } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ErrorBody {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as ErrorBody;
  return body.error ?? `Request failed (${res.status})`;
}

/** Call the backend assistant proxy. Supports AbortController cancellation. */
export async function requestAssistant(
  request: AssistantRequest,
  signal?: AbortSignal,
): Promise<AssistantResponse> {
  const res = await fetch(`${BASE}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as AssistantResponse;
}

/** Fetch the live API-status matrix from the backend. */
export async function fetchStatuses(signal?: AbortSignal): Promise<ApiStatus[]> {
  const res = await fetch(`${BASE}/status`, { signal });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as { statuses: ApiStatus[] };
  return data.statuses;
}
