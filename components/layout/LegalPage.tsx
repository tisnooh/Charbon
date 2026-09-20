import Link from 'next/link';
import type { LegalPageCopy } from '@/types/content';
import { cn, container } from '@/lib/utils/cn';

/** Mise en page partagée des pages légales (serveur, sans interactivité). */
export function LegalPage({ c }: { c: LegalPageCopy }) {
  return (
    <div className={cn(container, 'py-32 md:py-40')}>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-100"
      >
        <span aria-hidden>←</span> Accueil
      </Link>

      <h1 className="mt-8 max-w-3xl text-display-lg text-ink-100">{c.title}</h1>
      <p className="mt-4 text-sm text-ink-600">{c.updated}</p>

      <div className="mt-10 max-w-3xl space-y-4 border-t border-line pt-10">
        {c.intro.map((paragraph) => (
          <p key={paragraph} className="text-[1rem] leading-relaxed text-ink-400">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-14 max-w-3xl space-y-12">
        {c.blocks.map((block, i) => (
          <section key={block.heading ?? i}>
            {block.heading ? (
              <h2 className="text-lg font-medium tracking-tight text-ink-100">
                <span className="mr-2 text-ember-500">{String(i + 1).padStart(2, '0')}</span>
                {block.heading}
              </h2>
            ) : null}

            {block.paragraphs ? (
              <div className="mt-4 space-y-3">
                {block.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[0.98rem] leading-relaxed text-ink-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {block.bullets ? (
              <ul className="mt-4 space-y-2.5">
                {block.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-baseline gap-3 text-[0.98rem] leading-relaxed text-ink-400">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember-500" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
