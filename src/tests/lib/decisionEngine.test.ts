import { describe, expect, it } from 'vitest';
import {
  classifyCrowd,
  clamp,
  computeKpis,
  crowdLevelToRisk,
  distanceMeters,
  generateDecisionCards,
  nextStepForIncident,
  planRoute,
  predictCongestion,
  recommendAddVolunteers,
  recommendExitGuidance,
  recommendMultilingualAlert,
  recommendOpenAlternateGate,
  recommendRedirectFans,
  recommendShuttleReroute,
  recommendStaffDispatch,
  severityForIncident,
} from '../../lib/decisionEngine';
import { mockVenue } from '../../data/mockVenue';
import { mockCrowd } from '../../data/mockCrowd';
import { mockIncidents } from '../../data/mockIncidents';
import { mockTransport } from '../../data/mockTransport';
import type { CrowdSnapshot, TransportOption, VenueData } from '../../types';

const calmVenue: VenueData = {
  ...mockVenue,
  gates: [
    {
      id: 'g1',
      name: 'G1',
      location: { lat: 0, lng: 0 },
      pressure: 30,
      open: true,
      stepFree: true,
    },
    {
      id: 'g2',
      name: 'G2',
      location: { lat: 0, lng: 0 },
      pressure: 40,
      open: true,
      stepFree: true,
    },
  ],
};

const busyNoAlternate: VenueData = {
  ...mockVenue,
  gates: [
    {
      id: 'g1',
      name: 'G1',
      location: { lat: 0, lng: 0 },
      pressure: 90,
      open: true,
      stepFree: true,
    },
    {
      id: 'g2',
      name: 'G2',
      location: { lat: 0, lng: 0 },
      pressure: 70,
      open: true,
      stepFree: true,
    },
  ],
};

const busyWithStepFreeAlternate: VenueData = {
  ...mockVenue,
  gates: [
    {
      id: 'g1',
      name: 'G1',
      location: { lat: 0, lng: 0 },
      pressure: 95,
      open: true,
      stepFree: true,
    },
    {
      id: 'g2',
      name: 'G2',
      location: { lat: 0, lng: 0 },
      pressure: 20,
      open: true,
      stepFree: false,
    },
  ],
};

const calmCrowd: CrowdSnapshot = {
  capturedAt: 'now',
  postMatchExitWave: 10,
  zones: [
    { id: 'z1', name: 'Z1', level: 'green', density: 20, trend: -1, hasMedicalIncident: false },
    { id: 'z2', name: 'Z2', level: 'yellow', density: 55, trend: 0, hasMedicalIncident: false },
  ],
};

