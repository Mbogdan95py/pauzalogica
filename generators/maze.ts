import { createRng, type Rng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { ALL_WALLS, DIRS, inBounds, solveMaze, type Walls } from '@/games/maze/model';

export interface MazeBuild {
  width: number;
  height: number;
  walls: Walls;
  start: { row: number; col: number };
  end: { row: number; col: number };
  path: Array<{ row: number; col: number }>;
  algorithm: string;
}

const SIZE_BY_DIFF: Record<Difficulty, number> = { usor: 9, mediu: 13, greu: 17, expert: 21 };

function fullWalls(width: number, height: number): Walls {
  return Array.from({ length: height }, () => new Array<number>(width).fill(ALL_WALLS));
}

function carve(walls: Walls, r: number, c: number, dir: (typeof DIRS)[number]) {
  walls[r]![c]! &= ~dir.bit;
  walls[r + dir.dr]![c + dir.dc]! &= ~dir.opposite;
}

/** Recursive backtracker (randomized DFS). */
function recursiveBacktracker(width: number, height: number, rng: Rng): Walls {
  const walls = fullWalls(width, height);
  const visited = Array.from({ length: height }, () => new Array<boolean>(width).fill(false));
  const stack: Array<[number, number]> = [[0, 0]];
  visited[0]![0] = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1]!;
    const options = rng
      .shuffled(DIRS)
      .filter((d) => inBounds(r + d.dr, c + d.dc, height, width) && !visited[r + d.dr]![c + d.dc]);
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const dir = options[0]!;
    carve(walls, r, c, dir);
    visited[r + dir.dr]![c + dir.dc] = true;
    stack.push([r + dir.dr, c + dir.dc]);
  }
  return walls;
}

/** Randomized Prim's algorithm. */
function primMaze(width: number, height: number, rng: Rng): Walls {
  const walls = fullWalls(width, height);
  const inMaze = Array.from({ length: height }, () => new Array<boolean>(width).fill(false));
  type Edge = { r: number; c: number; dir: (typeof DIRS)[number] };
  const frontier: Edge[] = [];
  const addEdges = (r: number, c: number) => {
    for (const dir of DIRS)
      if (inBounds(r + dir.dr, c + dir.dc, height, width) && !inMaze[r + dir.dr]![c + dir.dc])
        frontier.push({ r, c, dir });
  };
  inMaze[0]![0] = true;
  addEdges(0, 0);
  while (frontier.length) {
    const idx = rng.int(0, frontier.length - 1);
    const edge = frontier.splice(idx, 1)[0]!;
    const nr = edge.r + edge.dir.dr;
    const nc = edge.c + edge.dir.dc;
    if (inMaze[nr]![nc]) continue;
    carve(walls, edge.r, edge.c, edge.dir);
    inMaze[nr]![nc] = true;
    addEdges(nr, nc);
  }
  return walls;
}

export function generateMaze(seed: string, difficulty: Difficulty): MazeBuild {
  const rng = createRng(seed);
  const size = SIZE_BY_DIFF[difficulty];
  const useDfs = rng.bool();
  const walls = useDfs ? recursiveBacktracker(size, size, rng) : primMaze(size, size, rng);
  const start = { row: 0, col: 0 };
  const end = { row: size - 1, col: size - 1 };
  const path = solveMaze(walls, size, size, start, end);
  if (!path) throw new Error('maze: generated maze has no solution (should be impossible)');
  return {
    width: size,
    height: size,
    walls,
    start,
    end,
    path,
    algorithm: useDfs ? 'recursive-backtracker' : 'prim',
  };
}
