/** Routes Habitudes — CRUD, pause/reprise, validations, historique borné par plan. */
import type { FastifyInstance } from 'fastify';
import {
  habitCompleteSchema,
  habitCreateSchema,
  habitHistoryQuerySchema,
  habitUpdateSchema,
  habitHistoryDaysForPlan,
  isoDateSchema,
} from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { parseUuidParam, parseWith } from '../lib/parse.js';
import { premiumRequired } from '../lib/errors.js';
import * as habitsService from '../services/habits.service.js';
import * as goalsService from '../services/goals.service.js';

export async function habitsRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/habits', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send({ items: await habitsService.listHabits(db, user.id, user.timezone) });
  });

  app.post('/habits', async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(habitCreateSchema, req.body, 'Habitude invalide');
    if (input.goalId) await goalsService.assertGoalOwnership(db, user.id, input.goalId);
    return reply.status(201).send(await habitsService.createHabit(db, user.id, user.timezone, input));
  });

  app.get('/habits/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await habitsService.getHabit(db, user.id, parseUuidParam(id), user.timezone));
  });

  app.patch('/habits/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const patch = parseWith(habitUpdateSchema, req.body, 'Habitude invalide');
    if (patch.goalId) await goalsService.assertGoalOwnership(db, user.id, patch.goalId);
    return reply.send(await habitsService.updateHabit(db, user.id, parseUuidParam(id), user.timezone, patch));
  });

  app.post('/habits/:id/pause', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await habitsService.pauseHabit(db, user.id, parseUuidParam(id), user.timezone));
  });

  app.post('/habits/:id/resume', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await habitsService.resumeHabit(db, user.id, parseUuidParam(id), user.timezone));
  });

  app.delete('/habits/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    await habitsService.softDeleteHabit(db, user.id, parseUuidParam(id));
    return reply.send({ ok: true });
  });

  app.post('/habits/:id/completions', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const input = parseWith(habitCompleteSchema, req.body ?? {}, 'Validation invalide');
    return reply.send(
      await habitsService.completeHabit(db, user.id, parseUuidParam(id), user.timezone, input),
    );
  });

  app.delete('/habits/:id/completions/:date', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id, date } = req.params as { id: string; date: string };
    parseWith(isoDateSchema, date, 'Date invalide');
    return reply.send(
      await habitsService.uncompleteHabit(db, user.id, parseUuidParam(id), user.timezone, date),
    );
  });

  app.get('/habits/:id/history', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const query = parseWith(habitHistoryQuerySchema, req.query, 'Query invalide');
    const cap = habitHistoryDaysForPlan(user.plan);
    if (query.days > cap) {
      throw premiumRequired(
        `L’historique ${query.days} jours est réservé au plan Premium (Free : ${cap} jours).`,
      );
    }
    return reply.send(
      await habitsService.habitHistory(db, user.id, parseUuidParam(id), user.timezone, query.days),
    );
  });
}
