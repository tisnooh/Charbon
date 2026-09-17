/**
 * Notifications in-app : rappels quotidiens, jalons de streak, messages système.
 * Le transport « push » (APNs/FCM) est une extension future — la persistance
 * et l'affichage in-app sont réels dès la V1 (voir docs/PROJECT_STATE.md).
 */
import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { isoUtcNow, type NotificationDTO } from '@charbon/shared';
import type { Db } from '../db/client.js';
import { notifications } from '../db/schema.js';
import { notFound } from '../lib/errors.js';

type NotificationRow = typeof notifications.$inferSelect;

function toDTO(row: NotificationRow): NotificationDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export async function createNotification(
  db: Db,
  userId: string,
  input: { type: string; title: string; body?: string | null; data?: unknown },
): Promise<NotificationDTO> {
  const row = await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: input.data === undefined ? null : JSON.stringify(input.data),
      readAt: null,
      createdAt: isoUtcNow(),
    })
    .returning()
    .get();
  return toDTO(row);
}

export async function listNotifications(
  db: Db,
  userId: string,
  opts: { limit: number; offset: number },
): Promise<{ items: NotificationDTO[]; total: number; unread: number }> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)
    .all();

  const counts = await db
    .select({
      total: sql<number>`count(*)`,
      unread: sql<number>`sum(case when ${notifications.readAt} is null then 1 else 0 end)`,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .get();

  return {
    items: rows.map(toDTO),
    total: Number(counts?.total ?? 0),
    unread: Number(counts?.unread ?? 0),
  };
}

export async function unreadCount(db: Db, userId: string): Promise<number> {
  const row = await db
    .select({ unread: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .get();
  return Number(row?.unread ?? 0);
}

export async function markRead(db: Db, userId: string, id: string): Promise<NotificationDTO> {
  const existing = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .get();
  if (!existing) throw notFound('Notification introuvable');
  if (existing.readAt !== null) return toDTO(existing);
  const row = await db
    .update(notifications)
    .set({ readAt: isoUtcNow() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning()
    .get();
  return toDTO(row);
}

export async function markAllRead(db: Db, userId: string): Promise<{ unread: number }> {
  await db
    .update(notifications)
    .set({ readAt: isoUtcNow() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return { unread: await unreadCount(db, userId) };
}
