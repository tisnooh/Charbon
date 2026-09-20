import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { PhoneParallax } from '@/components/motion/PhoneParallax';
import { PhoneFrame } from '@/components/product/PhoneFrame';
import { ProfileScreen } from '@/components/product/ProfileScreen';
import { Info } from '@/components/ui/icons';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 08 — TON PROFIL. Ta carte d'identité de discipline.
 * Mockup Profil + disclaimer honnête (pas une certification officielle).
 */
export function ProfileSection() {
  const p = copy.profile;

  return (
    <section id="profil" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid items-center gap-16 lg:grid-cols-2 lg:gap-24')}>
        {/* Copy */}
        <div className="order-2 lg:order-1">
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
          <Reveal delay={170}>
            <p className="mt-7 max-w-md text-body-lg leading-relaxed text-ink-400">{p.text}</p>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-10 flex max-w-md items-start gap-3 border-t border-line pt-8 text-sm leading-relaxed text-ink-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {p.disclaimer}
            </p>
          </Reveal>
        </div>

        {/* Mockup Profil */}
        <Reveal delay={140} threshold={0.05} className="order-1 lg:order-2">
          <div className="mx-auto w-[min(82vw,340px)] md:w-[340px]">
            <PhoneParallax>
              <PhoneFrame label="Écran Profil Charbon — carte d’identité de discipline avec statistiques illustratives">
                <ProfileScreen c={copy.app.profile} tabs={copy.app.today.tabs} />
              </PhoneFrame>
            </PhoneParallax>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
