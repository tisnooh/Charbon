/**
 * Service d'authentification : inscription, connexion, sessions,
 * réinitialisation de mot de passe, changement de mot de passe,
 * suppression de compte.
 *
 * Convention : la validation zod des entrées est faite dans les ROUTES
 * (parseWith) ; ce service manipule des types déjà validés.
 */
import { randomUUID } from 'node:crypto';
import { and, eq, isNull, ne } from 'drizzle-orm';
import {
  isoUtcNow,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type SessionResponse,
  type UserMe,
} from '@charbon/shared';
import type { Db } from '../db/client.js';
import { passwordResetTokens, sessions, subscriptions, users } from '../db/schema.js';
import { dummyVerify, hashPassword, verifyPassword } from '../lib/password.js';
import { randomToken, sha256Hex } from '../lib/tokens.js';
import { badRequest, conflict, forbidden, unauthorized } from '../lib/errors.js';
import type { AppConfig } from '../config/env.js';
import type { Mailer } from '../lib/mailer.js';
import { passwordResetEmail } from '../lib/mailer.js';

const RESET_TOKEN_TTL_MINUTES = 30;

type UserRow = typeof users.$inferSelect;

export function toUserMe(row: UserRow): UserMe {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    timezone: row.timezone,
    remindersEnabled: row.remindersEnabled,
    dailyReminderTime: row.dailyReminderTime,
    onboardingCompleted: row.onboardingCompleted,
    createdAt: row.createdAt,
  };
}

export async function createSession(
  db: Db,
  userId: string,
  config: AppConfig,
  userAgent?: string,
): Promise<string> {
  const token = randomToken(32);
  const now = isoUtcNow();
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 86_400_000).toISOString();
  await db.insert(sessions).values({
    id: randomUUID(),
    tokenHash: sha256Hex(token),
    userId,
    createdAt: now,
    expiresAt,
    lastSeenAt: now,
    userAgent: userAgent?.slice(0, 300) ?? null,
  });
  return token;
}

export async function register(
  db: Db,
  config: AppConfig,
  input: RegisterInput,
  userAgent?: string,
): Promise<{ token: string; session: SessionResponse }> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .get();
  if (existing) throw conflict('email_taken', 'Un compte existe déjà avec cet e-mail');

  const now = isoUtcNow();
  const userId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email: input.email,
      passwordHash: hashPassword(input.password),
      name: input.name,
      timezone: input.timezone ?? 'UTC',
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(subscriptions).values({
      id: randomUUID(),
      userId,
      plan: 'free',
      status: 'active',
      provider: 'none',
      createdAt: now,
      updatedAt: now,
    });
  });

  const token = await createSession(db, userId, config, userAgent);
  const row = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) throw unauthorized('Compte introuvable après création');
  return { token, session: { user: toUserMe(row), plan: 'free' } };
}

export async function login(
  db: Db,
  config: AppConfig,
  input: LoginInput,
  userAgent?: string,
): Promise<{ token: string; session: SessionResponse }> {
  const row = await db.select().from(users).where(eq(users.email, input.email)).get();
  if (!row) {
    dummyVerify(); // temps de réponse homogène (anti-énumération)
    throw unauthorized('E-mail ou mot de passe incorrect');
  }
  if (!verifyPassword(input.password, row.passwordHash)) {
    throw unauthorized('E-mail ou mot de passe incorrect');
  }
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, row.id)).get();
  const token = await createSession(db, row.id, config, userAgent);
  return {
    token,
    session: {
      user: toUserMe(row),
      plan: sub?.plan === 'premium' && sub.status === 'active' ? 'premium' : 'free',
    },
  };
}

export async function logout(db: Db, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.tokenHash, sha256Hex(token)));
}

/** Réponse volontairement identique que le compte existe ou non. */
export async function forgotPassword(
  db: Db,
  config: AppConfig,
  mailer: Mailer,
  input: ForgotPasswordInput,
): Promise<void> {
  const row = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, input.email))
    .get();
  if (!row) return;

  const now = isoUtcNow();
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(and(eq(passwordResetTokens.userId, row.id), isNull(passwordResetTokens.usedAt)));

  const token = randomToken(32);
  await db.insert(passwordResetTokens).values({
    id: randomUUID(),
    tokenHash: sha256Hex(token),
    userId: row.id,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000).toISOString(),
    createdAt: now,
  });

  await mailer.send({ to: row.email, ...passwordResetEmail(config.appBaseUrl, token) });
}

export async function resetPassword(db: Db, input: ResetPasswordInput): Promise<void> {
  const row = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, sha256Hex(input.token)))
    .get();
  if (!row || row.usedAt !== null || row.expiresAt <= isoUtcNow()) {
    throw badRequest('Lien de réinitialisation invalide ou expiré');
  }
  const now = isoUtcNow();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash: hashPassword(input.password), updatedAt: now })
      .where(eq(users.id, row.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, row.id));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));
  });
}

export async function changePassword(
  db: Db,
  userId: string,
  currentToken: string | undefined,
  input: ChangePasswordInput,
): Promise<void> {
  const row = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) throw unauthorized();
  if (!verifyPassword(input.currentPassword, row.passwordHash)) {
    throw forbidden('Mot de passe courant incorrect');
  }
  await db
    .update(users)
    .set({ passwordHash: hashPassword(input.password), updatedAt: isoUtcNow() })
    .where(eq(users.id, userId));
  if (currentToken) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, sha256Hex(currentToken))));
  }
}

export async function deleteAccount(
  db: Db,
  userId: string,
  input: DeleteAccountInput,
): Promise<void> {
  const row = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) throw unauthorized();
  if (!verifyPassword(input.password, row.passwordHash)) {
    throw forbidden('Mot de passe incorrect — suppression annulée');
  }
  // Cascades FK : sessions, objectifs, tâches, habitudes, complétions,
  // routines, abonnement, notifications (PRAGMA foreign_keys = ON).
  await db.delete(users).where(eq(users.id, userId));
}

export async function getSessionResponse(db: Db, userId: string): Promise<SessionResponse> {
  const row = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) throw unauthorized();
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  return {
    user: toUserMe(row),
    plan: sub?.plan === 'premium' && sub.status === 'active' ? 'premium' : 'free',
  };
}
