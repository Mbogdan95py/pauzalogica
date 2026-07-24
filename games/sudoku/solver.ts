/**
 * Independent Sudoku solver + uniqueness checker.
 *
 * Uses bitmask candidate tracking and MRV (minimum-remaining-values) selection
 * for speed — the generator calls `countSolutions` many times while digging
 * holes, and the validator re-runs it to confirm uniqueness. No AI is ever
 * involved in producing or checking Sudoku.
 */

export type Grid = number[][];

export const SIZE = 9;
export const BOX = 3;

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));
}

function boxIndex(r: number, c: number): number {
  return Math.floor(r / BOX) * BOX + Math.floor(c / BOX);
}

/** Is `grid` internally consistent (ignoring emptiness)? */
export function hasNoConflicts(grid: Grid): boolean {
  const rows = Array.from({ length: SIZE }, () => 0);
  const cols = Array.from({ length: SIZE }, () => 0);
  const boxes = Array.from({ length: SIZE }, () => 0);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r]![c]!;
      if (v === 0) continue;
      if (v < 1 || v > 9) return false;
      const bit = 1 << v;
      const b = boxIndex(r, c);
      if (rows[r]! & bit || cols[c]! & bit || boxes[b]! & bit) return false;
      rows[r]! |= bit;
      cols[c]! |= bit;
      boxes[b]! |= bit;
    }
  }
  return true;
}

/** Is the grid completely filled with a valid solution? */
export function isSolved(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (grid[r]![c]! === 0) return false;
  return hasNoConflicts(grid);
}

interface Masks {
  rows: number[];
  cols: number[];
  boxes: number[];
}

function computeMasks(grid: Grid): Masks | null {
  const rows = Array.from({ length: SIZE }, () => 0);
  const cols = Array.from({ length: SIZE }, () => 0);
  const boxes = Array.from({ length: SIZE }, () => 0);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r]![c]!;
      if (v === 0) continue;
      const bit = 1 << v;
      const b = boxIndex(r, c);
      if (rows[r]! & bit || cols[c]! & bit || boxes[b]! & bit) return null;
      rows[r]! |= bit;
      cols[c]! |= bit;
      boxes[b]! |= bit;
    }
  }
  return { rows, cols, boxes };
}

const ALL = 0b1111111110; // bits 1..9

function popcount(x: number): number {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

/**
 * Count solutions up to `limit`. Order of candidate exploration can be shuffled
 * by providing `order` (a permutation of 1..9) for randomized generation.
 */
export function countSolutions(input: Grid, limit = 2, order?: number[]): number {
  const grid = cloneGrid(input);
  const masks = computeMasks(grid);
  if (!masks) return 0;
  const digits = order ?? [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let count = 0;

  const recurse = (): boolean => {
    // Find the empty cell with the fewest candidates (MRV).
    let best = -1;
    let bestCand = 0;
    let bestCount = 99;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r]![c]! !== 0) continue;
        const b = boxIndex(r, c);
        const used = masks.rows[r]! | masks.cols[c]! | masks.boxes[b]!;
        const cand = ALL & ~used;
        const n = popcount(cand);
        if (n === 0) return false; // dead end
        if (n < bestCount) {
          bestCount = n;
          best = r * SIZE + c;
          bestCand = cand;
          if (n === 1) break;
        }
      }
      if (bestCount === 1) break;
    }
    if (best === -1) {
      // No empty cells: a full solution.
      count++;
      return count >= limit;
    }
    const r = Math.floor(best / SIZE);
    const c = best % SIZE;
    const b = boxIndex(r, c);
    for (const v of digits) {
      const bit = 1 << v;
      if (!(bestCand & bit)) continue;
      grid[r]![c] = v;
      masks.rows[r]! |= bit;
      masks.cols[c]! |= bit;
      masks.boxes[b]! |= bit;
      const stop = recurse();
      grid[r]![c] = 0;
      masks.rows[r]! &= ~bit;
      masks.cols[c]! &= ~bit;
      masks.boxes[b]! &= ~bit;
      if (stop) return true;
    }
    return false;
  };

  recurse();
  return count;
}

/** Return the first solution, or null if unsolvable. */
export function solve(input: Grid, order?: number[]): Grid | null {
  const grid = cloneGrid(input);
  const masks = computeMasks(grid);
  if (!masks) return null;
  const digits = order ?? [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const recurse = (): boolean => {
    let best = -1;
    let bestCand = 0;
    let bestCount = 99;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r]![c]! !== 0) continue;
        const b = boxIndex(r, c);
        const used = masks.rows[r]! | masks.cols[c]! | masks.boxes[b]!;
        const cand = ALL & ~used;
        const n = popcount(cand);
        if (n === 0) return false;
        if (n < bestCount) {
          bestCount = n;
          best = r * SIZE + c;
          bestCand = cand;
          if (n === 1) break;
        }
      }
      if (bestCount === 1) break;
    }
    if (best === -1) return true;
    const r = Math.floor(best / SIZE);
    const c = best % SIZE;
    const b = boxIndex(r, c);
    for (const v of digits) {
      const bit = 1 << v;
      if (!(bestCand & bit)) continue;
      grid[r]![c] = v;
      masks.rows[r]! |= bit;
      masks.cols[c]! |= bit;
      masks.boxes[b]! |= bit;
      if (recurse()) return true;
      grid[r]![c] = 0;
      masks.rows[r]! &= ~bit;
      masks.cols[c]! &= ~bit;
      masks.boxes[b]! &= ~bit;
    }
    return false;
  };

  return recurse() ? grid : null;
}

export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}
