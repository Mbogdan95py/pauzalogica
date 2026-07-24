import { DEFINITIONS, DEFINED_WORDS } from './definitions.data';
import { normalizeForGrid } from '@/lib/text/diacritics';

export function getLocalDefinition(word: string): string | undefined {
  return DEFINITIONS[normalizeForGrid(word)];
}

export function hasLocalDefinition(word: string): boolean {
  return normalizeForGrid(word) in DEFINITIONS;
}

/** Normalized words for which a clue exists — the fallback crossword pool. */
export function definedWords(): string[] {
  return DEFINED_WORDS;
}

/**
 * A clue must never reveal its own answer. Compares folded forms so that
 * accents/casing cannot smuggle the word in.
 */
export function clueContainsAnswer(clue: string, answer: string): boolean {
  const a = normalizeForGrid(answer);
  if (a.length < 2) return false;
  return normalizeForGrid(clue).includes(a);
}
