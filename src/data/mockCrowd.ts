import type { CrowdSnapshot } from '../types';

/** Simulated live crowd signals for demo mode. */
export const mockCrowd: CrowdSnapshot = {
  capturedAt: '2026-06-15T18:30:00.000Z',
  postMatchExitWave: 82,
  zones: [
    {
      id: 'zone-north',
      name: 'North Concourse',
      level: 'red',
      density: 88,
      trend: 6,
      hasMedicalIncident: true,
    },
    {
      id: 'zone-east',
      name: 'East Concourse',
      level: 'orange',
      density: 74,
      trend: 3,
      hasMedicalIncident: false,
    },
    {
      id: 'zone-south',
      name: 'South Concourse',
      level: 'yellow',
      density: 58,
      trend: -2,
      hasMedicalIncident: false,
    },
    {
      id: 'zone-west',
      name: 'West Concourse',
      level: 'green',
      density: 34,
      trend: -4,
      hasMedicalIncident: false,
    },
  ],
};
