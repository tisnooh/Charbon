import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:3500';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 760 } });
await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(2000);
  { const r = page.getByRole('button', { name: 'Refuser' }); if (await r.count()) await r.click(); }
await page.screenshot({ path: '/tmp/shots/m-hero.png' });
for (const id of ['score', 'fonctionnement', 'preuve', 'ia', 'focus', 'progression', 'profil', 'pro', 'faq']) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'start' }), id);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `/tmp/shots/m-${id}.png` });
}
/* menu mobile */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shots/m-menu.png' });
await browser.close();
console.log('mobile shots ok');
