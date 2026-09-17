/**
 * PARCOURS VISITEUR COMPLET (spec Phase 9) — exécuté réellement contre
 * l'application (HTTP via inject) :
 * inscription → onboarding → dashboard → création tâche/habitude/routine →
 * validations → statistiques → déconnexion → reconnexion → données présentes.
 * Plus : refresh de session, erreurs de validation, données vides.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { addDays, todayInTz } from '@charbon/shared';
import { authed, makeTestApp, registerUser, sessionCookie, loginAs, uniqueEmail, type TestApp } from './helpers.js';

const TZ = 'UTC';

describe('journey — parcours visiteur complet', () => {
  let t: TestApp;
  before(async () => {
    t = await makeTestApp();
  });
  after(async () => {
    await t.dispose();
  });

  it('health répond', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/health' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, 'ok');
  });

  const email = uniqueEmail('journey');
  const password = 'parcours-complet1';
  let cookie = '';
  let taskId = '';
  let habitId = '';
  let routineId = '';
  let goalId = '';

  it('1. visiteur → inscription → session immédiate', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Jour', email, password, timezone: TZ },
    });
    assert.equal(res.statusCode, 201);
    cookie = sessionCookie(res) as string;
    assert.ok(cookie);
    assert.equal(res.json().user.onboardingCompleted, false);
  });

  it('2. dashboard vide (empty states réels : aucune donnée inventée)', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) });
    assert.equal(res.statusCode, 200);
    const today = res.json();
    assert.equal(today.date, todayInTz(TZ));
    assert.deepEqual(today.tasks, []);
    assert.deepEqual(today.habits, []);
    assert.deepEqual(today.routines, []);
    assert.deepEqual(today.goals, []);
    assert.deepEqual(today.progress, { expected: 0, completed: 0, rate: 0 });
    assert.deepEqual(today.streak, { current: 0, longest: 0 });
  });

  it('3. onboarding : objectif + 2 habitudes + routine matin (3 actions)', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: authed(cookie),
      payload: {
        goals: [{ title: 'Être plus constant' }],
        habits: [
          { name: 'Lire 10 minutes', color: '#F97316' },
          { name: 'Boire 1,5 L d’eau', color: '#38BDF8', schedule: { type: 'days_of_week', days: [1, 2, 3, 4, 5] } },
        ],
        routines: [
          {
            name: 'Routine matin',
            timeOfDay: 'morning',
            scheduledTime: '07:00',
            items: [{ title: 'Verre d’eau' }, { title: 'Étirements', durationMinutes: 5 }, { title: 'Pas de téléphone' }],
          },
        ],
      },
    });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.created.goals.length, 1);
    assert.equal(body.created.habits.length, 2);
    assert.equal(body.created.routines.length, 1);
    assert.equal(body.me.user.onboardingCompleted, true);
    goalId = body.created.goals[0].id;
  });

  it('4. dashboard reflète l’onboarding (attendu du jour)', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) });
    const today = res.json();
    assert.equal(today.habits.length, 2);
    assert.equal(today.routines.length, 1);
    assert.equal(today.goals.length, 1);
    const routine = today.routines[0];
    assert.equal(routine.itemsTotal, 3);
    assert.equal(routine.itemsDoneToday, 0);
    // Attendu : habitudes planifiées aujourd'hui + 3 actions de routine.
    const expectedHabits = today.habits.filter((h: { expectedToday: boolean }) => h.expectedToday).length;
    assert.equal(today.progress.expected, expectedHabits + 3);
    assert.equal(today.progress.completed, 0);
  });

  it('5. création d’une tâche datée d’aujourd’hui', async () => {
    const dueAt = new Date();
    dueAt.setUTCHours(18, 0, 0, 0);
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(cookie),
      payload: { title: 'Préparer ma journée de demain', dueAt: dueAt.toISOString(), goalId },
    });
    assert.equal(res.statusCode, 201);
    taskId = res.json().id;
    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) })).json();
    assert.equal(today.tasks.length, 1);
    assert.equal(today.tasks[0].id, taskId);
  });

  it('6. validations : habitude + actions de routine + tâche', async () => {
    const habitsRes = await t.app.inject({ method: 'GET', url: '/api/v1/habits', headers: authed(cookie) });
    habitId = habitsRes.json().items[0].id;

    const done = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habitId}/completions`,
      headers: authed(cookie),
      payload: {},
    });
    assert.equal(done.statusCode, 200);
    assert.equal(done.json().done, true);
    assert.equal(done.json().streak.current, 1);

    // Double validation = idempotente (pas de doublon, même état).
    const twice = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habitId}/completions`,
      headers: authed(cookie),
      payload: {},
    });
    assert.equal(twice.statusCode, 200);
    assert.equal(twice.json().streak.current, 1);

    const routinesToday = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(cookie) })).json().items;
    routineId = routinesToday[0].id;
    for (const item of routinesToday[0].items) {
      const r = await t.app.inject({
        method: 'POST',
        url: `/api/v1/routines/${routineId}/items/${item.id}/completions`,
        headers: authed(cookie),
        payload: {},
      });
      assert.equal(r.statusCode, 200);
    }
    const after = (await t.app.inject({ method: 'GET', url: '/api/v1/routines/today', headers: authed(cookie) })).json().items[0];
    assert.equal(after.itemsDoneToday, 3);
    assert.equal(after.doneToday, true);

    const taskDone = await t.app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${taskId}/complete`,
      headers: authed(cookie),
    });
    assert.equal(taskDone.statusCode, 200);
    assert.equal(taskDone.json().status, 'done');
    assert.ok(taskDone.json().completedAt);
  });

  it('7. annulation d’une complétion de tâche (restauration)', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${taskId}/uncomplete`,
      headers: authed(cookie),
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, 'pending');
    assert.equal(res.json().completedAt, null);
  });

  it('8. suppression de tâche puis restauration (corbeille)', async () => {
    const del = await t.app.inject({ method: 'DELETE', url: `/api/v1/tasks/${taskId}`, headers: authed(cookie) });
    assert.equal(del.statusCode, 200);
    const deletedView = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=deleted', headers: authed(cookie) })).json().items;
    assert.equal(deletedView.length, 1);
    const restore = await t.app.inject({ method: 'POST', url: `/api/v1/tasks/${taskId}/restore`, headers: authed(cookie) });
    assert.equal(restore.statusCode, 200);
    const todayView = (await t.app.inject({ method: 'GET', url: '/api/v1/tasks?view=today', headers: authed(cookie) })).json().items;
    assert.equal(todayView.length, 1);
  });

  it('9. statistiques cohérentes avec le dashboard', async () => {
    const stats = (await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=today', headers: authed(cookie) })).json();
    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) })).json();
    assert.equal(stats.totals.expected, today.progress.expected);
    assert.equal(stats.totals.completed, today.progress.completed);
    assert.equal(stats.days.length, 1);

    const week = (await t.app.inject({ method: 'GET', url: '/api/v1/stats/summary?range=7d', headers: authed(cookie) })).json();
    assert.equal(week.days.length, 7);
    assert.equal(week.days[6].date, today.date);
    assert.equal(typeof week.trendPoints, 'number');
    assert.equal(week.streak.current, today.streak.current);
  });

  it('10. déconnexion → données inaccessibles → reconnexion → TOUT est toujours là', async () => {
    const logout = await t.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: authed(cookie) });
    assert.equal(logout.statusCode, 200);
    const denied = await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) });
    assert.equal(denied.statusCode, 401);

    const newCookie = await loginAs(t, email, password);
    assert.ok(newCookie, 'reconnexion réussie');
    cookie = newCookie!;

    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) })).json();
    assert.equal(today.habits.length, 2);
    assert.equal(today.routines.length, 1);
    assert.equal(today.goals.length, 1);
    assert.equal(today.tasks.length, 1);
    const h = today.habits.find((x: { id: string }) => x.id === habitId);
    assert.equal(h.doneToday, true, 'validation d’habitude persistée');
    assert.equal(h.currentStreak, 1);
    const routine = today.routines[0];
    assert.equal(routine.doneToday, true, 'routine terminée persistée');
  });

  it('11. historique d’habitude : jours attendus/complétés exacts', async () => {
    const res = await t.app.inject({
      method: 'GET',
      url: `/api/v1/habits/${habitId}/history?days=7`,
      headers: authed(cookie),
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.history.length, 7);
    const todayEntry = body.history[6];
    assert.equal(todayEntry.date, todayInTz(TZ));
    assert.equal(todayEntry.expected, true);
    assert.equal(todayEntry.completed, true);
    assert.equal(body.habit.currentStreak, 1);
  });

  it('12. streak multi-jours : validations antidatées construites via l’API', async () => {
    // Habitude quotidienne démarrée il y a 3 jours, validée J-2, J-1 (J non fait).
    const start = addDays(todayInTz(TZ), -3);
    const created = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(cookie),
      payload: { name: 'Marcher', startDate: start },
    });
    assert.equal(created.statusCode, 201);
    const id = created.json().id as string;
    for (const d of [addDays(start, 1), addDays(start, 2)]) {
      const r = await t.app.inject({
        method: 'POST',
        url: `/api/v1/habits/${id}/completions`,
        headers: authed(cookie),
        payload: { date: d },
      });
      assert.equal(r.statusCode, 200);
    }
    const today = (await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(cookie) })).json();
    const habit = today.habits.find((h: { id: string }) => h.id === id);
    assert.equal(habit.currentStreak, 2, 'streak en sursis : 2 jours acquis, aujourd’hui non cassé');
    assert.equal(habit.atRiskToday, true);

    const done = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${id}/completions`,
      headers: authed(cookie),
      payload: {},
    });
    assert.equal(done.json().streak.current, 3);
  });

  it('13. erreurs et entrées vides gérées proprement', async () => {
    const emptyTitle = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(cookie),
      payload: { title: '   ' },
    });
    assert.equal(emptyTitle.statusCode, 400);

    const badId = await t.app.inject({ method: 'GET', url: '/api/v1/tasks/pas-un-uuid', headers: authed(cookie) });
    assert.equal(badId.statusCode, 404);

    const missing = await t.app.inject({
      method: 'GET',
      url: '/api/v1/tasks/11111111-1111-4111-8111-111111111111',
      headers: authed(cookie),
    });
    assert.equal(missing.statusCode, 404);

    const badJson = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { ...authed(cookie), 'content-type': 'application/json' },
      payload: '{invalide',
    });
    assert.equal(badJson.statusCode, 400);
  });
});

describe('journey — second utilisateur isolé (régression croisée)', () => {
  let t: TestApp;
  before(async () => {
    t = await makeTestApp();
  });
  after(async () => {
    await t.dispose();
  });

  it('deux comptes complets voient des données strictement séparées', async () => {
    const a = await registerUser(t, { name: 'A', timezone: TZ });
    const b = await registerUser(t, { name: 'B', timezone: TZ });

    const taskA = await t.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: authed(a.cookie),
      payload: { title: 'Tâche de A' },
    });
    const habitB = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(b.cookie),
      payload: { name: 'Habitude de B' },
    });

    // B ne voit rien de A.
    const todayB = (await t.app.inject({ method: 'GET', url: '/api/v1/today', headers: authed(b.cookie) })).json();
    assert.equal(todayB.tasks.length, 0);
    assert.equal(todayB.habits.length, 1);

    // Accès direct interdit (404 — nulle part ailleurs que le owner).
    const cross = await t.app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${taskA.json().id}`,
      headers: authed(b.cookie),
    });
    assert.equal(cross.statusCode, 404);
    const crossComplete = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habitB.json().id}/completions`,
      headers: authed(a.cookie),
      payload: {},
    });
    assert.equal(crossComplete.statusCode, 404);
  });
});
