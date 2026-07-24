import { buildModel, minMaxFor, key, type Cells, type KakuroModel } from './model';
import type { Rng } from '@/lib/rng';

/**
 * Kakuro solver. Provides:
 *  - fillSolution: assign digits with only the distinctness constraint (used by
 *    the generator to produce a base solution from which sums are derived);
 *  - countSolutions / solve: full sum-constrained search with min/max pruning,
 *    used to verify uniqueness (generator) and re-derive the solution (validator).
 */

interface CellMeta {
  r: number;
  c: number;
  aRun: number;
  aIndex: number;
  aSize: number;
  dRun: number;
  dIndex: number;
  dSize: number;
}

interface Indexed {
  model: KakuroModel;
  order: CellMeta[];
  runSum: number[];
}

function indexModel(model: KakuroModel): Indexed {
  const runSum = model.runs.map((run) => run.sum ?? -1);
  const posInRun = new Map<number, Map<string, number>>();
  for (const run of model.runs) {
    const m = new Map<string, number>();
    run.cells.forEach(([r, c], i) => m.set(key(r, c), i));
    posInRun.set(run.id, m);
  }
  const order: CellMeta[] = model.entryCells.map(([r, c]) => {
    const aRun = model.acrossRunOf.get(key(r, c))!;
    const dRun = model.downRunOf.get(key(r, c))!;
    return {
      r,
      c,
      aRun,
      aIndex: posInRun.get(aRun)!.get(key(r, c))!,
      aSize: model.runs[aRun]!.cells.length,
      dRun,
      dIndex: posInRun.get(dRun)!.get(key(r, c))!,
      dSize: model.runs[dRun]!.cells.length,
    };
  });
  return { model, order, runSum };
}

/** Distinctness-only fill (no sum constraint). Randomized by `rng`. */
export function fillSolution(model: KakuroModel, rng: Rng): number[][] | null {
  const idx = indexModel(model);
  const usedA = model.runs.map(() => 0);
  const usedD = model.runs.map(() => 0);
  const solution: number[][] = Array.from({ length: model.height }, () =>
    new Array<number>(model.width).fill(0),
  );
  const digitsBase = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const rec = (i: number): boolean => {
    if (i === idx.order.length) return true;
    const cell = idx.order[i]!;
    const digits = rng.shuffled(digitsBase);
    for (const v of digits) {
      const bit = 1 << v;
      if (usedA[cell.aRun]! & bit) continue;
      if (usedD[cell.dRun]! & bit) continue;
      usedA[cell.aRun]! |= bit;
      usedD[cell.dRun]! |= bit;
      solution[cell.r]![cell.c] = v;
      if (rec(i + 1)) return true;
      usedA[cell.aRun]! &= ~bit;
      usedD[cell.dRun]! &= ~bit;
      solution[cell.r]![cell.c] = 0;
    }
    return false;
  };

  return rec(0) ? solution : null;
}

function search(idx: Indexed, limit: number, collect?: number[][]): number {
  const { model, order, runSum } = idx;
  const usedA = model.runs.map(() => 0);
  const usedD = model.runs.map(() => 0);
  const sumA = model.runs.map(() => 0);
  const sumD = model.runs.map(() => 0);
  const grid: number[][] = Array.from({ length: model.height }, () =>
    new Array<number>(model.width).fill(0),
  );
  let count = 0;

  const rec = (i: number): boolean => {
    if (i === order.length) {
      count++;
      if (collect && count === 1) for (let r = 0; r < model.height; r++) collect.push(grid[r]!.slice());
      return count >= limit;
    }
    const cell = order[i]!;
    const aSum = runSum[cell.aRun]!;
    const dSum = runSum[cell.dRun]!;
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      if (usedA[cell.aRun]! & bit) continue;
      if (usedD[cell.dRun]! & bit) continue;

      // Across sum feasibility.
      if (aSum >= 0) {
        const newA = sumA[cell.aRun]! + v;
        if (newA > aSum) continue;
        const remaining = cell.aSize - (cell.aIndex + 1);
        if (remaining === 0) {
          if (newA !== aSum) continue;
        } else {
          const [mn, mx] = minMaxFor(remaining, usedA[cell.aRun]! | bit);
          if (newA + mn > aSum || newA + mx < aSum) continue;
        }
      }
      // Down sum feasibility.
      if (dSum >= 0) {
        const newD = sumD[cell.dRun]! + v;
        if (newD > dSum) continue;
        const remaining = cell.dSize - (cell.dIndex + 1);
        if (remaining === 0) {
          if (newD !== dSum) continue;
        } else {
          const [mn, mx] = minMaxFor(remaining, usedD[cell.dRun]! | bit);
          if (newD + mn > dSum || newD + mx < dSum) continue;
        }
      }

      usedA[cell.aRun]! |= bit;
      usedD[cell.dRun]! |= bit;
      sumA[cell.aRun]! += v;
      sumD[cell.dRun]! += v;
      grid[cell.r]![cell.c] = v;
      const stop = rec(i + 1);
      grid[cell.r]![cell.c] = 0;
      usedA[cell.aRun]! &= ~bit;
      usedD[cell.dRun]! &= ~bit;
      sumA[cell.aRun]! -= v;
      sumD[cell.dRun]! -= v;
      if (stop) return true;
    }
    return false;
  };

  rec(0);
  return count;
}

export function countSolutions(width: number, height: number, cells: Cells, limit = 2): number {
  return search(indexModel(buildModel(width, height, cells)), limit);
}

export function solve(width: number, height: number, cells: Cells): number[][] | null {
  const collect: number[][] = [];
  search(indexModel(buildModel(width, height, cells)), 1, collect);
  return collect.length ? collect : null;
}
