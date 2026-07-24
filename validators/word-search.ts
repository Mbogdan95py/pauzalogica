import type { WordSearchGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { has, isClean } from '@/lib/dictionary';
import { BANNED_WORDS, BANNED_SUBSTRINGS } from '@/lib/dictionary/blacklist.data';

function allLines(grid: string[][]): string[] {
  const h = grid.length;
  const w = grid[0]!.length;
  const lines: string[] = [];
  for (let r = 0; r < h; r++) lines.push(grid[r]!.join(''));
  for (let c = 0; c < w; c++) {
    let s = '';
    for (let r = 0; r < h; r++) s += grid[r]![c];
    lines.push(s);
  }
  for (let k = -h + 1; k < w; k++) {
    let s1 = '';
    let s2 = '';
    for (let r = 0; r < h; r++) {
      const c1 = k + r;
      const c2 = w - 1 - (k + r);
      if (c1 >= 0 && c1 < w) s1 += grid[r]![c1];
      if (c2 >= 0 && c2 < w) s2 += grid[r]![c2];
    }
    lines.push(s1, s2);
  }
  return lines.flatMap((s) => [s, s.split('').reverse().join('')]);
}

/**
 * Independent word-search validation: every listed word must be in the
 * dictionary, clean and non-duplicated; every placement must actually spell its
 * word in the grid; and no banned word may appear in any line reading.
 */
export function validateWordSearch(game: WordSearchGame): ValidatorResult {
  const c = new Checker();
  const { width, height, grid, words } = game.puzzle;
  const placements = game.solution.placements;

  c.assert(grid.length === height, 'Înălțimea grilei nu corespunde.');
  c.assert(grid.every((row) => row.length === width), 'Lățimea grilei nu corespunde.');
  c.assert(words.length >= 6, 'Prea puține cuvinte.');
  if (!c.result().ok) return c.result();

  const seen = new Set<string>();
  for (const word of words) {
    c.assert(has(word.normalized), `Cuvântul „${word.display}” nu este în dicționar.`);
    c.assert(isClean(word.normalized), `Cuvântul „${word.display}” nu este permis.`);
    c.assert(!seen.has(word.normalized), `Cuvânt duplicat: „${word.display}”.`);
    seen.add(word.normalized);
  }

  // Every word must have a placement, and every placement must spell its word.
  const placedSet = new Set(placements.map((p) => p.normalized));
  for (const word of words)
    c.assert(placedSet.has(word.normalized), `Cuvântul „${word.display}” nu are amplasare.`);

  for (const p of placements) {
    let spelled = '';
    let inBounds = true;
    for (const cell of p.cells) {
      if (cell.row < 0 || cell.row >= height || cell.col < 0 || cell.col >= width) {
        inBounds = false;
        break;
      }
      spelled += grid[cell.row]![cell.col];
    }
    c.assert(inBounds, `Amplasare în afara grilei pentru „${p.normalized}”.`);
    if (inBounds) c.assert(spelled === p.normalized, `Grila nu conține „${p.normalized}” la amplasarea dată.`);
  }

  // No banned reading anywhere in the grid.
  let bannedFound = false;
  for (const line of allLines(grid))
    if (BANNED_SUBSTRINGS.some((b) => line.includes(b)) || BANNED_WORDS.some((b) => line.includes(b)))
      bannedFound = true;
  c.assert(!bannedFound, 'Grila conține un cuvânt nepotrivit.');

  return c.result();
}
