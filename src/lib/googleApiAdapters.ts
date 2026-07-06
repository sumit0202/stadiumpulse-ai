import { TtlCache } from './cache';
import { clamp, distanceMeters } from './decisionEngine';
import { airQualityAdvice } from './sustainability';
import { isLanguage } from './validators';
import { mockVenue } from '../data/mockVenue';
import type {
  AdapterResult,
  AirQualityQuery,
  AirQualityResult,
  Amenity,
  AmenityType,
  ApiName,
  GeocodeQuery,
  LatLng,
  LanguageCode,
  PlacesQuery,
  ReverseGeocodeQuery,
  RouteMatrixQuery,
  RouteMode,
  RoutesQuery,
  TimeZoneQuery,
  TimeZoneResult,
  TranslateQuery,
  VenueData,
} from '../types';

/* ------------------------------ shared plumbing ----------------------------- */

interface FetchResponseLike {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<FetchResponseLike>;

export interface GoogleAdapterConfig {
  /** Server-side key shared by Places/Routes/Geocoding/Translation/TimeZone/AirQuality. */
  serverApiKey?: string;
  /** Browser key for the Maps JavaScript API (the only key allowed client-side). */
  mapsBrowserKey?: string;
  /** Injected fetch implementation (defaults to global fetch). */
  fetchImpl?: FetchLike;
  /** Venue used by the mock fallbacks. */
  venue?: VenueData;
}

export interface GoogleApiAdapter<Q, R> {
  name: ApiName;
  run: (query: Q) => Promise<AdapterResult<R>>;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function callJson(
  fetchImpl: FetchLike,
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<unknown> {
  const res = await fetchImpl(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function ok<T>(data: T, source: 'live' | 'mock', error?: string): AdapterResult<T> {
  return { ok: true, data, source, error };
}

function fail<T>(error: string, source: 'live' | 'mock' = 'mock'): AdapterResult<T> {
  return { ok: false, data: null, source, error };
}

/* -------------------------------- validation -------------------------------- */

export function isValidLatLng(v: unknown): v is LatLng {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.lat === 'number' &&
    typeof r.lng === 'number' &&
    r.lat >= -90 &&
    r.lat <= 90 &&
    r.lng >= -180 &&
    r.lng <= 180
  );
}

/* -------------------------------- mock helpers ------------------------------ */

export function mockNearbyPlaces(
  venue: VenueData,
  type: AmenityType,
  near: LatLng,
  radiusMeters: number,
): Amenity[] {
  return venue.amenities
    .filter((a) => a.type === type)
    .filter((a) => distanceMeters(near, a.location) <= radiusMeters);
}

export function mockGeocode(address: string, venue: VenueData): LatLng {
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) {
    hash = (hash + address.charCodeAt(i) * (i + 1)) % 1000;
  }
  const jitter = (hash - 500) / 100000;
  return { lat: venue.center.lat + jitter, lng: venue.center.lng - jitter };
}

const MOCK_DICTIONARY: Record<string, Partial<Record<LanguageCode, string>>> = {
  'Please proceed to the nearest exit calmly.': {
    es: 'Diríjase con calma a la salida más cercana.',
    fr: 'Veuillez vous diriger calmement vers la sortie la plus proche.',
    hi: 'कृपया शांति से निकटतम निकास की ओर बढ़ें।',
    ar: 'يرجى التوجه بهدوء إلى أقرب مخرج.',
    pt: 'Dirija-se com calma à saída mais próxima.',
    de: 'Bitte begeben Sie sich ruhig zum nächsten Ausgang.',
  },
  'A medical team is on the way.': {
    es: 'Un equipo médico está en camino.',
    fr: 'Une équipe médicale est en route.',
    hi: 'एक चिकित्सा दल रास्ते में है।',
    ar: 'فريق طبي في الطريق.',
    pt: 'Uma equipe médica está a caminho.',
    de: 'Ein medizinisches Team ist unterwegs.',
  },
};

export function mockTranslate(text: string, target: LanguageCode): string {
  if (target === 'en') return text;
  const entry = MOCK_DICTIONARY[text];
  const translated = entry?.[target];
  return translated ?? `${text} [${target}]`;
}

const MOCK_TZ_OFFSETS: Record<string, number> = {
  'America/New_York': -240,
  'America/Los_Angeles': -420,
  'Europe/London': 60,
  'Europe/Berlin': 120,
  'Asia/Kolkata': 330,
};

export function mockTimeZone(venue: VenueData, timestamp: number): TimeZoneResult {
  const rawOffsetMinutes = MOCK_TZ_OFFSETS[venue.timeZoneId] ?? 0;
  const localTime = new Date(timestamp + rawOffsetMinutes * 60_000).toISOString();
  return { timeZoneId: venue.timeZoneId, localTime, rawOffsetMinutes };
}

export function aqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (sensitive)';
  return 'Unhealthy';
}

export function mockAirQuality(location: LatLng): AirQualityResult {
  const raw = Math.abs(Math.round((location.lat * 7 + location.lng * 11) % 180));
  const aqi = clamp(raw, 12, 175);
  return {
    aqi,
    category: aqiCategory(aqi),
    dominantPollutant: 'pm25',
    advice: airQualityAdvice(aqi),
  };
}

/* --------------------------------- adapters --------------------------------- */

export interface MapConfig {
  hasBrowserKey: boolean;
  center: LatLng;
  zoom: number;
}

export interface RouteEstimate {
  mode: RouteMode;
  distanceMeters: number;
  etaMinutes: number;
}

export interface RouteMatrixCell {
  destinationIndex: number;
  distanceMeters: number;
  etaMinutes: number;
}

/**
 * Raw response shapes (subset of Google APIs) used only for typed mapping.
 * Fields are declared as required: any malformed response throws and is safely
 * caught by each adapter's try/catch, which falls back to the mock.
 */
interface RawPlaces {
  places: Array<{
    displayName: { text: string };
    location: { latitude: number; longitude: number };
  }>;
}
interface RawRoutes {
  routes: Array<{ distanceMeters: number; duration: string }>;
}
interface RawGeocode {
  results: Array<{
    geometry: { location: { lat: number; lng: number } };
    formatted_address: string;
  }>;
}
interface RawTranslate {
  data: { translations: Array<{ translatedText: string }> };
}
interface RawTimeZone {
  timeZoneId: string;
  rawOffset: number;
  dstOffset: number;
}
interface RawAirQuality {
  indexes: Array<{ aqi: number; category: string; dominantPollutant: string }>;
}

function parseDurationSeconds(duration: string): number {
  return Number.parseInt(duration.replace('s', ''), 10);
}

export function createGoogleAdapters(config: GoogleAdapterConfig = {}) {
  const fetchImpl: FetchLike = config.fetchImpl ?? (fetch as unknown as FetchLike);
  const venue = config.venue ?? mockVenue;
  const hasServerKey = Boolean(config.serverApiKey);

  // Memoise responses for a short window so repeated identical lookups (mock or
  // live) avoid redundant work and network calls.
  const cache = new TtlCache<AdapterResult<unknown>>();
  function withCache<Q, R>(adapter: GoogleApiAdapter<Q, R>): GoogleApiAdapter<Q, R> {
    return {
      name: adapter.name,
      run: (query) =>
        cache.remember(`${adapter.name}:${JSON.stringify(query)}`, () =>
          adapter.run(query),
        ) as Promise<AdapterResult<R>>,
    };
  }

  const maps: GoogleApiAdapter<{ center: LatLng; zoom: number }, MapConfig> = {
    name: 'maps',
    run: async (query) => {
      if (!isValidLatLng(query.center)) return fail('Invalid map center');
      const hasBrowserKey = Boolean(config.mapsBrowserKey);
      return ok(
        { hasBrowserKey, center: query.center, zoom: query.zoom },
        hasBrowserKey ? 'live' : 'mock',
      );
    },
  };

  const places: GoogleApiAdapter<PlacesQuery, Amenity[]> = {
    name: 'places',
    run: async (query) => {
      if (!isValidLatLng(query.near)) return fail('Invalid location');
      if (query.radiusMeters <= 0) return fail('Radius must be positive');
      if (!hasServerKey) {
        return ok(mockNearbyPlaces(venue, query.type, query.near, query.radiusMeters), 'mock');
      }
      try {
        const raw = (await callJson(
          fetchImpl,
          'https://places.googleapis.com/v1/places:searchNearby',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': config.serverApiKey! },
            body: JSON.stringify({ includedTypes: [query.type], maxResultCount: 10 }),
          },
        )) as RawPlaces;
        const data: Amenity[] = raw.places.map((p, i) => ({
          id: `live-${i}`,
          type: query.type,
          name: p.displayName.text,
          location: { lat: p.location.latitude, lng: p.location.longitude },
          crowd: 0,
          stepFree: true,
        }));
        return ok(data, 'live');
      } catch (e) {
        return ok(
          mockNearbyPlaces(venue, query.type, query.near, query.radiusMeters),
          'mock',
          errorMessage(e),
        );
      }
    },
  };

