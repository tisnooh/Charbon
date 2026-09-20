'use client';

import { useState } from 'react';
import { copy } from '@/content';
import { track } from '@/lib/analytics';
import { Reveal } from '@/components/motion/Reveal';
import { ChevronDown } from '@/components/ui/icons';
import { cn, container, sectionPad } from '@/lib/utils/cn';

/**
 * 11 — FAQ. Accordéon accessible : aria-expanded / aria-controls,
 * navigation clavier native (boutons), transition douce, une seule
 * réponse ouverte à la fois.
 */
export function FAQSection() {
  const f = copy.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    const willOpen = openIndex !== index;
    setOpenIndex(willOpen ? index : null);
    if (willOpen) track('faq_opened', { question: f.items[index].q });
  };

  return (
    <section id="faq" className={cn(sectionPad, 'border-t border-line/60')}>
      <div className={cn(container, 'grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20')}>
        <div>
          <Reveal>
            <p className="eyebrow">{f.label}</p>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="mt-5 text-display-lg text-ink-100">{f.title}</h2>
          </Reveal>
        </div>

        <div className="border-t border-line">
          {f.items.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    id={`faq-button-${i}`}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span
                      className={cn(
                        'text-[1.05rem] font-medium tracking-tight transition-colors duration-300 md:text-lg',
                        open ? 'text-ink-100' : 'text-ink-200 hover:text-ink-100',
                      )}
                    >
                      {item.q}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        'h-5 w-5 shrink-0 transition-all duration-300 ease-ember',
                        open ? 'rotate-180 text-ember-500' : 'text-ink-600',
                      )}
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-button-${i}`}
                  className={cn(
                    'grid transition-all duration-500 ease-ember',
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-7 pr-8 text-[0.98rem] leading-relaxed text-ink-400">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
