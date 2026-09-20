-- ═════════════════════════════════════════════════════════════
-- CHARBON — schéma Supabase (waitlist bêta)
-- Exécuter dans : Supabase Dashboard → SQL Editor → New query.
-- Sécurité avant rapidité : RLS activée, INSERT anonyme uniquement,
-- aucune lecture publique. La clé service_role ne quitte jamais
-- le serveur (elle n'est pas nécessaire : la clé anon + ces
-- policies suffisent au site).
-- ═════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Table waitlist ────────────────────────────────────────────
create table if not exists public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  created_at   timestamptz not null default now(),
  source       text not null default 'website',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  locale       text not null default 'fr',
  status       text not null default 'waiting'
               check (status in ('waiting', 'invited', 'activated', 'unsubscribed'))
);

-- Contrainte email unique (l'API normalise en minuscules avant insert ;
-- l'index sur lower(email) garantit l'unicité quelle que soit la casse).
create unique index if not exists waitlist_email_unique
  on public.waitlist (email);

create unique index if not exists waitlist_email_lower_unique
  on public.waitlist (lower(email));

-- Index de consultation / export.
create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

create index if not exists waitlist_status_idx
  on public.waitlist (status);

-- ── Row Level Security ────────────────────────────────────────
alter table public.waitlist enable row level security;

-- Public : INSERT uniquement.
drop policy if exists "waitlist_public_insert" on public.waitlist;
create policy "waitlist_public_insert"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Aucune policy SELECT / UPDATE / DELETE pour anon ou authenticated :
-- la RLS les refuse par défaut. Les doublons sont détectés par la
-- contrainte unique (code 23505), sans jamais exposer la table.

-- Administration (exports, changement de statut) :
--   → depuis le Dashboard Supabase (Table Editor), ou
--   → avec la clé service_role CÔTÉ SERVEUR UNIQUEMENT (bypass RLS).

-- ── Commentaires ──────────────────────────────────────────────
comment on table public.waitlist is 'Inscriptions à la bêta Charbon (site officiel).';
comment on column public.waitlist.status is 'waiting → invited → activated ; unsubscribed sur demande.';
