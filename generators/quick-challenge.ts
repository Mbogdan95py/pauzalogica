import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { pool, type DictWord } from '@/lib/dictionary';

export interface QuickChallengeBuild {
  answer: string; // display form (with diacritics)
  normalized: string;
  length: number;
  frequencyRank: number;
}

const LENGTH_BY_DIFF: Record<Difficulty, [number, number]> = {
  usor: [5, 5],
  mediu: [5, 6],
  greu: [6, 7],
  expert: [7, 8],
};

/**
 * Pick the daily word for the Wordle-like quick challenge: a common Romanian
 * word of 5–8 letters from the local dictionary.
 */
export function generateQuickChallenge(seed: string, difficulty: Difficulty): QuickChallengeBuild {
  const rng = createRng(seed);
  const [minL, maxL] = LENGTH_BY_DIFF[difficulty];
  // freq ≥ 3 keeps the word fair (still common) while giving a large enough
  // pool that daily answers don't collide within the no-repeat window.
  let candidates: DictWord[] = pool({ minLength: minL, maxLength: maxL, minFreq: 3 });
  if (candidates.length === 0) throw new Error('quick-challenge: empty candidate pool');
  const w = rng.pick(candidates);
  return {
    answer: w.display,
    normalized: w.normalized,
    length: w.normalized.length,
    frequencyRank: w.freq,
  };
}

export type LetterMark = 'correct' | 'present' | 'absent';

/**
 * Wordle-style feedback with correct duplicate handling: first pass marks
 * exact positions, second pass marks "present" only while unmatched copies of
 * that letter remain.
 */
export function evaluateGuess(answerNormalized: string, guessNormalized: string): LetterMark[] {
  const n = answerNormalized.length;
  const marks: LetterMark[] = new Array(n).fill('absent');
  const remaining = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    if (guessNormalized[i] === answerNormalized[i]) {
      marks[i] = 'correct';
    } else {
      const ch = answerNormalized[i]!;
      remaining.set(ch, (remaining.get(ch) ?? 0) + 1);
    }
  }
  for (let i = 0; i < n; i++) {
    if (marks[i] === 'correct') continue;
    const ch = guessNormalized[i]!;
    const left = remaining.get(ch) ?? 0;
    if (left > 0) {
      marks[i] = 'present';
      remaining.set(ch, left - 1);
    }
  }
  return marks;
}
