/**
 * Calendar-date helpers. Dates are represented as ISO "YYYY-MM-DD" strings and
 * all arithmetic is done at UTC noon to be immune to DST. Timezone only matters
 * when resolving "today" for the daily buffer (Europe/Bucharest by default).
 */

export const DEFAULT_TZ = 'Europe/Bucharest';

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateStr(date: string): boolean {
  if (!ISO_RE.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

function toUtcNoon(date: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function fromDate(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Current date in the given IANA timezone, as "YYYY-MM-DD". */
export function todayInTz(tz: string = DEFAULT_TZ, now: Date = new Date()): string {
  // en-CA renders as YYYY-MM-DD; timeZone shifts to local calendar date.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now);
}

export function addDays(date: string, days: number): string {
  const dt = toUtcNoon(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromDate(dt);
}

/** -1, 0 or 1 comparing two ISO date strings. */
export function compareDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive integer day-count difference b - a. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcNoon(b).getTime() - toUtcNoon(a).getTime()) / 86400000);
}

/** Inclusive list of ISO dates from `start` to `end`. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  const guard = Math.abs(daysBetween(start, end)) + 1;
  for (let i = 0; i < guard; i++) {
    out.push(cur);
    if (cur === end) break;
    cur = addDays(cur, 1);
  }
  return out;
}

/** 0 = Monday … 6 = Sunday (ISO weekday index). */
export function isoWeekday(date: string): number {
  const jsDay = toUtcNoon(date).getUTCDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

const RO_MONTHS = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

const RO_WEEKDAYS = [
  'luni',
  'marți',
  'miercuri',
  'joi',
  'vineri',
  'sâmbătă',
  'duminică',
];

/** e.g. "15 august 2026". Set `withYear=false` for "15 august". */
export function formatRomanianDate(date: string, withYear = true): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const month = RO_MONTHS[m - 1] ?? '';
  return withYear ? `${d} ${month} ${y}` : `${d} ${month}`;
}

/** e.g. "15 AUGUST" — used in shareable result text. */
export function formatRomanianDateUpper(date: string): string {
  return formatRomanianDate(date, false).toUpperCase();
}

/** e.g. "luni" — Romanian weekday name. */
export function romanianWeekday(date: string): string {
  return RO_WEEKDAYS[isoWeekday(date)] ?? '';
}

export { RO_MONTHS, RO_WEEKDAYS };
