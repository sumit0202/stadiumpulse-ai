import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibilityPlanner } from '../../features/accessibility/AccessibilityPlanner';
import { renderWithPreferences } from '../testUtils';

describe('AccessibilityPlanner', () => {
  it('exposes labelled display-setting toggles', () => {
    renderWithPreferences(<AccessibilityPlanner />);
    expect(screen.getByLabelText('High contrast')).toBeInTheDocument();
    expect(screen.getByLabelText('Large text')).toBeInTheDocument();
    expect(screen.getByLabelText('Reduce motion')).toBeInTheDocument();
  });

  it('applies high-contrast, large-text and reduced-motion to the document', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<AccessibilityPlanner />);
    await user.click(screen.getByLabelText('High contrast'));
    await user.click(screen.getByLabelText('Large text'));
    await user.click(screen.getByLabelText('Reduce motion'));
    await waitFor(() => {
      expect(document.body.dataset.contrast).toBe('high');
      expect(document.body.dataset.text).toBe('large');
      expect(document.body.dataset.motion).toBe('reduced');
    });
  });

  it('announces an accessible route summary via a live region', () => {
    renderWithPreferences(<AccessibilityPlanner />);
    expect(screen.getByText(/Step-free accessibility score/)).toBeInTheDocument();
  });
});
