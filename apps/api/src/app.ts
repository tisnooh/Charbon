/**
 * Fabrique de l'application Fastify — utilisée par le point d'entrée ET les
 * tests (inject). Ordre d'assemblage :
 * cookie → cors → rate-limit → auth (décorateurs) → erreurs → routes → statiques.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { loadConfig, type AppConfig } from './config/env.js';
import { createDb, type DbHandle } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { setupAuth } from './plugins/auth.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { createMailer } from './lib/mailer.js';
import { registerRoutes } from './routes/index.js';
import { frontendDistPaths, installNotFoundHandler, registerStatic } from './static.js';

export interface BuildAppOptions {
  config?: AppConfig;
  /** false pour les tests unitaires/HTTP sans bruit. */
  logger?: boolean;
  /** false = ne pas servir les builds frontaux. */
  serveStatic?: boolean;
}

export interface BuiltApp {
  app: FastifyInstance;
  dbHandle: DbHandle;
  config: AppConfig;
  mailerMode: 'smtp' | 'dev-outbox';
  close: () => Promise<void>;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<BuiltApp> {
  const config = options.config ?? loadConfig();
  const dbHandle = createDb(config.dbPath);
  await runMigrations(dbHandle.db);

  const app = Fastify({
    logger: options.logger ?? false,
  });

  // Robustesse : un POST/PUT avec `Content-Type: application/json` et corps
  // VIDE est toléré (→ {}), un JSON malformé reste un 400 propre.
  // (Certains clients — curl, fetch manuels — envoient le header sans body.)
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    const raw = typeof body === 'string' ? body : String(body);
    if (raw.trim() === '') {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(raw) as unknown);
    } catch {
      const err = new Error('JSON invalide') as Error & { statusCode?: number };
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  await app.register(cookie);

  const allowedOrigins = new Set<string>([config.appBaseUrl, config.siteBaseUrl, ...config.corsOrigins]);
  if (!config.isProduction) {
    for (const origin of [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'http://localhost:4174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ]) {
      allowedOrigins.add(origin);
    }
  }
  await app.register(cors, {
    origin: (origin, cb) => {
      // Requêtes same-origin (curl, app servie par l'API) : pas d'en-tête Origin.
      if (!origin) return cb(null, true);
      return cb(null, allowedOrigins.has(origin));
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, ctx) => ({
      error: {
        code: 'rate_limited',
        message: `Trop de requêtes — réessayez dans ${ctx.after}.`,
      },
    }),
  });

  setupAuth(app, dbHandle.db);
  registerErrorHandler(app);

  const mailer = createMailer(config, dbHandle.db);
  await registerRoutes(app, { db: dbHandle.db, config, mailer });

  const serveStatic = options.serveStatic ?? config.serveStatic;
  let served = { site: false, app: false };
  if (serveStatic) {
    served = await registerStatic(app);
  }
  installNotFoundHandler(app, served, frontendDistPaths().mobileDist);

  return {
    app,
    dbHandle,
    config,
    mailerMode: mailer.mode,
    close: async () => {
      await app.close();
      dbHandle.client.close();
    },
  };
}
