import type { CrowdSnapshot, Incident, TransportOption, VenueData } from '../types';
import { mockVenue } from './mockVenue';
import { mockCrowd } from './mockCrowd';
import { mockTransport } from './mockTransport';
import { mockIncidents } from './mockIncidents';

/**
 * Central data-access seam for operational data (venue, crowd, transport,
 * incidents).
 *
 * In this demo build the accessors resolve to typed, simulated fixtures. In a
 * live deployment the same signatures would front the backend and Google API
 * adapters, so UI components and selectors depend on this seam rather than on
 * concrete data sources — keeping the demo/live switch in exactly one place.
 */
export const getVenue = (): VenueData => mockVenue;

export const getCrowd = (): CrowdSnapshot => mockCrowd;

export const getTransport = (): TransportOption[] => mockTransport;

export const getIncidents = (): Incident[] => mockIncidents;
