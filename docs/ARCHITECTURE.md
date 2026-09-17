# ARCHITECTURE — Charbon

> Document vivant. Toute affirmation ici est vérifiée dans le code (commit de référence : voir `git log`).
> Dernière mise à jour : 2026-09-18.

## 1. Vue d'ensemble

Monorepo **npm workspaces** (TypeScript strict partout, Node ≥ 20.16) :

```
Charbon/
├── packages/shared      # logique métier partagée (zod v4, dates/tz, streaks, plans)
├── apps/api             # backend Fastify 5 + Drizzle ORM + libSQL (SQLite)
├── apps/mobile          # application PWA React 19 + Vite 8 (mobile-first iPhone)
└── apps/site            # site vitrine statique (Vite MPA, 4 pages)
```

Un **seul processus serveur** en production : l'API sert aussi les deux frontends
statiques (`/` = site, `/app/*` = application SPA). En développement, Vite sert
l'app sur `:5173` et le site sur `:5174`, avec proxy `/api` → `:3000`.

## 2. Choix techniques et justifications

| Choix | Justification vérifiée |
|---|---|
| **SQLite via `@libsql/client`** (fichier local) | Binaire N-API précompilé distribué par npm : installation **sans compilateur** (vérifié : `better-sqlite3` échoue ici — pas de prebuild Node 20 et pas de `make/g++` persistants ; `sqlite3` échoue — prebuild GLIBC 2.38 > 2.36). Zéro service externe pour un SaaS en lancement. |
| **Drizzle ORM + migrations SQL committées** | Schéma TS = source de vérité ; `drizzle-kit generate` produit `apps/api/drizzle/*.sql` appliqué au démarrage (idempotent, journal interne). |
| **Fastify 5** | Schémas/validateurs intégrés, plugins officiels (`cookie`, `cors`, `rate-limit`, `static`), `inject()` pour tests HTTP sans port. |
| **Sessions opaques en base** (token 256 bits, empreinte SHA-256) | Aucun secret serveur à gérer ; fuite de base ≠ sessions rejouables ; révocation fine (logout, change-password, reset, suppression). Cookie `httpOnly + SameSite=Lax + Secure(prod)`. |
| **scrypt (`node:crypto`)** | Hachage natif, zéro dépendance, paramètres N=16384 r=8 p=1 ; comparaison `timingSafeEqual` ; `dummyVerify` anti-énumération. |
| **zod v4 dans `@charbon/shared`** | Mêmes schémas côté serveur (validation autoritaire) et côté client (UX formulaires). |
| **React 19 + Vite 8 + TanStack Query 5 + react-router 7** | Stack moderne standard ; Query = états loading/error/success + invalidations + mutations optimistes. |
| **PWA plutôt qu'app native** | Aucune chaîne Xcode/Expo disponible ni pertinente en V1 ; PWA installable sur iPhone (Safari → écran d'accueil), manifest + service worker maison. |
| **Site statique MPA** | SEO réel (HTML servi tel quel), zéro framework côté marketing ; pricing injecté depuis `@charbon/shared` (source unique app+site). |
| **Ordonnanceur in-process** (rappels) | Mono-instance en V1 : tick 30 s, heure locale par utilisateur, 1 notification/jour. Push APNs/FCM = extension documentée (clés externes). |

## 3. Frontières & flux

```
[iPhone Safari PWA] ── cookies same-origin ──> /app/*  (SPA servie par l'API)
[Site statique]     ── fetch /api/v1/*      ──> API Fastify (:3000)
                                                ├─ auth (sessions, reset mail)
                                                ├─ ressources (goals/tasks/habits/routines)
                                                ├─ agrégats (today, stats)  ← moteur de streaks (shared)
                                                ├─ notifications + tick rappels
                                                └─ static (site + app)
```

