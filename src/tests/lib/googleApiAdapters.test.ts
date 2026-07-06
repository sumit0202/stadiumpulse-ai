import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aqiCategory,
  createGoogleAdapters,
  errorMessage,
  isValidLatLng,
  mockAirQuality,
  mockGeocode,
  mockNearbyPlaces,
  mockTimeZone,
  mockTranslate,
  type FetchLike,
} from '../../lib/googleApiAdapters';
import { mockVenue } from '../../data/mockVenue';
import type { VenueData } from '../../types';

const center = mockVenue.center;

function fakeFetch(ok: boolean, status: number, data: unknown): FetchLike {
  return async () => ({ ok, status, json: async () => data });
}

const throwingFetch: FetchLike = async () => {
  throw new Error('network down');
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('errorMessage', () => {
  it('handles Error and non-Error values', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain')).toBe('plain');
  });
});

describe('isValidLatLng', () => {
  it('rejects invalid shapes and accepts valid ones', () => {
    expect(isValidLatLng('x')).toBe(false);
    expect(isValidLatLng(null)).toBe(false);
    expect(isValidLatLng(undefined)).toBe(false);
    expect(isValidLatLng({ lat: 'a', lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: 'b' })).toBe(false);
    expect(isValidLatLng({ lat: -100, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 100, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: -200 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: 200 })).toBe(false);
    expect(isValidLatLng({ lat: 40, lng: -74 })).toBe(true);
  });

  it('accepts the exact coordinate boundaries', () => {
    expect(isValidLatLng({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidLatLng({ lat: -90, lng: -180 })).toBe(true);
  });
});

describe('mock helpers', () => {
  it('finds nearby places within radius only', () => {
    expect(mockNearbyPlaces(mockVenue, 'restroom', center, 100_000).length).toBeGreaterThan(0);
    expect(mockNearbyPlaces(mockVenue, 'restroom', { lat: 0, lng: 0 }, 10)).toEqual([]);
  });

  it('geocodes deterministically near the venue', () => {
    const a = mockGeocode('Main Gate', mockVenue);
    const b = mockGeocode('Main Gate', mockVenue);
    expect(a).toEqual(b);
  });

  it('translates via dictionary, passthrough for english and fallback tag', () => {
    expect(mockTranslate('A medical team is on the way.', 'es')).toMatch(/equipo médico/);
    expect(mockTranslate('Anything', 'en')).toBe('Anything');
    expect(mockTranslate('Unknown phrase', 'de')).toBe('Unknown phrase [de]');
  });

  it('returns time zone offsets for known and unknown zones', () => {
    expect(mockTimeZone(mockVenue, 0).rawOffsetMinutes).toBe(-240);
    const other: VenueData = { ...mockVenue, timeZoneId: 'Mars/Olympus' };
    expect(mockTimeZone(other, 0).rawOffsetMinutes).toBe(0);
  });

  it('categorises AQI across all bands', () => {
    expect(aqiCategory(10)).toBe('Good');
    expect(aqiCategory(80)).toBe('Moderate');
    expect(aqiCategory(130)).toBe('Unhealthy (sensitive)');
    expect(aqiCategory(200)).toBe('Unhealthy');
    expect(mockAirQuality(center).aqi).toBeGreaterThan(0);
  });
});

describe('maps adapter', () => {
  it('rejects invalid center', async () => {
    const { maps } = createGoogleAdapters();
    const r = await maps.run({ center: { lat: 999, lng: 0 }, zoom: 15 });
    expect(r.ok).toBe(false);
  });

  it('is live with a browser key and mock without', async () => {
    expect(
      (await createGoogleAdapters({ mapsBrowserKey: 'k' }).maps.run({ center, zoom: 15 })).source,
    ).toBe('live');
    expect((await createGoogleAdapters().maps.run({ center, zoom: 15 })).source).toBe('mock');
  });
});

describe('adapter response caching', () => {
  it('serves repeated identical lookups from cache without re-fetching', async () => {
    let calls = 0;
    const countingFetch: FetchLike = async () => {
      calls += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ results: [{ geometry: { location: { lat: 1, lng: 2 } } }] }),
      };
    };
    const { geocoding } = createGoogleAdapters({ serverApiKey: 'k', fetchImpl: countingFetch });
    const first = await geocoding.run({ address: 'Stadium' });
    const second = await geocoding.run({ address: 'Stadium' });
    expect(calls).toBe(1);
    expect(second).toEqual(first);
    await geocoding.run({ address: 'Different place' });
    expect(calls).toBe(2);
  });
});

