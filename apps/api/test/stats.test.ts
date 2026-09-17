/** Tests Statistiques : agrégats exacts, plages, gating Premium, streak global. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { addDays, todayInTz } from '@charbon/shared';
import { authed, makeTestApp, registerUser, type RegisteredUser, type TestApp } from './helpers.js';

const TZ = 'UTC';

describe('stats', () => {
  let t: TestApp;
  let u: RegisteredUser;
  before(async () => {
    t = await makeTestApp();
    u = await registerUser(t, { timezone: TZ });
  });
  after(async () => {
    await t.dispose();
  });

  async function summary(range: string) {
    const res = await t.app.inject({
      method: 'GET',
      url: `/api/v1/stats/summary?range=${range}`,
      headers: authed(u.cookie),
    });
    return res;
  }

  it('compte vide : tout à zéro, taux 0', async () => {
    const res = await summary('today');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json().totals, { expected: 0, completed: 0, rate: 0 });
    assert.equal(res.json().serverToday, todayInTz(TZ));
  });

  it('agrégat exact : habitudes + routine + tâche', async () => {
    // 1 habitude daily + 1 routine (2 actions) + 1 tâche due aujourd'hui.
    const habit = await t.app.inject({ method: 'POST', url: '/api/v1/habits', headers: authed(u.cookie), payload: { name: 'H1' } });
    const routine = await t.app.inject({
      method: 'POST',
      url: '/api/v1/routines',
      headers: authed(u.cookie),
      payload: { name: 'R1', items: [{ title: 'a' }, { title: 'b' }] },
    });
    const dueAt = `${todayInTz(TZ)}T09:00:00.000Z`;
    await t.app.inject({ method: 'POST', url: '/api/v1/tasks', headers: authed(u.cookie), payload: { title: 'T1', dueAt } });

    const before = (await summary('today')).json();
    assert.deepEqual(before.totals, { expected: 4, completed: 0, rate: 0 }, '1 habitude + 2 actions + 1 tâche');

    // Complète habitude + 1 action + tâche.
    await t.app.inject({ method: 'POST', url: `/api/v1/habits/${habit.json().id}/completions`, headers: authed(u.cookie), payload: {} });
    await t.app.inject({
      method: 'POST',
      url: `/api/v1/routines/${routine.json().id}/items/${routine.json().items[0].id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    const tasks = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=today', headers: authed(u.cookie) })).json().items;
    await t.app.inject({ method: 'POST', url: `/api/v1/tasks/${tasks[0].id}/complete`, headers: authed(u.cookie) });

    const after = (await summary('today')).json();
    assert.deepEqual(after.totals, { expected: 4, completed: 3, rate: 0.75 });
    assert.equal(after.days.length, 1);
    assert.equal(after.days[0].date, todayInTz(TZ));
  });

  it('plage 7d : 7 jours bornés à aujourd’hui, trend numérique', async () => {
    const res = await summary('7d');
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.days.length, 7);
    assert.equal(body.days[6].date, todayInTz(TZ));
    assert.equal(body.days[0].date, addDays(todayInTz(TZ), -6));
    assert.equal(typeof body.trendPoints, 'number');
  });

  it('gating Premium : 90d/365d refusés en Free, accordés après upgrade (dev)', async () => {
    for (const range of ['90d', '365d']) {
      const free = await summary(range);
      assert.equal(free.statusCode, 403);
      assert.equal(free.json().error.code, 'premium_required');
    }
    const upgrade = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/upgrade', headers: authed(u.cookie) });
    assert.equal(upgrade.statusCode, 200);
    assert.equal(upgrade.json().plan, 'premium');

    const ok90 = await summary('90d');
    assert.equal(ok90.statusCode, 200);
    assert.equal(ok90.json().days.length, 90);
    const ok365 = await summary('365d');
    assert.equal(ok365.json().days.length, 365);

    // Retour en Free après résiliation → de nouveau refusé.
    const cancel = await t.app.inject({ method: 'POST', url: '/api/v1/subscription/cancel', headers: authed(u.cookie) });
    assert.equal(cancel.json().plan, 'free');
    const again = await summary('90d');
    assert.equal(again.statusCode, 403);
  });

  it('streak global « jours parfaits » : 2 jours complets consécutifs', async () => {
    // Nouvel utilisateur dédié pour un scénario propre.
    const u2 = await registerUser(t, { timezone: TZ });
    const today = todayInTz(TZ);
    const habit = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(u2.cookie),
      payload: { name: 'Unique', startDate: addDays(today, -2) },
    });
    // J-2 et J-1 parfaits (seule action attendue = habitude) ; aujourd'hui pas fait.
    for (const d of [addDays(today, -2), addDays(today, -1)]) {
      await t.app.inject({
        method: 'POST',
        url: `/api/v1/habits/${habit.json().id}/completions`,
        headers: authed(u2.cookie),
        payload: { date: d },
      });
    }
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=7d', headers: authed(u2.cookie) });
    assert.equal(res.json().streak.current, 2, 'sursis : aujourd’hui non fait ne casse pas');
    assert.equal(res.json().streak.longest, 2);

    // Aujourd'hui complété → 3.
    await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habit.json().id}/completions`,
      headers: authed(u2.cookie),
      payload: {},
    });
    const res2 = await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=7d', headers: authed(u2.cookie) });
    assert.equal(res2.json().streak.current, 3);
  });

  it('plage invalide → 400', async () => {
    const res = await summary('10000d');
    assert.equal(res.statusCode, 400);
  });
});
