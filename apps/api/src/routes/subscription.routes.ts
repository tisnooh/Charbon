/** Routes Abonnement (Free/Premium) — état toujours réel, jamais simulé silencieusement. */
import type { FastifyInstance } from 'fastify';
import type { RoutePluginOpts } from './index.js';
import * as subscriptionService from '../services/subscription.service.js';

export async function subscriptionRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db, config } = opts.ctx;

  app.get('/subscription', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send(await subscriptionService.getSubscription(db, user.id, config));
  });

  app.post('/subscription/upgrade', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send(await subscriptionService.upgradeSubscription(db, user.id, config));
  });

  app.post('/subscription/cancel', async (req, reply) => {
    const user = await app.requireUser(req);
    return reply.send(await subscriptionService.cancelSubscription(db, user.id, config));
  });
}
