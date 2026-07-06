import type {
  AccessibilityNeed,
  ApiName,
  IncidentType,
  LanguageCode,
  Persona,
  RiskLevel,
  RouteMode,
} from '../types';

export const PERSONAS: readonly Persona[] = ['fan', 'organizer', 'volunteer', 'staff'] as const;

export const PERSONA_LABELS: Record<Persona, string> = {
  fan: 'Fan',
  organizer: 'Organizer',
  volunteer: 'Volunteer',
  staff: 'Venue Staff',
};

export const LANGUAGES: readonly LanguageCode[] = [
  'en',
  'es',
  'fr',
  'hi',
  'ar',
  'pt',
  'de',
] as const;

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  hi: 'हिन्दी',
  ar: 'العربية',
  pt: 'Português',
  de: 'Deutsch',
};

/** Languages that render right-to-left, used by the UI for `dir`. */
export const RTL_LANGUAGES: readonly LanguageCode[] = ['ar'] as const;

/** Resolve the writing direction for a language, for the `dir` attribute on translated content. */
export const textDirection = (language: LanguageCode): 'rtl' | 'ltr' =>
  RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

export const ACCESSIBILITY_NEEDS: readonly AccessibilityNeed[] = [
  'wheelchair',
  'low-noise',
  'step-free',
  'visual-assist',
  'senior',
  'family',
] as const;

export const ACCESSIBILITY_LABELS: Record<AccessibilityNeed, string> = {
  wheelchair: 'Wheelchair-friendly route',
  'low-noise': 'Low-noise path',
  'step-free': 'Step-free route',
  'visual-assist': 'Visual assistance',
  senior: 'Senior-friendly movement',
  family: 'Child / family support',
};

export const ROUTE_MODES: readonly RouteMode[] = [
  'fastest',
  'low-crowd',
  'accessible',
  'family',
  'staff-only',
] as const;

export const ROUTE_MODE_LABELS: Record<RouteMode, string> = {
  fastest: 'Fastest',
  'low-crowd': 'Lowest crowd',
  accessible: 'Accessible',
  family: 'Family-friendly',
  'staff-only': 'Staff-only operational path',
};

export const INCIDENT_TYPES: readonly IncidentType[] = [
  'medical',
  'lost-person',
  'security',
  'accessibility',
  'facility',
  'queue-overflow',
] as const;

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  medical: 'Medical',
  'lost-person': 'Lost person',
  security: 'Security',
  accessibility: 'Accessibility support',
  facility: 'Facility issue',
  'queue-overflow': 'Queue overflow',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const API_NAMES: readonly ApiName[] = [
  'gemini',
  'maps',
  'places',
  'routes',
  'geocoding',
  'translation',
  'timezone',
  'airquality',
] as const;

export const API_INFO: Record<
  ApiName,
  { label: string; purpose: string; scope: 'frontend' | 'backend' }
> = {
  gemini: {
    label: 'Gemini / Generative AI',
    purpose: 'GenAI copilot, operational summarisation, multilingual reasoning, recommendations.',
    scope: 'backend',
  },
  maps: {
    label: 'Maps JavaScript API',
    purpose: 'Interactive stadium map with gates, zones, amenities and crowd overlays.',
    scope: 'frontend',
  },
  places: {
    label: 'Places API',
    purpose: 'Nearby entrances, transit, hospitals, parking, restrooms, food, help desks, water.',
    scope: 'backend',
  },
  routes: {
    label: 'Routes API',
    purpose: 'Accessible, low-crowd and evacuation routing plus route matrix comparison.',
    scope: 'backend',
  },
  geocoding: {
    label: 'Geocoding API',
    purpose: 'Convert addresses/landmarks to coordinates and reverse-geocode user location.',
    scope: 'backend',
  },
  translation: {
    label: 'Cloud Translation API',
    purpose: 'Translate assistant replies and key operational alerts into supported languages.',
    scope: 'backend',
  },
  timezone: {
    label: 'Time Zone API',
    purpose: 'Venue-local time for match schedules, volunteer shifts, alerts and transport.',
    scope: 'backend',
  },
  airquality: {
    label: 'Air Quality API',
    purpose: 'Heat/pollution-aware health, sustainability and accessibility recommendations.',
    scope: 'backend',
  },
};

/** Thresholds used by the deterministic decision engine. */
export const THRESHOLDS = {
  gatePressureHigh: 80,
  alternateGateLow: 50,
  denseZone: 70,
  exitWaveHigh: 75,
  aqiSensitive: 100,
} as const;

/** Maximum accepted length for free-text user input (assistant + incidents). */
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_INCIDENT_LENGTH = 500;

/** Default cache TTL for adapter responses (ms). */
export const DEFAULT_CACHE_TTL_MS = 30_000;
