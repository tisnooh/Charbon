/**
 * Envoi d'e-mails — deux modes :
 * 1. SMTP configuré (production) : nodemailer, envoi réel.
 * 2. Sinon (développement) : « dev outbox » — l'e-mail est stocké en base et
 *    journalisé. Le flux (ex. réinitialisation de mot de passe) reste RÉEL et
 *    testable de bout en bout ; seul le transport externe manque.
 *    Lecture via GET /api/v1/dev/emails (route désactivée en production).
 */
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { Db } from '../db/client.js';
import { devOutboxEmails } from '../db/schema.js';
import { isoUtcNow } from '@charbon/shared';
import type { AppConfig } from '../config/env.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  readonly mode: 'smtp' | 'dev-outbox';
  send(msg: MailMessage): Promise<void>;
}

export function createMailer(config: AppConfig, db: Db): Mailer {
  if (config.smtp) {
    const transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
    return {
      mode: 'smtp',
      async send(msg) {
        await transport.sendMail({ from: config.smtp?.from, ...msg });
      },
    };
  }
  return {
    mode: 'dev-outbox',
    async send(msg) {
      await db.insert(devOutboxEmails).values({
        id: randomUUID(),
        toAddress: msg.to,
        subject: msg.subject,
        body: msg.text,
        createdAt: isoUtcNow(),
      });
      console.info(`[mailer:dev-outbox] → ${msg.to} | ${msg.subject}`);
    },
  };
}

/** Contenu des e-mails transactionnels (texte brut, liens réels). */
export function passwordResetEmail(appBaseUrl: string, token: string): Omit<MailMessage, 'to'> {
  const link = `${appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: 'Charbon — Réinitialisation de votre mot de passe',
    text: [
      'Bonjour,',
      '',
      'Une réinitialisation de mot de passe a été demandée pour votre compte Charbon.',
      `Ouvrez ce lien (valide 30 minutes) : ${link}`,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      '',
      '— L’équipe Charbon',
    ].join('\n'),
  };
}
