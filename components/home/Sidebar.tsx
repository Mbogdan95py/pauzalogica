import Link from 'next/link';
import type { GameType } from '@/lib/schema/common';
import { GAME_META } from '@/lib/schema/common';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { GAME_SLUG } from '@/lib/ui/nav';
import { AdRectangle } from '@/components/ads/Ads';
import { GameGlyph, TrendingIcon, ChevronRight, StarIcon, BoltIcon } from '@/components/Icons';

const POPULAR: Array<{ type: GameType; label: string; href: string }> = [
  { type: 'integrame', label: 'Integrame', href: '/integrame' },
  { type: 'kakuro', label: 'Kakuro', href: '/kakuro' },
  { type: 'anagrame', label: 'Anagrame', href: '/anagrame' },
  { type: 'labirint', label: 'Labirint', href: '/labirinturi' },
  { type: 'careu', label: 'Careu clasic', href: '/rebus' },
];

export function HomeSidebar({ recommendation }: { recommendation: { type: GameType; date: string } | null }) {
  const rec = recommendation ? GAME_META[recommendation.type] : null;
  return (
    <aside className="grid content-start gap-6">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="flex items-center gap-2 font-bold">
          <TrendingIcon className="h-5 w-5 text-brand" /> Jocuri populare
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {POPULAR.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center gap-3 py-2.5 transition-colors hover:text-brand-ink">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${GAME_THEME[item.type].chip}`}>
                  <GameGlyph type={item.type} className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <AdRectangle />

      <div className="rounded-2xl border border-brand/30 bg-brand-soft/40 p-4">
        <h3 className="flex items-center gap-2 font-bold">
          <BoltIcon className="h-4 w-4 text-brand-ink" /> Fără cont. Fără complicații.
        </h3>
        <p className="mt-1 text-sm text-muted">Intri, joci și te relaxezi. Atât de simplu.</p>
      </div>

      {rec && recommendation && (
        <div className="rounded-2xl border border-nonograme/30 bg-nonograme/[0.06] p-4">
          <h3 className="flex items-center gap-2 font-bold">
            <StarIcon className="h-4 w-4 text-nonograme" /> Recomandarea zilei
          </h3>
          <p className="mt-1 text-sm font-medium">Încearcă {rec.label} de azi!</p>
          <p className="text-sm text-muted">{rec.short}</p>
          <Link href={`/${GAME_SLUG[recommendation.type]}/${recommendation.date}`} className="btn-brand mt-3">
            Joacă acum →
          </Link>
        </div>
      )}
    </aside>
  );
}
