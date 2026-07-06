import { Logo } from './Logo';
import { StatusChip } from './StatusChip';
import { LANGUAGE_LABELS, PERSONA_LABELS } from '../lib/constants';
import { usePreferences } from '../state/preferences';

export function Header() {
  const { preferences, resetPreferences } = usePreferences();
  return (
    <header className="app-header">
      <h1 className="brand">
        <Logo />
        StadiumPulse AI
      </h1>
      <div className="toolbar">
        {preferences ? (
          <>
            <StatusChip tone="live" label={PERSONA_LABELS[preferences.persona]} />
            <StatusChip tone="ready" label={LANGUAGE_LABELS[preferences.language]} />
            <button className="btn secondary" type="button" onClick={resetPreferences}>
              Change setup
            </button>
          </>
        ) : (
          <StatusChip tone="demo" label="Demo mode" />
        )}
      </div>
    </header>
  );
}
