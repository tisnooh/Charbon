import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://localhost:4500', { waitUntil: 'load' });
await p.waitForTimeout(2000);
for (const id of ['score', 'focus', 'profil']) {
  await p.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'center' }), id);
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `/tmp/shots/gauge-${id}.png` });
}
await b.close(); console.log('gauges ok');
