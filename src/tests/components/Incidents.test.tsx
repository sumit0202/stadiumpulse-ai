import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Incidents } from '../../features/incidents/Incidents';
import { renderWithPreferences } from '../testUtils';

describe('Incidents', () => {
  it('shows a validation error for an empty description', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<Incidents />);
    await user.click(screen.getByRole('button', { name: /log incident/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/must not be empty/i);
  });

  it('logs a sanitised incident with severity and next step', async () => {
    const user = userEvent.setup();
    renderWithPreferences(<Incidents />);
    await user.selectOptions(screen.getByLabelText('Incident type'), 'medical');
    await user.type(screen.getByLabelText('Description'), 'Fan feeling faint <script>');
    await user.click(screen.getByRole('button', { name: /log incident/i }));
    expect(screen.getByText(/Fan feeling faint script/)).toBeInTheDocument();
    expect(screen.getAllByText(/Severity: High/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Next step:/).length).toBeGreaterThan(0);
  });
});
