import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Check } from '@/components/ui/icons';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 10 — CONFIDENTIALITÉ. Ton rassurant, sans jargon.
 */
export function PrivacySection() {
  const p = copy.privacy;

  return (
    <section id="confidentialite" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24')}>
        <div>
          <SectionHeading label={p.label} title={p.title}>
            <p className="max-w-md text-body-lg leading-relaxed text-ink-400">{p.body}</p>
          </SectionHeading>
        </div>

        <ul className="self-center border-t border-line lg:max-w-xl">
          {p.points.map((point, i) => (
            <Reveal key={point} delay={i * 70}>
              <li className="flex items-center gap-4 border-b border-line py-5">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-300"
                >
                  <Check className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="text-[1.02rem] text-ink-200">{point}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
