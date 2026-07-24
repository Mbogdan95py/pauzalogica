import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { normalizeForGrid } from '@/lib/text/diacritics';
import { pool, NORMALIZED_SET, type DictWord } from '@/lib/dictionary';

export interface AnagramItemBuild {
  scrambled: string;
  answer: string; // display form
  normalized: string;
  hint?: string;
}

export interface AnagramBuild {
  items: AnagramItemBuild[];
  averageLength: number;
}

const LENGTH_BY_DIFF: Record<Difficulty, [number, number]> = {
  usor: [4, 5],
  mediu: [5, 6],
  greu: [6, 8],
  expert: [7, 10],
};

const COUNT_BY_DIFF: Record<Difficulty, number> = { usor: 4, mediu: 5, greu: 5, expert: 6 };

/** Count dictionary words that are exact anagrams of `normalized`. */
export function anagramSolutionCount(normalized: string): number {
  const target = normalized.split('').sort().join('');
  let count = 0;
  for (const w of NORMALIZED_SET) {
    if (w.length !== normalized.length) continue;
    if (w.split('').sort().join('') === target) count++;
  }
  return count;
}

/** Scramble so the result differs from the original (finite deterministic tries). */
export function scramble(normalized: string, seed: string): string {
  const rng = createRng(seed);
  const letters = normalized.split('');
  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = rng.shuffled(letters);
    const s = shuffled.join('');
    if (s !== normalized) return s;
  }
  // Only possible for degenerate all-same-letter words; rotate instead.
  return normalized.slice(1) + normalized[0];
}

export function generateAnagrams(
  seed: string,
  difficulty: Difficulty,
  themeSlug: string | undefined,
  hints: Map<string, string> | undefined,
): AnagramBuild {
  const rng = createRng(seed);
  const [minL, maxL] = LENGTH_BY_DIFF[difficulty];
  const count = COUNT_BY_DIFF[difficulty];

  let candidates: DictWord[] = pool({ theme: themeSlug, minLength: minL, maxLength: maxL, minFreq: 3 });
  if (candidates.length < count) {
    candidates = pool({ minLength: minL, maxLength: maxL, minFreq: 3 });
  }
  // Keep only words whose anagram solution is essentially unique (≤2 to allow
  // rare benign pairs; the player's answer is checked against the dictionary).
  const usable = candidates.filter((w) => anagramSolutionCount(w.normalized) <= 2);
  if (usable.length < count) throw new Error('anagram: not enough unambiguous words');

  const chosen = rng.sample(usable, count);
  const items: AnagramItemBuild[] = chosen.map((w, i) => ({
    scrambled: scramble(w.normalized, `${seed}:scr:${i}:${w.normalized}`),
    answer: w.display,
    normalized: w.normalized,
    hint: hints?.get(w.normalized),
  }));

  const averageLength = items.reduce((s, it) => s + it.normalized.length, 0) / items.length;
  return { items, averageLength };
}

/** Check a proposed answer against a scrambled multiset + dictionary. */
export function isValidAnagramAnswer(scrambled: string, proposed: string): boolean {
  const p = normalizeForGrid(proposed);
  if (p.length !== scrambled.length) return false;
  if (p.split('').sort().join('') !== scrambled.split('').sort().join('')) return false;
  return NORMALIZED_SET.has(p);
}
