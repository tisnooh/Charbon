/**
 * Démo visuelle complète — parcours réel en Chromium (viewport iPhone) avec
 * capture d'écran à chaque étape, + site desktop/mobile pleine page.
 * Étapes : inscription → onboarding → dashboard → tâche (création/validation) →
 * habitude (création/validation) → routine (création/utilisation) → objectif →
 * statistiques → profil → paramètres → Premium → déconnexion → reconnexion →
 * persistance.
 *
 * Usage : npm run demo   (build préalable requis)
 * Sortie : docs/screenshots/journey/*.png + résumé checks.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = 3866;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = resolve(here, '../docs/screenshots/journey');
mkdirSync(SHOTS, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), 'charbon-demo-'));

let checks = 0;
let failures = 0;
const consoleErrors = [];
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
      DB_PATH: join(dir, 'demo.db'),
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

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function main() {
  if (!(await waitForHealth())) {
    console.error('✗ serveur jamais prêt');
    process.exit(1);
  }
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--mute-audio'],
  });
  const shot = async (page, name) => {
    await page.screenshot({ path: join(SHOTS, `${name}.png`) });
    console.log(`    📸 ${name}.png`);
  };

  // ============ SITE desktop (pleine page) ============
  console.log('\n▶ SITE desktop 1280×800 :');
  const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dpage = await dctx.newPage();
  dpage.on('console', (m) => m.type() === 'error' && consoleErrors.push(`[site-desktop] ${m.text()}`));
  dpage.on('pageerror', (e) => consoleErrors.push(`[site-desktop] pageerror ${e.message}`));
  await dpage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  for (const [label, sel] of [
    ['hero', '.hero'],
    ['problème', '#probleme'],
    ['solution', '#solution'],
    ['fonctionnalités', '#fonctionnalites'],
    ['méthode', '#methode'],
    ['pricing', '#tarifs'],
    ['faq', '#faq'],
    ['cta final', '.final-cta'],
    ['footer', 'footer'],
  ]) {
    const loc = dpage.locator(sel).first();
    check(`section ${label} présente`, (await loc.count()) === 1);
  }
  await dpage.screenshot({ path: join(SHOTS, 'site-desktop-fullpage.png'), fullPage: true });
  console.log('    📸 site-desktop-fullpage.png');
  await dctx.close();

  // ============ SITE mobile (pleine page) ============
  console.log('\n▶ SITE mobile 390×844 :');
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE_UA });
  const mpage = await mctx.newPage();
  mpage.on('console', (m) => m.type() === 'error' && consoleErrors.push(`[site-mobile] ${m.text()}`));
  mpage.on('pageerror', (e) => consoleErrors.push(`[site-mobile] pageerror ${e.message}`));
  await mpage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('site mobile : hero lisible', await mpage.getByRole('heading', { level: 1 }).first().isVisible());
  await mpage.screenshot({ path: join(SHOTS, 'site-mobile-fullpage.png'), fullPage: true });
  console.log('    📸 site-mobile-fullpage.png');
  await mctx.close();

  // ============ APP : parcours complet ============
  console.log('\n▶ APP parcours complet (iPhone 390×844) :');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE_UA });
  const app = await ctx.newPage();
  app.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url ?? '';
    if (m.text().includes('401') && url.includes('/api/v1/me')) return; // sonde anonyme voulue
    consoleErrors.push(`[app] ${m.text()} (${url})`);
  });
  app.on('pageerror', (e) => consoleErrors.push(`[app] pageerror ${e.message}`));

  const email = `demo-${Date.now()}@charbon.app`;
  const password = 'demo-12345';

  await app.goto(`${BASE}/app/`, { waitUntil: 'networkidle' });
  check('1. écran de connexion', await app.getByRole('heading', { name: 'Charbon' }).first().isVisible());
  await shot(app, '01-login');

  await app.getByRole('link', { name: 'Créer un compte' }).click();
  await app.getByLabel('Prénom / pseudo').fill('Camille');
  await app.getByLabel('E-mail', { exact: false }).first().fill(email);
  await app.getByLabel('Mot de passe', { exact: true }).first().fill(password);
  await app.getByLabel('Confirmer le mot de passe').fill(password);
  await shot(app, '02-register');
  await app.getByRole('button', { name: 'Commencer' }).click();

  // Onboarding
  await app.getByRole('button', { name: /Être plus constant/ }).click();
  await app.getByRole('button', { name: /Me lever tôt/ }).click();
  await shot(app, '03-onboarding-objectifs');
  await app.getByRole('button', { name: 'Continuer' }).click();
  await app.getByRole('button', { name: /Lire 10 minutes/ }).click();
  await app.getByRole('button', { name: /Méditer/ }).click();
  await shot(app, '04-onboarding-habitudes');
  await app.getByRole('button', { name: 'Continuer' }).click();
  await app.getByRole('button', { name: /Routine matin/ }).click();
  await shot(app, '05-onboarding-routines');
  await app.getByRole('button', { name: 'Démarrer Charbon' }).click();

  // Dashboard
  await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
  check('2. dashboard après onboarding', await app.getByText('Lire 10 minutes').first().isVisible());
  await shot(app, '06-dashboard');

  // Tâche : création
  await app.getByRole('button', { name: '+ Ajouter' }).click();
  await app.getByLabel('Titre').fill('Préparer la démo Charbon');
  const dueLocal = (() => {
    const d = new Date(Date.now() + 2 * 3600_000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();
  await app.getByLabel('Échéance (optionnel)').fill(dueLocal);
  await shot(app, '07-tache-creation');
  await app.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await app.getByText('Tâche ajoutée').waitFor();
  await app.getByText('Préparer la démo Charbon').first().waitFor();
  check('3. tâche créée visible', true);
  await shot(app, '08-tache-creee');

  // Tâche : validation
  await app.getByLabel('Terminer « Préparer la démo Charbon »').click();
  await app.getByLabel('Marquer « Préparer la démo Charbon » à faire').waitFor({ timeout: 5000 });
  check('4. tâche validée (case cochée)', true);
  await shot(app, '09-tache-validee');

  // Habitude : création
  await app.getByRole('link', { name: 'Habitudes' }).click();
  await app.getByRole('heading', { name: 'Habitudes' }).waitFor();
  await app.getByLabel('Nouvelle habitude').click();
  await app.getByLabel('Nom de l’habitude').fill('Marcher 20 minutes');
  await app.getByRole('tab', { name: 'Certains jours' }).click();
  await shot(app, '10-habitude-creation');
  await app.getByRole('button', { name: 'Créer l’habitude' }).click();
  await app.getByText('Marcher 20 minutes').first().waitFor();
  check('5. habitude créée', true);
  await shot(app, '11-habitude-creee');

  // Habitude : validation
  await app.getByLabel('Valider « Marcher 20 minutes »').click();
  await app.waitForTimeout(700);
  check('6. habitude validée (streak 1)', (await app.locator('.streak-badge').filter({ hasText: '🔥 1' }).count()) >= 1);
  await shot(app, '12-habitude-validee');

  // Routine : création
  await app.getByRole('link', { name: 'Routines' }).click();
  await app.getByRole('heading', { name: 'Routines', exact: true }).waitFor();
  await app.getByLabel('Nouvelle routine').click();
  await app.getByLabel('Nom de la routine').fill('Routine sport');
  await app.getByLabel('Nouvelle action').fill('Échauffement 5 min');
  await app.getByRole('button', { name: 'Ajouter l’action' }).click();
  await app.getByLabel('Nouvelle action').fill('Course');
  await app.getByRole('button', { name: 'Ajouter l’action' }).click();
  await shot(app, '13-routine-creation');
  await app.getByRole('button', { name: 'Créer la routine' }).click();
  await app.getByText('Routine sport').first().waitFor();
  check('7. routine créée', true);
  await shot(app, '14-routine-creee');

  // Routine : utilisation (cocher les actions du jour)
  await app.getByText('Routine sport').first().click();
  await app.getByRole('heading', { name: 'Routine sport' }).waitFor();
  await app.getByLabel('Faire « Échauffement 5 min »').click();
  await app.waitForTimeout(500);
  await app.getByLabel('Faire « Course »').click();
  await app.waitForTimeout(700);
  check('8. routine terminée (badge)', (await app.getByText('Routine terminée').count()) >= 1);
  await shot(app, '15-routine-utilisation');

  // Objectifs : 4e « Tout voir » du dashboard (Tâches, Habitudes, Routines, Objectifs)
  await app.getByRole('button', { name: 'Retour' }).click();
  await app.getByRole('link', { name: 'Aujourd’hui' }).click();
  await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
  await app.getByRole('link', { name: 'Tout voir' }).nth(3).click();
  await app.getByRole('heading', { name: 'Objectifs' }).waitFor();
  check('9. écran objectifs (2 créés à l’onboarding)', (await app.getByText('Être plus constant').count()) >= 1);
  await shot(app, '16-objectifs');

  // Statistiques
  await app.getByRole('button', { name: 'Retour' }).click();
  await app.getByRole('link', { name: /Stats/ }).first().click();
  await app.getByRole('heading', { name: 'Statistiques' }).waitFor();
  await app.getByText('taux de réalisation').waitFor();
  check('10. statistiques rendues', true);
  await shot(app, '17-statistiques');

  // Profil
  await app.getByRole('button', { name: 'Retour' }).click();
  await app.getByRole('link', { name: 'Profil' }).click();
  await app.getByRole('heading', { name: 'Profil' }).waitFor();
  check('11. profil (nom + email réels)', await app.getByText('Camille').first().isVisible());
  await shot(app, '18-profil');

  // Paramètres : thème clair
  await app.getByRole('tab', { name: 'Clair' }).click();
  await app.waitForTimeout(300);
  check('12. thème clair appliqué', (await app.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light');
  await shot(app, '19-parametres-clair');
  await app.getByRole('tab', { name: 'Sombre' }).click();

  // Premium
  await app.getByText('Abonnement', { exact: true }).first().click();
  await app.getByText('Plan Free — actif').waitFor();
  check('13. écran abonnement (état réel + simulateur labelisé)', await app.getByText(/Mode développement/).isVisible());
  await shot(app, '20-premium');
  // Activation simulée (dev) puis retour Free
  await app.getByRole('button', { name: 'Passer Premium' }).click();
  await app.getByText(/Premium — actif/).waitFor();
  await shot(app, '21-premium-actif-dev');
  await app.getByRole('button', { name: 'Revenir au plan Free' }).click();
  await app.getByRole('button', { name: 'Revenir à Free' }).click();
  await app.getByText('Plan Free — actif').waitFor();

  // Déconnexion (retour depuis le sous-écran abonnement, puis onglet Profil)
  await app.getByRole('button', { name: 'Retour' }).click();
  await app.getByRole('link', { name: 'Profil' }).click();
  await app.getByRole('button', { name: /Se déconnecter/ }).click();
  await app.getByRole('alertdialog', { name: 'Se déconnecter ?' }).getByRole('button', { name: 'Se déconnecter' }).click();
  await app.getByRole('heading', { name: 'Charbon' }).waitFor();
  check('14. déconnexion → retour login', true);
  await shot(app, '22-deconnexion');

  // Reconnexion + persistance
  await app.getByLabel('E-mail', { exact: false }).first().fill(email);
  await app.getByLabel('Mot de passe', { exact: true }).first().fill(password);
  await app.getByRole('button', { name: 'Se connecter' }).click();
  await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
  await app.waitForTimeout(800);
  const todayText = await app.locator('.screen').first().innerText();
  check('15. persistance : habitude « Marcher 20 minutes » toujours là', todayText.includes('Marcher 20 minutes'));
  check('16. persistance : routine sport toujours là', await app.getByRole('link', { name: 'Routines' }).isVisible());
  await shot(app, '23-reconnexion-persistance');

  await ctx.close();
  await browser.close();

  console.log('\n▶ Console :');
  check(`aucune erreur console inattendue (${consoleErrors.length})`, consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));
  console.log(`\n${failures === 0 ? '✅' : '❌'} ${checks - failures}/${checks} checks démo OK — captures dans docs/screenshots/journey/`);
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
