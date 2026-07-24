import type { KakuroCell } from '@/lib/schema/games';

export type Cells = KakuroCell[][];

export interface Run {
  id: number;
  dir: 'across' | 'down';
  cells: Array<[number, number]>;
  clue: [number, number];
  sum: number | null;
}

export interface KakuroModel {
  width: number;
  height: number;
  cells: Cells;
  entryCells: Array<[number, number]>;
  runs: Run[];
  /** per entry cell (keyed "r,c"): its across/down run ids and last-in-run flags */
  acrossRunOf: Map<string, number>;
  downRunOf: Map<string, number>;
}

export function key(r: number, c: number): string {
  return `${r},${c}`;
}

export function isEntry(cell: KakuroCell): boolean {
  return cell.kind === 'entry';
}

/**
 * Extract across/down runs from a Kakuro grid. A run is a maximal sequence of
 * consecutive entry cells; its clue is the block cell immediately to the
 * left (across) or above (down).
 */
export function buildModel(width: number, height: number, cells: Cells): KakuroModel {
  const runs: Run[] = [];
  const acrossRunOf = new Map<string, number>();
  const downRunOf = new Map<string, number>();
  const entryCells: Array<[number, number]> = [];

  for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++) if (cells[r]![c]!.kind === 'entry') entryCells.push([r, c]);

  // Across runs.
  for (let r = 0; r < height; r++) {
    let c = 0;
    while (c < width) {
      if (cells[r]![c]!.kind !== 'entry') {
        c++;
        continue;
      }
      const start = c;
      const cellList: Array<[number, number]> = [];
      while (c < width && cells[r]![c]!.kind === 'entry') {
        cellList.push([r, c]);
        c++;
      }
      const clueCell = cells[r]![start - 1];
      const sum = clueCell && clueCell.kind === 'block' ? clueCell.right : null;
      const id = runs.length;
      runs.push({ id, dir: 'across', cells: cellList, clue: [r, start - 1], sum });
      for (const [rr, cc] of cellList) acrossRunOf.set(key(rr, cc), id);
    }
  }

  // Down runs.
  for (let c = 0; c < width; c++) {
    let r = 0;
    while (r < height) {
      if (cells[r]![c]!.kind !== 'entry') {
        r++;
        continue;
      }
      const start = r;
      const cellList: Array<[number, number]> = [];
      while (r < height && cells[r]![c]!.kind === 'entry') {
        cellList.push([r, c]);
        r++;
      }
      const clueCell = cells[start - 1]?.[c];
      const sum = clueCell && clueCell.kind === 'block' ? clueCell.down : null;
      const id = runs.length;
      runs.push({ id, dir: 'down', cells: cellList, clue: [start - 1, c], sum });
      for (const [rr, cc] of cellList) downRunOf.set(key(rr, cc), id);
    }
  }

  return { width, height, cells, entryCells, runs, acrossRunOf, downRunOf };
}

/** Smallest / largest sum achievable with `k` distinct unused digits (1..9). */
export function minMaxFor(k: number, usedMask: number): [number, number] {
  let min = 0;
  let max = 0;
  let taken = 0;
  for (let v = 1; v <= 9 && taken < k; v++) {
    if (usedMask & (1 << v)) continue;
    min += v;
    taken++;
  }
  taken = 0;
  for (let v = 9; v >= 1 && taken < k; v--) {
    if (usedMask & (1 << v)) continue;
    max += v;
    taken++;
  }
  return [min, max];
}
