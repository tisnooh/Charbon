import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { ProofLine } from '@/components/sections/ProofLine';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 04 — LA PREUVE. "Ce n'est pas une liste. C'est une ligne de preuve."
 * Grande Proof Line verticale animée au scroll + signature de marque.
 */
export function ProofLineSection() {
  const p = copy.proof;

  return (
    <section id="preuve" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24')}>
        {/* Colonne éditoriale */}
        <div>
          <Reveal>
            <p className="eyebrow">{p.label}</p>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="mt-5 text-display-lg text-ink-100">
              {p.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-8 max-w-md text-body-lg leading-relaxed text-ink-400">{p.body}</p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-14 border-t border-line pt-8">
              <p className="text-label uppercase tracking-[0.3em] text-ink-600">{p.signature}</p>
            </div>
          </Reveal>
        </div>

        {/* Proof Line */}
        <div className="lg:pt-4">
          <ProofLine states={p.states} />
        </div>
      </div>
    </section>
  );
}
