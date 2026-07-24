import { WORDS } from './words.data';
import type { Pos } from './types';
import { isBannedWord, containsBannedSubstring } from './blacklist.data';
import { normalizeForGrid, toUpperRo } from '@/lib/text/diacritics';

/** A resolved dictionary word with its normalized (grid) form precomputed. */
export interface DictWord {
  display: string;
  normalized: string;
  pos: Pos;
  freq: number;
  themes: string[];
  length: number;
}

function build(): {
  words: DictWord[];
  byNormalized: Map<string, DictWord>;
  byLength: Map<number, DictWord[]>;
  byTheme: Map<string, DictWord[]>;
} {
  const byNormalized = new Map<string, DictWord>();

  for (const entry of WORDS) {
    const normalized = normalizeForGrid(entry.w);
    if (normalized.length < 2) continue;
    const display = toUpperRo(entry.w);
    const existing = byNormalized.get(normalized);
    if (existing) {
      // Merge duplicate spellings: union themes, keep the higher frequency.
      existing.themes = Array.from(new Set([...existing.themes, ...entry.themes]));
      existing.freq = Math.max(existing.freq, entry.freq);
    } else {
      byNormalized.set(normalized, {
        display,
        normalized,
        pos: entry.pos,
        freq: entry.freq,
        themes: [...entry.themes],
        length: normalized.length,
      });
    }
  }

  const words = Array.from(byNormalized.values());
  const byLength = new Map<number, DictWord[]>();
  const byTheme = new Map<string, DictWord[]>();
  for (const w of words) {
    (byLength.get(w.length) ?? byLength.set(w.length, []).get(w.length)!).push(w);
    for (const t of w.themes) {
      (byTheme.get(t) ?? byTheme.set(t, []).get(t)!).push(w);
    }
  }
  return { words, byNormalized, byLength, byTheme };
}

const DICT = build();

/** All resolved words. */
export function allWords(): DictWord[] {
  return DICT.words;
}

/** Full set of normalized word strings (fast membership). */
export const NORMALIZED_SET: ReadonlySet<string> = new Set(DICT.byNormalized.keys());

/** Is the word present in the dictionary? Accepts display or normalized input. */
export function has(word: string): boolean {
  return DICT.byNormalized.has(normalizeForGrid(word));
}

export function get(word: string): DictWord | undefined {
  return DICT.byNormalized.get(normalizeForGrid(word));
}

export function byLength(n: number): DictWord[] {
  return DICT.byLength.get(n) ?? [];
}

export function byLengthRange(min: number, max: number): DictWord[] {
  const out: DictWord[] = [];
  for (let n = min; n <= max; n++) out.push(...byLength(n));
  return out;
}

export function byTheme(theme: string): DictWord[] {
  return DICT.byTheme.get(theme) ?? [];
}

export function themes(): string[] {
  return Array.from(DICT.byTheme.keys()).sort();
}

/** Not on the safety blacklist. */
export function isClean(word: string): boolean {
  const n = normalizeForGrid(word);
  return !isBannedWord(n) && !containsBannedSubstring(n);
}

/** Present in the dictionary AND safe to show. */
export function isAcceptableWord(word: string): boolean {
  return has(word) && isClean(word);
}

/** Words matching a theme within a length window, cleaned. */
export function pool(options: {
  theme?: string;
  minLength?: number;
  maxLength?: number;
  minFreq?: number;
}): DictWord[] {
  const { theme, minLength = 2, maxLength = 30, minFreq = 1 } = options;
  const base = theme ? byTheme(theme) : DICT.words;
  return base.filter(
    (w) =>
      w.length >= minLength &&
      w.length <= maxLength &&
      w.freq >= minFreq &&
      isClean(w.display),
  );
}
