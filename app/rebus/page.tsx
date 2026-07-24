import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Rebus zilnic',
  description:
    'Rebus zilnic în limba română: cuvinte încrucișate cu definiții clare, generate și verificate automat. Joacă gratuit, fără cont.',
  path: '/rebus',
});

export default function Page() {
  return (
    <GameLandingPage
      type="rebus"
      intro="Rebusul zilnic îți pune la încercare vocabularul: completează cuvintele pe orizontală și verticală folosind definițiile numerotate. Literele din intersecții te ajută să confirmi răspunsurile."
    />
  );
}
