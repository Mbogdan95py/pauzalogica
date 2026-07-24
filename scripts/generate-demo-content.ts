/**
 * Demo-content generator for development: builds packages for the last 30 days
 * AND the next 14 days using the mock AI provider (zero network calls).
 *
 * Usage: npx tsx scripts/generate-demo-content.ts [--past=30] [--future=14] [--force]
 */
import { spawnSync } from 'node:child_process';
import { todayInTz, addDays } from '@/lib/date';
import { contentConfig } from '@/lib/config';

function arg(name: string, fallback: number): number {
  const raw = process.argv.find((a) => a.startsWith(`--${name}=`));
  const n = raw ? Number(raw.split('=')[1]) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

const past = arg('past', 30);
const future = arg('future', contentConfig.lookaheadDays);
const force = process.argv.includes('--force');
const today = todayInTz(contentConfig.timezone);
const from = addDays(today, -past);
const to = addDays(today, future);

const cliArgs = [
  'tsx',
  'scripts/generate-daily-content.ts',
  `--from=${from}`,
  `--to=${to}`,
  ...(force ? ['--force'] : []),
];

process.stdout.write(`Generare demo: ${from} → ${to} (mock AI)\n`);
const res = spawnSync('npx', cliArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, CONTENT_AI_MODE: 'mock' },
});
process.exitCode = res.status ?? 1;
