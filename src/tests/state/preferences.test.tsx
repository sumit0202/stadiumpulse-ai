import { describe, expect, it } from 'vitest';
import { renderWithPreferences, samplePreferences } from '../testUtils';
import type { UserPreferences } from '../../types';

/** The PreferencesProvider reflects the active language onto <html> for a11y. */
describe('PreferencesProvider document language & direction', () => {
  it('defaults to English, left-to-right before onboarding', () => {
    renderWithPreferences(<div>content</div>);
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('applies the selected left-to-right language', () => {
    const prefs: UserPreferences = { ...samplePreferences, language: 'es' };
    renderWithPreferences(<div>content</div>, prefs);
    expect(document.documentElement.lang).toBe('es');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('switches direction to right-to-left for Arabic', () => {
    const prefs: UserPreferences = { ...samplePreferences, language: 'ar' };
    renderWithPreferences(<div>content</div>, prefs);
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
