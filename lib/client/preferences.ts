/**
 * User preferences persisted in localStorage. No account, no server — settings
 * live on the device. Keys are versioned so we can migrate on schema changes.
 */
export type Theme = 'light' | 'dark';

export interface Preferences {
  version: number;
  theme: Theme | 'system';
  highContrast: boolean;
  reduceMotion: boolean;
  sudokuNotesDefault: boolean;
}

export const PREFS_VERSION = 1;
export const PREFS_KEY = 'careu:v1:prefs';

export const DEFAULT_PREFS: Preferences = {
  version: PREFS_VERSION,
  theme: 'system',
  highContrast: false,
  reduceMotion: false,
  sudokuNotesDefault: false,
};

export function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    // Simple forward migration: merge onto defaults, stamp current version.
    return { ...DEFAULT_PREFS, ...parsed, version: PREFS_VERSION };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage full / disabled — preferences are best-effort */
  }
}

/** Resolve 'system' to a concrete theme using the OS preference. */
export function resolveTheme(theme: Theme | 'system'): Theme {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply preferences to the <html> element (classes drive the CSS variables). */
export function applyPreferences(prefs: Preferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolveTheme(prefs.theme) === 'dark');
  root.classList.toggle('hc', prefs.highContrast);
  root.classList.toggle('reduce-motion', prefs.reduceMotion);
}

/**
 * Inline script (stringified) that applies the saved theme before first paint,
 * preventing a flash of the wrong theme. Injected in the document head.
 */
export const THEME_BOOTSTRAP_SCRIPT = `
(function(){
  try {
    var raw = localStorage.getItem('${PREFS_KEY}');
    var p = raw ? JSON.parse(raw) : {};
    var theme = p.theme || 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (dark) root.classList.add('dark');
    if (p.highContrast) root.classList.add('hc');
    if (p.reduceMotion) root.classList.add('reduce-motion');
  } catch (e) {}
})();
`;
