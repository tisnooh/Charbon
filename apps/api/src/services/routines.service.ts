/**
 * Service Routines — routines composées d'actions (items), validations par
 * action et par jour civil. La progression du jour est DÉRIVÉE des
 * complétions d'items (pas de doublon d'état).
 */
import { randomUUID } from 'node:crypto';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
  isScheduledOn,
  isoUtcNow,
  normalizeSchedule,
  todayInTz,
  type ISODate,
  type RoutineDTO,
  type RoutineItemDTO,
  type RoutineTodayDTO,
  type Schedule,
} from '@charbon/shared';
import type { Db } from '../db/client.js';
import { routineItemCompletions, routineItems, routines } from '../db/schema.js';
import { badRequest, notFound } from '../lib/errors.js';
import { parseSchedule } from './habits.service.js';

type RoutineRow = typeof routines.$inferSelect;
type ItemRow = typeof routineItems.$inferSelect;

function toItemDTO(row: ItemRow): RoutineItemDTO {
  return {
    id: row.id,
    title: row.title,
    durationMinutes: row.durationMinutes,
    sortOrder: row.sortOrder,
  };
}

function toRoutineDTO(row: RoutineRow, items: ItemRow[]): RoutineDTO {
  return {
    id: row.id,
    name: row.name,
    timeOfDay: row.timeOfDay,
    scheduledTime: row.scheduledTime,
    schedule: parseSchedule(row),
    items: items.sort((a, b) => a.sortOrder - b.sortOrder).map(toItemDTO),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findOwnedRoutine(db: Db, userId: string, id: string): Promise<RoutineRow> {
  const row = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, id), eq(routines.userId, userId), isNull(routines.deletedAt)))
    .get();
  if (!row) throw notFound('Routine introuvable');
  return row;
}

async function loadItems(db: Db, routineId: string): Promise<ItemRow[]> {
  return db
    .select()
    .from(routineItems)
    .where(eq(routineItems.routineId, routineId))
    .orderBy(asc(routineItems.sortOrder))
    .all();
}

export async function listRoutines(db: Db, userId: string): Promise<RoutineDTO[]> {
  const rows = await db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), isNull(routines.deletedAt)))
    .all();
  const items = await db
    .select()
    .from(routineItems)
    .where(and(eq(routineItems.userId, userId)))
    .all();
  const byRoutine = new Map<string, ItemRow[]>();
  for (const it of items) {
    const arr = byRoutine.get(it.routineId);
    if (arr) arr.push(it);
    else byRoutine.set(it.routineId, [it]);
  }
  return rows
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r) => toRoutineDTO(r, byRoutine.get(r.id) ?? []));
}

export async function getRoutine(db: Db, userId: string, id: string): Promise<RoutineDTO> {
  const row = await findOwnedRoutine(db, userId, id);
  return toRoutineDTO(row, await loadItems(db, id));
}

export interface RoutineCreateInput {
  name: string;
  timeOfDay?: 'morning' | 'midday' | 'evening' | 'custom';
  scheduledTime?: string | null;
  schedule?: { type: 'daily' | 'days_of_week'; days: number[] };
  items?: Array<{ title: string; durationMinutes?: number | null }>;
}

export async function createRoutine(
  db: Db,
  userId: string,
  tz: string,
  input: RoutineCreateInput,
): Promise<RoutineDTO> {
  const now = isoUtcNow();
  const schedule = normalizeSchedule(input.schedule);
  const routineId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(routines).values({
      id: routineId,
      userId,
      name: input.name,
      timeOfDay: input.timeOfDay ?? 'custom',
      scheduledTime: input.scheduledTime ?? null,
      scheduleType: schedule.type,
      scheduleDays: JSON.stringify(schedule.days),
      startDate: todayInTz(tz),
      color: '#38BDF8',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const items = input.items ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      await tx.insert(routineItems).values({
        id: randomUUID(),
        routineId,
        userId,
        title: item.title,
        durationMinutes: item.durationMinutes ?? null,
        sortOrder: i,
        createdAt: now,
      });
    }
  });
  return getRoutine(db, userId, routineId);
}

