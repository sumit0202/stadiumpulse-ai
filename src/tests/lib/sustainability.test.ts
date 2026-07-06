import { describe, expect, it } from 'vitest';
import {
  airQualityAdvice,
  computeSustainabilityScore,
  lowestCarbonOption,
  sustainabilityBreakdown,
} from '../../lib/sustainability';
import type { SustainabilityInput, TransportOption } from '../../types';

const best: SustainabilityInput = {
  transportCo2Grams: 0,
  waterRefillUsage: 100,
  recyclingCompliance: 100,
  crowdEnergyLoad: 0,
  airQualityIndex: 0,
};

const worst: SustainabilityInput = {
  transportCo2Grams: 5000,
  waterRefillUsage: -20,
  recyclingCompliance: 200,
  crowdEnergyLoad: 150,
  airQualityIndex: 900,
};

describe('sustainabilityBreakdown', () => {
  it('clamps sub-scores into range', () => {
    const b = sustainabilityBreakdown(worst);
    expect(b.transport).toBe(0);
    expect(b.water).toBe(0);
    expect(b.recycling).toBe(100);
    expect(b.energy).toBe(0);
    expect(b.air).toBe(0);
  });
});

describe('computeSustainabilityScore', () => {
  it('scores a perfect input as 100', () => {
    expect(computeSustainabilityScore(best)).toBe(100);
  });

  it('scores a worst-case input as 20 (recycling only)', () => {
    // Only recycling contributes: 100 * 0.2 = 20.
    expect(computeSustainabilityScore(worst)).toBe(20);
  });
});

describe('lowestCarbonOption', () => {
  it('returns null for an empty list', () => {
    expect(lowestCarbonOption([])).toBeNull();
  });

  it('picks the lowest-carbon option', () => {
    const options: TransportOption[] = [
      {
        mode: 'rideshare',
        label: 'R',
        etaMinutes: 10,
        queueMinutes: 5,
        co2Grams: 1400,
        crowd: 'red',
      },
      { mode: 'walk', label: 'W', etaMinutes: 20, queueMinutes: 0, co2Grams: 0, crowd: 'green' },
    ];
    expect(lowestCarbonOption(options)?.mode).toBe('walk');
  });
});

describe('airQualityAdvice', () => {
  it('covers all AQI bands', () => {
    expect(airQualityAdvice(30)).toMatch(/good/i);
    expect(airQualityAdvice(80)).toMatch(/moderate/i);
    expect(airQualityAdvice(130)).toMatch(/sensitive/i);
    expect(airQualityAdvice(200)).toMatch(/Unhealthy air/i);
  });
});
