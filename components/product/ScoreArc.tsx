'use client';

import { useId } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { cn } from '@/lib/utils/cn';

interface ScoreArcProps {
  /** Valeur 0–100 (sémantique : le score). */
  value: number;
  /** Portion du cercle dessinée (0–100). Défaut : value. */
  sweep?: number;
  /** Angle de départ en degrés (convention écran : 270 = 12 h). Défaut : 270. */
  start?: number;
  /** Fondu + extrémité fine en fin de trait, comme l'app. */
  fade?: boolean;
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
export function ScoreArc({ value, sweep, start = 270, fade = false, className, strokeWidth = 2.4, delay = 0 }: ScoreArcProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const reduced = useReducedMotion();

  const pct = Math.max(0, Math.min(100, sweep ?? value));
  const drawn = reduced || inView;

  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full" style={{ transform: `rotate(${start}deg)` }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FD6A10" />
            <stop offset="55%" stopColor="#F05000" />
            <stop offset="85%" stopColor="#B93A00" stopOpacity={fade ? 0.55 : 1} />
            <stop offset="100%" stopColor="#7A2800" stopOpacity={fade ? 0.12 : 1} />
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
