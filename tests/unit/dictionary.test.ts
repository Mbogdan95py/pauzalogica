import { describe, it, expect } from 'vitest';
import { has, isClean, isAcceptableWord, byTheme, byLength, pool, allWords } from '@/lib/dictionary';
import { isBannedWord, containsBannedSubstring } from '@/lib/dictionary/blacklist.data';
import { getLocalDefinition, clueContainsAnswer } from '@/lib/dictionary/definitions';

describe('dictionary', () => {
  it('recognises real words (display or normalized)', () => {
    expect(has('pisică')).toBe(true);
    expect(has('PISICA')).toBe(true);
    expect(has('soare')).toBe(true);
    expect(has('cuvant-inexistent-xyz')).toBe(false);
  });

  it('has no duplicate normalized entries', () => {
    const seen = new Set<string>();
    for (const w of allWords()) {
      expect(seen.has(w.normalized)).toBe(false);
      seen.add(w.normalized);
    }
  });

  it('byLength and byTheme return matching words', () => {
    expect(byLength(3).every((w) => w.normalized.length === 3)).toBe(true);
    expect(byTheme('animale').length).toBeGreaterThan(5);
  });

  it('pool filters by theme, length and frequency', () => {
    const p = pool({ theme: 'animale', minLength: 4, maxLength: 6, minFreq: 3 });
    expect(p.every((w) => w.length >= 4 && w.length <= 6 && w.freq >= 3)).toBe(true);
  });
});

describe('blacklist', () => {
  it('flags banned words', () => {
    expect(isBannedWord('PULA')).toBe(true);
    expect(isClean('PULA')).toBe(false);
  });

  it('does not false-positive on clean words containing safe substrings', () => {
    expect(isClean('CURAJ')).toBe(true);
    expect(isClean('CURCUBEU')).toBe(true);
    expect(isClean('CUREA')).toBe(true);
    expect(containsBannedSubstring('CURAJ')).toBe(false);
  });

  it('isAcceptableWord requires dictionary membership and cleanliness', () => {
    expect(isAcceptableWord('soare')).toBe(true);
  });
});

describe('definitions', () => {
  it('a clue never contains its own answer', () => {
    for (const w of ['PISICA', 'SOARE', 'MUNTE', 'CARTE', 'FLOARE']) {
      const def = getLocalDefinition(w);
      if (def) expect(clueContainsAnswer(def, w)).toBe(false);
    }
  });
});
