'use client';

/**
 * Bannière cookies : consentement explicite (accepter / refuser),
 * stocké 6 mois, lié à l'analytics (aucune mesure sans accord).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { copy } from '@/content';
import { setConsent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'charbon:cookie-consent';
const SIX_MONTHS_MS = 6 * 30 * 24 * 3600 * 1000;

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = 'refused';
    }
    if (stored === 'accepted' || stored === 'refused') {
      setConsent(stored === 'accepted');
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const choose = (accepted: boolean) => {
    setConsent(accepted);
    try {
      localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'refused');
      localStorage.setItem(`${STORAGE_KEY}:at`, String(Date.now() + SIX_MONTHS_MS));
    } catch {
      /* stockage indisponible : le choix reste en mémoire */
    }
    window.dispatchEvent(new CustomEvent('charbon:consent', { detail: { accepted } }));
    setVisible(false);
  };

  if (!visible) return null;

  const c = copy.cookie;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="animate-sheet-up fixed bottom-4 left-4 right-4 z-[95] rounded-2xl border border-line-strong bg-coal-900/95 p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md sm:right-auto sm:max-w-sm"
    >
      <p className="text-sm leading-relaxed text-ink-400">{c.text}</p>
      <p className="mt-2 text-sm">
        <Link href="/confidentialite" className="text-ink-300 underline underline-offset-4 transition-colors hover:text-ink-100">
          {c.link}
        </Link>
      </p>
      <div className="mt-4 flex gap-3">
        <Button size="sm" variant="primary" className="flex-1" onClick={() => choose(true)}>
          {c.accept}
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={() => choose(false)}>
          {c.refuse}
        </Button>
      </div>
    </div>
  );
}
