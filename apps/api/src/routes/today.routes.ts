import type { FastifyInstance } from 'fastify';
import type { RoutePluginOpts } from './index.js';
import { getToday } from '../services/today.service.js';

export async function todayRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/today', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send(await getToday(db, user));
  });
}
