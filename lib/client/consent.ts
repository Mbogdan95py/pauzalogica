'use client';

/**
 * Minimal consent state for advertising/analytics. Default is NO consent, so no
 * ad network loads until the visitor explicitly agrees. Stored per-device.
 */
const CONSENT_KEY = 'careu:v1:consent';
const EVENT = 'careu:consent-changed';

export type ConsentValue = 'granted' | 'denied' | null;

export function getConsent(): ConsentValue {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function hasAdConsent(): boolean {
  return getConsent() === 'granted';
}

export function setConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
    window.dispatchEvent(new CustomEvent(EVENT, { detail: granted }));
  } catch {
    /* ignore */
  }
}

export function onConsentChange(cb: (granted: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail === true);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
