import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { PhoneParallax } from '@/components/motion/PhoneParallax';
import { PhoneFrame } from '@/components/product/PhoneFrame';
import { FocusScreen } from '@/components/product/FocusScreen';
import { Lock } from '@/components/ui/icons';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 06 — L'EXÉCUTION. Focus : quand c'est l'heure, tu fais le travail.
 * Mockup Focus extrapolé strictement du langage visuel de l'app.
 */
export function FocusSection() {
  const f = copy.focus;

  return (
    <section id="focus" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid items-center gap-16 lg:grid-cols-2 lg:gap-24')}>
        {/* Mockup Focus */}
        <Reveal threshold={0.05}>
          <div className="mx-auto w-[min(82vw,340px)] md:w-[340px]">
            <PhoneParallax>
              <PhoneFrame label="Écran Focus Charbon — session de 52 minutes sur 90, engagement critique en cours">
                <FocusScreen c={copy.app.focus} />
              </PhoneFrame>
            </PhoneParallax>
          </div>
        </Reveal>

        {/* Copy */}
        <div>
          <Reveal>
            <p className="eyebrow">{f.label}</p>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="mt-5 text-display-lg text-ink-100">
              {f.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-10">
              <p className="text-display-md text-ink-500">{f.lines[0]}</p>
              <p className="mt-2 text-display-md text-ink-100">{f.lines[1]}</p>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-12 flex max-w-md items-start gap-3 border-t border-line pt-8 text-[0.95rem] leading-relaxed text-ink-500">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden />
              {f.note}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
