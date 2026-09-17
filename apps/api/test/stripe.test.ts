/**
 * Stripe : checkout, webhooks signés (source de vérité Premium), annulation,
 * reprise, impayés, e-mails transactionnels — sans aucun appel réseau (fake
 * gateway injecté). Sans credentials : 501/404 honnêtes.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createFakeStripeGateway } from '../src/services/stripe.service.js';
import { makeTestApp, type TestApp } from './helpers.js';

const SIG = 'whsec_valid_test_signature';

describe('stripe — intégration complète (test mode simulé)', () => {
  let t: TestApp;
  const fake = createFakeStripeGateway();
  let cookie = '';
  let userId = '';
  const email = `stripe-${Date.now()}@example.test`;

  before(async () => {
    t = await makeTestApp(
      {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_WEBHOOK_SECRET: 'whsec_fake',
        STRIPE_PRICE_MONTHLY: 'price_fake',
        DEV_BILLING: 'false',
      },
      { stripeGateway: fake },
    );
  });
  after(async () => {
    await t.dispose();
  });

  async function webhook(type: string, object: Record<string, unknown>, sig = SIG) {
    return t.app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: { 'content-type': 'application/json', 'stripe-signature': sig },
      payload: JSON.stringify({ type, data: { object } }),
    });
  }
  async function outbox() {
    const res = await t.app.inject({ method: 'GET', url: `/api/v1/dev/emails?to=${email}` });
    return res.json().items as Array<{ subject: string; body: string }>;
  }

  it('inscription → e-mail de bienvenue réel (outbox)', async () => {
    const reg = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Sonia', email, password: 'stripe-12345', timezone: 'UTC' },
    });
    assert.equal(reg.statusCode, 201);
    cookie = reg.cookies.find((c) => c.name === 'charbon_session')?.value ?? '';
    userId = reg.json().user.id;
    const mails = await outbox();
    assert.ok(mails.some((m) => m.subject.includes('Bienvenue')));
  });

  it('checkout sans Premium → 201 + url Stripe', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/subscription/checkout',
      headers: { cookie: `charbon_session=${cookie}` },
    });
    assert.equal(res.statusCode, 201);
    assert.match(res.json().url, /checkout\.stripe\.test/);
  });

  it('webhook checkout.session.completed → Premium actif (serveur seul décide)', async () => {
    const ev = await webhook('checkout.session.completed', {
      id: 'cs_test_123',
      customer: 'cus_123',
      subscription: 'sub_123',
      metadata: { userId },
    });
    assert.equal(ev.statusCode, 200);
    const sub = await t.app.inject({ method: 'GET', url: '/api/v1/subscription', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(sub.json().plan, 'premium');
    assert.equal(sub.json().provider, 'stripe');
    const stats = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=90d', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(stats.statusCode, 200, 'gate Premium ouvert côté serveur');
    const mails = await outbox();
    assert.ok(mails.some((m) => m.subject.includes('Premium est actif')));
  });

  it('signature invalide → 400', async () => {
    const res = await webhook('checkout.session.completed', { id: 'x' }, 'toto');
    assert.equal(res.statusCode, 400);
  });

  it('webhook subscription.updated past_due → Premium suspendu (gate 403)', async () => {
    const ev = await webhook('customer.subscription.updated', {
      id: 'sub_123',
      status: 'past_due',
      cancel_at_period_end: false,
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 10,
    });
    assert.equal(ev.statusCode, 200);
    const stats = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=90d', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(stats.statusCode, 403, 'impayé = accès Premium coupé côté serveur');
  });

  it('webhook invoice.payment_failed → statut past_due + e-mail d’erreur de paiement', async () => {
    // repasse actif d'abord pour avoir un abonnement cohérent
    await webhook('customer.subscription.updated', { id: 'sub_123', status: 'active', cancel_at_period_end: false, current_period_end: Math.floor(Date.now() / 1000) + 86400 });
    const ev = await webhook('invoice.payment_failed', { id: 'in_1', customer: 'cus_123' });
    assert.equal(ev.statusCode, 200);
    const sub = await t.app.inject({ method: 'GET', url: '/api/v1/subscription', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(sub.json().status, 'past_due');
    const mails = await outbox();
    assert.ok(mails.some((m) => m.subject.includes('échec')));
    // rétablit pour la suite
    await webhook('customer.subscription.updated', { id: 'sub_123', status: 'active', cancel_at_period_end: false, current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30 });
  });

  it('webhook subscription.updated active → Premium rétabli', async () => {
    await webhook('customer.subscription.updated', {
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: false,
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    });
    const stats = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=90d', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(stats.statusCode, 200);
  });

  it('cancel → résiliation à échéance + e-mail ; resume → reprise', async () => {
    const cancel = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/cancel', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(cancel.statusCode, 200);
    assert.equal(cancel.json().cancelAtPeriodEnd, true);
    assert.ok((fake.calls as unknown[][]).some((c) => c[0] === 'setCancelAtPeriodEnd' && c[2] === true));

    const resume = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/resume', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(resume.statusCode, 200);
    assert.equal(resume.json().cancelAtPeriodEnd, false);
    assert.ok((fake.calls as unknown[][]).some((c) => c[0] === 'setCancelAtPeriodEnd' && c[2] === false));
  });

  it('webhook subscription.deleted → retour Free + e-mail de résiliation', async () => {
    const ev = await webhook('customer.subscription.deleted', { id: 'sub_123' });
    assert.equal(ev.statusCode, 200);
    const sub = await t.app.inject({ method: 'GET', url: '/api/v1/subscription', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(sub.json().plan, 'free');
    const mails = await outbox();
    assert.ok(mails.some((m) => m.subject.includes('résilié')));
    const stats = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=90d', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(stats.statusCode, 403);
  });
});

describe('stripe — sans credentials : états honnêtes', () => {
  let t: TestApp;
  let cookie = '';
  before(async () => {
    t = await makeTestApp({ DEV_BILLING: 'false' });
    const reg = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'N', email: `nostripe-${Date.now()}@example.test`, password: 'nostripe-123' },
    });
    cookie = reg.cookies.find((c) => c.name === 'charbon_session')?.value ?? '';
  });
  after(async () => {
    await t.dispose();
  });

  it('checkout → 501 payment_provider_not_configured', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/checkout', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(res.statusCode, 501);
    assert.equal(res.json().error.code, 'payment_provider_not_configured');
  });

  it('webhook → 404 (route inactive)', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: { 'content-type': 'application/json', 'stripe-signature': 'x' },
      payload: JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } }),
    });
    assert.equal(res.statusCode, 404);
  });

  it('upgrade dev désactivé (DEV_BILLING=false) → 501', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/upgrade', headers: { cookie: `charbon_session=${cookie}` } });
    assert.equal(res.statusCode, 501);
  });
});
