/**
 * Abonnement Free / Premium.
 *
 * V1 : aucun prestataire de paiement réel n'est câblé (Stripe = BLOCAGE EXTERNE,
 * clés requises — voir docs/PROJECT_STATE.md). Deux modes :
 * - DEV_BILLING=true (jamais en production) : simulateur qui active/révoque
 *   Premium pour tester le gating de bout en bout. Clairement identifié
 *   (provider: 'dev', billingDevMode: true dans le DTO et l'UI).
 * - Sinon : upgrade/cancel renvoient 501 'payment_provider_not_configured'.
 *   L'état renvoyé au client est toujours VRAI (jamais de faux statut).
 */
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { isoUtcNow, type SubscriptionDTO } from '@charbon/shared';
import type { Db } from '../db/client.js';
import { subscriptions } from '../db/schema.js';
import { AppError, conflict } from '../lib/errors.js';
import type { AppConfig } from '../config/env.js';

type SubRow = typeof subscriptions.$inferSelect;

function toDTO(row: SubRow, config: AppConfig): SubscriptionDTO {
  return {
    plan: row.plan,
    status: row.status,
    provider: row.provider,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodEnd: row.currentPeriodEnd,
    billingDevMode: config.devBilling,
    paymentConfigured: config.stripeConfigured,
  };
}

export async function getSubscription(db: Db, userId: string, config: AppConfig): Promise<SubscriptionDTO> {
  const row = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  if (!row) throw conflict('no_subscription', 'Abonnement introuvable (compte corrompu)');
  return toDTO(row, config);
}

export async function upgradeSubscription(
  db: Db,
  userId: string,
  config: AppConfig,
): Promise<SubscriptionDTO> {
  const row = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  if (!row) throw conflict('no_subscription', 'Abonnement introuvable (compte corrompu)');
  if (row.plan === 'premium' && row.status === 'active') {
    throw conflict('already_premium', 'Le plan Premium est déjà actif');
  }
  if (!config.devBilling) {
    throw new AppError(
      501,
      'payment_provider_not_configured',
      'Le paiement en ligne n’est pas encore configuré sur ce serveur (prestataire absent). Aucun débit ne peut avoir lieu.',
    );
  }
  const now = isoUtcNow();
  const updated = await db
    .update(subscriptions)
    .set({
      plan: 'premium',
      status: 'active',
      provider: 'dev',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId))
    .returning()
    .get();
  return toDTO(updated, config);
}

export async function cancelSubscription(
  db: Db,
  userId: string,
  config: AppConfig,
): Promise<SubscriptionDTO> {
  const row = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  if (!row) throw conflict('no_subscription', 'Abonnement introuvable (compte corrompu)');
  if (row.plan !== 'premium' || row.status !== 'active') {
    throw conflict('not_premium', 'Aucun abonnement Premium actif à résilier');
  }
  if (row.provider === 'dev') {
    const now = isoUtcNow();
    const updated = await db
      .update(subscriptions)
      .set({
        plan: 'free',
        status: 'active',
        provider: 'none',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        updatedAt: now,
      })
      .where(eq(subscriptions.userId, userId))
      .returning()
      .get();
    return toDTO(updated, config);
  }
  // provider 'stripe' (futur) : résiliation via l'API du prestataire.
  throw new AppError(
    501,
    'payment_provider_not_configured',
    'La résiliation via le prestataire de paiement n’est pas encore câblée sur ce serveur.',
  );
}

export async function ensureSubscriptionRow(db: Db, userId: string): Promise<void> {
  const row = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  if (row) return;
  const now = isoUtcNow();
  await db.insert(subscriptions).values({
    id: randomUUID(),
    userId,
    plan: 'free',
    status: 'active',
    provider: 'none',
    createdAt: now,
    updatedAt: now,
  });
}
