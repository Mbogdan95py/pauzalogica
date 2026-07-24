import fs from 'node:fs';
import path from 'node:path';
import { INDEX_DIR } from './paths';
import { listDates, readPackage } from './content';
import { todayInTz, compareDate, daysBetween } from '@/lib/date';
import { contentConfig } from '@/lib/config';

/**
 * Non-confidential technical status, surfaced on /status-content. Contains only
 * aggregate numbers — never prompts, keys or raw AI output.
 */
export interface ContentStatus {
  generatedAt: string;
  today: string;
  totalPackages: number;
  bufferDays: number;
  nextAvailableDate: string | null;
  latestDate: string | null;
  validatedGames: number;
  fallbackDays: number;
  lastRunAt: string | null;
  lastRunOk: boolean | null;
}

const STATUS_FILE = path.join(INDEX_DIR, 'status.json');

interface RunInfo {
  lastRunAt: string;
  lastRunOk: boolean;
}

export function computeStatus(): ContentStatus {
  const today = todayInTz(contentConfig.timezone);
  const dates = listDates();
  let validatedGames = 0;
  let fallbackDays = 0;
  let bufferDays = 0;
  for (const d of dates) {
    try {
      const pkg = readPackage(d);
      if (!pkg) continue;
      validatedGames += pkg.games.length;
      if (pkg.fallbacks.used) fallbackDays++;
      if (compareDate(d, today) >= 0) bufferDays = Math.max(bufferDays, daysBetween(today, d));
    } catch {
      // corrupt file: ignored here; validate-all reports it
    }
  }
  const future = dates.filter((d) => compareDate(d, today) > 0);
  const prevRun = readRunInfo();
  return {
    generatedAt: new Date().toISOString(),
    today,
    totalPackages: dates.length,
    bufferDays,
    nextAvailableDate: future.length ? future[0]! : null,
    latestDate: dates.length ? dates[dates.length - 1]! : null,
    validatedGames,
    fallbackDays,
    lastRunAt: prevRun?.lastRunAt ?? null,
    lastRunOk: prevRun?.lastRunOk ?? null,
  };
}

function readRunInfo(): RunInfo | null {
  try {
    if (!fs.existsSync(STATUS_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) as Partial<ContentStatus>;
    return raw.lastRunAt ? { lastRunAt: raw.lastRunAt, lastRunOk: raw.lastRunOk ?? false } : null;
  } catch {
    return null;
  }
}

/** Persist the latest run info merged into a fresh status snapshot. */
export function writeStatusFile(run: RunInfo): void {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  const status: ContentStatus = { ...computeStatus(), lastRunAt: run.lastRunAt, lastRunOk: run.lastRunOk };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + '\n', 'utf8');
}

export function readStatusFile(): ContentStatus {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) as ContentStatus;
      // Recompute live numbers; keep persisted run info.
      return { ...computeStatus(), lastRunAt: saved.lastRunAt, lastRunOk: saved.lastRunOk };
    }
  } catch {
    // fall through
  }
  return computeStatus();
}
