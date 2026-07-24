import Link from 'next/link';
import type { GameType } from '@/lib/schema/common';
import { GAME_META, DIFFICULTY_LABEL } from '@/lib/schema/common';
import { datesWithGame, latestDateWithGame, gameOfType } from '@/lib/storage/queries';
import { readPackage } from '@/lib/storage/content';
import { GAME_SLUG } from '@/lib/ui/nav';
import { formatRomanianDate, compareDate } from '@/lib/date';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { AdLeaderboard } from '@/components/ads/Ads';
import { GameGlyph, ClockIcon } from '@/components/Icons';

/** Landing page for a game type: intro + play-today CTA + recent days list. */
export function GameLandingPage({ type, intro }: { type: GameType; intro: string }) {
  const meta = GAME_META[type];
  const slug = GAME_SLUG[type];
  const latest = latestDateWithGame(type);
  const recent = datesWithGame(type)
    .sort((a, b) => compareDate(b, a))
    .slice(0, 14);

  return (
    <div className="container-page py-6">
      <AdLeaderboard className="mb-6 hidden sm:block" />
      <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: meta.label, href: `/${slug}` }]} />

      <div className="mt-4 flex items-center gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-xl ${GAME_THEME[type].chip}`}>
          <GameGlyph type={type} />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{meta.label}</h1>
          <p className="text-muted">{meta.short}</p>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-muted">{intro}</p>

      {latest ? (
        <Link href={`/${slug}/${latest}`} className="btn-brand mt-5">
          Joacă provocarea de azi →
        </Link>
      ) : (
        <p className="mt-5 text-muted">Momentan nu există o provocare disponibilă. Revino curând!</p>
      )}

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Zile recente</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((date) => {
              const pkg = readPackage(date);
              const game = pkg ? gameOfType(pkg, type) : undefined;
              return (
                <li key={date}>
                  <Link
                    href={`/${slug}/${date}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="font-medium">{formatRomanianDate(date)}</span>
                    {game && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <ClockIcon className="h-3.5 w-3.5" />~{game.estimatedMinutes} min · {DIFFICULTY_LABEL[game.difficulty]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
