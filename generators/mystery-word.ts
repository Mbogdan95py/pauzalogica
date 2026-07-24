import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';
import { pool, type DictWord } from '@/lib/dictionary';

export interface MysteryWordBuild {
  answer: string;
  normalized: string;
  category: string;
  revealed: number[];
}

const LENGTH_BY_DIFF: Record<Difficulty, [number, number]> = {
  usor: [4, 6],
  mediu: [5, 7],
  greu: [6, 9],
  expert: [7, 12],
};

const REVEAL_RATIO: Record<Difficulty, number> = { usor: 0.4, mediu: 0.3, greu: 0.2, expert: 0.12 };

const CATEGORY_LABEL: Record<string, string> = {
  animale: 'Animale',
  plante: 'Plante',
  mancare: 'Mâncare',
  casa: 'Casă',
  corp: 'Corpul omenesc',
  natura: 'Natură',
  oras: 'Oraș',
  transport: 'Transport',
  scoala: 'Școală',
  meserii: 'Meserii',
  sport: 'Sport',
  muzica: 'Muzică',
  culori: 'Culori',
  imbracaminte: 'Îmbrăcăminte',
  timp: 'Timp',
  fructe: 'Fructe',
  legume: 'Legume',
  flori: 'Flori',
  pasari: 'Păsări',
  insecte: 'Insecte',
  apa: 'Apă',
  geografie: 'Geografie',
  vreme: 'Vreme',
  emotii: 'Emoții',
  familie: 'Familie',
  anotimpuri: 'Anotimpuri',
  general: 'Cuvinte uzuale',
  obiecte: 'Obiecte',
  arta: 'Artă',
};

export function generateMysteryWord(seed: string, difficulty: Difficulty): MysteryWordBuild {
  const rng = createRng(seed);
  const [minL, maxL] = LENGTH_BY_DIFF[difficulty];
  let candidates: DictWord[] = pool({ minLength: minL, maxLength: maxL, minFreq: 3 });
  if (candidates.length === 0) candidates = pool({ minLength: 4, maxLength: 12, minFreq: 3 });
  const w = rng.pick(candidates);

  const revealCount = Math.max(1, Math.round(w.normalized.length * REVEAL_RATIO[difficulty]));
  const indices = rng.sample(
    Array.from({ length: w.normalized.length }, (_, i) => i),
    revealCount,
  ).sort((a, b) => a - b);

  const theme = w.themes[0] ?? 'general';
  return {
    answer: w.display,
    normalized: w.normalized,
    category: CATEGORY_LABEL[theme] ?? 'Cuvinte uzuale',
    revealed: indices,
  };
}
