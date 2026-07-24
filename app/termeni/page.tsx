import { ProsePage } from '@/components/pages/ProsePage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Termeni și condiții',
  description: 'Termenii de utilizare a platformei PauzaLogica.ro: joc gratuit, fără cont, cu conținut oferit „ca atare”.',
  path: '/termeni',
});

export default function Page() {
  return (
    <ProsePage
      title="Termeni și condiții"
      crumbs={[{ name: 'Acasă', href: '/' }, { name: 'Termeni și condiții', href: '/termeni' }]}
    >
      <p>Prin utilizarea PauzaLogica.ro accepți termenii de mai jos.</p>
      <h2 className="text-xl font-bold">Utilizare</h2>
      <p>
        PauzaLogica.ro oferă jocuri de logică și cuvinte, gratuit și fără cont, pentru uz personal și necomercial.
        Conținutul este generat automat și este oferit „ca atare”, fără garanții privind absența oricăror erori.
      </p>
      <h2 className="text-xl font-bold">Proprietate intelectuală</h2>
      <p>
        Jocurile, textele și grafica sunt originale și aparțin PauzaLogica.ro. Nu este permisă copierea sau
        redistribuirea automată a conținutului fără acord.
      </p>
      <h2 className="text-xl font-bold">Reclame</h2>
      <p>
        Site-ul afișează reclame pentru a rămâne gratuit. Nu suntem responsabili pentru conținutul reclamelor
        afișate de rețelele partenere.
      </p>
      <h2 className="text-xl font-bold">Limitarea răspunderii</h2>
      <p>
        PauzaLogica.ro nu răspunde pentru eventuale pierderi rezultate din utilizarea site-ului. Ne rezervăm dreptul
        de a modifica sau întrerupe serviciul oricând.
      </p>
      <p className="text-sm text-muted">Ultima actualizare: 2026.</p>
    </ProsePage>
  );
}
