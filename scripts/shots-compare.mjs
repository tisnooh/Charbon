import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4400';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/shots/cmp-hero.png' });
for (const id of ['fonctionnement', 'ia']) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'start' }), id);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `/tmp/shots/cmp-${id}.png` });
}
await browser.close();
console.log('compare shots ok');
