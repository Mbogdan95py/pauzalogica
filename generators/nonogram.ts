import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { computeClues, isUnique, type Grid } from '@/games/nonogram/solver';

export interface NonogramBuild {
  width: number;
  height: number;
  rowClues: number[][];
  colClues: number[][];
  solution: Grid;
  filledRatio: number;
}

const SIZE_BY_DIFF: Record<Difficulty, number> = {
  usor: 5,
  mediu: 10,
  greu: 15,
  expert: 15,
};

const DENSITY_BY_DIFF: Record<Difficulty, number> = {
  usor: 0.55,
  mediu: 0.5,
  greu: 0.48,
  expert: 0.52,
};

function randomPicture(size: number, density: number, rng: ReturnType<typeof createRng>): Grid {
  const grid: Grid = Array.from({ length: size }, () => new Array<0 | 1>(size).fill(0));
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) grid[r]![c] = rng.bool(density) ? 1 : 0;
  // Avoid degenerate all-empty rows/cols which make dull, ambiguous puzzles.
  for (let r = 0; r < size; r++) {
    if (grid[r]!.every((v) => v === 0)) grid[r]![rng.int(0, size - 1)] = 1;
  }
  for (let c = 0; c < size; c++) {
    let any = false;
    for (let r = 0; r < size; r++) if (grid[r]![c] === 1) any = true;
    if (!any) grid[rng.int(0, size - 1)]![c] = 1;
  }
  return grid;
}

export function generateNonogram(seed: string, difficulty: Difficulty): NonogramBuild {
  const rng = createRng(seed);
  const size = SIZE_BY_DIFF[difficulty];
  const density = DENSITY_BY_DIFF[difficulty];

  const attempts = size <= 5 ? 400 : size <= 10 ? 1500 : 4000;
  for (let i = 0; i < attempts; i++) {
    const grid = randomPicture(size, density, rng.derive(`pic-${i}`));
    const { rowClues, colClues } = computeClues(grid);
    if (isUnique(rowClues, colClues, grid)) {
      let filled = 0;
      for (const row of grid) for (const v of row) filled += v;
      return {
        width: size,
        height: size,
        rowClues,
        colClues,
        solution: grid,
        filledRatio: filled / (size * size),
      };
    }
  }
  throw new Error(`nonogram: could not build a unique ${size}x${size} puzzle for ${difficulty}`);
}
