import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { cn, container } from '@/lib/utils/cn';

/**
 * 01 — PROBLÉMATIQUE. Section très éditoriale :
 * pas de carte, seulement de l'espace, de la typo et un mouvement léger.
 */
export function ProblemSection() {
  const p = copy.problem;

  return (
    <section id="probleme" className={cn('relative border-t border-line/60', 'py-28 md:py-36 lg:py-44')}>
      <div className={container}>
        <div className="max-w-4xl">
          <Reveal>
            <p className="eyebrow">{p.label}</p>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-8 text-display-lg text-ink-400">
              {p.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </Reveal>

          {/* "C'est de le faire. Encore. Et encore." — typo majeure, lignes décalées */}
          <div className="mt-12 md:mt-16">
            {p.accent.map((line, i) => (
              <Reveal key={line} delay={140 + i * 110}>
                <p
                  className={cn(
                    'text-display-xl font-light',
                    i === 0 ? 'text-ink-100' : 'text-ink-300',
                    i === 1 && 'md:ml-[8%]',
                    i === 2 && 'md:ml-[16%]',
                  )}
                >
                  {line}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={180}>
            <div className="mt-14 max-w-xl space-y-2 md:mt-20 md:ml-[8%]">
              {p.body.map((line) => (
                <p key={line} className="text-body-lg leading-relaxed text-ink-500">
                  {line}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