describe('places adapter', () => {
  it('validates location and radius', async () => {
    const { places } = createGoogleAdapters();
    expect(
      (await places.run({ near: { lat: 999, lng: 0 }, type: 'restroom', radiusMeters: 100 })).ok,
    ).toBe(false);
    expect((await places.run({ near: center, type: 'restroom', radiusMeters: 0 })).ok).toBe(false);
    expect((await places.run({ near: center, type: 'restroom', radiusMeters: -5 })).ok).toBe(false);
  });

  it('returns mock places without a key', async () => {
    const { places } = createGoogleAdapters({ venue: mockVenue });
    const r = await places.run({ near: center, type: 'restroom', radiusMeters: 100_000 });
    expect(r.source).toBe('mock');
    expect(r.data?.length).toBeGreaterThan(0);
  });

  it('maps live places', async () => {
    const { places } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, {
        places: [{ displayName: { text: 'Cafe' }, location: { latitude: 1, longitude: 2 } }],
      }),
    });
    const r = await places.run({ near: center, type: 'food', radiusMeters: 100 });
    expect(r.source).toBe('live');
    expect(r.data?.[0]?.name).toBe('Cafe');
  });

  it('falls back to mock on a live error', async () => {
    const { places } = createGoogleAdapters({ serverApiKey: 'k', fetchImpl: throwingFetch });
    const r = await places.run({ near: center, type: 'restroom', radiusMeters: 100_000 });
    expect(r.source).toBe('mock');
    expect(r.error).toContain('network');
  });
});

describe('routes adapter', () => {
  const from = center;
  const to = { lat: center.lat + 0.01, lng: center.lng };

  it('validates coordinates', async () => {
    const { routes } = createGoogleAdapters();
    expect((await routes.run({ from: { lat: 999, lng: 0 }, to, mode: 'fastest' })).ok).toBe(false);
  });

  it('returns a mock estimate without a key', async () => {
    const { routes } = createGoogleAdapters();
    expect((await routes.run({ from, to, mode: 'fastest' })).source).toBe('mock');
  });

  it('maps a live route', async () => {
    const { routes } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { routes: [{ distanceMeters: 500, duration: '600s' }] }),
    });
    const r = await routes.run({ from, to, mode: 'fastest' });
    expect(r.source).toBe('live');
    expect(r.data?.etaMinutes).toBe(10);
  });

  it('falls back when no route is returned', async () => {
    const { routes } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { routes: [] }),
    });
    expect((await routes.run({ from, to, mode: 'fastest' })).source).toBe('mock');
  });

  it('falls back on non-200 responses', async () => {
    const { routes } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(false, 500, {}),
    });
    const r = await routes.run({ from, to, mode: 'fastest' });
    expect(r.source).toBe('mock');
    expect(r.error).toContain('500');
  });
});

describe('routeMatrix adapter', () => {
  it('validates origin and destinations', async () => {
    const { routeMatrix } = createGoogleAdapters();
    expect(
      (await routeMatrix.run({ origin: { lat: 999, lng: 0 }, destinations: [center] })).ok,
    ).toBe(false);
    expect((await routeMatrix.run({ origin: center, destinations: [] })).ok).toBe(false);
  });

  it('computes a matrix (live flag with key)', async () => {
    const withKey = createGoogleAdapters({ serverApiKey: 'k' });
    const r = await withKey.routeMatrix.run({
      origin: center,
      destinations: [center, { lat: 1, lng: 1 }],
    });
    expect(r.source).toBe('live');
    expect(r.data?.length).toBe(2);
  });

  it('computes a matrix in mock mode without a key', async () => {
    const r = await createGoogleAdapters().routeMatrix.run({
      origin: center,
      destinations: [center],
    });
    expect(r.source).toBe('mock');
    expect(r.data?.length).toBe(1);
  });
});

describe('geocoding adapter', () => {
  it('requires an address', async () => {
    const { geocoding } = createGoogleAdapters();
    expect((await geocoding.run({ address: '   ' })).ok).toBe(false);
  });

  it('returns mock coordinates without a key', async () => {
    expect((await createGoogleAdapters().geocoding.run({ address: 'Main St' })).source).toBe(
      'mock',
    );
  });

  it('maps a live geocode', async () => {
    const { geocoding } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, {
        results: [{ geometry: { location: { lat: 5, lng: 6 } } }],
      }),
    });
    const r = await geocoding.run({ address: 'Main St' });
    expect(r.data).toEqual({ lat: 5, lng: 6 });
  });

  it('falls back when no results', async () => {
    const { geocoding } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { results: [] }),
    });
    expect((await geocoding.run({ address: 'Main St' })).source).toBe('mock');
  });
});

