/**
 * Statistiques — attendu / complété par jour, agrégé sur les habitudes,
 * les actions de routines et les tâches datées.
 *
 * Définitions (mêmes règles côté « Today » et « Stats ») :
 * - **Attendu** sur un jour : habitudes planifiées ce jour-là (hors suspension,
 *   après leur date de début) + actions des routines planifiées ce jour-là
 *   + tâches dont l'échéance tombe ce jour-là (fuseau utilisateur).
 * - **Complété** : validations d'habitudes du jour + validations d'actions de
 *   routines du jour + tâches échues ce jour-là et marquées terminées.
 * - Taux = complété / attendu (0 si rien d'attendu).
 * - `trendPoints` = moyenne des taux de la 2ᵉ moitié de la période moins
 *   celle de la 1ʳᵉ moitié, en points de pourcentage (arrondi 1 décimale).
 * - Streak global = jours « parfaits » consécutifs (voir computePerfectDayStreak).
 */
import { and, eq, isNull } from 'drizzle-orm';
import {
  addDays,
  canAccessStatsRange,
  computePerfectDayStreak,
  dateFromDateTime,
  isScheduledOn,
  listDates,
  RANGE_DAYS,
  todayInTz,
  type DayStatDTO,
  type ISODate,
  type PlanId,
  type StatsRange,
  type StatsSummaryDTO,
} from '@charbon/shared';
import type { Db } from '../db/client.js';
import { habitCompletions, habitPauses, habits, routineItemCompletions, routineItems, routines, tasks } from '../db/schema.js';
import { premiumRequired } from '../lib/errors.js';
import { habitDayContribution, parseSchedule } from './habits.service.js';

export interface DayCount {
  expected: number;
  completed: number;
}

interface AggregateSource {
  habitList: Array<{ schedule: ReturnType<typeof parseSchedule>; startDate: string; pauses: Array<{ from: string; to: string | null }>; dates: Set<string> }>;
  routineList: Array<{ id: string; schedule: ReturnType<typeof parseSchedule>; startDate: string; itemCount: number }>;
  routineCompletions: Map<string, number>; // `${routineId}|${date}` → nb d'actions complétées
  tasksByDueDay: Map<string, { expected: number; completed: number }>;
}

async function loadSources(db: Db, userId: string, tz: string): Promise<AggregateSource> {
  const [habitRows, pauseRows, habitCompletionRows, routineRows, itemRows, itemCompletionRows, taskRows] =
    await Promise.all([
      db.select().from(habits).where(and(eq(habits.userId, userId), isNull(habits.deletedAt))).all(),
      db.select().from(habitPauses).where(eq(habitPauses.userId, userId)).all(),
      db.select().from(habitCompletions).where(eq(habitCompletions.userId, userId)).all(),
      db.select().from(routines).where(and(eq(routines.userId, userId), isNull(routines.deletedAt))).all(),
      db.select().from(routineItems).where(eq(routineItems.userId, userId)).all(),
      db.select().from(routineItemCompletions).where(eq(routineItemCompletions.userId, userId)).all(),
      db
        .select({ dueAt: tasks.dueAt, status: tasks.status })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)))
        .all(),
    ]);

  const pausesByHabit = new Map<string, Array<{ from: string; to: string | null }>>();
  for (const p of pauseRows) {
    const arr = pausesByHabit.get(p.habitId);
    const win = { from: p.fromDate, to: p.toDate };
    if (arr) arr.push(win);
    else pausesByHabit.set(p.habitId, [win]);
  }
  const completionsByHabit = new Map<string, Set<string>>();
  for (const c of habitCompletionRows) {
    const set = completionsByHabit.get(c.habitId);
    if (set) set.add(c.date);
    else completionsByHabit.set(c.habitId, new Set([c.date]));
  }

  const habitList = habitRows.map((h) => ({
    schedule: parseSchedule(h),
    startDate: h.startDate,
    pauses: pausesByHabit.get(h.id) ?? [],
    dates: completionsByHabit.get(h.id) ?? new Set<string>(),
  }));

  const itemCountByRoutine = new Map<string, number>();
  for (const it of itemRows) {
    itemCountByRoutine.set(it.routineId, (itemCountByRoutine.get(it.routineId) ?? 0) + 1);
  }
  const routineList = routineRows.map((r) => ({
    id: r.id,
    schedule: parseSchedule(r),
    startDate: r.startDate,
    itemCount: itemCountByRoutine.get(r.id) ?? 0,
  }));

  const routineCompletions = new Map<string, number>();
  for (const c of itemCompletionRows) {
    const key = `${c.routineId}|${c.date}`;
    routineCompletions.set(key, (routineCompletions.get(key) ?? 0) + 1);
  }

  const tasksByDueDay = new Map<string, { expected: number; completed: number }>();
  for (const t of taskRows) {
    if (!t.dueAt) continue; // les tâches sans échéance ne pèsent pas sur le taux quotidien
    const day = dateFromDateTime(t.dueAt, tz);
    const cur = tasksByDueDay.get(day) ?? { expected: 0, completed: 0 };
    cur.expected += 1;
    if (t.status === 'done') cur.completed += 1;
    tasksByDueDay.set(day, cur);
  }

  return { habitList, routineList, routineCompletions, tasksByDueDay };
}

