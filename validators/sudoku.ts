import type { SudokuGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import {
  SIZE,
  cloneGrid,
  countSolutions,
  hasNoConflicts,
  isSolved,
  type Grid,
} from '@/games/sudoku/solver';

function isNineByNine(grid: unknown): grid is Grid {
  return (
    Array.isArray(grid) &&
    grid.length === SIZE &&
    grid.every((row) => Array.isArray(row) && row.length === SIZE)
  );
}

/**
 * Independent Sudoku validation. Re-solves the givens from scratch, confirms the
 * solution is unique and matches the published solution, and checks every given
 * is consistent with it. Does not trust the generator's metadata.
 */
export function validateSudoku(game: SudokuGame): ValidatorResult {
  const c = new Checker();
  const { givens } = game.puzzle;
  const { grid: solution } = game.solution;

  c.assert(game.puzzle.size === 9, 'Dimensiune Sudoku incorectă (trebuie 9).');
  c.assert(isNineByNine(givens), 'Grila de indicii nu este 9×9.');
  c.assert(isNineByNine(solution), 'Grila soluție nu este 9×9.');
  if (!isNineByNine(givens) || !isNineByNine(solution)) return c.result();

  // Value ranges.
  for (let r = 0; r < SIZE; r++) {
    for (let col = 0; col < SIZE; col++) {
      const g = givens[r]![col]!;
      const s = solution[r]![col]!;
      c.assert(g >= 0 && g <= 9, `Valoare indiciu invalidă la ${r},${col}.`);
      c.assert(s >= 1 && s <= 9, `Valoare soluție invalidă la ${r},${col}.`);
    }
  }

  // Solution must be complete and conflict-free.
  c.assert(hasNoConflicts(solution), 'Soluția conține contradicții.');
  c.assert(isSolved(solution), 'Soluția nu este completă și corectă.');

  // Every given must match the solution.
  let mismatched = false;
  let givenCount = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let col = 0; col < SIZE; col++) {
      const g = givens[r]![col]!;
      if (g !== 0) {
        givenCount++;
        if (g !== solution[r]![col]!) mismatched = true;
      }
    }
  }
  c.assert(!mismatched, 'Un indiciu nu corespunde soluției publicate.');

  // Uniqueness: the givens must yield exactly one solution.
  c.assert(hasNoConflicts(givens), 'Grila de indicii conține contradicții.');
  const solutions = countSolutions(cloneGrid(givens), 2);
  c.assert(solutions === 1, `Grila nu are soluție unică (găsite: ${solutions}).`);

  // Metadata sanity.
  c.assert(game.validationMetadata.givenCount === givenCount, 'givenCount din metadate nu corespunde.');
  c.assert(
    game.validationMetadata.emptyCount === SIZE * SIZE - givenCount,
    'emptyCount din metadate nu corespunde.',
  );
  c.warn(givenCount >= 17, 'Sudoku cu mai puțin de 17 indicii nu poate fi unic.');

  return c.result();
}
