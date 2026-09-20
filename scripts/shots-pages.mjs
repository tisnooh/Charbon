/* QA visuelle — pages secondaires, tablettes, footer, états waitlist (dev). */
import { chromium } from 'playwright';

const base = process.env.BASE || 'http://localhost:4100';
const out = '/tmp/shots';
const browser = await chromium.launch();
const results = [];

/* Tablettes + pages secondaires */
const jobs = [
  { vp: { width: 768, height: 1024 }, url: '/', anchor: 'ia', name: 't768-ia' },
  { vp: { width: 768, height: 1024 }, url: '/', anchor: 'progression', name: 't768-progress' },
  { vp: { width: 768, height: 1024 }, url: '/', anchor: 'pro', name: 't768-pro' },
  { vp: { width: 1024, height: 768 }, url: '/', anchor: 'top', name: 't1024-hero' },
  { vp: { width: 1440, height: 900 }, url: '/confidentialite', name: 'page-confidentialite' },
  { vp: { width: 1440, height: 900 }, url: '/support', name: 'page-support' },
  { vp: { width: 1440, height: 900 }, url: '/download', name: 'page-download' },
  { vp: { width: 375, height: 760 }, url: '/support', name: 'm-support' },
  { vp: { width: 375, height: 760 }, url: '/conditions', name: 'm-conditions' },
];

for (const job of jobs) {
  const page = await browser.newPage({ viewport: job.vp });
  await page.goto(base + job.url, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  if (job.anchor && job.anchor !== 'top') {
    await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'start' }), job.anchor);
    await page.waitForTimeout(1400);
  }
  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollWidth > d.clientWidth;
  });
  results.push(`${overflow ? 'FAIL' : 'PASS'}  ${job.name} overflow=${overflow}`);
  await page.screenshot({ path: `${out}/${job.name}.png` });
  await page.close();
}

/* Footer desktop */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/footer-1440.png` });
await page.close();

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL'));
process.exit(fails.length ? 1 : 0);
