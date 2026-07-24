/**
 * Content-safety blacklist. All entries are stored in normalized form
 * (ASCII-folded, uppercase) so they can be matched against normalized words and
 * against accidental readings inside generated grids.
 *
 * `bannedWords` are rejected as whole words. `bannedSubstrings` must never
 * appear anywhere (kept ≥4 chars so they don't false-positive on clean words
 * like CURAJ / CURCUBEU). This protects word-search fills, anagrams and any
 * AI-suggested vocabulary from producing offensive output.
 */

export const BANNED_WORDS: string[] = [
  // vulgar / offensive
  'PULA', 'PULE', 'PIZDA', 'PIZDE', 'MUIE', 'MUIA', 'FUTAI',
  'CACAT', 'CACA', 'CURVA', 'CURVE', 'PROSTITUATA', 'BULAU',
  // slurs / hateful (kept out of any generated content)
  'JEGOS', 'JEG',
];

export const BANNED_SUBSTRINGS: string[] = [
  'PIZD', 'MUIE', 'FUTU', 'FUTE', 'CACAT', 'CURVA', 'PULARI',
];

const BANNED_WORD_SET = new Set(BANNED_WORDS);

export function isBannedWord(normalized: string): boolean {
  return BANNED_WORD_SET.has(normalized);
}

export function containsBannedSubstring(normalized: string): boolean {
  return BANNED_SUBSTRINGS.some((s) => normalized.includes(s));
}
