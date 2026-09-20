import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * DIFFÉRENCIATION — "Pas une todo-list de plus."
 * Comparaison planner / habit tracker / Charbon, puis la chaîne complète
 * OBJECTIF → ENGAGEMENT → EXÉCUTION → PREUVE → SCORE → PROGRESSION.
 */
export function DifferentiationSection() {
  const d = copy.differentiation;

  return (
    <section id="difference" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={container}>
        <Reveal>
          <h2 className="max-w-3xl text-display-lg text-ink-100">{d.title}</h2>
        </Reveal>

        {/* Comparaison éditoriale */}
        <div className="mt-14 max-w-4xl border-t border-line">
          {d.items.map((item, i) => (
            <Reveal key={item.name} delay={i * 90}>
              <div
                className={cn(
                  'grid gap-2 border-b border-line py-8 md:grid-cols-[minmax(0,16rem)_1fr] md:items-baseline md:gap-10',
                  item.highlight && 'bg-gradient-to-r from-ember-900/15 to-transparent',
                )}
              >
                <p
                  className={cn(
                    'text-label uppercase',
                    item.highlight ? 'tracking-label text-ember-500' : 'tracking-label text-ink-500',
                  )}
                >
                  {item.name}
                </p>
                <p
                  className={cn(
                    'text-xl font-light tracking-tight md:text-2xl',
                    item.highlight ? 'text-ink-100' : 'text-ink-400',
                  )}
                >
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* La chaîne complète */}
        <div className="mt-20 md:mt-28">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-4 sm:gap-x-6">
            {d.chain.map((word, i) => (
              <Reveal key={word} delay={i * 110} className="flex items-center gap-4 sm:gap-6">
                <span
                  className={cn(
                    'text-xl font-light uppercase tracking-[0.12em] sm:text-2xl md:text-[2rem]',
                    i === d.chain.length - 1 ? 'text-ember-500' : 'text-ink-200',
                  )}
                >
                  {word}
                </span>
                {i < d.chain.length - 1 ? (
                  <span aria-hidden className="text-lg text-ink-700 sm:text-xl">
                    →
                  </span>
                ) : null}
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
