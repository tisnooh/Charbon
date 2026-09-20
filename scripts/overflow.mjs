import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const w of [375, 320, 1024]) {
  const page = await browser.newPage({ viewport: { width: w, height: 800 } });
  await page.goto('http://localhost:3300', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 8) {
        out.push({ tag: el.tagName, cls: String(el.className).slice(0, 90), right: Math.round(r.right), w: Math.round(r.width) });
      }
    }
    // garder les plus profonds (derniers = enfants)
    return out.slice(0, 14);
  });
  console.log(`\n=== ${w}px ===`);
  offenders.forEach(o => console.log(`${o.right}px w=${o.w} <${o.tag}> ${o.cls}`));
  await page.close();
}
await browser.close();
