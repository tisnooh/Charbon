import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { TrackOnView } from '@/components/motion/TrackOnView';
import { BetaCta } from '@/components/waitlist/BetaCta';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Check } from '@/components/ui/icons';
import { cn, container, sectionPad } from '@/lib/utils/cn';
import type { PricingPlanCopy } from '@/types/content';

/**
 * 09 — PRICING. Deux plans seulement : Free et Pro.
 * Composition sobre en deux colonnes hairline, pas de grille de cartes.
 * (L'app n'étant pas publiée, les CTA ouvrent la bêta.)
 */
export function PricingSection() {
  const p = copy.pricing;

  return (
    <TrackOnView event="pricing_viewed">
      <section id="pro" className={cn(sectionPad, 'border-t border-line/60')}>
        <div className={container}>
          <SectionHeading label={p.label} title={p.title} className="max-w-2xl" />

          <Reveal delay={150}>
            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
              <Plan plan={p.free} featured={false} source="pricing_free" />
              <Plan plan={p.pro} featured source="pricing_pro" />
            </div>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-8 text-center text-sm text-ink-600">{p.note}</p>
          </Reveal>
        </div>
      </section>
    </TrackOnView>
  );
}

function Plan({ plan, featured, source }: { plan: PricingPlanCopy; featured: boolean; source: string }) {
  return (
    <div className={cn('relative flex flex-col bg-coal-900 p-8 md:p-12', featured && 'md:pt-14')}>
      {featured ? <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ember-500/80" /> : null}

      <p className={cn('text-label uppercase tracking-label', featured ? 'text-ember-500' : 'text-ink-500')}>
        {plan.name}
      </p>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-4xl font-light tracking-tight text-ink-100 md:text-5xl">{plan.price}</span>
        {plan.priceAlt ? <span className="text-sm text-ink-500">{plan.priceAlt}</span> : null}
      </div>
      <p className="mt-4 text-[0.95rem] text-ink-500">{plan.baseline}</p>

      <ul className="mt-8 flex-1 space-y-3.5 border-t border-line pt-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-[0.95rem] text-ink-300">
            <Check
              className={cn('mt-0.5 h-4 w-4 shrink-0', featured ? 'text-ember-500' : 'text-ink-500')}
              strokeWidth={2.2}
            />
            {feature}
          </li>
        ))}
      </ul>

      <BetaCta
        source={source}
        event={featured ? 'pro_clicked' : undefined}
        variant={featured ? 'primary' : 'ghost'}
        size="lg"
        full
        className="mt-10"
      >
        {plan.cta}
      </BetaCta>
    </div>
  );
}
