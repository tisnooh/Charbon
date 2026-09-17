import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  expectedDatesBetween,
  isPausedOn,
  isScheduledOn,
  normalizeSchedule,
  type Schedule,
} from '../src/schedule.js';

const daily: Schedule = { type: 'daily', days: [] };
const monWedFri: Schedule = { type: 'days_of_week', days: [1, 3, 5] };

describe('schedule — normalizeSchedule', () => {
  it('défaut = daily', () => {
    assert.deepEqual(normalizeSchedule(undefined), { type: 'daily', days: [] });
    assert.deepEqual(normalizeSchedule({ type: 'daily', days: [3] }), { type: 'daily', days: [] });
  });
  it('déduplique, trie et filtre les jours invalides', () => {
    assert.deepEqual(normalizeSchedule({ type: 'days_of_week', days: [5, 1, 5, 9, -2, 3] }), {
      type: 'days_of_week',
      days: [1, 3, 5],
    });
  });
});

describe('schedule — isScheduledOn', () => {
  it('daily : tous les jours', () => {
    assert.equal(isScheduledOn(daily, '2026-09-18'), true);
    assert.equal(isScheduledOn(daily, '2026-09-19'), true);
  });
  it('days_of_week : uniquement les jours choisis (2026-09-18 = vendredi)', () => {
    assert.equal(isScheduledOn(monWedFri, '2026-09-14'), true); // lundi
    assert.equal(isScheduledOn(monWedFri, '2026-09-15'), false); // mardi
    assert.equal(isScheduledOn(monWedFri, '2026-09-16'), true); // mercredi
    assert.equal(isScheduledOn(monWedFri, '2026-09-17'), false); // jeudi
    assert.equal(isScheduledOn(monWedFri, '2026-09-18'), true); // vendredi
  });
  it('rejette une date invalide', () => {
    assert.throws(() => isScheduledOn(daily, 'pas-une-date'));
  });
});

describe('schedule — isPausedOn', () => {
  it('from inclus, to exclus', () => {
    const pauses = [{ from: '2026-09-15', to: '2026-09-17' }];
    assert.equal(isPausedOn(pauses, '2026-09-14'), false);
    assert.equal(isPausedOn(pauses, '2026-09-15'), true);
    assert.equal(isPausedOn(pauses, '2026-09-16'), true);
    assert.equal(isPausedOn(pauses, '2026-09-17'), false); // jour de reprise
  });
  it('fenêtre ouverte (to = null) : suspendu indéfiniment', () => {
    const pauses = [{ from: '2026-09-15', to: null }];
    assert.equal(isPausedOn(pauses, '2026-09-20'), true);
    assert.equal(isPausedOn(pauses, '2026-09-14'), false);
  });
  it('sans pause : jamais suspendu', () => {
    assert.equal(isPausedOn([], '2026-09-15'), false);
  });
});

describe('schedule — expectedDatesBetween', () => {
  it('daily sans pause = toutes les dates', () => {
    assert.deepEqual(expectedDatesBetween(daily, '2026-09-14', '2026-09-18'), [
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
    ]);
  });
  it('daily avec pause : jours suspendus retirés', () => {
    const pauses = [{ from: '2026-09-15', to: '2026-09-17' }];
    assert.deepEqual(expectedDatesBetween(daily, '2026-09-14', '2026-09-18', pauses), [
      '2026-09-14',
      '2026-09-17',
      '2026-09-18',
    ]);
  });
  it('days_of_week : filtre par jour de semaine', () => {
    assert.deepEqual(expectedDatesBetween(monWedFri, '2026-09-14', '2026-09-20'), [
      '2026-09-14', // lun
      '2026-09-16', // mer
      '2026-09-18', // ven
    ]);
  });
  it('bornes inversées = liste vide', () => {
    assert.deepEqual(expectedDatesBetween(daily, '2026-09-18', '2026-09-14'), []);
  });
});
