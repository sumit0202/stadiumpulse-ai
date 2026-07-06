import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { renderWithPreferences, samplePreferences } from '../testUtils';

vi.mock('../../lib/api', () => ({
  requestAssistant: vi.fn(),
  fetchStatuses: vi.fn().mockRejectedValue(new Error('offline')),
}));

describe('App', () => {
  it('provides a skip-to-content link targeting main', () => {
    renderWithPreferences(<App />);
    const skip = screen.getByRole('link', { name: /skip to content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
  });

  it('shows onboarding before preferences are set', () => {
    renderWithPreferences(<App />);
    expect(screen.getByText(/Set up your StadiumPulse copilot/i)).toBeInTheDocument();
  });

  it('renders the primary navigation once onboarded', () => {
    renderWithPreferences(<App />, samplePreferences);
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('switches tabs with the keyboard', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<App />, samplePreferences);
    const transportTab = screen.getByRole('button', { name: 'Transport' });
    transportTab.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Transportation' })).toBeInTheDocument();
    expect(transportTab).toHaveAttribute('aria-current', 'page');
  });

  it('switches tabs with a pointer click', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<App />, samplePreferences);
    await user.click(screen.getByRole('button', { name: 'Incidents' }));
    expect(screen.getByRole('heading', { name: 'Incident reporting' })).toBeInTheDocument();
  });
});
