'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SudokuGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { GameToolbar, PausedOverlay, HintPanel, CompletionCard } from './GameChrome';

type Grid = number[][];
type Notes = number[][][];
interface Snapshot {
  values: Grid;
  notes: Notes;
}

const cloneG = (g: Grid): Grid => g.map((r) => r.slice());
const cloneN = (n: Notes): Notes => n.map((r) => r.map((c) => c.slice()));

function emptyNotes(): Notes {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [] as number[]));
}

function conflicts(values: Grid): boolean[][] {
  const bad = Array.from({ length: 9 }, () => Array<boolean>(9).fill(false));
  const mark = (cells: Array<[number, number]>) => {
    const seen = new Map<number, Array<[number, number]>>();
    for (const [r, c] of cells) {
      const v = values[r]![c]!;
      if (v === 0) continue;
      const list = seen.get(v) ?? [];
      list.push([r, c]);
      seen.set(v, list);
    }
    for (const list of seen.values())
      if (list.length > 1) for (const [r, c] of list) bad[r]![c] = true;
  };
  for (let i = 0; i < 9; i++) {
    mark(Array.from({ length: 9 }, (_, j) => [i, j] as [number, number]));
    mark(Array.from({ length: 9 }, (_, j) => [j, i] as [number, number]));
  }
  for (let br = 0; br < 9; br += 3)
    for (let bc = 0; bc < 9; bc += 3) {
      const cells: Array<[number, number]> = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([br + r, bc + c]);
      mark(cells);
    }
  return bad;
}

