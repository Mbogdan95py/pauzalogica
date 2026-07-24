import { createRng, type Rng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { normalizeForGrid, toUpperRo, cleanText } from '@/lib/text/diacritics';
import { has, isClean } from '@/lib/dictionary';
import { clueContainsAnswer } from '@/lib/dictionary/definitions';

export interface CrosswordEntryBuild {
  number: number;
  direction: 'across' | 'down';
  row: number;
  col: number;
  length: number;
  clue: string;
  answer: string;
}

export interface CrosswordBuild {
  width: number;
  height: number;
  blocks: boolean[][];
  numbers: number[][];
  entries: CrosswordEntryBuild[];
  grid: string[][];
  intersectionRatio: number;
  wordCount: number;
}

export interface ClueWord {
  display: string;
  normalized: string;
  clue: string;
}

interface Placement {
  normalized: string;
  display: string;
  clue: string;
  row: number;
  col: number;
  dir: 'across' | 'down';
}

// Compact bounding boxes force dense packing (more multi-crossings).
const MAX_SIZE_BY_DIFF: Record<Difficulty, number> = { usor: 9, mediu: 11, greu: 12, expert: 13 };
const TARGET_WORDS: Record<Difficulty, number> = { usor: 7, mediu: 9, greu: 11, expert: 12 };
// Intersection density for a no-adjacency criss-cross: every word must cross
// at least once (full connectivity is structurally guaranteed by the builder),
// and we additionally require a share of letter cells to be crossing points.
// The theoretical ceiling for single-crossing layouts is ~1/avgWordLength
// (≈16–20%); multi-crossings push above it. We aim for the best achievable and
// accept ≥ the floor. See docs/puzzle-validation.md for the rationale.
const MIN_INTERSECTION_RATIO = Number(process.env.CW_MIN ?? 0.2);
const FLOOR_INTERSECTION_RATIO = Number(process.env.CW_FLOOR ?? 0.15);

function keyOf(r: number, c: number): string {
  return `${r},${c}`;
}

function tryAssemble(words: ClueWord[], maxSize: number, rng: Rng): Placement[] | null {
  const letters = new Map<string, string>(); // "r,c" -> letter
  const placements: Placement[] = [];

  const canPlace = (
    word: string,
    sr: number,
    sc: number,
    dir: 'across' | 'down',
  ): number | null => {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    let intersections = 0;
    // Cell before and after must be empty (words must not run together).
    if (letters.has(keyOf(sr - dr, sc - dc))) return null;
    if (letters.has(keyOf(sr + dr * word.length, sc + dc * word.length))) return null;
    for (let i = 0; i < word.length; i++) {
      const r = sr + dr * i;
      const c = sc + dc * i;
      const existing = letters.get(keyOf(r, c));
      if (existing !== undefined) {
        if (existing !== word[i]) return null;
        intersections++;
      } else {
        // Empty cell: its perpendicular neighbours must be empty to avoid
        // accidental parallel adjacency forming unintended words.
        const pr = dir === 'across' ? 1 : 0;
        const pc = dir === 'across' ? 0 : 1;
        if (letters.has(keyOf(r + pr, c + pc)) || letters.has(keyOf(r - pr, c - pc))) return null;
      }
    }
    return intersections;
  };

  const commit = (word: ClueWord, sr: number, sc: number, dir: 'across' | 'down') => {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    for (let i = 0; i < word.normalized.length; i++)
      letters.set(keyOf(sr + dr * i, sc + dc * i), word.normalized[i]!);
    placements.push({ ...word, row: sr, col: sc, dir });
  };

  const bounds = () => {
    let minR = Infinity;
    let minC = Infinity;
    let maxR = -Infinity;
    let maxC = -Infinity;
    for (const key of letters.keys()) {
      const [r, c] = key.split(',').map(Number) as [number, number];
      minR = Math.min(minR, r);
      minC = Math.min(minC, c);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    }
    return { minR, minC, height: maxR - minR + 1, width: maxC - minC + 1 };
  };

  // Place the first (longest) word horizontally, then loop over the remaining
  // words in multiple passes: each placed word creates new crossing points that
  // may unlock words skipped earlier.
  commit(words[0]!, 0, 0, 'across');

  const remaining = words.slice(1);
  for (let pass = 0; pass < 4 && remaining.length; pass++) {
    for (let w = remaining.length - 1; w >= 0; w--) {
      const word = remaining[w]!;
      let best: { sr: number; sc: number; dir: 'across' | 'down'; score: number } | null = null;
      for (let i = 0; i < word.normalized.length; i++) {
        const letter = word.normalized[i]!;
        for (const [key, existing] of letters) {
          if (existing !== letter) continue;
          const [r, c] = key.split(',').map(Number) as [number, number];
          for (const dir of ['across', 'down'] as const) {
            const sr = dir === 'down' ? r - i : r;
            const sc = dir === 'across' ? c - i : c;
            const score = canPlace(word.normalized, sr, sc, dir);
            if (score === null || score < 1) continue;
            // Enforce max size.
            const dr = dir === 'down' ? 1 : 0;
            const dc = dir === 'across' ? 1 : 0;
            const endR = sr + dr * (word.normalized.length - 1);
            const endC = sc + dc * (word.normalized.length - 1);
            const tentative = new Set([...letters.keys(), keyOf(sr, sc), keyOf(endR, endC)]);
            let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
            for (const k of tentative) {
              const [rr, cc] = k.split(',').map(Number) as [number, number];
              minR = Math.min(minR, rr); minC = Math.min(minC, cc);
              maxR = Math.max(maxR, rr); maxC = Math.max(maxC, cc);
            }
            if (maxR - minR + 1 > maxSize || maxC - minC + 1 > maxSize) continue;
            // Strongly prefer placements with more intersections; jitter only
            // breaks ties between equally-crossed options.
            const weighted = score * 100 + rng.next();
            if (!best || weighted > best.score) best = { sr, sc, dir, score: weighted };
          }
        }
      }
      if (best) {
        commit(word, best.sr, best.sc, best.dir);
        remaining.splice(w, 1);
      }
    }
  }

  if (placements.length < 4) return null;
  const b = bounds();
  // Normalize coordinates to origin.
  for (const p of placements) {
    p.row -= b.minR;
    p.col -= b.minC;
  }
  return placements;
}

export function generateCrossword(
  seed: string,
  difficulty: Difficulty,
  clueWords: ClueWord[],
): CrosswordBuild {
  const rng = createRng(seed);
  const maxSize = MAX_SIZE_BY_DIFF[difficulty];
  const targetWords = TARGET_WORDS[difficulty];

  // Clean, validated, deduped pool (>=3 letters, in dictionary, clue OK).
  const seen = new Set<string>();
  const pool: ClueWord[] = [];
  for (const cw of clueWords) {
    const normalized = normalizeForGrid(cw.display);
    const clue = cleanText(cw.clue);
    if (normalized.length < 3 || normalized.length > maxSize) continue;
    if (seen.has(normalized)) continue;
    if (!has(normalized) || !isClean(normalized)) continue;
    if (!clue || clueContainsAnswer(clue, normalized)) continue;
    seen.add(normalized);
    pool.push({ display: toUpperRo(cw.display), normalized, clue });
  }
  if (pool.length < 5) throw new Error('crossword: not enough valid clue words');

  let bestBuild: CrosswordBuild | null = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const attemptRng = rng.derive(`att-${attempt}`);
    // Take a subset, longest-first with some shuffling for variety.
    const shuffled = attemptRng.shuffled(pool).sort((a, b) => b.normalized.length - a.normalized.length);
    const subset = shuffled.slice(0, Math.min(targetWords + 8, shuffled.length));
    const placements = tryAssemble(subset, maxSize, attemptRng);
    if (!placements) continue;

    const build = finalizeBuild(placements);
    if (build.wordCount < Math.min(6, targetWords) ) continue;
    if (build.intersectionRatio >= MIN_INTERSECTION_RATIO) return build;
    if (!bestBuild || build.intersectionRatio > bestBuild.intersectionRatio) bestBuild = build;
  }
  if (bestBuild && bestBuild.wordCount >= 5 && bestBuild.intersectionRatio >= FLOOR_INTERSECTION_RATIO)
    return bestBuild;
  throw new Error(`crossword: could not assemble a dense grid for ${difficulty}`);
}

