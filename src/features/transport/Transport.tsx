import { useMemo } from 'react';
import { lowestCarbonOption } from '../../lib/sustainability';
import { recommendExitGuidance } from '../../lib/decisionEngine';
import { StatusChip } from '../../components/StatusChip';
import { RecommendationCard } from '../../components/RecommendationCard';
import { mockTransport } from '../../data/mockTransport';
import { mockCrowd } from '../../data/mockCrowd';

export function Transport() {
  const greenest = useMemo(() => lowestCarbonOption(mockTransport), []);
  const exitPlan = useMemo(() => recommendExitGuidance(mockCrowd), []);

  return (
    <section className="stack" aria-labelledby="transport-title">
      <h2 id="transport-title">Transportation</h2>

      <div className="card">
        <h3>Compare travel options</h3>
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col">Mode</th>
              <th scope="col">ETA</th>
              <th scope="col">Queue</th>
              <th scope="col">CO₂ / person</th>
              <th scope="col">Crowd</th>
            </tr>
          </thead>
          <tbody>
            {mockTransport.map((option) => (
              <tr key={option.mode}>
                <th scope="row">
                  {option.label}
                  {greenest && greenest.mode === option.mode ? (
                    <>
                      {' '}
                      · <StatusChip tone="low" label="Lowest carbon" />
                    </>
                  ) : null}
                </th>
                <td>{option.etaMinutes} min</td>
                <td>{option.queueMinutes} min</td>
                <td>{option.co2Grams} g</td>
                <td>
                  <StatusChip tone={option.crowd} label={option.crowd} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {greenest ? (
          <p className="muted">
            Recommended low-carbon option: <strong>{greenest.label}</strong> ({greenest.co2Grams} g
            CO₂ per passenger).
          </p>
        ) : null}
      </div>

      <div className="card">
        <h3>Post-match exit wave planning</h3>
        <p>Current exit wave intensity: {mockCrowd.postMatchExitWave}%.</p>
        {exitPlan ? (
          <RecommendationCard recommendation={exitPlan} />
        ) : (
          <p>Exit flow is within normal limits.</p>
        )}
      </div>
    </section>
  );
}
