import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Anagrame',
  description:
    'Anagrame zilnice în limba română: rearanjează literele și descoperă cuvintele ascunse. Joc rapid de vocabular, gratuit și fără cont.',
  path: '/anagrame',
});

export default function Page() {
  return (
    <GameLandingPage
      type="anagrame"
      intro="Un exercițiu excelent pentru minte: fiecare rând conține literele amestecate ale unui cuvânt românesc. Rearanjează-le și descoperă cuvântul. Toate răspunsurile sunt confirmate de dicționar."
    />
  );
}
