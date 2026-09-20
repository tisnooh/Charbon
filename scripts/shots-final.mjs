import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4600';
const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
await p.goto(base, { waitUntil: 'load' });
await p.waitForTimeout(2200);
await p.screenshot({ path: '/tmp/shots/f-cookie.png' });           // bannière cookies visible
await p.getByRole('button', { name: 'Accepter' }).click();
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/shots/f-hero.png' });             // hero sans boutons + étoile
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 2200));
await p.waitForTimeout(1400);
await p.screenshot({ path: '/tmp/shots/f-finalcta.png' });
for (const [url, name] of [['/download','f-download'],['/support','f-support'],['/confidentialite','f-legal']]) {
  await p.goto(base + url, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `/tmp/shots/${name}.png` });
}
await b.close();
console.log('final shots ok');
