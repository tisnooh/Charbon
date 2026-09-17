import type { FastifyInstance } from 'fastify';
import { version } from '../version.js';
import type { RoutePluginOpts } from './index.js';

export async function healthRoutes(app: FastifyInstance, _opts: RoutePluginOpts): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'charbon-api',
    version,
    uptimeSeconds: Math.round(process.uptime()),
  }));
}
