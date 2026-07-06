import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from '../../features/onboarding/Onboarding';
import { renderWithPreferences } from '../testUtils';

describe('Onboarding', () => {
  it('renders labelled controls', () => {
    renderWithPreferences(<Onboarding />);
    expect(screen.getByLabelText('I am a')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred language')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /accessibility needs/i })).toBeInTheDocument();
  });

  it('saves preferences on submit and toggles accessibility needs', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<Onboarding />);
    await user.click(screen.getByLabelText('Wheelchair-friendly route'));
    await user.selectOptions(screen.getByLabelText('I am a'), 'volunteer');
    await user.click(screen.getByRole('button', { name: /enter command center/i }));
    const stored = window.localStorage.getItem('stadiumpulse.preferences');
    expect(stored).toContain('volunteer');
    expect(stored).toContain('wheelchair');
  });

  it('supports keyboard toggling of accessibility checkboxes', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<Onboarding />);
    const checkbox = screen.getByLabelText('Low-noise path');
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    await user.keyboard(' ');
    expect(checkbox).toBeChecked();
  });
});
