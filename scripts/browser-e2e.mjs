/**
 * E2E navigateur RÉEL (Playwright Chromium) — preuves visuelles + console :
 * - site vitrine desktop & mobile (pricing injecté, sections présentes) ;
 * - application mobile (viewport iPhone) : inscription → onboarding →
 *   aujourd'hui → validation habitude → création tâche → stats → profil/thème ;
 * - capture de TOUTES les erreurs console / page errors ;
 * - screenshots dans docs/screenshots/ (evidence).
 *
 * Usage : npm run e2e:browser   (nécessite build + `npx playwright install chromium`)
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = 3888;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = resolve(here, '../docs/screenshots');
mkdirSync(SHOTS, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), 'charbon-browser-'));

const consoleErrors = [];
let failures = 0;
let checks = 0;
function check(name, cond, extra = '') {
  checks += 1;
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures += 1;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

let server = null;
function spawnServer(attempt = 1) {
  const child = spawn('node', ['apps/api/dist/index.js'], {
    cwd: resolve(here, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(PORT),
      HOST: '127.0.0.1',
      DB_PATH: join(dir, 'browser.db'),
      DEV_BILLING: 'true',
      SERVE_STATIC: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.on('error', (err) => {
    if (err.code === 'ENOENT' && attempt < 5) {
      setTimeout(() => {
        server = spawnServer(attempt + 1);
      }, 400);
      return;
    }
    console.error('✗ spawn :', err.message);
    process.exit(1);
  });
  return child;
}
server = spawnServer();

async function waitForHealth(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/v1/health`);
      if (r.ok) return true;
    } catch {
      /* pas prêt */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const EXPECTED_CONSOLE = [
  // Sonde de session anonyme : un 401 sur /me AVANT connexion est le comportement
  // voulu (l'app affiche alors l'écran de connexion). Tout autre 401/erreur reste compté.
  (text, url) => text.includes('401') && url.includes('/api/v1/me'),
];

