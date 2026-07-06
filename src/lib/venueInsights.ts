import {
  computeSustainabilityScore,
  lowestCarbonOption,
  sustainabilityBreakdown,
  type SustainabilityBreakdown,
} from './sustainability';
import { mockAirQuality } from './googleApiAdapters';
import { getCrowd, getTransport, getVenue } from '../data/dataSource';
import type { AirQualityResult, SustainabilityInput, TransportOption } from '../types';

/** Assumed refill/recycling compliance for the demo venue (documented in the README). */
const WATER_REFILL_USAGE = 62;
const RECYCLING_COMPLIANCE = 71;

/** Selectable locations (gates + amenities) shared by the navigation and accessibility planners. */
export const venueNodes: ReadonlyArray<{ id: string; name: string }> = [
  ...getVenue().gates.map((g) => ({ id: g.id, name: g.name })),
  ...getVenue().amenities.map((a) => ({ id: a.id, name: a.name })),
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
  const transport = getTransport();
  const crowd = getCrowd();
  const co2Average = transport.reduce((sum, t) => sum + t.co2Grams, 0) / transport.length;
  const crowdAverage = crowd.zones.reduce((sum, z) => sum + z.density, 0) / crowd.zones.length;
  const air = mockAirQuality(getVenue().center);
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
    greenest: lowestCarbonOption(transport),
    crowdEnergyLoad: Math.round(crowdAverage),
  };
}
