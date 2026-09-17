import type { FastifyInstance } from 'fastify';
import { paginationQuerySchema } from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { parseUuidParam, parseWith } from '../lib/parse.js';
import * as notificationsService from '../services/notifications.service.js';

export async function notificationsRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/notifications', async (req, reply) => {
    const user = await app.requireUser(req);
    const query = parseWith(paginationQuerySchema, req.query, 'Query invalide');
    return reply.send(
      await notificationsService.listNotifications(db, user.id, {
        limit: query.limit,
        offset: query.offset,
      }),
    );
  });

  app.post('/notifications/read-all', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send(await notificationsService.markAllRead(db, user.id));
  });

  app.post('/notifications/:id/read', async (req, reply) => {
    const user = await app.requireUser(req);
    const { id } = req.params as { id: string };
    return reply.send(await notificationsService.markRead(db, user.id, parseUuidParam(id)));
  });
}
