import type { AppScreenCopy } from '@/types/content';
import { StatusBar } from '@/components/product/StatusBar';
import { ArrowUp, Calendar, ChevronRight, Clock, Pencil, Spark, Target, TrendUp } from '@/components/ui/icons';

type CoachCopy = AppScreenCopy['coach'];
type TodayCopy = AppScreenCopy['today'];

/**
 * Écran COACH — bottom sheet fidèle à la capture :
 * fond = haut de l'écran Aujourd'hui estompé, sheet graphite,
 * questions rapides, analyse contextuelle, proposition Accepter/Refuser,
 * champ de question.
 */
export function CoachScreen({ c, today }: { c: CoachCopy; today: TodayCopy }) {
  const icons = [TrendUp, Calendar, Clock, Target];

  return (
    <div className="absolute inset-0 bg-black">
      <StatusBar />

      {/* Fond : haut de l'écran Aujourd'hui, estompé sous la sheet */}
      <div aria-hidden className="px-[7cqw] pt-[11cqw] opacity-70">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[3.8cqw] font-semibold uppercase tracking-[0.12em] text-ink-100">{today.greeting}</p>
            <p className="mt-[1.2cqw] text-[3.2cqw] text-ink-500">{today.date}</p>
          </div>
          <div className="flex items-center gap-[1.4cqw] pt-[0.5cqw]">
            <Spark className="h-[3.4cqw] w-[3.4cqw] text-ember-500" />
            <span className="text-[3.3cqw] font-medium text-ink-300">{today.coach}</span>
          </div>
        </div>
        <p className="mt-[7cqw] text-[2.7cqw] uppercase tracking-[0.28em] text-ink-100">{today.scoreLabel}</p>
        <span className="mt-[1cqw] block text-[40cqw] font-extralight leading-[0.9] tracking-[-0.03em] text-ember-500">
          {today.score}
        </span>
      </div>

      {/* Voile */}
      <div aria-hidden className="absolute inset-0 bg-black/45" />

      {/* Bottom sheet Coach */}
      <div className="absolute inset-x-0 bottom-0 rounded-t-[7cqw] border-t border-[#242423] bg-[#0E0E0E] px-[7cqw] pb-[6cqw] pt-[3cqw]">
        <div className="mx-auto h-[1.1cqw] w-[10cqw] rounded-pill bg-ink-700" />

        <p className="mt-[4cqw] flex items-center gap-[1.4cqw] text-[2.9cqw] uppercase tracking-[0.22em] text-ember-500">
          <Spark className="h-[3cqw] w-[3cqw]" />
          {c.label}
        </p>
        <p className="mt-[2cqw] text-[5.4cqw] font-semibold tracking-[-0.015em] text-ink-100">{c.title}</p>

        {/* Questions rapides */}
        <div className="mt-[4cqw] border-y border-[#1C1C1B]">
          {c.questions.map((q, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={q} className="flex items-center gap-[2.8cqw] border-b border-[#1C1C1B] py-[3.2cqw] last:border-b-0">
                <Icon className="h-[4cqw] w-[4cqw] shrink-0 text-ink-300" />
                <span className="flex-1 text-[3.8cqw] text-ink-100">{q}</span>
                <ChevronRight className="h-[3.4cqw] w-[3.4cqw] shrink-0 text-ink-700" />
              </div>
            );
          })}
        </div>

        {/* Analyse contextuelle */}
        <p className="mt-[4cqw] text-[3.5cqw] leading-[1.55] text-ink-400">{c.paragraph}</p>

        <div className="mt-[4cqw] border-t border-[#1C1C1B]" />

        {/* Proposition */}
        <p className="mt-[4cqw] text-[2.9cqw] uppercase tracking-[0.22em] text-ember-500">{c.proposalLabel}</p>
        <p className="mt-[2cqw] text-[4.3cqw] font-medium text-ink-100">{c.proposal}</p>

        <div className="mt-[4cqw] flex divide-x divide-[#242423] border-y border-[#242423]">
          <span className="flex-1 py-[3.2cqw] text-center text-[3.6cqw] font-semibold text-ember-500">{c.accept}</span>
          <span className="flex-1 py-[3.2cqw] text-center text-[3.6cqw] font-semibold text-ink-300">{c.reject}</span>
        </div>

        {/* Champ de question */}
        <div className="mt-[4cqw] flex items-center gap-[2.4cqw] rounded-[4cqw] border border-[#262625] bg-[#141413] px-[4cqw] py-[2.6cqw]">
          <Pencil className="h-[3.6cqw] w-[3.6cqw] shrink-0 text-ink-600" />
          <span className="min-w-0 flex-1 truncate text-[3.4cqw] text-ink-600">{c.placeholder}</span>
          <span className="flex h-[7cqw] w-[7cqw] shrink-0 items-center justify-center rounded-full bg-[#3A3A38]">
            <ArrowUp className="h-[3.6cqw] w-[3.6cqw] text-ink-200" />
          </span>
        </div>

        <div className="mx-auto mt-[4cqw] h-[1cqw] w-[30cqw] rounded-pill bg-ink-600" />
      </div>
    </div>
  );
}
