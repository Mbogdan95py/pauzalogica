import Link from 'next/link';
import { ProsePage } from '@/components/pages/ProsePage';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Despre noi',
  description:
    'Despre Careu.ro: o platformă gratuită de jocuri zilnice de logică și cuvinte în limba română, cu conținut generat și verificat automat. Fără cont, fără abonament.',
  path: '/despre',
});

export default function Page() {
  return (
    <ProsePage
      title="Despre Careu.ro"
      intro="O platformă gratuită cu jocuri zilnice de logică și cuvinte în limba română."
      crumbs={[{ name: 'Acasă', href: '/' }, { name: 'Despre noi', href: '/despre' }]}
    >
      <p>
        Careu.ro publică în fiecare zi un pachet de jocuri: Sudoku, rebus, cuvinte ascunse, nonograme și o
        provocare rapidă, plus un joc suplimentar care se rotește (Kakuro, anagrame, labirint, integrame și
        altele). Intri, joci și te relaxezi — atât de simplu.
      </p>
      <h2 className="text-xl font-bold">Cum funcționează</h2>
      <p>
        Conținutul este generat și validat automat. Grilele de Sudoku, Kakuro, nonograme și labirinturile
        sunt create de algoritmi determiniști și verificate de solvere independente, care confirmă că fiecare
        puzzle are exact o soluție. Vocabularul și definițiile sunt confirmate cu un dicționar local înainte de
        publicare.
      </p>
      <h2 className="text-xl font-bold">Fără cont, fără complicații</h2>
      <p>
        Nu există conturi, autentificare, abonamente sau plăți. Progresul tău (jocuri începute și terminate,
        timp, greșeli, serie zilnică) este păstrat pe acest dispozitiv, în memoria locală a browserului. Pentru
        că nu există conturi, progresul nu se sincronizează între dispozitive.
      </p>
      <h2 className="text-xl font-bold">Gratuit, susținut prin reclame</h2>
      <p>
        Site-ul este gratuit și se susține exclusiv prin reclame, plasate astfel încât să nu deranjeze jocul.
        Poți alege ce cookie-uri accepți din bannerul de consimțământ.
      </p>
      <p>
        Ai o idee sau ai găsit o problemă? Scrie-ne pe pagina de{' '}
        <Link href="/contact" className="font-semibold text-brand-ink underline">
          contact
        </Link>{' '}
        sau trimite-ne o{' '}
        <Link href="/sugestii" className="font-semibold text-brand-ink underline">
          sugestie
        </Link>
        .
      </p>
    </ProsePage>
  );
}
