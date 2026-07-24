/**
 * Per-device game progress and statistics (no account). Everything is stored in
 * localStorage under versioned keys with a migration hook, so a schema bump
 * never corrupts a returning player's data.
 */
import type { GameType } from '@/lib/schema/common';

export const PROGRESS_VERSION = 1;
const NS = 'careu:v1';

export type GameStatus = 'not-started' | 'in-progress' | 'completed';

export interface GameProgress {
  version: number;
  date: string;
  type: GameType;
  status: GameStatus;
  /** opaque, game-specific serialized state (board fills, guesses, …) */
  state: unknown;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface Stats {
  version: number;
  gamesCompleted: number;
  byType: Partial<Record<GameType, number>>;
  totalTimeMs: number;
}

export interface Streak {
  version: number;
  current: number;
  longest: number;
  lastPlayedDate: string | null;
}

const STATS_KEY = `${NS}:stats`;
const STREAK_KEY = `${NS}:streak`;

function progressKey(date: string, type: GameType): string {
  return `${NS}:progress:${date}:${type}`;
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* best-effort */
  }
}

export function loadGameProgress(date: string, type: GameType): GameProgress | null {
  const stored = safeGet<GameProgress | null>(progressKey(date, type), null);
  if (!stored) return null;
  if (stored.version !== PROGRESS_VERSION) return migrateGameProgress(stored);
  return stored;
}

/** Placeholder migration: unknown versions are discarded rather than trusted. */
function migrateGameProgress(_old: GameProgress): GameProgress | null {
  return null;
}

export function saveGameProgress(input: {
  date: string;
  type: GameType;
  status: GameStatus;
  state: unknown;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
}): GameProgress {
  const record: GameProgress = {
    version: PROGRESS_VERSION,
    date: input.date,
    type: input.type,
    status: input.status,
    state: input.state,
    timeMs: input.timeMs,
    mistakes: input.mistakes,
    hintsUsed: input.hintsUsed,
    updatedAt: Date.now(),
    completedAt: input.status === 'completed' ? Date.now() : null,
  };
  safeSet(progressKey(input.date, input.type), record);
  return record;
}

export function getStats(): Stats {
  return safeGet<Stats>(STATS_KEY, { version: PROGRESS_VERSION, gamesCompleted: 0, byType: {}, totalTimeMs: 0 });
}

export function getStreak(): Streak {
  return safeGet<Streak>(STREAK_KEY, { version: PROGRESS_VERSION, current: 0, longest: 0, lastPlayedDate: null });
}

function isoYesterday(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Record a completed game: bumps stats and the daily streak. Called once when a
 * game transitions to completed. `playDate` is the puzzle date being played.
 */
export function recordCompletion(type: GameType, timeMs: number, playDate: string): { stats: Stats; streak: Streak } {
  const stats = getStats();
  stats.gamesCompleted += 1;
  stats.byType[type] = (stats.byType[type] ?? 0) + 1;
  stats.totalTimeMs += timeMs;
  safeSet(STATS_KEY, stats);

  const streak = getStreak();
  if (streak.lastPlayedDate !== playDate) {
    if (streak.lastPlayedDate === isoYesterday(playDate)) streak.current += 1;
    else if (streak.lastPlayedDate === null || streak.lastPlayedDate < isoYesterday(playDate)) streak.current = 1;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastPlayedDate = playDate;
    safeSet(STREAK_KEY, streak);
  }
  return { stats, streak };
}

/** Enumerate all progress records currently stored (for "continue" lists). */
export function listInProgress(): GameProgress[] {
  if (typeof window === 'undefined') return [];
  const out: GameProgress[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(`${NS}:progress:`)) continue;
      const rec = safeGet<GameProgress | null>(key, null);
      if (rec && rec.status === 'in-progress') out.push(rec);
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearAllProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${NS}:progress:`)) keys.push(key);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function resetStats(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STATS_KEY);
    window.localStorage.removeItem(STREAK_KEY);
  } catch {
    /* ignore */
  }
}
