'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NonogramGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { GameToolbar, PausedOverlay, HintPanel, CompletionCard } from './GameChrome';

// cell state: 0 = empty, 1 = filled, 2 = marked-empty (X)
type Cell = 0 | 1 | 2;

export function NonogramBoard({ game }: { game: NonogramGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'nonograma', difficulty: game.difficulty });
  const { width, height, rowClues, colClues } = game.puzzle;
  const solution = game.solution.grid;

  const fresh = useCallback(
    () => Array.from({ length: height }, () => Array<Cell>(width).fill(0)),
    [height, width],
  );
  const [cells, setCells] = useState<Cell[][]>(fresh);
  const [mode, setMode] = useState<'fill' | 'mark'>('fill');
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    const saved = session.saved?.state as { cells?: Cell[][] } | null;
    if (saved?.cells && session.resetKey === 0) setCells(saved.cells.map((r) => r.slice() as Cell[]));
    else setCells(fresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const isComplete = useCallback(
    (grid: Cell[][]) => {
      for (let r = 0; r < height; r++)
        for (let c = 0; c < width; c++) {
          const shouldFill = solution[r]![c] === 1;
          const isFilled = grid[r]![c] === 1;
          if (shouldFill !== isFilled) return false;
        }
      return true;
    },
    [height, width, solution],
  );

  const toggle = (r: number, c: number) => {
    if (session.status === 'completed' || session.paused) return;
    setCells((prev) => {
      const next = prev.map((row) => row.slice() as Cell[]);
      const cur = next[r]![c]!;
      if (mode === 'fill') {
        next[r]![c] = cur === 1 ? 0 : 1;
        if (next[r]![c] === 1 && solution[r]![c] !== 1) session.addMistake();
      } else {
        next[r]![c] = cur === 2 ? 0 : 2;
      }
      session.persist({ cells: next });
      if (isComplete(next)) {
        setSolved(true);
        session.complete({ cells: next });
      }
      return next;
    });
  };

  const maxRowClue = Math.max(1, ...rowClues.map((r) => r.length));
  const maxColClue = Math.max(1, ...colClues.map((c) => c.length));
  const cellPx = width <= 5 ? 40 : width <= 10 ? 30 : 22;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty}>
          <button
            type="button"
            className={`btn ${mode === 'fill' ? 'bg-nonograme text-white' : 'btn-ghost'}`}
            onClick={() => setMode('fill')}
            aria-pressed={mode === 'fill'}
          >
            Umple
          </button>
          <button
            type="button"
            className={`btn ${mode === 'mark' ? 'bg-nonograme text-white' : 'btn-ghost'}`}
            onClick={() => setMode('mark')}
            aria-pressed={mode === 'mark'}
          >
            Marchează X
          </button>
        </GameToolbar>

        <div className="rounded-xl border border-nonograme/30 bg-nonograme/[0.06] p-3 text-sm">
          <p className="font-semibold">Cum se joacă</p>
          <p className="mt-1 text-muted">
            Numerele de lângă fiecare rând și deasupra fiecărei coloane arată câte căsuțe pline sunt la rând, în
            ordine (de ex. <span className="font-semibold text-text">2 1</span> = un grup de 2, apoi unul de 1,
            despărțite de cel puțin o căsuță goală). Apasă <span className="font-semibold text-text">Umple</span> și
            colorează căsuțele corecte; folosește <span className="font-semibold text-text">Marchează X</span> pentru
            cele sigur goale. Când imaginea e completă, ai câștigat.
          </p>
        </div>

        <div className="relative overflow-auto">
          <PausedOverlay session={session} />
          <table className="mx-auto border-collapse select-none" role="grid" aria-label="Grilă nonogramă">
            <thead>
              <tr>
                <th style={{ width: maxRowClue * 16 }} />
                {colClues.map((clue, c) => (
                  <th key={c} className="align-bottom">
                    <div className="flex flex-col items-center justify-end text-[11px] font-semibold text-muted" style={{ height: maxColClue * 16 }}>
                      {clue.length ? clue.map((n, i) => <span key={i}>{n}</span>) : <span>0</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, r) => (
                <tr key={r}>
                  <th className="pr-1 text-right align-middle text-[11px] font-semibold text-muted">
                    <div className="flex items-center justify-end gap-1">
                      {rowClues[r]!.length ? rowClues[r]!.map((n, i) => <span key={i}>{n}</span>) : <span>0</span>}
                    </div>
                  </th>
                  {row.map((cell, c) => (
                    <td key={c} className="p-0">
                      <button
                        type="button"
                        onClick={() => toggle(r, c)}
                        aria-label={`Rând ${r + 1}, coloana ${c + 1}: ${cell === 1 ? 'plin' : cell === 2 ? 'gol marcat' : 'necunoscut'}`}
                        className={[
                          'block border border-border transition-colors',
                          c % 5 === 0 && c !== 0 ? 'border-l-border-strong' : '',
                          r % 5 === 0 && r !== 0 ? 'border-t-border-strong' : '',
                          cell === 1 ? 'bg-nonograme' : 'bg-surface hover:bg-surface-2',
                        ].join(' ')}
                        style={{ width: cellPx, height: cellPx }}
                      >
                        {cell === 2 && <span className="text-xs text-muted">✕</span>}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard session={session} gameLabel="Nonogramă" gameType="nonograma" date={date} difficulty={game.difficulty} solutionShown={solved} />
        <details className="rounded-xl border border-border bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Cum se joacă</summary>
          <p className="mt-2 text-muted">{game.instructions}</p>
        </details>
      </aside>
    </div>
  );
}
