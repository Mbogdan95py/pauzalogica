import type { Game } from '@/lib/schema/games';
import { hashObject } from '@/lib/hash';
import { normalizeForGrid, toLowerRo, cleanText } from '@/lib/text/diacritics';

/**
 * Extracts the fingerprints of a single game for each dedup category. These are
 * what the archive checks against to prevent repeats (grids, seeds, answers,
 * clue definitions, and word sets).
 */
export interface GameFingerprints {
  grids: string[];
  seeds: string[];
  answers: string[];
  definitions: string[];
  wordsets: string[];
}

function empty(): GameFingerprints {
  return { grids: [], seeds: [], answers: [], definitions: [], wordsets: [] };
}

function wordsetKey(words: string[]): string {
  return words.map((w) => normalizeForGrid(w)).sort().join('|');
}

export function fingerprintGame(game: Game): GameFingerprints {
  const fp = empty();
  fp.seeds.push(game.seed);

  switch (game.type) {
    case 'sudoku':
      fp.grids.push(hashObject(game.solution.grid));
      break;
    case 'nonograma':
      fp.grids.push(hashObject(game.solution.grid));
      break;
    case 'kakuro':
      fp.grids.push(hashObject({ cells: game.puzzle.cells, grid: game.solution.grid }));
      break;
    case 'labirint':
      fp.grids.push(hashObject(game.puzzle.walls));
      break;
    case 'cuvinte-ascunse':
      fp.grids.push(hashObject(game.puzzle.grid));
      fp.wordsets.push(wordsetKey(game.puzzle.words.map((w) => w.normalized)));
      break;
    case 'rebus':
    case 'careu':
    case 'integrame':
      fp.grids.push(hashObject(game.solution.grid));
      // Dedup the *combination* of words (structura rebusului), not each common
      // answer — crosswords legitimately reuse everyday words across days.
      fp.wordsets.push(wordsetKey(game.puzzle.entries.map((e) => e.answer)));
      for (const e of game.puzzle.entries) {
        fp.definitions.push(toLowerRo(cleanText(e.clue)));
      }
      break;
    case 'anagrame':
      fp.wordsets.push(wordsetKey(game.solution.answers));
      for (const a of game.solution.answers) fp.answers.push(normalizeForGrid(a));
      break;
    case 'provocare-rapida':
      fp.answers.push(normalizeForGrid(game.solution.answer));
      break;
    case 'cuvant-misterios':
      fp.answers.push(normalizeForGrid(game.solution.answer));
      break;
    case 'secvente-logice':
      // Only the seed differentiates these; the rule text is a soft signal.
      fp.answers.push(`seq:${toLowerRo(cleanText(game.solution.rule))}`);
      break;
  }
  return fp;
}
