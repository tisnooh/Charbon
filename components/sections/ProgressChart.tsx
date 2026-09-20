'use client';

import { useInView } from '@/lib/hooks/useInView';
import { cn } from '@/lib/utils/cn';

interface ProgressChartProps {
  values: number[];
  label: string;
}

/** Graphique 30 jours — bars qui se construisent au scroll. */
export function ProgressChart({ values, label }: ProgressChartProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${label} — graphique illustratif de l'évolution du score`}
      className="flex h-32 items-end gap-[2px] sm:h-40 sm:gap-1"
    >
      {values.map((value, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 origin-bottom rounded-t-[2px] transition-transform duration-700 ease-ember',
            i === values.length - 1 ? 'bg-ember-500' : 'bg-ink-700/80',
          )}
          style={{
            height: `${Math.max(6, Math.min(100, value))}%`,
            transitionDelay: `${i * 26}ms`,
            transform: inView ? 'scaleY(1)' : 'scaleY(0)',
          }}
        />
      ))}
    </div>
  );
}