describe('math helpers', () => {
  it('clamps values including exact boundaries', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('computes distance and zero for same point', () => {
    expect(distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
    expect(distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeGreaterThan(100_000);
  });
});

describe('crowd classification', () => {
  it('maps density to levels', () => {
    expect(classifyCrowd(90)).toBe('red');
    expect(classifyCrowd(75)).toBe('orange');
    expect(classifyCrowd(55)).toBe('yellow');
    expect(classifyCrowd(10)).toBe('green');
  });

  it('classifies exactly at each threshold boundary', () => {
    expect(classifyCrowd(85)).toBe('red');
    expect(classifyCrowd(84)).toBe('orange');
    expect(classifyCrowd(70)).toBe('orange');
    expect(classifyCrowd(69)).toBe('yellow');
    expect(classifyCrowd(50)).toBe('yellow');
    expect(classifyCrowd(49)).toBe('green');
    expect(classifyCrowd(0)).toBe('green');
  });

  it('maps levels to risk', () => {
    expect(crowdLevelToRisk('green')).toBe('low');
    expect(crowdLevelToRisk('red')).toBe('critical');
  });

  it('predicts congestion direction with clamping', () => {
    const rising = {
      id: 'a',
      name: 'A',
      level: 'red' as const,
      density: 90,
      trend: 10,
      hasMedicalIncident: false,
    };
    const falling = {
      id: 'b',
      name: 'B',
      level: 'green' as const,
      density: 40,
      trend: -4,
      hasMedicalIncident: false,
    };
    const steady = {
      id: 'c',
      name: 'C',
      level: 'green' as const,
      density: 40,
      trend: 0,
      hasMedicalIncident: false,
    };
    expect(predictCongestion(rising, 15).direction).toBe('rising');
    expect(predictCongestion(rising, 15).projectedLevel).toBe('red');
    expect(predictCongestion(falling, 15).direction).toBe('falling');
    expect(predictCongestion(steady, 15).direction).toBe('steady');
  });
});

describe('computeKpis', () => {
  it('computes KPIs for the mock venue', () => {
    const kpis = computeKpis(mockVenue, mockCrowd, mockIncidents, mockTransport, 80);
    expect(kpis.incidentCount).toBe(mockIncidents.length);
    expect(kpis.sustainabilityScore).toBe(80);
    expect(kpis.accessibleRouteAvailability).toBeGreaterThan(0);
  });

  it('returns zero accessible availability when no gates are open', () => {
    const closed: VenueData = {
      ...mockVenue,
      gates: mockVenue.gates.map((g) => ({ ...g, open: false })),
    };
    const kpis = computeKpis(closed, mockCrowd, [], mockTransport, 50);
    expect(kpis.accessibleRouteAvailability).toBe(0);
    expect(kpis.gatePressure).toBe(0);
  });
});

describe('gate diversion', () => {
  it('returns null when no gate is overloaded', () => {
    expect(recommendOpenAlternateGate(calmVenue)).toBeNull();
  });

  it('returns null when overloaded but no quiet alternate', () => {
    expect(recommendOpenAlternateGate(busyNoAlternate)).toBeNull();
  });

  it('recommends a step-free alternate gate', () => {
    const rec = recommendOpenAlternateGate(mockVenue);
    expect(rec?.risk).toBe('high');
    expect(rec?.accessibilityNote).toMatch(/step-free/);
  });

  it('warns when the alternate gate is not step-free', () => {
    const rec = recommendOpenAlternateGate(busyWithStepFreeAlternate);
    expect(rec?.accessibilityNote).toMatch(/not step-free/);
  });
});

describe('crowd-driven recommendations', () => {
  it('dispatches staff for a medical incident in a dense zone', () => {
    expect(recommendStaffDispatch(mockCrowd)?.risk).toBe('critical');
    expect(recommendStaffDispatch(calmCrowd)).toBeNull();
  });

  it('recommends staggered exit for a high exit wave', () => {
    expect(recommendExitGuidance(mockCrowd)).not.toBeNull();
    expect(recommendExitGuidance(calmCrowd)).toBeNull();
  });

  it('redirects fans away from red zones', () => {
    expect(recommendRedirectFans(mockCrowd)).not.toBeNull();
    expect(recommendRedirectFans(calmCrowd)).toBeNull();
  });

  it('adds volunteers to rising dense zones', () => {
    expect(recommendAddVolunteers(mockCrowd)).not.toBeNull();
    expect(recommendAddVolunteers(calmCrowd)).toBeNull();
  });

  it('pushes a multilingual alert when a zone is critical', () => {
    expect(recommendMultilingualAlert(mockCrowd)).not.toBeNull();
    expect(recommendMultilingualAlert(calmCrowd)).toBeNull();
  });
});

describe('shuttle reroute', () => {
  const strainedQueue: TransportOption[] = [
    {
      mode: 'shuttle',
      label: 'S',
      etaMinutes: 20,
      queueMinutes: 25,
      co2Grams: 300,
      crowd: 'yellow',
    },
  ];
  const strainedCrowd: TransportOption[] = [
    { mode: 'shuttle', label: 'S', etaMinutes: 20, queueMinutes: 5, co2Grams: 300, crowd: 'red' },
  ];

  it('returns null when there is no shuttle option', () => {
    expect(recommendShuttleReroute([])).toBeNull();
  });

  it('returns null when the shuttle is healthy', () => {
    expect(recommendShuttleReroute(mockTransport)).toBeNull();
  });

  it('recommends reroute for long queues', () => {
    expect(recommendShuttleReroute(strainedQueue)).not.toBeNull();
  });

  it('recommends reroute for red shuttle crowd', () => {
    expect(recommendShuttleReroute(strainedCrowd)).not.toBeNull();
  });
});

describe('generateDecisionCards', () => {
  it('collects applicable recommendations', () => {
    const cards = generateDecisionCards(mockVenue, mockCrowd, mockTransport);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => typeof c.summary === 'string')).toBe(true);
  });
});

describe('planRoute', () => {
  it('returns null for unknown origin or destination', () => {
    expect(planRoute(mockVenue, 'nope', 'help-1', 'fastest')).toBeNull();
    expect(planRoute(mockVenue, 'gate-a', 'nope', 'fastest')).toBeNull();
  });

  it('plans a fastest route', () => {
    const plan = planRoute(mockVenue, 'gate-a', 'help-1', 'fastest');
    expect(plan?.mode).toBe('fastest');
    expect(plan?.steps[1]).toMatch(/main concourse/);
    expect(plan?.fallback).toMatch(/low-crowd/);
  });

  it('plans a low-crowd route', () => {
    expect(planRoute(mockVenue, 'gate-a', 'help-1', 'low-crowd')?.steps[1]).toMatch(/perimeter/);
  });

  it('plans an accessible route between step-free nodes', () => {
    const plan = planRoute(mockVenue, 'gate-a', 'help-1', 'accessible');
    expect(plan?.accessibilityScore).toBeGreaterThan(80);
    expect(plan?.steps[1]).toMatch(/step-free ramps/);
    expect(plan?.fallback).toMatch(/Help Desk/);
  });

  it('lowers the accessible score when a node is not step-free', () => {
    const plan = planRoute(mockVenue, 'gate-c', 'sec-101', 'accessible');
    expect(plan?.accessibilityScore).toBeLessThan(80);
  });

  it('plans a family route', () => {
    expect(planRoute(mockVenue, 'gate-a', 'help-1', 'family')?.steps[1]).toMatch(/main concourse/);
  });

  it('plans a staff-only route', () => {
    expect(planRoute(mockVenue, 'gate-a', 'help-1', 'staff-only')?.steps[1]).toMatch(
      /service corridor/,
    );
  });
});

describe('incident helpers', () => {
  it('assigns severity by type', () => {
    expect(severityForIncident('medical')).toBe('high');
    expect(severityForIncident('facility')).toBe('low');
  });

  it('suggests a next operational step', () => {
    expect(nextStepForIncident('medical')).toMatch(/medical staff/);
    expect(nextStepForIncident('security')).toMatch(/security lead/);
  });
});
