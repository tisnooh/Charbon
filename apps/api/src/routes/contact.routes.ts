/** Formulaire de contact du site vitrine — public, limité en débit, stocké en base. */
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { contactSchema, isoUtcNow } from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { parseWith } from '../lib/parse.js';
import { contactMessages } from '../db/schema.js';

export async function contactRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db, config } = opts.ctx;

  app.post(
    '/contact',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (req, reply) => {
      const input = parseWith(contactSchema, req.body, 'Message invalide');
      await db.insert(contactMessages).values({
        id: randomUUID(),
        name: input.name,
        email: input.email,
        message: input.message,
        createdAt: isoUtcNow(),
      });
      // Copie dans l'outbox dev si pas de SMTP (traçabilité locale réelle).
      if (!config.smtp) {
        await opts.ctx.mailer.send({
          to: 'contact@charbon.local',
          subject: `[Contact site] ${input.name}`,
          text: `De : ${input.name} <${input.email}>\n\n${input.message}`,
        });
      }
      return reply.status(201).send({
        ok: true,
        message: 'Message reçu — nous revenons vers vous par e-mail.',
      });
    },
  );
}
