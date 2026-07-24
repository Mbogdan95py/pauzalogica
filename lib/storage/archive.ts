import fs from 'node:fs';
import { ARCHIVE_INDEX_FILE, INDEX_DIR } from './paths';
import { listDates, readPackage } from './content';
import type { DailyPackage, PackageIndexEntry } from '@/lib/schema/pack';

/** Summarize a full package into a lightweight archive entry. */
export function toIndexEntry(pkg: DailyPackage): PackageIndexEntry {
  return {
    date: pkg.date,
    title: pkg.title,
    theme: pkg.theme,
    contentHash: pkg.contentHash,
    fallbackUsed: pkg.fallbacks.used,
    games: pkg.games.map((g) => ({ id: g.id, type: g.type, difficulty: g.difficulty })),
  };
}

/** Build the archive index from every package on disk (ascending by date). */
export function buildArchiveIndex(): PackageIndexEntry[] {
  const entries: PackageIndexEntry[] = [];
  for (const date of listDates()) {
    const pkg = readPackage(date);
    if (pkg) entries.push(toIndexEntry(pkg));
  }
  return entries;
}

export function writeArchiveIndex(entries: PackageIndexEntry[]): void {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  fs.writeFileSync(ARCHIVE_INDEX_FILE, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

export function readArchiveIndex(): PackageIndexEntry[] {
  if (!fs.existsSync(ARCHIVE_INDEX_FILE)) return buildArchiveIndex();
  try {
    return JSON.parse(fs.readFileSync(ARCHIVE_INDEX_FILE, 'utf8')) as PackageIndexEntry[];
  } catch {
    return buildArchiveIndex();
  }
}
