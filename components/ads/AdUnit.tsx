'use client';

import { useEffect, useRef, useState } from 'react';
import { adsConfig } from '@/lib/config';
import { hasAdConsent, onConsentChange } from '@/lib/client/consent';

type SlotKey = 'leaderboard' | 'rectangle' | 'inContent' | 'mobile';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;

function ensureAdScript() {
  if (scriptRequested || typeof document === 'undefined') return;
  scriptRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsConfig.client)}`;
  document.head.appendChild(s);
}

/**
 * A single real ad unit. Only loads the ad network script after consent is
 * granted AND the publisher is configured. If neither holds, it reserves space
 * so there is no layout shift. Everything degrades gracefully if blocked.
 */
export function AdUnit({ slotKey, width, height }: { slotKey: SlotKey; width: number; height: number }) {
  const ref = useRef<HTMLModElement>(null);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasAdConsent());
    return onConsentChange((granted) => setConsent(granted));
  }, []);

  useEffect(() => {
    if (!consent || !adsConfig.client) return;
    ensureAdScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked or not ready — placeholder space remains reserved */
    }
  }, [consent]);

  const slot = adsConfig.slots[slotKey];
  if (!consent || !adsConfig.client) {
    return (
      <div
        className="mx-auto grid place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-xs text-muted"
        style={{ maxWidth: width, minHeight: height }}
        aria-hidden="true"
      >
        Reclamă
      </div>
    );
  }
  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      style={{ display: 'block', maxWidth: width, minHeight: height }}
      data-ad-client={adsConfig.client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
