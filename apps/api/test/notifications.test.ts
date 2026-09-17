/** Tests Notifications + rappel quotidien (tick de l’ordonnanceur appelé directement). */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { hmInTz } from '@charbon/shared';
import { tickReminders } from '../src/services/reminder-scheduler.js';
import { authed, makeTestApp, registerUser, type TestApp } from './helpers.js';

describe('notifications & rappels', () => {
  let t: TestApp;
  before(async () => {
    t = await makeTestApp();
  });
  after(async () => {
    await t.dispose();
  });

  it('liste vide au départ, unread=0', async () => {
    const u = await registerUser(t);
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/notifications', headers: authed(u.cookie) });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json().items, []);
    assert.equal(res.json().unread, 0);
  });

  it('tick de rappel : crée la notification à l’heure locale, une seule fois par jour', async () => {
    const u = await registerUser(t, { timezone: 'UTC' });

    // Active les rappels à l'heure locale « maintenant » (fuseau UTC).
    const now = new Date();
    const { hh, mm } = hmInTz(now, 'UTC');
    const reminderTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const patch = await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { remindersEnabled: true, dailyReminderTime: reminderTime },
    });
    assert.equal(patch.statusCode, 200);
    assert.equal(patch.json().user.remindersEnabled, true);
    assert.equal(patch.json().user.dailyReminderTime, reminderTime);

    const created = await tickReminders(t.dbHandle.db, now);
    assert.equal(created, 1);

    // Second tick dans la même minute : pas de doublon.
    const createdAgain = await tickReminders(t.dbHandle.db, new Date(now.getTime() + 10_000));
    assert.equal(createdAgain, 0);

    const list = await t.app.inject({ method: 'GET', url: '/api/v1/notifications', headers: authed(u.cookie) });
    assert.equal(list.json().items.length, 1);
    const notif = list.json().items[0];
    assert.equal(notif.type, 'daily_reminder');
    assert.equal(notif.readAt, null);
    assert.equal(list.json().unread, 1);

    // Le contenu reflète l'état réel du jour (rien de planifié ici → message dédié).
    assert.match(notif.title, /point Charbon/);

    // Marquage lu puis tout-lire.
    const read = await t.app.inject({ method: 'POST', url: `/api/v1/notifications/${notif.id}/read`, headers: authed(u.cookie) });
    assert.equal(read.statusCode, 200);
    assert.ok(read.json().readAt);
    const all = await t.app.inject({ method: 'POST', url: '/api/v1/notifications/read-all', headers: authed(u.cookie) });
    assert.equal(all.statusCode, 200);
    assert.equal(all.json().unread, 0);
  });

  it('tick hors heure : rien ne se crée ; utilisateur sans rappel ignoré', async () => {
    const u = await registerUser(t, { timezone: 'UTC' });
    await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { remindersEnabled: true, dailyReminderTime: '03:03' },
    });
    // 12:00 UTC ≠ 03:03.
    const created = await tickReminders(t.dbHandle.db, new Date('2026-09-18T12:00:00.000Z'));
    assert.equal(created, 0);

    // Désactivé → ignoré même à la bonne heure.
    await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { remindersEnabled: false },
    });
    const created2 = await tickReminders(t.dbHandle.db, new Date('2026-09-18T03:03:00.000Z'));
    assert.equal(created2, 0);
  });

  it('rappel avec actions restantes : le compte est réel', async () => {
    const u = await registerUser(t, { timezone: 'UTC' });
    await t.app.inject({ method: 'POST', url: '/api/v1/habits', headers: authed(u.cookie), payload: { name: 'H' } });
    await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(u.cookie),
      payload: { remindersEnabled: true, dailyReminderTime: '21:00' },
    });
    const created = await tickReminders(t.dbHandle.db, new Date('2026-09-18T21:00:00.000Z'));
    assert.equal(created, 1);
    const list = await t.app.inject({ method: 'GET', url: '/api/v1/notifications', headers: authed(u.cookie) });
    const body = list.json().items[0].body as string;
    assert.match(body, /1 action/, `message réel : "${body}"`);
  });

  it('notification d’un autre utilisateur : 404 sur markRead', async () => {
    const a = await registerUser(t);
    const b = await registerUser(t);
    // Crée une notification pour A via un tick ciblé (rappel à l'heure courante).
    const now = new Date();
    const { hh, mm } = hmInTz(now, 'UTC');
    await t.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: authed(a.cookie),
      payload: { remindersEnabled: true, dailyReminderTime: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` },
    });
    await tickReminders(t.dbHandle.db, now);
    const list = await t.app.inject({ method: 'GET', url: '/api/v1/notifications', headers: authed(a.cookie) });
    const id = list.json().items[0].id as string;
    const cross = await t.app.inject({ method: 'POST', url: `/api/v1/notifications/${id}/read`, headers: authed(b.cookie) });
    assert.equal(cross.statusCode, 404);
  });
});
