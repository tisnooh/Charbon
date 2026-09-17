/** Tests Abonnement : état réel, mode dev, mode production sans prestataire. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { authed, makeTestApp, registerUser, type TestApp } from './helpers.js';

describe('subscription — mode dev (DEV_BILLING=true)', () => {
  let t: TestApp;
  let cookie: string;
  before(async () => {
    t = await makeTestApp({ DEV_BILLING: 'true' });
    cookie = (await registerUser(t)).cookie;
  });
  after(async () => {
    await t.dispose();
  });

  it('état initial : Free, provider none, devMode true, paymentConfigured false', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/subscription', headers: authed(cookie) });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.deepEqual(
      { plan: body.plan, status: body.status, provider: body.provider, billingDevMode: body.billingDevMode, paymentConfigured: body.paymentConfigured },
      { plan: 'free', status: 'active', provider: 'none', billingDevMode: true, paymentConfigured: false },
    );
  });

  it('upgrade dev → Premium (provider dev, période courante définie)', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/upgrade', headers: authed(cookie) });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().plan, 'premium');
    assert.equal(res.json().provider, 'dev');
    assert.ok(res.json().currentPeriodEnd);

    const me = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(cookie) });
    assert.equal(me.json().plan, 'premium');
  });

  it('double upgrade → 409 already_premium', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/upgrade', headers: authed(cookie) });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error.code, 'already_premium');
  });

  it('cancel dev → retour Free ; cancel en Free → 409', async () => {
    const cancel = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/cancel', headers: authed(cookie) });
    assert.equal(cancel.statusCode, 200);
    assert.equal(cancel.json().plan, 'free');
    assert.equal(cancel.json().provider, 'none');

    const again = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/cancel', headers: authed(cookie) });
    assert.equal(again.statusCode, 409);
    assert.equal(again.json().error.code, 'not_premium');
  });
});

describe('subscription — mode production (sans prestataire de paiement)', () => {
  let t: TestApp;
  let cookie: string;
  before(async () => {
    t = await makeTestApp({ NODE_ENV: 'production', DEV_BILLING: 'true' });
    cookie = (await registerUser(t)).cookie;
  });
  after(async () => {
    await t.dispose();
  });

  it('DEV_BILLING est ignoré en production : billingDevMode=false', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/subscription', headers: authed(cookie) });
    assert.equal(res.json().billingDevMode, false);
  });

  it('upgrade → 501 payment_provider_not_configured (état honnête, aucun faux achat)', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/upgrade', headers: authed(cookie) });
    assert.equal(res.statusCode, 501);
    assert.equal(res.json().error.code, 'payment_provider_not_configured');
  });

  it('la route dev/emails est désactivée en production', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/dev/emails' });
    assert.equal(res.statusCode, 404);
  });
});
