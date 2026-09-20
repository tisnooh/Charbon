'use client';

import { useId } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { cn } from '@/lib/utils/cn';

interface ScoreArcProps {
  /** Valeur 0–100 (sémantique : le score). */
  value: number;
  /** Portion du cercle dessinée (0–100). Défaut : value.
   *  Fidèle aux captures : l'arc visuel est plus court que le score. */
  sweep?: number;
  className?: string;
  strokeWidth?: number;
  /** Délai de dessin (ms). */
  delay?: number;
}

/**
 * Arc de score orange braise — repris fidèlement de l'app :
 * arc partiel, trait fin, dégradé braise qui s'éteint, extrémité ronde.
 * Se dessine à l'entrée dans le viewport ; instantané si reduced-motion.
 */
export function ScoreArc({ value, sweep, className, strokeWidth = 2.4, delay = 0 }: ScoreArcProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const reduced = useReducedMotion();

  const pct = Math.max(0, Math.min(100, sweep ?? value));
  const drawn = reduced || inView;

  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FD6A10" />
            <stop offset="55%" stopColor="#F05000" />
            <stop offset="100%" stopColor="#7A2800" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
          strokeDashoffset={drawn ? 0 : pct}
          style={{
            transition: `stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
      </svg>
    </div>
  );
}
