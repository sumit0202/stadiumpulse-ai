import { describe, expect, it } from 'vitest';
import { RTL_LANGUAGES, textDirection } from '../../lib/constants';

describe('textDirection', () => {
  it('returns rtl for right-to-left languages', () => {
    expect(textDirection('ar')).toBe('rtl');
    for (const language of RTL_LANGUAGES) {
      expect(textDirection(language)).toBe('rtl');
    }
  });

  it('returns ltr for left-to-right languages', () => {
    expect(textDirection('en')).toBe('ltr');
    expect(textDirection('hi')).toBe('ltr');
    expect(textDirection('fr')).toBe('ltr');
  });
});
