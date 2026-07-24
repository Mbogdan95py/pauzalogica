import { describe, it, expect } from 'vitest';
import { emptyDedupIndex, record, isConflict, forgetDate, prune } from '@/lib/storage/dedup';

describe('dedup index', () => {
  it('reports a conflict within the window and none outside it', () => {
    const idx = emptyDedupIndex();
    record(idx, 'answer', 'SOARE', '2026-08-01');
    // window for answer default is 7 days
    expect(isConflict(idx, 'answer', 'SOARE', '2026-08-05', 7)).toBe(true);
    expect(isConflict(idx, 'answer', 'SOARE', '2026-08-20', 7)).toBe(false);
  });

  it('ignores the same target date (idempotent regeneration)', () => {
    const idx = emptyDedupIndex();
    record(idx, 'grid', 'hashX', '2026-08-01');
    expect(isConflict(idx, 'grid', 'hashX', '2026-08-01', 365)).toBe(false);
  });

  it('forgetDate removes a specific day', () => {
    const idx = emptyDedupIndex();
    record(idx, 'theme', 'animale', '2026-08-01');
    forgetDate(idx, '2026-08-01');
    expect(isConflict(idx, 'theme', 'animale', '2026-08-02', 30)).toBe(false);
  });

  it('prune drops entries far from the reference date', () => {
    const idx = emptyDedupIndex();
    record(idx, 'seed', 's1', '2020-01-01');
    record(idx, 'seed', 's2', '2026-08-01');
    prune(idx, '2026-08-10', 420);
    expect(idx.entries.seed['s1']).toBeUndefined();
    expect(idx.entries.seed['s2']).toBeDefined();
  });
});
