import type { Difficulty, GameType } from '@/lib/schema/common';
import { ROTATING_GAME_TYPES } from '@/lib/schema/common';
import { daysBetween, isoWeekday } from '@/lib/date';

/**
 * Deterministic weekly planning: which difficulty each game gets on a given
 * date and which rotating game fills the sixth slot. Pure functions of the
 * date so the whole pipeline stays reproducible.
 */

/** Base difficulty curve across the ISO week (Mon..Sun). */
const WEEK_CURVE: Difficulty[] = ['usor', 'mediu', 'mediu', 'greu', 'mediu', 'greu', 'mediu'];

/** Per-game offset so a single day mixes difficulties across games. */
const GAME_OFFSET: Partial<Record<GameType, number>> = {
  sudoku: 0,
  rebus: 1,
  careu: 1,
  integrame: 2,
  'cuvinte-ascunse': 2,
  nonograma: 3,
  kakuro: 1,
  labirint: 0,
  anagrame: 2,
  'provocare-rapida': 0,
  'secvente-logice': 1,
  'cuvant-misterios': 2,
};

const LADDER: Difficulty[] = ['usor', 'mediu', 'greu'];

export function difficultyFor(date: string, game: GameType): Difficulty {
  const weekday = isoWeekday(date);
  const base = WEEK_CURVE[weekday]!;
  const offset = GAME_OFFSET[game] ?? 0;
  const idx = (LADDER.indexOf(base) + offset) % LADDER.length;
  return LADDER[idx]!;
}

/** Anchor for the rotating sixth game; any fixed date works. */
const ROTATION_EPOCH = '2026-01-01';

export function rotatingGameFor(date: string): GameType {
  const n = daysBetween(ROTATION_EPOCH, date);
  const idx = ((n % ROTATING_GAME_TYPES.length) + ROTATING_GAME_TYPES.length) % ROTATING_GAME_TYPES.length;
  return ROTATING_GAME_TYPES[idx]!;
}

/** Estimated play time (minutes) per game type and difficulty. */
const MINUTES: Record<string, [number, number, number, number]> = {
  sudoku: [6, 9, 14, 20],
  rebus: [8, 10, 13, 16],
  careu: [8, 10, 13, 16],
  integrame: [8, 11, 14, 17],
  'cuvinte-ascunse': [4, 6, 8, 10],
  nonograma: [5, 8, 12, 16],
  kakuro: [6, 9, 13, 18],
  labirint: [2, 4, 6, 8],
  anagrame: [3, 5, 7, 9],
  'provocare-rapida': [3, 4, 5, 6],
  'secvente-logice': [2, 3, 4, 5],
  'cuvant-misterios': [2, 3, 4, 5],
};

const DIFF_INDEX: Record<Difficulty, number> = { usor: 0, mediu: 1, greu: 2, expert: 3 };

export function estimatedMinutesFor(game: GameType, difficulty: Difficulty): number {
  const row = MINUTES[game] ?? [5, 8, 12, 15];
  return row[DIFF_INDEX[difficulty]]!;
}