export async function updateRoutine(
  db: Db,
  userId: string,
  id: string,
  patch: {
    name?: string;
    timeOfDay?: 'morning' | 'midday' | 'evening' | 'custom';
    scheduledTime?: string | null;
    schedule?: { type: 'daily' | 'days_of_week'; days: number[] };
  },
): Promise<RoutineDTO> {
  await findOwnedRoutine(db, userId, id);
  const values: Record<string, unknown> = { updatedAt: isoUtcNow() };
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.timeOfDay !== undefined) values.timeOfDay = patch.timeOfDay;
  if (patch.scheduledTime !== undefined) values.scheduledTime = patch.scheduledTime;
  if (patch.schedule !== undefined) {
    const schedule = normalizeSchedule(patch.schedule);
    values.scheduleType = schedule.type;
    values.scheduleDays = JSON.stringify(schedule.days);
  }
  await db.update(routines).set(values).where(and(eq(routines.id, id), eq(routines.userId, userId)));
  return getRoutine(db, userId, id);
}

export async function softDeleteRoutine(db: Db, userId: string, id: string): Promise<void> {
  await findOwnedRoutine(db, userId, id);
  await db
    .update(routines)
    .set({ deletedAt: isoUtcNow(), updatedAt: isoUtcNow() })
    .where(and(eq(routines.id, id), eq(routines.userId, userId)));
}

async function findOwnedItem(db: Db, userId: string, routineId: string, itemId: string): Promise<ItemRow> {
  const item = await db
    .select()
    .from(routineItems)
    .where(and(eq(routineItems.id, itemId), eq(routineItems.routineId, routineId), eq(routineItems.userId, userId)))
    .get();
  if (!item) throw notFound('Action introuvable');
  return item;
}

export async function addRoutineItem(
  db: Db,
  userId: string,
  routineId: string,
  input: { title: string; durationMinutes?: number | null },
): Promise<RoutineDTO> {
  await findOwnedRoutine(db, userId, routineId);
  const items = await loadItems(db, routineId);
  const nextOrder = items.reduce((max, i) => Math.max(max, i.sortOrder), -1) + 1;
  await db.insert(routineItems).values({
    id: randomUUID(),
    routineId,
    userId,
    title: input.title,
    durationMinutes: input.durationMinutes ?? null,
    sortOrder: nextOrder,
    createdAt: isoUtcNow(),
  });
  await db.update(routines).set({ updatedAt: isoUtcNow() }).where(eq(routines.id, routineId));
  return getRoutine(db, userId, routineId);
}

export async function updateRoutineItem(
  db: Db,
  userId: string,
  routineId: string,
  itemId: string,
  patch: { title?: string; durationMinutes?: number | null; sortOrder?: number },
): Promise<RoutineDTO> {
  await findOwnedRoutine(db, userId, routineId);
  await findOwnedItem(db, userId, routineId, itemId);
  const values: Record<string, unknown> = {};
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.durationMinutes !== undefined) values.durationMinutes = patch.durationMinutes;
  if (patch.sortOrder !== undefined) values.sortOrder = patch.sortOrder;
  if (Object.keys(values).length > 0) {
    await db.update(routineItems).set(values).where(eq(routineItems.id, itemId));
  }
  return getRoutine(db, userId, routineId);
}

export async function deleteRoutineItem(
  db: Db,
  userId: string,
  routineId: string,
  itemId: string,
): Promise<RoutineDTO> {
  await findOwnedRoutine(db, userId, routineId);
  await findOwnedItem(db, userId, routineId, itemId);
  // Cascade : routine_item_completions supprimées via FK.
  await db.delete(routineItems).where(and(eq(routineItems.id, itemId), eq(routineItems.userId, userId)));
  await db.update(routines).set({ updatedAt: isoUtcNow() }).where(eq(routines.id, routineId));
  return getRoutine(db, userId, routineId);
}

/**
 * Réordonnancement atomique : `itemIds` doit contenir EXACTEMENT les actions
 * de la routine (même ensemble, ordre souhaité). sortOrder = index.
 */
