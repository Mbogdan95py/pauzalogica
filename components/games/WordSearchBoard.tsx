'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WordSearchGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { GameToolbar, PausedOverlay, HintPanel, CompletionCard } from './GameChrome';

function lineBetween(a: [number, number], b: [number, number]): Array<[number, number]> | null {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const lenR = Math.abs(b[0] - a[0]);
  const lenC = Math.abs(b[1] - a[1]);
  // Must be horizontal, vertical or 45° diagonal.
  if (!(lenR === 0 || lenC === 0 || lenR === lenC)) return null;
  const len = Math.max(lenR, lenC);
  const cells: Array<[number, number]> = [];
  for (let i = 0; i <= len; i++) cells.push([a[0] + dr * i, a[1] + dc * i]);
  return cells;
}

export function WordSearchBoard({ game }: { game: WordSearchGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'cuvinte-ascunse', difficulty: game.difficulty });
  const { width, grid, words } = game.puzzle;

  const [first, setFirst] = useState<[number, number] | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const wordSet = useMemo(() => new Set(words.map((w) => w.normalized)), [words]);

  useEffect(() => {
    const saved = session.saved?.state as { found?: string[] } | null;
    if (saved?.found && session.resetKey === 0) setFound(saved.found);
    else setFound([]);
    setFirst(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const foundCells = useMemo(() => {
    const set = new Set<string>();
    for (const p of game.solution.placements)
      if (found.includes(p.normalized)) for (const cell of p.cells) set.add(`${cell.row},${cell.col}`);
    return set;
  }, [found, game.solution.placements]);

  const previewCells = useMemo(() => {
    if (!first || !hover) return new Set<string>();
    const line = lineBetween(first, hover);
    return new Set((line ?? []).map(([r, c]) => `${r},${c}`));
  }, [first, hover]);

  const evaluate = useCallback(
    (a: [number, number], b: [number, number]) => {
      const line = lineBetween(a, b);
      if (!line) return;
      const letters = line.map(([r, c]) => grid[r]![c]).join('');
      const reversed = letters.split('').reverse().join('');
      const match = wordSet.has(letters) ? letters : wordSet.has(reversed) ? reversed : null;
      if (match && !found.includes(match)) {
        const next = [...found, match];
        setFound(next);
        session.persist({ found: next });
        if (next.length === words.length) session.complete({ found: next });
      }
    },
    [grid, wordSet, found, words.length, session],
  );

  const clickCell = (r: number, c: number) => {
    if (session.status === 'completed' || session.paused) return;
    if (!first) {
      setFirst([r, c]);
    } else {
      evaluate(first, [r, c]);
      setFirst(null);
      setHover(null);
    }
  };

  const px = width <= 10 ? 34 : width <= 12 ? 30 : 26;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty} />
        <div className="relative overflow-auto">
          <PausedOverlay session={session} />
          <div
            className="mx-auto grid w-max rounded-xl border border-border bg-surface p-1"
            style={{ gridTemplateColumns: `repeat(${width}, ${px}px)` }}
            role="grid"
            aria-label="Grilă de cuvinte ascunse"
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const key = `${r},${c}`;
                const isFound = foundCells.has(key);
                const isPreview = previewCells.has(key);
                const isFirst = first && first[0] === r && first[1] === c;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => clickCell(r, c)}
                    onMouseEnter={() => first && setHover([r, c])}
                    aria-label={`Litera ${letter}, rând ${r + 1}, coloana ${c + 1}`}
                    className={[
                      'grid place-items-center rounded font-semibold uppercase transition-colors',
                      isFound ? 'bg-cuvinte/25 text-cuvinte' : isFirst ? 'bg-brand text-white' : isPreview ? 'bg-brand/20' : 'hover:bg-surface-2',
                    ].join(' ')}
                    style={{ width: px, height: px }}
                  >
                    {letter}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <p className="text-center text-sm text-muted">
          Apasă pe prima și pe ultima literă a unui cuvânt. {first ? 'Alege litera finală…' : ''}
        </p>
      </div>
      <aside className="grid content-start gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-semibold">
            Cuvinte ({found.length}/{words.length})
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {words.map((w) => (
              <li
                key={w.normalized}
                className={found.includes(w.normalized) ? 'text-cuvinte line-through' : 'text-text'}
              >
                {w.display}
              </li>
            ))}
          </ul>
        </div>
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard session={session} gameLabel="Cuvinte ascunse" gameType="cuvinte-ascunse" date={date} difficulty={game.difficulty} />
      </aside>
    </div>
  );
}
