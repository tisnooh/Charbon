import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:4600', { waitUntil: 'load' });
await p.waitForTimeout(1800);
const btn = p.getByRole('button', { name: 'Accepter' });
if (await btn.count()) { await btn.click(); await p.waitForTimeout(400); }
await p.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const footer = document.querySelector('footer');
  window.scrollTo(0, (footer ? footer.offsetTop : document.body.scrollHeight) - 980);
});
await p.waitForTimeout(1600);
await p.screenshot({ path: '/tmp/shots/f-finalcta.png' });
await b.close(); console.log('ok');
