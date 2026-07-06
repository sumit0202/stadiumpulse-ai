import { describe, expect, it } from 'vitest';
import { getCrowd, getIncidents, getTransport, getVenue } from '../../data/dataSource';
import { mockVenue } from '../../data/mockVenue';
import { mockCrowd } from '../../data/mockCrowd';
import { mockTransport } from '../../data/mockTransport';
import { mockIncidents } from '../../data/mockIncidents';

describe('data source seam', () => {
  it('returns the venue fixture in demo mode', () => {
    expect(getVenue()).toBe(mockVenue);
    expect(getVenue().gates.length).toBeGreaterThan(0);
  });

  it('returns the crowd snapshot in demo mode', () => {
    expect(getCrowd()).toBe(mockCrowd);
    expect(getCrowd().zones.length).toBeGreaterThan(0);
  });

  it('returns transport options in demo mode', () => {
    expect(getTransport()).toBe(mockTransport);
    expect(getTransport().length).toBeGreaterThan(0);
  });

  it('returns incidents in demo mode', () => {
    expect(getIncidents()).toBe(mockIncidents);
  });
});
