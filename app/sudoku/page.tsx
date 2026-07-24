import { GameLandingPage } from '@/components/pages/GameLandingPage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Sudoku zilnic gratuit',
  description:
    'Joacă Sudoku zilnic gratuit, fără cont. Grile 9×9 verificate, cu niveluri de la ușor la expert, soluție unică garantată și progres salvat pe dispozitiv.',
  path: '/sudoku',
});

export default function Page() {
  return (
    <GameLandingPage
      type="sudoku"
      intro="Sudoku este jocul clasic de logică cu cifre: completează grila 9×9 astfel încât fiecare rând, coloană și bloc de 3×3 să conțină cifrele de la 1 la 9. Fiecare grilă are o singură soluție, verificată automat."
    />
  );
}
