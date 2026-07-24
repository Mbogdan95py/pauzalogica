import { computeStatus } from '@/lib/storage/status';
import { readStatusFile } from '@/lib/storage/status';
import { buildMetadata } from '@/lib/ui/seo';
import { formatRomanianDate } from '@/lib/date';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({
  title: 'Status conținut',
  description: 'Stare tehnică a generării de conținut Careu.ro.',
  path: '/status-content',
  noindex: true,
});

/**
 * Non-promoted technical status page. Shows only non-confidential aggregate
 * numbers — never prompts, API keys or raw AI output.
 */
export default function Page() {
  // Prefer the persisted snapshot (has last-run info) but recompute live counts.
  const status = readStatusFile() ?? computeStatus();

  const rows: Array<[string, string]> = [
    ['Zile pregenerate (total)', String(status.totalPackages)],
    ['Buffer disponibil în avans', `${status.bufferDays} zile`],
    ['Următoarea zi disponibilă', status.nextAvailableDate ? formatRomanianDate(status.nextAvailableDate) : '—'],
    ['Cea mai recentă zi', status.latestDate ? formatRomanianDate(status.latestDate) : '—'],
    ['Jocuri validate (total)', String(status.validatedGames)],
    ['Zile cu conținut de rezervă', String(status.fallbackDays)],
    ['Ultima rulare reușită', status.lastRunAt ? new Date(status.lastRunAt).toLocaleString('ro-RO') : '—'],
    ['Stare ultimă rulare', status.lastRunOk === null ? '—' : status.lastRunOk ? 'OK' : 'Eșuată'],
  ];

  return (
    <div className="container-page max-w-2xl py-8">
      <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Status conținut', href: '/status-content' }]} />
      <h1 className="mt-4 text-2xl font-bold">Status conținut</h1>
      <p className="mt-1 text-sm text-muted">
        Date tehnice neconfidențiale despre generarea automată a jocurilor. Instantaneu la momentul construirii
        site-ului.
      </p>
      <dl className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 bg-surface px-4 py-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status.bufferDays >= 14 ? 'border-labirint/40 bg-labirint/10 text-labirint' : 'border-rapid/40 bg-rapid/10 text-rapid'}`}>
        {status.bufferDays >= 14
          ? 'Bufferul de conținut este sănătos (minim 14 zile).'
          : 'Atenție: bufferul de conținut este sub pragul de 14 zile.'}
      </div>
    </div>
  );
}
