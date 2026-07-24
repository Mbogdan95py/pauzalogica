import { createRng } from '@/lib/rng';
import type { Difficulty } from '@/lib/schema/common';

export interface LogicSequenceBuild {
  sequence: Array<number | null>;
  options: number[];
  answer: number;
  rule: string;
  ruleFamily: string;
}

interface RuleGen {
  family: string;
  make(rng: ReturnType<typeof createRng>, hardness: number): { terms: number[]; rule: string };
}

const RULES: RuleGen[] = [
  {
    family: 'aritmetic',
    make(rng, hardness) {
      const start = rng.int(1, 12);
      const step = rng.int(2, 3 + hardness * 3);
      const terms = Array.from({ length: 6 }, (_, i) => start + step * i);
      return { terms, rule: `Fiecare termen crește cu ${step}.` };
    },
  },
  {
    family: 'geometric',
    make(rng, hardness) {
      const start = rng.int(1, 4);
      const ratio = hardness > 1 ? 3 : 2;
      const terms = Array.from({ length: 6 }, (_, i) => start * ratio ** i);
      return { terms, rule: `Fiecare termen se înmulțește cu ${ratio}.` };
    },
  },
  {
    family: 'pas-crescator',
    make(rng, hardness) {
      const start = rng.int(1, 10);
      const firstStep = rng.int(1, 3 + hardness);
      const terms = [start];
      let step = firstStep;
      for (let i = 1; i < 6; i++) {
        terms.push(terms[i - 1]! + step);
        step += 1;
      }
      return { terms, rule: `Diferența dintre termeni crește cu 1 la fiecare pas (începe de la ${firstStep}).` };
    },
  },
  {
    family: 'fibonacci',
    make(rng) {
      const a = rng.int(1, 5);
      const b = rng.int(a, a + 4);
      const terms = [a, b];
      for (let i = 2; i < 6; i++) terms.push(terms[i - 1]! + terms[i - 2]!);
      return { terms, rule: 'Fiecare termen este suma celor doi termeni dinainte.' };
    },
  },
  {
    family: 'alternanta',
    make(rng, hardness) {
      const start = rng.int(5, 15);
      const up = rng.int(4, 6 + hardness * 2);
      const down = rng.int(1, 3);
      const terms = [start];
      for (let i = 1; i < 6; i++)
        terms.push(terms[i - 1]! + (i % 2 === 1 ? up : -down));
      return { terms, rule: `Se adună ${up}, apoi se scade ${down}, alternativ.` };
    },
  },
  {
    family: 'patrate',
    make(rng) {
      const offset = rng.int(0, 3);
      const terms = Array.from({ length: 6 }, (_, i) => (i + 1 + offset) ** 2);
      return { terms, rule: 'Termenii sunt pătrate perfecte consecutive.' };
    },
  },
];

const HARDNESS: Record<Difficulty, number> = { usor: 0, mediu: 1, greu: 2, expert: 3 };

export function generateLogicSequence(seed: string, difficulty: Difficulty): LogicSequenceBuild {
  const rng = createRng(seed);
  const hardness = HARDNESS[difficulty];
  const families = hardness === 0 ? RULES.slice(0, 3) : hardness === 1 ? RULES.slice(0, 5) : RULES;
  const gen = rng.pick(families);
  const { terms, rule } = gen.make(rng.derive('terms'), hardness);

  // Hide the last visible position.
  const answer = terms[5]!;
  const sequence: Array<number | null> = [...terms.slice(0, 5), null];

  // Distractors: plausible near-misses, unique, never equal to the answer.
  const distractors = new Set<number>();
  const deltas = [1, -1, 2, -2, terms[5]! - terms[4]!, 2 * (terms[5]! - terms[4]!)];
  for (const d of rng.shuffled(deltas)) {
    const v = answer + d;
    if (v !== answer && v > 0) distractors.add(v);
    if (distractors.size >= 3) break;
  }
  let filler = answer + 3;
  while (distractors.size < 3) {
    if (filler !== answer && filler > 0) distractors.add(filler);
    filler += 2;
  }

  const options = rng.shuffled([answer, ...Array.from(distractors).slice(0, 3)]);
  return { sequence, options, answer, rule, ruleFamily: gen.family };
}
