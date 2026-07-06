import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ApiStatus } from '../../features/api-status/ApiStatus';
import { fetchStatuses } from '../../lib/api';
import { renderWithPreferences } from '../testUtils';
import { API_NAMES } from '../../lib/constants';
import type { ApiStatus as ApiStatusType } from '../../types';

vi.mock('../../lib/api', () => ({
  fetchStatuses: vi.fn(),
  requestAssistant: vi.fn(),
}));

const mockFetchStatuses = vi.mocked(fetchStatuses);

afterEach(() => mockFetchStatuses.mockReset());

describe('ApiStatus', () => {
  it('renders all eight APIs in demo mode when the backend is down', async () => {
    mockFetchStatuses.mockRejectedValue(new Error('down'));
    renderWithPreferences(<ApiStatus />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(API_NAMES.length);
    await waitFor(() => expect(screen.getByText(/Backend unavailable/)).toBeInTheDocument());
  });

  it('renders backend-reported statuses when available', async () => {
    const live: ApiStatusType[] = API_NAMES.map((name) => ({
      name,
      label: `Label ${name}`,
      purpose: 'purpose',
      scope: 'backend',
      mode: 'ready',
    }));
    mockFetchStatuses.mockResolvedValue(live);
    renderWithPreferences(<ApiStatus />);
    await waitFor(() =>
      expect(screen.getByText(/reported by the backend proxy/)).toBeInTheDocument(),
    );
  });
});