function finalizeBuild(placements: Placement[]): CrosswordBuild {
  let width = 0;
  let height = 0;
  for (const p of placements) {
    const endR = p.dir === 'down' ? p.row + p.normalized.length - 1 : p.row;
    const endC = p.dir === 'across' ? p.col + p.normalized.length - 1 : p.col;
    height = Math.max(height, endR + 1);
    width = Math.max(width, endC + 1);
  }

  const grid: string[][] = Array.from({ length: height }, () => new Array<string>(width).fill(''));
  const coverCount = new Map<string, number>();
  for (const p of placements) {
    const dr = p.dir === 'down' ? 1 : 0;
    const dc = p.dir === 'across' ? 1 : 0;
    for (let i = 0; i < p.normalized.length; i++) {
      const r = p.row + dr * i;
      const c = p.col + dc * i;
      grid[r]![c] = p.normalized[i]!;
      coverCount.set(keyOf(r, c), (coverCount.get(keyOf(r, c)) ?? 0) + 1);
    }
  }

  const blocks: boolean[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (_, c) => grid[r]![c] === ''),
  );

  // Numbering: any cell that starts an across or down entry gets a number,
  // assigned in reading order.
  const numbers: number[][] = Array.from({ length: height }, () => new Array<number>(width).fill(0));
  const startCells = new Set(placements.map((p) => keyOf(p.row, p.col)));
  let n = 0;
  for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++)
      if (startCells.has(keyOf(r, c))) numbers[r]![c] = ++n;

  const entries: CrosswordEntryBuild[] = placements
    .map((p) => ({
      number: numbers[p.row]![p.col]!,
      direction: p.dir,
      row: p.row,
      col: p.col,
      length: p.normalized.length,
      clue: p.clue,
      answer: p.display,
    }))
    .sort((a, b) => a.number - b.number || (a.direction < b.direction ? -1 : 1));

  let letterCells = 0;
  let crossed = 0;
  for (const count of coverCount.values()) {
    letterCells++;
    if (count >= 2) crossed++;
  }

  return {
    width,
    height,
    blocks,
    numbers,
    entries,
    grid,
    intersectionRatio: letterCells ? crossed / letterCells : 0,
    wordCount: placements.length,
  };
}
