import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase — accès serveur & client.
 *
 * Sécurité : seule la clé `anon` est utilisée ici. Elle est soumise aux
 * Row Level Policies (RLS). La clé `service_role` ne doit jamais apparaître
 * dans le frontend ni dans ce dépôt (réservée à des scripts serveur dédiés).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let serverClient: SupabaseClient | null = null;

/** Client serveur (Route Handlers, Server Components). */
export function getSupabaseServer(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!serverClient) {
    serverClient = createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

/** Client navigateur (si besoin plus tard — la waitlist passe par l'API route). */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(url as string, anonKey as string, {
    auth: { persistSession: false },
  });
}
