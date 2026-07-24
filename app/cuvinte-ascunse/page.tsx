import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Cuvinte ascunse',
  description:
    'Găsește toate cuvintele ascunse în grilă — pe orizontală, verticală și diagonală. Joc zilnic gratuit de cuvinte în limba română.',
  path: '/cuvinte-ascunse',
});

export default function Page() {
  return (
    <GameLandingPage
      type="cuvinte-ascunse"
      intro="Un joc relaxant de vocabular: găsește toate cuvintele din listă ascunse în grila de litere. Cuvintele pot fi așezate pe orizontală, verticală sau diagonală, în funcție de dificultate."
    />
  );
}
