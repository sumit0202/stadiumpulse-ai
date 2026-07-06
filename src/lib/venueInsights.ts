import {
  computeSustainabilityScore,
  lowestCarbonOption,
  sustainabilityBreakdown,
  type SustainabilityBreakdown,
} from './sustainability';
import { mockAirQuality } from './googleApiAdapters';
import { mockVenue } from '../data/mockVenue';
import { mockCrowd } from '../data/mockCrowd';
import { mockTransport } from '../data/mockTransport';
import type { AirQualityResult, SustainabilityInput, TransportOption } from '../types';

/** Assumed refill/recycling compliance for the demo venue (documented in the README). */
const WATER_REFILL_USAGE = 62;
const RECYCLING_COMPLIANCE = 71;

/** Selectable locations (gates + amenities) shared by the navigation and accessibility planners. */
export const venueNodes: ReadonlyArray<{ id: string; name: string }> = [
  ...mockVenue.gates.map((g) => ({ id: g.id, name: g.name })),
  ...mockVenue.amenities.map((a) => ({ id: a.id, name: a.name })),
];

export interface VenueSustainability {
  input: SustainabilityInput;
  score: number;
  breakdown: SustainabilityBreakdown;
  air: AirQualityResult;
  greenest: TransportOption | null;
  crowdEnergyLoad: number;
}

/**
 * Derive the venue-wide sustainability snapshot shared by the dashboard and the
 * sustainability view, so the (identical) input assembly lives in exactly one place.
 */
export function getVenueSustainability(): VenueSustainability {
  const co2Average = mockTransport.reduce((sum, t) => sum + t.co2Grams, 0) / mockTransport.length;
  const crowdAverage =
    mockCrowd.zones.reduce((sum, z) => sum + z.density, 0) / mockCrowd.zones.length;
  const air = mockAirQuality(mockVenue.center);
  const input: SustainabilityInput = {
    transportCo2Grams: co2Average,
    waterRefillUsage: WATER_REFILL_USAGE,
    recyclingCompliance: RECYCLING_COMPLIANCE,
    crowdEnergyLoad: crowdAverage,
    airQualityIndex: air.aqi,
  };
  return {
    input,
    score: computeSustainabilityScore(input),
    breakdown: sustainabilityBreakdown(input),
    air,
    greenest: lowestCarbonOption(mockTransport),
    crowdEnergyLoad: Math.round(crowdAverage),
  };
}
