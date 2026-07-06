import { describe, expect, it } from 'vitest';
import { validateAssistantBody } from '../../../server/validators';

const baseContext = {
  persona: 'fan',
  language: 'en',
  accessibility: ['wheelchair'],
  zone: 'Section 101',
  crowdSummary: 'North is red',
};

describe('validateAssistantBody', () => {
  it('rejects a non-object body', () => {
    expect(validateAssistantBody('x').valid).toBe(false);
    expect(validateAssistantBody(null).valid).toBe(false);
  });

  it('rejects an invalid message', () => {
    expect(validateAssistantBody({ message: '', context: baseContext }).error).toMatch(/empty/i);
  });

  it('requires a context object', () => {
    expect(validateAssistantBody({ message: 'hi', context: null }).error).toMatch(/Context/);
  });

  it('rejects invalid persona and language', () => {
    expect(
      validateAssistantBody({ message: 'hi', context: { ...baseContext, persona: 'x' } }).error,
    ).toMatch(/persona/);
    expect(
      validateAssistantBody({ message: 'hi', context: { ...baseContext, language: 'zz' } }).error,
    ).toMatch(/language/i);
  });

  it('accepts and normalises a valid body', () => {
    const r = validateAssistantBody({ message: '  Help me  ', context: baseContext });
    expect(r.valid).toBe(true);
    expect(r.value?.message).toBe('Help me');
    expect(r.value?.context.zone).toBe('Section 101');
    expect(r.value?.context.crowdSummary).toBe('North is red');
  });

  it('defaults zone and crowd summary when missing or non-string', () => {
    const r = validateAssistantBody({
      message: 'hi',
      context: {
        persona: 'staff',
        language: 'fr',
        accessibility: 'nope',
        zone: 42,
        crowdSummary: 99,
      },
    });
    expect(r.valid).toBe(true);
    expect(r.value?.context.zone).toBe('general');
    expect(r.value?.context.crowdSummary).toBe('');
    expect(r.value?.context.accessibility).toEqual([]);
  });

  it('defaults an empty zone string to general', () => {
    const r = validateAssistantBody({ message: 'hi', context: { ...baseContext, zone: '   ' } });
    expect(r.value?.context.zone).toBe('general');
  });

  it('defaults accessibility to an empty array when the field is omitted', () => {
    const r = validateAssistantBody({
      message: 'hi',
      context: { persona: 'fan', language: 'en', zone: 'A' },
    });
    expect(r.valid).toBe(true);
    expect(r.value?.context.accessibility).toEqual([]);
  });
});
