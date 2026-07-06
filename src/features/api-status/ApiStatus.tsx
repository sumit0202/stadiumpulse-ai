import { useEffect, useState } from 'react';
import { fetchStatuses } from '../../lib/api';
import { API_INFO, API_NAMES } from '../../lib/constants';
import { StatusChip } from '../../components/StatusChip';
import type { ApiStatus as ApiStatusType } from '../../types';

const MODE_LABELS: Record<string, string> = {
  demo: 'Demo mode',
  ready: 'Ready for live key',
  live: 'Live connected',
  error: 'Error',
};

function demoStatuses(): ApiStatusType[] {
  const hasMaps = Boolean(import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY);
  return API_NAMES.map((name) => ({
    name,
    label: API_INFO[name].label,
    purpose: API_INFO[name].purpose,
    scope: API_INFO[name].scope,
    mode: name === 'maps' && hasMaps ? 'live' : 'demo',
  }));
}

export function ApiStatus() {
  const [statuses, setStatuses] = useState<ApiStatusType[]>(demoStatuses());
  const [note, setNote] = useState<string>('Showing local demo status.');

  useEffect(() => {
    const controller = new AbortController();
    fetchStatuses(controller.signal)
      .then((live) => {
        setStatuses(live);
        setNote('Status reported by the backend proxy.');
      })
      .catch(() => {
        setNote('Backend unavailable — showing local demo status.');
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="stack" aria-labelledby="status-title">
      <h2 id="status-title">API status</h2>
      <p className="muted" role="status">
        {note}
      </p>
      <p>
        All eight Google APIs are integrated through a typed adapter layer with live and mock
        implementations. The app is fully usable in demo mode without any keys.
      </p>
      <div className="grid cols-2">
        {statuses.map((status) => (
          <div key={status.name} className="card">
            <div className="toolbar">
              <h3 className="flush">{status.label}</h3>
              <StatusChip tone={status.mode} label={MODE_LABELS[status.mode] ?? status.mode} />
            </div>
            <p>{status.purpose}</p>
            <p className="muted">
              <small>
                Scope: {status.scope === 'backend' ? 'Backend (key never exposed)' : 'Frontend'}
              </small>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
