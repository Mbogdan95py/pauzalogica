import { ProsePage } from '@/components/pages/ProsePage';
import { ContactForm } from '@/components/ContactForm';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Sugestii',
  description: 'Propune un joc nou sau o îmbunătățire pentru Careu.ro. Ideile tale ne ajută să facem platforma mai bună.',
  path: '/sugestii',
});

export default function Page() {
  return (
    <ProsePage
      title="Sugestii"
      intro="Ce joc ți-ar plăcea să vezi? Ce am putea îmbunătăți?"
      crumbs={[{ name: 'Acasă', href: '/' }, { name: 'Sugestii', href: '/sugestii' }]}
    >
      <p>
        Ne bucurăm de orice idee. Poți propune tipuri noi de jocuri, teme, niveluri de dificultate sau
        îmbunătățiri ale interfeței. Trimite-ne gândurile tale prin formularul de mai jos.
      </p>
      <ContactForm kind="suggestion" to="sugestii@careu.ro" />
    </ProsePage>
  );
}
