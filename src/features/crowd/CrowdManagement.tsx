import { useMemo } from 'react';
import {
  predictCongestion,
  recommendExitGuidance,
  recommendOpenAlternateGate,
  recommendRedirectFans,
  recommendStaffDispatch,
} from '../../lib/decisionEngine';
import { RecommendationCard } from '../../components/RecommendationCard';
import { StatusChip } from '../../components/StatusChip';
import { getCrowd, getVenue } from '../../data/dataSource';
import type { Recommendation } from '../../types';

export function CrowdManagement() {
  const venue = getVenue();
  const crowd = getCrowd();

  const predictions = useMemo(
    () => crowd.zones.map((zone) => ({ zone, forecast: predictCongestion(zone, 15) })),
    [crowd],
  );

  const bottlenecks = crowd.zones.filter((z) => z.level === 'orange' || z.level === 'red');

  const recommendations = useMemo(
    () =>
      [
        recommendOpenAlternateGate(venue),
        recommendStaffDispatch(crowd),
        recommendRedirectFans(crowd),
        recommendExitGuidance(crowd),
      ].filter((r): r is Recommendation => r !== null),
    [venue, crowd],
  );

  return (
    <section className="stack" aria-labelledby="crowd-title">
      <h2 id="crowd-title">Crowd management</h2>

      <div className="card">
        <h3>Live crowd signals &amp; 15-minute forecast</h3>
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col">Zone</th>
              <th scope="col">Now</th>
              <th scope="col">Trend</th>
              <th scope="col">Forecast (15 min)</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map(({ zone, forecast }) => (
              <tr key={zone.id}>
                <th scope="row">{zone.name}</th>
                <td>
                  <StatusChip tone={zone.level} label={`${zone.level} · ${zone.density}%`} />
                </td>
                <td>{forecast.direction}</td>
                <td>
                  {forecast.projectedDensity}% ({forecast.projectedLevel})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Bottlenecks</h3>
        {bottlenecks.length === 0 ? (
          <p>No active bottlenecks.</p>
        ) : (
          <ul>
            {bottlenecks.map((z) => (
              <li key={z.id}>
                {z.name} — {z.level} ({z.density}%)
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Recommended operational actions</h3>
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.summary} recommendation={rec} />
        ))}
      </div>
    </section>
  );
}
