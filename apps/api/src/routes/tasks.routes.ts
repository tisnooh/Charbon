/** Routes Tâches — CRUD, complétion, suppression douce + restauration. */
import type { FastifyInstance } from 'fastify';
import { taskCreateSchema, taskUpdateSchema } from '@charbon/shared';
import { z } from 'zod';
import type { RoutePluginOpts } from './index.js';
import { parseUuidParam, parseWith } from '../lib/parse.js';
import * as tasksService from '../services/tasks.service.js';
import * as goalsService from '../services/goals.service.js';

const listQuerySchema = z.object({
  view: z.enum(['today', 'upcoming', 'all', 'done', 'deleted']).default('today'),
});

export async function tasksRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/tasks', async (req, reply) => {
    const user = await app.requireUser(req);
    const query = parseWith(listQuerySchema, req.query, 'Query invalide');
    const items = await tasksService.listTasks(db, user.id, query.view, user.today, user.timezone);
    return reply.send({ items });
  });

  app.post('/tasks', async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(taskCreateSchema, req.body, 'Tâche invalide');
    if (input.goalId) await goalsService.assertGoalOwnership(db, user.id, input.goalId);
    return reply.status(201).send(await tasksService.createTask(db, user.id, input));
  });

  app.get('/tasks/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await tasksService.getTask(db, user.id, parseUuidParam(id)));
  });

  app.patch('/tasks/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const patch = parseWith(taskUpdateSchema, req.body, 'Tâche invalide');
    if (patch.goalId) await goalsService.assertGoalOwnership(db, user.id, patch.goalId);
    return reply.send(await tasksService.updateTask(db, user.id, parseUuidParam(id), patch));
  });

  app.post('/tasks/:id/complete', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await tasksService.completeTask(db, user.id, parseUuidParam(id)));
  });

  app.post('/tasks/:id/uncomplete', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await tasksService.uncompleteTask(db, user.id, parseUuidParam(id)));
  });

  app.delete('/tasks/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await tasksService.softDeleteTask(db, user.id, parseUuidParam(id)));
  });

  app.post('/tasks/:id/restore', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await tasksService.restoreTask(db, user.id, parseUuidParam(id)));
  });
}
