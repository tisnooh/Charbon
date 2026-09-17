/**
 * Vérification PRODUCTION réelle (URL publique HTTPS) :
 *  - phase `journey` : site desktop + parcours app mobile complet
 *    (inscription → onboarding → tâche → habitude → routine → objectifs →
 *    stats → logout) avec captures ;
 *  - phase `persist` : reconnexion du même compte et contrôle que TOUTES les
 *    données créées avant un redémarrage serveur sont intactes.
 *
 * Usage : PROD_BASE=https://xxx.trycloudflare.com npm run check:prod -- journey
 *         PROD_BASE=... npm run check:prod -- persist
 * Le compte utilisé est écrit dans /tmp/prod-account.json entre les phases.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.PROD_BASE;
if (!BASE) {
  console.error('PROD_BASE manquant');
  process.exit(1);
}
const phase = process.argv[2] ?? 'journey';
const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const SHOTS = resolve(here, '../docs/screenshots/prod');
mkdirSync(SHOTS, { recursive: true });
const ACCOUNT_FILE = '/tmp/prod-account.json';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

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
const hook = (page, label) => {
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url ?? '';
    if (m.text().includes('401') && url.includes('/api/v1/me')) return;
    consoleErrors.push(`[${label}] ${m.text()} (${url})`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`[${label}] pageerror ${e.message}`));
};

async function main() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--mute-audio'],
  });

  if (phase === 'journey') {
    // ---- Site desktop ----
    console.log('▶ SITE public desktop :');
    const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const d = await dctx.newPage();
    hook(d, 'site-prod');
    await d.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    check('homepage + hero', await d.getByRole('heading', { level: 1 }).first().isVisible());
    check('pricing injecté', (await d.locator('#pricing-grid').innerText()).includes('4,99 €'));
    await d.screenshot({ path: resolve(SHOTS, 'prod-site-desktop.png') });
    await dctx.close();

    // ---- App mobile : parcours ----
    console.log('▶ APP publique mobile (parcours complet) :');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE_UA });
    const app = await ctx.newPage();
    hook(app, 'app-prod');
    const email = `prod-${Date.now()}@charbon.app`;
    const password = 'prod-12345';
    writeFileSync(ACCOUNT_FILE, JSON.stringify({ email, password }));

    await app.goto(`${BASE}/app/`, { waitUntil: 'networkidle' });
    check('écran connexion (HTTPS public)', await app.getByRole('heading', { name: 'Charbon' }).first().isVisible());

    await app.getByRole('link', { name: 'Créer un compte' }).click();
    await app.getByLabel('Prénom / pseudo').fill('Prod');
    await app.getByLabel('E-mail', { exact: false }).first().fill(email);
    await app.getByLabel('Mot de passe', { exact: true }).first().fill(password);
    await app.getByLabel('Confirmer le mot de passe').fill(password);
    await app.getByRole('button', { name: 'Commencer' }).click();

    await app.getByRole('button', { name: /Être plus constant/ }).click();
    await app.getByRole('button', { name: 'Continuer' }).click();
    await app.getByRole('button', { name: /Lire 10 minutes/ }).click();
    await app.getByRole('button', { name: 'Continuer' }).click();
    await app.getByRole('button', { name: /Routine matin/ }).click();
    await app.getByRole('button', { name: 'Démarrer Charbon' }).click();
    await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
    check('onboarding → dashboard', await app.getByText('Lire 10 minutes').first().isVisible());

    // tâche
    await app.getByRole('button', { name: '+ Ajouter' }).click();
    await app.getByLabel('Titre').fill('Tâche production');
    const dl = (() => {
      const x = new Date(Date.now() + 2 * 3600_000);
      const p = (n) => String(n).padStart(2, '0');
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
    })();
    await app.getByLabel('Échéance (optionnel)').fill(dl);
    await app.getByRole('button', { name: 'Ajouter', exact: true }).click();
    await app.getByText('Tâche ajoutée').waitFor();
    await app.getByLabel('Terminer « Tâche production »').click();
    await app.getByLabel('Marquer « Tâche production » à faire').waitFor({ timeout: 8000 });
    check('tâche créée + validée', true);

    // habitude
    await app.getByRole('link', { name: 'Habitudes' }).click();
    await app.getByRole('heading', { name: 'Habitudes', exact: true }).waitFor();
    await app.getByLabel('Nouvelle habitude').click();
    await app.getByLabel('Nom de l’habitude').fill('Habitude production');
    await app.getByRole('button', { name: 'Créer l’habitude' }).click();
    await app.getByText('Habitude production').first().waitFor();
    await app.getByLabel('Valider « Habitude production »').click();
    await app.waitForTimeout(900);
    check('habitude créée + validée', (await app.locator('.streak-badge').filter({ hasText: '🔥 1' }).count()) >= 1);

    // routine
    await app.getByRole('link', { name: 'Routines' }).click();
    await app.getByRole('heading', { name: 'Routines', exact: true }).waitFor();
    await app.getByLabel('Nouvelle routine').click();
    await app.getByLabel('Nom de la routine').fill('Routine production');
    await app.getByLabel('Nouvelle action').fill('Action un');
    await app.getByRole('button', { name: 'Ajouter l’action' }).click();
    await app.getByRole('button', { name: 'Créer la routine' }).click();
    await app.getByText('Routine production').first().waitFor();
    await app.getByText('Routine production').first().click();
    await app.getByLabel('Faire « Action un »').click();
    await app.waitForTimeout(900);
    check('routine créée + action cochée', (await app.getByText('Routine terminée').count()) >= 1);

    // objectifs + stats
    await app.getByRole('button', { name: 'Retour' }).click();
    await app.getByRole('link', { name: 'Aujourd’hui' }).click();
    await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
    await app.getByRole('link', { name: 'Tout voir' }).nth(3).click();
    await app.getByRole('heading', { name: 'Objectifs' }).waitFor();
    check('objectifs visibles', (await app.getByText('Être plus constant').count()) >= 1);
    await app.getByRole('button', { name: 'Retour' }).click();
    await app.getByRole('link', { name: /Stats/ }).first().click();
    await app.getByText('taux de réalisation').waitFor();
    check('statistiques rendues', true);
    await app.screenshot({ path: resolve(SHOTS, 'prod-app-stats.png') });

    // logout
    await app.getByRole('button', { name: 'Retour' }).click();
    await app.getByRole('link', { name: 'Profil' }).click();
    await app.getByRole('button', { name: /Se déconnecter/ }).click();
    await app.getByRole('alertdialog', { name: 'Se déconnecter ?' }).getByRole('button', { name: 'Se déconnecter' }).click();
    await app.getByRole('heading', { name: 'Charbon' }).waitFor();
    check('déconnexion OK', true);
    await app.screenshot({ path: resolve(SHOTS, 'prod-app-mobile.png') });
    await ctx.close();
  }

  if (phase === 'persist') {
    const { email, password } = JSON.parse(readFileSync(ACCOUNT_FILE, 'utf8'));
    console.log('▶ PERSISTANCE après redémarrage serveur :');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE_UA });
    const app = await ctx.newPage();
    hook(app, 'app-prod-persist');
    await app.goto(`${BASE}/app/`, { waitUntil: 'networkidle' });
    await app.getByLabel('E-mail', { exact: false }).first().fill(email);
    await app.getByLabel('Mot de passe', { exact: true }).first().fill(password);
    await app.getByRole('button', { name: 'Se connecter' }).click();
    await app.getByRole('heading', { name: /Bonjour|Bon après-midi|Bonsoir/ }).waitFor();
    await app.waitForTimeout(1200);
    const txt = await app.locator('.screen').first().innerText();
    check('reconnexion après restart serveur', true);
    check('tâche « Tâche production » persistée', txt.includes('Tâche production'));
    check('habitude « Habitude production » persistée', txt.includes('Habitude production') || (await app.getByRole('link', { name: 'Habitudes' }).isVisible()));
    await app.getByRole('link', { name: 'Habitudes' }).click();
    await app.getByRole('heading', { name: 'Habitudes', exact: true }).waitFor();
    await app.getByText('Habitude production').first().waitFor({ timeout: 8000 });
    check('habitude listée avec son état', true);
    await app.getByRole('link', { name: 'Routines' }).click();
    await app.getByRole('heading', { name: 'Routines', exact: true }).waitFor();
    await app.getByText('Routine production').first().waitFor({ timeout: 8000 });
    check('routine persistée', true);
    await app.screenshot({ path: resolve(SHOTS, 'prod-persist.png') });
    await ctx.close();
  }

  await browser.close();
  console.log('\n▶ Console :');
  check(`aucune erreur console inattendue (${consoleErrors.length})`, consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '));
  console.log(`\n${failures === 0 ? '✅' : '❌'} ${checks - failures}/${checks} checks production OK`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('✗', e);
  process.exit(1);
});
