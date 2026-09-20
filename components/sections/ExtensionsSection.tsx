import { copy } from '@/content';
import { Reveal } from '@/components/motion/Reveal';
import { cn, container } from '@/lib/utils/cn';

/**
 * EXTENSIONS — section discrète. Rien n'est promis :
 * ces fonctions ne sont pas disponibles aujourd'hui.
 */
export function ExtensionsSection() {
  const e = copy.extensions;

  return (
    <section id="extensions" className={cn('border-t border-line/60 py-20 md:py-24')}>
      <div className={cn(container, 'max-w-3xl')}>
        <Reveal>
          <p className="inline-flex items-center gap-2.5 rounded-pill border border-line px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-ink-500">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-600" />
            {e.label}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 text-display-md text-ink-100">{e.title}</h2>
        </Reveal>
        <Reveal delay={150}>
          <ul className="mt-8 flex flex-wrap gap-3">
            {e.items.map((item) => (
              <li
                key={item}
                className="rounded-pill border border-line bg-coal-900 px-4 py-2 text-sm text-ink-400"
              >
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-7 text-sm text-ink-600">{e.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
