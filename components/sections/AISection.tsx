import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { PhoneParallax } from '@/components/motion/PhoneParallax';
import { PhoneFrame } from '@/components/product/PhoneFrame';
import { CoachScreen } from '@/components/product/CoachScreen';
import { AnalysisScreen } from '@/components/product/AnalysisScreen';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 05 — L'INTELLIGENCE. Pas un chatbot : le Coach et l'Analyse du jour.
 * Deux mockups réels (bottom sheets) + liste des fonctions IA.
 */
export function AISection() {
  const a = copy.ai;

  return (
    <section id="ia" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16')}>
        {/* Colonne éditoriale */}
        <div className="lg:sticky lg:top-28">
          <SectionHeading label={a.label} title={a.title} titleClassName="text-display-md lg:text-display-lg">
            <div className="max-w-md space-y-1.5">
              {a.subtitle.map((line) => (
                <p key={line} className="text-body-lg leading-relaxed text-ink-400">
                  {line}
                </p>
              ))}
            </div>
          </SectionHeading>

          <ul className="mt-12 max-w-md border-t border-line">
            {a.features.map((feature, i) => (
              <Reveal key={feature} delay={i * 60}>
                <li className="flex items-baseline gap-5 border-b border-line py-4">
                  <span aria-hidden className="w-6 shrink-0 text-xs text-ink-600 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[1.02rem] text-ink-200">{feature}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Deux mockups — scroll horizontal snap sur mobile */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          <div className="w-[76vw] max-w-[300px] shrink-0 snap-center sm:w-[300px] md:w-auto">
            <PhoneParallax amplitude={6}>
              <PhoneFrame label="Écran Coach Charbon — ton programme, en contexte, avec proposition acceptée ou refusée">
                <CoachScreen c={copy.app.coach} today={copy.app.today} />
              </PhoneFrame>
            </PhoneParallax>
          </div>
          <div className="w-[76vw] max-w-[300px] shrink-0 snap-center sm:w-[300px] md:w-auto md:pt-20">
            <PhoneParallax amplitude={10}>
              <PhoneFrame label="Écran Analyse du jour Charbon — journée terminée, engagements vérifiés et ajustement de demain">
                <AnalysisScreen c={copy.app.analysis} />
              </PhoneFrame>
            </PhoneParallax>
          </div>
        </div>
      </div>
    </section>
  );
}
