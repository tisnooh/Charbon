/**
 * Isolation des données entre utilisateurs — exigence absolue (spec Phase 6/7) :
 * « Un utilisateur ne doit jamais accéder aux données d’un autre utilisateur. »
 * Chaque accès croisé doit répondre 404 (ne révèle pas l'existence).
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { authed, makeTestApp, registerUser, type RegisteredUser, type TestApp } from './helpers.js';

describe('isolation inter-utilisateurs', () => {
  let t: TestApp;
  let a: RegisteredUser;
  let b: RegisteredUser;
  let ids: {
    goal: string;
    task: string;
    habit: string;
    routine: string;
    item: string;
  };

  before(async () => {
    t = await makeTestApp();
    a = await registerUser(t, { name: 'Alice', timezone: 'UTC' });
    b = await registerUser(t, { name: 'Bob', timezone: 'UTC' });

    const goal = await t.app.inject({ method: 'POST', url: '/api/v1/goals', headers: authed(a.cookie), payload: { title: 'Goal A' } });
    const task = await t.app.inject({ method: 'POST', url: '/api/v1/tasks', headers: authed(a.cookie), payload: { title: 'Task A' } });
    const habit = await t.app.inject({ method: 'POST', url: '/api/v1/habits', headers: authed(a.cookie), payload: { name: 'Habit A' } });
    const routine = await t.app.inject({
      method: 'POST',
      url: '/api/v1/routines',
      headers: authed(a.cookie),
      payload: { name: 'Routine A', items: [{ title: 'Item A' }] },
    });
    ids = {
      goal: goal.json().id,
      task: task.json().id,
      habit: habit.json().id,
      routine: routine.json().id,
      item: routine.json().items[0].id,
    };
  });
  after(async () => {
    await t.dispose();
  });

  it('B ne peut ni lire ni écrire les ressources de A (404 partout)', async () => {
    const cases: Array<[string, string, Record<string, unknown>?]> = [
      ['GET', `/api/v1/goals/${ids.goal}`],
      ['PATCH', `/api/v1/goals/${ids.goal}`, { title: 'hijack' }],
      ['PATCH', `/api/v1/goals/${ids.goal}/status`, { status: 'archived' }],
      ['DELETE', `/api/v1/goals/${ids.goal}`],
      ['GET', `/api/v1/tasks/${ids.task}`],
      ['PATCH', `/api/v1/tasks/${ids.task}`, { title: 'hijack' }],
      ['POST', `/api/v1/tasks/${ids.task}/complete`],
      ['POST', `/api/v1/tasks/${ids.task}/uncomplete`],
      ['DELETE', `/api/v1/tasks/${ids.task}`],
      ['POST', `/api/v1/tasks/${ids.task}/restore`],
      ['GET', `/api/v1/habits/${ids.habit}`],
      ['PATCH', `/api/v1/habits/${ids.habit}`, { name: 'hijack' }],
      ['POST', `/api/v1/habits/${ids.habit}/pause`],
      ['POST', `/api/v1/habits/${ids.habit}/resume`],
      ['DELETE', `/api/v1/habits/${ids.habit}`],
      ['POST', `/api/v1/habits/${ids.habit}/completions`, {}],
      ['GET', `/api/v1/habits/${ids.habit}/history?days=7`],
      ['GET', `/api/v1/routines/${ids.routine}`],
      ['PATCH', `/api/v1/routines/${ids.routine}`, { name: 'hijack' }],
      ['DELETE', `/api/v1/routines/${ids.routine}`],
      ['POST', `/api/v1/routines/${ids.routine}/items`, { title: 'intrus' }],
      ['PATCH', `/api/v1/routines/${ids.routine}/items/${ids.item}`, { title: 'hijack' }],
      ['DELETE', `/api/v1/routines/${ids.routine}/items/${ids.item}`],
      ['POST', `/api/v1/routines/${ids.routine}/items/${ids.item}/completions`, {}],
    ];
    for (const [method, url, payload] of cases) {
      const res = await t.app.inject({
        method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
        url,
        headers: authed(b.cookie),
        ...(payload ? { payload } : {}),
      });
      assert.equal(res.statusCode, 404, `${method} ${url} → ${res.statusCode} (${res.body})`);
    }
  });

  it('DELETE complétion d’habitude de A par B → 404', async () => {
    const res = await t.app.inject({
      method: 'DELETE',
      url: `/api/v1/habits/${ids.habit}/completions/2026-09-18`,
      headers: authed(b.cookie),
    });
    assert.equal(res.statusCode, 404);
  });

  it('attachement croisé refusé : tâche/habitude de B sur goal de A → 404', async () => {
    const task = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(b.cookie),
      payload: { title: 'Task B', goalId: ids.goal },
    });
    assert.equal(task.statusCode, 404);
    const habit = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(b.cookie),
      payload: { name: 'Habit B', goalId: ids.goal },
    });
    assert.equal(habit.statusCode, 404);
  });

  it('listes strictement séparées (goals/tasks/habits/routines/notifications)', async () => {
    const goalsB = (await t.app.inject({ method: 'GET', url: '/api/v1/goals', headers: authed(b.cookie) })).json().items;
    assert.ok(!goalsB.some((g: { id: string }) => g.id === ids.goal));
    const tasksB = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=all', headers: authed(b.cookie) })).json().items;
    assert.ok(!tasksB.some((x: { id: string }) => x.id === ids.task));
    const habitsB = (await t.app.inject({ method: 'GET', url: '/api/v1/habits', headers: authed(b.cookie) })).json().items;
    assert.ok(!habitsB.some((x: { id: string }) => x.id === ids.habit));
    const routinesB = (await t.app.inject({ method: 'GET', url: '/api/v1/routines', headers: authed(b.cookie) })).json().items;
    assert.ok(!routinesB.some((x: { id: string }) => x.id === ids.routine));
    const todayB = (await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(b.cookie) })).json();
    assert.deepEqual(todayB.goals, []);
  });

  it('les données de A restent intactes après les tentatives de B', async () => {
    const goal = await t.app.inject({ method: 'GET', url: `/api/v1/goals/${ids.goal}`, headers: authed(a.cookie) });
    assert.equal(goal.statusCode, 200);
    assert.equal(goal.json().title, 'Goal A');
    const task = await t.app.inject({ method: 'GET', url: `/api/v1/tasks/${ids.task}`, headers: authed(a.cookie) });
    assert.equal(task.json().status, 'pending');
    const habit = await t.app.inject({ method: 'GET', url: `/api/v1/habits/${ids.habit}`, headers: authed(a.cookie) });
    assert.equal(habit.json().name, 'Habit A');
    assert.equal(habit.json().pausedAt, null);
  });

  it('suppression du compte A : B intact, ressources de A introuvables pour tous', async () => {
    const del = await t.app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/account',
      headers: authed(a.cookie),
      payload: { password: 'motdepasse-test' },
    });
    assert.equal(del.statusCode, 200);

    const goalsB = (await t.app.inject({ method: 'GET', url: '/api/v1/goals', headers: authed(b.cookie) })).json().items;
    assert.ok(Array.isArray(goalsB));
    const taskA = await t.app.inject({ method: 'GET', url: `/api/v1/tasks/${ids.task}`, headers: authed(b.cookie) });
    assert.equal(taskA.statusCode, 404);
    const meA = await t.app.inject({ method: 'GET', url: '/api/v1/me', headers: authed(a.cookie) });
    assert.equal(meA.statusCode, 401);
  });
});
