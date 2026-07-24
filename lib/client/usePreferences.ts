'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  loadPreferences,
  savePreferences,
  applyPreferences,
  resolveTheme,
  type Preferences,
  type Theme,
} from './preferences';

const EVENT = 'careu:prefs-changed';

/**
 * Shared preferences hook. All toggles (header, footer, accessibility page)
 * read/write through this so they stay in sync within and across tabs.
 */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = loadPreferences();
    setPrefs(current);
    applyPreferences(current);
    setMounted(true);
    const handler = () => setPrefs(loadPreferences());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePreferences(next);
      applyPreferences(next);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
      return next;
    });
  }, []);

  const resolvedTheme: Theme = resolveTheme(prefs.theme);
  const toggleTheme = useCallback(() => {
    update({ theme: resolveTheme(loadPreferences().theme) === 'dark' ? 'light' : 'dark' });
  }, [update]);

  return { prefs, update, resolvedTheme, toggleTheme, mounted };
}
