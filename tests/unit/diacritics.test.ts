import { describe, it, expect } from 'vitest';
import {
  fixRomanianDiacritics,
  foldDiacritics,
  normalizeForGrid,
  toUpperRo,
  letterLength,
  isPureRomanianWord,
} from '@/lib/text/diacritics';

describe('diacritics', () => {
  it('converts cedilla forms to comma-below', () => {
    expect(fixRomanianDiacritics('şţ')).toBe('șț');
    expect(fixRomanianDiacritics('ŞŢ')).toBe('ȘȚ');
  });

  it('folds Romanian diacritics to ASCII base letters', () => {
    expect(foldDiacritics('MĂR')).toBe('MAR');
    expect(foldDiacritics('înghețată')).toBe('inghetata');
    expect(foldDiacritics('ȘARPE')).toBe('SARPE');
  });

  it('normalizeForGrid uppercases, folds and strips non-letters', () => {
    expect(normalizeForGrid('Cămilă')).toBe('CAMILA');
    expect(normalizeForGrid('două-trei')).toBe('DOUATREI');
    expect(normalizeForGrid('  spații  ')).toBe('SPATII');
  });

  it('folds "MĂR" so its middle letter can cross an "A" (e.g. in AMAR)', () => {
    expect(normalizeForGrid('MĂR')).toBe('MAR');
    // The folded Ă becomes A, matching the A's in AMAR.
    expect(normalizeForGrid('MĂR')[1]).toBe('A');
    expect(normalizeForGrid('AMAR')).toContain('A');
  });

  it('toUpperRo keeps diacritics', () => {
    expect(toUpperRo('pisică')).toBe('PISICĂ');
  });

  it('letterLength counts folded letters only', () => {
    expect(letterLength('ață')).toBe(3);
    expect(letterLength('a-b')).toBe(2);
  });

  it('isPureRomanianWord validates letters only', () => {
    expect(isPureRomanianWord('împărat')).toBe(true);
    expect(isPureRomanianWord('abc123')).toBe(false);
  });
});
