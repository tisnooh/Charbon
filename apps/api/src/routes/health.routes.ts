import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { version } from '../version.js';
import type { RoutePluginOpts } from './index.js';

export async function healthRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'charbon-api',
    version,
    uptimeSeconds: Math.round(process.uptime()),
  }));

  // Health DEEP : vérifie la base (docker healthcheck + monitoring externe).
  app.get('/healthz', async (_req, reply) => {
    try {
      await opts.ctx.db.run(sql`SELECT 1`);
      return { status: 'ok', db: 'ok', version };
    } catch (err) {
      return reply.status(500).send({ status: 'error', db: 'down', error: String(err) });
    }
  });
}
