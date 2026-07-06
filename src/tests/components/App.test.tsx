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

  it('renders the primary tablist once onboarded', () => {
    renderWithPreferences(<App />, samplePreferences);
    expect(screen.getByRole('tablist', { name: /primary/i })).toBeInTheDocument();
    const dashboard = screen.getByRole('tab', { name: 'Dashboard' });
    expect(dashboard).toHaveAttribute('aria-selected', 'true');
    expect(dashboard).toHaveAttribute('tabindex', '0');
  });

  it('moves between tabs with arrow keys (roving tabindex)', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<App />, samplePreferences);
    screen.getByRole('tab', { name: 'Dashboard' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'AI Copilot' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'API status' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('switches tabs with a pointer click', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<App />, samplePreferences);
    await user.click(screen.getByRole('tab', { name: 'Incidents' }));
    expect(screen.getByRole('heading', { name: 'Incident reporting' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});