function hookConsole(page, label) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = msg.location()?.url ?? '';
    const text = msg.text();
    if (EXPECTED_CONSOLE.some((f) => f(text, url))) return;
    consoleErrors.push(`[${label}] console.error: ${text} (${url})`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[${label}] pageerror: ${err.message}`));
}

async function main() {
  if (!(await waitForHealth())) {
    console.error('✗ serveur jamais prêt');
    process.exit(1);
  }
  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--renderer-process-limit=2',
      '--disable-software-rasterizer',
      '--mute-audio',
    ],
  });

  // ---------- SITE (desktop) ----------
  console.log('\n▶ Site vitrine (desktop 1280×800) :');
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const site = await desktop.newPage();
  hookConsole(site, 'site-desktop');
  await site.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('hero visible (« La discipline qui tient »)', await site.getByRole('heading', { level: 1 }).first().isVisible());
  check(
    'pricing injecté depuis shared (Free + Premium)',
    (await site.locator('#pricing-grid').innerText()).includes('Gratuit') === false
      ? (await site.locator('#pricing-grid').innerText()).includes('Free')
      : true,
  );
  const pricingText = await site.locator('#pricing-grid').innerText();
  check('prix Premium 4,99 € affiché', pricingText.includes('4,99 €'));
  check('fonctionnalités « à venir » labelisées', pricingText.includes('à venir'));
  await site.screenshot({ path: join(SHOTS, 'site-desktop-hero.png'), clip: { x: 0, y: 0, width: 1280, height: 800 } });
  await site.locator('#tarifs').scrollIntoViewIfNeeded();
  await site.screenshot({ path: join(SHOTS, 'site-desktop-pricing.png') });
  await desktop.close(); // RAM limitée (~1 Go) : un seul renderer à la fois

  // ---------- SITE (mobile) ----------
  const mobileSite = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const sp = await mobileSite.newPage();
  hookConsole(sp, 'site-mobile');
  await sp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('site mobile : hero rendu', await sp.getByRole('heading', { level: 1 }).first().isVisible());
  await sp.screenshot({ path: join(SHOTS, 'site-mobile-hero.png') });
  await mobileSite.close();

  // ---------- APP (viewport iPhone) ----------
  console.log('\n▶ Application (iPhone 390×844) :');
  const appCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const app = await appCtx.newPage();
  hookConsole(app, 'app-mobile');

  await app.goto(`${BASE}/app/`, { waitUntil: 'networkidle' });
  check('écran de connexion rendu', await app.getByRole('heading', { name: 'Charbon' }).first().isVisible());
  await app.screenshot({ path: join(SHOTS, 'app-login.png') });

  // Inscription via l'UI réelle
  await app.getByRole('link', { name: 'Créer un compte' }).click();
  await app.getByLabel('Prénom / pseudo').fill('Camille');
  const email = `browser-${Date.now()}@example.test`;
  await app.getByLabel('E-mail', { exact: false }).first().fill(email);
  await app.getByLabel('Mot de passe', { exact: true }).first().fill('navigateur-1');
  await app.getByLabel('Confirmer le mot de passe').fill('navigateur-1');
  await app.getByRole('button', { name: 'Commencer' }).click();

  // Onboarding 3 étapes
  await app.getByRole('button', { name: /Être plus constant/ }).click();
  await app.getByRole('button', { name: 'Continuer' }).click();
  await app.getByRole('button', { name: /Lire 10 minutes/ }).click();
  await app.getByRole('button', { name: 'Continuer' }).click();
  await app.getByRole('button', { name: /Routine matin/ }).click();
  await app.getByRole('button', { name: 'Démarrer Charbon' }).click();

  // Dashboard
  await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
  check('dashboard : habitude « Lire 10 minutes » visible', await app.getByText('Lire 10 minutes').first().isVisible());
  check('dashboard : routine matin visible', await app.getByText('Routine matin').first().isVisible());
  await app.screenshot({ path: join(SHOTS, 'app-today.png') });

  // Validation d'habitude (tap réel)
  await app.getByLabel('Valider « Lire 10 minutes »').click();
  await app.waitForTimeout(600);
  const pressed = await app.getByLabel('Annuler « Lire 10 minutes »').count();
  check('habitude validée par tap (état inversé)', pressed === 1);
  await app.locator('.streak-badge').filter({ hasText: '🔥 1' }).first().waitFor({ timeout: 5000 });
  check('badge streak 🔥 1 affiché (habitude)', true);
  await app.screenshot({ path: join(SHOTS, 'app-today-done.png') });

  // Création de tâche via la sheet
  await app.getByRole('button', { name: '+ Ajouter' }).click();
  await app.getByLabel('Titre').fill('Tâche navigateur');
  // Échéance aujourd'hui (sinon la tâche vit dans « Toutes », pas dans Today).
  const dueLocal = (() => {
    const d = new Date(Date.now() + 2 * 3600_000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();
  await app.getByLabel('Échéance (optionnel)').fill(dueLocal);
  await app.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await app.getByText('Tâche ajoutée').waitFor();
  await app.getByText('Tâche navigateur').first().waitFor({ timeout: 5000 });
  check('tâche créée visible dans today', true);

  // Stats
  await app.getByRole('link', { name: /Stats/ }).first().click();
  await app.getByRole('heading', { name: 'Statistiques' }).waitFor();
  await app.getByText('taux de réalisation').waitFor({ timeout: 5000 });
  check('stats : taux de réalisation affiché', true);
  await app.screenshot({ path: join(SHOTS, 'app-stats.png') });

  // Retour vers today (stats = sous-écran), puis onglet Profil
  await app.getByRole('button', { name: 'Retour' }).click();
  await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
  await app.getByRole('link', { name: 'Profil' }).click();
  await app.getByRole('heading', { name: 'Profil' }).waitFor();
  await app.getByRole('tab', { name: 'Clair' }).click();
  const theme = await app.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('thème clair appliqué (data-theme=light)', theme === 'light');
  await app.screenshot({ path: join(SHOTS, 'app-profile-light.png') });
  await app.getByRole('tab', { name: 'Sombre' }).click();

  // Abonnement : état réel visible
  await app.getByText('Abonnement', { exact: true }).first().click();
  await app.getByText('Plan Free — actif').waitFor();
  check('écran abonnement : état Free réel + simulateur labelisé', await app.getByText(/Mode développement/).isVisible());
  await app.screenshot({ path: join(SHOTS, 'app-subscription.png') });

  await browser.close();

  // ---------- Console ----------
  console.log('\n▶ Console & erreurs JS :');
  const relevant = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('DevTools'));
  check(`aucune erreur console/page (${relevant.length} trouvée)`, relevant.length === 0, relevant.slice(0, 6).join(' | '));
  if (relevant.length) console.log(relevant.slice(0, 10).join('\n'));

  console.log(`\n${failures === 0 ? '✅' : '❌'} ${checks - failures}/${checks} checks navigateur OK`);
  console.log(`Screenshots : docs/screenshots/`);
}

main()
  .catch((err) => {
    failures += 1;
    console.error('✗ erreur inattendue :', err);
  })
  .finally(() => {
    server?.kill('SIGTERM');
    rmSync(dir, { recursive: true, force: true });
    process.exit(failures === 0 ? 0 : 1);
  });
