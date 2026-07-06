import type { TransportOption } from '../types';

/** Simulated transport comparison matrix for demo mode. */
export const mockTransport: TransportOption[] = [
  {
    mode: 'walk',
    label: 'Walk to transit hub',
    etaMinutes: 18,
    queueMinutes: 0,
    co2Grams: 0,
    crowd: 'yellow',
  },
  {
    mode: 'shuttle',
    label: 'Official shuttle',
    etaMinutes: 22,
    queueMinutes: 12,
    co2Grams: 380,
    crowd: 'orange',
  },
  {
    mode: 'transit',
    label: 'Metro line + rail',
    etaMinutes: 28,
    queueMinutes: 6,
    co2Grams: 210,
    crowd: 'yellow',
  },
  {
    mode: 'rideshare',
    label: 'Rideshare pickup',
    etaMinutes: 25,
    queueMinutes: 20,
    co2Grams: 1400,
    crowd: 'red',
  },
  {
    mode: 'parking',
    label: 'Self-park lot exit',
    etaMinutes: 35,
    queueMinutes: 28,
    co2Grams: 1900,
    crowd: 'red',
  },
];
