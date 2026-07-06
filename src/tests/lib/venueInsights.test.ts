import { describe, expect, it } from 'vitest';
import { getVenueSustainability, venueNodes } from '../../lib/venueInsights';
import { mockVenue } from '../../data/mockVenue';

describe('venueInsights', () => {
  it('exposes every gate and amenity as a selectable node', () => {
    expect(venueNodes).toHaveLength(mockVenue.gates.length + mockVenue.amenities.length);
    expect(venueNodes.every((n) => n.id.length > 0 && n.name.length > 0)).toBe(true);
  });

  it('derives a bounded sustainability snapshot from the mock venue', () => {
    const insight = getVenueSustainability();
    expect(insight.score).toBeGreaterThanOrEqual(0);
    expect(insight.score).toBeLessThanOrEqual(100);
    expect(insight.air.aqi).toBeGreaterThan(0);
    expect(insight.greenest).not.toBeNull();
    expect(insight.crowdEnergyLoad).toBe(Math.round(insight.input.crowdEnergyLoad));
    expect(insight.breakdown.transport).toBeGreaterThanOrEqual(0);
  });
});
