import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Nonograme (Picross)',
  description:
    'Nonograme zilnice cu soluție unică: colorează celulele după indicii numerice și descoperă imaginea ascunsă. Gratuit, fără cont.',
  path: '/nonograme',
});

export default function Page() {
  return (
    <GameLandingPage
      type="nonograma"
      intro="Nonogramele (sau Picross) sunt puzzle-uri de logică vizuală: folosind indiciile numerice de pe fiecare rând și coloană, colorezi celulele corecte și descoperi o imagine. Fiecare puzzle are o singură soluție."
    />
  );
}
