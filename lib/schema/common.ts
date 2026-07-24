import { z } from 'zod';

/** Every playable game type on the platform. */
export const GAME_TYPES = [
  'sudoku',
  'rebus',
  'careu',
  'integrame',
  'cuvinte-ascunse',
  'nonograma',
  'kakuro',
  'labirint',
  'anagrame',
  'provocare-rapida',
  'secvente-logice',
  'cuvant-misterios',
] as const;

export type GameType = (typeof GAME_TYPES)[number];
export const gameTypeSchema = z.enum(GAME_TYPES);

export const DIFFICULTIES = ['usor', 'mediu', 'greu', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const difficultySchema = z.enum(DIFFICULTIES);

/** Romanian labels for difficulty, for display. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  usor: 'Ușor',
  mediu: 'Mediu',
  greu: 'Greu',
  expert: 'Expert',
};

/** Numeric weight, handy for sorting / weekly-variation checks. */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  usor: 1,
  mediu: 2,
  greu: 3,
  expert: 4,
};

/** Romanian display metadata for each game type. */
export interface GameMeta {
  type: GameType;
  label: string;
  slug: string;
  /** tailwind color token (see tailwind.config.ts) */
  accent: string;
  short: string;
}

export const GAME_META: Record<GameType, GameMeta> = {
  sudoku: { type: 'sudoku', label: 'Sudoku', slug: 'sudoku', accent: 'sudoku', short: 'Logică cu cifre 1–9.' },
  rebus: { type: 'rebus', label: 'Rebus', slug: 'rebus', accent: 'rebus', short: 'Cuvinte încrucișate cu definiții.' },
  careu: { type: 'careu', label: 'Careu clasic', slug: 'careu', accent: 'careu', short: 'Careu de cuvinte încrucișate.' },
  integrame: { type: 'integrame', label: 'Integrame', slug: 'integrame', accent: 'integrame', short: 'Definiții în interiorul grilei.' },
  'cuvinte-ascunse': { type: 'cuvinte-ascunse', label: 'Cuvinte ascunse', slug: 'cuvinte-ascunse', accent: 'cuvinte', short: 'Găsește cuvintele din grilă.' },
  nonograma: { type: 'nonograma', label: 'Nonogramă', slug: 'nonograme', accent: 'nonograme', short: 'Desenează după indicii numerice.' },
  kakuro: { type: 'kakuro', label: 'Kakuro', slug: 'kakuro', accent: 'kakuro', short: 'Sume încrucișate.' },
  labirint: { type: 'labirint', label: 'Labirint', slug: 'labirinturi', accent: 'labirint', short: 'Găsește ieșirea.' },
  anagrame: { type: 'anagrame', label: 'Anagrame', slug: 'anagrame', accent: 'anagrame', short: 'Rearanjează literele.' },
  'provocare-rapida': { type: 'provocare-rapida', label: 'Provocarea rapidă', slug: 'provocare-rapida', accent: 'rapid', short: 'Ghicește cuvântul zilei.' },
  'secvente-logice': { type: 'secvente-logice', label: 'Secvențe logice', slug: 'secvente-logice', accent: 'nonograme', short: 'Continuă șirul.' },
  'cuvant-misterios': { type: 'cuvant-misterios', label: 'Cuvânt misterios', slug: 'cuvant-misterios', accent: 'rebus', short: 'Descoperă cuvântul ascuns.' },
};

/** The six “core” daily games are surfaced on the home page. */
export const CORE_HOME_GAME_TYPES: GameType[] = [
  'sudoku',
  'rebus',
  'cuvinte-ascunse',
  'nonograma',
  'provocare-rapida',
];

/** Rotating sixth slot. */
export const ROTATING_GAME_TYPES: GameType[] = [
  'kakuro',
  'anagrame',
  'labirint',
  'integrame',
  'secvente-logice',
  'cuvant-misterios',
];

export const SCHEMA_VERSION = 1 as const;
export const CONTENT_LOCALE = 'ro-RO' as const;
