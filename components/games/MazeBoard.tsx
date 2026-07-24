'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MazeGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { GameToolbar, PausedOverlay, HintPanel, CompletionCard } from './GameChrome';

const N = 1, E = 2, S = 4, W = 8;

export function MazeBoard({ game }: { game: MazeGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'labirint', difficulty: game.difficulty });
  const { width, height, walls, start, end } = game.puzzle;

  const [pos, setPos] = useState<{ row: number; col: number }>(start);
  const [trail, setTrail] = useState<string[]>([`${start.row},${start.col}`]);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const saved = session.saved?.state as { pos?: { row: number; col: number }; trail?: string[] } | null;
    if (saved?.pos && session.resetKey === 0) {
      setPos(saved.pos);
      setTrail(saved.trail ?? [`${saved.pos.row},${saved.pos.col}`]);
    } else {
      setPos(start);
      setTrail([`${start.row},${start.col}`]);
    }
    setShowSolution(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const move = useCallback(
    (dr: number, dc: number, bit: number) => {
      if (session.status === 'completed' || session.paused) return;
      setPos((p) => {
        if (walls[p.row]![p.col]! & bit) return p; // wall in the way
        const nr = p.row + dr;
        const nc = p.col + dc;
        if (nr < 0 || nr >= height || nc < 0 || nc >= width) return p;
        const next = { row: nr, col: nc };
        setTrail((t) => {
          const key = `${nr},${nc}`;
          const nt = t[t.length - 2] === key ? t.slice(0, -1) : [...t, key];
          session.persist({ pos: next, trail: nt });
          return nt;
        });
        if (nr === end.row && nc === end.col) session.complete({ pos: next });
        return next;
      });
    },
    [walls, width, height, end, session],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, [number, number, number]> = {
      ArrowUp: [-1, 0, N],
      ArrowDown: [1, 0, S],
      ArrowLeft: [0, -1, W],
      ArrowRight: [0, 1, E],
    };
    const m = map[e.key];
    if (m) {
      move(m[0], m[1], m[2]);
      e.preventDefault();
    }
  };

  const cell = width <= 9 ? 30 : width <= 13 ? 24 : width <= 17 ? 20 : 16;
  const W2 = width * cell;
  const H2 = height * cell;
  const trailSet = new Set(trail);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty} />
        <div className="relative">
          <PausedOverlay session={session} />
          <div
            tabIndex={0}
            onKeyDown={onKey}
            role="application"
            aria-label="Labirint. Folosește săgețile pentru a te deplasa."
            className="mx-auto w-fit rounded-xl border border-border bg-surface p-2 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg viewBox={`-1 -1 ${W2 + 2} ${H2 + 2}`} width={W2} height={H2} className="max-w-full" role="img">
              {/* trail */}
              {[...trailSet].map((k) => {
                const [r, c] = k.split(',').map(Number);
                return <rect key={k} x={c! * cell} y={r! * cell} width={cell} height={cell} fill="rgb(var(--c-labirint) / 0.15)" />;
              })}
              {/* solution path (optional) */}
              {showSolution &&
                game.solution.path.map((p, i) =>
                  i === 0 ? null : (
                    <line
                      key={i}
                      x1={game.solution.path[i - 1]!.col * cell + cell / 2}
                      y1={game.solution.path[i - 1]!.row * cell + cell / 2}
                      x2={p.col * cell + cell / 2}
                      y2={p.row * cell + cell / 2}
                      stroke="rgb(var(--c-rapid))"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  ),
                )}
              {/* walls */}
              {walls.map((row, r) =>
                row.map((w, c) => {
                  const x = c * cell;
                  const y = r * cell;
                  return (
                    <g key={`${r}-${c}`} stroke="rgb(var(--c-text))" strokeWidth={1.5} strokeLinecap="square">
                      {w & N ? <line x1={x} y1={y} x2={x + cell} y2={y} /> : null}
                      {w & S ? <line x1={x} y1={y + cell} x2={x + cell} y2={y + cell} /> : null}
                      {w & W ? <line x1={x} y1={y} x2={x} y2={y + cell} /> : null}
                      {w & E ? <line x1={x + cell} y1={y} x2={x + cell} y2={y + cell} /> : null}
                    </g>
                  );
                }),
              )}
              {/* end marker */}
              <rect x={end.col * cell + cell * 0.25} y={end.row * cell + cell * 0.25} width={cell * 0.5} height={cell * 0.5} rx={2} fill="rgb(var(--c-labirint))" />
              {/* player */}
              <circle cx={pos.col * cell + cell / 2} cy={pos.row * cell + cell / 2} r={cell * 0.3} fill="rgb(var(--c-brand))" />
            </svg>
          </div>
        </div>
        {/* On-screen controls for touch */}
        <div className="mx-auto grid w-40 grid-cols-3 gap-1.5 sm:hidden">
          <span />
          <button className="btn-ghost" onClick={() => move(-1, 0, N)} aria-label="Sus">↑</button>
          <span />
          <button className="btn-ghost" onClick={() => move(0, -1, W)} aria-label="Stânga">←</button>
          <button className="btn-ghost" onClick={() => move(1, 0, S)} aria-label="Jos">↓</button>
          <button className="btn-ghost" onClick={() => move(0, 1, E)} aria-label="Dreapta">→</button>
        </div>
        <p className="text-center text-sm text-muted">Folosește săgețile de la tastatură sau butoanele de mai sus.</p>
      </div>
      <aside className="grid content-start gap-4">
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard
          session={session}
          gameLabel="Labirint"
          gameType="labirint"
          date={date}
          difficulty={game.difficulty}
          onShowSolution={() => setShowSolution(true)}
          solutionShown={showSolution}
        />
      </aside>
    </div>
  );
}
