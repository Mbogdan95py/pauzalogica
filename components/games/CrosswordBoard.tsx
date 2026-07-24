'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CrosswordGame, CrosswordEntry } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { foldDiacritics, fixRomanianDiacritics } from '@/lib/text/diacritics';
import { GameToolbar, PausedOverlay, HintPanel, CompletionCard } from './GameChrome';

type Dir = 'across' | 'down';

function entryCells(e: CrosswordEntry): Array<[number, number]> {
  const dr = e.direction === 'down' ? 1 : 0;
  const dc = e.direction === 'across' ? 1 : 0;
  return Array.from({ length: e.length }, (_, i) => [e.row + dr * i, e.col + dc * i] as [number, number]);
}

function normChar(ch: string): string {
  const folded = foldDiacritics(fixRomanianDiacritics(ch)).toUpperCase();
  return /^[A-Z]$/.test(folded) ? folded : '';
}

export function CrosswordBoard({ game }: { game: CrosswordGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: game.type, difficulty: game.difficulty });
  const { width, height, blocks, numbers, entries } = game.puzzle;
  const solution = game.solution.grid;

  const fresh = useCallback(
    () => Array.from({ length: height }, () => Array<string>(width).fill('')),
    [height, width],
  );
  const [values, setValues] = useState<string[][]>(fresh);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [dir, setDir] = useState<Dir>('across');
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = session.saved?.state as { values?: string[][] } | null;
    if (saved?.values && session.resetKey === 0) setValues(saved.values.map((r) => r.slice()));
    else setValues(fresh());
    setSolved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const across = entries.filter((e) => e.direction === 'across').sort((a, b) => a.number - b.number);
  const down = entries.filter((e) => e.direction === 'down').sort((a, b) => a.number - b.number);

  const currentEntry = useMemo(() => {
    if (!sel) return null;
    return (
      entries.find(
        (e) => e.direction === dir && entryCells(e).some(([r, c]) => r === sel[0] && c === sel[1]),
      ) ?? entries.find((e) => entryCells(e).some(([r, c]) => r === sel[0] && c === sel[1])) ?? null
    );
  }, [sel, dir, entries]);

  const currentCells = useMemo(() => new Set((currentEntry ? entryCells(currentEntry) : []).map(([r, c]) => `${r},${c}`)), [currentEntry]);

  const isComplete = useCallback(
    (v: string[][]) => {
      for (let r = 0; r < height; r++)
        for (let c = 0; c < width; c++)
          if (!blocks[r]![c] && v[r]![c] !== foldDiacritics(solution[r]![c] ?? '').toUpperCase()) return false;
      return true;
    },
    [blocks, height, width, solution],
  );

  const writeCell = (r: number, c: number, ch: string) => {
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[r]![c] = ch;
      const target = foldDiacritics(solution[r]![c] ?? '').toUpperCase();
      if (ch !== '' && ch !== target) session.addMistake();
      session.persist({ values: next });
      if (isComplete(next)) {
        setSolved(true);
        session.complete({ values: next });
      }
      return next;
    });
  };

  const advance = (back = false) => {
    if (!currentEntry || !sel) return;
    const cells = entryCells(currentEntry);
    const idx = cells.findIndex(([r, c]) => r === sel[0] && c === sel[1]);
    const nextIdx = back ? idx - 1 : idx + 1;
    if (nextIdx >= 0 && nextIdx < cells.length) setSel(cells[nextIdx]!);
  };

  const selectCell = (r: number, c: number) => {
    if (blocks[r]![c]) return;
    if (sel && sel[0] === r && sel[1] === c) setDir((d) => (d === 'across' ? 'down' : 'across'));
    setSel([r, c]);
    inputRef.current?.focus({ preventScroll: true });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!sel || session.status === 'completed' || session.paused) return;
    const [r, c] = sel;
    if (e.key === 'Backspace') {
      if (values[r]![c]) writeCell(r, c, '');
      else advance(true);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setDir('across');
      setSel([r, Math.min(width - 1, c + 1)]);
    } else if (e.key === 'ArrowLeft') {
      setDir('across');
      setSel([r, Math.max(0, c - 1)]);
    } else if (e.key === 'ArrowDown') {
      setDir('down');
      setSel([Math.min(height - 1, r + 1), c]);
    } else if (e.key === 'ArrowUp') {
      setDir('down');
      setSel([Math.max(0, r - 1), c]);
    } else {
      const ch = normChar(e.key);
      if (ch) {
        writeCell(r, c, ch);
        advance();
        e.preventDefault();
      }
    }
  };

  const revealSolution = () => {
    const full = solution.map((row) => row.map((ch) => foldDiacritics(ch ?? '').toUpperCase()));
    setValues(full);
    setSolved(true);
    session.persist({ values: full });
  };

  const px = width <= 9 ? 36 : width <= 12 ? 30 : 26;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty}>
          <button type="button" className="btn-ghost" onClick={() => setDir((d) => (d === 'across' ? 'down' : 'across'))}>
            {dir === 'across' ? 'Orizontal ➡' : 'Vertical ⬇'}
          </button>
        </GameToolbar>
        <div className="relative overflow-x-auto">
          <PausedOverlay session={session} />
          <input
            ref={inputRef}
            className="sr-only"
            aria-hidden="true"
            inputMode="text"
            autoCapitalize="characters"
            value=""
            onChange={() => {}}
            onKeyDown={onKey}
          />
          <div
            className="mx-auto grid w-max rounded-lg border border-border-strong bg-border-strong"
            style={{ gridTemplateColumns: `repeat(${width}, ${px}px)`, gap: 1 }}
            role="grid"
            aria-label="Grilă rebus"
          >
            {Array.from({ length: height }, (_, r) =>
              Array.from({ length: width }, (_, c) => {
                if (blocks[r]![c]) return <div key={`${r}-${c}`} className="bg-text/80" style={{ width: px, height: px }} />;
                const isSel = sel && sel[0] === r && sel[1] === c;
                const inEntry = currentCells.has(`${r},${c}`);
                const num = numbers[r]![c]!;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => selectCell(r, c)}
                    aria-label={`Celulă ${r + 1},${c + 1}`}
                    className={[
                      'relative flex items-center justify-center text-base font-semibold uppercase',
                      isSel ? 'bg-brand/30' : inEntry ? 'bg-brand/10' : 'bg-surface',
                    ].join(' ')}
                    style={{ width: px, height: px }}
                  >
                    {num > 0 && <span className="absolute left-0.5 top-0 text-[9px] font-bold text-muted">{num}</span>}
                    {values[r]![c]}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ClueList title="Orizontal" entries={across} currentNumber={currentEntry?.direction === 'across' ? currentEntry.number : null} onPick={(e) => { setDir('across'); setSel([e.row, e.col]); }} />
          <ClueList title="Vertical" entries={down} currentNumber={currentEntry?.direction === 'down' ? currentEntry.number : null} onPick={(e) => { setDir('down'); setSel([e.row, e.col]); }} />
        </div>
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard session={session} gameLabel={game.title} gameType={game.type} date={date} difficulty={game.difficulty} onShowSolution={revealSolution} solutionShown={solved} />
      </aside>
    </div>
  );
}

function ClueList({
  title,
  entries,
  currentNumber,
  onPick,
}: {
  title: string;
  entries: CrosswordEntry[];
  currentNumber: number | null;
  onPick: (e: CrosswordEntry) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="font-semibold">{title}</h3>
      <ol className="mt-2 space-y-1 text-sm">
        {entries.map((e) => (
          <li key={`${e.number}-${e.direction}`}>
            <button
              type="button"
              onClick={() => onPick(e)}
              className={`w-full rounded px-1.5 py-1 text-left transition-colors hover:bg-surface-2 ${
                currentNumber === e.number ? 'bg-brand/10 font-medium' : ''
              }`}
            >
              <span className="font-semibold text-brand-ink">{e.number}.</span> {e.clue}{' '}
              <span className="text-muted">({e.length})</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
