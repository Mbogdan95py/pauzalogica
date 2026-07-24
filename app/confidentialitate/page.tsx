import Link from 'next/link';
import { ProsePage } from '@/components/pages/ProsePage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Politica de confidențialitate',
  description: 'Cum tratează Careu.ro datele: fără conturi, progres păstrat local pe dispozitiv, reclame doar cu consimțământ.',
  path: '/confidentialitate',
});

export default function Page() {
  return (
    <ProsePage
      title="Politica de confidențialitate"
      crumbs={[{ name: 'Acasă', href: '/' }, { name: 'Confidențialitate', href: '/confidentialitate' }]}
    >
      <p>
        Careu.ro este conceput cu respect pentru confidențialitate. Nu solicităm conturi, nu cerem date
        personale și nu construim profiluri de utilizator.
      </p>
      <h2 className="text-xl font-bold">Datele păstrate pe dispozitiv</h2>
      <p>
        Progresul jocurilor (jocuri începute și terminate, timp, greșeli, indicii folosite, seria zilnică),
        statisticile și preferințele (temă, contrast, animații) sunt salvate exclusiv în memoria locală a
        browserului tău (<code>localStorage</code>). Aceste date nu părăsesc dispozitivul și nu ajung pe
        serverele noastre. Le poți șterge oricând din pagina de{' '}
        <Link href="/setari" className="font-semibold text-brand-ink underline">
          setări
        </Link>{' '}
        sau golind datele site-ului din browser.
      </p>
      <h2 className="text-xl font-bold">Reclame</h2>
      <p>
        Site-ul se susține prin reclame. Rețelele de publicitate se încarcă doar după ce îți dai acordul în
        bannerul de cookie-uri. Dacă alegi „Doar esențiale”, nu se încarcă niciun script de publicitate, iar
        site-ul funcționează normal. Detalii în pagina{' '}
        <Link href="/cookie-uri" className="font-semibold text-brand-ink underline">
          Cookie-uri
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold">Drepturile tale</h2>
      <p>
        Deoarece nu colectăm date personale pe server, nu există un cont de gestionat. Poți controla complet
        informațiile locale direct din browser. Pentru orice întrebare, scrie-ne la{' '}
        <a href="mailto:contact@careu.ro" className="font-semibold text-brand-ink underline">
          contact@careu.ro
        </a>
        .
      </p>
      <p className="text-sm text-muted">Ultima actualizare: 2026.</p>
    </ProsePage>
  );
}
