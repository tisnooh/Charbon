import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computePerfectDayStreak, computeStreaks, type StreakInput } from '../src/streaks.js';
import type { Schedule } from '../src/schedule.js';
import { addDays, listDates } from '../src/time.js';

const daily: Schedule = { type: 'daily', days: [] };
const TODAY = '2026-09-18'; // vendredi (ancre vérifiée)

function base(overrides: Partial<StreakInput>): StreakInput {
  return {
    schedule: daily,
    startDate: '2026-09-10',
    completions: [],
    today: TODAY,
    ...overrides,
  };
}

describe('streaks — computeStreaks', () => {
  it('série complète jusqu’à aujourd’hui', () => {
    const r = computeStreaks(base({ completions: listDates('2026-09-10', TODAY) }));
    assert.equal(r.current, 9);
    assert.equal(r.longest, 9);
    assert.equal(r.completedToday, true);
    assert.equal(r.expectedToday, true);
    assert.equal(r.atRiskToday, false);
  });

  it('aujourd’hui pas encore fait : streak en sursis (compte jusqu’à hier)', () => {
    const r = computeStreaks(base({ completions: listDates('2026-09-10', '2026-09-17') }));
    assert.equal(r.current, 8);
    assert.equal(r.atRiskToday, true);
    assert.equal(r.completedToday, false);
  });

  it('hier raté : streak cassé', () => {
    const r = computeStreaks(base({ completions: listDates('2026-09-10', '2026-09-16') }));
    assert.equal(r.current, 0);
    assert.equal(r.longest, 7);
  });

  it('jours non planifiés transparents (lun/mer/ven)', () => {
    // Semaine du 7 (lun) au 18 (ven) : attendus = 7,9,11,14,16,18.
    const r = computeStreaks(
      base({
        schedule: { type: 'days_of_week', days: [1, 3, 5] },
        startDate: '2026-09-07',
        completions: ['2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14', '2026-09-18'],
      }),
    );
    // 16 (mer) raté casse la série ; 18 (ven, today) fait → current = 1.
    assert.equal(r.current, 1);
    assert.equal(r.longest, 4); // 7,9,11,14
  });

  it('suspension : la série traverse la pause sans se casser', () => {
    const r = computeStreaks(
      base({
        completions: [
          '2026-09-10',
          '2026-09-11',
          '2026-09-15',
          '2026-09-16',
          '2026-09-17',
          '2026-09-18',
        ],
        pauses: [{ from: '2026-09-12', to: '2026-09-15' }],
      }),
    );
    // Attendus : 10,11,15,16,17,18 — tous complétés → 6.
    assert.equal(r.current, 6);
    assert.equal(r.longest, 6);
  });

  it('suspension en cours (to = null) : plus de jours attendus, streak gelé', () => {
    const r = computeStreaks(
      base({
        completions: ['2026-09-10', '2026-09-11'],
        pauses: [{ from: '2026-09-12', to: null }],
      }),
    );
    assert.equal(r.expectedToday, false);
    assert.equal(r.current, 2); // 10 et 11 restent acquis
  });

  it('complétion sur jour non attendu : historique conservé, streak non prolongé', () => {
    const r = computeStreaks(
      base({
        schedule: { type: 'days_of_week', days: [5] }, // vendredis
        startDate: '2026-09-04',
        completions: ['2026-09-04', '2026-09-08', '2026-09-11'], // 08 = mardi (hors planning)
      }),
    );
    // Attendus vendredis : 4, 11, 18. Today (18) non fait → sursis → 11 ✓, 4 ✓ → 2.
    assert.equal(r.current, 2);
    assert.equal(r.atRiskToday, true);
  });

  it('habitude future (startDate > today) : rien d’attendu', () => {
    const r = computeStreaks(base({ startDate: '2026-10-01' }));
    assert.equal(r.current, 0);
    assert.equal(r.longest, 0);
    assert.equal(r.expectedToday, false);
    assert.equal(r.completionRate30d, 0);
  });

  it('taux 30 jours exact', () => {
    // 30 derniers jours (2026-08-20 → 2026-09-18) : 15 premiers complétés.
    const r = computeStreaks(
      base({ startDate: '2026-08-20', completions: listDates('2026-08-20', '2026-09-03') }),
    );
    assert.equal(r.completionRate30d, 0.5);
  });

  it('horizon borne le calcul du streak le plus long', () => {
    // 20 jours complétés d’affilée, mais horizon de 7 jours.
    const r = computeStreaks(
      base({ startDate: '2026-08-30', completions: listDates('2026-08-30', TODAY), horizonDays: 7 }),
    );
    assert.equal(r.longest, 7);
    assert.equal(r.current, 7); // le courant est également borné par la fenêtre
  });

  it('tolère des complétions en doublon ou hors fenêtre', () => {
    const r = computeStreaks(
      base({ completions: ['2026-09-17', '2026-09-17', '2026-01-01', TODAY, '2027-01-01'] }),
    );
    // 2027 ignoré (> today n’apparaît pas dans expected) ; current = 2 (17, 18).
    assert.equal(r.current, 2);
  });
});

describe('streaks — computePerfectDayStreak', () => {
  it('jours parfaits consécutifs, aujourd’hui en sursis', () => {
    const days = new Map([
      ['2026-09-16', { expected: 2, completed: 2 }],
      ['2026-09-17', { expected: 3, completed: 3 }],
      ['2026-09-18', { expected: 2, completed: 1 }],
    ]);
    const r = computePerfectDayStreak({ days, today: TODAY });
    assert.equal(r.current, 2); // sursis aujourd’hui → 16 et 17 comptent
    assert.equal(r.longest, 2);
  });

  it('jour de repos (absent de la map) : transparent', () => {
    const days = new Map([
      ['2026-09-15', { expected: 1, completed: 1 }],
      // 16 et 17 absents : rien d’attendu
      ['2026-09-18', { expected: 1, completed: 1 }],
    ]);
    const r = computePerfectDayStreak({ days, today: TODAY });
    assert.equal(r.current, 2); // 15 puis 18, repos ignoré
    assert.equal(r.longest, 2);
  });

  it('jour attendu raté : casse la série', () => {
    const days = new Map([
      ['2026-09-15', { expected: 1, completed: 1 }],
      ['2026-09-16', { expected: 2, completed: 1 }], // raté
      ['2026-09-17', { expected: 1, completed: 1 }],
      ['2026-09-18', { expected: 1, completed: 1 }],
    ]);
    const r = computePerfectDayStreak({ days, today: TODAY });
    assert.equal(r.current, 2); // 17, 18
    assert.equal(r.longest, 2);
  });

  it('aucune donnée : streaks à 0', () => {
    const r = computePerfectDayStreak({ days: new Map(), today: TODAY });
    assert.deepEqual(r, { current: 0, longest: 0 });
  });

  it('sursis seulement si aujourd’hui est attendu', () => {
    // Aujourd’hui absent (repos) : le streak courant part du dernier jour attendu.
    const days = new Map([
      ['2026-09-16', { expected: 1, completed: 1 }],
      ['2026-09-17', { expected: 1, completed: 1 }],
    ]);
    const r = computePerfectDayStreak({ days, today: TODAY });
    assert.equal(r.current, 2);
  });

  it('addDays utilisé pour l’horizon reste cohérent', () => {
    // 2025-09-19 → 2026-09-18 = 364 jours (février 2026 non bissextile, 28 j).
    assert.equal(addDays(TODAY, -364), '2025-09-19');
  });
});