- **Isolation des données** : chaque requête authentifiée dérive `userId` de la session
  (jamais du body/params) ; toutes les lectures/écritures filtrent `user_id` ;
  FK `ON DELETE CASCADE` ; accès croisé ⇒ **404** (ne révèle pas l'existence). Vérifié par `test/isolation.test.ts` (24 cas).
- **Validation** : zod sur toutes les entrées (body/query/params) ; erreurs → 400
  `validation_error` + détails.
- **Erreurs** : shape unique `{ error: { code, message, details? } }` ; aucun stack en réponse.

## 4. Règles métier importantes (implémentées & testées)

1. **Jour civil par fuseau utilisateur** : toutes les dates de validation sont des
   `YYYY-MM-DD` dans le fuseau du compte (`todayInTz`). Les instants (échéances de
   tâches, sessions) sont ISO UTC.
2. **Streak d'habitude** : jours attendus = planning (daily ou jours choisis) entre
   `startDate` et aujourd'hui, **hors fenêtres de suspension** (`from` inclus, `to`
   exclus). Série courante = jours attendus consécutifs complétés en remontant ;
   **sursis** : aujourd'hui attendu non complété ne casse la série qu'à minuit local
   (`atRiskToday`). Jours non planifiés = transparents.
3. **Suspension** : gèle la série (les jours suspendus ne sont pas attendus) ;
   reprise = fenêtre fermée avec `to = jour de reprise` (reprise attendue).
4. **Streak global « jours parfaits »** : jours consécutifs où `attendu > 0 && complété == attendu` ;
   jours sans rien d'attendu = transparents ; fenêtre 365 j.
5. **Stats journalières** : attendu = habitudes planifiées + actions des routines
   planifiées + tâches échues ce jour ; complété idem. Tâches **sans échéance** =
   hors taux quotidien (inbox). Taux = complété/attendu (0 si rien d'attendu).
   `trendPoints` = moyenne(2ᵉ moitié) − moyenne(1ʳᵉ moitié) × 100.
6. **Freemium honnête** : Free = cœur illimité + stats today/7 j/30 j ; Premium =
   stats 90 j/365 j + historique 365 j par habitude (gate **serveur** : 403
   `premium_required`). Aucun paywall sur l'essentiel. Paiement réel = Stripe
   **non câblé** (BLOCAGE EXTERNE : clés) ; mode dev `DEV_BILLING` = simulateur
   explicitement labelisé, **jamais en production**.
7. **Suppressions** : tâches/habitudes/routines = soft delete (corbeille/restauration,
   historique préservé) ; compte = hard delete en cascade.

## 5. Sécurité (vérifiée par tests)

- Rate limiting global 300 req/min/IP + 10 req/10 min/IP sur auth (configurable `RATE_LIMIT_AUTH_MAX`).
- Anti-énumération : login inconnu = même message + `dummyVerify()` ; forgot-password = 202 uniforme.
- Reset token : 256 bits, empreinte SHA-256, TTL 30 min, usage unique, révocation des précédents,
  suppression de toutes les sessions après reset.
- Change-password : révoque les **autres** sessions.
- Suppression de compte : reconfirmation par mot de passe.
- CORS : allowlist explicite (origines app/site + ports dev hors prod), credentials.
- Secrets : `.env` gitignoré, `.env.example` committé, validation zod au boot (`config/env.ts`).

## 6. Qualité & états d'interface

Chaque écran important expose : skeleton (chargement), empty state actionnable,
error state avec « Réessayer », boutons `disabled`/`pending` réels, toasts avec
action « Annuler » (restauration réelle). Aucun bouton factice, aucune donnée
inventée : le mockup du site est explicitement légendé « aperçu stylisé », les
fonctionnalités futures sont labelisées « à venir ».

## 7. Déploiement

- `npm ci && npm run build` puis `npm start` (NODE_ENV=production, PORT, HOST).
- Statique servi par l'API si `apps/*/dist` existent (`SERVE_STATIC=false` pour API seule).
- Docker : image node:20-slim suffisante (aucun compilateur requis).
- Variables : voir `.env.example` (DB_PATH, SESSION_TTL_DAYS, APP_BASE_URL, SITE_BASE_URL,
  CORS_ORIGINS, SMTP_*, DEV_BILLING, STRIPE_* réservés).
- **Non fait (volontairement)** : CI/CD, hébergement réel, SMTP/Stripe — dépendances
  externes listées dans `docs/PROJECT_STATE.md`.

## 8. Extensions prévues (points d'extension déjà propres)

- Push APNs/FCM : le modèle `notifications` + l'ordonnanceur sont prêts ; ajouter un
  transport (clés externes).
- Stripe : `subscriptions` porte déjà provider/customer/period ; ajouter checkout + webhook.
- Accountability/challenges/coach IA : services dédiés à créer ; le reste (stats,
  streaks, notifications) est réutilisable tel quel.
