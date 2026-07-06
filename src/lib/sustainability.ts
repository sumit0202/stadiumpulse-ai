import { clamp } from './decisionEngine';
import type { SustainabilityInput, TransportOption } from '../types';

export interface SustainabilityBreakdown {
  transport: number;
  water: number;
  recycling: number;
  energy: number;
  air: number;
}

/** Reference worst-case CO2 grams used to normalise the transport factor. */
const MAX_CO2_GRAMS = 2000;
/** Reference worst-case AQI used to normalise the air factor. */
const MAX_AQI = 300;

/**
 * Break a sustainability input into normalised 0-100 sub-scores (higher = better).
 * All inputs are clamped so out-of-range mock or live data cannot skew the score.
 */
export function sustainabilityBreakdown(input: SustainabilityInput): SustainabilityBreakdown {
  const transport = 100 - clamp((input.transportCo2Grams / MAX_CO2_GRAMS) * 100, 0, 100);
  const water = clamp(input.waterRefillUsage, 0, 100);
  const recycling = clamp(input.recyclingCompliance, 0, 100);
  const energy = 100 - clamp(input.crowdEnergyLoad, 0, 100);
  const air = 100 - clamp((input.airQualityIndex / MAX_AQI) * 100, 0, 100);
  return { transport, water, recycling, energy, air };
}

/**
 * Weighted sustainability score (0-100). Pure function, fully covered by tests.
 */
export function computeSustainabilityScore(input: SustainabilityInput): number {
  const b = sustainabilityBreakdown(input);
  const score =
    b.transport * 0.3 + b.water * 0.15 + b.recycling * 0.2 + b.energy * 0.15 + b.air * 0.2;
  return Math.round(clamp(score, 0, 100));
}

/** Pick the transport option with the lowest per-passenger CO2. */
export function lowestCarbonOption(transport: TransportOption[]): TransportOption | null {
  if (transport.length === 0) return null;
  return [...transport].sort((a, b) => a.co2Grams - b.co2Grams)[0]!;
}

/** Convert an AQI value into an accessibility/health-aware advisory string. */
export function airQualityAdvice(aqi: number): string {
  if (aqi <= 50) return 'Air quality is good. Outdoor queuing is fine for all fans.';
  if (aqi <= 100) return 'Air quality is moderate. Offer shaded waiting areas for sensitive fans.';
  if (aqi <= 150)
    return 'Unhealthy for sensitive groups. Move seniors and respiratory-sensitive fans indoors and provide water.';
  return 'Unhealthy air. Minimise outdoor exposure, open cooled indoor waiting zones, and prioritise accessible transport.';
}
