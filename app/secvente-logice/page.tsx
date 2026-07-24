import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Secvențe logice',
  description: 'Secvențe logice zilnice: descoperă regula și continuă șirul de numere. Joc rapid de logică, gratuit și fără cont.',
  path: '/secvente-logice',
});

export default function Page() {
  return (
    <GameLandingPage
      type="secvente-logice"
      intro="Analizează șirul de numere, descoperă regula ascunsă și alege valoarea care continuă secvența. Un exercițiu scurt și antrenant pentru minte."
    />
  );
}
