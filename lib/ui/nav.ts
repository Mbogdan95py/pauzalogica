import type { GameType } from '@/lib/schema/common';

export interface NavItem {
  label: string;
  href: string;
}

/** Primary header navigation (matches the mockup). */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Acasă', href: '/' },
  { label: 'Sudoku', href: '/sudoku' },
  { label: 'Rebus', href: '/rebus' },
  { label: 'Cuvinte', href: '/cuvinte-ascunse' },
  { label: 'Integrame', href: '/integrame' },
];

/** "Altele" dropdown. */
export const MORE_NAV: NavItem[] = [
  { label: 'Nonograme', href: '/nonograme' },
  { label: 'Kakuro', href: '/kakuro' },
  { label: 'Anagrame', href: '/anagrame' },
  { label: 'Labirinturi', href: '/labirinturi' },
  { label: 'Provocarea rapidă', href: '/provocare-rapida' },
  { label: 'Toate jocurile', href: '/jocuri' },
  { label: 'Arhivă', href: '/arhiva' },
];

export const FOOTER_NAV: NavItem[] = [
  { label: 'Despre noi', href: '/despre' },
  { label: 'Contact', href: '/contact' },
  { label: 'Sugestii', href: '/sugestii' },
  { label: 'Confidențialitate', href: '/confidentialitate' },
  { label: 'Cookie-uri', href: '/cookie-uri' },
  { label: 'Termeni și condiții', href: '/termeni' },
];

/** Map a game type to its route slug base. */
export const GAME_SLUG: Record<GameType, string> = {
  sudoku: 'sudoku',
  rebus: 'rebus',
  careu: 'rebus',
  integrame: 'integrame',
  'cuvinte-ascunse': 'cuvinte-ascunse',
  nonograma: 'nonograme',
  kakuro: 'kakuro',
  labirint: 'labirinturi',
  anagrame: 'anagrame',
  'provocare-rapida': 'provocare-rapida',
  'secvente-logice': 'secvente-logice',
  'cuvant-misterios': 'cuvant-misterios',
};

/** Route slugs that get a landing page + [date] pages. */
export const GAME_ROUTES: Array<{ slug: string; type: GameType }> = [
  { slug: 'sudoku', type: 'sudoku' },
  { slug: 'rebus', type: 'rebus' },
  { slug: 'cuvinte-ascunse', type: 'cuvinte-ascunse' },
  { slug: 'nonograme', type: 'nonograma' },
  { slug: 'kakuro', type: 'kakuro' },
  { slug: 'anagrame', type: 'anagrame' },
  { slug: 'labirinturi', type: 'labirint' },
  { slug: 'integrame', type: 'integrame' },
  { slug: 'provocare-rapida', type: 'provocare-rapida' },
  { slug: 'secvente-logice', type: 'secvente-logice' },
  { slug: 'cuvant-misterios', type: 'cuvant-misterios' },
];

export function gameHref(type: GameType, date: string): string {
  return `/${GAME_SLUG[type]}/${date}`;
}
