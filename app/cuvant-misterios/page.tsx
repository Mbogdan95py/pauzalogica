import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Cuvântul misterios',
  description: 'Cuvântul misterios al zilei: câteva litere sunt dezvăluite, tu completezi restul. Joc de vocabular gratuit, fără cont.',
  path: '/cuvant-misterios',
});

export default function Page() {
  return (
    <GameLandingPage
      type="cuvant-misterios"
      intro="Câteva litere din cuvântul zilei sunt dezvăluite, iar categoria îți dă un indiciu. Completează literele lipsă și descoperă cuvântul întreg."
    />
  );
}
