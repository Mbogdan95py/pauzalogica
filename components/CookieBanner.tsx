'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsent, setConsent } from '@/lib/client/consent';

/**
 * Cookie/consent banner. Non-essential cookies (ads) stay OFF until the visitor
 * accepts. Declining keeps the site fully functional — content and progress use
 * only local storage, which is essential and needs no consent.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (granted: boolean) => {
    setConsent(granted);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4" role="dialog" aria-label="Preferințe cookie-uri" aria-live="polite">
      <div className="container-page">
        <div className="card flex flex-col gap-3 p-4 shadow-card-hover sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Folosim cookie-uri esențiale pentru funcționarea site-ului. Cu acordul tău, putem folosi și
            cookie-uri pentru reclame.{' '}
            <Link href="/cookie-uri" className="font-semibold text-brand-ink underline">
              Detalii
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-ghost" onClick={() => choose(false)}>
              Doar esențiale
            </button>
            <button type="button" className="btn-brand" onClick={() => choose(true)}>
              Accept toate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
