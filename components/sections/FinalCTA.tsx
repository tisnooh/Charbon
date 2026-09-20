import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { BetaCta } from '@/components/waitlist/BetaCta';
import { LogoMark } from '@/components/ui/LogoMark';
import { cn, container } from '@/lib/utils/cn';

/**
 * CTA FINAL — composition éditoriale asymétrique :
 * titre à gauche, engagement à droite, signature de marque en pied.
 */
export function FinalCTA() {
  const c = copy.finalCta;

  return (
    <section className="relative overflow-hidden border-t border-line/60 py-28 md:py-36 lg:py-40">
      <div
        aria-hidden
        className="glow-ember absolute inset-0"
        style={{ ['--glow-x' as string]: '78%', ['--glow-y' as string]: '70%', ['--glow-r' as string]: '520px' }}
      />

      <div className={cn(container, 'relative')}>
        <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          {/* Colonne titre */}
          <div>
            <Reveal>
              <p className="flex items-center gap-2.5 text-label uppercase tracking-label text-ink-500">
                <LogoMark className="h-3.5 w-3.5 text-ember-500" />
                {c.label}
              </p>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-7 text-display-xl text-ink-100">
                {c.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </Reveal>
          </div>

          {/* Colonne engagement */}
          <Reveal delay={170}>
            <div className="space-y-1.5 border-l border-line pl-8 lg:pb-2">
              {c.sub.map((line) => (
                <p key={line} className="text-body-lg text-ink-400">
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-9 pl-8">
              <BetaCta source="final_cta" size="lg">
                {c.cta}
              </BetaCta>
              <p className="mt-4 text-sm text-ink-600">{c.under}</p>
            </div>
          </Reveal>
        </div>

        {/* Signature */}
        <Reveal delay={240}>
          <div className="mt-20 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-label uppercase tracking-[0.3em] text-ink-600">{copy.proof.signature}</p>
            <p className="text-xs text-ink-600">{copy.footer.illustrative}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
