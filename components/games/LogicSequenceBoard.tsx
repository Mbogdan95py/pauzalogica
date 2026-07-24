'use client';

import { useEffect, useState } from 'react';
import type { LogicSequenceGame } from '@/lib/schema/games';
import { useGameSession } from '@/lib/client/useGameSession';
import { gameDate } from '@/lib/ui/game-date';
import { GameToolbar, HintPanel, CompletionCard } from './GameChrome';

export function LogicSequenceBoard({ game }: { game: LogicSequenceGame }) {
  const date = gameDate(game.id);
  const session = useGameSession({ date, type: 'secvente-logice', difficulty: game.difficulty });
  const { sequence, options, prompt } = game.puzzle;
  const answer = game.solution.answer;

  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);

  useEffect(() => {
    const saved = session.saved?.state as { picked?: number | null } | null;
    if (saved && session.resetKey === 0 && saved.picked != null) setPicked(saved.picked);
    else {
      setPicked(null);
      setWrong([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.resetKey]);

  const choose = (opt: number) => {
    if (session.status === 'completed') return;
    if (opt === answer) {
      setPicked(opt);
      session.complete({ picked: opt });
    } else {
      if (!wrong.includes(opt)) setWrong((w) => [...w, opt]);
      session.addMistake();
      session.persist({ picked: null });
    }
  };

  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <GameToolbar session={session} difficulty={game.difficulty} />
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-muted">{prompt}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {sequence.map((v, i) => (
            <span
              key={i}
              className={`grid h-14 w-14 place-items-center rounded-xl border-2 text-xl font-bold ${
                v === null ? 'border-brand text-brand' : 'border-border bg-surface-2'
              }`}
            >
              {v === null ? (session.status === 'completed' ? answer : '?') : v}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => choose(opt)}
            disabled={session.status === 'completed'}
            className={`btn text-lg font-bold ${
              picked === opt
                ? 'bg-labirint text-white'
                : wrong.includes(opt)
                  ? 'border border-rapid/50 bg-rapid/10 text-rapid'
                  : 'btn-ghost'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <HintPanel hints={game.hints} session={session} />
      <CompletionCard session={session} gameLabel="Secvențe logice" gameType="secvente-logice" date={date} difficulty={game.difficulty} />
      {session.status === 'completed' && (
        <p className="text-center text-sm text-muted">Regula: {game.solution.rule}</p>
      )}
    </div>
  );
}
