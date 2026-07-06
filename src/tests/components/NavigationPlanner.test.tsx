import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationPlanner } from '../../features/navigation/NavigationPlanner';
import { renderWithPreferences } from '../testUtils';

describe('NavigationPlanner', () => {
  it('renders a route plan with accessibility score', () => {
    renderWithPreferences(<NavigationPlanner />);
    expect(screen.getByText('Route summary')).toBeInTheDocument();
    expect(screen.getByText(/Accessibility score/)).toBeInTheDocument();
  });

  it('debounces the location filter and narrows the options', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<NavigationPlanner />);
    const origin = screen.getByLabelText('Origin');
    const initialCount = within(origin).getAllByRole('option').length;

    await user.type(screen.getByLabelText('Filter locations'), 'Gate');

    await waitFor(() => {
      const options = within(origin).getAllByRole('option');
      expect(options.length).toBeLessThan(initialCount);
      expect(options.every((o) => /Gate/.test(o.textContent ?? ''))).toBe(true);
    });
  });
});
