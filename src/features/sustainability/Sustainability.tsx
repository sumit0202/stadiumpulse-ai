import { useMemo } from 'react';
import { getVenueSustainability } from '../../lib/venueInsights';
import { KpiCard } from '../../components/KpiCard';
import { getVenue } from '../../data/dataSource';

export function Sustainability() {
  const { score, breakdown, air, greenest, crowdEnergyLoad } = useMemo(getVenueSustainability, []);

  const venue = getVenue();
  const waterPoints = venue.amenities.filter((a) => a.type === 'water-refill');
  const recyclingZones = venue.amenities.filter((a) => a.type === 'recycling');

  return (
    <section className="stack" aria-labelledby="sustainability-title">
      <h2 id="sustainability-title">Sustainability</h2>

      <div className="grid cols-auto">
        <KpiCard label="Sustainability score" value={score} unit="/100" />
        <KpiCard label="Transport factor" value={Math.round(breakdown.transport)} unit="/100" />
        <KpiCard label="Recycling factor" value={Math.round(breakdown.recycling)} unit="/100" />
        <KpiCard label="Air factor" value={Math.round(breakdown.air)} unit="/100" />
      </div>

      <div className="card">
        <h3>Air-quality-aware guidance</h3>
        <p>
          AQI {air.aqi} ({air.category}). {air.advice}
        </p>
      </div>

      <div className="card">
        <h3>Low-carbon travel</h3>
        {greenest ? (
          <p>
            Choose <strong>{greenest.label}</strong> — {greenest.co2Grams} g CO₂ per passenger.
          </p>
        ) : null}
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Water refill points</h3>
          <ul>
            {waterPoints.map((w) => (
              <li key={w.id}>{w.name}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Recycling &amp; waste zones</h3>
          <ul>
            {recyclingZones.map((r) => (
              <li key={r.id}>{r.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Venue energy &amp; cooling (staff)</h3>
        <p>
          Average crowd energy load is {crowdEnergyLoad}%.{' '}
          {crowdEnergyLoad > 70
            ? 'Pre-cool dense concourses and stagger HVAC load to avoid demand spikes.'
            : 'Maintain standard cooling; scale down lighting in low-occupancy zones.'}
        </p>
      </div>
    </section>
  );
}
