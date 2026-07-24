/**
 * Daily content generator — the automation entry point.
 *
 * Usage:
 *   npx tsx scripts/generate-daily-content.ts                # generate today+LOOKAHEAD (default 14)
 *   npx tsx scripts/generate-daily-content.ts --date=2026-08-15
 *   npx tsx scripts/generate-daily-content.ts --from=2026-08-01 --to=2026-08-05
 *   npx tsx scripts/generate-daily-content.ts --fill-buffer  # ensure every day up to today+LOOKAHEAD exists
 *   --force        regenerate even if a valid package exists
 *
 * Behaviour (per spec):
 *  - runs are idempotent: an existing *valid* package is never recreated;
 *  - content is validated by the 14-stage pipeline before write; publish is atomic;
 *  - AI failures fall back: primary → fallback model → local themes (marked in metadata);
 *  - the dedup index prevents repeats across the configured windows;
 *  - structured logs only; secrets are never printed.
 */
import { todayInTz, addDays, isValidDateStr, dateRange } from '@/lib/date';
import { makeSeed } from '@/lib/rng';
import { createLogger } from '@/lib/log';
import { aiConfig, contentConfig } from '@/lib/config';
import { generateEditorial, AiUnavailableError } from '@/lib/ai';
import { buildDailyPackage, localEditorial, type EditorialSource } from '@/lib/content/build-daily';
import { validatePackage, VALIDATOR_VERSION } from '@/validators/package';
import { fingerprintGame } from '@/lib/content/fingerprint';
import {
  hasPackage,
  readPackage,
  writePackageAtomic,
} from '@/lib/storage/content';
import {
  loadDedupIndex,
  saveDedupIndex,
  record,
  forgetDate,
  prune,
} from '@/lib/storage/dedup';
import { buildArchiveIndex, writeArchiveIndex } from '@/lib/storage/archive';
import { writeStatusFile } from '@/lib/storage/status';

const log = createLogger({ component: 'generate-daily' });

interface CliArgs {
  date?: string;
  from?: string;
  to?: string;
  force: boolean;
  fillBuffer: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { force: false, fillBuffer: false };
  for (const raw of argv) {
    if (raw === '--force') args.force = true;
    else if (raw === '--fill-buffer') args.fillBuffer = true;
    else if (raw.startsWith('--date=')) args.date = raw.slice(7);
    else if (raw.startsWith('--from=')) args.from = raw.slice(7);
    else if (raw.startsWith('--to=')) args.to = raw.slice(5);
  }
  return args;
}

function resolveTargets(args: CliArgs): string[] {
  const today = todayInTz(contentConfig.timezone);
  if (args.date) {
    if (!isValidDateStr(args.date)) throw new Error(`invalid --date: ${args.date}`);
    return [args.date];
  }
  if (args.from || args.to) {
    const from = args.from ?? today;
    const to = args.to ?? args.from ?? today;
    if (!isValidDateStr(from) || !isValidDateStr(to)) throw new Error('invalid --from/--to');
    return dateRange(from, to);
  }
  if (args.fillBuffer) {
    return dateRange(today, addDays(today, contentConfig.lookaheadDays));
  }
  // Default daily-cron behaviour: generate exactly today + lookahead.
  return [addDays(today, contentConfig.lookaheadDays)];
}

async function editorialFor(date: string, seed: string): Promise<EditorialSource> {
  try {
    const result = await generateEditorial(date, seed);
    log.info('editorial ready', {
      date,
      model: result.model,
      source: result.source,
      attempts: result.attempts,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostUsd: Number(result.estimatedCostUsd.toFixed(5)),
    });
    return {
      payload: result.payload,
      model: result.model,
      aiSource: result.source === 'mock' ? 'none' : result.source,
    };
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      log.warn('AI unavailable — switching to local themes', { date, reason: err.message });
      return localEditorial(date, seed);
    }
    throw err;
  }
}

