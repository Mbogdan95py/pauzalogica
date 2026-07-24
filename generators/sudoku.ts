import type { Rng } from '@/lib/rng';
import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { DIFFICULTY_WEIGHT } from '@/lib/schema/common';
import {
  SIZE,
  BOX,
  cloneGrid,
  emptyGrid,
  countSolutions,
  solve,
  type Grid,
} from '@/games/sudoku/solver';
import { gradeSudoku } from '@/games/sudoku/grader';

export interface SudokuBuild {
  givens: Grid;
  solution: Grid;
  difficulty: Difficulty;
  techniques: string[];
  givenCount: number;
  emptyCount: number;
  score: number;
}

function tier(d: Difficulty): number {
  return DIFFICULTY_WEIGHT[d] - 1;
}

/** Build a random complete solution by seeding the diagonal boxes then solving. */
function generateFullGrid(rng: Rng): Grid {
  const grid = emptyGrid();
  for (let b = 0; b < SIZE; b += BOX + 1) {
    const digits = rng.shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const br = Math.floor(b / BOX) * BOX;
    const bc = (b % BOX) * BOX;
    let k = 0;
    for (let r = 0; r < BOX; r++)
      for (let c = 0; c < BOX; c++) grid[br + r]![bc + c] = digits[k++]!;
  }
  const full = solve(grid, rng.shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  if (!full) throw new Error('sudoku: failed to complete diagonal grid');
  return full;
}

/** Minimum givens we allow per difficulty, to avoid unfriendly extremes. */
const MIN_GIVENS: Record<Difficulty, number> = {
  usor: 40,
  mediu: 32,
  greu: 27,
  expert: 24,
};

/**
 * Remove cells (symmetrically) while keeping a unique solution and never
 * exceeding the target difficulty tier. This produces the hardest puzzle within
 * the requested tier, using as few givens as possible.
 */
function dig(full: Grid, target: Difficulty, rng: Rng): Grid {
  const grid = cloneGrid(full);
  const targetTier = tier(target);
  const minGivens = MIN_GIVENS[target];

  const positions: Array<[number, number]> = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) positions.push([r, c]);
  rng.shuffle(positions);

  let givens = SIZE * SIZE;
  for (const [r, c] of positions) {
    if (givens <= minGivens) break;
    if (grid[r]![c]! === 0) continue;
    // Remove in a rotationally-symmetric pair for aesthetics.
    const r2 = SIZE - 1 - r;
    const c2 = SIZE - 1 - c;
    const saved1 = grid[r]![c]!;
    const saved2 = grid[r2]![c2]!;
    const removingTwo = !(r === r2 && c === c2) && saved2 !== 0;
    grid[r]![c] = 0;
    if (removingTwo) grid[r2]![c2] = 0;

    const removed = removingTwo ? 2 : 1;
    if (givens - removed < minGivens) {
      grid[r]![c] = saved1;
      if (removingTwo) grid[r2]![c2] = saved2;
      continue;
    }

    if (countSolutions(grid, 2) !== 1) {
      grid[r]![c] = saved1;
      if (removingTwo) grid[r2]![c2] = saved2;
      continue;
    }
    if (tier(gradeSudoku(grid).difficulty) > targetTier) {
      grid[r]![c] = saved1;
      if (removingTwo) grid[r2]![c2] = saved2;
      continue;
    }
    givens -= removed;
  }
  return grid;
}

export function generateSudoku(seed: string, target: Difficulty): SudokuBuild {
  const rng = createRng(seed);
  let best: SudokuBuild | null = null;

  // Retry a few times to hit the exact target difficulty; keep the closest.
  for (let attempt = 0; attempt < 8; attempt++) {
    const full = generateFullGrid(rng.derive(`full-${attempt}`));
    const puzzle = dig(full, target, rng.derive(`dig-${attempt}`));
    const grade = gradeSudoku(puzzle);
    let givenCount = 0;
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) if (puzzle[r]![c]! !== 0) givenCount++;

    const build: SudokuBuild = {
      givens: puzzle,
      solution: full,
      difficulty: grade.difficulty,
      techniques: grade.techniques,
      givenCount,
      emptyCount: SIZE * SIZE - givenCount,
      score: grade.score,
    };
    if (grade.difficulty === target) return build;
    // Keep whichever is closest in tier to the requested difficulty.
    if (
      !best ||
      Math.abs(tier(build.difficulty) - tier(target)) <
        Math.abs(tier(best.difficulty) - tier(target))
    ) {
      best = build;
    }
  }
  return best!;
}
