'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

/**
 * Parallax extrêmement léger (± amplitude px) pour les mockups.
 * Désactivé si prefers-reduced-motion.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(amplitude = 10) {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return; // pas sur tactile

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const delta = (center - viewport / 2) / viewport; // -0.5 → 0.5
      const offset = Math.max(-1, Math.min(1, delta)) * -amplitude;
      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [amplitude, reduced]);

  return ref;
}
