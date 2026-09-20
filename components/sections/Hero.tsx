import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { PhoneFrame } from '@/components/product/PhoneFrame';
import { TodayScreen } from '@/components/product/TodayScreen';
import { cn, container } from '@/lib/utils/cn';
import { LogoMark } from '@/components/ui/LogoMark';

/**
 * HERO — promesse centrale en < 10 secondes.
 * Gauche : label, headline ("Prouve-le." en orange braise), sous-titre, CTAs.
 * Droite : mockup iPhone fidèle à l'écran Aujourd'hui (score 84, arc, Proof Line).
 */
export function Hero() {
  const h = copy.hero;

  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden className="glow-ember absolute inset-0" style={{ ['--glow-y' as string]: '10%' }} />

      <div
        className={cn(
          container,
          'relative grid items-center gap-14 pb-20 pt-32 md:gap-16 md:pb-28 md:pt-40 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8 lg:pb-32',
        )}
      >
        {/* Colonne texte */}
        <div>
          <Reveal>
            <p className="flex items-center gap-2.5 text-label uppercase tracking-label text-ink-500">
              <LogoMark className="h-3.5 w-3.5 text-ember-500" />
              {h.label}
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-display-xl text-ink-100">
              {h.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-ember-500">{h.titleAccent}</span>
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mt-7 max-w-xl text-body-lg leading-relaxed text-ink-400">{h.subtitle}</p>
          </Reveal>

          <Reveal delay={250}>
            <p className="mt-10 text-sm text-ink-600">{h.underCta}</p>
          </Reveal>
        </div>

        {/* Mockup — écran Aujourd'hui */}
        <Reveal delay={330} threshold={0.05}>
          <div className="mx-auto w-[min(84vw,380px)] md:w-[380px] lg:w-[min(100%,440px)]">
            <PhoneFrame label={h.mockupNote}>
              <TodayScreen c={copy.app.today} />
            </PhoneFrame>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
