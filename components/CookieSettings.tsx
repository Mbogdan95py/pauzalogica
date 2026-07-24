'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent, type ConsentValue } from '@/lib/client/consent';

/** Lets the visitor review and change their advertising-cookie choice. */
export function CookieSettings() {
  const [consent, setConsentState] = useState<ConsentValue>(null);
  useEffect(() => setConsentState(getConsent()), []);

  const choose = (granted: boolean) => {
    setConsent(granted);
    setConsentState(granted ? 'granted' : 'denied');
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm">
        Alegerea ta actuală:{' '}
        <strong>
          {consent === 'granted' ? 'Accept reclamele' : consent === 'denied' ? 'Doar esențiale' : 'Nealese încă'}
        </strong>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn-ghost" onClick={() => choose(false)}>
          Doar esențiale
        </button>
        <button type="button" className="btn-brand" onClick={() => choose(true)}>
          Accept reclamele
        </button>
      </div>
    </div>
  );
}
