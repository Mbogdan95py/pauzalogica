import { describe, it, expect } from 'vitest';
import { cluesForLine, computeClues, solveLine, isUnique, type Grid } from '@/games/nonogram/solver';
import { generateNonogram } from '@/generators/nonogram';
import { validateNonogram } from '@/validators/nonogram';
import type { NonogramGame } from '@/lib/schema/games';

describe('nonogram solver', () => {
  it('computes line clues correctly', () => {
    expect(cluesForLine([1, 1, 0, 1, 1, 1])).toEqual([2, 3]);
    expect(cluesForLine([0, 0, 0])).toEqual([]);
    expect(cluesForLine([1, 1, 1])).toEqual([3]);
  });

  it('solveLine fully determines a forced line', () => {
    // clue [5] in length 5 → all filled.
    const line = solveLine([5], [-1, -1, -1, -1, -1]);
    expect(line).toEqual([1, 1, 1, 1, 1]);
  });

  it('solveLine returns null on contradiction', () => {
    expect(solveLine([3], [0, 0, 0])).toBeNull();
  });

  it('isUnique confirms a known solvable grid', () => {
    const grid: Grid = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ];
    const { rowClues, colClues } = computeClues(grid);
    expect(isUnique(rowClues, colClues, grid)).toBe(true);
  });
});

describe('nonogram generator', () => {
  for (const diff of ['usor', 'mediu', 'greu'] as const) {
    it(`generates a unique ${diff} puzzle that validates`, () => {
      const b = generateNonogram(`nono-${diff}`, diff);
      const game: NonogramGame = {
        type: 'nonograma', id: '2026-01-01-nonograma', title: 't', description: 'd', difficulty: diff,
        estimatedMinutes: 5, seed: 's', instructions: 'i', hints: [],
        puzzle: { width: b.width, height: b.height, rowClues: b.rowClues, colClues: b.colClues },
        solution: { grid: b.solution },
        validationMetadata: { filledRatio: b.filledRatio, uniqueSolution: true, lineSolvable: true },
      };
      const res = validateNonogram(game);
      expect(res.ok).toBe(true);
    });
  }
});