async function generateOne(date: string, force: boolean): Promise<'created' | 'skipped' | 'failed'> {
  const started = Date.now();
  log.info('generation start', { date, mode: aiConfig.mode, lookahead: contentConfig.lookaheadDays });

  // Idempotency: a valid existing package is never recreated.
  if (!force && hasPackage(date)) {
    try {
      const existing = readPackage(date);
      if (existing && existing.validation.passed) {
        log.info('package exists and is valid — skipping', { date, hash: existing.contentHash.slice(0, 12) });
        return 'skipped';
      }
      log.warn('package exists but is not valid — regenerating', { date });
    } catch {
      log.warn('package exists but is corrupt — regenerating', { date });
    }
  }

  const dedupIndex = loadDedupIndex();
  // When regenerating a date, its own past fingerprints must not block it.
  forgetDate(dedupIndex, date);

  // Up to 6 seed variants: dedup conflicts (grids/answers/themes used recently)
  // are resolved by re-rolling the deterministic seed salt.
  const MAX_VARIANTS = 6;
  for (let variant = 1; variant <= MAX_VARIANTS; variant++) {
    const seed = makeSeed('careu', date, `v${variant}`);
    const editorial = await editorialFor(date, seed);
    const pkg = buildDailyPackage({ date, seed, editorial });

    // Correctness stages (structure, solvers, uniqueness, banned words) always
    // apply. The dedup stage is a *soft* variety check: after exhausting the
    // re-roll budget we publish anyway so a day is never left empty, noting it.
    const lastResort = variant === MAX_VARIANTS;
    if (lastResort) {
      const dedupCheck = validatePackage(pkg, { dedupIndex });
      if (!dedupCheck.passed && dedupCheck.checks.some((c) => !c.passed && c.stage === '13-arhiva-dedup')) {
        pkg.fallbacks.used = true;
        pkg.fallbacks.notes.push('Verificarea anti-repetare a fost relaxată pentru a nu lăsa ziua goală.');
      }
    }
    const outcome = validatePackage(pkg, { dedupIndex: lastResort ? null : dedupIndex });
    const failed = outcome.checks.filter((c) => !c.passed);
    for (const check of outcome.checks) {
      if (!check.passed)
        log.warn('validation stage failed', { date, variant, stage: check.stage, detail: check.detail });
    }

    if (!outcome.passed) {
      const onlyDedup = failed.every((c) => c.stage === '13-arhiva-dedup');
      log.warn('package rejected', {
        date,
        variant,
        stages: failed.map((c) => c.stage),
        retryable: onlyDedup,
      });
      if (onlyDedup && variant < MAX_VARIANTS) continue; // re-roll seed
      if (variant < MAX_VARIANTS) continue;
      log.error('all variants rejected', { date });
      return 'failed';
    }

    // Stage 15: atomic publish (validated content only).
    pkg.validation = {
      passed: true,
      checks: outcome.checks,
      validatedAt: new Date().toISOString(),
      validatorVersion: VALIDATOR_VERSION,
    };
    writePackageAtomic(pkg);

    // Record fingerprints + refresh indexes.
    for (const game of pkg.games) {
      const fp = fingerprintGame(game);
      for (const g of fp.grids) record(dedupIndex, 'grid', g, date);
      for (const s of fp.seeds) record(dedupIndex, 'seed', s, date);
      for (const a of fp.answers) record(dedupIndex, 'answer', a, date);
      for (const d of fp.definitions) record(dedupIndex, 'definition', d, date);
      for (const w of fp.wordsets) record(dedupIndex, 'wordset', w, date);
    }
    record(dedupIndex, 'theme', pkg.theme, date);
    prune(dedupIndex, date);
    saveDedupIndex(dedupIndex);
    writeArchiveIndex(buildArchiveIndex());
    writeStatusFile({ lastRunAt: new Date().toISOString(), lastRunOk: true });

    log.info('package published', {
      date,
      variant,
      games: pkg.games.length,
      theme: pkg.theme,
      fallbackUsed: pkg.fallbacks.used,
      hash: pkg.contentHash.slice(0, 12),
      durationMs: Date.now() - started,
    });
    return 'created';
  }
  return 'failed';
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const targets = resolveTargets(args);
  log.info('run start', { targets: targets.length, first: targets[0], last: targets[targets.length - 1] });

  let created = 0;
  let skipped = 0;
  let failedDates: string[] = [];
  for (const date of targets) {
    try {
      const res = await generateOne(date, args.force);
      if (res === 'created') created++;
      else if (res === 'skipped') skipped++;
      else failedDates.push(date);
    } catch (err) {
      failedDates.push(date);
      log.error('generation crashed', { date, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  log.info('run finished', { created, skipped, failed: failedDates.length });
  if (failedDates.length > 0) {
    // Existing valid buffer is left untouched; the workflow must fail visibly.
    writeStatusFile({ lastRunAt: new Date().toISOString(), lastRunOk: false });
    log.error('run failed for dates', { dates: failedDates });
    process.exitCode = 1;
  }
}

main().catch((err) => {
  log.error('fatal', { reason: err instanceof Error ? err.message : String(err) });
  process.exitCode = 1;
});
