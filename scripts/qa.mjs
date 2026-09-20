/* QA Charbon — tests HTTP (pages + API waitlist). Usage: BASE=... MODE=dev|prod node qa.mjs */
const base = process.env.BASE || 'http://localhost:3100';
const mode = process.env.MODE || 'prod';
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);

async function req(path, opts) {
  const r = await fetch(base + path, opts);
  const body = await r.text();
  return { status: r.status, body };
}
const post = (body) =>
  req('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// ── Pages & assets ────────────────────────────────────────────
for (const p of ['/', '/confidentialite', '/conditions', '/mentions-legales', '/support', '/download']) {
  const r = await req(p);
  ok(`GET ${p} → 200`, r.status === 200, `got ${r.status}`);
}
ok('GET /inexistante → 404', (await req('/inexistante')).status === 404);
for (const p of ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/icon.svg', '/og/og.png']) {
  const r = await req(p);
  ok(`GET ${p} → 200`, r.status === 200, `got ${r.status}`);
}

const home = (await req('/')).body;
ok('Hero : headline présente', home.includes('Prouve-le.'));
ok('Hero : mockup Today rendu (84)', home.includes('>84<'));
ok('Aucun faux lien store', !/href="https:\/\/apps\.apple\.com|href="https:\/\/play\.google\.com/.test(home));
ok('JSON-LD SoftwareApplication', home.includes('SoftwareApplication'));
ok('OG image référencée', home.includes('/og/og.png'));
ok('Titre SEO', home.includes('Charbon — Construis ta discipline'));
ok('FAQ rendue', home.includes('Charbon est-il une todo-list'));
ok('Pricing Free + Pro', home.includes('Charbon Free') && home.includes('Charbon Pro'));

// ── API waitlist ──────────────────────────────────────────────
let r = await post({ email: 'pas-un-email' });
ok('email invalide → 400 invalid_email', r.status === 400 && r.body.includes('invalid_email'), `${r.status} ${r.body}`);

r = await post({ email: '   ' });
ok('email vide → 400', r.status === 400, `${r.status}`);

r = await post({ email: 'bot@spam.io', website: 'http://spam' });
ok('honeypot rempli → 200 ignored', r.status === 200 && r.body.includes('ignored'), `${r.status} ${r.body}`);

r = await post({ email: 'koffi@charbon.app', source: 'qa', locale: 'fr' });
if (mode === 'dev') ok('email valide (dev store) → 200', r.status === 200, `${r.status} ${r.body}`);
else ok('email valide (prod sans Supabase) → 503 backend_unavailable', r.status === 503 && r.body.includes('backend_unavailable'), `${r.status} ${r.body}`);

r = await post({ email: 'koffi@charbon.app' });
if (mode === 'dev') ok('doublon → 409 duplicate', r.status === 409 && r.body.includes('duplicate'), `${r.status} ${r.body}`);
else ok('doublon (prod sans Supabase) → pas de faux succès', r.status !== 200, `${r.status}`);

r = await post({ email: 'x0@charbon.app' });
ok('tentative 5 → traitée (pas 429)', r.status !== 429, `${r.status}`);

r = await post({ email: 'x1@charbon.app' });
ok('tentative 6 → 429 rate_limited', r.status === 429 && r.body.includes('rate_limited'), `${r.status} ${r.body}`);

r = await post({ email: 'x2@charbon.app' });
ok('tentative 7 → 429 encore', r.status === 429, `${r.status}`);

console.log(results.join('\n'));
const fails = results.filter((x) => x.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} PASS (${mode})`);
process.exit(fails.length ? 1 : 0);
