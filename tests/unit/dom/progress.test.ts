import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveGameProgress,
  loadGameProgress,
  recordCompletion,
  getStreak,
  getStats,
  clearAllProgress,
  resetStats,
  listInProgress,
  PROGRESS_VERSION,
} from '@/lib/client/progress';

beforeEach(() => {
  window.localStorage.clear();
});

describe('progress persistence', () => {
  it('saves and restores game progress', () => {
    saveGameProgress({ date: '2026-08-15', type: 'sudoku', status: 'in-progress', state: { a: 1 }, timeMs: 5000, mistakes: 2, hintsUsed: 1 });
    const loaded = loadGameProgress('2026-08-15', 'sudoku');
    expect(loaded?.status).toBe('in-progress');
    expect(loaded?.timeMs).toBe(5000);
    expect(loaded?.state).toEqual({ a: 1 });
  });

  it('discards progress from an incompatible schema version (migration)', () => {
    const key = 'careu:v1:progress:2026-08-15:sudoku';
    window.localStorage.setItem(key, JSON.stringify({ version: 999, date: '2026-08-15', type: 'sudoku', status: 'in-progress', state: {}, timeMs: 1, mistakes: 0, hintsUsed: 0, updatedAt: 0, completedAt: null }));
    expect(loadGameProgress('2026-08-15', 'sudoku')).toBeNull();
  });

  it('lists only in-progress games', () => {
    saveGameProgress({ date: '2026-08-15', type: 'sudoku', status: 'in-progress', state: {}, timeMs: 1, mistakes: 0, hintsUsed: 0 });
    saveGameProgress({ date: '2026-08-15', type: 'nonograma', status: 'completed', state: {}, timeMs: 1, mistakes: 0, hintsUsed: 0 });
    const list = listInProgress();
    expect(list).toHaveLength(1);
    expect(list[0]!.type).toBe('sudoku');
  });

  it('clearAllProgress removes progress but keeps stats key format', () => {
    saveGameProgress({ date: '2026-08-15', type: 'sudoku', status: 'in-progress', state: {}, timeMs: 1, mistakes: 0, hintsUsed: 0 });
    clearAllProgress();
    expect(loadGameProgress('2026-08-15', 'sudoku')).toBeNull();
  });
});

describe('stats + streak', () => {
  it('increments games completed and streak on consecutive days', () => {
    recordCompletion('sudoku', 60000, '2026-08-15');
    let streak = getStreak();
    expect(streak.current).toBe(1);
    recordCompletion('nonograma', 30000, '2026-08-16');
    streak = getStreak();
    expect(streak.current).toBe(2);
    expect(getStats().gamesCompleted).toBe(2);
  });

  it('resets streak after a gap', () => {
    recordCompletion('sudoku', 1000, '2026-08-15');
    recordCompletion('sudoku', 1000, '2026-08-20'); // gap
    expect(getStreak().current).toBe(1);
  });

  it('resetStats clears counters', () => {
    recordCompletion('sudoku', 1000, '2026-08-15');
    resetStats();
    expect(getStats().gamesCompleted).toBe(0);
    expect(getStreak().current).toBe(0);
  });

  it('uses the current schema version', () => {
    expect(getStats().version).toBe(PROGRESS_VERSION);
  });
});
