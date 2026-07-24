import type { LogicSequenceGame } from '@/lib/schema/games';
import { Checker, type ValidatorResult } from './types';

export function validateLogicSequence(game: LogicSequenceGame): ValidatorResult {
  const c = new Checker();
  const { sequence, options } = game.puzzle;
  const { answer } = game.solution;

  c.assert(sequence.length >= 5, 'Secvența este prea scurtă.');
  c.assert(sequence.filter((v) => v === null).length === 1, 'Secvența trebuie să aibă exact o necunoscută.');
  c.assert(options.includes(answer), 'Răspunsul nu apare printre opțiuni.');
  c.assert(new Set(options).size === options.length, 'Opțiuni duplicate.');
  c.assert(options.length >= 3, 'Prea puține opțiuni.');
  c.assert(game.solution.rule.length > 0, 'Regula lipsește.');

  return c.result();
}
