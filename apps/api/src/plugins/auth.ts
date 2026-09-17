/**
 * Authentification par sessions opaques :
 * - cookie httpOnly `charbon_session` (SameSite=Lax, Secure en production),
 * - token aléatoire 256 bits, stocké en base sous forme d'empreinte SHA-256,
 * - expiration glissante (SESSION_TTL_DAYS) + nettoyage des sessions expirées,
 * - `req.user` résolu sur chaque requete (null si anonyme),
 * - `requireUser` : preHandler qui refuse les accès non authentifiés (401).
 *
 * Aucun secret serveur requis : une fuite de la base ne permet pas de rejouer
 * les sessions (empreintes non inversables).
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { sessions, subscriptions, users } from '../db/schema.js';
import type { Db } from '../db/client.js';
import { sha256Hex } from '../lib/tokens.js';
import { unauthorized } from '../lib/errors.js';
import { isoUtcNow, todayInTz, type PlanId } from '@charbon/shared';

export const SESSION_COOKIE = 'charbon_session';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  plan: PlanId;
  onboardingCompleted: boolean;
  remindersEnabled: boolean;
  dailyReminderTime: string;
  /** Aujourd'hui (date civile) dans le fuseau de l'utilisateur — source de vérité serveur. */
  today: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: RequestUser | null;
  }
  interface FastifyInstance {
    db: Db;
    requireUser: (req: FastifyRequest) => Promise<RequestUser>;
    readSessionUser: (req: FastifyRequest) => Promise<RequestUser | null>;
  }
}

const ONE_HOUR_MS = 3_600_000;

export function setupAuth(fastify: FastifyInstance, db: Db): void {
  fastify.decorate('db', db);
  fastify.decorateRequest('user', null);

  async function readSessionUser(req: FastifyRequest): Promise<RequestUser | null> {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return null;
    const tokenHash = sha256Hex(token);
    const now = isoUtcNow();

    const row = await db
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        lastSeenAt: sessions.lastSeenAt,
        userId: users.id,
        email: users.email,
        name: users.name,
        timezone: users.timezone,
        onboardingCompleted: users.onboardingCompleted,
        remindersEnabled: users.remindersEnabled,
        dailyReminderTime: users.dailyReminderTime,
        plan: subscriptions.plan,
        subscriptionStatus: subscriptions.status,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .get();

    if (!row) return null;

    if (row.expiresAt <= now) {
      await db.delete(sessions).where(eq(sessions.id, row.sessionId));
      return null;
    }

    // Écriture de rafraîchissement au maximum 1×/heure (limite l'usure d'écriture).
    const lastSeen = new Date(row.lastSeenAt).getTime();
    if (Number.isFinite(lastSeen) && Date.now() - lastSeen > ONE_HOUR_MS) {
      await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.sessionId));
    }

    const plan: PlanId =
      row.plan === 'premium' && row.subscriptionStatus === 'active' ? 'premium' : 'free';

    return {
      id: row.userId,
      email: row.email,
      name: row.name,
      timezone: row.timezone,
      plan,
      onboardingCompleted: row.onboardingCompleted,
      remindersEnabled: row.remindersEnabled,
      dailyReminderTime: row.dailyReminderTime,
      today: todayInTz(row.timezone),
    };
  }

  fastify.decorate('readSessionUser', readSessionUser);

  fastify.decorate('requireUser', async (req: FastifyRequest): Promise<RequestUser> => {
    const user = await readSessionUser(req);
    if (!user) throw unauthorized('Session absente ou expirée');
    req.user = user;
    return user;
  });

  fastify.addHook('onRequest', async (req) => {
    req.user = await readSessionUser(req);
  });
}
