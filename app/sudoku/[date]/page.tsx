import type { Metadata } from 'next';
import { GamePage } from '@/components/pages/GamePage';
import { datesWithGame } from '@/lib/storage/queries';
import { buildMetadata } from '@/lib/ui/seo';
import { formatRomanianDate, isValidDateStr } from '@/lib/date';

const TYPE = 'sudoku' as const;
const SLUG = 'sudoku';

export function generateStaticParams() {
  return datesWithGame(TYPE).map((date) => ({ date }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { date: string } }): Metadata {
  const nice = isValidDateStr(params.date) ? formatRomanianDate(params.date) : params.date;
  return buildMetadata({
    title: `Sudoku — ${nice}`,
    description: `Sudoku pentru ${nice}: grilă 9×9 cu soluție unică, verificată automat. Joacă gratuit, fără cont.`,
    path: `/${SLUG}/${params.date}`,
    ogType: 'article',
  });
}

export default function Page({ params }: { params: { date: string } }) {
  return <GamePage type={TYPE} date={params.date} />;
}
