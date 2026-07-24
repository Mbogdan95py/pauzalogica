import { SettingsPanel } from '@/components/SettingsPanel';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Setări',
  description: 'Setări PauzaLogica.ro: temă, accesibilitate, gestionarea progresului local și a statisticilor.',
  path: '/setari',
  noindex: true,
});

export default function Page() {
  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Setări', href: '/setari' }]} />
      <h1 className="mt-4 text-3xl font-bold">Setări</h1>
      <p className="mt-2 text-muted">Personalizează aspectul, accesibilitatea și gestionează datele locale.</p>
      <div className="mt-6">
        <SettingsPanel />
      </div>
    </div>
  );
}
