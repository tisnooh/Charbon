/** Routes Objectifs. */
import type { FastifyInstance } from 'fastify';
import { goalCreateSchema, goalStatusSchema, goalUpdateSchema } from '@charbon/shared';
import { z } from 'zod';
import type { RoutePluginOpts } from './index.js';
import { parseUuidParam, parseWith } from '../lib/parse.js';
import * as goalsService from '../services/goals.service.js';

const listQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export async function goalsRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/goals', async (req, reply) => {
    const user = await app.requireUser(req);
    const query = parseWith(listQuerySchema, req.query, 'Query invalide');
    return reply.send({ items: await goalsService.listGoals(db, user.id, query.status) });
  });

  app.post('/goals', async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(goalCreateSchema, req.body, 'Objectif invalide');
    return reply.status(201).send(await goalsService.createGoal(db, user.id, input));
  });

  app.get('/goals/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await goalsService.getGoal(db, user.id, parseUuidParam(id)));
  });

  app.patch('/goals/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const patch = parseWith(goalUpdateSchema, req.body, 'Objectif invalide');
    return reply.send(await goalsService.updateGoal(db, user.id, parseUuidParam(id), patch));
  });

  app.patch('/goals/:id/status', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const { status } = parseWith(
      z.object({ status: goalStatusSchema }),
      req.body,
      'Statut invalide',
    );
    return reply.send(await goalsService.setGoalStatus(db, user.id, parseUuidParam(id), status));
  });

  app.delete('/goals/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    await goalsService.deleteGoal(db, user.id, parseUuidParam(id));
    return reply.send({ ok: true });
  });
}
