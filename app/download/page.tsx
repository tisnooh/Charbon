import type { Metadata } from 'next';
import Link from 'next/link';
import { copy } from '@/content';
import { BetaCta } from '@/components/waitlist/BetaCta';
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
    <div className={cn(container, 'flex min-h-[70vh] flex-col items-center justify-center py-32 text-center')}>
      <Link
        href="/"
        className="absolute left-5 top-28 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-100 sm:left-8 lg:left-12"
      >
        <span aria-hidden>←</span> Accueil
      </Link>

      <p className="flex items-center gap-2.5 text-label uppercase tracking-label text-ink-500">
        <span aria-hidden className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ember-500" />
        {d.label}
      </p>

      <h1 className="mt-6 max-w-2xl text-display-lg text-ink-100">{d.title}</h1>
      <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-ink-400">{d.text}</p>

      <BetaCta source="download" size="lg" className="mt-10">
        {d.cta}
      </BetaCta>

      <p className="mt-6 text-xs text-ink-600">{d.note}</p>
    </div>
  );
}
