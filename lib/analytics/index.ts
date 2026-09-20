'use client';

/**
 * CHARBON — abstraction analytics minimale, sans tracker publicitaire.
 *
 * - Capture les UTM (premier touch, sessionStorage).
 * - Expose track() pour les événements internes.
 * - Délègue à un provider optionnel (window.charbonAnalytics) :
 *   branchez ici Plausible / PostHog / GA plus tard sans toucher aux composants.
 */

import type { AnalyticsEventName, AnalyticsProperties, UtmParams } from '@/types';

const UTM_STORAGE_KEY = 'charbon:utm';

declare global {
  interface Window {
    charbonAnalytics?: Array<{ event: string; properties: AnalyticsProperties }>;
  }
}

let cachedUtm: UtmParams | null = null;

/* ── Consentement cookies ─────────────────────────────────── */
let consent: boolean | null = null;

export function getConsent(): boolean | null {
  if (consent !== null) return consent;
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem('charbon:cookie-consent');
    consent = stored === 'accepted' ? true : stored === 'refused' ? false : null;
  } catch {
    consent = false;
  }
  return consent;
}

export function setConsent(value: boolean): void {
  consent = value;
}

/** À appeler une fois au chargement (AnalyticsProvider). */
export function captureUtm(): UtmParams {
  if (cachedUtm) return cachedUtm;
  const empty: UtmParams = { utm_source: null, utm_medium: null, utm_campaign: null };
  if (typeof window === 'undefined') return empty;
  if (getConsent() !== true) return empty;

  try {
    const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      cachedUtm = JSON.parse(stored) as UtmParams;
      return cachedUtm;
    }
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    }
    cachedUtm = utm;
    return utm;
  } catch {
    cachedUtm = empty;
    return empty;
  }
}

export function getUtm(): UtmParams {
  if (cachedUtm) return cachedUtm;
  return captureUtm();
}

/** Envoie un événement analytics. Ne lève jamais d'exception. */
export function track(event: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
  /* Aucune mesure sans consentement explicite. */
  if (typeof window !== 'undefined' && getConsent() !== true) return;
  try {
    const payload: AnalyticsProperties = {
      ...properties,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...getUtm(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.info('[analytics]', event, payload);
    }

    if (typeof window !== 'undefined') {
      window.charbonAnalytics = window.charbonAnalytics ?? [];
      window.charbonAnalytics.push({ event, properties: payload });
      window.dispatchEvent(new CustomEvent('charbon:analytics', { detail: { event, properties: payload } }));
    }
  } catch {
    /* analytics must never break the UI */
  }
}
