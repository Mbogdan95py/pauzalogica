/**
 * Re-validate every published package with the full pipeline (stages 1–14,
 * minus the dedup stage's cross-day windows by default — pass --with-dedup to
 * include them against the current index). Exits non-zero on any failure.
 *
 * Usage: npx tsx scripts/validate-all-content.ts [--with-dedup] [--quiet]
 */
import { createLogger } from '@/lib/log';
import { listDates, readPackage } from '@/lib/storage/content';
import { validatePackage } from '@/validators/package';
import { loadDedupIndex } from '@/lib/storage/dedup';

const log = createLogger({ component: 'validate-all' });

function main(): void {
  const withDedup = process.argv.includes('--with-dedup');
  const quiet = process.argv.includes('--quiet');
  const dates = listDates();
  if (dates.length === 0) {
    log.warn('no packages found');
    process.exitCode = 1;
    return;
  }

  const dedupIndex = withDedup ? loadDedupIndex() : null;
  let okCount = 0;
  const failures: Array<{ date: string; stages: string[] }> = [];

  for (const date of dates) {
    let pkg;
    try {
      pkg = readPackage(date);
    } catch (err) {
      failures.push({ date, stages: ['corrupt: ' + (err instanceof Error ? err.message : 'necunoscut')] });
      continue;
    }
    if (!pkg) continue;
    const outcome = validatePackage(pkg, { dedupIndex });
    if (outcome.passed) {
      okCount++;
      if (!quiet) log.info('valid', { date, games: pkg.games.length, fallback: pkg.fallbacks.used });
    } else {
      const stages = outcome.checks.filter((c) => !c.passed).map((c) => `${c.stage}${c.detail ? ` (${c.detail})` : ''}`);
      failures.push({ date, stages });
      log.error('invalid package', { date, stages });
    }
  }

  log.info('validation finished', { total: dates.length, ok: okCount, failed: failures.length });
  if (failures.length > 0) process.exitCode = 1;
}

main();
