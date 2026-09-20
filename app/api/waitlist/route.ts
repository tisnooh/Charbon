import { NextResponse } from 'next/server';
import { isValidEmail, normalizeEmail } from '@/lib/validation/email';
import { getClientIp, waitlistRateLimit } from '@/lib/waitlist/rate-limit';
import { addToWaitlist } from '@/lib/waitlist/store';
import type { WaitlistApiResponse } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/waitlist
 * Body : { email, source?, locale?, utm?: {source, medium, campaign}, website? (honeypot) }
 *
 * Réponses :
 *  200 { ok: true }              inscription enregistrée
 *  200 { ok: true, ignored }     honeypot rempli → faux succès silencieux
 *  400 { ok: false, code: 'invalid_email' }
 *  409 { ok: false, code: 'duplicate' }
 *  429 { ok: false, code: 'rate_limited' }
 *  503 { ok: false, code: 'backend_unavailable' }
 *  500 { ok: false, code: 'unexpected' }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: 'invalid_email' }, 400);
  }

  const data = (body ?? {}) as Record<string, unknown>;

  /* Honeypot : champ invisible pour les humains, rempli par les bots. */
  if (typeof data.website === 'string' && data.website.length > 0) {
    return json({ ok: true, ignored: true }, 200);
  }

  /* Rate limiting par IP. */
  const ip = getClientIp(request.headers);
  if (!waitlistRateLimit.check(ip)) {
    return json({ ok: false, code: 'rate_limited' }, 429);
  }

  /* Validation serveur. */
  const rawEmail = typeof data.email === 'string' ? data.email : '';
  if (!isValidEmail(rawEmail)) {
    return json({ ok: false, code: 'invalid_email' }, 400);
  }

  const utm = (data.utm ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v.slice(0, 120) : null);

  const result = await addToWaitlist({
    email: normalizeEmail(rawEmail),
    source: str(data.source) ?? 'website',
    utmSource: str(utm.source),
    utmMedium: str(utm.medium),
    utmCampaign: str(utm.campaign),
    locale: str(data.locale) ?? 'fr',
  });

  if (result.ok) return json({ ok: true }, 200);

  switch (result.code) {
    case 'duplicate':
      return json({ ok: false, code: 'duplicate' }, 409);
    case 'backend_unavailable':
      return json({ ok: false, code: 'backend_unavailable' }, 503);
    default:
      return json({ ok: false, code: 'unexpected' }, 500);
  }
}

function json(payload: WaitlistApiResponse, status: number) {
  return NextResponse.json(payload, { status });
}
