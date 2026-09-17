/**
 * Plans Free / Premium — source de vérité unique partagée API + app + site.
 *
 * Politique (spec) : le cœur de Charbon reste réellement utilisable
 * gratuitement. Pas de paywall artificiel : seules les statistiques avancées
 * (90 j / 365 j) et l'historique approfondi sont Premium en V1.
 * Les fonctionnalités « à venir » sont explicitement marquées comme telles
 * (jamais présentées comme disponibles).
 */

export type PlanId = 'free' | 'premium';

export const PLAN_IDS: readonly PlanId[] = ['free', 'premium'] as const;

export type StatsRange = 'today' | '7d' | '30d' | '90d' | '365d';

export const STATS_RANGES: readonly StatsRange[] = ['today', '7d', '30d', '90d', '365d'] as const;

export const RANGE_DAYS: Record<StatsRange, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  /** Prix mensuel affiché (le paiement réel arrive avec Stripe — voir docs). */
  priceMonthly: { amount: number; currency: 'EUR' };
  /** Fonctionnalités RÉELLEMENT livrées (V1). */
  features: string[];
  /** Fonctionnalités annoncées mais non livrées — toujours labelisées « à venir ». */
  upcoming: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Tout l’essentiel de la discipline, pour toujours.',
    priceMonthly: { amount: 0, currency: 'EUR' },
    features: [
      'Habitudes, routines, tâches et objectifs illimités',
      'Streaks et historique des validations',
      'Statistiques aujourd’hui, 7 jours et 30 jours',
      'Rappels quotidiens dans l’application',
    ],
    upcoming: [],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'Pour analyser votre constance en profondeur.',
    priceMonthly: { amount: 4.99, currency: 'EUR' },
    features: [
      'Tout le plan Free',
      'Statistiques avancées 90 jours et 365 jours',
      'Historique approfondi par habitude (12 mois)',
    ],
    upcoming: ['Coach IA', 'Challenges entre amis', 'Partenaire d’accountability'],
  },
};

/** Plages de statistiques accessibles selon le plan. */
export function statsRangesForPlan(plan: PlanId): StatsRange[] {
  return plan === 'premium' ? [...STATS_RANGES] : ['today', '7d', '30d'];
}

export function canAccessStatsRange(plan: PlanId, range: StatsRange): boolean {
  return statsRangesForPlan(plan).includes(range);
}

/** Historique détaillé par habitude : 30 j en Free, 365 j en Premium. */
export function habitHistoryDaysForPlan(plan: PlanId): number {
  return plan === 'premium' ? 365 : 30;
}
