'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PackageIndexEntry } from '@/lib/schema/pack';
import { GAME_META, DIFFICULTIES, DIFFICULTY_LABEL, type GameType, type Difficulty } from '@/lib/schema/common';
import { GAME_SLUG } from '@/lib/ui/nav';
import { GAME_THEME } from '@/lib/ui/game-theme';
import { formatRomanianDate, RO_MONTHS } from '@/lib/date';

const GAME_FILTERS: GameType[] = [
  'sudoku',
  'rebus',
  'cuvinte-ascunse',
  'nonograma',
  'provocare-rapida',
  'kakuro',
  'anagrame',
  'labirint',
  'integrame',
];

export function ArchiveBrowser({ entries }: { entries: PackageIndexEntry[] }) {
  const [game, setGame] = useState<GameType | 'all'>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [month, setMonth] = useState<string | 'all'>('all');

  const months = useMemo(() => {
    const set = new Set(entries.map((e) => e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => (month === 'all' ? true : e.date.startsWith(month)))
      .filter((e) => (game === 'all' ? true : e.games.some((g) => g.type === game)))
      .filter((e) =>
        difficulty === 'all'
          ? true
          : e.games.some((g) => (game === 'all' ? true : g.type === game) && g.difficulty === difficulty),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries, month, game, difficulty]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4">
        <Select label="Joc" value={game} onChange={(v) => setGame(v as GameType | 'all')}>
          <option value="all">Toate jocurile</option>
          {GAME_FILTERS.map((t) => (
            <option key={t} value={t}>
              {GAME_META[t].label}
            </option>
          ))}
        </Select>
        <Select label="Dificultate" value={difficulty} onChange={(v) => setDifficulty(v as Difficulty | 'all')}>
          <option value="all">Toate nivelurile</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </Select>
        <Select label="Luna" value={month} onChange={(v) => setMonth(v)}>
          <option value="all">Toate lunile</option>
          {months.map((m) => {
            const [y, mo] = m.split('-');
            return (
              <option key={m} value={m}>
                {RO_MONTHS[Number(mo) - 1]} {y}
              </option>
            );
          })}
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted">{filtered.length} zile găsite.</p>

      <ul className="mt-3 grid gap-3">
        {filtered.map((entry) => (
          <li key={entry.date} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/arhiva/${entry.date}`} className="font-bold hover:text-brand-ink">
                  {formatRomanianDate(entry.date)}
                </Link>
                <p className="text-sm text-muted">{entry.title}</p>
              </div>
              {entry.fallbackUsed && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">rezervă</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.games
                .filter((g) => game === 'all' || g.type === game)
                .map((g) => (
                  <Link
                    key={g.id}
                    href={`/${GAME_SLUG[g.type as GameType]}/${entry.date}`}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${GAME_THEME[g.type as GameType].chip}`}
                  >
                    {GAME_META[g.type as GameType].label} · {DIFFICULTY_LABEL[g.difficulty]}
                  </Link>
                ))}
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="mt-6 text-center text-muted">Niciun rezultat pentru aceste filtre.</p>}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {children}
      </select>
    </label>
  );
}
