import type { CrosswordGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { has, isClean } from '@/lib/dictionary';
import { normalizeForGrid, toLowerRo, cleanText } from '@/lib/text/diacritics';
import { clueContainsAnswer } from '@/lib/dictionary/definitions';

// Floor for crossing density in the no-adjacency criss-cross architecture
// (see docs/puzzle-validation.md). Connectivity — every word crossing at least
// one other, forming a single component — is checked separately below.
const MIN_INTERSECTION_RATIO = 0.14;

/**
 * Independent crossword validation. Rebuilds the letter grid from the entries,
 * confirms it matches the published solution and that crossings are consistent,
 * and checks every answer is a clean dictionary word with a non-revealing,
 * non-duplicated clue.
 */
export function validateCrossword(game: CrosswordGame): ValidatorResult {
  const c = new Checker();
  const { width, height, blocks, numbers, entries } = game.puzzle;
  const solution = game.solution.grid;

  c.assert(blocks.length === height && blocks.every((r) => r.length === width), 'Dimensiune blocuri greșită.');
  c.assert(solution.length === height && solution.every((r) => r.length === width), 'Dimensiune soluție greșită.');
  c.assert(entries.length >= 4, 'Prea puține definiții.');
  if (!c.result().ok) return c.result();

  const answers = new Set<string>();
  const clues = new Set<string>();
  for (const e of entries) {
    const norm = normalizeForGrid(e.answer);
    c.assert(norm.length === e.length, `Lungime greșită pentru „${e.answer}”.`);
    c.assert(norm.length >= 2, 'Cuvânt de o literă.');
    c.assert(has(norm), `„${e.answer}” nu este în dicționar.`);
    c.assert(isClean(norm), `„${e.answer}” nu este permis.`);
    c.assert(!answers.has(norm), `Răspuns duplicat: „${e.answer}”.`);
    answers.add(norm);
    const clueKey = toLowerRo(cleanText(e.clue)).replace(/[^a-zăâîșț0-9]/gi, '');
    c.assert(!!e.clue && !clueContainsAnswer(e.clue, e.answer), `Definiția dezvăluie răspunsul: „${e.answer}”.`);
    c.assert(!clues.has(clueKey), 'Două definiții aproape identice.');
    clues.add(clueKey);
  }

  // Rebuild the grid from entries and compare with the published solution.
  const rebuilt: string[][] = Array.from({ length: height }, () => new Array<string>(width).fill(''));
  let placementOk = true;
  for (const e of entries) {
    const norm = normalizeForGrid(e.answer);
    const dr = e.direction === 'down' ? 1 : 0;
    const dc = e.direction === 'across' ? 1 : 0;
    for (let i = 0; i < norm.length; i++) {
      const r = e.row + dr * i;
      const col = e.col + dc * i;
      if (r < 0 || r >= height || col < 0 || col >= width) {
        placementOk = false;
        break;
      }
      const prev = rebuilt[r]![col];
      if (prev !== '' && prev !== norm[i]) placementOk = false;
      rebuilt[r]![col] = norm[i]!;
    }
  }
  c.assert(placementOk, 'Definițiile se suprapun cu litere contradictorii.');

  // Compare rebuilt vs solution vs blocks.
  let matches = true;
  let letterCells = 0;
  let crossed = 0;
  const cover: number[][] = Array.from({ length: height }, () => new Array<number>(width).fill(0));
  for (const e of entries) {
    const dr = e.direction === 'down' ? 1 : 0;
    const dc = e.direction === 'across' ? 1 : 0;
    for (let i = 0; i < e.length; i++) cover[e.row + dr * i]![e.col + dc * i]!++;
  }
  for (let r = 0; r < height; r++) {
    for (let col = 0; col < width; col++) {
      const isBlock = blocks[r]![col]!;
      const sol = solution[r]![col] ?? '';
      if (isBlock) {
        c.assert(sol === '', `Celulă bloc cu literă la ${r},${col}.`);
      } else {
        if (rebuilt[r]![col] !== normalizeForGrid(sol)) matches = false;
        letterCells++;
        if (cover[r]![col]! >= 2) crossed++;
      }
    }
  }
  c.assert(matches, 'Soluția publicată nu corespunde definițiilor.');

  // Numbering: entry start cells must be numbered.
  for (const e of entries)
    c.assert(numbers[e.row]![e.col]! === e.number && e.number > 0, `Numerotare greșită pentru definiția ${e.number}.`);

  const ratio = letterCells ? crossed / letterCells : 0;
  c.assert(ratio >= MIN_INTERSECTION_RATIO, `Prea puține intersecții (${(ratio * 100).toFixed(0)}%).`);

  // Connectivity: every entry must cross at least one other entry, and all
  // entries must form a single connected component (no isolated areas).
  const cellOwners = new Map<string, number[]>();
  entries.forEach((e, idx) => {
    const dr = e.direction === 'down' ? 1 : 0;
    const dc = e.direction === 'across' ? 1 : 0;
    for (let i = 0; i < e.length; i++) {
      const k = `${e.row + dr * i},${e.col + dc * i}`;
      const owners = cellOwners.get(k) ?? [];
      owners.push(idx);
      cellOwners.set(k, owners);
    }
  });
  const adj: Set<number>[] = entries.map(() => new Set<number>());
  for (const owners of cellOwners.values()) {
    if (owners.length >= 2) {
      for (const a of owners) for (const b of owners) if (a !== b) adj[a]!.add(b);
    }
  }
  entries.forEach((e, idx) => {
    c.assert(adj[idx]!.size >= 1, `Cuvântul „${e.answer}” nu se intersectează cu nimic.`);
  });
  const visited = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const nb of adj[cur]!) {
      if (!visited.has(nb)) {
        visited.add(nb);
        stack.push(nb);
      }
    }
  }
  c.assert(visited.size === entries.length, 'Careul conține zone izolate.');

  return c.result();
}