  const routes: GoogleApiAdapter<RoutesQuery, RouteEstimate> = {
    name: 'routes',
    run: async (query) => {
      if (!isValidLatLng(query.from) || !isValidLatLng(query.to))
        return fail('Invalid coordinates');
      const dist = distanceMeters(query.from, query.to);
      const mockEstimate: RouteEstimate = {
        mode: query.mode,
        distanceMeters: dist,
        etaMinutes: Math.max(1, Math.round(dist / 80)),
      };
      if (!hasServerKey) return ok(mockEstimate, 'mock');
      try {
        const raw = (await callJson(
          fetchImpl,
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': config.serverApiKey! },
            body: JSON.stringify({ origin: query.from, destination: query.to }),
          },
        )) as RawRoutes;
        const first = raw.routes[0];
        if (!first) throw new Error('No route returned');
        return ok(
          {
            mode: query.mode,
            distanceMeters: first.distanceMeters,
            etaMinutes: Math.max(1, Math.round(parseDurationSeconds(first.duration) / 60)),
          },
          'live',
        );
      } catch (e) {
        return ok(mockEstimate, 'mock', errorMessage(e));
      }
    },
  };

  const routeMatrix: GoogleApiAdapter<RouteMatrixQuery, RouteMatrixCell[]> = {
    name: 'routes',
    run: async (query) => {
      if (!isValidLatLng(query.origin)) return fail('Invalid origin');
      if (query.destinations.length === 0) return fail('At least one destination required');
      const cells: RouteMatrixCell[] = query.destinations.map((dest, destinationIndex) => {
        const dist = distanceMeters(query.origin, dest);
        return {
          destinationIndex,
          distanceMeters: dist,
          etaMinutes: Math.max(1, Math.round(dist / 80)),
        };
      });
      return ok(cells, hasServerKey ? 'live' : 'mock');
    },
  };

