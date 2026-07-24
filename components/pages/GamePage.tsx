import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { GameType } from '@/lib/schema/common';
import { GAME_META, DIFFICULTY_LABEL } from '@/lib/schema/common';
import { readPackage } from '@/lib/storage/content';
import { gameOfType, adjacentGameDates } from '@/lib/storage/queries';
import { GAME_SLUG } from '@/lib/ui/nav';
import { formatRomanianDate } from '@/lib/date';
import { gameJsonLd, breadcrumbJsonLd } from '@/lib/ui/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { GamePlayer } from '@/components/games/GamePlayer';
import { AdLeaderboard, AdInContent, AdMobileBanner } from '@/components/ads/Ads';

/**
 * Full game page for a specific date. Server component: loads the validated
 * package, extracts the game, and hands its data to the interactive client
 * board. The solution ships in the data but the board only reveals it on
 * completion or explicit request.
 */
export function GamePage({ type, date }: { type: GameType; date: string }) {
  const pkg = readPackage(date);
  if (!pkg) notFound();
  const game = gameOfType(pkg, type);
  if (!game) notFound();

  const meta = GAME_META[type];
  const slug = GAME_SLUG[type];
  const { prev, next } = adjacentGameDates(type, date);
  const niceDate = formatRomanianDate(date);

  return (
    <div className="container-page py-6">
      <AdLeaderboard className="mb-6 hidden sm:block" />
      <AdMobileBanner className="mb-4" />

      <Breadcrumbs
        items={[
          { name: 'Acasă', href: '/' },
          { name: meta.label, href: `/${slug}` },
          { name: niceDate, href: `/${slug}/${date}` },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {meta.label} · <span className="text-muted">{niceDate}</span>
          </h1>
          <p className="mt-1 text-muted">
            {game.description} · Dificultate: {DIFFICULTY_LABEL[game.difficulty]} · ~{game.estimatedMinutes} min
          </p>
        </div>
        <div className="flex gap-2">
          {prev && (
            <Link href={`/${slug}/${prev}`} className="btn-ghost" rel="prev">
              ← Ziua anterioară
            </Link>
          )}
          {next && (
            <Link href={`/${slug}/${next}`} className="btn-ghost" rel="next">
              Ziua următoare →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <GamePlayer game={game} />
      </div>

      <AdInContent className="mt-10" />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/arhiva/${date}`} className="btn-ghost">
          Toate jocurile din {niceDate}
        </Link>
        <Link href="/arhiva" className="btn-ghost">
          Arhiva completă
        </Link>
      </div>

      <JsonLd
        data={gameJsonLd({
          name: `${meta.label} — ${niceDate}`,
          description: game.description,
          path: `/${slug}/${date}`,
          datePublished: date,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Acasă', path: '/' },
          { name: meta.label, path: `/${slug}` },
          { name: niceDate, path: `/${slug}/${date}` },
        ])}
      />
    </div>
  );
}
