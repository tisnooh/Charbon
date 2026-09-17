/**
 * Helpers de test : instance d'API isolée (base temporaire), inscription/
 * connexion rapides, extraction du cookie de session, nettoyage.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp, type BuiltApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { SESSION_COOKIE } from '../src/plugins/auth.js';

export interface TestApp extends BuiltApp {
  dir: string;
  dispose: () => Promise<void>;
}

export async function makeTestApp(
  overrides: Record<string, string> = {},
  buildOpts: { stripeGateway?: import('../src/services/stripe.service.js').StripeGateway | null } = {},
): Promise<TestApp> {
  const dir = mkdtempSync(join(tmpdir(), 'charbon-api-test-'));
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: join(dir, 'test.db'),
    SERVE_STATIC: 'false',
    DEV_BILLING: 'true',
    RATE_LIMIT_AUTH_MAX: '1000000',
    APP_BASE_URL: 'http://localhost:5173',
    ...overrides,
  });
  const built = await buildApp({ config, logger: false, serveStatic: false, ...buildOpts });
  return {
    ...built,
    dir,
    dispose: async () => {
      await built.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** Shape structurelle de la réponse `app.inject(...)` (light-my-request). */
export interface InjectResult {
  statusCode: number;
  body: string;
  headers: Record<string, string | string[] | number | undefined>;
  json<T = unknown>(): T;
  cookies: Array<{ name: string; value: string }>;
}

export function sessionCookie(res: InjectResult): string | undefined {
  const cookie = res.cookies.find((c) => c.name === SESSION_COOKIE);
  return cookie?.value;
}

let seq = 0;
export function uniqueEmail(prefix = 'user'): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}@example.test`;
}

export interface RegisteredUser {
  cookie: string;
  user: { id: string; email: string; name: string };
}

export async function registerUser(
  t: TestApp,
  opts: { name?: string; timezone?: string; password?: string } = {},
): Promise<RegisteredUser> {
  const email = uniqueEmail(opts.name ?? 'user');
  const password = opts.password ?? 'motdepasse-test';
  const res = await t.app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      name: opts.name ?? 'Testeur',
      email,
      password,
      timezone: opts.timezone ?? 'UTC',
    },
  });
  if (res.statusCode !== 201) {
    throw new Error(`registerUser échoué (${res.statusCode}) : ${res.body}`);
  }
  const cookie = sessionCookie(res);
  if (!cookie) throw new Error('registerUser : cookie de session absent');
  const body = res.json() as { user: { id: string; email: string; name: string } };
  return { cookie, user: body.user };
}

export async function loginAs(
  t: TestApp,
  email: string,
  password: string,
): Promise<string | undefined> {
  const res = await t.app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });
  return sessionCookie(res);
}

export function authed(cookie: string): { cookie: string } {
  return { cookie: `${SESSION_COOKIE}=${cookie}` };
}
