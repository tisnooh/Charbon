/**
 * Configuration serveur — validée au démarrage (échec immédiat si invalide).
 * Toutes les variables ont des valeurs par défaut fonctionnelles en dev.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const boolEnv = z.enum(['true', 'false', '1', '0']);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    HOST: z.string().min(1).default('127.0.0.1'),
    DB_PATH: z.string().min(1).default('data/charbon.db'),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    APP_BASE_URL: z.string().min(1).default('http://localhost:5173'),
    SITE_BASE_URL: z.string().min(1).default('http://localhost:5174'),
    CORS_ORIGINS: z.string().default(''),
    COOKIE_DOMAIN: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: boolEnv.default('false'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().min(1).default('Charbon <noreply@charbon.example>'),
    DEV_BILLING: boolEnv.default('true'),
    SERVE_STATIC: boolEnv.default('true'),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(10),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_MONTHLY: z.string().optional(),
  })
  .transform((raw) => {
    const isProd = raw.NODE_ENV === 'production';
    const smtpConfigured =
      raw.SMTP_HOST !== undefined &&
      raw.SMTP_HOST !== '' &&
      raw.SMTP_USER !== undefined &&
      raw.SMTP_USER !== '' &&
      raw.SMTP_PASS !== undefined &&
      raw.SMTP_PASS !== '';
    return {
      nodeEnv: raw.NODE_ENV,
      isProduction: isProd,
      port: raw.PORT,
      host: raw.HOST,
      dbPath: resolve(raw.DB_PATH),
      sessionTtlDays: raw.SESSION_TTL_DAYS,
      appBaseUrl: raw.APP_BASE_URL.replace(/\/+$/, ''),
      siteBaseUrl: raw.SITE_BASE_URL.replace(/\/+$/, ''),
      cookieDomain: raw.COOKIE_DOMAIN && raw.COOKIE_DOMAIN !== '' ? raw.COOKIE_DOMAIN : undefined,
      corsOrigins: raw.CORS_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter((s) => s !== ''),
      smtp: smtpConfigured
        ? {
            host: raw.SMTP_HOST as string,
            port: raw.SMTP_PORT,
            secure: raw.SMTP_SECURE === 'true',
            user: raw.SMTP_USER as string,
            pass: raw.SMTP_PASS as string,
            from: raw.SMTP_FROM,
          }
        : null,
      // Le simulateur de facturation est TOUJOURS désactivé en production.
      devBilling: raw.DEV_BILLING === 'true' && !isProd,
      serveStatic: raw.SERVE_STATIC === 'true',
      rateLimitAuthMax: raw.RATE_LIMIT_AUTH_MAX,
      stripeConfigured:
        !!raw.STRIPE_SECRET_KEY && !!raw.STRIPE_WEBHOOK_SECRET && !!raw.STRIPE_PRICE_MONTHLY,
    };
  });

export type AppConfig = z.infer<typeof envSchema>;

/** Charge `.env` (racine du dépôt) si présent — via Node >= 20.12, zéro dépendance. */
export function loadDotEnv(): void {
  const candidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
  for (const file of candidates) {
    if (existsSync(file) && typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(file);
      return;
    }
  }
}

export function loadConfig(overrides: Record<string, string | undefined> = {}): AppConfig {
  const merged = { ...process.env, ...stripUndefined(overrides) };
  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration d'environnement invalide :\n${issues}`);
  }
  return parsed.data;
}

function stripUndefined(o: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out;
}
