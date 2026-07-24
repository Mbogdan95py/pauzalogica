import type { Difficulty } from '@/lib/schema/common';
import { SIZE, BOX, cloneGrid, type Grid } from './solver';

/**
 * Human-technique difficulty grader. Rather than guessing difficulty from the
 * number of empty cells, we simulate how a person would solve the puzzle using
 * a ladder of logical techniques and classify by the hardest one required:
 *
 *   naked singles only ............ ușor
 *   + hidden singles .............. mediu
 *   + locked candidates / pairs ... greu
 *   requires search (guessing) .... expert
 */

const ALL = 0b1111111110;

function popcount(x: number): number {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

function bitsToDigits(mask: number): number[] {
  const out: number[] = [];
  for (let v = 1; v <= 9; v++) if (mask & (1 << v)) out.push(v);
  return out;
}

function boxIndex(r: number, c: number): number {
  return Math.floor(r / BOX) * BOX + Math.floor(c / BOX);
}

/** Cells belonging to a unit: kind 0=row,1=col,2=box, index 0..8. */
function unitCells(kind: number, index: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  if (kind === 0) for (let c = 0; c < SIZE; c++) cells.push([index, c]);
  else if (kind === 1) for (let r = 0; r < SIZE; r++) cells.push([r, index]);
  else {
    const br = Math.floor(index / BOX) * BOX;
    const bc = (index % BOX) * BOX;
    for (let r = 0; r < BOX; r++) for (let c = 0; c < BOX; c++) cells.push([br + r, bc + c]);
  }
  return cells;
}

export interface GradeResult {
  solved: boolean;
  difficulty: Difficulty;
  techniques: string[];
  score: number;
}

export function gradeSudoku(input: Grid): GradeResult {
  const grid = cloneGrid(input);
  const cand: number[][] = Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));

  const recompute = () => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r]![c]! !== 0) {
          cand[r]![c] = 0;
          continue;
        }
        let used = 0;
        for (let k = 0; k < SIZE; k++) {
          if (grid[r]![k]!) used |= 1 << grid[r]![k]!;
          if (grid[k]![c]!) used |= 1 << grid[k]![c]!;
        }
        const br = Math.floor(r / BOX) * BOX;
        const bc = Math.floor(c / BOX) * BOX;
        for (let dr = 0; dr < BOX; dr++)
          for (let dc = 0; dc < BOX; dc++) {
            const v = grid[br + dr]![bc + dc]!;
            if (v) used |= 1 << v;
          }
        cand[r]![c] = ALL & ~used;
      }
    }
  };

  const place = (r: number, c: number, v: number) => {
    grid[r]![c] = v;
    cand[r]![c] = 0;
    const bit = 1 << v;
    for (let k = 0; k < SIZE; k++) {
      cand[r]![k]! &= ~bit;
      cand[k]![c]! &= ~bit;
    }
    const br = Math.floor(r / BOX) * BOX;
    const bc = Math.floor(c / BOX) * BOX;
    for (let dr = 0; dr < BOX; dr++)
      for (let dc = 0; dc < BOX; dc++) cand[br + dr]![bc + dc]! &= ~bit;
  };

  recompute();

  const used = new Set<string>();
  let maxTier = 0; // 0 naked, 1 hidden, 2 advanced
  let steps = 0;

  const nakedSingle = (): boolean => {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        if (grid[r]![c]! !== 0) continue;
        if (popcount(cand[r]![c]!) === 1) {
          place(r, c, bitsToDigits(cand[r]![c]!)[0]!);
          used.add('Naked single');
          steps++;
          return true;
        }
      }
    return false;
  };

  const hiddenSingle = (): boolean => {
    for (let kind = 0; kind < 3; kind++) {
      for (let i = 0; i < SIZE; i++) {
        const cells = unitCells(kind, i);
        for (let v = 1; v <= 9; v++) {
          const bit = 1 << v;
          let found: [number, number] | null = null;
          let many = false;
          for (const [r, c] of cells) {
            if (grid[r]![c]! === 0 && cand[r]![c]! & bit) {
              if (found) {
                many = true;
                break;
              }
              found = [r, c];
            }
          }
          if (found && !many) {
            place(found[0], found[1], v);
            used.add('Hidden single');
            maxTier = Math.max(maxTier, 1);
            steps++;
            return true;
          }
        }
      }
    }
    return false;
  };

  const lockedCandidates = (): boolean => {
    let changed = false;
    // Pointing: within a box, a digit confined to one row/col removes it elsewhere.
    for (let b = 0; b < SIZE; b++) {
      const cells = unitCells(2, b).filter(([r, c]) => grid[r]![c]! === 0);
      for (let v = 1; v <= 9; v++) {
        const bit = 1 << v;
        const withV = cells.filter(([r, c]) => cand[r]![c]! & bit);
        if (withV.length < 2) continue;
        const rows = new Set(withV.map(([r]) => r));
        const cols = new Set(withV.map(([, c]) => c));
        if (rows.size === 1) {
          const r = withV[0]![0];
          for (let c = 0; c < SIZE; c++) {
            if (boxIndex(r, c) === b) continue;
            if (cand[r]![c]! & bit) {
              cand[r]![c]! &= ~bit;
              changed = true;
            }
          }
        }
        if (cols.size === 1) {
          const c = withV[0]![1];
          for (let r = 0; r < SIZE; r++) {
            if (boxIndex(r, c) === b) continue;
            if (cand[r]![c]! & bit) {
              cand[r]![c]! &= ~bit;
              changed = true;
            }
          }
        }
      }
    }
    if (changed) {
      used.add('Locked candidates');
      maxTier = Math.max(maxTier, 2);
    }
    return changed;
  };

  const nakedPair = (): boolean => {
    let changed = false;
    for (let kind = 0; kind < 3; kind++) {
      for (let i = 0; i < SIZE; i++) {
        const cells = unitCells(kind, i).filter(([r, c]) => grid[r]![c]! === 0);
        for (let a = 0; a < cells.length; a++) {
          const [ra, ca] = cells[a]!;
          if (popcount(cand[ra]![ca]!) !== 2) continue;
          for (let b = a + 1; b < cells.length; b++) {
            const [rb, cb] = cells[b]!;
            if (cand[rb]![cb]! !== cand[ra]![ca]!) continue;
            const pairMask = cand[ra]![ca]!;
            for (const [r, c] of cells) {
              if ((r === ra && c === ca) || (r === rb && c === cb)) continue;
              if (cand[r]![c]! & pairMask) {
                cand[r]![c]! &= ~pairMask;
                changed = true;
              }
            }
          }
        }
      }
    }
    if (changed) {
      used.add('Naked pair');
      maxTier = Math.max(maxTier, 2);
    }
    return changed;
  };

  // Constraint propagation loop.
  for (;;) {
    if (nakedSingle()) continue;
    if (hiddenSingle()) continue;
    if (lockedCandidates()) continue;
    if (nakedPair()) continue;
    break;
  }

  let solved = true;
  for (let r = 0; r < SIZE && solved; r++)
    for (let c = 0; c < SIZE; c++) if (grid[r]![c]! === 0) solved = false;

  let difficulty: Difficulty;
  if (!solved) difficulty = 'expert';
  else if (maxTier >= 2) difficulty = 'greu';
  else if (maxTier === 1) difficulty = 'mediu';
  else difficulty = 'usor';

  // A compact numeric score, useful for metadata and weekly variation checks.
  const score = steps + maxTier * 12 + (solved ? 0 : 40);

  return { solved, difficulty, techniques: Array.from(used), score };
}
