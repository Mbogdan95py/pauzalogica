import { formatDuration } from './format';
import { formatRomanianDateUpper } from '@/lib/date';
import { DIFFICULTY_LABEL, type Difficulty } from '@/lib/schema/common';

export interface ShareParams {
  gameLabel: string;
  date: string;
  timeMs: number;
  difficulty: Difficulty;
  mistakes: number;
  hintsUsed: number;
  streak: number;
  /** optional emoji grid (e.g. quick-challenge), added without revealing the answer */
  grid?: string;
}

/**
 * Build the copyable result text. Never includes the solution/answer.
 * Example:
 *   CAREU.RO — 15 AUGUST
 *   Sudoku: 05:42
 *   Dificultate: Mediu
 *   Greșeli: 1
 *   Indiciu folosit: Nu
 *   Serie locală: 8 zile
 */
export function buildShareText(p: ShareParams): string {
  const lines = [
    `CAREU.RO — ${formatRomanianDateUpper(p.date)}`,
    `${p.gameLabel}: ${formatDuration(p.timeMs)}`,
    `Dificultate: ${DIFFICULTY_LABEL[p.difficulty]}`,
    `Greșeli: ${p.mistakes}`,
    `Indiciu folosit: ${p.hintsUsed > 0 ? 'Da' : 'Nu'}`,
    `Serie locală: ${p.streak} ${p.streak === 1 ? 'zi' : 'zile'}`,
  ];
  if (p.grid) lines.push('', p.grid);
  lines.push('', 'https://careu.ro');
  return lines.join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'failed';

/** Share via the Web Share API, falling back to clipboard copy. */
export async function shareResult(text: string, title = 'Careu.ro'): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      // User cancelled the share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed';
      // Otherwise fall through to clipboard.
    }
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    /* fall through */
  }
  return 'failed';
}
