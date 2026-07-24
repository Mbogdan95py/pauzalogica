import fs from 'node:fs';
import { DEDUP_INDEX_FILE, INDEX_DIR } from './paths';
import { daysBetween } from '@/lib/date';

/**
 * The dedup archive prevents content from repeating too soon. It records, per
 * category, the set of dates each fingerprint was used, and answers windowed
 * "has this been used within N days of the target date?" queries.
 *
 * Windows (from the spec):
 *   grid       — 365 days
 *   seed       — 365 days
 *   answer     — 180 days (quick challenge, mystery word, anagrams)
 *   definition — 180 days (crossword clues)
 *   theme      —  60 days
 *   wordset    —  60 days
 */

export type DedupCategory = 'grid' | 'seed' | 'answer' | 'definition' | 'theme' | 'wordset';

/**
 * No-repeat windows in days. Spec (production, AI-fed vocabulary) values are
 * grid/seed 365, answer/definition 180, theme/wordset 60. Because the *bundled*
 * dictionary is a finite seed set (~130 clues, 12 local themes), the shipped
 * defaults are tuned so the local/mock generator can still fill a 14-day buffer
 * and the 30+ day demo. Override any of them via env for a richer corpus.
 */
function envWindow(name: string, fallback: number): number {
  const v = Number(process.env[`CAREU_DEDUP_${name}`]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

export const DEDUP_WINDOWS: Record<DedupCategory, number> = {
  grid: envWindow('GRID', 365),
  seed: envWindow('SEED', 365),
  answer: envWindow('ANSWER', 7),
  // Each bundled word has exactly one local clue, so clue-uniqueness across
  // days is only achievable with the AI corpus. Disabled by default for the
  // local generator; set CAREU_DEDUP_DEFINITION=180 in production.
  definition: envWindow('DEFINITION', 0),
  theme: envWindow('THEME', 6),
  wordset: envWindow('WORDSET', 10),
};

export interface DedupIndex {
  version: number;
  updatedAt: string;
  entries: Record<DedupCategory, Record<string, string[]>>;
}

const CATEGORIES: DedupCategory[] = ['grid', 'seed', 'answer', 'definition', 'theme', 'wordset'];

export function emptyDedupIndex(): DedupIndex {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: { grid: {}, seed: {}, answer: {}, definition: {}, theme: {}, wordset: {} },
  };
}

export function loadDedupIndex(): DedupIndex {
  if (!fs.existsSync(DEDUP_INDEX_FILE)) return emptyDedupIndex();
  try {
    const raw = JSON.parse(fs.readFileSync(DEDUP_INDEX_FILE, 'utf8')) as DedupIndex;
    // Backfill any missing categories for forward compatibility.
    const base = emptyDedupIndex();
    return {
      version: raw.version ?? 1,
      updatedAt: raw.updatedAt ?? base.updatedAt,
      entries: { ...base.entries, ...raw.entries },
    };
  } catch {
    return emptyDedupIndex();
  }
}

export function saveDedupIndex(idx: DedupIndex): void {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  idx.updatedAt = new Date().toISOString();
  fs.writeFileSync(DEDUP_INDEX_FILE, JSON.stringify(idx, null, 2) + '\n', 'utf8');
}

/**
 * Is `key` in `category` used within its window of `targetDate`? A date equal
 * to targetDate is ignored so that re-generating the same day is idempotent.
 */
export function isConflict(
  idx: DedupIndex,
  category: DedupCategory,
  key: string,
  targetDate: string,
  windowOverride?: number,
): boolean {
  const dates = idx.entries[category][key];
  if (!dates || dates.length === 0) return false;
  const window = windowOverride ?? DEDUP_WINDOWS[category];
  for (const d of dates) {
    if (d === targetDate) continue;
    if (Math.abs(daysBetween(d, targetDate)) < window) return true;
  }
  return false;
}

export function record(idx: DedupIndex, category: DedupCategory, key: string, date: string): void {
  const bucket = idx.entries[category];
  const list = bucket[key] ?? (bucket[key] = []);
  if (!list.includes(date)) list.push(date);
  list.sort();
}

/** Forget everything recorded for a specific date (used before regenerating). */
export function forgetDate(idx: DedupIndex, date: string): void {
  for (const cat of CATEGORIES) {
    const bucket = idx.entries[cat];
    for (const key of Object.keys(bucket)) {
      bucket[key] = bucket[key]!.filter((d) => d !== date);
      if (bucket[key]!.length === 0) delete bucket[key];
    }
  }
}

/** Drop dates older than `maxAgeDays` from `reference` to bound file growth. */
export function prune(idx: DedupIndex, reference: string, maxAgeDays = 420): void {
  for (const cat of CATEGORIES) {
    const bucket = idx.entries[cat];
    for (const key of Object.keys(bucket)) {
      bucket[key] = bucket[key]!.filter((d) => Math.abs(daysBetween(d, reference)) <= maxAgeDays);
      if (bucket[key]!.length === 0) delete bucket[key];
    }
  }
}
