import type { AppScreenCopy } from '@/types/content';
import { Check, ChevronRight, Minus, Spark, Target, X } from '@/components/ui/icons';

type AnalysisCopy = AppScreenCopy['analysis'];

/**
 * Écran ANALYSE DU JOUR — bottom sheet fidèle à la capture :
 * "Journée terminée", 3 engagements (Vérifié / Tenu / Non tenu),
 * analyse courte, ajustement de demain, Voir demain, Partager le résultat.
 */
export function AnalysisScreen({ c }: { c: AnalysisCopy }) {
  return (
    <div className="absolute inset-0 bg-black">
      {/* Voile très léger en haut (l'écran du jour derrière) */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[9cqw] bg-gradient-to-b from-[#0A0A0A] to-transparent" />

      <div className="absolute inset-x-0 bottom-0 top-[5cqw] flex flex-col rounded-t-[7cqw] border-t border-[#242423] bg-[#0B0B0B] px-[7cqw] pb-[5cqw] pt-[3cqw]">
        <div className="mx-auto h-[1.1cqw] w-[10cqw] rounded-pill bg-ink-700" />

        <p className="mt-[4cqw] text-[2.9cqw] uppercase tracking-[0.22em] text-ember-500">{c.label}</p>
        <p className="mt-[2cqw] text-[6cqw] font-semibold tracking-[-0.015em] text-ink-100">{c.title}</p>

        {/* Engagements du jour */}
        <div className="mt-[4cqw] border-t border-[#1C1C1B]">
          {c.rows.map((row) => (
            <div key={row.title} className="flex items-start gap-[3cqw] border-b border-[#1C1C1B] py-[3.4cqw]">
              <StateIcon state={row.state} />
              <div className="min-w-0 flex-1">
                <p className="text-[4.1cqw] font-medium text-ink-100">{row.title}</p>
                <p className="mt-[0.8cqw] text-[3.3cqw] text-ink-500">{row.sub}</p>
              </div>
              <ChevronRight className="mt-[0.8cqw] h-[3.6cqw] w-[3.6cqw] shrink-0 text-ink-700" />
            </div>
          ))}
        </div>

        {/* Analyse courte */}
        <div className="mt-[4cqw] flex items-start gap-[2.2cqw]">
          <Spark className="mt-[0.4cqw] h-[3.6cqw] w-[3.6cqw] shrink-0 text-ember-500" />
          <p className="text-[3.5cqw] leading-[1.55] text-ink-400">{c.paragraph}</p>
        </div>

        <div className="mt-[4cqw] border-t border-[#1C1C1B]" />

        {/* Ajustement de demain */}
        <p className="mt-[4cqw] text-[2.9cqw] uppercase tracking-[0.22em] text-ember-500">{c.adjustLabel}</p>
        <div className="mt-[2.5cqw] flex items-start gap-[2.4cqw]">
          <Target className="mt-[0.4cqw] h-[4cqw] w-[4cqw] shrink-0 text-ember-500" />
          <p className="text-[4cqw] font-medium leading-[1.4] text-ink-100">{c.adjust1}</p>
        </div>
        <div className="mt-[3cqw] flex items-start gap-[2.4cqw]">
          <Spark className="mt-[0.4cqw] h-[4cqw] w-[4cqw] shrink-0 text-ink-500" />
          <p className="text-[3.5cqw] leading-[1.5] text-ink-500">{c.adjust2}</p>
        </div>

        <div className="mt-auto pt-[5cqw]">
          <div className="rounded-[4cqw] bg-ember-500 py-[4cqw] text-center text-[4.2cqw] font-semibold text-coal-950">
            {c.cta}
          </div>
          <p className="mt-[3.6cqw] text-center text-[3.8cqw] font-medium text-ember-500">{c.share}</p>
          <div className="mx-auto mt-[3cqw] h-[1cqw] w-[30cqw] rounded-pill bg-ink-600" />
        </div>
      </div>
    </div>
  );
}

function StateIcon({ state }: { state: 'verified' | 'held' | 'missed' }) {
  const base = 'mt-[0.4cqw] flex h-[6cqw] w-[6cqw] shrink-0 items-center justify-center rounded-full border-[0.45cqw]';
  if (state === 'verified') {
    return (
      <span aria-hidden className={`${base} border-ember-500 text-ember-500`}>
        <Check className="h-[3.2cqw] w-[3.2cqw]" strokeWidth={2.6} />
      </span>
    );
  }
  if (state === 'held') {
    return (
      <span aria-hidden className={`${base} border-ember-500 text-ember-500`}>
        <Minus className="h-[3.2cqw] w-[3.2cqw]" strokeWidth={2.6} />
      </span>
    );
  }
  return (
    <span aria-hidden className={`${base} border-ink-600 text-ink-500`}>
      <X className="h-[3cqw] w-[3cqw]" strokeWidth={2.4} />
    </span>
  );
}
