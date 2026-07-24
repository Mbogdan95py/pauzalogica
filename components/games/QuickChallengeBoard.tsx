'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QuickChallengeGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { normalizeForGrid } from '@/lib/text/diacritics';
import { has } from '@/lib/dictionary';
import { evaluateGuess, type LetterMark } from '@/generators/quick-challenge';
import { buildShareText, shareResult } from '@/lib/client/share';
import { GameToolbar } from './GameChrome';

const KEYS = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), ['⏎', ...'ZXCVBNM'.split(''), '⌫']];
const MARK_EMOJI: Record<LetterMark, string> = { correct: '🟩', present: '🟨', absent: '⬜' };
const MARK_BG: Record<LetterMark, string> = {
  correct: 'bg-labirint text-white border-labirint',
  present: 'bg-brand text-white border-brand',
  absent: 'bg-surface-2 text-muted border-border',
};

export function QuickChallengeBoard({ game }: { game: QuickChallengeGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'provocare-rapida', difficulty: game.difficulty });
  const answer = normalizeForGrid(game.solution.answer);
  const len = game.puzzle.length;
  const maxAttempts = game.puzzle.maxAttempts;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const saved = session.saved?.state as { guesses?: string[]; won?: boolean } | null;
    if (saved?.guesses && session.resetKey === 0) {
      setGuesses(saved.guesses);
      setWon(!!saved.won);
    } else {
      setGuesses([]);
      setWon(false);
    }
    setCurrent('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const finished = session.status === 'completed';
  const marks = (g: string) => evaluateGuess(answer, g);

  const submit = useCallback(() => {
    if (finished) return;
    const guess = normalizeForGrid(current);
    if (guess.length !== len) {
      setMessage(`Cuvântul trebuie să aibă ${len} litere.`);
      return;
    }
    if (!has(guess)) {
      setMessage('Cuvânt necunoscut în dicționar.');
      return;
    }
    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrent('');
    setMessage(null);
    const isWin = guess === answer;
    if (!isWin) session.addMistake();
    const outOfAttempts = nextGuesses.length >= maxAttempts;
    session.persist({ guesses: nextGuesses, won: isWin });
    if (isWin) {
      setWon(true);
      session.complete({ guesses: nextGuesses, won: true });
    } else if (outOfAttempts) {
      session.complete({ guesses: nextGuesses, won: false });
    }
  }, [current, finished, guesses, len, maxAttempts, answer, session]);

  const press = (key: string) => {
    if (finished) return;
    if (key === '⏎') submit();
    else if (key === '⌫') setCurrent((c) => c.slice(0, -1));
    else if (/^[A-Z]$/.test(key) && current.length < len) setCurrent((c) => c + key);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') press('⏎');
      else if (e.key === 'Backspace') press('⌫');
      else {
        const ch = normalizeForGrid(e.key);
        if (ch.length === 1) press(ch);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, finished, guesses]);

  const shareGrid = guesses.map((g) => marks(g).map((m) => MARK_EMOJI[m]).join('')).join('\n');

  const doShare = async () => {
    const header = `PauzaLogica.ro — Provocarea rapidă ${won ? guesses.length : 'X'}/${maxAttempts}`;
    const text = buildShareText({
      gameLabel: 'Provocarea rapidă',
      date,
      timeMs: session.timeMs,
      difficulty: game.difficulty,
      mistakes: session.mistakes,
      hintsUsed: session.hintsUsed,
      streak: session.streak,
      grid: `${header}\n${shareGrid}`,
    });
    const outcome = await shareResult(text);
    setMessage(outcome === 'copied' ? 'Rezultat copiat!' : outcome === 'shared' ? 'Distribuit!' : 'Nu s-a putut distribui.');
  };

  const rows = Array.from({ length: maxAttempts }, (_, i) => {
    if (i < guesses.length) return { guess: guesses[i]!, marks: marks(guesses[i]!), locked: true };
    if (i === guesses.length && !finished) return { guess: current, marks: null, locked: false };
    return { guess: '', marks: null, locked: false };
  });

  // Cap the board width so the tiles never overflow the page (≈56px per tile).
  const boardWidth = `min(100%, ${len * 58}px)`;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <GameToolbar session={session} difficulty={game.difficulty} />

      <p className="text-center text-sm text-muted">
        Ghicește cuvântul de {len} litere. Verde = literă corectă, galben = literă greșit plasată, gri = literă absentă.
      </p>

      <div className="mx-auto grid gap-1.5" style={{ width: boardWidth }}>
        {rows.map((row, ri) => (
          <div key={ri} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${len}, minmax(0, 1fr))` }}>
            {Array.from({ length: len }, (_, ci) => {
              const ch = row.guess[ci] ?? '';
              const mark = row.marks?.[ci];
              return (
                <div
                  key={ci}
                  className={`grid aspect-square place-items-center rounded-md border-2 text-xl font-bold uppercase ${
                    mark ? MARK_BG[mark] : ch ? 'border-border-strong' : 'border-border'
                  }`}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {message && <p className="text-center text-sm text-muted" role="status">{message}</p>}

      {finished ? (
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="font-semibold">{won ? 'Bravo! Ai ghicit cuvântul.' : 'Ai rămas fără încercări.'}</p>
          <pre className="mt-2 font-mono text-lg leading-tight">{shareGrid}</pre>
          <button type="button" className="btn-brand mt-3" onClick={doShare}>
            Distribuie rezultatul
          </button>
          <p className="mt-2 text-xs text-muted">Rezultatul nu dezvăluie cuvântul.</p>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-sm gap-1.5">
          {KEYS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1">
              {row.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => press(key)}
                  className={`h-11 min-w-0 rounded-md bg-surface-2 text-sm font-semibold uppercase hover:bg-border ${
                    key.length > 1 ? 'flex-[1.6] px-1' : 'flex-1 px-0'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
