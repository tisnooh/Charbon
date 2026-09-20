'use client';

import { useId } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { cn } from '@/lib/utils/cn';

interface ScoreArcProps {
  /** Valeur 0–100 (sémantique : utilisée pour le variant ring). */
  value: number;
  /**
   * 'swoosh' (défaut) : la virgule exacte de l'app — départ ligne du label,
   * bouge à droite du score, retour sous le delta, fondu aux deux extrémités.
   * 'ring' : anneau de progression (session Focus).
   */
  variant?: 'swoosh' | 'ring';
  /** Portion du ring dessinée (0–100), variant ring uniquement. */
  sweep?: number;
  className?: string;
  strokeWidth?: number;
  /** Délai de dessin (ms). */
  delay?: number;
}

/**
 * Jauge Charbon — reproduit le trait orange des captures :
 * courbe en parenthèse, extrémités rondes, fondu en entrée et en sortie,
 * cœur braise brillant. Se dessine à l'entrée dans le viewport ;
 * instantané si prefers-reduced-motion.
 */
export function ScoreArc({ value, variant = 'swoosh', sweep, className, strokeWidth = 2.25, delay = 0 }: ScoreArcProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const reduced = useReducedMotion();
  const drawn = reduced || inView;

  const transition = `stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`;

  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none', className)}>
      {variant === 'swoosh' ? (
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="98"
              y1="50"
              x2="24.3"
              y2="90.5"
            >
              <stop offset="0%" stopColor="#B93A00" stopOpacity="0.45" />
              <stop offset="5%" stopColor="#FD6A10" stopOpacity="1" />
              <stop offset="72%" stopColor="#F85404" stopOpacity="1" />
              <stop offset="100%" stopColor="#7A2800" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${Math.max(0, Math.min(100, sweep ?? 34))} 100`}
            strokeDashoffset={drawn ? 0 : 100}
            transform="rotate(281 50 50)"
            style={{ transition }}
          />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" className="h-full w-full" style={{ transform: 'rotate(255deg)' }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FD6A10" />
              <stop offset="55%" stopColor="#F05000" />
              <stop offset="85%" stopColor="#B93A00" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7A2800" stopOpacity="0.12" />
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
            strokeDasharray={`${Math.max(0, Math.min(100, sweep ?? value))} 100`}
            strokeDashoffset={drawn ? 0 : 100}
            style={{ transition }}
          />
        </svg>
      )}
    </div>
  );
}
