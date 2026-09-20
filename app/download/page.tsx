import type { Metadata } from 'next';
import Link from 'next/link';
import { copy } from '@/content';
import { BetaCta } from '@/components/waitlist/BetaCta';
import { PhoneFrame } from '@/components/product/PhoneFrame';
import { TodayScreen } from '@/components/product/TodayScreen';
import { copy as content } from '@/content';
import { cn, container } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Télécharger',
  description: 'Charbon arrive bientôt — rejoins la bêta pour être prévenu des premiers accès.',
  alternates: { canonical: '/download' },
  robots: { index: true, follow: true },
};

/**
 * /download — page préparée pour le lancement.
 * Aucun faux lien store : l'app n'est pas encore publique.
 * Au moment de la publication, remplacer le BetaCta par les badges
 * App Store / Google Play officiels (voir README).
 */
export default function DownloadPage() {
  const d = copy.download;

  return (
    <div className={cn(container, 'grid min-h-[80vh] items-center gap-16 py-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20')}>
      <Link
        href="/"
        className="absolute left-5 top-28 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-100 sm:left-8 lg:left-12"
      >
        <span aria-hidden>←</span> Accueil
      </Link>

      <div>
        <p className="flex items-center gap-2.5 text-label uppercase tracking-label text-ink-500">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ember-500" />
          {d.label}
        </p>

        <h1 className="mt-6 max-w-2xl text-display-lg text-ink-100">{d.title}</h1>
        <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-ink-400">{d.text}</p>

        {/* Où en est Charbon */}
        <ul className="mt-10 max-w-md border-t border-line">
          {d.statuses.map((st) => (
            <li key={st.label} className="flex items-center gap-4 border-b border-line py-4">
              <span
                aria-hidden
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  st.current ? 'animate-pulse-dot bg-ember-500' : 'bg-ink-700',
                )}
              />
              <span className={cn('flex-1 text-[0.95rem]', st.current ? 'text-ink-100' : 'text-ink-500')}>
                {st.label}
              </span>
              <span className="text-xs uppercase tracking-[0.14em] text-ink-600">{st.note}</span>
            </li>
          ))}
        </ul>

        <BetaCta source="download" size="lg" className="mt-10">
          {d.cta}
        </BetaCta>
        <p className="mt-5 text-xs text-ink-600">{d.note}</p>
      </div>

      {/* Aperçu de l'app */}
      <div className="mx-auto w-[min(80vw,340px)] lg:w-[min(100%,380px)]">
        <PhoneFrame label="Aperçu de l’écran Aujourd’hui de Charbon">
          <TodayScreen c={content.app.today} />
        </PhoneFrame>
      </div>
    </div>
  );
}
