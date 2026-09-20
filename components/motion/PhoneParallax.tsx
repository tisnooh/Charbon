'use client';

import type { ReactNode } from 'react';
import { useParallax } from '@/lib/hooks/useParallax';

/** Parallax extrêmement léger pour les mockups (±8 px). */
export function PhoneParallax({ children, amplitude = 8 }: { children: ReactNode; amplitude?: number }) {
  const ref = useParallax<HTMLDivElement>(amplitude);
  return (
    <div ref={ref} className="will-change-transform">
      {children}
    </div>
  );
}
