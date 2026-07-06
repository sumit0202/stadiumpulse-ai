import { useState } from 'react';
import { nextStepForIncident, severityForIncident } from '../../lib/decisionEngine';
import { validateIncidentDescription } from '../../lib/validators';
import { INCIDENT_LABELS, INCIDENT_TYPES, RISK_LABELS } from '../../lib/constants';
import { StatusChip } from '../../components/StatusChip';
import { mockIncidents } from '../../data/mockIncidents';
import { mockCrowd } from '../../data/mockCrowd';
import type { Incident, IncidentType } from '../../types';

const ZONES = mockCrowd.zones.map((z) => ({ id: z.id, name: z.name }));

export function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [type, setType] = useState<IncidentType>('medical');
  const [zoneId, setZoneId] = useState(ZONES[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateIncidentDescription(description);
    if (!result.valid || result.value === null) {
      setError(result.error ?? 'Please describe the incident.');
      return;
    }
    setError(null);
    const incident: Incident = {
      id: `inc-${Date.now()}`,
      type,
      zoneId,
      description: result.value,
      severity: severityForIncident(type),
      createdAt: new Date().toISOString(),
    };
    setIncidents((prev) => [incident, ...prev]);
    setDescription('');
    setAnnouncement(`${INCIDENT_LABELS[type]} incident logged and added to the list.`);
  };

  return (
    <section className="stack" aria-labelledby="incidents-title">
      <h2 id="incidents-title">Incident reporting</h2>
      <p className="muted">Do not include names or personal data. Descriptions are sanitised.</p>

      <form className="card stack" onSubmit={onSubmit} noValidate>
        <div className="grid cols-2">
          <div className="field">
            <label htmlFor="inc-type">Incident type</label>
            <select
              id="inc-type"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {INCIDENT_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="inc-zone">Zone</label>
            <select id="inc-zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="inc-desc">Description</label>
          <textarea
            id="inc-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn" type="submit">
          Log incident
        </button>
        <p className="live-region" role="status">
          {announcement}
        </p>
      </form>

      <div className="card">
        <h3>Logged incidents</h3>
        <ul className="stack">
          {incidents.map((incident) => (
            <li key={incident.id} className="rec incident-item">
              <div className="toolbar">
                <strong>{INCIDENT_LABELS[incident.type]}</strong>
                <StatusChip
                  tone={incident.severity}
                  label={`Severity: ${RISK_LABELS[incident.severity]}`}
                />
              </div>
              <p>{incident.description}</p>
              <p className="muted">Next step: {nextStepForIncident(incident.type)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
