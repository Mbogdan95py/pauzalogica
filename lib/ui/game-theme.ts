import type { GameType } from '@/lib/schema/common';

/**
 * Static per-game class sets. These MUST be written as literal strings so the
 * Tailwind JIT compiler can see them (dynamic `bg-${x}` is never generated).
 */
export interface GameTheme {
  /** soft tinted card background */
  cardBg: string;
  /** icon chip */
  chip: string;
  /** solid play button */
  button: string;
  /** accent text */
  text: string;
  /** subtle ring/border */
  ring: string;
}

export const GAME_THEME: Record<GameType, GameTheme> = {
  sudoku: { cardBg: 'bg-sudoku/[0.07]', chip: 'bg-sudoku/15 text-sudoku', button: 'bg-sudoku text-white', text: 'text-sudoku', ring: 'ring-sudoku/30' },
  rebus: { cardBg: 'bg-rebus/[0.07]', chip: 'bg-rebus/15 text-rebus', button: 'bg-rebus text-white', text: 'text-rebus', ring: 'ring-rebus/30' },
  careu: { cardBg: 'bg-careu/[0.07]', chip: 'bg-careu/15 text-careu', button: 'bg-careu text-white', text: 'text-careu', ring: 'ring-careu/30' },
  integrame: { cardBg: 'bg-integrame/[0.07]', chip: 'bg-integrame/15 text-integrame', button: 'bg-integrame text-white', text: 'text-integrame', ring: 'ring-integrame/30' },
  'cuvinte-ascunse': { cardBg: 'bg-cuvinte/[0.07]', chip: 'bg-cuvinte/15 text-cuvinte', button: 'bg-cuvinte text-white', text: 'text-cuvinte', ring: 'ring-cuvinte/30' },
  nonograma: { cardBg: 'bg-nonograme/[0.07]', chip: 'bg-nonograme/15 text-nonograme', button: 'bg-nonograme text-white', text: 'text-nonograme', ring: 'ring-nonograme/30' },
  kakuro: { cardBg: 'bg-kakuro/[0.07]', chip: 'bg-kakuro/15 text-kakuro', button: 'bg-kakuro text-white', text: 'text-kakuro', ring: 'ring-kakuro/30' },
  labirint: { cardBg: 'bg-labirint/[0.07]', chip: 'bg-labirint/15 text-labirint', button: 'bg-labirint text-white', text: 'text-labirint', ring: 'ring-labirint/30' },
  anagrame: { cardBg: 'bg-anagrame/[0.07]', chip: 'bg-anagrame/15 text-anagrame', button: 'bg-anagrame text-white', text: 'text-anagrame', ring: 'ring-anagrame/30' },
  'provocare-rapida': { cardBg: 'bg-rapid/[0.07]', chip: 'bg-rapid/15 text-rapid', button: 'bg-rapid text-white', text: 'text-rapid', ring: 'ring-rapid/30' },
  'secvente-logice': { cardBg: 'bg-nonograme/[0.07]', chip: 'bg-nonograme/15 text-nonograme', button: 'bg-nonograme text-white', text: 'text-nonograme', ring: 'ring-nonograme/30' },
  'cuvant-misterios': { cardBg: 'bg-rebus/[0.07]', chip: 'bg-rebus/15 text-rebus', button: 'bg-rebus text-white', text: 'text-rebus', ring: 'ring-rebus/30' },
};
