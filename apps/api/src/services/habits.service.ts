/**
 * Service Habitudes — CRUD, suspension/reprise, validations quotidiennes,
 * historique et streaks calculés CÔTÉ SERVEUR (fuseau utilisateur).
 *
 * Règles :
 * - Une validation = 1 ligne (habitId, date civile) unique. Idempotent.
 * - Pas de validation dans le futur, avant startDate, ni pendant une suspension.
 * - Suppression = soft delete : l'historique et les stats passées sont conservés,
 *   l'habitude disparaît des listes actives.
 * - Changement de planning : les validations passées restent ; les jours
 *   attendus sont recalculés avec le planning courant (documenté).
 */
import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import {
  addDays,
  computeStreaks,
  expectedDatesBetween,
  isPausedOn,
  isScheduledOn,
  isoUtcNow,
  maxDate,
  normalizeSchedule,
  todayInTz,
  type HabitDTO,
  type HabitDetailDTO,
  type HabitHistoryDayDTO,
  type PauseWindow,
  type Schedule,
} from '@charbon/shared';
import type { Db } from '../db/client.js';
import { habitCompletions, habitPauses, habits } from '../db/schema.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';

type HabitRow = typeof habits.$inferSelect;
type CompletionRow = typeof habitCompletions.$inferSelect;
type PauseRow = typeof habitPauses.$inferSelect;

/** Colonnes de planning stockées (habitudes ET routines). */
export interface ScheduleColumns {
  scheduleType: 'daily' | 'days_of_week';
  scheduleDays: string;
}

export function parseSchedule(row: ScheduleColumns): Schedule {
  let days: number[] = [];
  try {
    const parsed: unknown = JSON.parse(row.scheduleDays);
    if (Array.isArray(parsed)) days = parsed.filter((d): d is number => typeof d === 'number');
  } catch {
    days = [];
  }
  return normalizeSchedule({ type: row.scheduleType, days });
}

function toPauses(rows: PauseRow[]): PauseWindow[] {
  return rows.map((r) => ({ from: r.fromDate, to: r.toDate }));
}

export interface HabitWithStreaks extends HabitDTO {
  atRiskToday: boolean;
}

async function findOwnedHabit(db: Db, userId: string, id: string): Promise<HabitRow> {
  const row = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, userId), isNull(habits.deletedAt)))
    .get();
  if (!row) throw notFound('Habitude introuvable');
  return row;
}

/** Charge complétions + pauses de l'utilisateur en 2 requêtes (listes). */
async function loadHabitSupportData(
  db: Db,
  userId: string,
): Promise<{ completionsByHabit: Map<string, CompletionRow[]>; pausesByHabit: Map<string, PauseRow[]> }> {
  const [completionRows, pauseRows] = await Promise.all([
    db.select().from(habitCompletions).where(eq(habitCompletions.userId, userId)).all(),
    db.select().from(habitPauses).where(eq(habitPauses.userId, userId)).all(),
  ]);
  const completionsByHabit = new Map<string, CompletionRow[]>();
  for (const c of completionRows) {
    const arr = completionsByHabit.get(c.habitId);
    if (arr) arr.push(c);
    else completionsByHabit.set(c.habitId, [c]);
  }
  const pausesByHabit = new Map<string, PauseRow[]>();
  for (const p of pauseRows) {
    const arr = pausesByHabit.get(p.habitId);
    if (arr) arr.push(p);
    else pausesByHabit.set(p.habitId, [p]);
  }
  return { completionsByHabit, pausesByHabit };
}

function habitToDTO(
  row: HabitRow,
  today: string,
  completions: CompletionRow[],
  pauses: PauseRow[],
): HabitWithStreaks {
  const schedule = parseSchedule(row);
  const streaks = computeStreaks({
    schedule,
    startDate: row.startDate,
    completions: completions.map((c) => c.date),
    pauses: toPauses(pauses),
    today,
  });
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    schedule,
    startDate: row.startDate,
    pausedAt: row.pausedAt,
    goalId: row.goalId,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    doneToday: streaks.completedToday,
    expectedToday: streaks.expectedToday,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    atRiskToday: streaks.atRiskToday,
  };
}

export async function listHabits(db: Db, userId: string, tz: string): Promise<HabitWithStreaks[]> {
  const today = todayInTz(tz);
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.deletedAt)))
    .all();
  const { completionsByHabit, pausesByHabit } = await loadHabitSupportData(db, userId);
  return rows
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r) => habitToDTO(r, today, completionsByHabit.get(r.id) ?? [], pausesByHabit.get(r.id) ?? []));
}

