import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Labirinturi',
  description:
    'Labirinturi zilnice generate algoritmic, cu cale garantată de la intrare la ieșire. Joacă gratuit cu tastatura, mouse-ul sau pe telefon.',
  path: '/labirinturi',
});

export default function Page() {
  return (
    <GameLandingPage
      type="labirint"
      intro="Găsește drumul de la intrare la ieșire prin labirint. Fiecare labirint este generat algoritmic și are cel puțin o cale garantată. Poți juca cu săgețile de la tastatură, cu mouse-ul sau pe telefon."
    />
  );
}
