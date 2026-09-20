'use client';

import { useInView } from '@/lib/hooks/useInView';
import { cn } from '@/lib/utils/cn';
import type { ProofStateCopy } from '@/types/content';

/**
 * Grande Proof Line verticale — la ligne se construit au scroll,
 * les états apparaissent en cascade. Couleurs fidèles à l'app :
 * ○ planifié, ● blanc tenu, ● orange prouvé, ○ pointillé en attente.
 */
export function ProofLine({ states }: { states: ProofStateCopy[] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 });

  return (
    <div ref={ref} className="relative">
      {/* La ligne */}
      <div
        aria-hidden
        className={cn(
          'absolute bottom-4 left-6 top-4 w-px origin-top bg-gradient-to-b from-ember-500/70 via-ink-600/40 to-line',
          'transition-transform duration-[1600ms] ease-ember',
          inView ? 'scale-y-100' : 'scale-y-0',
        )}
      />

      <ul className="space-y-12 sm:space-y-14">
        {states.map((state, i) => (
          <li
            key={state.id}
            className={cn(
              'relative pl-16 transition-all duration-700 ease-ember',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
            )}
            style={{ transitionDelay: `${250 + i * 180}ms` }}
          >
            <ProofNode id={state.id} />
            <p className="text-lg font-medium tracking-tight text-ink-100">{state.title}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-500">{state.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProofNode({ id }: { id: ProofStateCopy['id'] }) {
  const shell = 'absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full';

  if (id === 'planned') {
    return <span aria-hidden className={cn(shell, 'border border-ink-600 bg-coal-950')} />;
  }
  if (id === 'held') {
    return (
      <span aria-hidden className={cn(shell, 'bg-coal-950')}>
        <span className="h-4 w-4 rounded-full bg-ink-100" />
      </span>
    );
  }
  if (id === 'proven') {
    return (
      <span aria-hidden className={cn(shell, 'bg-coal-950')}>
        <span className="h-4 w-4 rounded-full bg-ember-500 shadow-[0_0_20px_rgba(248,84,4,0.85)]" />
      </span>
    );
  }
  return <span aria-hidden className={cn(shell, 'border border-dashed border-ink-600 bg-coal-950')} />;
}
