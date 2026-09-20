/* QA visuelle Charbon — screenshots + détection de scroll horizontal. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE || 'http://localhost:3100';
const out = '/tmp/shots';
mkdirSync(out, { recursive: true });

const viewports = [
  { w: 320, h: 640, name: '320' },
  { w: 375, h: 720, name: '375' },
  { w: 390, h: 844, name: '390' },
  { w: 430, h: 932, name: '430' },
  { w: 768, h: 1024, name: '768' },
  { w: 1024, h: 768, name: '1024' },
  { w: 1440, h: 900, name: '1440' },
  { w: 1920, h: 1080, name: '1920' },
];

const browser = await chromium.launch();
const results = [];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
  });
  const bad = overflow.scrollW > overflow.clientW;
  results.push(`${bad ? 'FAIL' : 'PASS'}  ${vp.name}px  scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);
  if (vp.name === '375') {
    await page.screenshot({ path: `${out}/full-375.png`, fullPage: true });
  }
  if (vp.name === '320') {
    await page.screenshot({ path: `${out}/hero-320.png` });
  }
  if (vp.name === '1440') {
    await page.screenshot({ path: `${out}/hero-1440.png` });
  }
  await page.close();
}

/* Interactions desktop */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(1800);

/* Modal waitlist */
await page.locator('section#top').getByRole('button', { name: 'Rejoindre la bêta' }).click();
await page.waitForTimeout(700);
const dialogVisible = await page.getByRole('dialog').isVisible();
results.push(`${dialogVisible ? 'PASS' : 'FAIL'}  modal ouverte`);
await page.screenshot({ path: `${out}/modal-1440.png` });
const focusedInDialog = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  return dialog ? dialog.contains(document.activeElement) : false;
});
results.push(`${focusedInDialog ? 'PASS' : 'FAIL'}  focus dans la modal`);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
const dialogGone = (await page.getByRole('dialog').count()) === 0;
results.push(`${dialogGone ? 'PASS' : 'FAIL'}  ESC ferme la modal`);

/* Sections */
for (const id of ['score', 'preuve', 'ia', 'pro', 'faq']) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/section-${id}-1440.png` });
}

/* FAQ interaction */
await page.evaluate(() => document.getElementById('faq')?.scrollIntoView());
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Charbon est-il une todo-list/ }).click();
await page.waitForTimeout(700);
const expanded = await page.getByRole('button', { name: /Charbon est-il une todo-list/ }).getAttribute('aria-expanded');
results.push(`${expanded === 'true' ? 'PASS' : 'FAIL'}  FAQ aria-expanded`);
await page.screenshot({ path: `${out}/faq-open-1440.png` });

await page.close();
await browser.close();

console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} PASS (visuel)`);
process.exit(fails.length ? 1 : 0);
