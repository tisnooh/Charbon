import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { BetaCta } from '@/components/waitlist/BetaCta';
import { cn, container } from '@/lib/utils/cn';

/**
 * CTA FINAL — "Arrête de négocier avec toi-même."
 * La conversion North Star : VISITOR → WAITLIST SIGNUP.
 */
export function FinalCTA() {
  const c = copy.finalCta;

  return (
    <section className="relative overflow-hidden border-t border-line/60 py-28 md:py-36 lg:py-44">
      <div
        aria-hidden
        className="glow-ember absolute inset-0"
        style={{ ['--glow-x' as string]: '50%', ['--glow-y' as string]: '85%' }}
      />

      <div className={cn(container, 'relative text-center')}>
        <Reveal>
          <p className="mx-auto flex w-fit items-center gap-2.5 text-label uppercase tracking-label text-ink-500">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ember-500" />
            {c.label}
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="mx-auto mt-7 max-w-3xl text-display-xl text-ink-100">
            {c.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </Reveal>

        <Reveal delay={170}>
          <div className="mt-8 space-y-1.5">
            {c.sub.map((line) => (
              <p key={line} className="text-body-lg text-ink-400">
                {line}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-12 flex justify-center">
            <BetaCta source="final_cta" size="lg" full className="sm:w-auto sm:min-w-[16rem]">
              {c.cta}
            </BetaCta>
          </div>
          <p className="mt-5 text-sm text-ink-600">{c.under}</p>
        </Reveal>
      </div>
    </section>
  );
}
