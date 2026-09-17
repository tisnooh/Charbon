import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addDays,
  dateFromDateTime,
  dateInTz,
  diffDays,
  hmInTz,
  isISODate,
  isValidTimeZone,
  listDates,
  maxDate,
  minDate,
  parseISODate,
  todayInTz,
  weekdayOf,
} from '../src/time.js';

describe('time — isValidTimeZone', () => {
  it('accepte les fuseaux IANA valides', () => {
    assert.equal(isValidTimeZone('Europe/Paris'), true);
    assert.equal(isValidTimeZone('Pacific/Auckland'), true);
    assert.equal(isValidTimeZone('UTC'), true);
  });
  it('rejette les fuseaux invalides', () => {
    assert.equal(isValidTimeZone('Mars/Olympus'), false);
    assert.equal(isValidTimeZone(''), false);
    assert.equal(isValidTimeZone('GMT+99'), false);
  });
});

describe('time — dateInTz / passages de minuit', () => {
  // Ancres vérifiées via l'API Intl du runtime (2026-09-18T22:30Z).
  const instant = new Date('2026-09-18T22:30:00.000Z');
  it(' Auckland est déjà le 19 septembre', () => {
    assert.equal(dateInTz(instant, 'Pacific/Auckland'), '2026-09-19');
  });
  it('Honolulu est encore le 18 septembre', () => {
    assert.equal(dateInTz(instant, 'Pacific/Honolulu'), '2026-09-18');
  });
  it('Paris (UTC+2 en été) a passé minuit', () => {
    assert.equal(dateInTz(instant, 'Europe/Paris'), '2026-09-19');
    assert.deepEqual(hmInTz(instant, 'Europe/Paris'), { hh: 0, mm: 30 });
  });
  it('todayInTz renvoie une date civile valide', () => {
    assert.equal(isISODate(todayInTz('Europe/Paris')), true);
  });
});

describe('time — parseISODate', () => {
  it('accepte une date valide', () => {
    assert.notEqual(parseISODate('2026-02-28'), null);
    assert.notEqual(parseISODate('2024-02-29'), null); // bissextile
  });
  it('rejette une date calendaire impossible', () => {
    assert.equal(parseISODate('2026-02-30'), null);
    assert.equal(parseISODate('2025-02-29'), null); // 2025 non bissextile
    assert.equal(parseISODate('2026-13-01'), null);
  });
  it('rejette un mauvais format', () => {
    assert.equal(parseISODate('2026-2-3'), null);
    assert.equal(parseISODate('nope'), null);
    assert.equal(parseISODate(''), null);
  });
});

describe('time — addDays / diffDays / listDates', () => {
  it('franchit les fins de mois et années', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(addDays('2024-03-01', -1), '2024-02-29'); // bissextile
  });
  it('diffDays est signé', () => {
    assert.equal(diffDays('2026-09-01', '2026-09-18'), 17);
    assert.equal(diffDays('2026-09-18', '2026-09-01'), -17);
    assert.equal(diffDays('2026-09-18', '2026-09-18'), 0);
  });
  it('listDates est inclusive et vide si bornes inversées', () => {
    assert.deepEqual(listDates('2026-09-16', '2026-09-18'), [
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
    ]);
    assert.deepEqual(listDates('2026-09-18', '2026-09-18'), ['2026-09-18']);
    assert.deepEqual(listDates('2026-09-18', '2026-09-16'), []);
  });
});

describe('time — weekdayOf', () => {
  it('ancres vérifiées', () => {
    assert.equal(weekdayOf('2024-01-01'), 1); // lundi
    assert.equal(weekdayOf('2026-09-18'), 5); // vendredi
    assert.equal(weekdayOf('2026-09-20'), 0); // dimanche
  });
});

describe('time — minDate / maxDate / dateFromDateTime', () => {
  it('compare lexicalement des dates civiles', () => {
    assert.equal(minDate('2026-09-01', '2026-01-09'), '2026-01-09');
    assert.equal(maxDate('2026-09-01', '2026-01-09'), '2026-09-01');
  });
  it('convertit un instant en date civile selon le fuseau', () => {
    assert.equal(dateFromDateTime('2026-09-18T22:30:00.000Z', 'Pacific/Auckland'), '2026-09-19');
    assert.equal(dateFromDateTime('2026-09-18T22:30:00.000Z', 'UTC'), '2026-09-18');
    assert.throws(() => dateFromDateTime('invalide', 'UTC'));
  });
});