export function SudokuBoard({ game }: { game: SudokuGame }) {
  const session = useGameSession({ date: gameDate(game), type: 'sudoku', difficulty: game.difficulty });
  const given = game.puzzle.givens;
  const solution = game.solution.grid;

  const initValues = useCallback((): Grid => cloneG(given), [given]);

  const [values, setValues] = useState<Grid>(initValues);
  const [notes, setNotes] = useState<Notes>(emptyNotes);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [checkFlash, setCheckFlash] = useState<boolean[][] | null>(null);
  const [solutionShown, setSolutionShown] = useState(false);
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [, forceRerender] = useState(0);

  // Restore saved state once on mount (and on reset).
  useEffect(() => {
    const saved = session.saved?.state as { values?: Grid; notes?: Notes } | null;
    if (saved?.values && session.resetKey === 0) {
      setValues(saved.values.map((r) => r.slice()));
      if (saved.notes) setNotes(saved.notes.map((r) => r.map((c) => c.slice())));
    } else {
      setValues(initValues());
      setNotes(emptyNotes());
    }
    undoStack.current = [];
    redoStack.current = [];
    setSolutionShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const bad = useMemo(() => conflicts(values), [values]);

  const isGiven = (r: number, c: number) => given[r]![c]! !== 0;

  const pushHistory = () => {
    undoStack.current.push({ values: cloneG(values), notes: cloneN(notes) });
    if (undoStack.current.length > 200) undoStack.current.shift();
    redoStack.current = [];
  };

  const checkComplete = useCallback(
    (v: Grid) => {
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (v[r]![c] !== solution[r]![c]) return false;
      return true;
    },
    [solution],
  );

  const commit = (nextValues: Grid, nextNotes: Notes) => {
    setValues(nextValues);
    setNotes(nextNotes);
    session.persist({ values: nextValues, notes: nextNotes });
    if (checkComplete(nextValues)) session.complete({ values: nextValues, notes: nextNotes });
  };

  const setCell = (r: number, c: number, digit: number) => {
    if (isGiven(r, c) || session.status === 'completed' || session.paused) return;
    pushHistory();
    if (notesMode && digit !== 0) {
      const nextNotes = cloneN(notes);
      const cell = nextNotes[r]![c]!;
      const idx = cell.indexOf(digit);
      if (idx >= 0) cell.splice(idx, 1);
      else cell.push(digit);
      setNotes(nextNotes);
      session.persist({ values, notes: nextNotes });
      return;
    }
    const nextValues = cloneG(values);
    const prev = nextValues[r]![c]!;
    nextValues[r]![c] = digit;
    const nextNotes = cloneN(notes);
    nextNotes[r]![c] = [];
    // Count a mistake when a non-empty, wrong digit is newly entered.
    if (digit !== 0 && digit !== solution[r]![c] && prev !== digit) session.addMistake();
    commit(nextValues, nextNotes);
  };

  const undo = () => {
    const snap = undoStack.current.pop();
    if (!snap) return;
    redoStack.current.push({ values: cloneG(values), notes: cloneN(notes) });
    setValues(snap.values);
    setNotes(snap.notes);
    session.persist({ values: snap.values, notes: snap.notes });
    forceRerender((x) => x + 1);
  };

  const redo = () => {
    const snap = redoStack.current.pop();
    if (!snap) return;
    undoStack.current.push({ values: cloneG(values), notes: cloneN(notes) });
    setValues(snap.values);
    setNotes(snap.notes);
    session.persist({ values: snap.values, notes: snap.notes });
    forceRerender((x) => x + 1);
  };

  const checkCells = () => {
    const flags = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => values[r]![c] !== 0 && values[r]![c] !== solution[r]![c]),
    );
    setCheckFlash(flags);
    window.setTimeout(() => setCheckFlash(null), 1500);
  };

  const revealSolution = () => {
    setValues(cloneG(solution));
    setNotes(emptyNotes());
    setSolutionShown(true);
    session.persist({ values: cloneG(solution), notes: emptyNotes() });
  };

  // Keyboard controls.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const [r, c] = selected;
    if (e.key >= '1' && e.key <= '9') {
      setCell(r, c, Number(e.key));
      e.preventDefault();
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      setCell(r, c, 0);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelected([Math.max(0, r - 1), c]);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setSelected([Math.min(8, r + 1), c]);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setSelected([r, Math.max(0, c - 1)]);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setSelected([r, Math.min(8, c + 1)]);
      e.preventDefault();
    } else if (e.key.toLowerCase() === 'n') {
      setNotesMode((m) => !m);
    }
  };

  const selVal = selected ? values[selected[0]]![selected[1]]! : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty}>
          <button type="button" className="btn-ghost" onClick={undo} aria-label="Anulează">
            ↶
          </button>
          <button type="button" className="btn-ghost" onClick={redo} aria-label="Refă">
            ↷
          </button>
        </GameToolbar>

        <div className="relative">
          <PausedOverlay session={session} />
          <div
            role="grid"
            aria-label="Grilă Sudoku"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="mx-auto grid aspect-square w-full max-w-[520px] grid-cols-9 overflow-hidden rounded-xl border-2 border-border-strong bg-surface outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {values.map((row, r) =>
              row.map((v, c) => {
                const sel = selected && selected[0] === r && selected[1] === c;
                const inHighlight =
                  selected &&
                  (selected[0] === r ||
                    selected[1] === c ||
                    (Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                      Math.floor(selected[1] / 3) === Math.floor(c / 3)));
                const sameNum = selVal !== 0 && v === selVal;
                const wrong = (checkFlash && checkFlash[r]![c]) || bad[r]![c];
                const gv = isGiven(r, c);
                return (
                  <button
                    key={`${r}-${c}`}
                    role="gridcell"
                    aria-label={`Rând ${r + 1}, coloana ${c + 1}${v ? `, valoare ${v}` : ', gol'}${gv ? ', fix' : ''}`}
                    aria-selected={!!sel}
                    onClick={() => setSelected([r, c])}
                    className={[
                      'relative flex aspect-square items-center justify-center text-lg font-semibold transition-colors sm:text-xl',
                      'border border-border',
                      c % 3 === 0 && c !== 0 ? 'border-l-2 border-l-border-strong' : '',
                      r % 3 === 0 && r !== 0 ? 'border-t-2 border-t-border-strong' : '',
                      gv ? 'text-text' : 'text-nonograme',
                      sel ? 'bg-brand/20' : inHighlight ? 'bg-surface-2' : sameNum ? 'bg-brand/10' : 'bg-surface',
                      wrong ? '!text-rapid' : '',
                    ].join(' ')}
                  >
                    {v !== 0 ? (
                      v
                    ) : notes[r]![c]!.length ? (
                      <span className="grid grid-cols-3 gap-px p-0.5 text-[9px] leading-none text-muted">
                        {Array.from({ length: 9 }, (_, i) => (
                          <span key={i} className="grid h-2 w-2 place-items-center">
                            {notes[r]![c]!.includes(i + 1) ? i + 1 : ''}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-9 gap-1.5">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              type="button"
              className="btn-ghost aspect-square !px-0 text-lg font-bold"
              onClick={() => selected && setCell(selected[0], selected[1], d)}
              aria-label={`Introdu ${d}`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${notesMode ? 'bg-brand text-white' : 'btn-ghost'}`}
            onClick={() => setNotesMode((m) => !m)}
            aria-pressed={notesMode}
          >
            Notițe {notesMode ? 'ON' : 'OFF'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => selected && setCell(selected[0], selected[1], 0)}>
            Șterge
          </button>
          <button type="button" className="btn-ghost" onClick={checkCells}>
            Verifică
          </button>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard
          session={session}
          gameLabel="Sudoku"
          gameType="sudoku"
          date={gameDate(game)}
          difficulty={game.difficulty}
          onShowSolution={revealSolution}
          solutionShown={solutionShown}
        />
        <details className="rounded-xl border border-border bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Cum se joacă</summary>
          <p className="mt-2 text-muted">{game.instructions}</p>
        </details>
      </aside>
    </div>
  );
}

/** The play date is encoded in the game id (YYYY-MM-DD-type). */
function gameDate(game: SudokuGame): string {
  return game.id.slice(0, 10);
}
