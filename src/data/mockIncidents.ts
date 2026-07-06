import type { Incident } from '../types';

/** Seed incidents for demo mode. Contains no personal data. */
export const mockIncidents: Incident[] = [
  {
    id: 'inc-1001',
    type: 'medical',
    zoneId: 'zone-north',
    description: 'Fan reporting heat exhaustion near north concourse.',
    severity: 'high',
    createdAt: '2026-06-15T18:12:00.000Z',
  },
  {
    id: 'inc-1002',
    type: 'queue-overflow',
    zoneId: 'zone-east',
    description: 'Concession queue spilling into walkway.',
    severity: 'medium',
    createdAt: '2026-06-15T18:20:00.000Z',
  },
  {
    id: 'inc-1003',
    type: 'accessibility',
    zoneId: 'zone-south',
    description: 'Step-free lift requested at south entrance.',
    severity: 'medium',
    createdAt: '2026-06-15T18:24:00.000Z',
  },
];
