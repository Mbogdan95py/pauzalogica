import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Integrame',
  description:
    'Integrame în limba română: careuri de cuvinte încrucișate cu definiții, generate și verificate automat. Apar în rotația zilnică. Joacă gratuit.',
  path: '/integrame',
});

export default function Page() {
  return (
    <GameLandingPage
      type="integrame"
      intro="Integrama este un careu de cuvinte încrucișate cu definiții. Apare periodic în rotația jocurilor zilnice. Completează grila folosind definițiile și literele din intersecții."
    />
  );
}
