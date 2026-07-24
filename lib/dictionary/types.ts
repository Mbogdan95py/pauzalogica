/** Part-of-speech tags used in the dictionary. */
export type Pos = 'subst' | 'adj' | 'verb' | 'adv' | 'pron' | 'num' | 'interj';

export const POS_LABEL: Record<Pos, string> = {
  subst: 'substantiv',
  adj: 'adjectiv',
  verb: 'verb',
  adv: 'adverb',
  pron: 'pronume',
  num: 'numeral',
  interj: 'interjecție',
};

/**
 * One dictionary entry. `w` is the display form with correct diacritics; the
 * normalized (ASCII-folded, uppercase) form is derived on load. `freq` is a
 * 1–5 commonness tier (5 = everyday word). `themes` group words for word-search
 * and crossword topics.
 */
export interface WordEntry {
  w: string;
  pos: Pos;
  freq: number;
  themes: string[];
}
