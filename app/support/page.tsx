import type { Metadata } from 'next';
import Link from 'next/link';
import { copy } from '@/content';
import { cn, container } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Support Charbon — accès, compte, Discipline Score, paiement, données. Écris-nous.',
  alternates: { canonical: '/support' },
};

/** Email de support : variable d'env si renseignée, placeholder explicite sinon. */
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || '';
const isRealEmail = supportEmail.includes('@');

export default function SupportPage() {
  const s = copy.support;

  return (
    <div className={cn(container, 'py-32 md:py-40')}>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-100"
      >
        <span aria-hidden>←</span> Accueil
      </Link>

      <p className="eyebrow mt-8">{s.label}</p>
      <h1 className="mt-4 text-display-lg text-ink-100">{s.title}</h1>
      <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-ink-400">{s.intro}</p>

      {/* Sujets */}
      <div className="mt-14 grid max-w-4xl gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
        {s.topics.map((topic) => (
          <div key={topic.title} className="bg-coal-900 p-7">
            <h2 className="text-base font-medium tracking-tight text-ink-100">{topic.title}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{topic.text}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-14 max-w-xl rounded-3xl border border-line bg-coal-900 p-8">
        <h2 className="text-lg font-medium tracking-tight text-ink-100">{s.contactTitle}</h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-400">{s.contactText}</p>

        {isRealEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="mt-6 inline-flex items-center gap-2 rounded-pill bg-ember-500 px-6 py-3 text-[0.95rem] font-semibold text-coal-950 transition-colors hover:bg-ember-400"
          >
            {supportEmail}
          </a>
        ) : (
          <p className="mt-6 inline-flex rounded-pill border border-dashed border-line-strong px-5 py-2.5 text-sm text-ink-500">
            {s.emailPlaceholder}
          </p>
        )}

        <p className="mt-5 text-xs text-ink-600">{s.responseNote}</p>
      </div>
    </div>
  );
}
