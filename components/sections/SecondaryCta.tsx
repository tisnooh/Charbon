'use client';

import type { ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

/** CTA secondaire du hero — ancre + tracking. */
export function SecondaryCta({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      href={href}
      variant="ghost"
      size="lg"
      full
      className={className ?? 'sm:w-auto'}
      onClick={() => track('secondary_cta_clicked', { href })}
    >
      {children}
    </Button>
  );
}
