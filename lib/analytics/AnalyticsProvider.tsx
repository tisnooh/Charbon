'use client';

/**
 * Provider analytics : page_view à chaque navigation,
 * capture UTM au premier chargement, profondeur de scroll (50 / 90 %).
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureUtm, getConsent, track } from '@/lib/analytics';

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const fire = () => {
      captureUtm();
      track('page_view', { pathname });
    };
    if (getConsent() === true) fire();
    const onConsent = (e: Event) => {
      if ((e as CustomEvent<{ accepted: boolean }>).detail?.accepted) fire();
    };
    window.addEventListener('charbon:consent', onConsent);
    return () => window.removeEventListener('charbon:consent', onConsent);
  }, [pathname]);

  useEffect(() => {
    const fired = { scroll_50: false, scroll_90: false };
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        const ratio = window.scrollY / max;
        if (!fired.scroll_50 && ratio >= 0.5) {
          fired.scroll_50 = true;
          track('scroll_50');
        }
        if (!fired.scroll_90 && ratio >= 0.9) {
          fired.scroll_90 = true;
          track('scroll_90');
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
