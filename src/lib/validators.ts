import {
  ACCESSIBILITY_NEEDS,
  INCIDENT_TYPES,
  LANGUAGES,
  MAX_INCIDENT_LENGTH,
  MAX_MESSAGE_LENGTH,
  PERSONAS,
  ROUTE_MODES,
} from './constants';
import type {
  AccessibilityNeed,
  IncidentType,
  LanguageCode,
  Persona,
  RouteMode,
  UserPreferences,
} from '../types';

export interface ValidationResult<T> {
  valid: boolean;
  value: T | null;
  error?: string;
}

/** Type guards backed by the canonical constant lists. */
export const isPersona = (v: unknown): v is Persona =>
  typeof v === 'string' && (PERSONAS as readonly string[]).includes(v);

export const isLanguage = (v: unknown): v is LanguageCode =>
  typeof v === 'string' && (LANGUAGES as readonly string[]).includes(v);

export const isAccessibilityNeed = (v: unknown): v is AccessibilityNeed =>
  typeof v === 'string' && (ACCESSIBILITY_NEEDS as readonly string[]).includes(v);

export const isRouteMode = (v: unknown): v is RouteMode =>
  typeof v === 'string' && (ROUTE_MODES as readonly string[]).includes(v);

export const isIncidentType = (v: unknown): v is IncidentType =>
  typeof v === 'string' && (INCIDENT_TYPES as readonly string[]).includes(v);

/**
 * Sanitize free text: strip angle brackets (prevents HTML/script injection),
 * remove control characters, collapse whitespace and trim.
 * Never uses dangerouslySetInnerHTML anywhere in the app.
 */
export function sanitizeText(input: string): string {
  return (
    input
      .replace(/[<>]/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function validateFreeText(
  input: unknown,
  maxLength: number,
  label: string,
): ValidationResult<string> {
  if (typeof input !== 'string') {
    return { valid: false, value: null, error: `${label} must be a string` };
  }
  const cleaned = sanitizeText(input);
  if (cleaned.length === 0) {
    return { valid: false, value: null, error: `${label} must not be empty` };
  }
  if (cleaned.length > maxLength) {
    return { valid: false, value: null, error: `${label} exceeds ${maxLength} characters` };
  }
  return { valid: true, value: cleaned };
}

export const validateMessage = (input: unknown): ValidationResult<string> =>
  validateFreeText(input, MAX_MESSAGE_LENGTH, 'Message');

export const validateIncidentDescription = (input: unknown): ValidationResult<string> =>
  validateFreeText(input, MAX_INCIDENT_LENGTH, 'Description');

export function validateLanguage(input: unknown): ValidationResult<LanguageCode> {
  if (!isLanguage(input)) {
    return { valid: false, value: null, error: 'Unsupported language' };
  }
  return { valid: true, value: input };
}

export function validateAccessibilityNeeds(input: unknown): ValidationResult<AccessibilityNeed[]> {
  if (!Array.isArray(input)) {
    return { valid: false, value: null, error: 'Accessibility needs must be a list' };
  }
  const cleaned = input.filter(isAccessibilityNeed);
  return { valid: true, value: cleaned };
}

export function validatePreferences(input: unknown): ValidationResult<UserPreferences> {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, value: null, error: 'Preferences must be an object' };
  }
  const record = input as Record<string, unknown>;
  if (!isPersona(record.persona)) {
    return { valid: false, value: null, error: 'Invalid persona' };
  }
  if (!isLanguage(record.language)) {
    return { valid: false, value: null, error: 'Invalid language' };
  }
  const zoneResult = validateFreeText(record.zone, 60, 'Zone');
  if (!zoneResult.valid || zoneResult.value === null) {
    return { valid: false, value: null, error: zoneResult.error };
  }
  const needs = validateAccessibilityNeeds(record.accessibility ?? []);
  return {
    valid: true,
    value: {
      persona: record.persona,
      language: record.language,
      accessibility: needs.value ?? [],
      zone: zoneResult.value,
    },
  };
}
