import { useRef, useState } from 'react';
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    const nextTab = TABS[next];
    if (!nextTab) return;
    setTab(nextTab.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <Header />
        {preferences ? (
          <>
            <div className="nav" role="tablist" aria-label="Primary views">
              {TABS.map((t, index) => {
                const selected = tab === t.id;
                return (
                  <button
                    key={t.id}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={selected}
                    aria-controls={selected ? `panel-${t.id}` : undefined}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(t.id)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <main id="main-content" tabIndex={-1}>
              <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                {renderTab(tab)}
              </div>
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
