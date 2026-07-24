import type { AnagramGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';
import { normalizeForGrid } from '@/lib/text/diacritics';
import { has, isClean } from '@/lib/dictionary';
import { anagramSolutionCount } from '@/generators/anagram';

/**
 * Independent anagram validation: each scrambled string must be a permutation
 * of its (dictionary, clean) answer, must not equal the answer itself, and must
 * not be wildly ambiguous.
 */
export function validateAnagram(game: AnagramGame): ValidatorResult {
  const c = new Checker();
  const { items } = game.puzzle;
  const answers = game.solution.answers;

  c.assert(items.length === answers.length, 'Număr diferit de anagrame și răspunsuri.');
  c.assert(items.length >= 3, 'Prea puține anagrame.');
  if (!c.result().ok) return c.result();

  const seen = new Set<string>();
  items.forEach((item, i) => {
    const answer = answers[i]!;
    const norm = normalizeForGrid(answer);
    c.assert(has(norm), `„${answer}” nu este în dicționar.`);
    c.assert(isClean(norm), `„${answer}” nu este permis.`);
    c.assert(!seen.has(norm), `Răspuns duplicat: „${answer}”.`);
    seen.add(norm);
    c.assert(item.length === norm.length, `Lungime greșită la anagrama ${i + 1}.`);
    c.assert(item.scrambled !== norm, `Anagrama ${i + 1} nu este amestecată.`);
    c.assert(
      item.scrambled.split('').sort().join('') === norm.split('').sort().join(''),
      `Anagrama ${i + 1} nu este o permutare a răspunsului.`,
    );
    c.assert(anagramSolutionCount(norm) <= 2, `Anagrama ${i + 1} are prea multe soluții echivalente.`);
    c.assert(game.hints.length <= 3, 'Prea multe indicii (max 3).');
  });

  return c.result();
}
