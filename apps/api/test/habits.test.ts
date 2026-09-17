/** Tests Habitudes : CRUD, pause/reprise, validations, streaks, historique, gating Premium. */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { addDays, todayInTz, weekdayOf } from '@charbon/shared';
import { eq } from 'drizzle-orm';
import { habitCompletions } from '../src/db/schema.js';
import { authed, makeTestApp, registerUser, type RegisteredUser, type TestApp } from './helpers.js';

const TZ = 'UTC';

describe('habits', () => {
  let t: TestApp;
  let u: RegisteredUser;
  before(async () => {
    t = await makeTestApp();
    u = await registerUser(t, { timezone: TZ });
  });
  after(async () => {
    await t.dispose();
  });

  async function createHabit(payload: Record<string, unknown>) {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(u.cookie),
      payload,
    });
    assert.equal(res.statusCode, 201, res.body);
    return res.json();
  }

  it('création daily : startDate = aujourd’hui, streaks à 0', async () => {
    const h = await createHabit({ name: 'Méditer', color: '#22C55E' });
    assert.equal(h.startDate, todayInTz(TZ));
    assert.deepEqual(h.schedule, { type: 'daily', days: [] });
    assert.equal(h.currentStreak, 0);
    assert.equal(h.doneToday, false);
    assert.equal(h.expectedToday, true);
    assert.equal(h.pausedAt, null);
  });

  it('création days_of_week normalisée (doublons triés)', async () => {
    const h = await createHabit({ name: 'Sport', schedule: { type: 'days_of_week', days: [5, 1, 1, 3] } });
    assert.deepEqual(h.schedule, { type: 'days_of_week', days: [1, 3, 5] });
    const today = todayInTz(TZ);
    const expectedToday = [1, 3, 5].includes(weekdayOf(today));
    assert.equal(h.expectedToday, expectedToday);
  });

  it('création invalide refusée (nom vide, jours vides, couleur invalide)', async () => {
    for (const payload of [
      { name: '   ' },
      { name: 'x', schedule: { type: 'days_of_week', days: [] } },
      { name: 'x', color: 'rouge' },
      { name: 'x', startDate: '2026-02-30' },
    ]) {
      const res = await t.app.inject({
        method: 'POST',
        url: '/api/v1/habits',
        headers: authed(u.cookie),
        payload,
      });
      assert.equal(res.statusCode, 400, JSON.stringify(payload));
    }
  });

  it('startDate hors fenêtre ±365 j refusée', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: authed(u.cookie),
      payload: { name: 'Trop loin', startDate: addDays(todayInTz(TZ), -400) },
    });
    assert.equal(res.statusCode, 400);
  });

  it('validation du jour : doneToday + streak 1 ; idempotent (1 seule ligne)', async () => {
    const h = await createHabit({ name: 'Lire' });
    const r1 = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    assert.equal(r1.statusCode, 200);
    assert.equal(r1.json().done, true);
    assert.equal(r1.json().date, todayInTz(TZ));
    assert.equal(r1.json().streak.current, 1);

    await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    const rows = await t.dbHandle.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.habitId, h.id))
      .all();
    assert.equal(rows.length, 1, 'pas de doublon');
  });

  it('validation future refusée, antidatée avant startDate refusée', async () => {
    const h = await createHabit({ name: 'Journal', startDate: addDays(todayInTz(TZ), -2) });
    const future = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: { date: addDays(todayInTz(TZ), 1) },
    });
    assert.equal(future.statusCode, 400);
    const tooOld = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: { date: addDays(todayInTz(TZ), -3) },
    });
    assert.equal(tooOld.statusCode, 400);
  });

  it('dévalidation : streak recalculé', async () => {
    const h = await createHabit({ name: 'Étirements' });
    await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    const undo = await t.app.inject({
      method: 'DELETE',
      url: `/api/v1/habits/${h.id}/completions/${todayInTz(TZ)}`,
      headers: authed(u.cookie),
    });
    assert.equal(undo.statusCode, 200);
    assert.equal(undo.json().done, false);
    assert.equal(undo.json().streak.current, 0);
  });

  it('série de 3 jours puis aujourd’hui : current = 4', async () => {
    const today = todayInTz(TZ);
    const h = await createHabit({ name: 'Marcher', startDate: addDays(today, -3) });
    for (const d of [addDays(today, -3), addDays(today, -2), addDays(today, -1), today]) {
      const r = await t.app.inject({
        method: 'POST',
        url: `/api/v1/habits/${h.id}/completions`,
        headers: authed(u.cookie),
        payload: { date: d },
      });
      assert.equal(r.statusCode, 200);
    }
    const list = (await t.app.inject({ method: 'GET', url: '/api/v1/habits', headers: authed(u.cookie) })).json();
    const habit = list.items.find((x: { id: string }) => x.id === h.id);
    assert.equal(habit.currentStreak, 4);
    assert.equal(habit.longestStreak, 4);
    assert.equal(habit.doneToday, true);
  });

  it('pause : plus de validation possible ; reprise : de nouveau possible', async () => {
    const h = await createHabit({ name: 'Réveil 6h' });
    const pause = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/pause`,
      headers: authed(u.cookie),
    });
    assert.equal(pause.statusCode, 200);
    assert.ok(pause.json().pausedAt);
    assert.equal(pause.json().expectedToday, false, 'jour suspendu non attendu');

    const completeWhilePaused = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    assert.equal(completeWhilePaused.statusCode, 409);
    assert.equal(completeWhilePaused.json().error.code, 'habit_paused');

    const doublePause = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/pause`,
      headers: authed(u.cookie),
    });
    assert.equal(doublePause.statusCode, 409);

    const resume = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/resume`,
      headers: authed(u.cookie),
    });
    assert.equal(resume.statusCode, 200);
    assert.equal(resume.json().pausedAt, null);
    assert.equal(resume.json().expectedToday, true, 'jour de reprise attendu');

    const complete = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    assert.equal(complete.statusCode, 200);

    const resumeAgain = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/resume`,
      headers: authed(u.cookie),
    });
    assert.equal(resumeAgain.statusCode, 409, 'reprise sans pause = conflit');
  });

  it('mise à jour : nom, couleur, planning', async () => {
    const h = await createHabit({ name: 'Avant' });
    const res = await t.app.inject({
      method: 'PATCH',
      url: `/api/v1/habits/${h.id}`,
      headers: authed(u.cookie),
      payload: { name: 'Après', color: '#8B5CF6', schedule: { type: 'days_of_week', days: [2, 4] } },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().name, 'Après');
    assert.equal(res.json().color, '#8B5CF6');
    assert.deepEqual(res.json().schedule, { type: 'days_of_week', days: [2, 4] });
  });

  it('suppression douce : disparaît des listes, données conservées', async () => {
    const h = await createHabit({ name: 'À supprimer' });
    await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: {},
    });
    const del = await t.app.inject({
      method: 'DELETE',
      url: `/api/v1/habits/${h.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(del.statusCode, 200);
    const list = (await t.app.inject({ method: 'GET', url: '/api/v1/habits', headers: authed(u.cookie) })).json();
    assert.ok(!list.items.some((x: { id: string }) => x.id === h.id));
    const rows = await t.dbHandle.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.habitId, h.id))
      .all();
    assert.equal(rows.length, 1, 'historique conservé en base');
    const getDeleted = await t.app.inject({
      method: 'GET',
      url: `/api/v1/habits/${h.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(getDeleted.statusCode, 404);
  });

  it('historique : fenêtre complète, borné à 30 j en Free, 90 j refusé', async () => {
    const h = await createHabit({ name: 'Historique' });
    const ok = await t.app.inject({
      method: 'GET',
      url: `/api/v1/habits/${h.id}/history?days=7`,
      headers: authed(u.cookie),
    });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.json().history.length, 7);

    const tooFar = await t.app.inject({
      method: 'GET',
      url: `/api/v1/habits/${h.id}/history?days=90`,
      headers: authed(u.cookie),
    });
    assert.equal(tooFar.statusCode, 403);
    assert.equal(tooFar.json().error.code, 'premium_required');
  });

  it('complétion sur jour non planifié : stockée mais streak inchangé', async () => {
    // Habitude lundi uniquement ; on valide un mardi (hors planning).
    const today = todayInTz(TZ);
    const start = addDays(today, -6);
    const h = await createHabit({
      name: 'Hebdo',
      startDate: start,
      schedule: { type: 'days_of_week', days: [1] },
    });
    // Trouver un mardi dans la fenêtre [start, today].
    let tuesday = start;
    while (weekdayOf(tuesday) !== 2) tuesday = addDays(tuesday, 1);
    const r = await t.app.inject({
      method: 'POST',
      url: `/api/v1/habits/${h.id}/completions`,
      headers: authed(u.cookie),
      payload: { date: tuesday },
    });
    assert.equal(r.statusCode, 200, 'validation hors planning acceptée (historique)');
    const hist = await t.app.inject({
      method: 'GET',
      url: `/api/v1/habits/${h.id}/history?days=7`,
      headers: authed(u.cookie),
    });
    const entry = hist.json().history.find((d: { date: string }) => d.date === tuesday);
    assert.equal(entry.expected, false);
    assert.equal(entry.completed, false, 'non comptée comme réalisation (jour non attendu)');
    const note = await t.app.inject({
      method: 'GET',
      url: `/api/v1/habits/${h.id}`,
      headers: authed(u.cookie),
    });
    assert.equal(note.json().currentStreak, 0, 'streak non prolongé par un jour hors planning');
  });
});
