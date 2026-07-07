import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { validatePreferences } from '../lib/validators';
import type { UserPreferences } from '../types';

export interface A11ySettings {
  contrast: 'normal' | 'high';
  text: 'normal' | 'large';
  motion: 'normal' | 'reduced';
}

interface PreferencesContextValue {
  preferences: UserPreferences | null;
  a11y: A11ySettings;
  savePreferences: (prefs: UserPreferences) => void;
  resetPreferences: () => void;
  setContrast: (v: A11ySettings['contrast']) => void;
  setText: (v: A11ySettings['text']) => void;
  setMotion: (v: A11ySettings['motion']) => void;
}

const PREFS_KEY = 'stadiumpulse.preferences';
const A11Y_KEY = 'stadiumpulse.a11y';

const DEFAULT_A11Y: A11ySettings = { contrast: 'normal', text: 'normal', motion: 'normal' };

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function loadPreferences(): UserPreferences | null {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const result = validatePreferences(JSON.parse(raw));
    return result.valid ? result.value : null;
  } catch {
    return null;
  }
}

function loadA11y(): A11ySettings {
  try {
    const raw = window.localStorage.getItem(A11Y_KEY);
    if (!raw) return DEFAULT_A11Y;
    return { ...DEFAULT_A11Y, ...(JSON.parse(raw) as Partial<A11ySettings>) };
  } catch {
    return DEFAULT_A11Y;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(() => loadPreferences());
  const [a11y, setA11y] = useState<A11ySettings>(() => loadA11y());

  useEffect(() => {
    document.body.dataset.contrast = a11y.contrast;
    document.body.dataset.text = a11y.text;
    document.body.dataset.motion = a11y.motion;
    window.localStorage.setItem(A11Y_KEY, JSON.stringify(a11y));
  }, [a11y]);

  const savePreferences = useCallback((prefs: UserPreferences) => {
    setPreferences(prefs);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(null);
    window.localStorage.removeItem(PREFS_KEY);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      a11y,
      savePreferences,
      resetPreferences,
      setContrast: (contrast) => setA11y((prev) => ({ ...prev, contrast })),
      setText: (text) => setA11y((prev) => ({ ...prev, text })),
      setMotion: (motion) => setA11y((prev) => ({ ...prev, motion })),
    }),
    [preferences, a11y, savePreferences, resetPreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}
