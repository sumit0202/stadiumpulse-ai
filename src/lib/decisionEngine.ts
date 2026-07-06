import { THRESHOLDS } from './constants';
import type {
  CrowdLevel,
  CrowdSnapshot,
  CrowdZone,
  Incident,
  IncidentType,
  KpiSnapshot,
  LatLng,
  Recommendation,
  RiskLevel,
  RouteMode,
  RoutePlan,
  TransportOption,
  VenueData,
} from '../types';

/* --------------------------------- helpers --------------------------------- */

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Great-circle distance in meters between two coordinates (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Map a density (0-100) to a traffic-light crowd level. */
export function classifyCrowd(density: number): CrowdLevel {
  if (density >= 85) return 'red';
  if (density >= 70) return 'orange';
  if (density >= 50) return 'yellow';
  return 'green';
}

const CROWD_TO_RISK: Record<CrowdLevel, RiskLevel> = {
  green: 'low',
  yellow: 'medium',
  orange: 'high',
  red: 'critical',
};

export const crowdLevelToRisk = (level: CrowdLevel): RiskLevel => CROWD_TO_RISK[level];

/** Predict the density and level ~N minutes ahead using the current trend. */
type CongestionDirection = 'rising' | 'falling' | 'steady';

function trendDirection(trend: number): CongestionDirection {
  if (trend > 0) return 'rising';
  if (trend < 0) return 'falling';
  return 'steady';
}

export function predictCongestion(
  zone: CrowdZone,
  minutes = 15,
): {
  projectedDensity: number;
  projectedLevel: CrowdLevel;
  direction: CongestionDirection;
} {
  const projectedDensity = Math.round(clamp(zone.density + (zone.trend * minutes) / 5, 0, 100));
  return {
    projectedDensity,
    projectedLevel: classifyCrowd(projectedDensity),
    direction: trendDirection(zone.trend),
  };
}

/* ------------------------------ KPI computation ----------------------------- */

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeKpis(
  venue: VenueData,
  crowd: CrowdSnapshot,
  incidents: Incident[],
  transport: TransportOption[],
  sustainabilityScore: number,
): KpiSnapshot {
  const openGates = venue.gates.filter((g) => g.open);
  const stepFreeOpenGates = openGates.filter((g) => g.stepFree);
  const crowdLoad = Math.round(average(crowd.zones.map((z) => z.density)));
  const gatePressure = Math.round(average(openGates.map((g) => g.pressure)));
  const transportDelay = Math.round(average(transport.map((t) => t.queueMinutes)));
  const accessibleRouteAvailability =
    openGates.length === 0 ? 0 : Math.round((stepFreeOpenGates.length / openGates.length) * 100);
  return {
    crowdLoad,
    gatePressure,
    transportDelay,
    incidentCount: incidents.length,
    accessibleRouteAvailability,
    sustainabilityScore,
  };
}

/* ----------------------------- recommendations ------------------------------ */

function buildRecommendation(
  partial: Partial<Recommendation> & Pick<Recommendation, 'summary' | 'action' | 'reason' | 'risk'>,
): Recommendation {
  return {
    timeImpactMinutes: 0,
    accessibilityNote: 'No accessibility impact identified.',
    sustainabilityNote: 'No sustainability impact identified.',
    simulated: true,
    ...partial,
  };
}

/**
 * Rule: if a busy open gate exceeds the pressure threshold and a quieter open
 * gate is available, recommend diverting fans to the alternate gate.
 */
export function recommendOpenAlternateGate(venue: VenueData): Recommendation | null {
  const openGates = venue.gates.filter((g) => g.open);
  const busy = openGates.filter((g) => g.pressure > THRESHOLDS.gatePressureHigh);
  if (busy.length === 0) return null;
  const alternate = openGates
    .filter((g) => g.pressure < THRESHOLDS.alternateGateLow)
    .sort((a, b) => a.pressure - b.pressure)[0];
  if (!alternate) return null;
  const busiest = busy.sort((a, b) => b.pressure - a.pressure)[0]!;
  return buildRecommendation({
    summary: `${busiest.name} is overloaded at ${busiest.pressure}% pressure.`,
    action: `Open diversion signage from ${busiest.name} to ${alternate.name}.`,
    reason: `${alternate.name} is at ${alternate.pressure}% and can absorb overflow.`,
    risk: 'high',
    timeImpactMinutes: 6,
    accessibilityNote: alternate.stepFree
      ? `${alternate.name} is step-free and suitable for wheelchair users.`
      : `${alternate.name} is not step-free; route mobility-impaired fans to a step-free gate.`,
    sustainabilityNote: 'Balancing gates reduces idling crowd energy and cooling demand.',
  });
}

/** Rule: a medical incident inside a dense zone triggers staff dispatch + buffer. */
export function recommendStaffDispatch(crowd: CrowdSnapshot): Recommendation | null {
  const zone = crowd.zones.find((z) => z.hasMedicalIncident && z.density >= THRESHOLDS.denseZone);
  if (!zone) return null;
  return buildRecommendation({
    summary: `Medical incident in a dense zone: ${zone.name} (${zone.density}% density).`,
    action: `Dispatch medical staff to ${zone.name} and create a crowd buffer around the responders.`,
    reason: 'A medical response in a congested area needs a protected working area.',
    risk: 'critical',
    timeImpactMinutes: 4,
    accessibilityNote: 'Keep a step-free lane open for stretcher and wheelchair access.',
    sustainabilityNote: 'Localised buffering avoids full-zone evacuation and wasted resources.',
  });
}

/** Rule: a high post-match exit wave triggers staggered exit guidance. */
export function recommendExitGuidance(crowd: CrowdSnapshot): Recommendation | null {
  if (crowd.postMatchExitWave < THRESHOLDS.exitWaveHigh) return null;
  return buildRecommendation({
    summary: `Post-match exit wave is high at ${crowd.postMatchExitWave}%.`,
    action: 'Announce staggered exit by section and hold lower tiers for 5 minutes.',
    reason: 'Staggering the exit wave prevents dangerous concourse crushing.',
    risk: 'high',
    timeImpactMinutes: 8,
    accessibilityNote: 'Release accessible seating groups first with dedicated assistance.',
    sustainabilityNote: 'Smoother egress lowers transport queue idling emissions.',
  });
}

/** Rule: redirect fans away from any critical/red zone toward the calmest zone. */
export function recommendRedirectFans(crowd: CrowdSnapshot): Recommendation | null {
  const critical = crowd.zones.find((z) => z.level === 'red');
  if (!critical) return null;
  const calmest = [...crowd.zones].sort((a, b) => a.density - b.density)[0]!;
  return buildRecommendation({
    summary: `${critical.name} is critical at ${critical.density}% density.`,
    action: `Redirect arriving fans from ${critical.name} toward ${calmest.name}.`,
    reason: `${calmest.name} has capacity at ${calmest.density}% density.`,
    risk: 'high',
    timeImpactMinutes: 5,
    accessibilityNote: 'Provide audio and visual redirection cues, not colour-only signage.',
    sustainabilityNote: 'Spreading load reduces localized cooling and lighting spikes.',
  });
}

/** Rule: add volunteers to the busiest zone that is trending upward. */
export function recommendAddVolunteers(crowd: CrowdSnapshot): Recommendation | null {
  const rising = crowd.zones
    .filter((z) => z.trend > 0 && z.density >= THRESHOLDS.denseZone)
    .sort((a, b) => b.density - a.density)[0];
  if (!rising) return null;
  return buildRecommendation({
    summary: `${rising.name} is rising (${rising.density}%, trend +${rising.trend}).`,
    action: `Assign additional volunteers to ${rising.name} for wayfinding and flow control.`,
    reason: 'Proactive staffing prevents a rising zone from turning critical.',
    risk: 'medium',
    timeImpactMinutes: 3,
    accessibilityNote: 'Brief volunteers on step-free routes and visual-assist support.',
    sustainabilityNote: 'Human guidance reduces reliance on high-energy signage escalation.',
  });
}

/** Rule: push a multilingual alert when any zone is critical. */
export function recommendMultilingualAlert(crowd: CrowdSnapshot): Recommendation | null {
  const critical = crowd.zones.some((z) => z.level === 'red');
  if (!critical) return null;
  return buildRecommendation({
    summary: 'At least one zone is critical; fans need clear guidance.',
    action: 'Push a translated safety alert to all supported languages.',
    reason: 'Multilingual clarity reduces confusion and reverse flow in dense areas.',
    risk: 'medium',
    timeImpactMinutes: 1,
    accessibilityNote: 'Include captioned audio and screen-reader-friendly text.',
    sustainabilityNote: 'Digital alerts avoid printed signage waste.',
  });
}

/** Rule: reroute shuttles if the shuttle option is congested or heavily queued. */
export function recommendShuttleReroute(transport: TransportOption[]): Recommendation | null {
  const shuttle = transport.find((t) => t.mode === 'shuttle');
  if (!shuttle) return null;
  if (shuttle.crowd !== 'red' && shuttle.queueMinutes <= 15) return null;
  return buildRecommendation({
    summary: `Shuttle service is strained (${shuttle.queueMinutes} min queue).`,
    action: 'Reroute shuttles via the west loop and add two vehicles to the rotation.',
    reason: 'Reducing shuttle queue time prevents concourse backlog at the bays.',
    risk: 'medium',
    timeImpactMinutes: 7,
    accessibilityNote: 'Prioritise accessible shuttle boarding at the front of the queue.',
    sustainabilityNote: 'Higher shuttle utilisation lowers per-passenger emissions vs rideshare.',
  });
}

/** Collect all applicable decision cards from the deterministic rules. */
export function generateDecisionCards(
  venue: VenueData,
  crowd: CrowdSnapshot,
  transport: TransportOption[],
): Recommendation[] {
  return [
    recommendOpenAlternateGate(venue),
    recommendRedirectFans(crowd),
    recommendStaffDispatch(crowd),
    recommendAddVolunteers(crowd),
    recommendMultilingualAlert(crowd),
    recommendShuttleReroute(transport),
    recommendExitGuidance(crowd),
  ].filter((r): r is Recommendation => r !== null);
}

/* -------------------------------- routing ---------------------------------- */

interface RouteNode {
  id: string;
  name: string;
  location: LatLng;
  crowd: number;
  stepFree: boolean;
}

function findNode(venue: VenueData, id: string): RouteNode | null {
  const gate = venue.gates.find((g) => g.id === id);
  if (gate) {
    return {
      id: gate.id,
      name: gate.name,
      location: gate.location,
      crowd: gate.pressure,
      stepFree: gate.stepFree,
    };
  }
  const amenity = venue.amenities.find((a) => a.id === id);
  if (amenity) {
    return {
      id: amenity.id,
      name: amenity.name,
      location: amenity.location,
      crowd: amenity.crowd,
      stepFree: amenity.stepFree,
    };
  }
  return null;
}

/* -------------------------------- incidents -------------------------------- */

const INCIDENT_SEVERITY: Record<IncidentType, RiskLevel> = {
  medical: 'high',
  security: 'high',
  'lost-person': 'medium',
  accessibility: 'medium',
  'queue-overflow': 'medium',
  facility: 'low',
};

const INCIDENT_NEXT_STEP: Record<IncidentType, string> = {
  medical: 'Dispatch medical staff and keep a step-free lane clear for responders.',
  security: 'Notify security lead and isolate the area; avoid public alarm.',
  'lost-person': 'Alert help desks and share a non-identifying description on staff channels.',
  accessibility: 'Send an accessibility volunteer with step-free routing support.',
  'queue-overflow': 'Open an additional service point and redirect the queue.',
  facility: 'Log a maintenance ticket and cordon off the affected fixture.',
};

export const severityForIncident = (type: IncidentType): RiskLevel => INCIDENT_SEVERITY[type];

export const nextStepForIncident = (type: IncidentType): string => INCIDENT_NEXT_STEP[type];

const MODE_SPEED_FACTOR: Record<RouteMode, number> = {
  fastest: 1,
  'low-crowd': 1.25,
  accessible: 1.4,
  family: 1.3,
  'staff-only': 0.85,
};

/** Wayfinding guidance for the middle step of a planned route, keyed by mode. */
const ROUTE_STEP_GUIDANCE: Record<RouteMode, string> = {
  fastest: 'Follow the main concourse signage.',
  family: 'Follow the main concourse signage.',
  'low-crowd': 'Follow the quieter perimeter concourse.',
  accessible: 'Use step-free ramps and lifts where marked.',
  'staff-only': 'Use the operational service corridor (staff credentials required).',
};

/**
 * Deterministic route planner used as the mock/fallback for the Routes API.
 * Base walking speed is ~80 m/min, adjusted by route mode.
 */
export function planRoute(
  venue: VenueData,
  fromId: string,
  toId: string,
  mode: RouteMode,
): RoutePlan | null {
  const from = findNode(venue, fromId);
  const to = findNode(venue, toId);
  if (!from || !to) return null;

  const distanceInMeters = distanceMeters(from.location, to.location);
  const baseMinutes = distanceInMeters / 80;
  const etaMinutes = Math.max(1, Math.round(baseMinutes * MODE_SPEED_FACTOR[mode]));
  const avgCrowd = (from.crowd + to.crowd) / 2;
  const crowdRisk = crowdLevelToRisk(classifyCrowd(avgCrowd));

  const bothStepFree = from.stepFree && to.stepFree;
  let accessibilityScore = bothStepFree ? 80 : 40;
  if (mode === 'accessible') accessibilityScore = bothStepFree ? 100 : 55;
  if (mode === 'family') accessibilityScore = Math.min(100, accessibilityScore + 5);
  accessibilityScore = clamp(accessibilityScore - Math.round(avgCrowd / 10), 0, 100);

  const steps = [`Start at ${from.name}.`, ROUTE_STEP_GUIDANCE[mode], `Arrive at ${to.name}.`];

  return {
    mode,
    fromId,
    toId,
    distanceMeters: distanceInMeters,
    etaMinutes,
    crowdRisk,
    accessibilityScore,
    fallback:
      mode === 'accessible'
        ? 'If a lift is out of service, proceed to the Accessibility Help Desk for assisted routing.'
        : 'If the primary path is blocked, follow the nearest low-crowd concourse.',
    steps,
    simulated: true,
  };
}
