/**
 * Service Objectifs — CRUD + archivage/achèvement.
 * Suppression = hard delete ; les tâches/habitudes liées basculent goalId → null
 * (FK ON DELETE SET NULL).
 */
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { isoUtcNow, type GoalDTO } from '@charbon/shared';
import type { Db } from '../db/client.js';
import { goals } from '../db/schema.js';
import { notFound } from '../lib/errors.js';

type GoalRow = typeof goals.$inferSelect;

export function toGoalDTO(row: GoalRow): GoalDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    targetDate: row.targetDate,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listGoals(db: Db, userId: string, status?: 'active' | 'completed' | 'archived'): Promise<GoalDTO[]> {
  const where = status ? and(eq(goals.userId, userId), eq(goals.status, status)) : eq(goals.userId, userId);
  const rows = await db.select().from(goals).where(where).all();
  return rows
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toGoalDTO);
}

export async function getGoal(db: Db, userId: string, id: string): Promise<GoalDTO> {
  const row = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).get();
  if (!row) throw notFound('Objectif introuvable');
  return toGoalDTO(row);
}

export async function createGoal(
  db: Db,
  userId: string,
  input: { title: string; description?: string | null; targetDate?: string | null },
): Promise<GoalDTO> {
  const now = isoUtcNow();
  const row = await db
    .insert(goals)
    .values({
      id: randomUUID(),
      userId,
      title: input.title,
      description: input.description ?? null,
      targetDate: input.targetDate ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  return toGoalDTO(row);
}

export async function updateGoal(
  db: Db,
  userId: string,
  id: string,
  patch: { title?: string; description?: string | null; targetDate?: string | null },
): Promise<GoalDTO> {
  const existing = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).get();
  if (!existing) throw notFound('Objectif introuvable');
  const row = await db
    .update(goals)
    .set({ ...patch, updatedAt: isoUtcNow() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning()
    .get();
  return toGoalDTO(row);
}

export async function setGoalStatus(
  db: Db,
  userId: string,
  id: string,
  status: 'active' | 'completed' | 'archived',
): Promise<GoalDTO> {
  const existing = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).get();
  if (!existing) throw notFound('Objectif introuvable');
  const row = await db
    .update(goals)
    .set({ status, updatedAt: isoUtcNow() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning()
    .get();
  return toGoalDTO(row);
}

export async function deleteGoal(db: Db, userId: string, id: string): Promise<void> {
  const existing = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).get();
  if (!existing) throw notFound('Objectif introuvable');
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

/**
 * Vérifie qu'un objectif appartient bien à l'utilisateur (utilisé quand une
 * tâche/habitude référence un goalId — empêche l'attachement inter-comptes).
 */
export async function assertGoalOwnership(db: Db, userId: string, goalId: string): Promise<void> {
  const row = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .get();
  if (!row) throw notFound('Objectif introuvable');
}
