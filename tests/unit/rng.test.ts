import { describe, it, expect } from 'vitest';
import { createRng, makeSeed } from '@/lib/rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('seed-1');
    const b = createRng('seed-1');
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('differs for different seeds', () => {
    const a = Array.from({ length: 20 }, () => createRng('seed-1').next());
    const b = Array.from({ length: 20 }, () => createRng('seed-2').next());
    expect(a).not.toEqual(b);
  });

  it('int stays within inclusive bounds', () => {
    const rng = createRng('bounds');
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('shuffle is a permutation and deterministic', () => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = createRng('x').shuffled(base);
    const s2 = createRng('x').shuffled(base);
    expect(s1).toEqual(s2);
    expect([...s1].sort((a, b) => a - b)).toEqual(base);
  });

  it('derive produces independent but reproducible child streams', () => {
    const parent = createRng('p');
    const c1 = parent.derive('a');
    const c2 = createRng('p').derive('a');
    expect(c1.next()).toBeCloseTo(c2.next());
  });

  it('makeSeed joins parts stably', () => {
    expect(makeSeed('careu', '2026-08-15', 'sudoku')).toBe('careu:2026-08-15:sudoku');
  });
});
