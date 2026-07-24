import { ProsePage } from '@/components/pages/ProsePage';
import { CookieSettings } from '@/components/CookieSettings';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Politica de cookie-uri',
  description: 'Ce cookie-uri folosește PauzaLogica.ro: esențiale pentru funcționare și, cu acordul tău, pentru reclame.',
  path: '/cookie-uri',
});

export default function Page() {
  return (
    <ProsePage
      title="Politica de cookie-uri"
      crumbs={[{ name: 'Acasă', href: '/' }, { name: 'Cookie-uri', href: '/cookie-uri' }]}
    >
      <h2 className="text-xl font-bold">Cookie-uri esențiale</h2>
      <p>
        Folosim stocarea locală a browserului pentru a-ți păstra progresul jocurilor și preferințele. Acestea
        sunt necesare pentru funcționarea site-ului și nu necesită consimțământ.
      </p>
      <h2 className="text-xl font-bold">Cookie-uri de publicitate</h2>
      <p>
        Cu acordul tău, partenerii de publicitate pot folosi cookie-uri pentru a afișa reclame. Aceste
        cookie-uri se încarcă doar dacă apeși „Accept toate” în banner sau activezi opțiunea de mai jos. Poți
        reveni oricând asupra alegerii.
      </p>
      <CookieSettings />
    </ProsePage>
  );
}