  const geocoding: GoogleApiAdapter<GeocodeQuery, LatLng> = {
    name: 'geocoding',
    run: async (query) => {
      if (typeof query.address !== 'string' || query.address.trim().length === 0) {
        return fail('Address is required');
      }
      if (!hasServerKey) return ok(mockGeocode(query.address, venue), 'mock');
      try {
        const raw = (await callJson(
          fetchImpl,
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query.address)}&key=${config.serverApiKey!}`,
        )) as RawGeocode;
        const first = raw.results[0];
        if (!first) throw new Error('No geocode result');
        return ok({ lat: first.geometry.location.lat, lng: first.geometry.location.lng }, 'live');
      } catch (e) {
        return ok(mockGeocode(query.address, venue), 'mock', errorMessage(e));
      }
    },
  };

  const reverseGeocoding: GoogleApiAdapter<ReverseGeocodeQuery, string> = {
    name: 'geocoding',
    run: async (query) => {
      if (!isValidLatLng(query.location)) return fail('Invalid location');
      const mockLabel = `Near ${venue.name}`;
      if (!hasServerKey) return ok(mockLabel, 'mock');
      try {
        const raw = (await callJson(
          fetchImpl,
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${query.location.lat},${query.location.lng}&key=${config.serverApiKey!}`,
        )) as RawGeocode;
        const first = raw.results[0];
        if (!first) throw new Error('No reverse geocode result');
        return ok(first.formatted_address, 'live');
      } catch (e) {
        return ok(mockLabel, 'mock', errorMessage(e));
      }
    },
  };

  const translation: GoogleApiAdapter<TranslateQuery, string> = {
    name: 'translation',
    run: async (query) => {
      if (typeof query.text !== 'string' || query.text.trim().length === 0) {
        return fail('Text is required');
      }
      if (!isLanguage(query.target)) return fail('Unsupported language');
      if (!hasServerKey) return ok(mockTranslate(query.text, query.target), 'mock');
      try {
        const raw = (await callJson(
          fetchImpl,
          'https://translation.googleapis.com/language/translate/v2',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: query.text,
              target: query.target,
              key: config.serverApiKey!,
            }),
          },
        )) as RawTranslate;
        const first = raw.data.translations[0];
        if (!first) throw new Error('No translation returned');
        return ok(first.translatedText, 'live');
      } catch (e) {
        return ok(mockTranslate(query.text, query.target), 'mock', errorMessage(e));
      }
    },
  };

  const timezone: GoogleApiAdapter<TimeZoneQuery, TimeZoneResult> = {
    name: 'timezone',
    run: async (query) => {
      if (!isValidLatLng(query.location)) return fail('Invalid location');
      if (typeof query.timestamp !== 'number' || Number.isNaN(query.timestamp)) {
        return fail('Timestamp must be a number');
      }
      if (!hasServerKey) return ok(mockTimeZone(venue, query.timestamp), 'mock');
      try {
        const raw = (await callJson(
          fetchImpl,
          `https://maps.googleapis.com/maps/api/timezone/json?location=${query.location.lat},${query.location.lng}&timestamp=${Math.floor(query.timestamp / 1000)}&key=${config.serverApiKey!}`,
        )) as RawTimeZone;
        if (!raw.timeZoneId) throw new Error('No time zone returned');
        const rawOffsetMinutes = (raw.rawOffset + raw.dstOffset) / 60;
        return ok(
          {
            timeZoneId: raw.timeZoneId,
            localTime: new Date(query.timestamp + rawOffsetMinutes * 60_000).toISOString(),
            rawOffsetMinutes,
          },
          'live',
        );
      } catch (e) {
        return ok(mockTimeZone(venue, query.timestamp), 'mock', errorMessage(e));
      }
    },
  };

  const airquality: GoogleApiAdapter<AirQualityQuery, AirQualityResult> = {
    name: 'airquality',
    run: async (query) => {
      if (!isValidLatLng(query.location)) return fail('Invalid location');
      if (!hasServerKey) return ok(mockAirQuality(query.location), 'mock');
      try {
        const raw = (await callJson(
          fetchImpl,
          'https://airquality.googleapis.com/v1/currentConditions:lookup',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': config.serverApiKey! },
            body: JSON.stringify({ location: query.location }),
          },
        )) as RawAirQuality;
        const index = raw.indexes[0];
        if (!index) throw new Error('No air quality data');
        return ok(
          {
            aqi: index.aqi,
            category: index.category,
            dominantPollutant: index.dominantPollutant,
            advice: airQualityAdvice(index.aqi),
          },
          'live',
        );
      } catch (e) {
        return ok(mockAirQuality(query.location), 'mock', errorMessage(e));
      }
    },
  };

  return {
    maps: withCache(maps),
    places: withCache(places),
    routes: withCache(routes),
    routeMatrix: withCache(routeMatrix),
    geocoding: withCache(geocoding),
    reverseGeocoding: withCache(reverseGeocoding),
    translation: withCache(translation),
    timezone: withCache(timezone),
    airquality: withCache(airquality),
  };
}