export async function reorderRoutineItems(
  db: Db,
  userId: string,
  routineId: string,
  itemIds: string[],
): Promise<RoutineDTO> {
  await findOwnedRoutine(db, userId, routineId);
  const items = await loadItems(db, routineId);
  const currentIds = new Set(items.map((i) => i.id));
  const requested = new Set(itemIds);
  if (
    requested.size !== itemIds.length ||
    requested.size !== currentIds.size ||
    itemIds.some((id) => !currentIds.has(id))
  ) {
    throw badRequest('itemIds doit être la liste exacte des actions de la routine, sans doublon');
  }
  await db.transaction(async (tx) => {
    for (let i = 0; i < itemIds.length; i++) {
      await tx.update(routineItems).set({ sortOrder: i }).where(eq(routineItems.id, itemIds[i] as string));
    }
    await tx.update(routines).set({ updatedAt: isoUtcNow() }).where(eq(routines.id, routineId));
  });
  return getRoutine(db, userId, routineId);
}

export async function completeRoutineItem(
  db: Db,
  userId: string,
  routineId: string,
  itemId: string,
  tz: string,
  input: { date?: string },
): Promise<RoutineTodayDTO> {
  const routine = await findOwnedRoutine(db, userId, routineId);
  const item = await findOwnedItem(db, userId, routineId, itemId);
  const today = todayInTz(tz);
  const date = input.date ?? today;
  if (date > today) throw badRequest('Impossible de valider un jour futur');
  if (date < routine.startDate) throw badRequest('Date antérieure au début de la routine');

  const existing = await db
    .select()
    .from(routineItemCompletions)
    .where(and(eq(routineItemCompletions.itemId, itemId), eq(routineItemCompletions.date, date)))
    .get();
  if (!existing) {
    await db.insert(routineItemCompletions).values({
      id: randomUUID(),
      itemId: item.id,
      routineId,
      userId,
      date,
      completedAt: isoUtcNow(),
    });
  }
  const list = await routinesToday(db, userId, tz);
  const found = list.find((r) => r.id === routineId);
  if (!found) throw notFound('Routine introuvable');
  return found;
}

export async function uncompleteRoutineItem(
  db: Db,
  userId: string,
  routineId: string,
  itemId: string,
  tz: string,
  date: ISODate,
): Promise<RoutineTodayDTO> {
  await findOwnedRoutine(db, userId, routineId);
  await findOwnedItem(db, userId, routineId, itemId);
  await db
    .delete(routineItemCompletions)
    .where(
      and(
        eq(routineItemCompletions.itemId, itemId),
        eq(routineItemCompletions.userId, userId),
        eq(routineItemCompletions.date, date),
      ),
    );
  const list = await routinesToday(db, userId, tz);
  const found = list.find((r) => r.id === routineId);
  if (!found) throw notFound('Routine introuvable');
  return found;
}

/** Routines planifiées aujourd'hui + état de chaque action. */
export async function routinesToday(db: Db, userId: string, tz: string): Promise<RoutineTodayDTO[]> {
  const today = todayInTz(tz);
  const all = await listRoutines(db, userId);
  const rows = await db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), isNull(routines.deletedAt)))
    .all();
  const rowById = new Map(rows.map((r) => [r.id, r]));

  const completions = await db
    .select()
    .from(routineItemCompletions)
    .where(and(eq(routineItemCompletions.userId, userId), eq(routineItemCompletions.date, today)))
    .all();
  const doneItems = new Set(completions.map((c) => c.itemId));

  return all.map((r) => {
    const row = rowById.get(r.id);
    const schedule: Schedule = row
      ? parseSchedule(row)
      : { type: 'daily', days: [] };
    const scheduledToday = row ? today >= row.startDate && isScheduledOn(schedule, today) : true;
    const itemsDoneToday = r.items.filter((i) => doneItems.has(i.id)).length;
    return {
      ...r,
      scheduledToday,
      itemsDoneToday,
      itemsTotal: r.items.length,
      doneToday: r.items.length > 0 && itemsDoneToday === r.items.length,
      itemStates: r.items.map((i) => ({ itemId: i.id, done: doneItems.has(i.id) })),
    };
  });
}

/** Contribution d'une routine aux stats journalières (attendu/complété). */
export function routineDayContribution(params: {
  routine: { schedule: Schedule; startDate: string; itemCount: number };
  completedItemCount: number;
  date: string;
}): { expected: number; completed: number } {
  const { routine, completedItemCount, date } = params;
  if (date < routine.startDate) return { expected: 0, completed: 0 };
  if (!isScheduledOn(routine.schedule, date)) return { expected: 0, completed: 0 };
  return { expected: routine.itemCount, completed: Math.min(completedItemCount, routine.itemCount) };
}
