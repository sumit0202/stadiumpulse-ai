import { describe, expect, it } from 'vitest';
import {
  isAccessibilityNeed,
  isIncidentType,
  isLanguage,
  isPersona,
  isRouteMode,
  sanitizeText,
  validateAccessibilityNeeds,
  validateIncidentDescription,
  validateLanguage,
  validateMessage,
  validatePreferences,
} from '../../lib/validators';

describe('type guards', () => {
  it('validates personas', () => {
    expect(isPersona('fan')).toBe(true);
    expect(isPersona('astronaut')).toBe(false);
    expect(isPersona(42)).toBe(false);
  });

  it('validates languages', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('xx')).toBe(false);
  });

  it('validates accessibility needs', () => {
    expect(isAccessibilityNeed('wheelchair')).toBe(true);
    expect(isAccessibilityNeed('teleport')).toBe(false);
  });

  it('validates route modes', () => {
    expect(isRouteMode('accessible')).toBe(true);
    expect(isRouteMode('warp')).toBe(false);
  });

  it('validates incident types', () => {
    expect(isIncidentType('medical')).toBe(true);
    expect(isIncidentType('alien')).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('strips angle brackets, control chars and collapses whitespace', () => {
    expect(sanitizeText('  <script>alert</script>  ')).toBe('scriptalert/script');
    expect(sanitizeText('a\u0007b\u007fc')).toBe('a b c');
    expect(sanitizeText('multi   space\n\ttab')).toBe('multi space tab');
  });
});

describe('validateMessage', () => {
  it('rejects non-string, null and undefined', () => {
    expect(validateMessage(123).valid).toBe(false);
    expect(validateMessage(null).valid).toBe(false);
    expect(validateMessage(undefined).valid).toBe(false);
    expect(validateMessage(123).error).toMatch(/string/);
  });

  it('rejects empty and control-character-only input', () => {
    expect(validateMessage('   ').valid).toBe(false);
    expect(validateMessage('\u0000\u0007').valid).toBe(false);
  });

  it('rejects oversized input but accepts exactly at the limit (boundary)', () => {
    expect(validateMessage('a'.repeat(1001)).valid).toBe(false);
    expect(validateMessage('a'.repeat(1001)).error).toMatch(/exceeds/);
    expect(validateMessage('a'.repeat(1000)).valid).toBe(true);
  });

  it('accepts valid input', () => {
    const r = validateMessage('  Hello there  ');
    expect(r.valid).toBe(true);
    expect(r.value).toBe('Hello there');
  });
});

describe('validateIncidentDescription', () => {
  it('accepts valid and rejects oversized', () => {
    expect(validateIncidentDescription('Broken seat').valid).toBe(true);
    expect(validateIncidentDescription('x'.repeat(501)).valid).toBe(false);
  });
});

describe('validateLanguage', () => {
  it('accepts supported and rejects unsupported', () => {
    expect(validateLanguage('fr').valid).toBe(true);
    expect(validateLanguage('zz').valid).toBe(false);
  });
});

describe('validateAccessibilityNeeds', () => {
  it('rejects non-array', () => {
    const r = validateAccessibilityNeeds('nope');
    expect(r.valid).toBe(false);
    expect(r.value).toBeNull();
  });

  it('filters invalid entries', () => {
    const r = validateAccessibilityNeeds(['wheelchair', 'bogus', 'senior']);
    expect(r.value).toEqual(['wheelchair', 'senior']);
  });
});

describe('validatePreferences', () => {
  it('rejects non-object, null and undefined', () => {
    expect(validatePreferences('x').valid).toBe(false);
    expect(validatePreferences(null).valid).toBe(false);
    expect(validatePreferences(undefined).valid).toBe(false);
  });

  it('rejects invalid persona and language', () => {
    expect(validatePreferences({ persona: 'x' }).error).toMatch(/persona/);
    expect(validatePreferences({ persona: 'fan', language: 'x' }).error).toMatch(/language/);
  });

  it('rejects empty zone', () => {
    const r = validatePreferences({ persona: 'fan', language: 'en', zone: '' });
    expect(r.valid).toBe(false);
  });

  it('accepts valid preferences and filters bad needs', () => {
    const r = validatePreferences({
      persona: 'staff',
      language: 'es',
      zone: 'Section 101',
      accessibility: ['wheelchair', 'bad'],
    });
    expect(r.valid).toBe(true);
    expect(r.value).toEqual({
      persona: 'staff',
      language: 'es',
      accessibility: ['wheelchair'],
      zone: 'Section 101',
    });
  });

  it('defaults accessibility to empty array when the field is omitted', () => {
    const r = validatePreferences({ persona: 'fan', language: 'en', zone: 'A' });
    expect(r.valid).toBe(true);
    expect(r.value?.accessibility).toEqual([]);
  });

  it('defaults accessibility to empty array when not an array', () => {
    const r = validatePreferences({
      persona: 'fan',
      language: 'en',
      zone: 'A',
      accessibility: 'not-a-list',
    });
    expect(r.valid).toBe(true);
    expect(r.value?.accessibility).toEqual([]);
  });
});
