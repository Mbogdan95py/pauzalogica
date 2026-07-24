'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameType, Difficulty } from '@/lib/schema/common';
import {
  loadGameProgress,
  saveGameProgress,
  recordCompletion,
  getStreak,
  type GameProgress,
} from './progress';

export interface GameSessionOptions {
  date: string;
  type: GameType;
  difficulty: Difficulty;
}

export interface GameSession {
  timeMs: number;
  paused: boolean;
  status: 'in-progress' | 'completed';
  mistakes: number;
  hintsUsed: number;
  streak: number;
  /** saved state to restore the board from (read once on mount) */
  saved: GameProgress | null;
  resetKey: number;
  togglePause(): void;
  addMistake(n?: number): void;
  useHint(): void;
  persist(state: unknown): void;
  complete(state?: unknown): void;
  reset(): void;
}

/**
 * Shared game session: authoritative timer (drift-free, pauses on tab hide),
 * mistake/hint counters, localStorage persistence and completion → streak.
 * Boards own their puzzle state and report to the session.
 */
export function useGameSession(opts: GameSessionOptions): GameSession {
  const { date, type } = opts;

  const savedRef = useRef<GameProgress | null>(null);
  if (savedRef.current === null && typeof window !== 'undefined') {
    savedRef.current = loadGameProgress(date, type);
  }
  const saved = savedRef.current;

  const [status, setStatus] = useState<'in-progress' | 'completed'>(
    saved?.status === 'completed' ? 'completed' : 'in-progress',
  );
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timeMs, setTimeMs] = useState(saved?.timeMs ?? 0);
  const [mistakes, setMistakes] = useState(saved?.mistakes ?? 0);
  const [hintsUsed, setHintsUsed] = useState(saved?.hintsUsed ?? 0);
  const [streak, setStreak] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const accumulatedRef = useRef(saved?.timeMs ?? 0);
  const runStartRef = useRef<number | null>(null);
  const lastStateRef = useRef<unknown>(saved?.state ?? null);
  const mistakesRef = useRef(mistakes);
  const hintsRef = useRef(hintsUsed);
  mistakesRef.current = mistakes;
  hintsRef.current = hintsUsed;

  useEffect(() => {
    setMounted(true);
    setStreak(getStreak().current);
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const compute = useCallback(
    () => accumulatedRef.current + (runStartRef.current ? Date.now() - runStartRef.current : 0),
    [],
  );

  const running = mounted && !paused && visible && status === 'in-progress';

  useEffect(() => {
    if (!running) return;
    runStartRef.current = Date.now();
    const id = window.setInterval(() => setTimeMs(compute()), 500);
    return () => {
      accumulatedRef.current += Date.now() - (runStartRef.current ?? Date.now());
      runStartRef.current = null;
      window.clearInterval(id);
      setTimeMs(accumulatedRef.current);
    };
  }, [running, compute]);

  const write = useCallback(
    (nextStatus: 'in-progress' | 'completed', state: unknown, ms: number) => {
      saveGameProgress({
        date,
        type,
        status: nextStatus,
        state,
        timeMs: ms,
        mistakes: mistakesRef.current,
        hintsUsed: hintsRef.current,
      });
    },
    [date, type],
  );

  const persist = useCallback(
    (state: unknown) => {
      lastStateRef.current = state;
      if (status === 'completed') return;
      write('in-progress', state, compute());
    },
    [compute, status, write],
  );

  const complete = useCallback(
    (state?: unknown) => {
      if (status === 'completed') return;
      const finalMs = compute();
      accumulatedRef.current = finalMs;
      runStartRef.current = null;
      if (state !== undefined) lastStateRef.current = state;
      setTimeMs(finalMs);
      setStatus('completed');
      write('completed', lastStateRef.current, finalMs);
      const res = recordCompletion(type, finalMs, date);
      setStreak(res.streak.current);
    },
    [compute, date, status, type, write],
  );

  const addMistake = useCallback(
    (n = 1) => {
      setMistakes((m) => {
        const next = m + n;
        mistakesRef.current = next;
        return next;
      });
    },
    [],
  );

  const useHint = useCallback(() => {
    setHintsUsed((h) => {
      const next = h + 1;
      hintsRef.current = next;
      return next;
    });
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    runStartRef.current = null;
    lastStateRef.current = null;
    setTimeMs(0);
    setMistakes(0);
    setHintsUsed(0);
    mistakesRef.current = 0;
    hintsRef.current = 0;
    setPaused(false);
    setStatus('in-progress');
    // Clear the persisted record for a truly fresh start.
    saveGameProgress({ date, type, status: 'not-started', state: null, timeMs: 0, mistakes: 0, hintsUsed: 0 });
    setResetKey((k) => k + 1);
  }, [date, type]);

  return {
    timeMs,
    paused,
    status,
    mistakes,
    hintsUsed,
    streak,
    saved,
    resetKey,
    togglePause,
    addMistake,
    useHint,
    persist,
    complete,
    reset,
  };
}
