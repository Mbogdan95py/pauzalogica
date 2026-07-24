import type { Metadata } from 'next';
import { GamePage } from '@/components/pages/GamePage';
import { datesWithGame } from '@/lib/storage/queries';
import { buildMetadata } from '@/lib/ui/seo';
import { formatRomanianDate, isValidDateStr } from '@/lib/date';

const TYPE = 'secvente-logice' as const;
const SLUG = 'secvente-logice';

export function generateStaticParams() {
  return datesWithGame(TYPE).map((date) => ({ date }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { date: string } }): Metadata {
  const nice = isValidDateStr(params.date) ? formatRomanianDate(params.date) : params.date;
  return buildMetadata({
    title: `Secvențe logice — ${nice}`,
    description: `Secvența logică pentru ${nice}: descoperă regula și continuă șirul. Joacă gratuit, fără cont.`,
    path: `/${SLUG}/${params.date}`,
    ogType: 'article',
  });
}

export default function Page({ params }: { params: { date: string } }) {
  return <GamePage type={TYPE} date={params.date} />;
}
