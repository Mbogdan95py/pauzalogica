import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Provocarea rapidă',
  description:
    'Ghicește cuvântul zilei din 5–8 litere în cel mult 6 încercări. Joc rapid de vocabular în limba română, cu rezultat distribuibil. Gratuit.',
  path: '/provocare-rapida',
});

export default function Page() {
  return (
    <GameLandingPage
      type="provocare-rapida"
      intro="Ghicește cuvântul românesc al zilei în cel mult șase încercări. După fiecare încercare, culorile îți arată ce litere sunt corecte. Rezultatul poate fi distribuit fără a dezvălui cuvântul."
    />
  );
}
