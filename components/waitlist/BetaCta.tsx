'use client';

import type { ReactNode } from 'react';
import { useWaitlist } from '@/components/waitlist/WaitlistContext';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import type { AnalyticsEventName } from '@/types';

interface BetaCtaProps {
  children: ReactNode;
  /** Provenance pour l'analytics et la colonne `source` en base. */
  source?: string;
  /** Événement analytics dédié déclenché au clic. */
  event?: AnalyticsEventName;
  variant?: 'primary' | 'ghost' | 'quiet' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  className?: string;
}

/**
 * CTA bêta unique du site. Ouvre la modal waitlist.
 * Quand l'app sera publiée : remplacer par des liens store (voir README).
 */
export function BetaCta({
  children,
  source = 'website',
  event,
  variant = 'primary',
  size = 'md',
  full,
  className,
}: BetaCtaProps) {
  const { open } = useWaitlist();

  return (
    <Button
      variant={variant}
      size={size}
      full={full}
      className={className}
      onClick={() => {
        if (event) track(event, { source });
        open(source);
      }}
    >
      {children}
    </Button>
  );
}
