/**
 * Routes de développement — outbox e-mails (mode sans SMTP).
 * DÉSACTIVÉES en production (404) : aucune donnée n'est exposée.
 */
import { desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RoutePluginOpts } from './index.js';
import { parseWith } from '../lib/parse.js';
import { devOutboxEmails } from '../db/schema.js';
import { notFound } from '../lib/errors.js';

const querySchema = z.object({
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export async function devRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db, config } = opts.ctx;

  app.get('/dev/emails', async (req, reply) => {
    if (config.isProduction) throw notFound('Route introuvable');
    const query = parseWith(querySchema, req.query, 'Query invalide');
    const where = query.to ? eq(devOutboxEmails.toAddress, query.to.toLowerCase()) : undefined;
    const rows = await db
      .select()
      .from(devOutboxEmails)
      .where(where)
      .orderBy(desc(devOutboxEmails.createdAt))
      .limit(query.limit)
      .all();
    return reply.send({ items: rows });
  });
}
