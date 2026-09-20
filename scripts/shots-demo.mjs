/* QA — états UI de la modal waitlist via le mode démo dev (?demo=). */
import { chromium } from 'playwright';

const base = process.env.BASE || 'http://localhost:4200';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

for (const state of ['success', 'duplicate', 'invalid', 'error', 'loading']) {
  const page = await browser.newPage({ viewport: { width: 430, height: 800 } });
  await page.goto(`${base}/?demo=${state}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.locator('section#top').getByRole('button', { name: 'Rejoindre la bêta' }).click();
  await page.waitForTimeout(400);
  await page.getByLabel('Email').fill('koffi@charbon.app');
  await page.getByRole('button', { name: 'Rejoindre la liste' }).click();
  await page.waitForTimeout(state === 'loading' ? 300 : 1200);
  await page.screenshot({ path: `/tmp/shots/waitlist-${state}.png` });
  console.log('capturé:', state);
  await page.close();
}

await browser.close();
console.log('demo states ok');
