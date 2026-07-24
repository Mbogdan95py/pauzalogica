import type { NonogramGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { computeClues, isUnique, type Grid } from '@/games/nonogram/solver';

/**
 * Independent Nonogram validation: recomputes the clues from the published
 * solution, confirms they match, and re-solves to prove the solution is unique.
 */
export function validateNonogram(game: NonogramGame): ValidatorResult {
  const c = new Checker();
  const { width, height, rowClues, colClues } = game.puzzle;
  const grid = game.solution.grid as Grid;

  c.assert(grid.length === height, 'Înălțimea soluției nu corespunde.');
  c.assert(grid.every((row) => row.length === width), 'Lățimea soluției nu corespunde.');
  c.assert(rowClues.length === height, 'Numărul de indicii pe rânduri nu corespunde.');
  c.assert(colClues.length === width, 'Numărul de indicii pe coloane nu corespunde.');
  if (!c.result().ok) return c.result();

  for (const row of grid)
    for (const v of row) c.assert(v === 0 || v === 1, 'Celulă de soluție invalidă (doar 0/1).');

  // Clues must match the solution exactly.
  const recomputed = computeClues(grid);
  c.assert(
    JSON.stringify(recomputed.rowClues) === JSON.stringify(rowClues),
    'Indiciile pe rânduri nu corespund soluției.',
  );
  c.assert(
    JSON.stringify(recomputed.colClues) === JSON.stringify(colClues),
    'Indiciile pe coloane nu corespund soluției.',
  );

  // Uniqueness via independent solve.
  c.assert(isUnique(rowClues, colClues, grid), 'Nonograma nu are soluție unică.');

  c.assert(game.validationMetadata.uniqueSolution === true, 'Metadate: soluție neunică.');

  return c.result();
}
