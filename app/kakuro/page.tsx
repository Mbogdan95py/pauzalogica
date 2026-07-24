import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Kakuro',
  description:
    'Kakuro zilnic: sume încrucișate cu cifre de la 1 la 9, fără repetiții. Puzzle-uri cu soluție unică, verificate automat. Joacă gratuit.',
  path: '/kakuro',
});

export default function Page() {
  return (
    <GameLandingPage
      type="kakuro"
      intro="Kakuro combină logica sudoku cu aritmetica: completează fiecare serie de celule astfel încât cifrele (de la 1 la 9, fără repetiții) să însumeze exact numărul indicat. Fiecare grilă are o singură soluție."
    />
  );
}
