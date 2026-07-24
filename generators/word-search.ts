import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { normalizeForGrid, toUpperRo, RO_FILLER_LETTERS } from '@/lib/text/diacritics';
import { has, isClean } from '@/lib/dictionary';
import { BANNED_WORDS, BANNED_SUBSTRINGS } from '@/lib/dictionary/blacklist.data';

export interface WordSearchPlacementBuild {
  normalized: string;
  row: number;
  col: number;
  dir: [number, number];
  cells: Array<{ row: number; col: number }>;
}

export interface WordSearchBuild {
  width: number;
  height: number;
  grid: string[][];
  words: Array<{ display: string; normalized: string }>;
  placements: WordSearchPlacementBuild[];
  allowsReversed: boolean;
  allowsDiagonal: boolean;
}

const SIZE_BY_DIFF: Record<Difficulty, number> = { usor: 10, mediu: 12, greu: 13, expert: 15 };

function directionsFor(difficulty: Difficulty): Array<[number, number]> {
  const right: [number, number] = [0, 1];
  const down: [number, number] = [1, 0];
  const diagDR: [number, number] = [1, 1];
  const diagDL: [number, number] = [1, -1];
  const left: [number, number] = [0, -1];
  const up: [number, number] = [-1, 0];
  const diagUR: [number, number] = [-1, 1];
  const diagUL: [number, number] = [-1, -1];
  switch (difficulty) {
    case 'usor':
      return [right, down];
    case 'mediu':
      return [right, down, diagDR, diagDL];
    case 'greu':
      return [right, down, left, up, diagDR];
    case 'expert':
      return [right, down, left, up, diagDR, diagDL, diagUR, diagUL];
  }
}

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
  // Diagonals (both directions).
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
  // Add reversed reads so directionally-reversed banned words are caught too.
  return lines.flatMap((s) => [s, s.split('').reverse().join('')]);
}

function hasBannedReading(grid: string[][]): boolean {
  for (const line of allLines(grid)) {
    if (BANNED_SUBSTRINGS.some((b) => line.includes(b))) return true;
    if (BANNED_WORDS.some((b) => line.includes(b))) return true;
  }
  return false;
}

export function generateWordSearch(
  seed: string,
  difficulty: Difficulty,
  candidateWords: string[],
): WordSearchBuild {
  const rng = createRng(seed);
  const size = SIZE_BY_DIFF[difficulty];
  const dirs = directionsFor(difficulty);
  const allowsReversed = dirs.some(([dr, dc]) => dr < 0 || dc < 0);
  const allowsDiagonal = dirs.some(([dr, dc]) => dr !== 0 && dc !== 0);

  // Prepare a clean, deduped, in-dictionary word pool that fits the grid.
  const seen = new Set<string>();
  const pool: Array<{ display: string; normalized: string }> = [];
  for (const raw of candidateWords) {
    const normalized = normalizeForGrid(raw);
    if (normalized.length < 3 || normalized.length > size) continue;
    if (seen.has(normalized)) continue;
    if (!has(normalized) || !isClean(normalized)) continue;
    seen.add(normalized);
    pool.push({ display: toUpperRo(raw), normalized });
  }
  pool.sort((a, b) => b.normalized.length - a.normalized.length);
  const target = Math.min(pool.length, difficulty === 'usor' ? 10 : difficulty === 'expert' ? 16 : 13);

  for (let attempt = 0; attempt < 40; attempt++) {
    const grid: string[][] = Array.from({ length: size }, () => new Array<string>(size).fill(''));
    const placements: WordSearchPlacementBuild[] = [];
    const words: Array<{ display: string; normalized: string }> = [];
    const attemptRng = rng.derive(`a-${attempt}`);

    for (const word of pool) {
      if (words.length >= target) break;
      const letters = word.normalized;
      let placed = false;
      for (let t = 0; t < 80 && !placed; t++) {
        const [dr, dc] = attemptRng.pick(dirs);
        const rowStart = attemptRng.int(0, size - 1);
        const colStart = attemptRng.int(0, size - 1);
        const endR = rowStart + dr * (letters.length - 1);
        const endC = colStart + dc * (letters.length - 1);
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
        let fits = true;
        for (let i = 0; i < letters.length; i++) {
          const cell = grid[rowStart + dr * i]![colStart + dc * i]!;
          if (cell !== '' && cell !== letters[i]) {
            fits = false;
            break;
          }
        }
        if (!fits) continue;
        const cells: Array<{ row: number; col: number }> = [];
        for (let i = 0; i < letters.length; i++) {
          const r = rowStart + dr * i;
          const c = colStart + dc * i;
          grid[r]![c] = letters[i]!;
          cells.push({ row: r, col: c });
        }
        placements.push({ normalized: letters, row: rowStart, col: colStart, dir: [dr, dc], cells });
        words.push(word);
        placed = true;
      }
    }

    const minWords = difficulty === 'usor' ? 8 : 10;
    if (words.length < minWords) continue;

    // Fill empties, avoiding accidental banned readings (retry the fill only).
    let filledOk = false;
    for (let fillTry = 0; fillTry < 25 && !filledOk; fillTry++) {
      const fillRng = attemptRng.derive(`fill-${fillTry}`);
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
          if (grid[r]![c] === '') grid[r]![c] = fillRng.pick(RO_FILLER_LETTERS);
      if (!hasBannedReading(grid)) filledOk = true;
      else {
        // clear fillers and retry
        const fixed = new Set(placements.flatMap((p) => p.cells.map((x) => `${x.row},${x.col}`)));
        for (let r = 0; r < size; r++)
          for (let c = 0; c < size; c++) if (!fixed.has(`${r},${c}`)) grid[r]![c] = '';
      }
    }
    if (!filledOk) continue;

    return { width: size, height: size, grid, words, placements, allowsReversed, allowsDiagonal };
  }
  throw new Error(`word-search: could not build a grid for ${difficulty}`);
}
