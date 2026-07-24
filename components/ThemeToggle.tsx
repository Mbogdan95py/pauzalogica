'use client';

import { usePreferences } from '@/lib/client/usePreferences';
import { SunIcon, MoonIcon } from './Icons';

/** Round icon button in the header (sun/moon). */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme, mounted } = usePreferences();
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-text"
      aria-label={isDark ? 'Comută pe modul luminos' : 'Comută pe modul întunecat'}
      aria-pressed={isDark}
      title={isDark ? 'Mod luminos' : 'Mod întunecat'}
    >
      {mounted && isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

/** Text + icon toggle used in the footer ("Mod întunecat"). */
export function FooterThemeToggle() {
  const { resolvedTheme, toggleTheme, mounted } = usePreferences();
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
      aria-pressed={isDark}
    >
      {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      {isDark ? 'Mod luminos' : 'Mod întunecat'}
    </button>
  );
}
