import fs from 'node:fs';
import path from 'node:path';
import { dailyPackageSchema, type DailyPackage } from '@/lib/schema/pack';
import { DAILY_DIR, dailyFile } from './paths';
import { compareDate, isValidDateStr } from '@/lib/date';

/**
 * Node-only content storage. Used by the generation pipeline (write) and by
 * Next.js server components at build time (read). Never imported by client
 * components — the browser gets already-rendered pages / bundled JSON.
 */

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/** All available dates (files present in content/daily), ascending. */
export function listDates(): string[] {
  if (!fs.existsSync(DAILY_DIR)) return [];
  return fs
    .readdirSync(DAILY_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .filter(isValidDateStr)
    .sort(compareDate);
}

export function hasPackage(date: string): boolean {
  return fs.existsSync(dailyFile(date));
}

/** Read + validate a package. Returns null if missing. Throws if corrupt. */
export function readPackage(date: string): DailyPackage | null {
  const file = dailyFile(date);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const parsed = dailyPackageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Corrupt package ${date}: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Read raw JSON without schema validation (for repair/inspection tooling). */
export function readPackageRaw(date: string): unknown | null {
  const file = dailyFile(date);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Atomically publish a validated package: the JSON is written to a temp file in
 * the same directory then renamed over the target, so readers never observe a
 * half-written file. A package is only ever written after validation passes.
 */
export function writePackageAtomic(pkg: DailyPackage): void {
  const parsed = dailyPackageSchema.safeParse(pkg);
  if (!parsed.success) {
    throw new Error(`Refusing to write invalid package ${pkg.date}: ${parsed.error.message}`);
  }
  ensureDir(DAILY_DIR);
  const target = dailyFile(pkg.date);
  const tmp = path.join(DAILY_DIR, `.${pkg.date}.${process.pid}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, target);
}

export function deletePackage(date: string): void {
  const file = dailyFile(date);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function latestDate(): string | null {
  const dates = listDates();
  return dates.length ? dates[dates.length - 1]! : null;
}

/**
 * Resolve which package to show for a target date: prefer an exact match,
 * otherwise the newest package on or before the target, otherwise the newest
 * available at all. Keeps the site useful even if a day is missing.
 */
export function resolveDateOnOrBefore(target: string): string | null {
  const dates = listDates();
  if (dates.length === 0) return null;
  let best: string | null = null;
  for (const d of dates) {
    if (compareDate(d, target) <= 0) best = d;
  }
  return best ?? dates[dates.length - 1]!;
}

export function countPackages(): number {
  return listDates().length;
}
