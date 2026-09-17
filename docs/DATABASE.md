# BASE DE DONNÉES — Charbon

> Source de vérité du schéma : `apps/api/src/db/schema.ts` (Drizzle).
> Migrations SQL générées : `apps/api/drizzle/` (committées).
> Moteur : SQLite via **libSQL** (`@libsql/client`), fichier local `data/charbon.db`
> (chemin configurable `DB_PATH`). `PRAGMA foreign_keys = ON` posé à chaque démarrage.

## Conventions

- **Clés primaires** : `TEXT` UUID v4 (`crypto.randomUUID()`).
- **Instants** : `TEXT` ISO-8601 UTC (`created_at`, `updated_at`, `expires_at`, …).
- **Dates civiles** : `TEXT` `YYYY-MM-DD` dans le **fuseau de l'utilisateur**
  (`habit_completions.date`, `routine_item_completions.date`, fenêtres de pause).
- **Booléens** : `INTEGER` 0/1 (mode boolean Drizzle).
- **Isolation** : chaque table enfant porte `user_id` (redondance volontaire :
  requêtes et index sans jointure) + FK vers `users` **ON DELETE CASCADE**.
- **Soft delete** : `deleted_at` sur `tasks`, `habits`, `routines` (corbeille,
  restauration, historique préservé). **Hard delete** en cascade pour la
  suppression de compte.

## Tables

### users
| colonne | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| email | TEXT UNIQUE NOT NULL | normalisé minuscules/trim à l'inscription |
| password_hash | TEXT NOT NULL | `scrypt$N$r$p$salt$hash` |
| name | TEXT NOT NULL | |
| timezone | TEXT NOT NULL défaut `UTC` | IANA, validé zod |
| reminders_enabled | INTEGER bool défaut 0 | |
| daily_reminder_time | TEXT défaut `20:00` | `HH:MM` |
| onboarding_completed | INTEGER bool défaut 0 | |
| created_at / updated_at | TEXT | ISO UTC |

### sessions
| colonne | type | notes |
|---|---|---|
| id | TEXT PK | |
| token_hash | TEXT UNIQUE NOT NULL | SHA-256 du token cookie (token jamais stocké en clair) |
| user_id | TEXT FK users CASCADE | index `sessions_user_idx` |
| created_at / expires_at / last_seen_at | TEXT | expiration glissante (rafraîchie ≤ 1×/h) |
| user_agent | TEXT NULL | tronqué 300 car. |

### password_reset_tokens
`id` PK, `token_hash` UNIQUE, `user_id` FK CASCADE (index), `expires_at` (TTL 30 min),
`used_at` NULL jusqu'à usage, `created_at`. Règles : un seul token actif par user
(les précédents sont marqués used à chaque nouvelle demande), usage unique,
révocation de toutes les sessions après reset.

### goals
`id` PK, `user_id` FK CASCADE, `title`, `description` NULL, `target_date` NULL
(ISODate), `status` ENUM(`active`,`completed`,`archived`) défaut active,
timestamps. Index `(user_id, status)`.
Suppression d'un goal : les `tasks.goal_id` / `habits.goal_id` passent à NULL
(FK **ON DELETE SET NULL**), tâches/habitudes conservées.

### tasks
`id` PK, `user_id` FK CASCADE, `goal_id` FK goals SET NULL, `title`, `notes` NULL,
`due_at` NULL (ISODateTime ; NULL = tâche d'inbox, hors taux quotidien),
`status` ENUM(`pending`,`done`), `completed_at` NULL, `deleted_at` NULL (soft),
timestamps. Index : `(user_id, deleted_at)`, `(user_id, due_at)`, `(user_id, status)`.

### habits
`id` PK, `user_id` FK CASCADE, `goal_id` FK SET NULL, `name`, `color` défaut
`#F97316`, `schedule_type` ENUM(`daily`,`days_of_week`), `schedule_days` TEXT JSON
(tableau de jours 0=dim..6=sam), `start_date` ISODate (premier jour attendable),
`paused_at` NULL (instant de suspension en cours), `deleted_at` NULL, timestamps.
Index `(user_id, deleted_at)`.

### habit_pauses
`id` PK, `habit_id` FK habits CASCADE (index), `user_id` FK CASCADE,
`from_date` ISODate **incluse**, `to_date` ISODate **exclue** (NULL = en cours),
`created_at`. Sémantique : les jours couverts ne sont pas « attendus » → la série
est gelée, pas cassée.

### habit_completions
`id` PK, `habit_id` FK CASCADE, `user_id` FK CASCADE, `date` ISODate, `note` NULL,
`created_at`. **UNIQUE(habit_id, date)** (idempotence des validations).
Index `(user_id, date)`.

### routines
`id` PK, `user_id` FK CASCADE, `name`, `time_of_day` ENUM(`morning`,`midday`,
`evening`,`custom`), `scheduled_time` NULL `HH:MM`, `schedule_type` +
`schedule_days` (comme habits), `start_date` ISODate, `color`, `deleted_at` NULL,
timestamps. Index `(user_id, deleted_at)`.

### routine_items
`id` PK, `routine_id` FK routines CASCADE, `user_id` FK CASCADE, `title`,
`duration_minutes` NULL, `sort_order` INTEGER, `created_at`.
Index `(routine_id, sort_order)`.

### routine_item_completions
`id` PK, `item_id` FK routine_items CASCADE, `routine_id` FK routines CASCADE
(dénormalisé pour les agrégats journaliers), `user_id` FK CASCADE, `date` ISODate,
`completed_at`. **UNIQUE(item_id, date)**. Index `(user_id, date)`.
La progression d'une routine est **dérivée** (aucun état dupliqué).

### subscriptions
`id` PK, `user_id` FK CASCADE **UNIQUE** (1 ligne/compte, créée à l'inscription),
`plan` ENUM(`free`,`premium`) défaut free, `status` ENUM(`active`,`canceled`,
`past_due`), `provider` ENUM(`none`,`dev`,`stripe`), `provider_customer_id`,
`provider_subscription_id`, `current_period_end`, `cancel_at_period_end` bool,
timestamps. Index `(user_id)`.

### notifications
`id` PK, `user_id` FK CASCADE, `type` TEXT (`daily_reminder`, …), `title`, `body`
NULL, `data` TEXT JSON NULL (porte la date civile du rappel → anti-doublon),
`read_at` NULL, `created_at`. Index `(user_id, created_at)`.

### dev_outbox_emails (développement uniquement)
`id` PK, `to_address`, `subject`, `body`, `created_at`. Index `(to_address)`.
Utilisée quand aucun SMTP n'est configuré ; lue via `GET /api/v1/dev/emails`,
route **désactivée en production** (404).

### contact_messages
`id` PK, `name`, `email`, `message`, `created_at`. Alimentée par le formulaire du site.

## Migrations

1. Modifier `apps/api/src/db/schema.ts`.
2. `npm run db:generate` → nouveau fichier `apps/api/drizzle/000X_*.sql` + méta.
3. Committer le SQL. Au démarrage, `runMigrations()` applique les fichiers
   manquants (journal interne `__drizzle_migrations` → idempotent).

## Règles d'accès (appliquées & testées)

- `userId` dérivé **uniquement** de la session ; jamais du body/params.
- Toute requête ressource filtre `user_id` ; accès croisé ⇒ **404**.
- Suppression de compte ⇒ cascade intégrale (test `auth.test.ts`).
- Voir `test/isolation.test.ts` (24 accès croisés vérifiés) et
  `scripts/runtime-e2e.mjs` / `scripts/browser-e2e.mjs`.
