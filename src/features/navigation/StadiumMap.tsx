import { useMemo } from 'react';
import { getCrowd, getVenue } from '../../data/dataSource';
import type { CrowdLevel } from '../../types';

interface StadiumMapProps {
  fromId: string;
  toId: string;
}

const CROWD_COLOR: Record<CrowdLevel, string> = {
  green: '#22d3a6',
  yellow: '#f2c14e',
  orange: '#ff8c42',
  red: '#ff5470',
};

/**
 * Lightweight inline-SVG stadium map (no Google Maps tiles, no image assets).
 * In live mode the Maps JavaScript API would render here using the browser key.
 */
export default function StadiumMap({ fromId, toId }: StadiumMapProps) {
  const venue = getVenue();
  const crowd = getCrowd();
  const points = useMemo(() => {
    const nodes = [
      ...venue.gates.map((g) => ({ id: g.id, name: g.name, ...g.location })),
      ...venue.amenities.map((a) => ({ id: a.id, name: a.name, ...a.location })),
    ];
    const lats = nodes.map((n) => n.lat);
    const lngs = nodes.map((n) => n.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 1;
    const spanLng = maxLng - minLng || 1;
    return nodes.map((n) => ({
      id: n.id,
      name: n.name,
      x: 30 + ((n.lng - minLng) / spanLng) * 300,
      y: 30 + (1 - (n.lat - minLat) / spanLat) * 180,
    }));
  }, [venue]);

  const from = points.find((p) => p.id === fromId);
  const to = points.find((p) => p.id === toId);

  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      height="240"
      role="img"
      aria-label="Simplified stadium map showing gates, amenities and the selected route"
    >
      <rect x="0" y="0" width="360" height="240" fill="rgba(5,10,22,0.6)" rx="12" />
      <ellipse cx="180" cy="120" rx="120" ry="70" fill="none" stroke="#4f8cff" strokeWidth="2" />
      <ellipse cx="180" cy="120" rx="60" ry="34" fill="rgba(34,211,166,0.12)" stroke="#22d3a6" />
      {crowd.zones.map((zone, i) => (
        <circle
          key={zone.id}
          cx={40 + i * 90}
          cy={22}
          r={9}
          fill={CROWD_COLOR[zone.level]}
          aria-hidden="true"
        >
          <title>{`${zone.name}: ${zone.level}`}</title>
        </circle>
      ))}
      {points.map((p) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y} r={5} fill="#9fb0d0" />
          <title>{p.name}</title>
        </g>
      ))}
      {from && to ? (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#ffd166"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
      ) : null}
    </svg>
  );
}
