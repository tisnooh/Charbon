import type { Metadata } from 'next';
import { copy } from '@/content';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description:
    'Conditions d’utilisation du site et de l’application Charbon — statut bêta, utilisation acceptable, responsabilité.',
  alternates: { canonical: '/conditions' },
};

export default function ConditionsPage() {
  return <LegalPage c={copy.legal.terms} />;
}
