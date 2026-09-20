import type { Metadata } from 'next';
import { copy } from '@/content';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Confidentialité',
  description:
    'Comment Charbon traite tes données : objectifs privés par défaut, preuves privées, aucun partage automatique, contrôle complet.',
  alternates: { canonical: '/confidentialite' },
};

export default function ConfidentialitePage() {
  return <LegalPage c={copy.legal.privacy} />;
}
