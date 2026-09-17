/**
 * Gestion d'erreurs globale — réponses JSON uniformes :
 * { error: { code, message, details? } }  (shape défini dans @charbon/shared).
 * Ne fuit jamais de stack trace ni de détail interne en production.
 */
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler((error: Error & { statusCode?: number }, req, reply) => {
    if (error instanceof ZodError) {
      void reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Entrée invalide',
          details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
      });
      return;
    }

    if (error instanceof AppError) {
      void reply.status(error.status).send({
        error: { code: error.code, message: error.message, ...(error.details !== undefined ? { details: error.details } : {}) },
      });
      return;
    }

    // Rate limiting (@fastify/rate-limit renvoie statusCode 429).
    if (error.statusCode === 429) {
      void reply.status(429).send({
        error: { code: 'rate_limited', message: 'Trop de requêtes, réessayez dans un moment.' },
      });
      return;
    }

    // Body JSON invalide (Fastify) → 400 plutôt que 500.
    if (error.statusCode === 400) {
      void reply.status(400).send({
        error: { code: 'validation_error', message: 'Requête invalide' },
      });
      return;
    }

    req.log.error({ err: error }, 'Erreur interne non gérée');
    void reply.status(500).send({
      error: { code: 'internal_error', message: 'Erreur interne du serveur' },
    });
  });
}
