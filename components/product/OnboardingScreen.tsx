import type { AppScreenCopy } from '@/types/content';
import { StatusBar } from '@/components/product/StatusBar';
import { Pencil, Spark } from '@/components/ui/icons';

type OnboardingCopy = AppScreenCopy['onboarding'];

/**
 * Écran ONBOARDING (étape 5/5) — reproduction fidèle de la capture :
 * objectif utilisateur en citation, reformulation IA, 3 engagements
 * avec durée + priorité, calibration, CTA "Commencer le jour 1".
 */
export function OnboardingScreen({ c }: { c: OnboardingCopy }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <StatusBar />

      <div className="flex flex-1 flex-col px-[7cqw] pt-[11cqw]">
        {/* Étape + points */}
        <div className="flex items-center justify-between">
          <p className="text-[3cqw] uppercase tracking-[0.16em] text-ink-500">{c.step}</p>
          <div className="flex gap-[1.6cqw]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[1.8cqw] w-[1.8cqw] rounded-full bg-ink-700" />
            ))}
            <span className="h-[1.8cqw] w-[1.8cqw] rounded-full bg-ember-500" />
          </div>
        </div>

        {/* Objectif utilisateur */}
        <p className="mt-[7cqw] text-[4.4cqw] italic leading-[1.4] text-ink-400">{c.quote}</p>

        {/* Reformulation IA */}
        <p className="mt-[6cqw] flex items-center gap-[1.4cqw] text-[2.8cqw] uppercase tracking-[0.22em] text-ember-500">
          <Spark className="h-[3cqw] w-[3cqw]" />
          {c.objectiveLabel}
        </p>
        <p className="mt-[3cqw] text-[6cqw] font-medium leading-[1.24] tracking-[-0.015em] text-ink-100">
          {c.objective}
        </p>
        <div className="mt-[3.5cqw] flex items-center gap-[1.4cqw] text-ember-500">
          <Pencil className="h-[3.4cqw] w-[3.4cqw]" />
          <span className="text-[3.4cqw] font-medium">{c.edit}</span>
        </div>

        <div className="mt-[6cqw] border-t border-line" />

        {/* Engagements */}
        <p className="mt-[5cqw] text-[3cqw] uppercase tracking-[0.16em] text-ember-500">{c.commitmentsLabel}</p>
        <p className="mt-[2cqw] flex items-start gap-[1.4cqw] text-[3.2cqw] leading-[1.45] text-ink-500">
          <Spark className="mt-[0.4cqw] h-[3cqw] w-[3cqw] shrink-0 text-ink-600" />
          {c.commitmentsSub}
        </p>

        <div className="mt-[3cqw] border-t border-line">
          {c.commitments.map((k, i) => (
            <div key={k.title} className="flex items-center justify-between gap-[3cqw] border-b border-line py-[3.4cqw]">
              <p className="text-[3.8cqw] text-ink-100">
                {i + 1}. {k.title}
              </p>
              <div className="flex shrink-0 items-center gap-[2cqw]">
                <span className="text-[3.2cqw] text-ink-500">{k.duration}</span>
                <span className="rounded-pill border border-ember-700/70 px-[2.6cqw] py-[0.8cqw] text-[2.8cqw] text-ember-500">
                  {k.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-[4cqw] text-[3.2cqw] text-ink-500">{c.note}</p>

        {/* CTA bas d'écran */}
        <div className="mt-auto pb-[5cqw]">
          <div className="rounded-[4cqw] bg-ember-500 py-[4cqw] text-center text-[4.2cqw] font-semibold text-coal-950">
            {c.cta}
          </div>
          <div className="mx-auto mt-[4cqw] h-[1cqw] w-[30cqw] rounded-pill bg-ink-600" />
        </div>
      </div>
    </div>
  );
}
