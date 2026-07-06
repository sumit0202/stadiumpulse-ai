import { useState } from 'react';
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_NEEDS,
  LANGUAGE_LABELS,
  LANGUAGES,
  PERSONAS,
  PERSONA_LABELS,
} from '../../lib/constants';
import { validatePreferences } from '../../lib/validators';
import { getVenue } from '../../data/dataSource';
import { usePreferences } from '../../state/preferences';
import type { AccessibilityNeed, LanguageCode, Persona } from '../../types';

const venue = getVenue();
const ZONE_OPTIONS = [
  'General Concourse',
  ...venue.amenities.filter((a) => a.type === 'seat-section').map((a) => a.name),
  ...venue.gates.map((g) => g.name),
];

export function Onboarding() {
  const { savePreferences } = usePreferences();
  const [persona, setPersona] = useState<Persona>('fan');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [needs, setNeeds] = useState<AccessibilityNeed[]>([]);
  const [zone, setZone] = useState<string>(ZONE_OPTIONS[0] ?? 'General Concourse');
  const [error, setError] = useState<string | null>(null);

  const toggleNeed = (need: AccessibilityNeed) => {
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validatePreferences({ persona, language, accessibility: needs, zone });
    if (!result.valid || result.value === null) {
      setError(result.error ?? 'Please review your selections.');
      return;
    }
    setError(null);
    savePreferences(result.value);
  };

  return (
    <section className="card" aria-labelledby="onboarding-title">
      <h2 id="onboarding-title">Set up your StadiumPulse copilot</h2>
      <p className="muted">
        No login required. Only non-sensitive preferences are stored locally on this device.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="persona">I am a</label>
          <select
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
          >
            {PERSONAS.map((p) => (
              <option key={p} value={p}>
                {PERSONA_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="language">Preferred language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend>Accessibility needs (optional)</legend>
          <div className="checklist">
            {ACCESSIBILITY_NEEDS.map((need) => (
              <label key={need} htmlFor={`need-${need}`}>
                <input
                  id={`need-${need}`}
                  type="checkbox"
                  checked={needs.includes(need)}
                  onChange={() => toggleNeed(need)}
                />
                {ACCESSIBILITY_LABELS[need]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="zone">Ticket section or operational zone</label>
          <select id="zone" value={zone} onChange={(e) => setZone(e.target.value)}>
            {ZONE_OPTIONS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn" type="submit">
          Enter command center
        </button>
      </form>
    </section>
  );
}
