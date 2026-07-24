import { ProsePage } from '@/components/pages/ProsePage';
import { ContactForm } from '@/components/ContactForm';
import { buildMetadata } from '@/lib/ui/seo';

export const metadata = buildMetadata({
  title: 'Contact',
  description: 'Contactează echipa PauzaLogica.ro. Trimite-ne un mesaj despre jocuri, probleme tehnice sau colaborări.',
  path: '/contact',
});

export default function Page() {
  return (
    <ProsePage
      title="Contact"
      intro="Ai o întrebare sau ai întâmpinat o problemă? Scrie-ne."
      crumbs={[{ name: 'Acasă', href: '/' }, { name: 'Contact', href: '/contact' }]}
    >
      <p>
        Ne poți scrie direct la{' '}
        <a href="mailto:contact@pauzalogica.ro" className="font-semibold text-brand-ink underline">
          contact@pauzalogica.ro
        </a>{' '}
        sau folosind formularul de mai jos.
      </p>
      <ContactForm kind="contact" />
    </ProsePage>
  );
}
