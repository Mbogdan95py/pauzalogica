import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listDates, readPackage } from '@/lib/storage/content';
import { DIFFICULTY_LABEL, type GameType } from '@/lib/schema/common';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { GAME_SLUG } from '@/lib/ui/nav';
import { formatRomanianDate, isValidDateStr, addDays } from '@/lib/date';
import { hasPackage } from '@/lib/storage/content';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/ui/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { GameGlyph, ClockIcon } from '@/components/Icons';
import { AdLeaderboard, AdInContent } from '@/components/ads/Ads';

export function generateStaticParams() {
  return listDates().map((date) => ({ date }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { date: string } }): Metadata {
  const nice = isValidDateStr(params.date) ? formatRomanianDate(params.date) : params.date;
  const pkg = readPackage(params.date);
  return buildMetadata({
    title: `Jocurile din ${nice}`,
    description: pkg
      ? `${pkg.title} — ${pkg.games.length} jocuri de logică și cuvinte pentru ${nice}. Joacă gratuit, fără cont.`
      : `Jocurile pentru ${nice} pe Careu.ro.`,
    path: `/arhiva/${params.date}`,
    ogType: 'article',
  });
}

export default function Page({ params }: { params: { date: string } }) {
  const pkg = readPackage(params.date);
  if (!pkg) notFound();
  const nice = formatRomanianDate(params.date);
  const prev = addDays(params.date, -1);
  const next = addDays(params.date, 1);

  return (
    <div className="container-page py-6">
      <AdLeaderboard className="mb-6 hidden sm:block" />
      <Breadcrumbs
        items={[
          { name: 'Acasă', href: '/' },
          { name: 'Arhivă', href: '/arhiva' },
          { name: nice, href: `/arhiva/${params.date}` },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{pkg.title}</h1>
          <p className="mt-1 text-muted">{pkg.description}</p>
        </div>
        <div className="flex gap-2">
          {hasPackage(prev) && (
            <Link href={`/arhiva/${prev}`} className="btn-ghost" rel="prev">
              ← {formatRomanianDate(prev, false)}
            </Link>
          )}
          {hasPackage(next) && (
            <Link href={`/arhiva/${next}`} className="btn-ghost" rel="next">
              {formatRomanianDate(next, false)} →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pkg.games.map((g) => {
          const theme = GAME_THEME[g.type as GameType];
          return (
            <Link
              key={g.id}
              href={`/${GAME_SLUG[g.type as GameType]}/${params.date}`}
              className={`flex items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:brightness-[0.98] ${theme.cardBg}`}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${theme.chip}`}>
                <GameGlyph type={g.type as GameType} />
              </span>
              <span>
                <span className="block font-bold">{g.title}</span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                  <ClockIcon className="h-3.5 w-3.5" /> ~{g.estimatedMinutes} min · {DIFFICULTY_LABEL[g.difficulty]}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <AdInContent className="mt-10" />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Acasă', path: '/' },
          { name: 'Arhivă', path: '/arhiva' },
          { name: nice, path: `/arhiva/${params.date}` },
        ])}
      />
    </div>
  );
}
