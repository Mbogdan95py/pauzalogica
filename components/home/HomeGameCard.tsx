import Link from 'next/link';
import type { Game } from '@/lib/schema/games';
import { GAME_META, DIFFICULTY_LABEL } from '@/lib/schema/common';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { GAME_SLUG } from '@/lib/ui/nav';
import { GamePreview } from './GamePreview';

/** A large colored card for one of the day's core games (matches the mockup). */
export function HomeGameCard({ game, date, title }: { game: Game; date: string; title?: string }) {
  const meta = GAME_META[game.type];
  const theme = GAME_THEME[game.type];
  const slug = GAME_SLUG[game.type];
  return (
    <div className={`flex flex-col rounded-2xl border border-border p-4 ${theme.cardBg}`}>
      <div className="text-center">
        <h3 className="font-bold">{title ?? meta.label}</h3>
        <p className={`text-sm font-semibold ${theme.text}`}>{DIFFICULTY_LABEL[game.difficulty]}</p>
      </div>
      <div className="mx-auto my-3 aspect-square w-full max-w-[150px]">
        <GamePreview type={game.type} />
      </div>
      <Link
        href={`/${slug}/${date}`}
        className={`btn ${theme.button} w-full font-semibold hover:brightness-95`}
        aria-label={`Joacă ${meta.label}`}
      >
        Joacă acum
      </Link>
      <p className="mt-3 text-center text-xs text-muted">Timp estimat: ~{game.estimatedMinutes} min</p>
    </div>
  );
}
