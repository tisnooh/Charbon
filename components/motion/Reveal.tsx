'use client';

import type { ReactNode } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { cn } from '@/lib/utils/cn';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Délai d'apparition en ms (stagger). */
  delay?: number;
  threshold?: number;
}

/** Apparition douce au scroll. Neutralisée par prefers-reduced-motion (CSS). */
export function Reveal({ children, className, delay = 0, threshold = 0.15 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold });

  return (
    <div
      ref={ref}
      className={cn('reveal', inView && 'reveal-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
