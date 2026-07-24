import type { MysteryWordGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { normalizeForGrid } from '@/lib/text/diacritics';
import { has, isClean } from '@/lib/dictionary';

export function validateMysteryWord(game: MysteryWordGame): ValidatorResult {
  const c = new Checker();
  const norm = normalizeForGrid(game.solution.answer);
  const { length, revealed } = game.puzzle;

  c.assert(norm.length === length, 'Lungimea cuvântului nu corespunde.');
  c.assert(has(norm), `„${game.solution.answer}” nu este în dicționar.`);
  c.assert(isClean(norm), 'Cuvântul misterios nu este permis.');
  c.assert(revealed.length < length, 'Prea multe litere dezvăluite.');
  c.assert(new Set(revealed).size === revealed.length, 'Indici de dezvăluire duplicați.');
  c.assert(revealed.every((i) => i >= 0 && i < length), 'Indice de dezvăluire în afara cuvântului.');
  c.assert(game.puzzle.category.length > 0, 'Categoria lipsește.');
  c.assert(game.validationMetadata.revealedCount === revealed.length, 'Metadate: revealedCount greșit.');

  return c.result();
}