describe('reverse geocoding adapter', () => {
  it('validates location', async () => {
    expect(
      (await createGoogleAdapters().reverseGeocoding.run({ location: { lat: 999, lng: 0 } })).ok,
    ).toBe(false);
  });

  it('returns a mock label without a key', async () => {
    expect((await createGoogleAdapters().reverseGeocoding.run({ location: center })).data).toMatch(
      /Near/,
    );
  });

  it('maps a live address', async () => {
    const { reverseGeocoding } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { results: [{ formatted_address: '1 Stadium Way' }] }),
    });
    expect((await reverseGeocoding.run({ location: center })).data).toBe('1 Stadium Way');
  });

  it('falls back when no results', async () => {
    const { reverseGeocoding } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { results: [] }),
    });
    expect((await reverseGeocoding.run({ location: center })).source).toBe('mock');
  });
});

describe('translation adapter', () => {
  it('validates text and target', async () => {
    const { translation } = createGoogleAdapters();
    expect((await translation.run({ text: '', target: 'es' })).ok).toBe(false);
    expect((await translation.run({ text: 'hi', target: 'zz' as never })).ok).toBe(false);
  });

  it('returns a mock translation without a key', async () => {
    expect(
      (await createGoogleAdapters().translation.run({ text: 'Hello', target: 'de' })).source,
    ).toBe('mock');
  });

  it('maps a live translation', async () => {
    const { translation } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { data: { translations: [{ translatedText: 'Hallo' }] } }),
    });
    expect((await translation.run({ text: 'Hello', target: 'de' })).data).toBe('Hallo');
  });

  it('falls back when no translation', async () => {
    const { translation } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { data: { translations: [] } }),
    });
    expect((await translation.run({ text: 'Hello', target: 'de' })).source).toBe('mock');
  });
});

describe('timezone adapter', () => {
  it('validates location and timestamp', async () => {
    const { timezone } = createGoogleAdapters();
    expect((await timezone.run({ location: { lat: 999, lng: 0 }, timestamp: 0 })).ok).toBe(false);
    expect((await timezone.run({ location: center, timestamp: Number.NaN })).ok).toBe(false);
  });

  it('returns a mock time zone without a key', async () => {
    expect(
      (await createGoogleAdapters().timezone.run({ location: center, timestamp: 0 })).source,
    ).toBe('mock');
  });

  it('maps a live time zone', async () => {
    const { timezone } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, {
        timeZoneId: 'America/New_York',
        rawOffset: -18000,
        dstOffset: 3600,
      }),
    });
    const r = await timezone.run({ location: center, timestamp: 0 });
    expect(r.data?.rawOffsetMinutes).toBe(-240);
  });

  it('falls back when time zone missing', async () => {
    const { timezone } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, {}),
    });
    expect((await timezone.run({ location: center, timestamp: 0 })).source).toBe('mock');
  });
});

describe('air quality adapter', () => {
  it('validates location', async () => {
    expect(
      (await createGoogleAdapters().airquality.run({ location: { lat: 999, lng: 0 } })).ok,
    ).toBe(false);
  });

  it('returns mock air quality without a key', async () => {
    expect((await createGoogleAdapters().airquality.run({ location: center })).source).toBe('mock');
  });

  it('maps live air quality using the global fetch default', async () => {
    // No fetchImpl provided -> exercises the `fetch as FetchLike` default branch.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ indexes: [{ aqi: 42, category: 'Good', dominantPollutant: 'pm25' }] }),
      })),
    );
    const { airquality } = createGoogleAdapters({ serverApiKey: 'k' });
    const r = await airquality.run({ location: center });
    expect(r.source).toBe('live');
    expect(r.data?.aqi).toBe(42);
  });

  it('falls back when no air quality data', async () => {
    const { airquality } = createGoogleAdapters({
      serverApiKey: 'k',
      fetchImpl: fakeFetch(true, 200, { indexes: [] }),
    });
    expect((await airquality.run({ location: center })).source).toBe('mock');
  });
});
