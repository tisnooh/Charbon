/**
 * Routes d'authentification.
 * Cookie de session : httpOnly, SameSite=Lax, Secure en production.
 * Rate limiting renforcé sur les routes sensibles (anti brute-force).
 */
import type { FastifyInstance } from 'fastify';
import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@charbon/shared';
import type { RoutePluginOpts } from './index.js';
import { SESSION_COOKIE } from '../plugins/auth.js';
import { parseWith } from '../lib/parse.js';
import * as authService from '../services/auth.service.js';

export async function authRoutes(app: FastifyInstance, opts: RoutePluginOpts): Promise<void> {
  const { db, config } = opts.ctx;
  const sensitive = { config: { rateLimit: { max: config.rateLimitAuthMax, timeWindow: '10 minutes' } } };

  const cookieOpts = (maxAgeSeconds: number) => ({
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.isProduction,
    maxAge: maxAgeSeconds,
  });

  const userAgent = (ua: string | string[] | undefined): string | undefined =>
    typeof ua === 'string' ? ua : undefined;

  app.post('/auth/register', sensitive, async (req, reply) => {
    const input = parseWith(registerSchema, req.body, 'Inscription invalide');
    const { token, session } = await authService.register(db, config, input, userAgent(req.headers['user-agent']));
    reply.setCookie(SESSION_COOKIE, token, cookieOpts(config.sessionTtlDays * 86_400));
    return reply.status(201).send(session);
  });

  app.post('/auth/login', sensitive, async (req, reply) => {
    const input = parseWith(loginSchema, req.body, 'Identifiants invalides');
    const { token, session } = await authService.login(db, config, input, userAgent(req.headers['user-agent']));
    reply.setCookie(SESSION_COOKIE, token, cookieOpts(config.sessionTtlDays * 86_400));
    return reply.send(session);
  });

  app.post('/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    await authService.logout(db, token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.send({ ok: true });
  });

  app.get('/auth/me', async (req, reply) => {
    const user = await app.requireUser(req);
    const session = await authService.getSessionResponse(db, user.id);
    return reply.send(session);
  });

  app.post('/auth/forgot-password', sensitive, async (req, reply) => {
    const input = parseWith(forgotPasswordSchema, req.body, 'Entrée invalide');
    await authService.forgotPassword(db, config, opts.ctx.mailer, input);
    // Réponse volontairement identique que le compte existe ou non.
    return reply.status(202).send({
      ok: true,
      message: 'Si un compte correspond à cet e-mail, un lien de réinitialisation vient d’être envoyé.',
    });
  });

  app.post('/auth/reset-password', sensitive, async (req, reply) => {
    const input = parseWith(resetPasswordSchema, req.body, 'Entrée invalide');
    await authService.resetPassword(db, input);
    return reply.send({ ok: true });
  });

  app.post('/auth/change-password', sensitive, async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(changePasswordSchema, req.body, 'Entrée invalide');
    await authService.changePassword(db, user.id, req.cookies[SESSION_COOKIE], input);
    return reply.send({ ok: true });
  });

  app.delete('/auth/account', sensitive, async (req, reply) => {
    const user = await app.requireUser(req);
    const input = parseWith(deleteAccountSchema, req.body, 'Entrée invalide');
    await authService.deleteAccount(db, user.id, input);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.send({ ok: true });
  });
}
