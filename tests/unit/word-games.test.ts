import { describe, it, expect } from 'vitest';
import { generateWordSearch } from '@/generators/word-search';
import { validateWordSearch } from '@/validators/word-search';
import { generateCrossword, type ClueWord } from '@/generators/crossword';
import { validateCrossword } from '@/validators/crossword';
import { generateAnagrams, scramble, isValidAnagramAnswer, anagramSolutionCount } from '@/generators/anagram';
import { evaluateGuess, generateQuickChallenge } from '@/generators/quick-challenge';
import { byTheme, get } from '@/lib/dictionary';
import { DEFINITIONS } from '@/lib/dictionary/definitions.data';
import type { WordSearchGame, CrosswordGame } from '@/lib/schema/games';

const clueWords: ClueWord[] = Object.keys(DEFINITIONS).map((n) => ({
  display: get(n)?.display ?? n,
  normalized: n,
  clue: DEFINITIONS[n]!,
}));

describe('word search', () => {
  it('generates a grid where every listed word is placed and validates', () => {
    const words = byTheme('animale').concat(byTheme('natura')).map((w) => w.display);
    const b = generateWordSearch('ws-1', 'mediu', words);
    const game: WordSearchGame = {
      type: 'cuvinte-ascunse', id: '2026-01-01-cuvinte-ascunse', title: 't', description: 'd', difficulty: 'mediu',
      estimatedMinutes: 5, seed: 's', instructions: 'i', hints: [],
      puzzle: { width: b.width, height: b.height, grid: b.grid, words: b.words },
      solution: { placements: b.placements },
      validationMetadata: { wordCount: b.words.length, allowsReversed: b.allowsReversed, allowsDiagonal: b.allowsDiagonal },
    };
    expect(validateWordSearch(game).ok).toBe(true);
  });
});

describe('crossword', () => {
  it('assembles a connected, valid careu', () => {
    const b = generateCrossword('cw-1', 'mediu', clueWords);
    const game: CrosswordGame = {
      type: 'rebus', id: '2026-01-01-rebus', title: 't', description: 'd', difficulty: 'mediu',
      estimatedMinutes: 5, seed: 's', instructions: 'i', hints: [],
      puzzle: { width: b.width, height: b.height, blocks: b.blocks, numbers: b.numbers, entries: b.entries },
      solution: { grid: b.grid },
      validationMetadata: { wordCount: b.wordCount, intersectionRatio: b.intersectionRatio, theme: 't' },
    };
    const res = validateCrossword(game);
    expect(res.ok).toBe(true);
  });
});

describe('anagram', () => {
  it('scramble never equals the original', () => {
    for (const w of ['PISICA', 'SOARE', 'MUNTE', 'CARTE']) {
      expect(scramble(w, `s-${w}`)).not.toBe(w);
    }
  });

  it('scramble preserves the letter multiset', () => {
    const s = scramble('PORTOCALA', 'seed');
    expect(s.split('').sort().join('')).toBe('PORTOCALA'.split('').sort().join(''));
  });

  it('validates a correct answer and rejects a wrong one', () => {
    const b = generateAnagrams('ana-1', 'mediu', 'animale', undefined);
    const item = b.items[0]!;
    expect(isValidAnagramAnswer(item.scrambled, item.normalized)).toBe(true);
    expect(isValidAnagramAnswer(item.scrambled, 'ZZZZZ')).toBe(false);
  });

  it('only uses words with few equivalent solutions', () => {
    const b = generateAnagrams('ana-2', 'usor', 'mancare', undefined);
    for (const item of b.items) expect(anagramSolutionCount(item.normalized)).toBeLessThanOrEqual(2);
  });
});

describe('quick challenge', () => {
  it('handles duplicate letters in feedback (Wordle rules)', () => {
    // answer LAPTE, guess LALEA (L,A,L,E,A)
    const marks = evaluateGuess('LAPTE', 'LALEA');
    expect(marks[0]).toBe('correct'); // L == L
    expect(marks[1]).toBe('correct'); // A == A
    expect(marks[2]).toBe('absent'); // second L — only one L in answer, already matched
    expect(marks[3]).toBe('present'); // E exists in answer (last position)
    expect(marks[4]).toBe('absent'); // second A — answer's only A already matched at pos 1
  });

  it('all-correct guess marks every letter correct', () => {
    expect(evaluateGuess('SOARE', 'SOARE')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  it('generates a dictionary word of the right length', () => {
    const b = generateQuickChallenge('qc-1', 'usor');
    expect(b.normalized.length).toBe(5);
  });
});
