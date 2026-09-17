/**
 * Abonnement Free/Premium.
 * - Sans credentials Stripe : upgrade dev labelisé (DEV_BILLING, jamais en prod)
 *   et checkout = 501 honnête.
 * - Avec credentials (test mode ou live) : checkout Stripe réel, état Premium
 *   synchronisé UNIQUEMENT par webhooks signés (jamais par le frontend),
 *   annulation/reprise à échéance, e-mails transactionnels.
 * - La protection Premium reste serveur (gate 403 sur stats 90j/365j, etc.).
 */
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { isoUtcNow } from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { subscriptions, users } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import {
  paymentFailedEmail,
  subscriptionCanceledEmail,
  subscriptionConfirmedEmail,
} from '../lib/email-templates.js';

export async function subscriptionRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db, config, mailer, stripeGateway } = opts.ctx;

  async function userRow(userId: string) {
    const u = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!u) throw notFound('Utilisateur introuvable');
    return u;
  }
  async function subRow(userId: string) {
    const s = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
    if (!s) throw conflict('no_subscription', 'Abonnement introuvable (compte corrompu)');
    return s;
  }

  app.get('/subscription', async (req, reply) => {
    const user = await app.requireUser(req);
    const row = await subRow(user.id);
    return reply.send({
      plan: row.plan,
      status: row.status,
      provider: row.provider,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      currentPeriodEnd: row.currentPeriodEnd,
      billingDevMode: config.devBilling,
      paymentConfigured: config.stripeConfigured,
    });
  });

  /** Créé une session de checkout Stripe (test mode ou live selon la clé). */
  app.post('/subscription/checkout', async (req, reply) => {
    const user = await app.requireUser(req);
    const row = await subRow(user.id);
    if (row.plan === 'premium' && row.status === 'active') {
      throw conflict('already_premium', 'Le plan Premium est déjà actif');
    }
    if (!stripeGateway) {
      throw new AppError(
        501,
        'payment_provider_not_configured',
        'Le paiement en ligne n’est pas configuré sur ce serveur. Aucun débit ne peut avoir lieu.',
      );
    }
    const me = await userRow(user.id);
    const session = await stripeGateway.createCheckoutSession({
      userId: user.id,
      email: me.email,
      successUrl: `${config.appBaseUrl}/profile/subscription?checkout=success`,
      cancelUrl: `${config.appBaseUrl}/profile/subscription?checkout=cancel`,
    });
    return reply.status(201).send({ url: session.url, sessionId: session.sessionId });
  });

  /** Annulation : à échéance de période si Stripe ; immédiate en mode dev. */
  app.post('/subscription/cancel', async (req, reply) => {
    const user = await app.requireUser(req);
    const row = await subRow(user.id);
    if (row.plan !== 'premium' || row.status !== 'active') {
      throw conflict('not_premium', 'Aucun abonnement Premium actif à résilier');
    }
    const me = await userRow(user.id);

    if (row.provider === 'stripe') {
      if (!stripeGateway || !row.providerSubscriptionId) {
        throw new AppError(501, 'payment_provider_not_configured', 'Passerelle Stripe indisponible.');
      }
      await stripeGateway.setCancelAtPeriodEnd(row.providerSubscriptionId, true);
      await db
        .update(subscriptions)
        .set({ cancelAtPeriodEnd: true, updatedAt: isoUtcNow() })
        .where(eq(subscriptions.userId, user.id));
      await mailer.send({
        to: me.email,
        ...subscriptionCanceledEmail(me.name, row.currentPeriodEnd),
      });
      const updated = await subRow(user.id);
      return reply.send({ ...updated, plan: updated.plan, cancelAtPeriodEnd: updated.cancelAtPeriodEnd });
    }

    if (row.provider === 'dev' && config.devBilling) {
      const now = isoUtcNow();
      await db
        .update(subscriptions)
        .set({ plan: 'free', status: 'active', provider: 'none', cancelAtPeriodEnd: false, currentPeriodEnd: null, updatedAt: now })
        .where(eq(subscriptions.userId, user.id));
      await mailer.send({ to: me.email, ...subscriptionCanceledEmail(me.name, null) });
      const updated = await subRow(user.id);
      return reply.send(updated);
    }

    throw new AppError(501, 'payment_provider_not_configured', 'Résiliation via le prestataire non câblée.');
  });

  /** Reprise d'un abonnement marqué « résiliation à échéance ». */
  app.post('/subscription/resume', async (req, reply) => {
    const user = await app.requireUser(req);
    const row = await subRow(user.id);
    if (!row.cancelAtPeriodEnd || row.provider !== 'stripe') {
      throw conflict('not_cancellable', 'Aucune résiliation à échéance en cours à reprendre');
    }
    if (!stripeGateway || !row.providerSubscriptionId) {
      throw new AppError(501, 'payment_provider_not_configured', 'Passerelle Stripe indisponible.');
    }
    await stripeGateway.setCancelAtPeriodEnd(row.providerSubscriptionId, false);
    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: false, updatedAt: isoUtcNow() })
      .where(eq(subscriptions.userId, user.id));
    const updated = await subRow(user.id);
    return reply.send(updated);
  });

  /** Upgrade simulé (développement uniquement, explicitement labelisé). */
  app.post('/subscription/upgrade', async (req, reply) => {
    const user = await app.requireUser(req);
    const row = await subRow(user.id);
    if (row.plan === 'premium' && row.status === 'active') {
      throw conflict('already_premium', 'Le plan Premium est déjà actif');
    }
    if (!config.devBilling) {
      throw new AppError(
        501,
        'payment_provider_not_configured',
        'Le paiement en ligne n’est pas encore configuré sur ce serveur (utilisez /subscription/checkout quand Stripe est câblé).',
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
      .where(eq(subscriptions.userId, user.id))
      .returning()
      .get();
    return reply.send(updated);
  });

  /**
   * Webhook Stripe — source de vérité de l'état Premium.
   * Signature vérifiée via la passerelle ; événements traités idempotemment.
   */
  app.post('/webhooks/stripe', async (req, reply) => {
    if (!stripeGateway) throw notFound('Route inactive (Stripe non configuré)');
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      return reply.status(400).send({ error: { code: 'validation_error', message: 'Signature manquante' } });
    }
    let event;
    try {
      event = stripeGateway.constructWebhookEvent(req.rawBody ?? '', signature);
    } catch {
      return reply.status(400).send({ error: { code: 'validation_error', message: 'Signature webhook invalide' } });
    }
    const obj = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = obj.metadata?.userId as string | undefined;
        if (!userId) break;
        const now = isoUtcNow();
        await db
          .update(subscriptions)
          .set({
            plan: 'premium',
            status: 'active',
            provider: 'stripe',
            providerCustomerId: (obj.customer as string) ?? null,
            providerSubscriptionId: (obj.subscription as string) ?? null,
            cancelAtPeriodEnd: false,
            updatedAt: now,
          })
          .where(eq(subscriptions.userId, userId));
        const u = await userRow(userId);
        await mailer.send({ to: u.email, ...subscriptionConfirmedEmail(u.name, 'premium', null) });
        break;
      }
      case 'customer.subscription.updated': {
        const subId = obj.id as string;
        const row = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.providerSubscriptionId, subId))
          .get();
        if (!row) break;
        const status =
          obj.status === 'active' || obj.status === 'trialing'
            ? 'active'
            : obj.status === 'past_due' || obj.status === 'unpaid'
              ? 'past_due'
              : 'canceled';
        const periodEnd = obj.current_period_end
          ? new Date(Number(obj.current_period_end) * 1000).toISOString()
          : null;
        await db
          .update(subscriptions)
          .set({
            status,
            plan: status === 'active' ? 'premium' : row.plan,
            cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
            currentPeriodEnd: periodEnd,
            updatedAt: isoUtcNow(),
          })
          .where(eq(subscriptions.id, row.id));
        break;
      }
      case 'customer.subscription.deleted': {
        const subId = obj.id as string;
        const row = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.providerSubscriptionId, subId))
          .get();
        if (!row) break;
        await db
          .update(subscriptions)
          .set({ plan: 'free', status: 'active', provider: 'none', cancelAtPeriodEnd: false, currentPeriodEnd: null, updatedAt: isoUtcNow() })
          .where(eq(subscriptions.id, row.id));
        const u = await userRow(row.userId);
        await mailer.send({ to: u.email, ...subscriptionCanceledEmail(u.name, null) });
        break;
      }
      case 'invoice.payment_failed': {
        const customerId = obj.customer as string;
        const row = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.providerCustomerId, customerId))
          .get();
        if (!row) break;
        await db
          .update(subscriptions)
          .set({ status: 'past_due', updatedAt: isoUtcNow() })
          .where(eq(subscriptions.id, row.id));
        const u = await userRow(row.userId);
        await mailer.send({ to: u.email, ...paymentFailedEmail(u.name) });
        break;
      }
      default:
        break; // événements non concernés : ack silencieux
    }
    return reply.send({ received: true });
  });
}
