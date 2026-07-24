import path from 'node:path';

/**
 * Canonical on-disk locations. Everything is relative to the repo root
 * (process.cwd() during build, generation and tests).
 */
export const REPO_ROOT = process.cwd();

export const CONTENT_ROOT = path.join(REPO_ROOT, 'content');
export const DAILY_DIR = path.join(CONTENT_ROOT, 'daily');
export const INDEX_DIR = path.join(CONTENT_ROOT, 'index');
export const DICTIONARY_DIR = path.join(CONTENT_ROOT, 'dictionaries');

export const ARCHIVE_INDEX_FILE = path.join(INDEX_DIR, 'archive-index.json');
export const DEDUP_INDEX_FILE = path.join(INDEX_DIR, 'dedup-index.json');

export function dailyFile(date: string): string {
  return path.join(DAILY_DIR, `${date}.json`);
}
