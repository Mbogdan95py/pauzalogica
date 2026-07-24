/**
 * Maze representation: a per-cell wall bitmask.
 *   1 = North wall, 2 = East wall, 4 = South wall, 8 = West wall.
 * A perfect maze (spanning tree) has exactly one path between any two cells.
 */

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
export const ALL_WALLS = N | E | S | W;

export interface Dir {
  bit: number;
  dr: number;
  dc: number;
  opposite: number;
}

export const DIRS: Dir[] = [
  { bit: N, dr: -1, dc: 0, opposite: S },
  { bit: E, dr: 0, dc: 1, opposite: W },
  { bit: S, dr: 1, dc: 0, opposite: N },
  { bit: W, dr: 0, dc: -1, opposite: E },
];

export type Walls = number[][];

export function inBounds(r: number, c: number, height: number, width: number): boolean {
  return r >= 0 && r < height && c >= 0 && c < width;
}

/** Is there an open passage from (r,c) toward direction `dir`? */
export function isOpen(walls: Walls, r: number, c: number, dir: Dir): boolean {
  return (walls[r]![c]! & dir.bit) === 0;
}

/** BFS shortest path from start to end following open passages. */
export function solveMaze(
  walls: Walls,
  width: number,
  height: number,
  start: { row: number; col: number },
  end: { row: number; col: number },
): Array<{ row: number; col: number }> | null {
  const prev = new Map<number, number>();
  const startId = start.row * width + start.col;
  const endId = end.row * width + end.col;
  const queue: number[] = [startId];
  const seen = new Set<number>([startId]);

  while (queue.length) {
    const id = queue.shift()!;
    if (id === endId) break;
    const r = Math.floor(id / width);
    const c = id % width;
    for (const dir of DIRS) {
      if (!isOpen(walls, r, c, dir)) continue;
      const nr = r + dir.dr;
      const nc = c + dir.dc;
      if (!inBounds(nr, nc, height, width)) continue;
      const nid = nr * width + nc;
      if (seen.has(nid)) continue;
      seen.add(nid);
      prev.set(nid, id);
      queue.push(nid);
    }
  }

  if (!seen.has(endId)) return null;
  const path: Array<{ row: number; col: number }> = [];
  let cur = endId;
  while (cur !== startId) {
    path.push({ row: Math.floor(cur / width), col: cur % width });
    const p = prev.get(cur);
    if (p === undefined) return null;
    cur = p;
  }
  path.push({ row: start.row, col: start.col });
  path.reverse();
  return path;
}

/** Walls must be symmetric: A's east wall ⇔ B's west wall. */
export function wallsAreConsistent(walls: Walls, width: number, height: number): boolean {
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      for (const dir of DIRS) {
        const nr = r + dir.dr;
        const nc = c + dir.dc;
        if (!inBounds(nr, nc, height, width)) continue;
        const here = (walls[r]![c]! & dir.bit) !== 0;
        const there = (walls[nr]![nc]! & dir.opposite) !== 0;
        if (here !== there) return false;
      }
    }
  }
  return true;
}
