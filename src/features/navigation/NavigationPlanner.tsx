import { Suspense, lazy, useMemo, useState } from 'react';
import { planRoute } from '../../lib/decisionEngine';
import { ROUTE_MODES, ROUTE_MODE_LABELS, RISK_LABELS } from '../../lib/constants';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { venueNodes } from '../../lib/venueInsights';
import { StatusChip } from '../../components/StatusChip';
import { mockVenue } from '../../data/mockVenue';
import type { RouteMode } from '../../types';

const StadiumMap = lazy(() => import('./StadiumMap'));

export function NavigationPlanner() {
  const [fromId, setFromId] = useState(venueNodes[0]?.id ?? '');
  const [toId, setToId] = useState(venueNodes[venueNodes.length - 1]?.id ?? '');
  const [mode, setMode] = useState<RouteMode>('accessible');
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebouncedValue(filter, 200);

  const nodes = useMemo(() => {
    const q = debouncedFilter.trim().toLowerCase();
    if (q.length === 0) return venueNodes;
    return venueNodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [debouncedFilter]);

  const plan = useMemo(() => planRoute(mockVenue, fromId, toId, mode), [fromId, toId, mode]);

  return (
    <section className="stack" aria-labelledby="nav-title">
      <h2 id="nav-title">Navigation planner</h2>
      <div className="layout-2col">
        <div className="card stack">
          <div className="field">
            <label htmlFor="nav-filter">Filter locations</label>
            <input
              id="nav-filter"
              type="search"
              value={filter}
              placeholder="Search gates, seats, amenities…"
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="grid cols-3">
            <div className="field">
              <label htmlFor="nav-from">Origin</label>
              <select id="nav-from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="nav-to">Destination</label>
              <select id="nav-to" value={toId} onChange={(e) => setToId(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="nav-mode">Route mode</label>
              <select
                id="nav-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as RouteMode)}
              >
                {ROUTE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {ROUTE_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Suspense fallback={<p className="muted">Loading map…</p>}>
            <StadiumMap fromId={fromId} toId={toId} />
          </Suspense>
        </div>

        <div className="card" aria-live="polite">
          <h3>Route summary</h3>
          {plan ? (
            <dl className="rec">
              <div className="toolbar">
                <StatusChip
                  tone={plan.crowdRisk}
                  label={`Crowd risk: ${RISK_LABELS[plan.crowdRisk]}`}
                />
              </div>
              <dt>Estimated time</dt>
              <dd>{plan.etaMinutes} min</dd>
              <dt>Distance</dt>
              <dd>{plan.distanceMeters} m</dd>
              <dt>Accessibility score</dt>
              <dd>{plan.accessibilityScore}/100</dd>
              <dt>Steps</dt>
              <dd>
                <ol>
                  {plan.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </dd>
              <dt>Fallback path</dt>
              <dd>{plan.fallback}</dd>
            </dl>
          ) : (
            <p className="error-text" role="alert">
              Route unavailable for the selected points.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
