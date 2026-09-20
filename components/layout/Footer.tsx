import Link from 'next/link';
import { copy } from '@/content';
import { cn, container } from '@/lib/utils/cn';
import { LogoMark } from '@/components/ui/LogoMark';

/**
 * Footer complet : produit, application, légal, statut du produit,
 * mentions illustratives, année dynamique. Pas de réseaux inventés.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-coal-950">
      <div className={cn(container, 'py-16 md:py-20')}>
        <div className="grid gap-14 md:grid-cols-[1.1fr_2fr] md:gap-10">
          {/* Marque */}
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-3.5 w-3.5 text-ember-500" />
              <span className="text-[0.82rem] font-semibold uppercase tracking-[0.32em] text-ink-100">Charbon</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-500">{copy.footer.tagline}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-pill border border-line px-3.5 py-1.5 text-xs text-ink-500">
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ember-500" />
              {copy.footer.status}
            </p>
          </div>

          {/* Colonnes de liens */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {copy.footer.columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-label uppercase tracking-label text-ink-600">{col.title}</h2>
                <ul className="mt-5 space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.anchor ? (
                        <a
                          href={link.href}
                          className="text-sm text-ink-400 transition-colors duration-200 hover:text-ink-100"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-ink-400 transition-colors duration-200 hover:text-ink-100"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bas de footer */}
        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.footer.copyright.replace('{year}', String(year))}</p>
          <p>{copy.footer.illustrative}</p>
        </div>
      </div>
    </footer>
  );
}
