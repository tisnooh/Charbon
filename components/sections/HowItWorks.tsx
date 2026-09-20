import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { PhoneParallax } from '@/components/motion/PhoneParallax';
import { PhoneFrame } from '@/components/product/PhoneFrame';
import { OnboardingScreen } from '@/components/product/OnboardingScreen';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn, container, sectionPad } from '@/lib/utils/cn';
import type { StepCopy } from '@/types/content';

/**
 * 03 — LE FONCTIONNEMENT. De l'objectif à l'exécution en 4 étapes,
 * avec le mockup réel de l'onboarding à droite.
 */
export function HowItWorks() {
  const h = copy.how;

  return (
    <section id="fonctionnement" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20')}>
        {/* Étapes */}
        <div>
          <SectionHeading label={h.label} title={h.title}>
            <div className="max-w-md space-y-1.5">
              {h.description.map((line) => (
                <p key={line} className="text-body-lg leading-relaxed text-ink-400">
                  {line}
                </p>
              ))}
            </div>
          </SectionHeading>

          <div className="mt-14 border-t border-line">
            {h.steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 90}>
                <Step step={step} />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Mockup onboarding */}
        <Reveal delay={220} threshold={0.05}>
          <div className="lg:sticky lg:top-28">
            <PhoneParallax>
              <div className="mx-auto w-[min(82vw,340px)] md:w-[340px]">
                <PhoneFrame label="Écran d’onboarding Charbon — reformulation de l’objectif et premiers engagements">
                  <OnboardingScreen c={copy.app.onboarding} />
                </PhoneFrame>
              </div>
            </PhoneParallax>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Step({ step }: { step: StepCopy }) {
  return (
    <div className="flex gap-6 border-b border-line py-8 sm:gap-8">
      <span className="w-8 shrink-0 pt-1 text-label text-ember-500">{step.num}</span>
      <div className="min-w-0">
        <h3 className="text-lg font-medium tracking-tight text-ink-100">{step.title}</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{step.text}</p>

        {step.quote ? (
          <p className="mt-4 border-l-2 border-ember-500/60 pl-4 text-[1.02rem] italic leading-relaxed text-ink-200">
            {step.quote}
          </p>
        ) : null}

        {step.items ? (
          <ul className="mt-4 space-y-2">
            {step.items.map((item) => (
              <li key={item} className="flex items-baseline gap-3 text-[0.95rem] text-ink-300">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember-500" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {step.cta ? (
          <div className="mt-5 inline-flex rounded-pill bg-ember-500 px-7 py-3 text-[0.95rem] font-semibold text-coal-950">
            {step.cta}
          </div>
        ) : null}
      </div>
    </div>
  );
}
