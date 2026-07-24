'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listInProgress, type GameProgress } from '@/lib/client/progress';
import { GAME_META } from '@/lib/schema/common';
import { GAME_SLUG } from '@/lib/ui/nav';
import { formatRomanianDate } from '@/lib/date';
import { formatDuration } from '@/lib/client/format';

/** Shows the player's unfinished games so they can resume ("continuarea unui joc"). */
export function ContinuePlaying() {
  const [items, setItems] = useState<GameProgress[]>([]);
  useEffect(() => setItems(listInProgress().slice(0, 4)), []);
  if (items.length === 0) return null;
  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-bold text-muted">Continuă unde ai rămas</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={`${it.date}-${it.type}`}>
            <Link
              href={`/${GAME_SLUG[it.type]}/${it.date}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm transition-colors hover:bg-border"
            >
              <span className="font-semibold">{GAME_META[it.type].label}</span>
              <span className="text-muted">
                {formatRomanianDate(it.date, false)} · {formatDuration(it.timeMs)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
