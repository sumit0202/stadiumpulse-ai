import { useMemo, useState } from 'react';
import { planRoute } from '../../lib/decisionEngine';
import { venueNodes } from '../../lib/venueInsights';
import { usePreferences } from '../../state/preferences';
import { getVenue } from '../../data/dataSource';

export function AccessibilityPlanner() {
  const { a11y, setContrast, setText, setMotion } = usePreferences();
  const venue = getVenue();
  const [fromId, setFromId] = useState(venueNodes[0]?.id ?? '');
  const [toId, setToId] = useState('help-1');

  const plan = useMemo(() => planRoute(venue, fromId, toId, 'accessible'), [venue, fromId, toId]);

  return (
    <section className="stack" aria-labelledby="a11y-title">
      <h2 id="a11y-title">Accessibility</h2>

      <div className="card">
        <h3 id="display-settings">Display settings</h3>
        <p className="live-region" role="status">
          Contrast {a11y.contrast}, text {a11y.text}, motion {a11y.motion}.
        </p>
        <div className="checklist" role="group" aria-labelledby="display-settings">
          <label htmlFor="toggle-contrast">
            <input
              id="toggle-contrast"
              type="checkbox"
              checked={a11y.contrast === 'high'}
              onChange={(e) => setContrast(e.target.checked ? 'high' : 'normal')}
            />
            High contrast
          </label>
          <label htmlFor="toggle-text">
            <input
              id="toggle-text"
              type="checkbox"
              checked={a11y.text === 'large'}
              onChange={(e) => setText(e.target.checked ? 'large' : 'normal')}
            />
            Large text
          </label>
          <label htmlFor="toggle-motion">
            <input
              id="toggle-motion"
              type="checkbox"
              checked={a11y.motion === 'reduced'}
              onChange={(e) => setMotion(e.target.checked ? 'reduced' : 'normal')}
            />
            Reduce motion
          </label>
        </div>
      </div>

      <div className="card">
        <h3>Accessible journey planner</h3>
        <div className="grid cols-2">
          <div className="field">
            <label htmlFor="a11y-from">From</label>
            <select id="a11y-from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {venueNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="a11y-to">To</label>
            <select id="a11y-to" value={toId} onChange={(e) => setToId(e.target.value)}>
              {venueNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div role="status" aria-live="polite">
          {plan ? (
            <p>
              Step-free accessibility score {plan.accessibilityScore}/100, estimated{' '}
              {plan.etaMinutes} minutes. {plan.fallback}
            </p>
          ) : (
            <p className="error-text" role="alert">
              Accessible route unavailable.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
