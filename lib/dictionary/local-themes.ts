import { byTheme, type DictWord } from './index';

/**
 * Predefined local themes used when the AI editor is unavailable. Each maps to a
 * dictionary theme slug so word pools come straight from the local dictionary —
 * no network required. This is what keeps the daily page full during an outage.
 */
export interface LocalTheme {
  slug: string;
  title: string;
  description: string;
}

export const LOCAL_THEMES: LocalTheme[] = [
  { slug: 'animale', title: 'Lumea animalelor', description: 'De la pisica de casă la vulturul de munte.' },
  { slug: 'plante', title: 'Grădina verde', description: 'Copaci, flori și tot ce crește sub soare.' },
  { slug: 'mancare', title: 'În bucătărie', description: 'Arome, fructe și legume de pe masa noastră.' },
  { slug: 'casa', title: 'Prin casă', description: 'Obiecte și camere familiare din fiecare zi.' },
  { slug: 'corp', title: 'Corpul omenesc', description: 'Cuvinte despre noi, din cap până în picioare.' },
  { slug: 'natura', title: 'În mijlocul naturii', description: 'Munți, ape și cer, într-o zi senină.' },
  { slug: 'oras', title: 'Viața la oraș', description: 'Străzi, clădiri și locuri de întâlnire.' },
  { slug: 'transport', title: 'Pe drum', description: 'Vehicule care ne poartă dintr-un loc în altul.' },
  { slug: 'scoala', title: 'La școală', description: 'Caiete, lecții și amintiri din bănci.' },
  { slug: 'muzica', title: 'Note și melodii', description: 'Instrumente și cântece care ne bucură.' },
  { slug: 'culori', title: 'Curcubeul culorilor', description: 'Toate nuanțele din jurul nostru.' },
  { slug: 'timp', title: 'Anotimpuri și timp', description: 'Ceasuri, zile și cele patru anotimpuri.' },
  { slug: 'meserii', title: 'Meserii și meșteșuguri', description: 'Oameni harnici și munca lor de zi cu zi.' },
  { slug: 'sport', title: 'Lumea sportului', description: 'Mingi, echipe și clipe de întrecere.' },
  { slug: 'imbracaminte', title: 'Garderoba', description: 'Haine și încălțăminte pentru orice vreme.' },
  { slug: 'emotii', title: 'Emoții și trăiri', description: 'Bucurie, curaj și tot ce simțim.' },
  { slug: 'familie', title: 'În familie', description: 'Cei dragi, de la bunici la nepoți.' },
  { slug: 'geografie', title: 'Pe hartă', description: 'Forme de relief, ape și locuri de pe glob.' },
];

export function localThemeWords(slug: string): DictWord[] {
  return byTheme(slug);
}
