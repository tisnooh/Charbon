'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';
import type { AnalyticsEventName, AnalyticsProperties } from '@/types';

interface TrackOnViewProps {
  event: AnalyticsEventName;
  properties?: AnalyticsProperties;
  children: ReactNode;
  className?: string;
}

/** Déclenche un événement analytics une fois quand la section entre dans le viewport. */
export function TrackOnView({ event, properties, children, className }: TrackOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            track(event, properties);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
