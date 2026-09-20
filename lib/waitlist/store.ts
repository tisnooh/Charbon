import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/client';
import type { WaitlistEntry } from '@/types';

/**
 * Store waitlist.
 *
 * - Production / Supabase configuré : insert via clé anon (RLS : insert only).
 *   Les doublons sont détectés par la contrainte unique (code Postgres 23505),
 *   sans jamais exposer le contenu de la table au client.
 * - Développement sans Supabase : store en mémoire clairement signalé,
 *   pour tester tout le flow UI avant de connecter le projet.
 */

export type StoreResult = { ok: true } | { ok: false; code: 'duplicate' | 'backend_unavailable' | 'unexpected' };

/* Store de développement (mémoire uniquement, jamais persisté). */
const devStore = new Set<string>();

const DEV_LATENCY_MS = 350;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function addToWaitlist(entry: WaitlistEntry): Promise<StoreResult> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV !== 'development') {
      return { ok: false, code: 'backend_unavailable' };
    }
    await wait(DEV_LATENCY_MS);
    if (devStore.has(entry.email)) return { ok: false, code: 'duplicate' };
    devStore.add(entry.email);
    console.info('[waitlist:dev] inscription stockée en mémoire :', entry.email);
    return { ok: true };
  }

  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, code: 'backend_unavailable' };

  const { error } = await supabase.from('waitlist').insert({
    email: entry.email,
    source: entry.source,
    utm_source: entry.utmSource,
    utm_medium: entry.utmMedium,
    utm_campaign: entry.utmCampaign,
    locale: entry.locale,
    status: 'waiting',
  });

  if (!error) return { ok: true };

  // Violation de contrainte unique (email déjà inscrit).
  if (error.code === '23505') return { ok: false, code: 'duplicate' };

  return { ok: false, code: 'unexpected' };
}
