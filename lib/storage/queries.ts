import type { GameType } from '@/lib/schema/common';
import type { Game } from '@/lib/schema/games';
import type { DailyPackage } from '@/lib/schema/pack';
import { listDates, readPackage } from './content';
import { compareDate } from '@/lib/date';

/**
 * Build-time queries over the content packages (Node-only). Used by server
 * components and generateStaticParams to enumerate game routes.
 */

export function gameOfType(pkg: DailyPackage, type: GameType): Game | undefined {
  return pkg.games.find((g) => g.type === type);
}

/** Dates (ascending) whose package contains a game of `type`. */
export function datesWithGame(type: GameType): string[] {
  const out: string[] = [];
  for (const date of listDates()) {
    const pkg = readPackage(date);
    if (pkg && gameOfType(pkg, type)) out.push(date);
  }
  return out;
}

export function latestDateWithGame(type: GameType): string | null {
  const dates = datesWithGame(type);
  return dates.length ? dates[dates.length - 1]! : null;
}

/** Previous/next date that also has this game type (for in-game navigation). */
export function adjacentGameDates(type: GameType, date: string): { prev: string | null; next: string | null } {
  const dates = datesWithGame(type);
  const idx = dates.indexOf(date);
  return {
    prev: idx > 0 ? dates[idx - 1]! : null,
    next: idx >= 0 && idx < dates.length - 1 ? dates[idx + 1]! : null,
  };
}

/** Most recent packages (descending), for archive previews. */
export function recentPackages(limit = 12): DailyPackage[] {
  const dates = listDates().sort((a, b) => compareDate(b, a));
  const out: DailyPackage[] = [];
  for (const date of dates.slice(0, limit)) {
    const pkg = readPackage(date);
    if (pkg) out.push(pkg);
  }
  return out;
}
