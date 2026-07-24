import { createRng, type Rng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import type { KakuroCell } from '@/lib/schema/games';
import { buildModel, type Cells } from '@/games/kakuro/model';
import { fillSolution, countSolutions } from '@/games/kakuro/solver';

export interface KakuroBuild {
  width: number;
  height: number;
  cells: Cells;
  solution: number[][];
  entryCount: number;
}

const DIM_BY_DIFF: Record<Difficulty, number> = { usor: 6, mediu: 7, greu: 8, expert: 9 };
// Density chosen so runs stay short (short runs are tightly forced by their
// sums → uniqueness is common and the search is fast).
const DENSITY_BY_DIFF: Record<Difficulty, number> = {
  usor: 0.34,
  mediu: 0.36,
  greu: 0.4,
  expert: 0.4,
};
// Cap the maximum run length; longer runs make unique puzzles rare.
const MAX_RUN_BY_DIFF: Record<Difficulty, number> = { usor: 4, mediu: 4, greu: 4, expert: 5 };
// Minimum number of entry cells (absolute floor keeps puzzles interesting
// without over-rejecting the naturally sparse small boards).
const MIN_ENTRIES_BY_DIFF: Record<Difficulty, number> = { usor: 6, mediu: 8, greu: 10, expert: 12 };

type BlockGrid = boolean[][];

/** Lengths and members of maximal entry runs in one orientation. */
function runs(isBlock: BlockGrid, dim: number, across: boolean): Array<Array<[number, number]>> {
  const out: Array<Array<[number, number]>> = [];
  for (let a = 0; a < dim; a++) {
    let run: Array<[number, number]> = [];
    for (let b = 0; b < dim; b++) {
      const r = across ? a : b;
      const c = across ? b : a;
      if (!isBlock[r]![c]) run.push([r, c]);
      else if (run.length) {
        out.push(run);
        run = [];
      }
    }
    if (run.length) out.push(run);
  }
  return out;
}

/** Build a block layout with all runs of length 2..maxRun, or null if it can't. */
function makeLayout(
  dim: number,
  density: number,
  maxRun: number,
  minEntries: number,
  rng: Rng,
): BlockGrid | null {
  const isBlock: BlockGrid = Array.from({ length: dim }, () => new Array<boolean>(dim).fill(false));
  for (let i = 0; i < dim; i++) {
    isBlock[0]![i] = true;
    isBlock[i]![0] = true;
  }
  for (let r = 1; r < dim; r++)
    for (let c = 1; c < dim; c++) if (rng.bool(density)) isBlock[r]![c] = true;

  for (let iter = 0; iter < 80; iter++) {
    const all = [...runs(isBlock, dim, true), ...runs(isBlock, dim, false)];
    const offenders = all.filter((run) => run.length < 2 || run.length > maxRun);
    if (offenders.length === 0) break;
    for (const run of offenders) {
      if (run.length === 1) {
        const [r, c] = run[0]!;
        isBlock[r]![c] = true;
      } else if (run.length > maxRun) {
        // Split by blocking a cell just past the max length.
        const [r, c] = run[maxRun]!;
        isBlock[r]![c] = true;
      }
    }
    if (iter === 79) return null;
  }

  const all = [...runs(isBlock, dim, true), ...runs(isBlock, dim, false)];
  if (all.length === 0 || all.some((run) => run.length < 2 || run.length > maxRun)) return null;

  let entries = 0;
  for (let r = 1; r < dim; r++) for (let c = 1; c < dim; c++) if (!isBlock[r]![c]) entries++;
  if (entries < minEntries) return null;
  return isBlock;
}

function cellsFrom(isBlock: BlockGrid, dim: number): Cells {
  return Array.from({ length: dim }, (_, r) =>
    Array.from({ length: dim }, (_, c) =>
      isBlock[r]![c]
        ? ({ kind: 'block', right: null, down: null } as KakuroCell)
        : ({ kind: 'entry' } as KakuroCell),
    ),
  );
}

interface KakuroParams {
  dim: number;
  density: number;
  maxRun: number;
  minEntries: number;
  attempts: number;
}

function attemptBuild(seed: string, p: KakuroParams): KakuroBuild | null {
  const rng = createRng(seed);
  for (let attempt = 0; attempt < p.attempts; attempt++) {
    const isBlock = makeLayout(p.dim, p.density, p.maxRun, p.minEntries, rng.derive(`layout-${attempt}`));
    if (!isBlock) continue;

    // A good layout may support many fills; try several before discarding it.
    for (let fillTry = 0; fillTry < 6; fillTry++) {
      const cells = cellsFrom(isBlock, p.dim);
      const model = buildModel(p.dim, p.dim, cells);
      const solution = fillSolution(model, rng.derive(`fill-${attempt}-${fillTry}`));
      if (!solution) break;

      // Derive each run's sum from the base solution and write it on the clue cell.
      for (const run of model.runs) {
        const total = run.cells.reduce((acc, [r, c]) => acc + solution[r]![c]!, 0);
        const [cr, cc] = run.clue;
        const clue = cells[cr]![cc]!;
        if (clue.kind !== 'block') continue;
        if (run.dir === 'across') clue.right = total;
        else clue.down = total;
      }

      // Independent uniqueness check with the sum constraints in place.
      if (countSolutions(p.dim, p.dim, cells, 2) === 1) {
        return { width: p.dim, height: p.dim, cells, solution, entryCount: model.entryCells.length };
      }
    }
  }
  return null;
}

export function generateKakuro(seed: string, difficulty: Difficulty): KakuroBuild {
  const dim = DIM_BY_DIFF[difficulty];
  // Primary params, then progressively easier relaxations (higher density and
  // shorter runs make unique puzzles more common) so generation never gives up.
  const paramSets: KakuroParams[] = [
    { dim, density: DENSITY_BY_DIFF[difficulty], maxRun: MAX_RUN_BY_DIFF[difficulty], minEntries: MIN_ENTRIES_BY_DIFF[difficulty], attempts: 500 },
    { dim, density: DENSITY_BY_DIFF[difficulty] + 0.05, maxRun: Math.max(3, MAX_RUN_BY_DIFF[difficulty] - 1), minEntries: MIN_ENTRIES_BY_DIFF[difficulty], attempts: 500 },
    { dim, density: 0.46, maxRun: 3, minEntries: Math.max(6, MIN_ENTRIES_BY_DIFF[difficulty] - 2), attempts: 700 },
  ];
  for (let i = 0; i < paramSets.length; i++) {
    const build = attemptBuild(`${seed}:params${i}`, paramSets[i]!);
    if (build) return build;
  }
  throw new Error(`kakuro: could not build a unique puzzle for ${difficulty}`);
}
