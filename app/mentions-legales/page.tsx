import type { Metadata } from 'next';
import { copy } from '@/content';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site officiel de Charbon — éditeur, hébergement, propriété intellectuelle.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return <LegalPage c={copy.legal.mentions} />;
}
