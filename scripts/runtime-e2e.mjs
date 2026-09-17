/**
 * E2E runtime — démarre le VRAI serveur (build de production, statique inclus),
 * puis déroule le parcours complet en HTTP réel :
 * site vitrine, PWA servie, contact, inscription → onboarding → dashboard →
 * tâche/habitude/routine → stats → gating premium → logout/reconnexion →
 * persistance des données.
 *
 * Usage : npm run e2e:runtime   (nécessite `npm run build` préalable)
 * Sortie : résumé PASS/FAIL ; exit code ≠ 0 si un check échoue.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 3877;
const BASE = `http://127.0.0.1:${PORT}`;
const dir = mkdtempSync(join(tmpdir(), 'charbon-e2e-'));
let failures = 0;
let checks = 0;

function check(name, cond, extra = '') {
  checks += 1;
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function waitForHealth(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/v1/health`);
      if (r.ok) return true;
    } catch {
      /* serveur pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

let server = null;
function spawnServer(attempt = 1) {
  const child = spawn('node', ['apps/api/dist/index.js'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(PORT),
      HOST: '127.0.0.1',
      DB_PATH: join(dir, 'e2e.db'),
      DEV_BILLING: 'true',
      SERVE_STATIC: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.on('error', (err) => {
    // Le sandbox peut refuser un spawn de façon transitoire (ENOENT) : on retente.
    if (err.code === 'ENOENT' && attempt < 5) {
      console.log(`(spawn refusé, tentative ${attempt + 1}…)`);
      setTimeout(() => {
        server = spawnServer(attempt + 1);
      }, 400);
      return;
    }
    console.error('✗ spawn serveur :', err.code, err.message);
    process.exit(1);
  });
  return child;
}
server = spawnServer();
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

let VERBOSE = process.env.E2E_VERBOSE === '1';
async function vfetch(url, opts) {
  const res = await fetch(url, opts);
  if (VERBOSE) {
    const clone = res.clone();
    console.log(`   [${opts?.method ?? 'GET'} ${url.replace(BASE, '')}] → ${res.status} ${(await clone.text()).slice(0, 140)}`);
  }
  return res;
}

async function main() {
  console.log('▶ Démarrage du serveur de production buildé…');
  if (!(await waitForHealth())) {
    console.error('✗ serveur jamais prêt\n' + serverLog);
    process.exit(1);
  }
  console.log('▶ Serveur prêt. Parcours :\n');

  // --- Site vitrine & PWA servis ---
  const site = await fetch(`${BASE}/`);
  const siteHtml = await site.text();
  check('GET / → site vitrine 200 + contenu', site.status === 200 && siteHtml.includes('Charbon'));
  for (const page of ['/privacy.html', '/terms.html', '/contact.html']) {
    const r = await fetch(`${BASE}${page}`);
    check(`GET ${page} → 200`, r.status === 200);
  }
  const app = await fetch(`${BASE}/app/`);
  const appHtml = await app.text();
  check('GET /app/ → SPA 200 + <div id="root">', app.status === 200 && appHtml.includes('id="root"'));
  const manifest = await fetch(`${BASE}/app/manifest.webmanifest`);
  check('GET /app/manifest.webmanifest → 200 JSON', manifest.status === 200);
  const sw = await fetch(`${BASE}/app/sw.js`);
  check('GET /app/sw.js → 200', sw.status === 200);
  const spaFallback = await fetch(`${BASE}/app/login`);
  check('SPA fallback /app/login → 200 (index.html)', spaFallback.status === 200);
  const api404 = await fetch(`${BASE}/api/v1/nope`);
  check('GET /api/v1/nope → 404 JSON', api404.status === 404);

  // --- Contact (formulaire réel du site) ---
  const contact = await fetch(`${BASE}/api/v1/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'E2E', email: 'e2e@example.test', message: 'Bonjour depuis le test runtime' }),
  });
  check('POST /api/v1/contact → 201', contact.status === 201);

  // --- Parcours utilisateur complet ---
  console.log('\n▶ Parcours visiteur → utilisateur :');
  const email = `e2e-${Date.now()}@example.test`;
  const reg = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'E2E', email, password: 'e2e-password1', timezone: 'Europe/Paris' }),
  });
  check('inscription → 201', reg.status === 201);
  const cookie = (reg.headers.getSetCookie?.() ?? [reg.headers.get('set-cookie')])[0]?.split(';')[0];
  check('cookie de session reçu', !!cookie);
  const H = { cookie, 'content-type': 'application/json' };

  const me = await (await fetch(`${BASE}/api/v1/me`, { headers: H })).json();
  check('GET /me → onboardé=false, plan free', me.user.onboardingCompleted === false && me.plan === 'free');

  const onb = await fetch(`${BASE}/api/v1/onboarding`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      goals: [{ title: 'Être constant' }],
      habits: [{ name: 'Lire 10 min' }],
      routines: [{ name: 'Routine matin', timeOfDay: 'morning', items: [{ title: 'Eau' }, { title: 'Étirements' }] }],
    }),
  });
  check('onboarding → 201 (1 objectif, 1 habitude, 1 routine)', onb.status === 201);

  const today = await (await fetch(`${BASE}/api/v1/today`, { headers: H })).json();
  check(
    'dashboard : 1 habitude + 1 routine(2 actions) + 1 objectif, attendu=3',
    today.habits.length === 1 && today.routines.length === 1 && today.goals.length === 1 && today.progress.expected === 3,
    JSON.stringify(today.progress),
  );

  // Tâche datée aujourd'hui (fuseau Paris) → apparaît dans today
  const due = new Date(Date.now() + 3600_000).toISOString();
  const task = await (
    await fetch(`${BASE}/api/v1/tasks`, { method: 'POST', headers: H, body: JSON.stringify({ title: 'Tâche e2e', dueAt: due }) })
  ).json();
  const today2 = await (await fetch(`${BASE}/api/v1/today`, { headers: H })).json();
  check('tâche créée apparaît dans today (attendu=4)', today2.progress.expected === 4);

  // Validations : habitude + 2 actions + tâche
  const habitId = today2.habits[0].id;
  const done = await (
    await vfetch(`${BASE}/api/v1/habits/${habitId}/completions`, { method: 'POST', headers: H, body: '{}' })
  ).json();
  check('habitude validée → streak 1', done.streak.current === 1);
  const routineId = today2.routines[0].id;
  for (const item of today2.routines[0].items) {
    await vfetch(`${BASE}/api/v1/routines/${routineId}/items/${item.id}/completions`, { method: 'POST', headers: H, body: '{}' });
  }
  await vfetch(`${BASE}/api/v1/tasks/${task.id}/complete`, { method: 'POST', headers: H });
  const today3 = await (await fetch(`${BASE}/api/v1/today`, { headers: H })).json();
  check('journée complète : 4/4, routine terminée', today3.progress.completed === 4 && today3.routines[0].doneToday);
  check('streak global jour parfait = 1', today3.streak.current === 1);

  const stats = await (await fetch(`${BASE}/api/v1/stats/summary?range=7d`, { headers: H })).json();
  check('stats 7 j : 7 jours, totaux cohérents', stats.days.length === 7 && stats.totals.expected === 4 && stats.totals.completed === 4);

  const locked = await fetch(`${BASE}/api/v1/stats/summary?range=90d`, { headers: H });
  check('stats 90 j en Free → 403 premium_required', locked.status === 403);

  const upgrade = await vfetch(`${BASE}/api/v1/subscription/upgrade`, { method: 'POST', headers: H });
  const upBody = await upgrade.json();
  check('upgrade (mode dev labelisé) → premium', upgrade.status === 200 && upBody.plan === 'premium' && upBody.provider === 'dev');
  const unlocked = await fetch(`${BASE}/api/v1/stats/summary?range=90d`, { headers: H });
  check('stats 90 j en Premium → 200 (90 jours)', unlocked.status === 200 && (await unlocked.json()).days.length === 90);
  await fetch(`${BASE}/api/v1/subscription/cancel`, { method: 'POST', headers: H });

  // Rappel quotidien : tick direct impossible en HTTP — vérifié par tests API (tickReminders).
  // Déconnexion / reconnexion / persistance
  const logout = await vfetch(`${BASE}/api/v1/auth/logout`, { method: 'POST', headers: H });
  check('logout → 200', logout.status === 200);
  const denied = await fetch(`${BASE}/api/v1/me`, { headers: H });
  check('après logout → /me 401', denied.status === 401);
  const login = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'e2e-password1' }),
  });
  const cookie2 = (login.headers.getSetCookie?.() ?? [login.headers.get('set-cookie')])[0]?.split(';')[0];
  check('reconnexion → nouveau cookie', login.status === 200 && !!cookie2);
  const today4 = await (await fetch(`${BASE}/api/v1/today`, { headers: { cookie: cookie2, 'content-type': 'application/json' } })).json();
  check(
    'données persistées après reconnexion (4/4, streaks, routine faite)',
    today4.progress.completed === 4 && today4.habits[0].currentStreak === 1 && today4.routines[0].doneToday,
  );

  console.log(`\n${failures === 0 ? '✅' : '❌'} ${checks - failures}/${checks} checks runtime OK`);
}

main()
  .catch((err) => {
    failures += 1;
    console.error('✗ erreur inattendue :', err);
    console.error('--- log serveur (fin) ---\n' + serverLog.slice(-3000));
  })
  .finally(() => {
    server?.kill('SIGTERM');
    rmSync(dir, { recursive: true, force: true });
    process.exit(failures === 0 ? 0 : 1);
  });
