import Link from 'next/link';
import type { GameType } from '@/lib/schema/common';
import { GAME_META } from '@/lib/schema/common';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { GAME_SLUG } from '@/lib/ui/nav';
import { GameGlyph } from '@/components/Icons';

export function SmallGameTile({ type, label, href }: { type: GameType; label?: string; href?: string }) {
  const meta = GAME_META[type];
  const theme = GAME_THEME[type];
  return (
    <Link
      href={href ?? `/${GAME_SLUG[type]}`}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center transition-colors hover:bg-surface-2"
    >
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${theme.chip}`}>
        <GameGlyph type={type} />
      </span>
      <span className="text-sm font-semibold">{label ?? meta.label}</span>
    </Link>
  );
}
