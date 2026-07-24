import type { QuickChallengeGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { normalizeForGrid } from '@/lib/text/diacritics';
import { has, isClean } from '@/lib/dictionary';

export function validateQuickChallenge(game: QuickChallengeGame): ValidatorResult {
  const c = new Checker();
  const norm = normalizeForGrid(game.solution.answer);

  c.assert(norm.length === game.puzzle.length, 'Lungimea răspunsului nu corespunde.');
  c.assert(norm.length >= 5 && norm.length <= 8, 'Cuvântul trebuie să aibă 5–8 litere.');
  c.assert(game.puzzle.maxAttempts === 6, 'Numărul de încercări trebuie să fie 6.');
  c.assert(has(norm), `„${game.solution.answer}” nu este în dicționar.`);
  c.assert(isClean(norm), 'Cuvântul zilei nu este permis.');

  return c.result();
}
