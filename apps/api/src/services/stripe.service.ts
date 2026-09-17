/**
 * Passerelle Stripe — interface étroite + implémentation réelle + fake de test.
 * Le reste du code (routes, webhooks) ne parle QU'À cette interface :
 * - production/test-mode : implémentation `stripe` officielle (SDK) ;
 * - sans credentials      : gateway null → routes paiement = 501 honnête ;
 * - tests                 : fake injecté via buildApp({ stripeGateway }).
 *
 * Sécurité : le plan Premium est TOUJOURS dérivé de la table `subscriptions`
 * (mise à jour par webhooks signés), jamais d'un état frontend.
 */
import Stripe from 'stripe';
import type { AppConfig } from '../config/env.js';

/** Shape minimale des événements Stripe utilisés (typée, sans `any`). */
export interface StripeObjectLike {
  id?: string;
  customer?: string;
  subscription?: string;
  status?: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: { userId?: string };
}

export interface StripeEventLike {
  type: string;
  data: { object: StripeObjectLike };
}

export interface StripeGateway {
  createCheckoutSession(args: {
    userId: string;
    email: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }>;
  setCancelAtPeriodEnd(subscriptionId: string, cancelAtPeriodEnd: boolean): Promise<void>;
  /** Vérifie la signature du webhook ; lève une erreur si invalide. */
  constructWebhookEvent(rawBody: string, signature: string): StripeEventLike;
}

export function createStripeGateway(config: AppConfig): StripeGateway | null {
  if (!config.stripeConfigured) return null;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-08-27.basil' as never });
  const priceId = process.env.STRIPE_PRICE_MONTHLY as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  return {
    async createCheckoutSession({ userId, email, successUrl, cancelUrl }) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
      });
      return { url: session.url ?? '', sessionId: session.id };
    },
    async setCancelAtPeriodEnd(subscriptionId, cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: cancelAtPeriodEnd });
    },
    constructWebhookEvent(rawBody, signature) {
      return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as unknown as StripeEventLike;
    },
  };
}

/** Fake déterministe pour tests (aucun appel réseau). */
export function createFakeStripeGateway(): StripeGateway & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async createCheckoutSession(args) {
      calls.push(['checkout', args]);
      return { url: 'https://checkout.stripe.test/c/cs_test_123', sessionId: 'cs_test_123' };
    },
    async setCancelAtPeriodEnd(subscriptionId, cancelAtPeriodEnd) {
      calls.push(['setCancelAtPeriodEnd', subscriptionId, cancelAtPeriodEnd]);
    },
    constructWebhookEvent(rawBody, signature) {
      if (signature !== 'whsec_valid_test_signature') {
        throw new Error('Signature webhook invalide');
      }
      return JSON.parse(rawBody) as StripeEventLike;
    },
  };
}
