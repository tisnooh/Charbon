/** Routes Routines — CRUD, actions (items), validations quotidiennes. */
import type { FastifyInstance } from 'fastify';
import {
  isoDateSchema,
  routineCreateSchema,
  routineItemCompleteSchema,
  routineItemsOrderSchema,
  routineItemSchema,
  routineItemUpdateSchema,
  routineUpdateSchema,
} from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { parseUuidParam, parseWith } from '../lib/parse.js';
import * as routinesService from '../services/routines.service.js';

export async function routinesRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/routines/today', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send({ items: await routinesService.routinesToday(db, user.id, user.timezone) });
  });

  app.get('/routines', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send({ items: await routinesService.listRoutines(db, user.id) });
  });

  app.post('/routines', async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(routineCreateSchema, req.body, 'Routine invalide');
    return reply
      .status(201)
      .send(await routinesService.createRoutine(db, user.id, user.timezone, input));
  });

  app.get('/routines/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await routinesService.getRoutine(db, user.id, parseUuidParam(id)));
  });

  app.patch('/routines/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const patch = parseWith(routineUpdateSchema, req.body, 'Routine invalide');
    return reply.send(await routinesService.updateRoutine(db, user.id, parseUuidParam(id), patch));
  });

  app.delete('/routines/:id', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    await routinesService.softDeleteRoutine(db, user.id, parseUuidParam(id));
    return reply.send({ ok: true });
  });

  app.post('/routines/:id/items', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const input = parseWith(routineItemSchema, req.body, 'Action invalide');
    return reply
      .status(201)
      .send(await routinesService.addRoutineItem(db, user.id, parseUuidParam(id), input));
  });

  app.put('/routines/:id/items/order', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    const input = parseWith(routineItemsOrderSchema, req.body, 'Ordre invalide');
    return reply.send(
      await routinesService.reorderRoutineItems(db, user.id, parseUuidParam(id), input.itemIds),
    );
  });

  app.patch('/routines/:id/items/:itemId', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id, itemId } = req.params as { id: string; itemId: string };
    const patch = parseWith(routineItemUpdateSchema, req.body, 'Action invalide');
    return reply.send(
      await routinesService.updateRoutineItem(db, user.id, parseUuidParam(id), parseUuidParam(itemId), patch),
    );
  });

  app.delete('/routines/:id/items/:itemId', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id, itemId } = req.params as { id: string; itemId: string };
    return reply.send(
      await routinesService.deleteRoutineItem(db, user.id, parseUuidParam(id), parseUuidParam(itemId)),
    );
  });

  app.post('/routines/:id/items/:itemId/completions', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id, itemId } = req.params as { id: string; itemId: string };
    const input = parseWith(routineItemCompleteSchema, req.body ?? {}, 'Validation invalide');
    return reply.send(
      await routinesService.completeRoutineItem(
        db,
        user.id,
        parseUuidParam(id),
        parseUuidParam(itemId),
        user.timezone,
        input,
      ),
    );
  });

  app.delete('/routines/:id/items/:itemId/completions/:date', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id, itemId, date } = req.params as { id: string; itemId: string; date: string };
    parseWith(isoDateSchema, date, 'Date invalide');
    return reply.send(
      await routinesService.uncompleteRoutineItem(
        db,
        user.id,
        parseUuidParam(id),
        parseUuidParam(itemId),
        user.timezone,
        date,
      ),
    );
  });
}
