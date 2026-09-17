/** Routes Stats + Today (dashboard). */
import type { FastifyInstance } from 'fastify';
import { statsRangeSchema } from '@charbon/shared';
import { z } from 'zod';
import type { RoutePluginOpts } from './index.js';
import { parseWith } from '../lib/parse.js';
import * as statsService from '../services/stats.service.js';

const summaryQuerySchema = z.object({
  range: statsRangeSchema.default('7d'),
});

export async function statsRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db } = opts.ctx;

  app.get('/stats/summary', async (req, reply) => {
    const user = await app.requireUser(req);
    const query = parseWith(summaryQuerySchema, req.query, 'Query invalide');
    return reply.send(
      await statsService.statsSummary(db, user.id, user.timezone, user.plan, query.range),
    );
  });
}
