import Link from 'next/link';
import { GAME_ROUTES } from '@/lib/ui/nav';
import { GAME_META } from '@/lib/schema/common';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { latestDateWithGame } from '@/lib/storage/queries';
import { buildMetadata } from '@/lib/ui/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { GameGlyph } from '@/components/Icons';
import { AdLeaderboard } from '@/components/ads/Ads';

export const metadata = buildMetadata({
  title: 'Toate jocurile',
  description:
    'Toate jocurile zilnice de logică și cuvinte de pe Careu.ro: Sudoku, rebus, cuvinte ascunse, nonograme, kakuro, anagrame, labirinturi, integrame și provocarea rapidă. Gratuit, fără cont.',
  path: '/jocuri',
});

export default function Page() {
  return (
    <div className="container-page py-6">
      <AdLeaderboard className="mb-6 hidden sm:block" />
      <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Toate jocurile', href: '/jocuri' }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Toate jocurile</h1>
      <p className="mt-1 text-muted">Alege un joc și începe imediat. Jocuri noi în fiecare zi.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_ROUTES.map(({ type, slug }) => {
          const meta = GAME_META[type];
          const theme = GAME_THEME[type];
          const latest = latestDateWithGame(type);
          return (
            <Link
              key={slug}
              href={latest ? `/${slug}/${latest}` : `/${slug}`}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${theme.chip}`}>
                <GameGlyph type={type} />
              </span>
              <span>
                <span className="block font-bold">{meta.label}</span>
                <span className="block text-sm text-muted">{meta.short}</span>
                <span className={`mt-1 inline-block text-xs font-semibold ${theme.text}`}>
                  {latest ? 'Joacă acum →' : 'În curând'}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
