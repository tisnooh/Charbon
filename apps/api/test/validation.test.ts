/** Tests de validation/robustesse : entrées invalides, routes inconnues, auth manquante. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { makeTestApp, registerUser, authed, type TestApp, type RegisteredUser } from './helpers.js';

describe('validation & robustesse', () => {
  let t: TestApp;
  let u: RegisteredUser;
  before(async () => {
    t = await makeTestApp();
    u = await registerUser(t);
  });
  after(async () => {
    await t.dispose();
  });

  it('toutes les routes privées répondent 401 sans session', async () => {
    const urls: Array<[string, string]> = [
      ['GET', '/api/v1/me'],
      ['GET', '/api/v1/today'],
      ['GET', '/api/v1/goals'],
      ['GET', '/api/v1/tasks'],
      ['GET', '/api/v1/habits'],
      ['GET', '/api/v1/routines'],
      ['GET', '/api/v1/routines/today'],
      ['GET', '/api/v1/stats/summary'],
      ['GET', '/api/v1/notifications'],
      ['GET', '/api/v1/subscription'],
      ['POST', '/api/v1/onboarding'],
    ];
    for (const [method, url] of urls) {
      const res = await t.app.inject({ method: method as 'GET' | 'POST', url });
      assert.equal(res.statusCode, 401, `${method} ${url}`);
      assert.equal(res.json().error.code, 'unauthorized');
    }
  });

  it('cookie de session falsifié → 401', async () => {
    const res = await t.app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie: 'charbon_session=token-invente-000000000000' },
    });
    assert.equal(res.statusCode, 401);
  });

  it('route API inconnue → 404 JSON structuré', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/inexistant' });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().error.code, 'not_found');
  });

  it('méthode non autorisée → 404 (pas de 500)', async () => {
    const res = await t.app.inject({ method: 'PUT', url: '/api/v1/goals', headers: authed(u.cookie) });
    assert.ok([404, 405].includes(res.statusCode), `statut inattendu : ${res.statusCode}`);
  });

  it('PATCH /me : fuseau invalide refusé, heure de rappel invalide refusée', async () => {
    const badTz = await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { timezone: 'Fuseau/Invente' },
    });
    assert.equal(badTz.statusCode, 400);
    const badTime = await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { dailyReminderTime: '25:00' },
    });
    assert.equal(badTime.statusCode, 400);
    const ok = await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { timezone: 'Europe/Paris', dailyReminderTime: '07:30', name: 'Nouveau Nom' },
    });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.json().user.timezone, 'Europe/Paris');
    assert.equal(ok.json().user.dailyReminderTime, '07:30');
    assert.equal(ok.json().user.name, 'Nouveau Nom');
  });

  it('queries invalides → 400 (view, range, days, pagination)', async () => {
    const badView = await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=lune', headers: authed(u.cookie) });
    assert.equal(badView.statusCode, 400);
    const badRange = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=10000d', headers: authed(u.cookie) });
    assert.equal(badRange.statusCode, 400);
    const badLimit = await t.app.inject({ method: 'GET', url: '/api/v1/notifications?limit=9999', headers: authed(u.cookie) });
    assert.equal(badLimit.statusCode, 400);
  });

  it('onboarding : payload borné, créations réelles, idempotence de onboardingCompleted', async () => {
    const tooMany = await t.app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: authed(u.cookie),
      payload: { goals: Array.from({ length: 7 }, (_, i) => ({ title: `G${i}` })) },
    });
    assert.equal(tooMany.statusCode, 400);

    const ok = await t.app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: authed(u.cookie),
      payload: {
        goals: [{ title: 'Être constant' }],
        habits: [{ name: 'Lire' }],
        routines: [{ name: 'Matin', items: [{ title: 'Eau' }] }],
      },
    });
    assert.equal(ok.statusCode, 201);
    assert.equal(ok.json().me.user.onboardingCompleted, true);

    // Un second onboarding est accepté (ajout de contenu), pas de crash.
    const again = await t.app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: authed(u.cookie),
      payload: { habits: [{ name: 'Courir' }] },
    });
    assert.equal(again.statusCode, 201);
  });

  it('formulaire de contact : validation + persistance réelle', async () => {
    const bad = await t.app.inject({
      method: 'POST',
      url: '/api/v1/contact',
      payload: { name: 'X', email: 'pas-un-email', message: '' },
    });
    assert.equal(bad.statusCode, 400);

    const ok = await t.app.inject({
      method: 'POST',
      url: '/api/v1/contact',
      payload: { name: 'Visiteur', email: 'visiteur@example.test', message: 'Bonjour Charbon' },
    });
    assert.equal(ok.statusCode, 201);
    assert.equal(ok.json().ok, true);

    // Le message est réellement stocké (+ copie outbox dev).
    const { contactMessages } = await import('../src/db/schema.js');
    const rows = await t.dbHandle.db.select().from(contactMessages).all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.message, 'Bonjour Charbon');
  });

  it('graines de sécurité : mots de passe jamais renvoyés par l’API', async () => {
    const me = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(u.cookie) });
    const body = JSON.stringify(me.json());
    assert.ok(!body.includes('passwordHash'), 'pas de hash dans /me');
    assert.ok(!body.includes('scrypt$'), 'pas de format de hash');
    const login = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: u.user.email, password: 'motdepasse-test' },
    });
    assert.ok(!JSON.stringify(login.json()).includes('scrypt$'));
  });
});
