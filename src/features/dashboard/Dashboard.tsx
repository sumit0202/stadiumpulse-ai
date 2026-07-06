import { useMemo } from 'react';
import { computeKpis, generateDecisionCards } from '../../lib/decisionEngine';
import { getVenueSustainability } from '../../lib/venueInsights';
import { KpiCard } from '../../components/KpiCard';
import { RecommendationCard } from '../../components/RecommendationCard';
import { StatusChip } from '../../components/StatusChip';
import { getCrowd, getIncidents, getTransport, getVenue } from '../../data/dataSource';

export function Dashboard() {
  const venue = getVenue();
  const crowd = getCrowd();
  const { kpis, cards } = useMemo(() => {
    const { score } = getVenueSustainability();
    return {
      kpis: computeKpis(venue, crowd, getIncidents(), getTransport(), score),
      cards: generateDecisionCards(venue, crowd, getTransport()),
    };
  }, [venue, crowd]);

  return (
    <section className="stack" aria-labelledby="dashboard-title">
      <div className="toolbar">
        <h2 id="dashboard-title">Smart operations dashboard</h2>
        <StatusChip tone="demo" label="Simulated data" />
      </div>

      <div className="grid cols-3" role="list" aria-label="Key performance indicators">
        <div role="listitem">
          <KpiCard label="Crowd load" value={kpis.crowdLoad} unit="%" />
        </div>
        <div role="listitem">
          <KpiCard label="Gate pressure" value={kpis.gatePressure} unit="%" />
        </div>
        <div role="listitem">
          <KpiCard label="Transport delay" value={kpis.transportDelay} unit=" min" />
        </div>
        <div role="listitem">
          <KpiCard label="Incident count" value={kpis.incidentCount} />
        </div>
        <div role="listitem">
          <KpiCard label="Accessible routes" value={kpis.accessibleRouteAvailability} unit="%" />
        </div>
        <div role="listitem">
          <KpiCard label="Sustainability score" value={kpis.sustainabilityScore} unit="/100" />
        </div>
      </div>

      <div className="card">
        <h3>Crowd heat zones</h3>
        <p className="muted">Levels are labelled in text, not colour alone.</p>
        <div className="heat-grid">
          {crowd.zones.map((zone) => (
            <div key={zone.id} className="heat-cell" data-level={zone.level}>
              {zone.name}
              <br />
              <small>
                {zone.level.toUpperCase()} · {zone.density}%
              </small>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Decision cards</h3>
        <p className="muted">
          Generated deterministically by the decision engine (Gemini can summarise them in the
          copilot).
        </p>
        {cards.length === 0 ? (
          <p>No actions required right now.</p>
        ) : (
          cards.map((card) => <RecommendationCard key={card.summary} recommendation={card} />)
        )}
      </div>
    </section>
  );
}
