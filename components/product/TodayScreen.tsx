import type { AppScreenCopy } from '@/types/content';
import { StatusBar } from '@/components/product/StatusBar';
import { TabBar } from '@/components/product/TabBar';
import { ScoreArc } from '@/components/product/ScoreArc';
import { Check, ChevronRight, Flame, Spark } from '@/components/ui/icons';

type TodayCopy = AppScreenCopy['today'];

/**
 * Écran AUJOURD'HUI — reproduction proportionnelle de la capture officielle
 * (560×1216). Toutes les dimensions sont en cqw (% de la largeur d'écran) :
 * le mockup est un clone mis à l'échelle, quel que soit le rendu.
 * La colonne remplit toute la hauteur : le CTA se cale juste au-dessus
 * de la tab bar, comme dans l'app (aucun vide flottant).
 */
export function TodayScreen({ c }: { c: TodayCopy }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <StatusBar />

      <div className="flex flex-1 flex-col px-[7cqw] pb-[30cqw] pt-[10.5cqw]">
        {/* En-tête : bonjour + date + Coach discret */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[3cqw] font-semibold uppercase tracking-[0.12em] text-ink-100">{c.greeting}</p>
            <p className="mt-[1.4cqw] text-[2.7cqw] text-ink-500">{c.date}</p>
          </div>
          <div className="flex items-center gap-[1.4cqw] pt-[0.6cqw]">
            <Spark className="h-[3.1cqw] w-[3.1cqw] text-ember-500" />
            <span className="text-[2.8cqw] font-medium text-ink-300">{c.coach}</span>
          </div>
        </div>

        {/* Score de discipline */}
        <p className="mt-[8cqw] text-[2.5cqw] uppercase tracking-[0.28em] text-ink-100">{c.scoreLabel}</p>
        <div className="relative mt-[1cqw]">
          <ScoreArc value={c.score} sweep={68} strokeWidth={1.7} className="absolute -right-[1cqw] -top-[1.5cqw] h-[46cqw] w-[46cqw]" delay={300} />
          <span className="relative block text-[44cqw] font-extralight leading-[0.82] tracking-[-0.03em] text-ember-500">
            {c.score}
          </span>
          <p className="relative mt-[3cqw] text-[3.3cqw] font-medium text-ember-500">{c.delta}</p>
        </div>

        {/* Insight IA */}
        <div className="mt-[6cqw] flex items-start gap-[2.2cqw]">
          <Spark className="mt-[0.5cqw] h-[3.1cqw] w-[3.1cqw] shrink-0 text-ember-500" />
          <p className="text-[2.75cqw] leading-[1.45] text-ink-400">{c.insight}</p>
        </div>

        {/* Streak + engagements */}
        <div className="mt-[5.6cqw] flex items-center gap-[2.2cqw] text-[2.8cqw]">
          <Flame className="h-[3.6cqw] w-[3.6cqw] shrink-0 text-ember-500" />
          <span className="font-medium text-ink-100">{c.streak}</span>
          <span aria-hidden className="text-ink-700">|</span>
          <span className="text-ink-500">{c.engagementsCount}</span>
        </div>

        {/* Proof Line + engagements */}
        <div className="relative mt-[7.5cqw]">
          <div aria-hidden className="absolute bottom-[6cqw] left-[2.4cqw] top-[3.6cqw] w-px bg-line" />
          <ul>
            {c.engagements.map((e) => (
              <li key={e.title} className="relative flex items-start justify-between gap-[3cqw] py-[6cqw] pl-[8cqw]">
                <ProofNode state={e.state} />
                <div className="min-w-0 flex-1">
                  <p className="text-[3.4cqw] font-medium leading-[1.3] text-ink-100">
                    {e.time} — {e.title}
                  </p>
                  <p className="mt-[1.2cqw] text-[2.65cqw] text-ink-500">
                    <span className="text-ember-500">{e.priority}</span> — {e.status}
                  </p>
                </div>
                <ChevronRight className="mt-[0.8cqw] h-[3.4cqw] w-[3.4cqw] shrink-0 text-ink-700" />
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton Commencer — calé juste au-dessus de la tab bar, comme l'app */}
        <div className="mt-auto flex justify-end pt-[3cqw]">
          <span className="rounded-pill bg-ember-500 px-[8.5cqw] py-[2.6cqw] text-[2.9cqw] font-semibold text-coal-950">
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
        className="absolute left-0 top-[3.6cqw] flex h-[5.6cqw] w-[5.6cqw] items-center justify-center rounded-full border-[0.5cqw] border-ember-500 text-ember-500"
      >
        <Check className="h-[3.1cqw] w-[3.1cqw]" strokeWidth={2.6} />
      </span>
    );
  }
  if (state === 'held') {
    return <span aria-hidden className="absolute left-[0.8cqw] top-[4.6cqw] h-[4cqw] w-[4cqw] rounded-full bg-ink-100" />;
  }
  return (
    <span
      aria-hidden
      className="absolute left-[0.5cqw] top-[4.4cqw] h-[4.6cqw] w-[4.6cqw] rounded-full border-[0.4cqw] border-dashed border-ink-600"
    />
  );
}
