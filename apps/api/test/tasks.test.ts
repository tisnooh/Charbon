/** Tests Tâches : CRUD, vues, échéances, complétion, corbeille/restauration. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { addDays, todayInTz } from '@charbon/shared';
import { authed, makeTestApp, registerUser, type RegisteredUser, type TestApp } from './helpers.js';

const TZ = 'UTC';

function isoDayNoon(day: string): string {
  return `${day}T12:00:00.000Z`;
}

describe('tasks', () => {
  let t: TestApp;
  let u: RegisteredUser;
  before(async () => {
    t = await makeTestApp();
    u = await registerUser(t, { timezone: TZ });
  });
  after(async () => {
    await t.dispose();
  });

  async function createTask(payload: Record<string, unknown>) {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(u.cookie),
      payload,
    });
    assert.equal(res.statusCode, 201, res.body);
    return res.json();
  }

  it('création + lecture + modification', async () => {
    const task = await createTask({ title: 'Acheter du pain', notes: 'Compléter les notes' });
    assert.equal(task.status, 'pending');
    assert.equal(task.dueAt, null);

    const get = await t.app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(get.statusCode, 200);
    assert.equal(get.json().title, 'Acheter du pain');

    const patch = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/tasks/${task.id}`,
      headers: authed(u.cookie),
      payload: { title: 'Acheter du pain complet', dueAt: isoDayNoon(todayInTz(TZ)) },
    });
    assert.equal(patch.statusCode, 200);
    assert.equal(patch.json().title, 'Acheter du pain complet');
    assert.equal(patch.json().dueAt, isoDayNoon(todayInTz(TZ)));
  });

  it('validation : titre requis, dueAt ISO complet exigé', async () => {
    const bad1 = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(u.cookie),
      payload: { title: '' },
    });
    assert.equal(bad1.statusCode, 400);
    const bad2 = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(u.cookie),
      payload: { title: 'x', dueAt: '2026-09-18T14:30' },
    });
    assert.equal(bad2.statusCode, 400);
  });

  it('complétion / décomplétion (restauration d’erreur)', async () => {
    const task = await createTask({ title: 'À faire' });
    const done = await t.app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/complete`,
      headers: authed(u.cookie),
    });
    assert.equal(done.json().status, 'done');
    assert.ok(done.json().completedAt);

    // Idempotent.
    const done2 = await t.app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/complete`,
      headers: authed(u.cookie),
    });
    assert.equal(done2.statusCode, 200);

    const undo = await t.app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/uncomplete`,
      headers: authed(u.cookie),
    });
    assert.equal(undo.json().status, 'pending');
    assert.equal(undo.json().completedAt, null);
  });

  it('vues : today (retard inclus), upcoming, all, done, deleted', async () => {
    const today = todayInTz(TZ);
    const overdue = await createTask({ title: 'En retard', dueAt: isoDayNoon(addDays(today, -2)) });
    const todayTask = await createTask({ title: 'Aujourd’hui', dueAt: isoDayNoon(today) });
    const future = await createTask({ title: 'Demain', dueAt: isoDayNoon(addDays(today, 1)) });
    const undated = await createTask({ title: 'Sans date' });

    const todayView = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=today', headers: authed(u.cookie) })).json().items;
    const ids = todayView.map((x: { id: string }) => x.id);
    assert.ok(ids.includes(overdue.id), 'tâche en retard visible dans today');
    assert.ok(ids.includes(todayTask.id));
    assert.ok(!ids.includes(future.id));
    assert.ok(!ids.includes(undated.id));

    const upcoming = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=upcoming', headers: authed(u.cookie) })).json().items;
    assert.ok(upcoming.some((x: { id: string }) => x.id === future.id));
    assert.ok(!upcoming.some((x: { id: string }) => x.id === todayTask.id));

    const all = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=all', headers: authed(u.cookie) })).json().items;
    assert.ok(all.some((x: { id: string }) => x.id === undated.id), 'tâche sans date dans all');

    await t.app.inject({ method: 'POST', url: `/api/v1/tasks/${todayTask.id}/complete`, headers: authed(u.cookie) });
    const doneView = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=done', headers: authed(u.cookie) })).json().items;
    assert.ok(doneView.some((x: { id: string }) => x.id === todayTask.id));

    await t.app.inject({ method: 'DELETE', url: `/api/v1/tasks/${undated.id}`, headers: authed(u.cookie) });
    const deletedView = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=deleted', headers: authed(u.cookie) })).json().items;
    assert.ok(deletedView.some((x: { id: string }) => x.id === undated.id));
    const allAfter = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=all', headers: authed(u.cookie) })).json().items;
    assert.ok(!allAfter.some((x: { id: string }) => x.id === undated.id), 'supprimée absente de all');

    const restored = await t.app.inject({ method: 'POST', url: `/api/v1/tasks/${undated.id}/restore`, headers: authed(u.cookie) });
    assert.equal(restored.statusCode, 200);
    const allRestored = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=all', headers: authed(u.cookie) })).json().items;
    assert.ok(allRestored.some((x: { id: string }) => x.id === undated.id), 'restaurée de retour');
  });

  it('tâche terminée mais en retard : reste dans today (vue du jour)', async () => {
    const today = todayInTz(TZ);
    const task = await createTask({ title: 'Faite en retard', dueAt: isoDayNoon(addDays(today, -1)) });
    await t.app.inject({ method: 'POST', url: `/api/v1/tasks/${task.id}/complete`, headers: authed(u.cookie) });
    const todayView = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=today', headers: authed(u.cookie) })).json().items;
    // done + due != today → pas dans la vue today (elle est dans done)
    assert.ok(!todayView.some((x: { id: string }) => x.id === task.id));
  });

  it('goalId d’un autre utilisateur refusé (404)', async () => {
    const other = await registerUser(t, { timezone: TZ });
    const goalOther = await t.app.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: authed(other.cookie),
      payload: { title: 'Objectif autre' },
    });
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(u.cookie),
      payload: { title: 'Task volée', goalId: goalOther.json().id },
    });
    assert.equal(res.statusCode, 404);
  });
});
