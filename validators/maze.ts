import type { MazeGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { DIRS, inBounds, isOpen, solveMaze, wallsAreConsistent, type Walls } from '@/games/maze/model';

/**
 * Independent maze validation: checks wall symmetry, that a path from start to
 * end exists, and that the published solution path is contiguous, wall-free and
 * connects the endpoints.
 */
export function validateMaze(game: MazeGame): ValidatorResult {
  const c = new Checker();
  const { width, height, walls, start, end } = game.puzzle;
  const w = walls as Walls;

  c.assert(w.length === height, 'Înălțimea labirintului nu corespunde.');
  c.assert(w.every((row) => row.length === width), 'Lățimea labirintului nu corespunde.');
  if (!c.result().ok) return c.result();

  c.assert(wallsAreConsistent(w, width, height), 'Pereții labirintului nu sunt simetrici.');
  c.assert(
    inBounds(start.row, start.col, height, width) && inBounds(end.row, end.col, height, width),
    'Start/finish în afara grilei.',
  );

  const solved = solveMaze(w, width, height, start, end);
  c.assert(solved !== null, 'Labirintul nu are cale de la start la finish.');

  // Published solution path must be valid.
  const path = game.solution.path;
  c.assert(path.length >= 2, 'Traseul soluție este prea scurt.');
  if (path.length >= 2) {
    c.assert(
      path[0]!.row === start.row && path[0]!.col === start.col,
      'Traseul nu începe la start.',
    );
    c.assert(
      path[path.length - 1]!.row === end.row && path[path.length - 1]!.col === end.col,
      'Traseul nu se termină la finish.',
    );
    let contiguous = true;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const dir = DIRS.find((d) => a.row + d.dr === b.row && a.col + d.dc === b.col);
      if (!dir || !isOpen(w, a.row, a.col, dir)) contiguous = false;
    }
    c.assert(contiguous, 'Traseul trece printr-un perete sau sare peste celule.');
  }

  c.assert(game.validationMetadata.hasSolution === true, 'Metadate: labirint fără soluție.');

  return c.result();
}
