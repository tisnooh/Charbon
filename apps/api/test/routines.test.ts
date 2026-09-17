/** Tests Routines : structure, actions, validations du jour, planification. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { todayInTz, weekdayOf } from '@charbon/shared';
import { authed, makeTestApp, registerUser, type RegisteredUser, type TestApp } from './helpers.js';

const TZ = 'UTC';

describe('routines', () => {
  let t: TestApp;
  let u: RegisteredUser;
  before(async () => {
    t = await makeTestApp();
    u = await registerUser(t, { timezone: TZ });
  });
  after(async () => {
    await t.dispose();
  });

  async function create(payload: Record<string, unknown>) {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/routines',
      headers: authed(u.cookie),
      payload,
    });
    assert.equal(res.statusCode, 201, res.body);
    return res.json();
  }

  it('création avec actions ordonnées', async () => {
    const r = await create({
      name: 'Routine matin',
      timeOfDay: 'morning',
      scheduledTime: '07:00',
      items: [{ title: 'Verre d’eau' }, { title: 'Étirements', durationMinutes: 5 }],
    });
    assert.equal(r.name, 'Routine matin');
    assert.equal(r.items.length, 2);
    assert.deepEqual(
      r.items.map((i: { title: string; sortOrder: number }) => [i.title, i.sortOrder]),
      [
        ['Verre d’eau', 0],
        ['Étirements', 1],
      ],
    );
  });

  it('vue today : planifiée, progression dérivée des actions', async () => {
    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(u.cookie) })).json().items;
    assert.equal(today.length, 1);
    const r = today[0];
    assert.equal(r.scheduledToday, true);
    assert.equal(r.itemsTotal, 2);
    assert.equal(r.itemsDoneToday, 0);
    assert.equal(r.doneToday, false);
    assert.deepEqual(r.itemStates.map((s: { done: boolean }) => s.done), [false, false]);
  });

  it('validation d’actions : progression puis routine terminée', async () => {
    const list = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(u.cookie) })).json().items;
    const r = list[0];

    const done1 = await t.app.inject({
      method: 'POST',
      url: `/api/v1/routines/${r.id}/items/${r.items[0].id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    assert.equal(done1.statusCode, 200);
    assert.equal(done1.json().itemsDoneToday, 1);
    assert.equal(done1.json().doneToday, false);

    // Idempotent.
    await t.app.inject({
      method: 'POST',
      url: `/api/v1/routines/${r.id}/items/${r.items[0].id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    const stillOne = await t.app.inject({
      method: 'POST',
      url: `/api/v1/routines/${r.id}/items/${r.items[1].id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    assert.equal(stillOne.json().itemsDoneToday, 2);
    assert.equal(stillOne.json().doneToday, true);

    // Dévalidation d’une action → routine de nouveau incomplète.
    const undo = await t.app.inject({
      method: 'DELETE',
      url: `/api/v1/routines/${r.id}/items/${r.items[1].id}/completions/${todayInTz(TZ)}`,
      headers: authed(u.cookie),
    });
    assert.equal(undo.statusCode, 200);
    assert.equal(undo.json().doneToday, false);
    assert.equal(undo.json().itemsDoneToday, 1);
  });

  it('validation future refusée', async () => {
    const list = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(u.cookie) })).json().items;
    const r = list[0];
    const res = await t.app.inject({
      method: 'POST',
      url: `/api/v1/routines/${r.id}/items/${r.items[0].id}/completions`,
      headers: authed(u.cookie),
      payload: { date: '2030-01-01' },
    });
    assert.equal(res.statusCode, 400);
  });

  it('gestion des actions : ajout, modification, réordonnancement, suppression', async () => {
    const r0 = (await t.app.inject({ method: 'GET', url: '/api/v1/routines', headers: authed(u.cookie) })).json().items[0];

    const added = await t.app.inject({
      method: 'POST',
      url: `/api/v1/routines/${r0.id}/items`,
      headers: authed(u.cookie),
      payload: { title: 'Respiration', durationMinutes: 3 },
    });
    assert.equal(added.statusCode, 201);
    assert.equal(added.json().items.length, 3);
    const newItem = added.json().items[2];
    assert.equal(newItem.sortOrder, 2);

    // Réordonnancement atomique via la liste complète des ids.
    const otherIds = added.json().items.slice(0, 2).map((i: { id: string }) => i.id);
    const moved = await t.app.inject({
      method: 'PUT',
      url: `/api/v1/routines/${r0.id}/items/order`,
      headers: authed(u.cookie),
      payload: { itemIds: [newItem.id, ...otherIds] },
    });
    assert.equal(moved.statusCode, 200);
    assert.equal(moved.json().items[0].id, newItem.id, 'action déplacée en premier');
    assert.deepEqual(
      moved.json().items.map((i: { sortOrder: number }) => i.sortOrder),
      [0, 1, 2],
    );

    // Liste incomplète ou inconnue → 400.
    const badOrder = await t.app.inject({
      method: 'PUT',
      url: `/api/v1/routines/${r0.id}/items/order`,
      headers: authed(u.cookie),
      payload: { itemIds: [newItem.id] },
    });
    assert.equal(badOrder.statusCode, 400);
    const unknownOrder = await t.app.inject({
      method: 'PUT',
      url: `/api/v1/routines/${r0.id}/items/order`,
      headers: authed(u.cookie),
      payload: { itemIds: [newItem.id, ...otherIds.slice(0, 1), '11111111-1111-4111-8111-111111111111'] },
    });
    assert.equal(unknownOrder.statusCode, 400);

    const renamed = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/routines/${r0.id}/items/${newItem.id}`,
      headers: authed(u.cookie),
      payload: { title: 'Respiration 4-7-8' },
    });
    assert.equal(renamed.json().items[0].title, 'Respiration 4-7-8');

    const removed = await t.app.inject({
      method: 'DELETE',
      url: `/api/v1/routines/${r0.id}/items/${newItem.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(removed.statusCode, 200);
    assert.equal(removed.json().items.length, 2);
  });

  it('mise à jour de routine (nom, créneau, planning)', async () => {
    const r0 = (await t.app.inject({ method: 'GET', url: '/api/v1/routines', headers: authed(u.cookie) })).json().items[0];
    const res = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/routines/${r0.id}`,
      headers: authed(u.cookie),
      payload: { name: 'Routine matin v2', scheduledTime: '06:30', schedule: { type: 'days_of_week', days: [1, 2, 3, 4, 5] } },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().name, 'Routine matin v2');
    assert.equal(res.json().scheduledTime, '06:30');
    assert.deepEqual(res.json().schedule, { type: 'days_of_week', days: [1, 2, 3, 4, 5] });
  });

  it('routine non planifiée aujourd’hui : scheduledToday=false', async () => {
    // Choisit un jour de semaine DIFFÉRENT d'aujourd'hui.
    const notToday = (weekdayOf(todayInTz(TZ)) + 1) % 7;
    const r = await create({
      name: 'Routine hebdo',
      schedule: { type: 'days_of_week', days: [notToday] },
      items: [{ title: 'Bilan' }],
    });
    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(u.cookie) })).json().items;
    const found = today.find((x: { id: string }) => x.id === r.id);
    assert.equal(found.scheduledToday, false);
  });

  it('suppression douce : disparaît de today et de la liste', async () => {
    const r = await create({ name: 'Éphémère', items: [{ title: 'x' }] });
    const del = await t.app.inject({ method: 'DELETE', url: `/api/v1/routines/${r.id}`, headers: authed(u.cookie) });
    assert.equal(del.statusCode, 200);
    const list = (await t.app.inject({ method: 'GET', url: '/api/v1/routines', headers: authed(u.cookie) })).json().items;
    assert.ok(!list.some((x: { id: string }) => x.id === r.id));
    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(u.cookie) })).json().items;
    assert.ok(!today.some((x: { id: string }) => x.id === r.id));
    const get = await t.app.inject({ method: 'GET', url: `/api/v1/routines/${r.id}`, headers: authed(u.cookie) });
    assert.equal(get.statusCode, 404);
  });
});
