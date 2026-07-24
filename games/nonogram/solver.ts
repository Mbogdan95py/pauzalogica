/**
 * Nonogram line solver + full solver / uniqueness checker.
 *
 * The generator only accepts puzzles that are fully determined by line solving,
 * which guarantees a unique solution. The validator re-runs the same solver to
 * confirm uniqueness independently. No AI is used anywhere here.
 */

export type Cell = 0 | 1;
export type Grid = Cell[][];

/** Clue runs for a single 0/1 line. Empty line → []. */
export function cluesForLine(line: number[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v === 1) run++;
    else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues;
}

export function computeClues(grid: Grid): { rowClues: number[][]; colClues: number[][] } {
  const height = grid.length;
  const width = grid[0]!.length;
  const rowClues = grid.map((row) => cluesForLine(row));
  const colClues: number[][] = [];
  for (let c = 0; c < width; c++) {
    const col: number[] = [];
    for (let r = 0; r < height; r++) col.push(grid[r]![c]!);
    colClues.push(cluesForLine(col));
  }
  return { rowClues, colClues };
}

const UNKNOWN = -1;

/**
 * Solve a single line as far as logic allows: returns a tightened array where
 * each cell is 0, 1, or -1 (still unknown), or null if the clue is impossible
 * given the known cells. Works by intersecting every legal arrangement.
 */
export function solveLine(clue: number[], known: number[]): number[] | null {
  const len = known.length;
  const possibleFilled = new Array<boolean>(len).fill(false);
  const possibleEmpty = new Array<boolean>(len).fill(false);
  const line = new Array<number>(len).fill(0);
  let arrangements = 0;
  const CAP = 500_000;

  const tailNeed = (bi: number): number => {
    let sum = 0;
    for (let i = bi; i < clue.length; i++) sum += clue[i]!;
    return sum + Math.max(0, clue.length - bi - 1);
  };

  const consistent = (from: number, to: number, val: number): boolean => {
    for (let i = from; i < to; i++) if (known[i] !== UNKNOWN && known[i] !== val) return false;
    return true;
  };

  const rec = (bi: number, pos: number): void => {
    if (arrangements > CAP) return;
    if (bi === clue.length) {
      if (!consistent(pos, len, 0)) return;
      for (let i = pos; i < len; i++) line[i] = 0;
      arrangements++;
      for (let i = 0; i < len; i++) {
        if (line[i] === 1) possibleFilled[i] = true;
        else possibleEmpty[i] = true;
      }
      return;
    }
    const block = clue[bi]!;
    const maxS = len - tailNeed(bi);
    for (let s = pos; s <= maxS; s++) {
      if (!consistent(pos, s, 0)) break; // gap cell forced filled → no further s works
      if (!consistent(s, s + block, 1)) continue;
      const sep = s + block;
      const isLast = bi === clue.length - 1;
      if (!isLast && !consistent(sep, sep + 1, 0)) continue;
      for (let i = pos; i < s; i++) line[i] = 0;
      for (let i = s; i < s + block; i++) line[i] = 1;
      if (isLast) {
        rec(bi + 1, sep);
      } else {
        line[sep] = 0;
        rec(bi + 1, sep + 1);
      }
    }
  };

  rec(0, 0);
  if (arrangements === 0 || arrangements > CAP) return null;

  const out = new Array<number>(len);
  for (let i = 0; i < len; i++) {
    if (possibleFilled[i] && !possibleEmpty[i]) out[i] = 1;
    else if (!possibleFilled[i] && possibleEmpty[i]) out[i] = 0;
    else out[i] = UNKNOWN;
  }
  return out;
}

export interface SolveResult {
  solved: boolean;
  lineSolvable: boolean;
  grid: number[][]; // may contain -1 if not fully solved
}

/**
 * Solve the whole puzzle by iterating line solving to a fixed point. If every
 * cell is determined, the puzzle is line-solvable and therefore has a unique
 * solution.
 */
export function solve(
  rowClues: number[][],
  colClues: number[][],
  width: number,
  height: number,
): SolveResult {
  const grid: number[][] = Array.from({ length: height }, () => new Array<number>(width).fill(UNKNOWN));

  let changed = true;
  let contradiction = false;
  while (changed && !contradiction) {
    changed = false;
    for (let r = 0; r < height; r++) {
      const solvedLine = solveLine(rowClues[r]!, grid[r]!);
      if (!solvedLine) {
        contradiction = true;
        break;
      }
      for (let c = 0; c < width; c++) {
        if (solvedLine[c] !== UNKNOWN && grid[r]![c] === UNKNOWN) {
          grid[r]![c] = solvedLine[c]!;
          changed = true;
        }
      }
    }
    if (contradiction) break;
    for (let c = 0; c < width; c++) {
      const col = grid.map((row) => row[c]!);
      const solvedLine = solveLine(colClues[c]!, col);
      if (!solvedLine) {
        contradiction = true;
        break;
      }
      for (let r = 0; r < height; r++) {
        if (solvedLine[r] !== UNKNOWN && grid[r]![c] === UNKNOWN) {
          grid[r]![c] = solvedLine[r]!;
          changed = true;
        }
      }
    }
  }

  let solved = !contradiction;
  for (let r = 0; r < height && solved; r++)
    for (let c = 0; c < width; c++) if (grid[r]![c] === UNKNOWN) solved = false;

  return { solved, lineSolvable: solved, grid };
}

/** True iff the clues uniquely determine a solution equal to `expected`. */
export function isUnique(
  rowClues: number[][],
  colClues: number[][],
  expected: Grid,
): boolean {
  const height = expected.length;
  const width = expected[0]!.length;
  const res = solve(rowClues, colClues, width, height);
  if (!res.solved) return false;
  for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++) if (res.grid[r]![c] !== expected[r]![c]) return false;
  return true;
}
