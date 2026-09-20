import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { copy } from '@/content';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsProvider } from '@/lib/analytics/AnalyticsProvider';
import { WaitlistProvider } from '@/components/waitlist/WaitlistContext';
import { getSiteUrl } from '@/lib/utils/site-url';
import './globals.css';

/**
 * Typographie : Inter (variable, SIL Open Font License) — l'esprit des
 * captures SF Pro de l'app, avec fallback système. Aucune font propriétaire.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: copy.meta.title,
    template: '%s — Charbon',
  },
  description: copy.meta.description,
  applicationName: 'Charbon',
  authors: [{ name: 'Charbon' }],
  keywords: [
    'Charbon',
    'discipline',
    'accountability',
    'Discipline Score',
    'engagements',
    'constance',
    'application IA',
    'exécution',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'Charbon',
    title: copy.meta.title,
    description: copy.meta.description,
    images: [
      {
        url: '/og/og.png',
        width: 1200,
        height: 630,
        alt: 'Charbon — Tu as dit que tu le ferais. Prouve-le.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: copy.meta.title,
    description: copy.meta.description,
    images: ['/og/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

/**
 * JSON-LD SoftwareApplication — cohérent avec le statut réel du produit :
 * app en préparation, pas de liens store, pas de notes inventées.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Charbon',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'iOS, Android',
  softwareVersion: 'beta',
  description: copy.meta.description,
  url: siteUrl,
  inLanguage: 'fr',
  isAccessibleForFree: true,
  offers: [
    { '@type': 'Offer', name: 'Charbon Free', price: '0', priceCurrency: 'EUR' },
    { '@type': 'Offer', name: 'Charbon Pro', price: '9.99', priceCurrency: 'EUR' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-coal-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AnalyticsProvider />
        <WaitlistProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-pill focus:bg-ember-500 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-coal-950"
          >
            Aller au contenu principal
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </WaitlistProvider>
      </body>
    </html>
  );
}
