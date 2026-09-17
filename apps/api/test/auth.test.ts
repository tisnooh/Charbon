/**
 * Tests d'authentification de bout en bout (HTTP réel via fastify.inject) :
 * inscription, connexion, session, déconnexion, reset password (flux complet
 * via dev-outbox), changement de mot de passe, suppression de compte,
 * expiration de session.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { eq } from 'drizzle-orm';
import { addDays, todayInTz } from '@charbon/shared';
import { sessions } from '../src/db/schema.js';
import { authed, loginAs, makeTestApp, registerUser, sessionCookie, uniqueEmail, type TestApp } from './helpers.js';

describe('auth', () => {
  let t: TestApp;
  before(async () => {
    t = await makeTestApp();
  });
  after(async () => {
    await t.dispose();
  });

  it('inscription → 201 + cookie de session + profil Free', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Alice', email: 'alice@example.test', password: 'motdepasse1', timezone: 'Europe/Paris' },
    });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.user.email, 'alice@example.test');
    assert.equal(body.user.timezone, 'Europe/Paris');
    assert.equal(body.user.onboardingCompleted, false);
    assert.equal(body.plan, 'free');
    assert.ok(sessionCookie(res), 'cookie présent');

    const cookie = sessionCookie(res) as string;
    const me = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(cookie) });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.email, 'alice@example.test');
  });

  it('e-mail normalisé (majuscules/espaces) et doublon refusé', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Alice2', email: '  ALICE@Example.TEST ', password: 'motdepasse1' },
    });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error.code, 'email_taken');
  });

  it('inscription invalide → 400 validation_error', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'X', email: 'invalide', password: 'court' },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error.code, 'validation_error');
    assert.ok(Array.isArray(res.json().error.details));
  });

  it('connexion OK / mot de passe KO / compte inconnu KO (même message)', async () => {
    const email = uniqueEmail('login');
    await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Bob', email, password: 'motdepasse2' },
    });
    const ok = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: 'motdepasse2' },
    });
    assert.equal(ok.statusCode, 200);
    assert.ok(sessionCookie(ok));

    const badPass = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: 'mauvais' },
    });
    const unknown = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'personne@example.test', password: 'peuimporte' },
    });
    assert.equal(badPass.statusCode, 401);
    assert.equal(unknown.statusCode, 401);
    assert.equal(badPass.json().error.message, unknown.json().error.message);
  });

  it('/me sans session → 401 ; après logout → 401', async () => {
    const noSession = await t.app.inject({ method: 'GET', url: '/api/v1/me' });
    assert.equal(noSession.statusCode, 401);
    assert.equal(noSession.json().error.code, 'unauthorized');

    const u = await registerUser(t);
    const logout = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: authed(u.cookie),
    });
    assert.equal(logout.statusCode, 200);
    const after = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(u.cookie) });
    assert.equal(after.statusCode, 401);
  });

  it('session expirée → 401 (et ligne supprimée)', async () => {
    const u = await registerUser(t);
    await t.dbHandle.db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
      .where(eq(sessions.userId, u.user.id));
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(u.cookie) });
    assert.equal(res.statusCode, 401);
    const rows = await t.dbHandle.db.select().from(sessions).where(eq(sessions.userId, u.user.id)).all();
    assert.equal(rows.length, 0);
  });

  it('mot de passe oublié → e-mail (dev outbox) → reset → reconnexion ; token à usage unique', async () => {
    const email = uniqueEmail('reset');
    const reg = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Cara', email, password: 'ancien-mdp1' },
    });
    assert.equal(reg.statusCode, 201);

    const forgot = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email },
    });
    assert.equal(forgot.statusCode, 202);

    // L'e-mail est réellement produit (mode dev-outbox) et lisible via la route dev.
    const outbox = await t.app.inject({ method: 'GET', url: `/api/v1/dev/emails?to=${email}` });
    assert.equal(outbox.statusCode, 200);
    const items = outbox.json().items as Array<{ body: string; subject: string }>;
    const resets = items.filter((m) => m.subject.includes('Réinitialisation'));
    assert.equal(resets.length, 1, 'un seul e-mail de reset (bienvenue séparé)');
    const match = /token=([A-Za-z0-9_-]+)/.exec(resets[0]!.body);
    assert.ok(match, 'lien de reset présent dans l’e-mail');
    const token = match[1] as string;

    const reset = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token, password: 'nouveau-mdp1' },
    });
    assert.equal(reset.statusCode, 200);

    // Ancien mot de passe refusé, nouveau accepté.
    const oldLogin = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: 'ancien-mdp1' },
    });
    assert.equal(oldLogin.statusCode, 401);
    const newCookie = await loginAs(t, email, 'nouveau-mdp1');
    assert.ok(newCookie, 'reconnexion avec le nouveau mot de passe');

    // Token réutilisé → refusé.
    const reuse = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token, password: 'encore-un-mdp1' },
    });
    assert.equal(reuse.statusCode, 400);
    assert.equal(reuse.json().error.code, 'validation_error');

    // Token inventé → refusé.
    const fake = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: 'x'.repeat(43), password: 'encore-un-mdp1' },
    });
    assert.equal(fake.statusCode, 400);
  });

  it('forgot-password sur e-mail inconnu → même réponse 202, aucun e-mail', async () => {
    const ghost = 'fantome@example.test';
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: ghost },
    });
    assert.equal(res.statusCode, 202);
    const outbox = await t.app.inject({ method: 'GET', url: `/api/v1/dev/emails?to=${ghost}` });
    assert.equal(outbox.json().items.length, 0);
  });

  it('changement de mot de passe : révoque les AUTRES sessions, garde la courante', async () => {
    const email = uniqueEmail('change');
    await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Dan', email, password: 'mdp-initial1' },
    });
    const cookieA = await loginAs(t, email, 'mdp-initial1');
    const cookieB = await loginAs(t, email, 'mdp-initial1');
    assert.ok(cookieA && cookieB);

    const wrong = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: authed(cookieA!),
      payload: { currentPassword: 'faux', password: 'mdp-suivant1' },
    });
    assert.equal(wrong.statusCode, 403);

    const change = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: authed(cookieA!),
      payload: { currentPassword: 'mdp-initial1', password: 'mdp-suivant1' },
    });
    assert.equal(change.statusCode, 200);

    const meA = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(cookieA!) });
    assert.equal(meA.statusCode, 200, 'session courante conservée');
    const meB = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(cookieB!) });
    assert.equal(meB.statusCode, 401, 'autre session révoquée');
  });

  it('suppression de compte : mot de passe requis, cascade complète, e-mail réutilisable', async () => {
    const email = uniqueEmail('delete');
    const reg = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Eve', email, password: 'mdp-suppr1', timezone: 'UTC' },
    });
    const cookie = sessionCookie(reg) as string;
    const userId = reg.json().user.id as string;

    // Crée des données liées.
    await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(cookie), payload: { title: 'Objectif' } });
    await t.app.inject({ method: 'POST', url: '/api/v1/habits', headers: authed(cookie), payload: { name: 'Habitude' } });

    const wrongPass = await t.app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/account',
      headers: authed(cookie),
      payload: { password: 'mauvais' },
    });
    assert.equal(wrongPass.statusCode, 403);

    const del = await t.app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/account',
      headers: authed(cookie),
      payload: { password: 'mdp-suppr1' },
    });
    assert.equal(del.statusCode, 200);

    const me = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(cookie) });
    assert.equal(me.statusCode, 401);

    // Cascade vérifiée en base.
    const db = t.dbHandle.db;
    const { users, goals, habits, subscriptions } = await import('../src/db/schema.js');
    assert.equal((await db.select().from(users).all()).filter((u) => u.id === userId).length, 0);
    assert.equal((await db.select().from(goals).all()).filter((g) => g.userId === userId).length, 0);
    assert.equal((await db.select().from(habits).all()).filter((h) => h.userId === userId).length, 0);
    assert.equal(
      (await db.select().from(subscriptions).all()).filter((s) => s.userId === userId).length,
      0,
    );

    // Réinscription possible avec le même e-mail.
    const again = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Eve2', email, password: 'mdp-neuf1' },
    });
    assert.equal(again.statusCode, 201);
  });

  it('cookie httpOnly + SameSite=Lax posé à l’inscription', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Flora', email: uniqueEmail('cookie'), password: 'mdp-cookie1' },
    });
    const setCookie = res.headers['set-cookie'];
    const raw = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    assert.match(raw, /HttpOnly/i);
    assert.match(raw, /SameSite=Lax/i);
    assert.match(raw, /charbon_session=/);
  });

  it('today serveur suit le fuseau de l’utilisateur', async () => {
    // Utilisateur à Auckland : son « aujourd'hui » peut avoir une longueur
    // d'avance sur UTC ; on vérifie la cohérence avec le calcul partagé.
    const u = await registerUser(t, { timezone: 'Pacific/Auckland' });
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(u.cookie) });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().date, todayInTz('Pacific/Auckland'));
    // La borne « pas de validation future » utilise bien ce today.
    const habit = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(u.cookie),
      payload: { name: 'Méditer' },
    });
    const habitId = habit.json().id as string;
    const utcToday = todayInTz('UTC');
    const futureForUser = addDays(todayInTz('Pacific/Auckland'), 1);
    const res2 = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habitId}/completions`,
      headers: authed(u.cookie),
      payload: { date: futureForUser },
    });
    assert.equal(res2.statusCode, 400, 'validation future refusée dans le fuseau utilisateur');
    void utcToday;
  });
});
