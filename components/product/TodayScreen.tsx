import type { AppScreenCopy } from '@/types/content';
import { StatusBar } from '@/components/product/StatusBar';
import { TabBar } from '@/components/product/TabBar';
import { ScoreArc } from '@/components/product/ScoreArc';
import { Check, ChevronRight, Flame, Spark } from '@/components/ui/icons';

type TodayCopy = AppScreenCopy['today'];

/**
 * Écran AUJOURD'HUI — reproduction fidèle de la capture officielle :
 * fond noir profond, score 84 très fin en orange braise, arc partiel,
 * insight IA, streak, Proof Line verticale, engagements, bouton Commencer.
 */
export function TodayScreen({ c }: { c: TodayCopy }) {
  return (
    <div className="absolute inset-0">
      <StatusBar />

      <div className="px-[7cqw] pb-[24cqw] pt-[11cqw]">
        {/* En-tête : bonjour + date + Coach discret */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[3.4cqw] font-semibold uppercase tracking-[0.12em] text-ink-100">{c.greeting}</p>
            <p className="mt-[1.2cqw] text-[2.9cqw] text-ink-500">{c.date}</p>
          </div>
          <div className="flex items-center gap-[1.4cqw] pt-[0.5cqw]">
            <Spark className="h-[3.4cqw] w-[3.4cqw] text-ember-500" />
            <span className="text-[3cqw] font-medium text-ink-300">{c.coach}</span>
          </div>
        </div>

        {/* Score de discipline */}
        <p className="mt-[8cqw] text-[2.4cqw] uppercase tracking-[0.28em] text-ink-100">{c.scoreLabel}</p>
        <div className="relative mt-[1cqw]">
          <ScoreArc value={c.score} sweep={62} className="absolute -right-[3cqw] top-[1cqw] h-[40cqw] w-[40cqw]" delay={300} />
          <span className="relative block text-[40cqw] font-extralight leading-[0.9] tracking-[-0.03em] text-ember-500">
            {c.score}
          </span>
          <p className="relative mt-[2cqw] text-[3.4cqw] font-medium text-ember-500">{c.delta}</p>
        </div>

        {/* Insight IA */}
        <div className="mt-[5cqw] flex items-start gap-[2.2cqw]">
          <Spark className="mt-[0.4cqw] h-[3.2cqw] w-[3.2cqw] shrink-0 text-ember-500" />
          <p className="text-[2.9cqw] leading-[1.5] text-ink-400">{c.insight}</p>
        </div>

        {/* Streak + engagements */}
        <div className="mt-[4.5cqw] flex items-center gap-[2.2cqw] text-[3cqw]">
          <Flame className="h-[3.6cqw] w-[3.6cqw] shrink-0 text-ember-500" />
          <span className="font-medium text-ink-100">{c.streak}</span>
          <span aria-hidden className="text-ink-700">|</span>
          <span className="text-ink-500">{c.engagementsCount}</span>
        </div>

        {/* Proof Line + engagements */}
        <div className="relative mt-[6cqw]">
          <div aria-hidden className="absolute bottom-[5cqw] left-[2.6cqw] top-[4cqw] w-px bg-line" />
          <ul>
            {c.engagements.map((e) => (
              <li key={e.title} className="relative flex items-start justify-between gap-[3cqw] py-[3.2cqw] pl-[8cqw]">
                <ProofNode state={e.state} />
                <div className="min-w-0 flex-1">
                  <p className="text-[3.6cqw] font-medium leading-[1.3] text-ink-100">
                    {e.time} — {e.title}
                  </p>
                  <p className="mt-[1cqw] text-[2.8cqw] text-ink-500">
                    <span className="text-ember-500">{e.priority}</span> — {e.status}
                  </p>
                </div>
                <ChevronRight className="mt-[0.8cqw] h-[3.4cqw] w-[3.4cqw] shrink-0 text-ink-700" />
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton Commencer */}
        <div className="mt-[4cqw] flex justify-end">
          <span className="rounded-pill bg-ember-500 px-[8cqw] py-[2.8cqw] text-[3.4cqw] font-semibold text-coal-950">
            {c.cta}
          </span>
        </div>
      </div>

      <TabBar tabs={c.tabs} active={0} />
    </div>
  );
}

function ProofNode({ state }: { state: 'verified' | 'held' | 'pending' }) {
  if (state === 'verified') {
    return (
      <span
        aria-hidden
        className="absolute left-0 top-[3.8cqw] flex h-[5.4cqw] w-[5.4cqw] items-center justify-center rounded-full border-[0.45cqw] border-ember-500 text-ember-500"
      >
        <Check className="h-[3cqw] w-[3cqw]" strokeWidth={2.6} />
      </span>
    );
  }
  if (state === 'held') {
    return (
      <span aria-hidden className="absolute left-[0.65cqw] top-[4.5cqw] h-[4cqw] w-[4cqw] rounded-full bg-ink-100" />
    );
  }
  return (
    <span
      aria-hidden
      className="absolute left-[0.35cqw] top-[4.3cqw] h-[4.6cqw] w-[4.6cqw] rounded-full border-[0.4cqw] border-dashed border-ink-600"
    />
  );
}