function countDay(sources: AggregateSource, date: ISODate): DayCount {
  let expected = 0;
  let completed = 0;

  for (const h of sources.habitList) {
    const c = habitDayContribution({
      schedule: h.schedule,
      startDate: h.startDate,
      pauses: h.pauses,
      completionDates: h.dates,
      date,
    });
    expected += c.expected;
    completed += c.completed;
  }

  for (const r of sources.routineList) {
    if (date < r.startDate || !isScheduledOn(r.schedule, date)) continue;
    expected += r.itemCount;
    completed += Math.min(sources.routineCompletions.get(`${r.id}|${date}`) ?? 0, r.itemCount);
  }

  const t = sources.tasksByDueDay.get(date);
  if (t) {
    expected += t.expected;
    completed += t.completed;
  }

  return { expected, completed };
}

export async function countDays(
  db: Db,
  userId: string,
  tz: string,
  dates: ISODate[],
): Promise<Map<ISODate, DayCount>> {
  const sources = await loadSources(db, userId, tz);
  const out = new Map<ISODate, DayCount>();
  for (const d of dates) out.set(d, countDay(sources, d));
  return out;
}

/** Streak global sur 365 jours (jours parfaits consécutifs). */
export async function globalStreak(
  db: Db,
  userId: string,
  tz: string,
  today: ISODate,
): Promise<{ current: number; longest: number }> {
  const dates = listDates(addDays(today, -364), today);
  const counts = await countDays(db, userId, tz, dates);
  const days = new Map<string, { expected: number; completed: number }>();
  for (const [d, c] of counts) if (c.expected > 0) days.set(d, c);
  return computePerfectDayStreak({ days, today });
}

export async function statsSummary(
  db: Db,
  userId: string,
  tz: string,
  plan: PlanId,
  range: StatsRange,
): Promise<StatsSummaryDTO> {
  if (!canAccessStatsRange(plan, range)) {
    throw premiumRequired(`La plage ${range} est réservée au plan Premium`);
  }
  const today = todayInTz(tz);
  const span = RANGE_DAYS[range];
  const dates = listDates(addDays(today, -(span - 1)), today);
  const counts = await countDays(db, userId, tz, dates);

  const days: DayStatDTO[] = dates.map((date) => {
    const c = counts.get(date) ?? { expected: 0, completed: 0 };
    return {
      date,
      expected: c.expected,
      completed: c.completed,
      rate: c.expected === 0 ? 0 : c.completed / c.expected,
    };
  });

  const totals = days.reduce(
    (acc, d) => ({ expected: acc.expected + d.expected, completed: acc.completed + d.completed }),
    { expected: 0, completed: 0 },
  );

  const mid = Math.floor(days.length / 2);
  const firstHalf = days.slice(0, mid);
  const secondHalf = days.slice(mid);
  const avg = (arr: DayStatDTO[]) => (arr.length === 0 ? 0 : arr.reduce((s, d) => s + d.rate, 0) / arr.length);
  const trendPoints =
    days.length < 2 ? 0 : Math.round((avg(secondHalf) - avg(firstHalf)) * 1000) / 10;

  const streak = await globalStreak(db, userId, tz, today);

  return {
    range,
    serverToday: today,
    days,
    totals: {
      expected: totals.expected,
      completed: totals.completed,
      rate: totals.expected === 0 ? 0 : totals.completed / totals.expected,
    },
    trendPoints,
    streak,
  };
}
