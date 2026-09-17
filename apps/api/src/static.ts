/**
 * Service des builds frontaux en production (un seul déploiement) :
 * - `/`      → site vitrine (apps/site/dist, pages statiques réelles)
 * - `/app/*` → application PWA (apps/mobile/dist, SPA fallback index.html)
 * - `/api/*` → reste géré par les routes API (JSON)
 *
 * En dev, Vite sert les frontends sur leurs ports (5173/5174) avec proxy /api.
 * Si un build est absent, le serveur démarre quand même (API seule) — jamais
 * de fausse page : 404 JSON explicite.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

const here = dirname(fileURLToPath(import.meta.url));

export function frontendDistPaths(): { siteDist: string; mobileDist: string } {
  // src/ (dev, tsx) et dist/ (build) sont tous deux à apps/api/<x>/ → ../../
  return {
    siteDist: resolve(here, '../../site/dist'),
    mobileDist: resolve(here, '../../mobile/dist'),
  };
}

export async function registerStatic(app: FastifyInstance): Promise<{ site: boolean; app: boolean }> {
  const { siteDist, mobileDist } = frontendDistPaths();
  const served = { site: false, app: false };

  if (existsSync(mobileDist)) {
    await app.register(fastifyStatic, {
      root: mobileDist,
      prefix: '/app/',
      wildcard: false,
    });
    served.app = true;
  }

  if (existsSync(siteDist)) {
    await app.register(fastifyStatic, {
      root: siteDist,
      prefix: '/',
      index: ['index.html'],
      wildcard: false,
      decorateReply: !served.app, // un seul décorateur sendFile
    });
    served.site = true;
  }

  return served;
}

/**
 * Gestionnaire 404 unique (posé dans app.ts APRÈS registerStatic) :
 * - /app/* → SPA fallback (index.html) si le build mobile est servi ;
 * - /api/* → 404 JSON ;
 * - sinon  → 404 JSON générique.
 */
export function installNotFoundHandler(
  app: FastifyInstance,
  served: { site: boolean; app: boolean },
  mobileDist: string,
): void {
  app.setNotFoundHandler((req, reply) => {
    if (served.app && (req.url === '/app' || req.url.startsWith('/app/'))) {
      return reply.sendFile('index.html', mobileDist);
    }
    if (req.url.startsWith('/api/')) {
      return reply.status(404).send({ error: { code: 'not_found', message: 'Route introuvable' } });
    }
    return reply.status(404).send({ error: { code: 'not_found', message: 'Introuvable' } });
  });
}
