import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { CountUp } from '@/components/motion/CountUp';
import { ScoreArc } from '@/components/product/ScoreArc';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Flame } from '@/components/ui/icons';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 02 — DISCIPLINE SCORE. La fonctionnalité centrale.
 * Composition inspirée de l'app : grand 84 très fin, arc orange partiel,
 * comparaison Daily Score vs Discipline Score, "Une bonne journée ne suffit pas."
 */
export function ScoreSection() {
  const s = copy.score;

  return (
    <section id="score" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid items-center gap-16 lg:grid-cols-[1fr_0.92fr] lg:gap-20')}>
        {/* Colonne éditoriale */}
        <div>
          <SectionHeading label={s.label} title={s.title} titleClassName="text-display-lg">
            <p className="max-w-xl text-body-lg leading-relaxed text-ink-400">{s.body}</p>
          </SectionHeading>

          {/* Comparaison Daily / Discipline */}
          <Reveal delay={220}>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              <div className="bg-coal-900 p-7 md:p-8">
                <p className="eyebrow-muted">{s.dailyTitle}</p>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-400">{s.dailyText}</p>
              </div>
              <div className="relative bg-coal-900 p-7 md:p-8">
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ember-500/70" />
                <p className="eyebrow">{s.disciplineTitle}</p>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-100">{s.disciplineText}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <p className="mt-14 text-display-md text-ink-100">{s.headline}</p>
          </Reveal>
          <Reveal delay={360}>
            <p className="mt-3 text-display-md text-ink-500">{s.subheadline}</p>
          </Reveal>
        </div>

        {/* Composition score — fidèle à l'app : 84 + arc partiel */}
        <Reveal delay={200} threshold={0.1}>
          <div className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden
              className="glow-ember absolute inset-0"
              style={{ ['--glow-x' as string]: '62%', ['--glow-y' as string]: '30%', ['--glow-r' as string]: '300px' }}
            />

            <div className="relative">
              <div className="flex items-start">
                <CountUp
                  value={s.value}
                  aria-label={`${s.value} sur 100`}
                  className="block text-[9rem] font-extralight leading-[0.9] tracking-[-0.04em] text-ember-500 sm:text-[11rem] lg:text-[12.5rem]"
                />
                <ScoreArc
                  value={s.value}
                  strokeWidth={3.6}
                  className="mt-0 h-[16rem] w-[12.5rem] shrink-0 sm:h-[21rem] sm:w-[16.5rem] lg:h-[25rem] lg:w-[19.5rem]"
                  delay={250}
                />
              </div>

              <p className="mt-6 text-label uppercase tracking-label text-ink-300">{s.caption}</p>
              <p className="mt-3 text-xl font-medium text-ember-500">{s.delta}</p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-400">
                <span className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-ember-500" aria-hidden />
                  {s.streak}
                </span>
                <span aria-hidden className="hidden h-4 w-px bg-line-strong sm:block" />
                <span>{s.held}</span>
              </div>

              <p className="mt-8 text-xs text-ink-600">{s.illustrative}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
