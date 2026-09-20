import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { CountUp } from '@/components/motion/CountUp';
import { ProgressChart } from '@/components/sections/ProgressChart';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 07 — LA PROGRESSION. Une seule composition éditoriale cohérente :
 * score + statistiques en bandeau + graphique 30 jours. Pas de cartes isolées.
 */
export function ProgressSection() {
  const p = copy.progress;

  return (
    <section id="progression" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={container}>
        <SectionHeading label={p.label} title={p.title} className="max-w-2xl" />

        <Reveal delay={160}>
          <div className="mt-14 overflow-hidden rounded-3xl border border-line bg-coal-900/60">
            <div className="grid gap-10 p-8 md:p-12 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-20">
              {/* Score */}
              <div>
                <div className="flex items-baseline gap-4">
                  <CountUp
                    value={p.score}
                    aria-label={`${p.score} sur 100`}
                    className="block text-[6.5rem] font-extralight leading-[0.9] tracking-[-0.04em] text-ember-500"
                  />
                </div>
                <p className="mt-5 text-label uppercase tracking-label text-ink-400">{p.scoreLabel}</p>
                <p className="mt-2 text-base font-medium text-ember-500">{p.delta}</p>
              </div>

              {/* Statistiques — bandeau hairline, pas de cartes */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
                {p.stats.map((stat) => (
                  <div key={stat.label} className="bg-coal-900 p-6 md:p-7">
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-600">{stat.label}</p>
                    <p className="mt-2.5 text-lg font-medium tracking-tight text-ink-100 md:text-xl">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Graphique 30 jours */}
            <div className="border-t border-line px-8 pb-10 pt-8 md:px-12">
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <p className="text-label uppercase tracking-label text-ink-500">{p.chartLabel}</p>
                <p className="text-xs text-ink-600">{p.illustrative}</p>
              </div>
              <ProgressChart values={p.chart} label={p.chartLabel} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
