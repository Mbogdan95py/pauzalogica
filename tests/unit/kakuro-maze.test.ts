import { describe, it, expect } from 'vitest';
import { generateKakuro } from '@/generators/kakuro';
import { validateKakuro } from '@/validators/kakuro';
import { countSolutions } from '@/games/kakuro/solver';
import { generateMaze } from '@/generators/maze';
import { validateMaze } from '@/validators/maze';
import { solveMaze, wallsAreConsistent } from '@/games/maze/model';
import type { KakuroGame, MazeGame } from '@/lib/schema/games';

describe('kakuro', () => {
  for (const diff of ['usor', 'mediu', 'greu', 'expert'] as const) {
    it(`generates a unique ${diff} puzzle that validates`, () => {
      const b = generateKakuro(`kak-${diff}`, diff);
      expect(countSolutions(b.width, b.height, b.cells, 2)).toBe(1);
      const game: KakuroGame = {
        type: 'kakuro', id: '2026-01-01-kakuro', title: 't', description: 'd', difficulty: diff,
        estimatedMinutes: 5, seed: 's', instructions: 'i', hints: [],
        puzzle: { width: b.width, height: b.height, cells: b.cells },
        solution: { grid: b.solution },
        validationMetadata: { entryCount: b.entryCount, uniqueSolution: true },
      };
      const res = validateKakuro(game);
      expect(res.ok).toBe(true);
    });
  }
});

describe('maze', () => {
  for (const diff of ['usor', 'mediu', 'greu', 'expert'] as const) {
    it(`generates a solvable ${diff} maze that validates`, () => {
      const b = generateMaze(`maze-${diff}`, diff);
      expect(wallsAreConsistent(b.walls, b.width, b.height)).toBe(true);
      const path = solveMaze(b.walls, b.width, b.height, b.start, b.end);
      expect(path).not.toBeNull();
      const game: MazeGame = {
        type: 'labirint', id: '2026-01-01-labirint', title: 't', description: 'd', difficulty: diff,
        estimatedMinutes: 5, seed: 's', instructions: 'i', hints: [],
        puzzle: { width: b.width, height: b.height, walls: b.walls, start: b.start, end: b.end, algorithm: b.algorithm },
        solution: { path: b.path },
        validationMetadata: { pathLength: b.path.length, hasSolution: true },
      };
      expect(validateMaze(game).ok).toBe(true);
    });
  }

  it('uses both generation algorithms across seeds', () => {
    const algos = new Set<string>();
    for (let i = 0; i < 20; i++) algos.add(generateMaze(`algo-${i}`, 'mediu').algorithm);
    expect(algos.size).toBeGreaterThan(1);
  });
});
