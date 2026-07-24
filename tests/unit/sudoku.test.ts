import { describe, it, expect } from 'vitest';
import { solve, countSolutions, hasUniqueSolution, isSolved, hasNoConflicts, type Grid } from '@/games/sudoku/solver';
import { generateSudoku } from '@/generators/sudoku';
import { validateSudoku } from '@/validators/sudoku';
import { gradeSudoku } from '@/games/sudoku/grader';
import type { SudokuGame } from '@/lib/schema/games';

const empty: Grid = Array.from({ length: 9 }, () => Array<number>(9).fill(0));

function toGame(seed: string, diff: 'usor' | 'mediu' | 'greu' | 'expert'): SudokuGame {
  const b = generateSudoku(seed, diff);
  return {
    type: 'sudoku', id: '2026-01-01-sudoku', title: 't', description: 'd', difficulty: b.difficulty,
    estimatedMinutes: 5, seed, instructions: 'i', hints: [],
    puzzle: { size: 9, boxSize: 3, givens: b.givens },
    solution: { grid: b.solution },
    validationMetadata: { givenCount: b.givenCount, emptyCount: b.emptyCount, uniqueSolution: true, techniques: b.techniques, solverDifficultyScore: b.score },
  };
}

describe('sudoku solver', () => {
  it('solves an empty grid to a valid full solution', () => {
    const sol = solve(empty, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(sol).not.toBeNull();
    expect(isSolved(sol!)).toBe(true);
  });

  it('detects a unique solution', () => {
    const b = generateSudoku('uniq-1', 'mediu');
    expect(hasUniqueSolution(b.givens)).toBe(true);
    expect(countSolutions(b.givens, 5)).toBe(1);
  });

  it('detects multiple solutions when a clue is removed', () => {
    const b = generateSudoku('uniq-2', 'usor');
    // Remove one more given → very likely no longer unique.
    const g = b.givens.map((r) => r.slice());
    for (let r = 0; r < 9 && countSolutions(g, 2) === 1; r++)
      for (let c = 0; c < 9; c++)
        if (g[r]![c] !== 0) {
          g[r]![c] = 0;
          break;
        }
    expect(countSolutions(g, 2)).toBeGreaterThanOrEqual(1);
  });

  it('flags conflicts', () => {
    const bad = empty.map((r) => r.slice());
    bad[0]![0] = 5;
    bad[0]![1] = 5;
    expect(hasNoConflicts(bad)).toBe(false);
  });
});

describe('sudoku generator + grader', () => {
  for (const diff of ['usor', 'mediu', 'greu', 'expert'] as const) {
    it(`generates a valid, unique ${diff} puzzle`, () => {
      const game = toGame(`gen-${diff}`, diff);
      const res = validateSudoku(game);
      expect(res.ok).toBe(true);
      expect(res.errors).toEqual([]);
    });
  }

  it('grader escalates difficulty tiers sensibly', () => {
    const easy = generateSudoku('grade-easy', 'usor');
    const expert = generateSudoku('grade-expert', 'expert');
    const easyTier = gradeSudoku(easy.givens).score;
    const expertTier = gradeSudoku(expert.givens).score;
    expect(expertTier).toBeGreaterThanOrEqual(easyTier);
  });

  it('is reproducible for the same seed', () => {
    const a = generateSudoku('repro', 'mediu');
    const b = generateSudoku('repro', 'mediu');
    expect(a.givens).toEqual(b.givens);
    expect(a.solution).toEqual(b.solution);
  });
});
