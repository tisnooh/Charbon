/**
 * Site vitrine Charbon — scripts minimaux :
 * - injection du pricing depuis @charbon/shared (source de vérité unique,
 *   identique à l'application) ;
 * - liens CTA vers l'app (racine /app/ en production, port Vite en dev) ;
 * - formulaire de contact RÉEL (POST /api/v1/contact) avec états succès/erreur ;
 * - année du footer.
 */
import { PLANS, formatPriceShared } from './pricing.js';

function appUrl(): string {
  // En dev, le site tourne sur :5174 et l'app sur :5173.
  if (import.meta.env.DEV) return 'http://localhost:5173';
  return '/app/';
}

function injectAppLinks(): void {
  const url = appUrl();
  for (const el of document.querySelectorAll<HTMLAnchorElement>('[data-app-link]')) {
    el.href = url;
  }
}

function injectPricing(): void {
  const grid = document.getElementById('pricing-grid');
  if (!grid) return;
  const free = PLANS.free;
  const premium = PLANS.premium;

  const priceLabel = (amount: number) =>
    amount === 0 ? '0 €' : `${formatPriceShared(amount)} /mois`;

  grid.innerHTML = `
    <div class="plan">
      <div>
        <div class="plan__name">${free.name}</div>
        <p style="color:var(--muted);font-size:14px;margin-top:6px">${free.tagline}</p>
      </div>
      <div class="plan__price">${priceLabel(free.priceMonthly.amount)} <small>pour toujours</small></div>
      <ul>
        ${free.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
      </ul>
      <a class="btn-cta" data-app-link href="/app/">Commencer gratuitement</a>
    </div>
    <div class="plan plan--premium">
      <div>
        <div class="plan__name">${premium.name} <span class="badge-soon">paiement bientôt</span></div>
        <p style="color:var(--muted);font-size:14px;margin-top:6px">${premium.tagline}</p>
      </div>
      <div class="plan__price">${priceLabel(premium.priceMonthly.amount)}</div>
      <ul>
        ${premium.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
        ${premium.upcoming.map((f) => `<li class="soon">${escapeHtml(f)} — à venir</li>`).join('')}
      </ul>
      <a class="btn-secondary" data-app-link href="/app/">Rejoindre via l’application</a>
    </div>
  `;
  injectAppLinks();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

async function setupContactForm(): Promise<void> {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;
  const status = document.getElementById('contact-status') as HTMLDivElement | null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!status) return;
    status.hidden = false;
    status.className = 'form-msg form-msg--err';
    status.textContent = 'Envoi en cours…';

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    };

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { message?: string; error?: { message: string } };
      if (!res.ok) {
        status.className = 'form-msg form-msg--err';
        status.textContent = body.error?.message ?? 'Envoi impossible. Réessayez plus tard.';
        return;
      }
      status.className = 'form-msg form-msg--ok';
      status.textContent = body.message ?? 'Message reçu — merci !';
      form.reset();
    } catch {
      status.className = 'form-msg form-msg--err';
      status.textContent = 'Connexion au serveur impossible. Vérifiez votre réseau.';
    }
  });
}

function injectYear(): void {
  for (const el of document.querySelectorAll('[data-year]')) {
    el.textContent = String(new Date().getFullYear());
  }
}

injectAppLinks();
injectPricing();
injectYear();
void setupContactForm();
