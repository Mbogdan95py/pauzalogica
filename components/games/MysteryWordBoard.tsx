'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MysteryWordGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { normalizeForGrid, foldDiacritics, fixRomanianDiacritics } from '@/lib/text/diacritics';
import { GameToolbar, HintPanel, CompletionCard } from './GameChrome';

function normChar(ch: string): string {
  const f = foldDiacritics(fixRomanianDiacritics(ch)).toUpperCase();
  return /^[A-Z]$/.test(f) ? f : '';
}

export function MysteryWordBoard({ game }: { game: MysteryWordGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'cuvant-misterios', difficulty: game.difficulty });
  const answer = normalizeForGrid(game.solution.answer);
  const { length, category, revealed } = game.puzzle;
  const revealedSet = new Set(revealed);

  const initLetters = useCallback(
    () => Array.from({ length }, (_, i) => (revealedSet.has(i) ? answer[i]! : '')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [length],
  );
  const [letters, setLetters] = useState<string[]>(initLetters);
  const [sel, setSel] = useState<number>(() => {
    for (let i = 0; i < length; i++) if (!revealedSet.has(i)) return i;
    return 0;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = session.saved?.state as { letters?: string[] } | null;
    if (saved?.letters && session.resetKey === 0) setLetters(saved.letters);
    else setLetters(initLetters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const nextEditable = (from: number, dir: 1 | -1) => {
    let i = from + dir;
    while (i >= 0 && i < length) {
      if (!revealedSet.has(i)) return i;
      i += dir;
    }
    return from;
  };

  const write = (i: number, ch: string) => {
    if (revealedSet.has(i) || session.status === 'completed') return;
    setLetters((prev) => {
      const next = prev.slice();
      next[i] = ch;
      if (ch && ch !== answer[i]) session.addMistake();
      session.persist({ letters: next });
      if (next.every((l, idx) => l === answer[idx])) session.complete({ letters: next });
      return next;
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (letters[sel]) write(sel, '');
      else setSel((s) => nextEditable(s, -1));
      e.preventDefault();
    } else if (e.key === 'ArrowRight') setSel((s) => nextEditable(s, 1));
    else if (e.key === 'ArrowLeft') setSel((s) => nextEditable(s, -1));
    else {
      const ch = normChar(e.key);
      if (ch) {
        write(sel, ch);
        setSel((s) => nextEditable(s, 1));
        e.preventDefault();
      }
    }
  };

  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <GameToolbar session={session} difficulty={game.difficulty} />
      <p className="text-center text-sm text-muted">
        Categorie: <span className="font-semibold text-text">{category}</span>
      </p>
      <input ref={inputRef} className="sr-only" aria-hidden="true" value="" onChange={() => {}} onKeyDown={onKey} />
      <div className="flex flex-wrap justify-center gap-1.5">
        {letters.map((ch, i) => {
          const locked = revealedSet.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!locked) {
                  setSel(i);
                  inputRef.current?.focus({ preventScroll: true });
                }
              }}
              aria-label={`Litera ${i + 1}${locked ? ', dezvăluită' : ''}`}
              className={[
                'grid h-11 w-9 place-items-center rounded-md border-2 text-xl font-bold uppercase',
                locked ? 'border-border bg-surface-2 text-muted' : sel === i ? 'border-brand bg-brand/10' : 'border-border-strong bg-surface',
              ].join(' ')}
            >
              {ch}
            </button>
          );
        })}
      </div>
      <HintPanel hints={game.hints} session={session} />
      <CompletionCard session={session} gameLabel="Cuvânt misterios" gameType="cuvant-misterios" date={date} difficulty={game.difficulty} />
    </div>
  );
}
