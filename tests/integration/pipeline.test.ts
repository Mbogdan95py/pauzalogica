import { describe, it, expect } from 'vitest';
import { MockAiProvider } from '@/lib/ai/mock';
import { generateWithRetry } from '@/lib/ai/orchestrator';
import { AiUnavailableError } from '@/lib/ai/provider';
import { buildDailyPackage, localEditorial, type EditorialSource } from '@/lib/content/build-daily';
import { validatePackage } from '@/validators/package';
import { dailyPackageSchema } from '@/lib/schema/pack';
import { writePackageAtomic, readPackage, deletePackage } from '@/lib/storage/content';
import { emptyDedupIndex, record } from '@/lib/storage/dedup';
import { fingerprintGame } from '@/lib/content/fingerprint';

const noSleep = () => Promise.resolve();

async function editorialFromMock(date: string, seed: string): Promise<EditorialSource> {
  const res = await new MockAiProvider().generateEditorial(date, seed);
  return { payload: res.payload, model: res.model, aiSource: 'none' };
}

describe('daily package build + validate', () => {
  it('builds a complete package that passes all validation stages', async () => {
    const date = '2026-09-01';
    const seed = 'itest:2026-09-01:v1';
    const editorial = await editorialFromMock(date, seed);
    const pkg = buildDailyPackage({ date, seed, editorial });
    expect(pkg.games.length).toBeGreaterThanOrEqual(6);
    const outcome = validatePackage(pkg);
    const failed = outcome.checks.filter((c) => !c.passed);
    expect(failed, JSON.stringify(failed)).toEqual([]);
    expect(outcome.passed).toBe(true);
  });

  it('round-trips through JSON + Zod schema', async () => {
    const date = '2026-09-02';
    const seed = 'itest:2026-09-02:v1';
    const pkg = buildDailyPackage({ date, seed, editorial: await editorialFromMock(date, seed) });
    const roundtrip = JSON.parse(JSON.stringify(pkg));
    expect(dailyPackageSchema.safeParse(roundtrip).success).toBe(true);
  });

  it('rejects a tampered Sudoku (independent solver catches it)', async () => {
    const date = '2026-09-03';
    const seed = 'itest:2026-09-03:v1';
    const pkg = buildDailyPackage({ date, seed, editorial: await editorialFromMock(date, seed) });
    const sudoku = pkg.games.find((g) => g.type === 'sudoku');
    expect(sudoku).toBeDefined();
    if (sudoku && sudoku.type === 'sudoku') {
      // Corrupt one solution cell → uniqueness / consistency must fail.
      sudoku.solution.grid[0]![0] = sudoku.solution.grid[0]![1];
    }
    const outcome = validatePackage(pkg);
    expect(outcome.passed).toBe(false);
  });

  it('detects a dedup conflict against the archive index', async () => {
    const date = '2026-09-05';
    const seed = 'itest:2026-09-05:v1';
    const pkg = buildDailyPackage({ date, seed, editorial: await editorialFromMock(date, seed) });
    const idx = emptyDedupIndex();
    // Pretend the first game's grid was used yesterday.
    const fp = fingerprintGame(pkg.games[0]!);
    if (fp.grids[0]) record(idx, 'grid', fp.grids[0], '2026-09-04');
    const outcome = validatePackage(pkg, { dedupIndex: idx });
    const dedup = outcome.checks.find((c) => c.stage === '13-arhiva-dedup');
    expect(dedup?.passed).toBe(false);
  });
});

describe('AI retry + fallback orchestration', () => {
  it('retries the primary and succeeds on a later attempt', async () => {
    const primary = new MockAiProvider({ failTimes: 2 });
    const result = await generateWithRetry(primary, null, '2026-09-06', 'seed', {
      primaryAttempts: 3,
      fallbackAttempts: 0,
      baseDelayMs: 0,
      sleep: noSleep,
    });
    expect(result.attempts).toBe(3);
    expect(result.payload.crosswordWords.length).toBeGreaterThan(0);
  });

  it('falls back to the secondary model when the primary exhausts retries', async () => {
    const primary = new MockAiProvider({ failTimes: 99 });
    const fallback = new MockAiProvider();
    const result = await generateWithRetry(primary, fallback, '2026-09-07', 'seed', {
      primaryAttempts: 3,
      fallbackAttempts: 2,
      baseDelayMs: 0,
      sleep: noSleep,
    });
    expect(result.payload).toBeDefined();
  });

  it('throws AiUnavailableError when everything fails, enabling local fallback', async () => {
    const primary = new MockAiProvider({ failTimes: 99 });
    const fallback = new MockAiProvider({ failTimes: 99 });
    await expect(
      generateWithRetry(primary, fallback, '2026-09-08', 'seed', {
        primaryAttempts: 2,
        fallbackAttempts: 2,
        baseDelayMs: 0,
        sleep: noSleep,
      }),
    ).rejects.toBeInstanceOf(AiUnavailableError);

    // Local fallback still yields a valid package.
    const date = '2026-09-08';
    const seed = 'itest:2026-09-08:v1';
    const pkg = buildDailyPackage({ date, seed, editorial: localEditorial(date, seed) });
    expect(pkg.fallbacks.aiSource).toBe('local-theme');
    expect(pkg.fallbacks.used).toBe(true);
    expect(validatePackage(pkg).passed).toBe(true);
  });
});

describe('atomic publish', () => {
  it('writes a validated package and refuses an invalid one', async () => {
    const date = '2099-12-31'; // far-future test date, cleaned up after
    const seed = 'itest:2099-12-31:v1';
    const pkg = buildDailyPackage({ date, seed, editorial: await editorialFromMock(date, seed) });
    pkg.validation = { passed: true, checks: [], validatedAt: new Date().toISOString(), validatorVersion: 1 };
    try {
      writePackageAtomic(pkg);
      const read = readPackage(date);
      expect(read?.date).toBe(date);

      // An invalid package must be refused.
      const broken = { ...pkg, games: [] } as unknown as typeof pkg;
      expect(() => writePackageAtomic(broken)).toThrow();
    } finally {
      deletePackage(date);
    }
  });
});
