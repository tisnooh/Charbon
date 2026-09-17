import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  changePasswordSchema,
  contactSchema,
  emailSchema,
  habitCompleteSchema,
  hhmmSchema,
  isoDateSchema,
  isoDateTimeSchema,
  loginSchema,
  onboardingSchema,
  passwordSchema,
  registerSchema,
  routineCreateSchema,
  scheduleSchema,
  taskCreateSchema,
  timeZoneSchema,
  updateProfileSchema,
} from '../src/schemas.js';

describe('schemas — email', () => {
  it('normalise (trim + minuscules) puis valide', () => {
    const r = emailSchema.safeParse('  Foo@BAR.com ');
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data, 'foo@bar.com');
  });
  it('rejette un e-mail invalide', () => {
    assert.equal(emailSchema.safeParse('foo@').success, false);
    assert.equal(emailSchema.safeParse('foo').success, false);
  });
});

describe('schemas — register / login', () => {
  const valid = { name: 'Alice', email: 'alice@example.com', password: 'motdepasse' };
  it('registre une entrée valide', () => {
    assert.equal(registerSchema.safeParse(valid).success, true);
  });
  it('rejette mot de passe trop court / trop long', () => {
    assert.equal(registerSchema.safeParse({ ...valid, password: 'court' }).success, false);
    assert.equal(registerSchema.safeParse({ ...valid, password: 'x'.repeat(73) }).success, false);
  });
  it('rejette un nom vide', () => {
    assert.equal(registerSchema.safeParse({ ...valid, name: '   ' }).success, false);
  });
  it('valide le fuseau horaire', () => {
    assert.equal(registerSchema.safeParse({ ...valid, timezone: 'Europe/Paris' }).success, true);
    assert.equal(registerSchema.safeParse({ ...valid, timezone: 'Mars/Olympus' }).success, false);
  });
  it('login exige un mot de passe non vide (pas de règle de longueur au login)', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success, false);
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success, true);
  });
  it('changePassword exige le mot de passe courant', () => {
    assert.equal(
      changePasswordSchema.safeParse({ currentPassword: 'ancien123', password: 'nouveau123' })
        .success,
      true,
    );
    assert.equal(changePasswordSchema.safeParse({ password: 'nouveau123' }).success, false);
  });
});

describe('schemas — dates & heures', () => {
  it('isoDate accepte/rejette', () => {
    assert.equal(isoDateSchema.safeParse('2026-09-18').success, true);
    assert.equal(isoDateSchema.safeParse('2026-02-30').success, false);
    assert.equal(isoDateSchema.safeParse('18/09/2026').success, false);
  });
  it('hhmm accepte/rejette', () => {
    assert.equal(hhmmSchema.safeParse('00:00').success, true);
    assert.equal(hhmmSchema.safeParse('23:59').success, true);
    assert.equal(hhmmSchema.safeParse('24:00').success, false);
    assert.equal(hhmmSchema.safeParse('7:00').success, false);
  });
  it('isoDateTime exige un instant complet', () => {
    assert.equal(isoDateTimeSchema.safeParse('2026-09-18T14:30:00.000Z').success, true);
    assert.equal(isoDateTimeSchema.safeParse('2026-09-18T16:30:00+02:00').success, true);
    assert.equal(isoDateTimeSchema.safeParse('2026-09-18T14:30').success, false);
  });
  it('timeZone valide IANA', () => {
    assert.equal(timeZoneSchema.safeParse('America/New_York').success, true);
    assert.equal(timeZoneSchema.safeParse('UTC').success, true);
    assert.equal(timeZoneSchema.safeParse('blabla').success, false);
  });
});

describe('schemas — password bornes', () => {
  it('8 = OK, 7 = KO, 72 = OK, 73 = KO', () => {
    assert.equal(passwordSchema.safeParse('12345678').success, true);
    assert.equal(passwordSchema.safeParse('1234567').success, false);
    assert.equal(passwordSchema.safeParse('x'.repeat(72)).success, true);
    assert.equal(passwordSchema.safeParse('x'.repeat(73)).success, false);
  });
});

describe('schemas — schedule', () => {
  it('daily : jours par défaut vides', () => {
    const r = scheduleSchema.safeParse({ type: 'daily' });
    assert.equal(r.success, true);
    if (r.success) assert.deepEqual(r.data.days, []);
  });
  it('days_of_week : 1 à 7 jours uniques requis', () => {
    assert.equal(scheduleSchema.safeParse({ type: 'days_of_week', days: [1, 3, 5] }).success, true);
    assert.equal(scheduleSchema.safeParse({ type: 'days_of_week', days: [] }).success, false);
    assert.equal(scheduleSchema.safeParse({ type: 'days_of_week', days: [1, 1] }).success, false);
    assert.equal(scheduleSchema.safeParse({ type: 'days_of_week', days: [7] }).success, false);
  });
});

describe('schemas — tâches / habitudes / routines', () => {
  it('taskCreate : titre requis, dueAt optionnel', () => {
    assert.equal(taskCreateSchema.safeParse({ title: 'Faire du sport' }).success, true);
    assert.equal(taskCreateSchema.safeParse({ title: '' }).success, false);
    assert.equal(
      taskCreateSchema.safeParse({ title: 'x', dueAt: '2026-09-18T14:30:00.000Z' }).success,
      true,
    );
  });
  it('habitComplete : date optionnelle', () => {
    assert.equal(habitCompleteSchema.safeParse({}).success, true);
    assert.equal(habitCompleteSchema.safeParse({ date: '2026-09-18' }).success, true);
    assert.equal(habitCompleteSchema.safeParse({ date: 'nope' }).success, false);
  });
  it('routineCreate : items bornés à 30', () => {
    const item = { title: 'Étirements' };
    assert.equal(routineCreateSchema.safeParse({ name: 'Matin', items: [item] }).success, true);
    assert.equal(
      routineCreateSchema.safeParse({ name: 'Matin', items: Array.from({ length: 31 }, () => item) })
        .success,
      false,
    );
  });
});

describe('schemas — profil & onboarding', () => {
  it('updateProfile refuse un objet vide', () => {
    assert.equal(updateProfileSchema.safeParse({}).success, false);
    assert.equal(updateProfileSchema.safeParse({ name: 'Bob' }).success, true);
    assert.equal(updateProfileSchema.safeParse({ dailyReminderTime: '20:00' }).success, true);
    assert.equal(updateProfileSchema.safeParse({ dailyReminderTime: '99:99' }).success, false);
  });
  it('onboarding : tout optionnel avec défauts, bornes respectées', () => {
    const r = onboardingSchema.safeParse({});
    assert.equal(r.success, true);
    if (r.success) {
      assert.deepEqual(r.data.goals, []);
      assert.deepEqual(r.data.habits, []);
      assert.deepEqual(r.data.routines, []);
    }
    assert.equal(
      onboardingSchema.safeParse({ goals: Array.from({ length: 7 }, (_, i) => ({ title: `G${i}` })) })
        .success,
      false,
    );
  });
});

describe('schemas — contact', () => {
  it('message requis et borné', () => {
    assert.equal(
      contactSchema.safeParse({ name: 'A', email: 'a@b.co', message: 'Bonjour' }).success,
      true,
    );
    assert.equal(
      contactSchema.safeParse({ name: 'A', email: 'a@b.co', message: 'x'.repeat(3001) }).success,
      false,
    );
  });
});
