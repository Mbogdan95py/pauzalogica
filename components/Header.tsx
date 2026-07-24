'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV, MORE_NAV } from '@/lib/ui/nav';
import { Logo, ChevronDown, MenuIcon, CloseIcon } from './Icons';
import { ThemeToggle } from './ThemeToggle';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close menus on route change.
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight" aria-label="Careu.ro — Acasă">
          <Logo />
          <span>
            Careu<span className="text-brand">.ro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigație principală">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isActive(pathname, item.href) ? 'text-brand-ink' : 'text-muted hover:text-text'
              }`}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              <span className="relative">
                {item.label}
                {isActive(pathname, item.href) && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-brand" />
                )}
              </span>
            </Link>
          ))}

          <div className="relative" onMouseLeave={() => setMoreOpen(false)}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              onMouseEnter={() => setMoreOpen(true)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-text"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              Altele <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full w-56 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-card-hover" role="menu">
                {MORE_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="block rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-2"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-text md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Închide meniul' : 'Deschide meniul'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border bg-surface md:hidden" aria-label="Meniu mobil">
          <div className="container-page grid gap-1 py-3">
            {[...PRIMARY_NAV, ...MORE_NAV].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive(pathname, item.href) ? 'bg-surface-2 text-brand-ink' : 'text-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
