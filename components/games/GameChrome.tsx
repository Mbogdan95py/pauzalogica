'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GameSession } from '@/lib/client/useGameSession';
import { DIFFICULTY_LABEL, type Difficulty, type GameType } from '@/lib/schema/common';
import { formatDuration } from '@/lib/client/format';
import { buildShareText, shareResult } from '@/lib/client/share';
import { adsConfig } from '@/lib/config';
import { ClockIcon, StarIcon } from '@/components/Icons';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const color: Record<Difficulty, string> = {
    usor: 'text-labirint',
    mediu: 'text-nonograme',
    greu: 'text-careu',
    expert: 'text-rapid',
  };
  return <span className={`text-sm font-semibold ${color[difficulty]}`}>{DIFFICULTY_LABEL[difficulty]}</span>;
}

export function GameToolbar({
  session,
  difficulty,
  children,
}: {
  session: GameSession;
  difficulty: Difficulty;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-lg font-semibold tabular-nums" aria-live="off">
          <ClockIcon className="h-4 w-4 text-muted" />
          {formatDuration(session.timeMs)}
        </span>
        <DifficultyBadge difficulty={difficulty} />
      </div>
      <div className="flex items-center gap-2">
        {children}
        {session.status !== 'completed' && (
          <button type="button" className="btn-ghost" onClick={session.togglePause} aria-pressed={session.paused}>
            {session.paused ? 'Reia' : 'Pauză'}
          </button>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (window.confirm('Resetezi jocul? Progresul acestui joc se pierde.')) session.reset();
          }}
        >
          Resetează
        </button>
      </div>
    </div>
  );
}

export function PausedOverlay({ session }: { session: GameSession }) {
  if (!session.paused || session.status === 'completed') return null;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-surface/80 backdrop-blur-sm">
      <div className="text-center">
        <p className="text-lg font-semibold">Joc în pauză</p>
        <button type="button" className="btn-brand mt-3" onClick={session.togglePause}>
          Reia jocul
        </button>
      </div>
    </div>
  );
}

/** Optional rewarded-ad placeholder shown before granting a hint. */
function RewardedHintPlaceholder({ onReward, onCancel }: { onReward: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-center">
      <p className="text-sm text-muted">Reclamă recompensată (opțional) pentru un indiciu.</p>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Renunță
        </button>
        <button type="button" className="btn-brand" onClick={onReward}>
          Vezi indiciul
        </button>
      </div>
    </div>
  );
}

export function HintPanel({ hints, session }: { hints: string[]; session: GameSession }) {
  const [revealed, setRevealed] = useState(0);
  const [showAd, setShowAd] = useState(false);
  if (hints.length === 0) return null;

  const grantNext = () => {
    setRevealed((r) => Math.min(hints.length, r + 1));
    session.useHint();
    setShowAd(false);
  };

  const requestHint = () => {
    if (adsConfig.enabled) setShowAd(true);
    else grantNext();
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Indicii</h3>
        <span className="text-xs text-muted">
          {revealed}/{hints.length}
        </span>
      </div>
      <ol className="mt-2 space-y-2">
        {hints.slice(0, revealed).map((hint, i) => (
          <li key={i} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
            {hint}
          </li>
        ))}
      </ol>
      {showAd ? (
        <div className="mt-3">
          <RewardedHintPlaceholder onReward={grantNext} onCancel={() => setShowAd(false)} />
        </div>
      ) : (
        revealed < hints.length && (
          <button type="button" className="btn-ghost mt-3 w-full" onClick={requestHint} disabled={session.status === 'completed'}>
            {revealed === 0 ? 'Folosește un indiciu' : 'Încă un indiciu'}
          </button>
        )
      )}
    </div>
  );
}

export function CompletionCard({
  session,
  gameLabel,
  gameType,
  date,
  difficulty,
  shareGrid,
  onShowSolution,
  solutionShown,
}: {
  session: GameSession;
  gameLabel: string;
  gameType: GameType;
  date: string;
  difficulty: Difficulty;
  shareGrid?: string;
  onShowSolution?: () => void;
  solutionShown?: boolean;
}) {
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  if (session.status !== 'completed') return null;

  const doShare = async () => {
    const text = buildShareText({
      gameLabel,
      date,
      timeMs: session.timeMs,
      difficulty,
      mistakes: session.mistakes,
      hintsUsed: session.hintsUsed,
      streak: session.streak,
      grid: shareGrid,
    });
    const outcome = await shareResult(text);
    setShareMsg(
      outcome === 'copied'
        ? 'Rezultat copiat în clipboard!'
        : outcome === 'shared'
          ? 'Distribuit!'
          : 'Nu s-a putut distribui.',
    );
  };

  return (
    <div data-game-type={gameType} className="animate-fade-in rounded-2xl border border-brand/40 bg-brand-soft/40 p-5 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand text-white">
        <StarIcon />
      </div>
      <h2 className="mt-3 text-xl font-bold">Felicitări! Ai terminat.</h2>
      <dl className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-left text-muted">Timp</dt>
        <dd className="text-right font-mono font-semibold tabular-nums">{formatDuration(session.timeMs)}</dd>
        <dt className="text-left text-muted">Greșeli</dt>
        <dd className="text-right font-semibold">{session.mistakes}</dd>
        <dt className="text-left text-muted">Indicii</dt>
        <dd className="text-right font-semibold">{session.hintsUsed}</dd>
        <dt className="text-left text-muted">Serie locală</dt>
        <dd className="text-right font-semibold">
          {session.streak} {session.streak === 1 ? 'zi' : 'zile'}
        </dd>
      </dl>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn-brand" onClick={doShare}>
          Distribuie rezultatul
        </button>
        {onShowSolution && !solutionShown && (
          <button type="button" className="btn-ghost" onClick={onShowSolution}>
            Arată soluția
          </button>
        )}
        <Link href={`/arhiva/${date}`} className="btn-ghost">
          Vezi toate jocurile zilei
        </Link>
      </div>
      {shareMsg && <p className="mt-3 text-sm text-muted" role="status">{shareMsg}</p>}
      <p className="mt-4 text-xs text-muted">
        Progresul este păstrat pe acest dispozitiv. Nu se sincronizează între dispozitive, pentru că nu există conturi.
      </p>
    </div>
  );
}
