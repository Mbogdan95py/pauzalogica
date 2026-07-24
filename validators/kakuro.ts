import type { KakuroGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { buildModel, type Cells } from '@/games/kakuro/model';
import { countSolutions, solve } from '@/games/kakuro/solver';

/**
 * Independent Kakuro validation: checks run lengths and digit rules, re-derives
 * the solution with the sum-constrained solver, confirms it matches and that it
 * is unique. Never trusts the generator.
 */
export function validateKakuro(game: KakuroGame): ValidatorResult {
  const c = new Checker();
  const { width, height, cells } = game.puzzle;
  const solution = game.solution.grid;

  c.assert(cells.length === height, 'Înălțimea grilei nu corespunde.');
  c.assert(cells.every((row) => row.length === width), 'Lățimea grilei nu corespunde.');
  if (!c.result().ok) return c.result();

  const model = buildModel(width, height, cells as Cells);

  // Every run must be length 2..9 and have a clue sum.
  for (const run of model.runs) {
    c.assert(run.cells.length >= 2, `Serie de lungime ${run.cells.length} (minim 2).`);
    c.assert(run.cells.length <= 9, `Serie prea lungă (${run.cells.length}).`);
    c.assert(run.sum !== null && run.sum >= 1 && run.sum <= 45, 'Serie fără sumă validă.');
  }

  // Solution digits + distinctness + sum match.
  for (const run of model.runs) {
    const seen = new Set<number>();
    let total = 0;
    for (const [r, cc] of run.cells) {
      const v = solution[r]![cc]!;
      c.assert(v >= 1 && v <= 9, 'Cifră de soluție invalidă (1..9).');
      c.assert(!seen.has(v), 'Cifre repetate într-o serie.');
      seen.add(v);
      total += v;
    }
    c.assert(run.sum === total, `Suma seriei (${run.sum}) nu corespunde soluției (${total}).`);
  }

  // Block cells must be 0 in the solution.
  for (let r = 0; r < height; r++)
    for (let cc = 0; cc < width; cc++)
      if (cells[r]![cc]!.kind === 'block')
        c.assert(solution[r]![cc]! === 0, 'Celulă bloc cu valoare nenulă în soluție.');

  // Independent solve + uniqueness.
  const solved = solve(width, height, cells as Cells);
  c.assert(solved !== null, 'Kakuro nu are soluție.');
  if (solved) {
    let matches = true;
    for (let r = 0; r < height; r++)
      for (let cc = 0; cc < width; cc++) if (solved[r]![cc] !== solution[r]![cc]) matches = false;
    c.assert(matches, 'Soluția publicată nu corespunde soluției calculate.');
  }
  c.assert(countSolutions(width, height, cells as Cells, 2) === 1, 'Kakuro nu are soluție unică.');

  return c.result();
}
