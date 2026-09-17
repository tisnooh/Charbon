/**
 * Contexte partagé des routes + enregistrement sous /api/v1.
 */
import type { FastifyInstance } from 'fastify';
import type { Db } from '../db/client.js';
import type { AppConfig } from '../config/env.js';
import type { Mailer } from '../lib/mailer.js';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from './auth.routes.js';
import { meRoutes } from './me.routes.js';
import { goalsRoutes } from './goals.routes.js';
import { tasksRoutes } from './tasks.routes.js';
import { habitsRoutes } from './habits.routes.js';
import { routinesRoutes } from './routines.routes.js';
import { statsRoutes } from './stats.routes.js';
import { todayRoutes } from './today.routes.js';
import { notificationsRoutes } from './notifications.routes.js';
import { subscriptionRoutes } from './subscription.routes.js';
import { contactRoutes } from './contact.routes.js';
import { devRoutes } from './dev.routes.js';

export interface ApiContext {
  db: Db;
  config: AppConfig;
  mailer: Mailer;
}

export async function registerRoutes(app: FastifyInstance, ctx: ApiContext): Promise<void> {
  const prefix = '/api/v1';
  await app.register(healthRoutes, { prefix, ctx });
  await app.register(authRoutes, { prefix, ctx });
  await app.register(meRoutes, { prefix, ctx });
  await app.register(goalsRoutes, { prefix, ctx });
  await app.register(tasksRoutes, { prefix, ctx });
  await app.register(habitsRoutes, { prefix, ctx });
  await app.register(routinesRoutes, { prefix, ctx });
  await app.register(statsRoutes, { prefix, ctx });
  await app.register(todayRoutes, { prefix, ctx });
  await app.register(notificationsRoutes, { prefix, ctx });
  await app.register(subscriptionRoutes, { prefix, ctx });
  await app.register(contactRoutes, { prefix, ctx });
  await app.register(devRoutes, { prefix, ctx });
}

export interface RoutePluginOpts {
  prefix: string;
  ctx: ApiContext;
}

/** Limite de débit des routes sensibles (auth) — fenêtre 10 minutes. */
export function authRateLimit(config: AppConfig) {
  return {
    rateLimit: {
      max: config.rateLimitAuthMax,
      timeWindow: '10 minutes',
    },
  };
}
