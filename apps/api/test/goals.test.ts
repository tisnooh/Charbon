/** Tests Objectifs : CRUD, statuts (actif/terminé/archivé), liens tâches/habitudes. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { authed, makeTestApp, registerUser, type RegisteredUser, type TestApp } from './helpers.js';

describe('goals', () => {
  let t: TestApp;
  let u: RegisteredUser;
  before(async () => {
    t = await makeTestApp();
    u = await registerUser(t, { timezone: 'UTC' });
  });
  after(async () => {
    await t.dispose();
  });

  it('cycle de vie complet : création → édition → complété → archivé → actif → supprimé', async () => {
    const created = await t.app.inject({
      method: 'POST',
      url: '/api/v1/goals',
      headers: authed(u.cookie),
      payload: { title: 'Courir un semi-marathon', description: 'Préparation 6 mois', targetDate: '2027-03-15' },
    });
    assert.equal(created.statusCode, 201);
    const goal = created.json();
    assert.equal(goal.status, 'active');
    assert.equal(goal.targetDate, '2027-03-15');

    const patched = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goal.id}`,
      headers: authed(u.cookie),
      payload: { title: 'Courir un marathon' },
    });
    assert.equal(patched.json().title, 'Courir un marathon');

    const completed = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goal.id}/status`,
      headers: authed(u.cookie),
      payload: { status: 'completed' },
    });
    assert.equal(completed.json().status, 'completed');

    const archived = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goal.id}/status`,
      headers: authed(u.cookie),
      payload: { status: 'archived' },
    });
    assert.equal(archived.json().status, 'archived');

    const reactivate = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${goal.id}/status`,
      headers: authed(u.cookie),
      payload: { status: 'active' },
    });
    assert.equal(reactivate.json().status, 'active');

    const del = await t.app.inject({
      method: 'DELETE',
      url: `/api/v1/goals/${goal.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(del.statusCode, 200);
    const get = await t.app.inject({
      method: 'GET',
      url: `/api/v1/goals/${goal.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(get.statusCode, 404);
  });

  it('filtrage par statut', async () => {
    await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(u.cookie), payload: { title: 'Actif 1' } });
    const g2 = await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(u.cookie), payload: { title: 'Archivé 1' } });
    await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${g2.json().id}/status`,
      headers: authed(u.cookie),
      payload: { status: 'archived' },
    });

    const active = (await t.app.inject({ method: 'GET', url: '/api/v1/goals?status=active', headers: authed(u.cookie) })).json().items;
    assert.ok(active.every((g: { status: string }) => g.status === 'active'));
    const archived = (await t.app.inject({ method: 'GET', url: '/api/v1/goals?status=archived', headers: authed(u.cookie) })).json().items;
    assert.equal(archived.length, 1);
    assert.equal(archived[0].title, 'Archivé 1');

    const badStatus = await t.app.inject({ method: 'GET', url: '/api/v1/goals?status=nimporte', headers: authed(u.cookie) });
    assert.equal(badStatus.statusCode, 400);
  });

  it('suppression d’objectif : tâches/habitudes liées conservées, goalId → null', async () => {
    const goal = await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(u.cookie), payload: { title: 'Objectif lien' } });
    const task = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(u.cookie),
      payload: { title: 'Tâche liée', goalId: goal.json().id },
    });
    const habit = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(u.cookie),
      payload: { name: 'Habitude liée', goalId: goal.json().id },
    });
    assert.equal(task.json().goalId, goal.json().id);
    assert.equal(habit.json().goalId, goal.json().id);

    await t.app.inject({ method: 'DELETE', url: `/api/v1/goals/${goal.json().id}`, headers: authed(u.cookie) });

    const taskAfter = await t.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.json().id}`, headers: authed(u.cookie) });
    assert.equal(taskAfter.statusCode, 200, 'tâche conservée');
    assert.equal(taskAfter.json().goalId, null);
    const habitAfter = await t.app.inject({ method: 'GET', url: `/api/v1/habits/${habit.json().id}`, headers: authed(u.cookie) });
    assert.equal(habitAfter.statusCode, 200, 'habitude conservée');
    assert.equal(habitAfter.json().goalId, null);
  });

  it('validation : titre requis, PATCH vide refusé', async () => {
    const bad = await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(u.cookie), payload: { title: '' } });
    assert.equal(bad.statusCode, 400);
    const g = await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(u.cookie), payload: { title: 'Valide' } });
    const emptyPatch = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/goals/${g.json().id}`,
      headers: authed(u.cookie),
      payload: {},
    });
    assert.equal(emptyPatch.statusCode, 400);
  });
});
