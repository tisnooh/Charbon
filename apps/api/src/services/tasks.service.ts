/**
 * Service Tâches — CRUD, complétion, suppression douce + restauration.
 *
 * Vues de liste :
 * - today    : tâches dues aujourd'hui ou en retard (fuseau utilisateur), non supprimées.
 * - upcoming : tâches dues dans le futur, en attente.
 * - all      : toutes les tâches en attente (avec et sans échéance).
 * - done     : tâches terminées.
 * - deleted  : corbeille (restaurables).
 */
import { randomUUID } from 'node:crypto';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { dateFromDateTime, isoUtcNow, type ISODate, type TaskDTO } from '@charbon/shared';
import type { Db } from '../db/client.js';
import { tasks } from '../db/schema.js';
import { notFound } from '../lib/errors.js';

type TaskRow = typeof tasks.$inferSelect;

export type TaskView = 'today' | 'upcoming' | 'all' | 'done' | 'deleted';

export function toTaskDTO(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    goalId: row.goalId,
    dueAt: row.dueAt,
    status: row.status,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function dueDay(row: TaskRow, tz: string): ISODate | null {
  return row.dueAt ? dateFromDateTime(row.dueAt, tz) : null;
}

export async function listTasks(
  db: Db,
  userId: string,
  view: TaskView,
  today: ISODate,
  tz: string,
): Promise<TaskDTO[]> {
  const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).all();

  const notDeleted = rows.filter((r) => r.deletedAt === null);
  let filtered: TaskRow[];
  switch (view) {
    case 'deleted':
      filtered = rows.filter((r) => r.deletedAt !== null);
      break;
    case 'done':
      filtered = notDeleted.filter((r) => r.status === 'done');
      break;
    case 'today':
      filtered = notDeleted.filter((r) => {
        const d = dueDay(r, tz);
        if (d === null) return false;
        if (r.status === 'done') return d === today;
        return d <= today; // en retard inclus
      });
      break;
    case 'upcoming':
      filtered = notDeleted.filter((r) => {
        const d = dueDay(r, tz);
        return r.status === 'pending' && d !== null && d > today;
      });
      break;
    case 'all':
    default:
      filtered = notDeleted.filter((r) => r.status === 'pending');
      break;
  }

  filtered.sort((a, b) => {
    if (view === 'done' || view === 'deleted') {
      const ka = (view === 'done' ? a.completedAt : a.deletedAt) ?? a.updatedAt;
      const kb = (view === 'done' ? b.completedAt : b.deletedAt) ?? b.updatedAt;
      return kb.localeCompare(ka);
    }
    // Tâches datées d'abord (par échéance), puis non datées (création récente d'abord).
    const da = a.dueAt ?? null;
    const dbb = b.dueAt ?? null;
    if (da && dbb) return da.localeCompare(dbb);
    if (da) return -1;
    if (dbb) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return filtered.map(toTaskDTO);
}

async function findOwned(db: Db, userId: string, id: string): Promise<TaskRow> {
  const row = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).get();
  if (!row) throw notFound('Tâche introuvable');
  return row;
}

export async function getTask(db: Db, userId: string, id: string): Promise<TaskDTO> {
  return toTaskDTO(await findOwned(db, userId, id));
}

export async function createTask(
  db: Db,
  userId: string,
  input: { title: string; notes?: string | null; goalId?: string | null; dueAt?: string | null },
): Promise<TaskDTO> {
  const now = isoUtcNow();
  const row = await db
    .insert(tasks)
    .values({
      id: randomUUID(),
      userId,
      goalId: input.goalId ?? null,
      title: input.title,
      notes: input.notes ?? null,
      dueAt: input.dueAt ?? null,
      status: 'pending',
      completedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  return toTaskDTO(row);
}

export async function updateTask(
  db: Db,
  userId: string,
  id: string,
  patch: { title?: string; notes?: string | null; goalId?: string | null; dueAt?: string | null },
): Promise<TaskDTO> {
  await findOwned(db, userId, id);
  const row = await db
    .update(tasks)
    .set({ ...patch, updatedAt: isoUtcNow() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
    .get();
  return toTaskDTO(row);
}

export async function completeTask(db: Db, userId: string, id: string): Promise<TaskDTO> {
  const existing = await findOwned(db, userId, id);
  if (existing.status === 'done' && existing.deletedAt === null) return toTaskDTO(existing); // idempotent
  const row = await db
    .update(tasks)
    .set({ status: 'done', completedAt: isoUtcNow(), updatedAt: isoUtcNow() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
    .get();
  return toTaskDTO(row);
}

export async function uncompleteTask(db: Db, userId: string, id: string): Promise<TaskDTO> {
  await findOwned(db, userId, id);
  const row = await db
    .update(tasks)
    .set({ status: 'pending', completedAt: null, updatedAt: isoUtcNow() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
    .get();
  return toTaskDTO(row);
}

/** Suppression douce — restaurable (spec : « restaurer si erreur »). */
export async function softDeleteTask(db: Db, userId: string, id: string): Promise<TaskDTO> {
  await findOwned(db, userId, id);
  const row = await db
    .update(tasks)
    .set({ deletedAt: isoUtcNow(), updatedAt: isoUtcNow() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
    .get();
  return toTaskDTO(row);
}

export async function restoreTask(db: Db, userId: string, id: string): Promise<TaskDTO> {
  const existing = await findOwned(db, userId, id);
  if (existing.deletedAt === null) return toTaskDTO(existing); // idempotent
  const row = await db
    .update(tasks)
    .set({ deletedAt: null, updatedAt: isoUtcNow() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
    .get();
  return toTaskDTO(row);
}

/** Tâches dues un jour donné (stats) — export pour le service stats. */
export async function tasksWithDue(db: Db, userId: string): Promise<Array<{ dueAt: string; status: 'pending' | 'done' }>> {
  const rows = await db
    .select({ dueAt: tasks.dueAt, status: tasks.status })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt), isNotNull(tasks.dueAt)))
    .all();
  return rows.map((r) => ({ dueAt: r.dueAt as string, status: r.status }));
}

