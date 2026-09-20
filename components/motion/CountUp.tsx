'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  'aria-label'?: string;
}

/** Compteur animé (0 → value) déclenché à l'entrée dans le viewport. */
export function CountUp({ value, duration = 1500, className, ...rest }: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={className} aria-label={rest['aria-label'] ?? String(value)} {...rest}>
      {display}
    </span>
  );
}
