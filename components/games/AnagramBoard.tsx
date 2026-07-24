'use client';

import { useEffect, useState } from 'react';
import type { AnagramGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { normalizeForGrid } from '@/lib/text/diacritics';
import { isValidAnagramAnswer } from '@/generators/anagram';
import { GameToolbar, HintPanel, CompletionCard } from './GameChrome';

export function AnagramBoard({ game }: { game: AnagramGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'anagrame', difficulty: game.difficulty });
  const items = game.puzzle.items;
  const answers = game.solution.answers;

  const [inputs, setInputs] = useState<string[]>(() => items.map(() => ''));
  const [solved, setSolved] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    const saved = session.saved?.state as { solved?: boolean[]; inputs?: string[] } | null;
    if (saved?.solved && session.resetKey === 0) {
      setSolved(saved.solved);
      setInputs(saved.inputs ?? items.map(() => ''));
    } else {
      setSolved(items.map(() => false));
      setInputs(items.map(() => ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const check = (i: number) => {
    if (solved[i] || session.status === 'completed') return;
    const guess = normalizeForGrid(inputs[i] ?? '');
    const target = normalizeForGrid(answers[i]!);
    const good = guess === target || isValidAnagramAnswer(items[i]!.scrambled, guess);
    if (!good) {
      session.addMistake();
      return;
    }
    const nextSolved = solved.slice();
    nextSolved[i] = true;
    setSolved(nextSolved);
    session.persist({ solved: nextSolved, inputs });
    if (nextSolved.every(Boolean)) session.complete({ solved: nextSolved, inputs });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4">
        <GameToolbar session={session} difficulty={game.difficulty} />
        <p className="text-sm text-muted">Tema: <span className="font-semibold text-text">{game.puzzle.theme}</span></p>
        <ol className="grid gap-3">
          {items.map((item, i) => (
            <li key={i} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  {item.scrambled.split('').map((ch, j) => (
                    <span key={j} className="grid h-8 w-8 place-items-center rounded bg-anagrame/15 font-bold uppercase text-anagrame">
                      {ch}
                    </span>
                  ))}
                </div>
                {item.hint && <span className="text-xs text-muted">💡 {item.hint}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                {solved[i] ? (
                  <span className="btn bg-labirint/15 font-semibold text-labirint">✓ {answers[i]}</span>
                ) : (
                  <>
                    <input
                      value={inputs[i]}
                      onChange={(e) => setInputs((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
                      onKeyDown={(e) => e.key === 'Enter' && check(i)}
                      maxLength={item.length + 2}
                      className="w-40 rounded-lg border border-border bg-surface px-3 py-2 uppercase outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      aria-label={`Răspuns pentru anagrama ${i + 1}`}
                      placeholder={`${item.length} litere`}
                    />
                    <button type="button" className="btn-brand" onClick={() => check(i)}>
                      Verifică
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <aside className="grid content-start gap-4">
        <HintPanel hints={game.hints} session={session} />
        <CompletionCard session={session} gameLabel="Anagrame" gameType="anagrame" date={date} difficulty={game.difficulty} />
      </aside>
    </div>
  );
}
