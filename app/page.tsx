import Link from 'next/link';
import { todayInTz } from '@/lib/date';
import { contentConfig } from '@/lib/config';
import { resolveDateOnOrBefore, readPackage } from '@/lib/storage/content';
import { gameOfType } from '@/lib/storage/queries';
import { CORE_HOME_GAME_TYPES, GAME_META } from '@/lib/schema/common';
import type { Game } from '@/lib/schema/games';
import { formatRomanianDate } from '@/lib/date';
import { AdLeaderboard, AdMobileBanner } from '@/components/ads/Ads';
import { HomeGameCard } from '@/components/home/HomeGameCard';
import { SmallGameTile } from '@/components/home/SmallGameTile';
import { HomeSidebar } from '@/components/home/Sidebar';
import { ContinuePlaying } from '@/components/home/ContinuePlaying';
import { CalendarIcon, ControllerIcon, BoltIcon } from '@/components/Icons';

const CORE_TITLES: Partial<Record<string, string>> = {
  sudoku: 'Sudoku zilnic',
  rebus: 'Rebus zilnic',
  'cuvinte-ascunse': 'Cuvinte ascunse',
  nonograma: 'Nonograma zilei',
  'provocare-rapida': 'Provocarea rapidă',
};

export default function HomePage() {
  const today = todayInTz(contentConfig.timezone);
  const date = resolveDateOnOrBefore(today);
  const pkg = date ? readPackage(date) : null;

  if (!pkg || !date) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Conținutul se pregătește</h1>
        <p className="mt-2 text-muted">Revino în curând pentru provocările de astăzi.</p>
      </div>
    );
  }

  // Core cards: the day's games in the canonical home order (fall back to any
  // crossword-family game if a rebus was swapped for a backup that day).
  const coreCards: Array<{ game: Game; title: string }> = [];
  for (const type of CORE_HOME_GAME_TYPES) {
    let game = gameOfType(pkg, type);
    if (!game && type === 'rebus') game = pkg.games.find((g) => g.type === 'careu' || g.type === 'integrame');
    if (!game && type === 'cuvinte-ascunse') game = pkg.games.find((g) => g.type === 'cuvinte-ascunse');
    if (game) coreCards.push({ game, title: CORE_TITLES[game.type] ?? GAME_META[game.type].label });
  }

  // The sixth (rotating) game powers the recommendation card.
  const rotating = pkg.games.find(
    (g) => !CORE_HOME_GAME_TYPES.includes(g.type) && !['careu'].includes(g.type),
  );

  const otherTiles = [
    { type: 'integrame' as const, label: 'Integrame' },
    { type: 'kakuro' as const, label: 'Kakuro' },
    { type: 'anagrame' as const, label: 'Anagrame' },
    { type: 'labirint' as const, label: 'Labirint' },
    { type: 'rebus' as const, label: 'Careu clasic' },
  ];

  return (
    <div className="container-page py-6">
      <AdMobileBanner className="mb-4" />
      <AdLeaderboard className="mb-6 hidden sm:block" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <ContinuePlaying />

          <section aria-labelledby="today-heading">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-brand" />
              <h1 id="today-heading" className="text-xl font-bold sm:text-2xl">
                Provocările de astăzi
              </h1>
            </div>
            <p className="mt-1 text-muted">
              Jocuri noi în fiecare zi. Joacă gratuit, fără cont. · {formatRomanianDate(date)}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {coreCards.map(({ game, title }) => (
                <HomeGameCard key={game.id} game={game} date={date} title={title} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-brand/30 bg-brand-soft/40 p-5">
            <div className="flex items-center gap-3">
              <BoltIcon className="h-6 w-6 shrink-0 text-brand-ink" />
              <div>
                <p className="font-bold">5 jocuri. 5 minute pe zi. O minte mai ascuțită.</p>
                <p className="text-sm text-muted">Joacă provocările zilnice și menține-ți seria activă!</p>
              </div>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="other-heading">
            <div className="flex items-center gap-2">
              <ControllerIcon className="h-5 w-5 text-brand" />
              <h2 id="other-heading" className="text-lg font-bold">
                Alte jocuri pentru tine
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {otherTiles.map((t) => (
                <SmallGameTile key={t.label} type={t.type} label={t.label} />
              ))}
              <Link
                href="/jocuri"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface p-4 text-center text-sm font-semibold text-muted transition-colors hover:bg-surface-2"
              >
                <span className="text-2xl leading-none">⋯</span>
                Mai multe
              </Link>
            </div>
          </section>
        </div>

        <HomeSidebar recommendation={rotating ? { type: rotating.type, date } : null} />
      </div>

      <AdLeaderboard className="mt-10 hidden sm:block" />
    </div>
  );
}
