import Link from 'next/link';
import { FOOTER_NAV } from '@/lib/ui/nav';
import { Logo } from './Icons';
import { FooterThemeToggle } from './ThemeToggle';

export function Footer() {
  // Current year at build time; the site rebuilds daily so it stays current.
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
              <Logo className="h-7 w-7" />
              Careu<span className="text-brand">.ro</span>
            </Link>
            <p className="mt-3 text-sm text-muted">
              Jocuri zilnice de logică și cuvinte în limba română. Joacă gratuit, fără cont.
            </p>
          </div>
          <nav aria-label="Legături footer" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            {FOOTER_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm link-muted">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col-reverse items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">© {year} Careu.ro — Toate drepturile rezervate.</p>
          <FooterThemeToggle />
        </div>
      </div>
    </footer>
  );
}
