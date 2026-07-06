/**
 * Shared domain types for StadiumPulse AI.
 * These types are used by the decision engine, adapters, backend and UI so the
 * whole product speaks one strongly-typed language.
 */

export type Persona = 'fan' | 'organizer' | 'volunteer' | 'staff';

export type LanguageCode = 'en' | 'es' | 'fr' | 'hi' | 'ar' | 'pt' | 'de';

export type AccessibilityNeed =
  'wheelchair' | 'low-noise' | 'step-free' | 'visual-assist' | 'senior' | 'family';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Traffic-light crowd levels also carry a text label so we never rely on colour alone. */
export type CrowdLevel = 'green' | 'yellow' | 'orange' | 'red';

export type RouteMode = 'fastest' | 'low-crowd' | 'accessible' | 'family' | 'staff-only';

export type TransportMode = 'walk' | 'shuttle' | 'transit' | 'rideshare' | 'parking';

export type IncidentType =
  'medical' | 'lost-person' | 'security' | 'accessibility' | 'facility' | 'queue-overflow';

export type AmenityType =
  | 'gate'
  | 'seat-section'
  | 'restroom'
  | 'medical'
  | 'food'
  | 'exit'
  | 'shuttle'
  | 'help-desk'
  | 'water-refill'
  | 'recycling';

export type ApiName =
  'gemini' | 'maps' | 'places' | 'routes' | 'geocoding' | 'translation' | 'timezone' | 'airquality';

export type ApiMode = 'demo' | 'ready' | 'live' | 'error';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface UserPreferences {
  persona: Persona;
  language: LanguageCode;
  accessibility: AccessibilityNeed[];
  zone: string;
}

export interface Amenity {
  id: string;
  type: AmenityType;
  name: string;
  location: LatLng;
  /** Crowd score 0-100 used by the decision engine. */
  crowd: number;
  stepFree: boolean;
}

export interface Gate {
  id: string;
  name: string;
  location: LatLng;
  /** Pressure 0-100. */
  pressure: number;
  open: boolean;
  stepFree: boolean;
}

export interface VenueData {
  id: string;
  name: string;
  city: string;
  timeZoneId: string;
  center: LatLng;
  gates: Gate[];
  amenities: Amenity[];
}

export interface CrowdZone {
  id: string;
  name: string;
  level: CrowdLevel;
  /** Density 0-100. */
  density: number;
  /** Signed rate of change over the last interval (people/min proxy). */
  trend: number;
  hasMedicalIncident: boolean;
}

export interface CrowdSnapshot {
  capturedAt: string;
  zones: CrowdZone[];
  postMatchExitWave: number;
}

export interface TransportOption {
  mode: TransportMode;
  label: string;
  etaMinutes: number;
  queueMinutes: number;
  /** Estimated grams CO2 per passenger for the trip. */
  co2Grams: number;
  crowd: CrowdLevel;
}

export interface Incident {
  id: string;
  type: IncidentType;
  zoneId: string;
  description: string;
  severity: RiskLevel;
  createdAt: string;
}

/** The canonical structured recommendation returned everywhere in the app. */
export interface Recommendation {
  summary: string;
  action: string;
  reason: string;
  risk: RiskLevel;
  timeImpactMinutes: number;
  accessibilityNote: string;
  sustainabilityNote: string;
  simulated: boolean;
}

export interface RoutePlan {
  mode: RouteMode;
  fromId: string;
  toId: string;
  distanceMeters: number;
  etaMinutes: number;
  crowdRisk: RiskLevel;
  accessibilityScore: number;
  fallback: string;
  steps: string[];
  simulated: boolean;
}

export interface SustainabilityInput {
  transportCo2Grams: number;
  waterRefillUsage: number;
  recyclingCompliance: number;
  crowdEnergyLoad: number;
  airQualityIndex: number;
}

export interface KpiSnapshot {
  crowdLoad: number;
  gatePressure: number;
  transportDelay: number;
  incidentCount: number;
  accessibleRouteAvailability: number;
  sustainabilityScore: number;
}

/* ----------------------------- Adapter I/O types ----------------------------- */

export interface AssistantContext {
  persona: Persona;
  language: LanguageCode;
  accessibility: AccessibilityNeed[];
  zone: string;
  crowdSummary: string;
}

export interface AssistantRequest {
  message: string;
  context: AssistantContext;
}

export interface AssistantResponse {
  recommendation: Recommendation;
  reply: string;
  language: LanguageCode;
  source: 'live' | 'mock';
}

export interface PlacesQuery {
  near: LatLng;
  type: AmenityType;
  radiusMeters: number;
}

export interface RoutesQuery {
  from: LatLng;
  to: LatLng;
  mode: RouteMode;
}

export interface RouteMatrixQuery {
  origin: LatLng;
  destinations: LatLng[];
}

export interface GeocodeQuery {
  address: string;
}

export interface ReverseGeocodeQuery {
  location: LatLng;
}

export interface TranslateQuery {
  text: string;
  target: LanguageCode;
}

export interface TimeZoneQuery {
  location: LatLng;
  timestamp: number;
}

export interface TimeZoneResult {
  timeZoneId: string;
  localTime: string;
  rawOffsetMinutes: number;
}

export interface AirQualityQuery {
  location: LatLng;
}

export interface AirQualityResult {
  aqi: number;
  category: string;
  dominantPollutant: string;
  advice: string;
}

export interface AdapterResult<T> {
  ok: boolean;
  data: T | null;
  source: 'live' | 'mock';
  error?: string;
}

export interface ApiStatus {
  name: ApiName;
  label: string;
  mode: ApiMode;
  purpose: string;
  scope: 'frontend' | 'backend';
}
