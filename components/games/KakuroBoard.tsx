'use client';

import { useCallback, useEffect, useState } from 'react';
import type { KakuroGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { GameToolbar, PausedOverlay, HintPanel, CompletionCard } from './GameChrome';

export function KakuroBoard({ game }: { game: KakuroGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'kakuro', difficulty: game.difficulty });
  const { width, height, cells } = game.puzzle;
  const solution = game.solution.grid;

  const fresh = useCallback(
    () => Array.from({ length: height }, () => Array<number>(width).fill(0)),
    [height, width],
  );
  const [values, setValues] = useState<number[][]>(fresh);
  const [sel, setSel] = useState<[number, number] | null>(null);

  useEffect(() => {
    const saved = session.saved?.state as { values?: number[][] } | null;
    if (saved?.values && session.resetKey === 0) setValues(saved.values.map((r) => r.slice()));
    else setValues(fresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const isComplete = useCallback(
    (v: number[][]) => {
      for (let r = 0; r < height; r++)
        for (let c = 0; c < width; c++)
          if (cells[r]![c]!.kind === 'entry' && v[r]![c] !== solution[r]![c]) return false;
      return true;
    },
    [cells, height, width, solution],
  );

  const setDigit = (d: number) => {
    if (!sel || session.status === 'completed' || session.paused) return;
    const [r, c] = sel;
    if (cells[r]![c]!.kind !== 'entry') return;
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[r]![c] = d;
      if (d !== 0 && d !== solution[r]![c]) session.addMistake();
      session.persist({ values: next });
      if (isComplete(next)) session.complete({ values: next });
      return next;
    });
  };

  const px = width <= 6 ? 46 : width <= 8 ? 40 : 34;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty} />
        <div className="relative overflow-auto">
          <PausedOverlay session={session} />
          <div
            className="mx-auto grid w-max overflow-hidden rounded-lg border border-border-strong"
            style={{ gridTemplateColumns: `repeat(${width}, ${px}px)` }}
            role="grid"
            aria-label="Grilă Kakuro"
          >
            {cells.map((row, r) =>
              row.map((cell, c) => {
                if (cell.kind === 'block') {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="relative border border-border bg-surface-2"
                      style={{ width: px, height: px, backgroundImage: 'linear-gradient(to bottom right, transparent calc(50% - 1px), rgb(var(--c-border-strong)), transparent calc(50% + 1px))' }}
                    >
                      {cell.right != null && (
                        <span className="absolute right-1 top-0.5 text-[11px] font-bold text-text">{cell.right}</span>
                      )}
                      {cell.down != null && (
                        <span className="absolute bottom-0.5 left-1 text-[11px] font-bold text-text">{cell.down}</span>
                      )}
                    </div>
                  );
                }
                const selected = sel && sel[0] === r && sel[1] === c;
                const v = values[r]![c]!;
                const wrong = v !== 0 && v !== solution[r]![c];
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => setSel([r, c])}
                    aria-label={`Celulă ${r + 1},${c + 1}${v ? `, valoare ${v}` : ', gol'}`}
                    className={[
                      'flex items-center justify-center border border-border text-lg font-semibold',
                      selected ? 'bg-kakuro/20 ring-2 ring-kakuro' : 'bg-surface',
                      wrong ? 'text-rapid' : 'text-kakuro',
                    ].join(' ')}
                    style={{ width: px, height: px }}
                  >
                    {v !== 0 ? v : ''}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <div className="grid grid-cols-9 gap-1.5">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
            <button key={d} type="button" className="btn-ghost aspect-square !px-0 text-lg font-bold" onClick={() => setDigit(d)}>
              {d}
            </button>
          ))}
        </div>
        <button type="button" className="btn-ghost w-fit" onClick={() => setDigit(0)}>
          Șterge
        </button>
      </div>
      <aside className="grid content-start gap-4">
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard session={session} gameLabel="Kakuro" gameType="kakuro" date={date} difficulty={game.difficulty} />
        <details className="rounded-xl border border-border bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Cum se joacă</summary>
          <p className="mt-2 text-muted">{game.instructions}</p>
        </details>
      </aside>
    </div>
  );
}
