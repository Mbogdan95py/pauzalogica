/**
 * Romanian text utilities.
 *
 * Two normalizations coexist throughout the codebase:
 *  - Display form: correct Romanian diacritics with comma-below ș/ț, used for
 *    everything shown to the player.
 *  - Grid/compare form: uppercase, ASCII-folded (ă→A, ș→S ...), letters only —
 *    used for crossword intersections, word-search placement and dictionary
 *    lookups so that "MĂR" and "AMAR" can cross on the folded A.
 */

/** Canonical Romanian alphabet in display (upper) form. */
export const RO_ALPHABET = 'AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ'.split('');

/** Letters that may fill blanks in a word-search without introducing accents. */
export const RO_FILLER_LETTERS = 'AĂÂBCDEFGHIÎJKLMNOPRSȘTȚUVXZ'.split('');

const CEDILLA_TO_COMMA: Record<string, string> = {
  'ş': 'ș', // ş -> ș
  'Ş': 'Ș', // Ş -> Ș
  'ţ': 'ț', // ţ -> ț
  'Ţ': 'Ț', // Ţ -> Ț
};

const FOLD: Record<string, string> = {
  Ă: 'A',
  Â: 'A',
  Î: 'I',
  Ș: 'S',
  Ț: 'T',
  ă: 'a',
  â: 'a',
  î: 'i',
  ș: 's',
  ț: 't',
};

/**
 * Replace legacy cedilla code points (ş/ţ) with the correct comma-below forms
 * (ș/ț). Input may be mixed; this makes diacritics canonical for display.
 */
export function fixRomanianDiacritics(input: string): string {
  return input.replace(/[şŞţŢ]/g, (ch) => CEDILLA_TO_COMMA[ch] ?? ch);
}

/** Fold Romanian diacritics to their base ASCII letter, preserving case. */
export function foldDiacritics(input: string): string {
  return fixRomanianDiacritics(input).replace(/[ĂÂÎȘȚăâîșț]/g, (ch) => FOLD[ch] ?? ch);
}

/**
 * Normalize a word for grid geometry, intersections and dictionary keys:
 * fix diacritics, fold to ASCII, uppercase, and strip anything that is not an
 * A–Z letter (spaces, hyphens, apostrophes, digits).
 */
export function normalizeForGrid(input: string): string {
  return foldDiacritics(fixRomanianDiacritics(input))
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

/** Alias that reads better at call sites doing equality checks. */
export const normalizeForCompare = normalizeForGrid;

/** Uppercase while keeping correct Romanian diacritics (for headings/labels). */
export function toUpperRo(input: string): string {
  return fixRomanianDiacritics(input).toUpperCase();
}

/** Lowercase while keeping correct Romanian diacritics. */
export function toLowerRo(input: string): string {
  return fixRomanianDiacritics(input).toLowerCase();
}

/** Number of letters that actually count for a puzzle (folded length). */
export function letterLength(input: string): number {
  return normalizeForGrid(input).length;
}

/** True when the string contains only Romanian letters (after fixing forms). */
export function isPureRomanianWord(input: string): boolean {
  const fixed = fixRomanianDiacritics(input);
  return /^[A-Za-zĂÂÎȘȚăâîșț]+$/.test(fixed);
}

/** Collapse whitespace and trim — used to canonicalize free text like clues. */
export function cleanText(input: string): string {
  return fixRomanianDiacritics(input).replace(/\s+/g, ' ').trim();
}
