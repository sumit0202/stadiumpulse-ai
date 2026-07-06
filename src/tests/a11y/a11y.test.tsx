import { describe, expect, it } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { ReactElement } from 'react';
import { Onboarding } from '../../features/onboarding/Onboarding';
import { Dashboard } from '../../features/dashboard/Dashboard';
import { AccessibilityPlanner } from '../../features/accessibility/AccessibilityPlanner';
import { CrowdManagement } from '../../features/crowd/CrowdManagement';
import { Transport } from '../../features/transport/Transport';
import { Sustainability } from '../../features/sustainability/Sustainability';
import { Incidents } from '../../features/incidents/Incidents';
import { App } from '../../App';
import { renderWithPreferences, samplePreferences } from '../testUtils';
import type { UserPreferences } from '../../types';

expect.extend(toHaveNoViolations);

async function expectNoViolations(
  ui: ReactElement,
  preferences: UserPreferences | undefined = samplePreferences,
) {
  const { container } = renderWithPreferences(ui, preferences);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe('accessibility (axe)', () => {
  it('App onboarding view has no violations', async () => {
    await expectNoViolations(<App />, undefined);
  });

  it('App command-center view has no violations', async () => {
    await expectNoViolations(<App />);
  });

  it('Onboarding has no violations', async () => {
    await expectNoViolations(<Onboarding />);
  });

  it('Dashboard has no violations', async () => {
    await expectNoViolations(<Dashboard />);
  });

  it('AccessibilityPlanner has no violations', async () => {
    await expectNoViolations(<AccessibilityPlanner />);
  });

  it('CrowdManagement has no violations', async () => {
    await expectNoViolations(<CrowdManagement />);
  });

  it('Transport has no violations', async () => {
    await expectNoViolations(<Transport />);
  });

  it('Sustainability has no violations', async () => {
    await expectNoViolations(<Sustainability />);
  });

  it('Incidents has no violations', async () => {
    await expectNoViolations(<Incidents />);
  });
});
