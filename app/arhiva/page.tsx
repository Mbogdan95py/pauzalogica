import { buildArchiveIndex } from '@/lib/storage/archive';
import { buildMetadata } from '@/lib/ui/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ArchiveBrowser } from '@/components/archive/ArchiveBrowser';
import { AdLeaderboard } from '@/components/ads/Ads';

export const metadata = buildMetadata({
  title: 'Arhivă',
  description:
    'Arhiva completă a jocurilor PauzaLogica.ro. Filtrează după joc, dificultate sau lună și joacă provocările din zilele trecute.',
  path: '/arhiva',
});

export default function Page() {
  const entries = buildArchiveIndex();
  return (
    <div className="container-page py-6">
      <AdLeaderboard className="mb-6 hidden sm:block" />
      <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Arhivă', href: '/arhiva' }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Arhivă</h1>
      <p className="mt-1 text-muted">Toate provocările de până acum. Filtrează și reia orice zi.</p>
      <div className="mt-6">
        <ArchiveBrowser entries={entries} />
      </div>
    </div>
  );
}