export async function getHabit(db: Db, userId: string, id: string, tz: string): Promise<HabitWithStreaks> {
  const row = await findOwnedHabit(db, userId, id);
  const { completionsByHabit, pausesByHabit } = await loadHabitSupportData(db, userId);
  return habitToDTO(row, todayInTz(tz), completionsByHabit.get(id) ?? [], pausesByHabit.get(id) ?? []);
}

export interface HabitCreateInput {
  name: string;
  color?: string;
  schedule?: { type: 'daily' | 'days_of_week'; days: number[] };
  goalId?: string | null;
  startDate?: string;
}

export async function createHabit(
  db: Db,
  userId: string,
  tz: string,
  input: HabitCreateInput,
): Promise<HabitWithStreaks> {
  const today = todayInTz(tz);
  const startDate = input.startDate ?? today;
  if (startDate > addDays(today, 365) || startDate < addDays(today, -365)) {
    throw badRequest('startDate doit être comprise dans une fenêtre de ±365 jours');
  }
  const schedule = normalizeSchedule(input.schedule);
  const now = isoUtcNow();
  const row = await db
    .insert(habits)
    .values({
      id: randomUUID(),
      userId,
      goalId: input.goalId ?? null,
      name: input.name,
      color: input.color ?? '#F97316',
      scheduleType: schedule.type,
      scheduleDays: JSON.stringify(schedule.days),
      startDate,
      pausedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  return habitToDTO(row, today, [], []);
}

export async function updateHabit(
  db: Db,
  userId: string,
  id: string,
  tz: string,
  patch: { name?: string; color?: string; schedule?: { type: 'daily' | 'days_of_week'; days: number[] }; goalId?: string | null },
): Promise<HabitWithStreaks> {
  await findOwnedHabit(db, userId, id);
  const values: Record<string, unknown> = { updatedAt: isoUtcNow() };
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.color !== undefined) values.color = patch.color;
  if (patch.goalId !== undefined) values.goalId = patch.goalId;
  if (patch.schedule !== undefined) {
    const schedule = normalizeSchedule(patch.schedule);
    values.scheduleType = schedule.type;
    values.scheduleDays = JSON.stringify(schedule.days);
  }
  await db.update(habits).set(values).where(and(eq(habits.id, id), eq(habits.userId, userId)));
  return getHabit(db, userId, id, tz);
}

export async function pauseHabit(db: Db, userId: string, id: string, tz: string): Promise<HabitWithStreaks> {
  const row = await findOwnedHabit(db, userId, id);
  if (row.pausedAt !== null) throw conflict('habit_already_paused', 'Habitude déjà suspendue');
  const now = isoUtcNow();
  await db.transaction(async (tx) => {
    await tx.update(habits).set({ pausedAt: now, updatedAt: now }).where(eq(habits.id, id));
    await tx.insert(habitPauses).values({
      id: randomUUID(),
      habitId: id,
      userId,
      fromDate: todayInTz(tz),
      toDate: null,
      createdAt: now,
    });
  });
  return getHabit(db, userId, id, tz);
}

export async function resumeHabit(db: Db, userId: string, id: string, tz: string): Promise<HabitWithStreaks> {
  const row = await findOwnedHabit(db, userId, id);
  if (row.pausedAt === null) throw conflict('habit_not_paused', 'Habitude non suspendue');
  const now = isoUtcNow();
  await db.transaction(async (tx) => {
    await tx.update(habits).set({ pausedAt: null, updatedAt: now }).where(eq(habits.id, id));
    await tx
      .update(habitPauses)
      .set({ toDate: todayInTz(tz) }) // jour de reprise = attendu (to exclusif)
      .where(and(eq(habitPauses.habitId, id), isNull(habitPauses.toDate)));
  });
  return getHabit(db, userId, id, tz);
}

export async function softDeleteHabit(db: Db, userId: string, id: string): Promise<void> {
  await findOwnedHabit(db, userId, id);
  await db
    .update(habits)
    .set({ deletedAt: isoUtcNow(), updatedAt: isoUtcNow() })
    .where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

export interface CompleteHabitResult {
  done: boolean;
  date: string;
  streak: { current: number; longest: number; atRiskToday: boolean };
}

export async function completeHabit(
  db: Db,
  userId: string,
  id: string,
  tz: string,
  input: { date?: string; note?: string | null },
): Promise<CompleteHabitResult> {
  const row = await findOwnedHabit(db, userId, id);
  const today = todayInTz(tz);
  const date = input.date ?? today;

  if (date > today) throw badRequest('Impossible de valider un jour futur');
  if (date < row.startDate) throw badRequest('Date antérieure au début de l’habitude');

  const pauses = toPauses(
    await db.select().from(habitPauses).where(eq(habitPauses.habitId, id)).all(),
  );
  if (isPausedOn(pauses, date)) throw conflict('habit_paused', 'Habitude suspendue à cette date');

  const existing = await db
    .select()
    .from(habitCompletions)
    .where(and(eq(habitCompletions.habitId, id), eq(habitCompletions.date, date)))
    .get();
  if (!existing) {
    await db.insert(habitCompletions).values({
      id: randomUUID(),
      habitId: id,
      userId,
      date,
      note: input.note ?? null,
      createdAt: isoUtcNow(),
    });
  }

  const completions = await db
    .select()
    .from(habitCompletions)
    .where(eq(habitCompletions.habitId, id))
    .all();
  const streaks = computeStreaks({
    schedule: parseSchedule(row),
    startDate: row.startDate,
    completions: completions.map((c) => c.date),
    pauses,
    today,
  });
  return {
    done: true,
    date,
    streak: { current: streaks.current, longest: streaks.longest, atRiskToday: streaks.atRiskToday },
  };
}

export async function uncompleteHabit(
  db: Db,
  userId: string,
  id: string,
  tz: string,
  date: string,
): Promise<CompleteHabitResult> {
  const row = await findOwnedHabit(db, userId, id);
  const today = todayInTz(tz);
  await db
    .delete(habitCompletions)
    .where(and(eq(habitCompletions.habitId, id), eq(habitCompletions.userId, userId), eq(habitCompletions.date, date)));
  const completions = await db
    .select()
    .from(habitCompletions)
    .where(eq(habitCompletions.habitId, id))
    .all();
  const streaks = computeStreaks({
    schedule: parseSchedule(row),
    startDate: row.startDate,
    completions: completions.map((c) => c.date),
    pauses: toPauses(await db.select().from(habitPauses).where(eq(habitPauses.habitId, id)).all()),
    today,
  });
  return {
    done: false,
    date,
    streak: { current: streaks.current, longest: streaks.longest, atRiskToday: streaks.atRiskToday },
  };
}

export async function habitHistory(
  db: Db,
  userId: string,
  id: string,
  tz: string,
  days: number,
): Promise<HabitDetailDTO> {
  const row = await findOwnedHabit(db, userId, id);
  const today = todayInTz(tz);
  // La fenêtre affichée couvre TOUJOURS `days` jours ; les jours antérieurs à
  // la création de l'habitude y figurent avec expected=false (calendrier complet).
  const windowStart = addDays(today, -(days - 1));
  const expectedStart = maxDate(row.startDate, windowStart);

  const [completionRows, pauseRows] = await Promise.all([
    db.select().from(habitCompletions).where(eq(habitCompletions.habitId, id)).all(),
    db.select().from(habitPauses).where(eq(habitPauses.habitId, id)).all(),
  ]);
  const schedule = parseSchedule(row);
  const pauses = toPauses(pauseRows);
  const completedByDate = new Map(completionRows.map((c) => [c.date, c]));
  const expectedSet = new Set(expectedDatesBetween(schedule, expectedStart, today, pauses));

  const history: HabitHistoryDayDTO[] = [];
  for (let d = windowStart; d <= today; d = addDays(d, 1)) {
    const expected = expectedSet.has(d);
    const completion = completedByDate.get(d);
    history.push({
      date: d,
      expected,
      completed: expected && completion !== undefined,
      note: completion?.note ?? null,
    });
  }

  const expectedCount = history.filter((h) => h.expected).length;
  const completedCount = history.filter((h) => h.completed).length;

  return {
    habit: habitToDTO(row, today, completionRows, pauseRows),
    history,
    completionRate: expectedCount === 0 ? 0 : completedCount / expectedCount,
    paused: row.pausedAt !== null,
  };
}

/** Attendu/complété par jour pour les stats agrégées (service stats). */
export function habitDayContribution(params: {
  schedule: Schedule;
  startDate: string;
  pauses: PauseWindow[];
  completionDates: Set<string>;
  date: string;
}): { expected: number; completed: number } {
  const { schedule, startDate, pauses, completionDates, date } = params;
  if (date < startDate) return { expected: 0, completed: 0 };
  if (!isScheduledOn(schedule, date) || isPausedOn(pauses, date)) return { expected: 0, completed: 0 };
  return { expected: 1, completed: completionDates.has(date) ? 1 : 0 };
}
