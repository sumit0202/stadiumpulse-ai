import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { PreferencesProvider } from '../state/preferences';
import type { UserPreferences } from '../types';

export const samplePreferences: UserPreferences = {
  persona: 'fan',
  language: 'en',
  accessibility: ['wheelchair'],
  zone: 'Section 101',
};

/** Render a component inside the PreferencesProvider, optionally pre-onboarded. */
export function renderWithPreferences(ui: ReactElement, preferences?: UserPreferences) {
  if (preferences) {
    window.localStorage.setItem('stadiumpulse.preferences', JSON.stringify(preferences));
  }
  return render(<PreferencesProvider>{ui}</PreferencesProvider>);
}
