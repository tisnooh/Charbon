/**
 * Routes profil + onboarding.
 * L'onboarding crée objectifs, habitudes et routines en une requête,
 * puis marque le profil comme onboardé.
 */
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { isoUtcNow, onboardingSchema, updateProfileSchema } from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { parseWith } from '../lib/parse.js';
import { users } from '../db/schema.js';
import * as authService from '../services/auth.service.js';
import * as goalsService from '../services/goals.service.js';
import * as habitsService from '../services/habits.service.js';
import * as routinesService from '../services/routines.service.js';

export async function meRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/me', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send(await authService.getSessionResponse(db, user.id));
  });

  app.patch('/me', async (req, reply) => {
    const user = await app.requireUser(req);
    const patch = parseWith(updateProfileSchema, req.body, 'Profil invalide');
    const values: Record<string, unknown> = { updatedAt: isoUtcNow() };
    if (patch.name !== undefined) values.name = patch.name;
    if (patch.timezone !== undefined) values.timezone = patch.timezone;
    if (patch.remindersEnabled !== undefined) values.remindersEnabled = patch.remindersEnabled;
    if (patch.dailyReminderTime !== undefined) values.dailyReminderTime = patch.dailyReminderTime;
    if (patch.onboardingCompleted !== undefined) values.onboardingCompleted = patch.onboardingCompleted;
    await db.update(users).set(values).where(eq(users.id, user.id));
    return reply.send(await authService.getSessionResponse(db, user.id));
  });

  app.post('/onboarding', async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(onboardingSchema, req.body, 'Onboarding invalide');

    const goals = [];
    for (const g of input.goals) {
      goals.push(await goalsService.createGoal(db, user.id, g));
    }
    const habits = [];
    for (const h of input.habits) {
      const goalId = h.goalId ?? null;
      if (goalId) await goalsService.assertGoalOwnership(db, user.id, goalId);
      habits.push(await habitsService.createHabit(db, user.id, user.timezone, h));
    }
    const routines = [];
    for (const r of input.routines) {
      routines.push(await routinesService.createRoutine(db, user.id, user.timezone, r));
    }

    await db
      .update(users)
      .set({ onboardingCompleted: true, updatedAt: isoUtcNow() })
      .where(eq(users.id, user.id));

    return reply.status(201).send({
      ok: true,
      created: { goals, habits, routines },
      me: await authService.getSessionResponse(db, user.id),
    });
  });
}
