import { useState } from 'react';
import { Header } from './components/Header';
import { Onboarding } from './features/onboarding/Onboarding';
import { Dashboard } from './features/dashboard/Dashboard';
import { Assistant } from './features/assistant/Assistant';
import { NavigationPlanner } from './features/navigation/NavigationPlanner';
import { CrowdManagement } from './features/crowd/CrowdManagement';
import { AccessibilityPlanner } from './features/accessibility/AccessibilityPlanner';
import { Transport } from './features/transport/Transport';
import { Sustainability } from './features/sustainability/Sustainability';
import { Incidents } from './features/incidents/Incidents';
import { ApiStatus } from './features/api-status/ApiStatus';
import { usePreferences } from './state/preferences';

type TabId =
  | 'dashboard'
  | 'assistant'
  | 'navigation'
  | 'crowd'
  | 'accessibility'
  | 'transport'
  | 'sustainability'
  | 'incidents'
  | 'status';

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'assistant', label: 'AI Copilot' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'crowd', label: 'Crowd' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'transport', label: 'Transport' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'status', label: 'API status' },
];

function renderTab(tab: TabId) {
  switch (tab) {
    case 'assistant':
      return <Assistant />;
    case 'navigation':
      return <NavigationPlanner />;
    case 'crowd':
      return <CrowdManagement />;
    case 'accessibility':
      return <AccessibilityPlanner />;
    case 'transport':
      return <Transport />;
    case 'sustainability':
      return <Sustainability />;
    case 'incidents':
      return <Incidents />;
    case 'status':
      return <ApiStatus />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

export function App() {
  const { preferences } = usePreferences();
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <Header />
        {preferences ? (
          <>
            <nav className="nav" aria-label="Primary">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <main id="main-content" tabIndex={-1}>
              {renderTab(tab)}
            </main>
          </>
        ) : (
          <main id="main-content" tabIndex={-1}>
            <Onboarding />
          </main>
        )}
        <footer className="app-footer">
          StadiumPulse AI · Demo build · Simulated data · Not affiliated with FIFA. No copyrighted
          assets used.
        </footer>
      </div>
    </>
  );
}
