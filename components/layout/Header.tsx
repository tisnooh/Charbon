'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { copy } from '@/content';
import { BetaCta } from '@/components/waitlist/BetaCta';
import { Close, Menu } from '@/components/ui/icons';
import { LogoMark } from '@/components/ui/LogoMark';
import { cn, container } from '@/lib/utils/cn';

const NAV_IDS = copy.header.nav.map((item) => item.id);

/**
 * Header premium sticky : fond noir, blur extrêmement discret au scroll,
 * navigation par ancres avec état actif, menu hamburger mobile simple.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* Blur au scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lien de navigation actif (sections de la landing uniquement) */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = NAV_IDS.map((id) => document.getElementById(id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* Verrouiller le scroll quand le menu mobile est ouvert */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-ember',
        scrolled || menuOpen
          ? 'border-b border-line/70 bg-coal-950/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className={cn(container, 'flex h-[4.5rem] items-center justify-between md:h-20')}>
        {/* Marque */}
        <a
          href="#top"
          className="group flex items-center gap-2.5 py-2"
          aria-label="Charbon — retour en haut"
          onClick={() => setMenuOpen(false)}
        >
          <LogoMark className="h-3.5 w-3.5 text-ember-500 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-[0.82rem] font-semibold uppercase tracking-[0.32em] text-ink-100">Charbon</span>
        </a>

        {/* Navigation desktop */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-9 lg:flex">
          {copy.header.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'true' : undefined}
              className={cn(
                'relative py-2 text-[0.88rem] transition-colors duration-300',
                activeId === item.id ? 'text-ink-100' : 'text-ink-400 hover:text-ink-100',
              )}
            >
              {item.label}
              <span
                aria-hidden
                className={cn(
                  'absolute -bottom-0.5 left-0 h-px bg-ember-500 transition-all duration-300 ease-ember',
                  activeId === item.id ? 'w-full opacity-100' : 'w-0 opacity-0',
                )}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* CTA desktop */}
          <BetaCta source="header" variant="ghost" size="sm" className="hidden md:inline-flex">
            {copy.header.cta}
          </BetaCta>

          {/* Hamburger mobile */}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-100 transition-colors hover:bg-coal-800 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen ? (
        <div id="mobile-menu" className="animate-fade-in border-t border-line/70 bg-coal-950/97 backdrop-blur-xl lg:hidden">
          <nav aria-label="Navigation mobile" className={cn(container, 'flex flex-col pb-8 pt-2')}>
            {copy.header.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line/60 py-4 text-base text-ink-200 transition-colors hover:text-ember-500"
              >
                {item.label}
              </a>
            ))}
            <BetaCta source="header_mobile" full size="lg" className="mt-6 md:hidden">
              {copy.header.cta}
            </BetaCta>
            <Link
              href="/support"
              onClick={() => setMenuOpen(false)}
              className="mt-5 text-center text-sm text-ink-500 transition-colors hover:text-ink-200 md:hidden"
            >
              Support
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
