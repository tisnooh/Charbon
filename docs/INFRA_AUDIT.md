# AUDIT INFRASTRUCTURE & OPTIONS DE PRODUCTION DURABLE

> Statut actuel : **PREVIEW TEMPORAIRE** (sandbox + quick tunnel Cloudflare).
> Aucune affirmation supposée : chaque élément ci-dessous est relevé par commande
> (processus, ports, fichiers) le 2026-09-18.

---

## 1. AUDIT DE L'INFRA ACTUELLE

### 1.1 Processus Charbon (relevés /proc)

| PID | Commande | RSS | Rôle | Nécessaire ? |
|---|---|---|---|---|
| 15587 | `node apps/api/dist/index.js` | ~113 Mo | serveur unique : API + site + app | OUI |
| 14280 | `/tmp/cloudflared tunnel --url http://127.0.0.1:3000` | ~37 Mo | tunnel public HTTPS éphémère | OUI (preview) |
| 1 | `node dist/cli.js serve … :9000` | ~159 Mo | harness Arena (environnement) | NON (hors Charbon) |

### 1.2 Ports (relevés /proc/net/tcp)

| Port | Écoute | Usage |
|---|---|---|
| 3000 | 127.0.0.1 | Charbon (API + statiques site/app) |
| 9000, 19001, 19005, 19006, 20241 | harness/localhost | Arena (hors Charbon) |

Aucun autre port Charbon : un seul processus sert tout (architecture monolithe
volontaire, cf. ARCHITECTURE.md).

### 1.3 Base de données

- Fichier : `/home/user/Charbon/data/charbon.db` (SQLite via libSQL, 233 Ko,
  magic « SQLite format 3 » vérifié).
- Persistance : le fichier vit dans le **workspace** → survit aux redémarrages de
  processus et aux turns (prouvé : restart + reconnexion, données intactes).
- Mais : le workspace vit dans le **sandbox** → si le sandbox est détruit, le
  fichier disparaît. **Aucune copie externe n'existe aujourd'hui** (gap backup).

### 1.4 Variables d'environnement utilisées (fichier `.env`, validé zod au boot)

`NODE_ENV, PORT, HOST, DB_PATH, SESSION_TTL_DAYS, APP_BASE_URL, SITE_BASE_URL,
CORS_ORIGINS, DEV_BILLING, SERVE_STATIC, RATE_LIMIT_AUTH_MAX, SMTP_HOST, SMTP_PORT,
SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM`
(+ réservées Stripe : `STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY`).
Valeurs actuelles : NODE_ENV=production, DEV_BILLING=false, DB_PATH=data/charbon.db
(chemin relatif), HOST=127.0.0.1.

### 1.5 Communication app / site / API

Navigateur → edge Cloudflare (TLS, URL trycloudflare aléatoire) → tunnel
cloudflared → 127.0.0.1:3000 → Fastify :
- `/` → `apps/site/dist` (statique MPA)
- `/app/*` → `apps/mobile/dist` (SPA, fallback index.html, base Vite `/app/`)
- `/api/v1/*` → routes JSON ; cookies de session same-origin (httpOnly, Secure, Lax).

### 1.6 Ce qui disparaîtrait si le sandbox était détruit

| Élément | Perdu ? | Commentaire |
|---|---|---|
| Code source | NON | poussé sur GitHub (7 commits) + commits locaux (2) |
| `data/charbon.db` (comptes & données de test) | OUI si snapshot non exécuté | aucune copie externe |
| URL publique trycloudflare | OUI | sous-domaine aléatoire, recréable mais changeant |
| Logs `/tmp/*.log` | OUI | /tmp éphémère |
| Binaire cloudflared `/tmp/cloudflared` | OUI | retéléchargeable en 2 s |
| `.env` | OUI | recréable (valeurs non secrètes hors SMTP/Stripe absents) |

### 1.7 Gaps identifiés (à combler en production durable)

1. Backups : aucun → script `scripts/backup-db.mjs` (VACUUM INTO + rétention) ajouté.
2. Logs : fichier /tmp éphémère, pas de rotation → stdout pino + redirection
   documentée (journald/Caddy) + runbook.
3. Monitoring : aucun → health deep + stratégie UptimeRobot/documentée.
4. URL instable : quick tunnel → domaine + TLS propres (options §2).
5. Redémarrage manuel : pas de restart policy → Docker `restart: unless-stopped`.

---

## 2. TROIS ARCHITECTURES RÉALISTES (MVP d'abord)

### Option 1 — VPS unique + Docker Compose + Caddy (**recommandée MVP**)

| Critère | Détail |
|---|---|
| Frontend (site + app) | container Charbon (Fastify static), derrière Caddy |
| API | même container (monolithe assumé, déjà testé ainsi) |
| Base | SQLite/libSQL sur **volume Docker nommé** `/data` |
| Stockage | volume nommé + backups `VACUUM INTO` → dossier `/backups` + copie objet (S3/B2) via cron |
| HTTPS | Caddy = Let's Encrypt auto (zéro config certbot) |
| Coût | ~4-7 €/mois (Hetzner CX22, Scaleway STARDUST, OVH) + domaine ~10 €/an + S3 ~0,1 € |
| Complexité | **faible** : 2 containers (app + caddy), 1 fichier compose |
| Backups | cron host : `docker exec charbon node scripts/backup-db.mjs` + rclone offsite |
| Scalabilité | verticale (SQLite = 1 écrivain) — suffisant MVP ; seuil de migration Postgres défini §3 |
| Maintenance | faible ; déploiement = `git pull && docker compose up -d --build` ou CI SSH |
| Reproductible GitHub | oui : Dockerfile + compose committés ; CI vérifie ; deploy = workflow SSH (secrets host) |

### Option 2 — PaaS containers (Fly.io ou Railway)

| Critère | Détail |
|---|---|
| Frontend + API | container unique déployé depuis GitHub (`fly deploy` / Railway buildpack) |
| Base | **volume PaaS** monté `/data` (Fly volumes = persistant réel) |
| HTTPS | automatique (`*.fly.dev` ou domaine custom, TLS géré) |
| Coût | ~5-10 €/mois (small VM + volume) |
| Complexité | faible-moyenne (CLI flyctl, pas de serveur à administrer) |
| Backups | cron in-VM ou job séparé → volume + export objet ; restauration documentée |
| Scalabilité | 1 machine (SQLite) ; multi-machine interdit tant que SQLite |
| Maintenance | très faible |
| Reproductible GitHub | oui : deploy automatique depuis `main` natif sur les deux PaaS |

### Option 3 — Statique managé + API conteneur + Postgres managé

| Critère | Détail |
|---|---|
| Frontend site | Cloudflare Pages (build Vite MPA) — gratuit |
| Frontend app | Cloudflare Pages (SPA base `/`) ou même VPS |
| API | container PaaS/VPS |
| Base | **Postgres managé** (Neon/Supabase free tier) → **migration SQLite→Postgres requise** |
| HTTPS | TLS managé partout ; CORS cross-origin app↔api (cookies domain partagés) |
| Coût | 0-10 €/mois |
| Complexité | **moyenne-haute** : migration de données contrôlée, 2 pipelines de deploy, CORS/cookies cross-domain |
| Backups | PITR managé (Neon/Supabase) = excellent |
| Scalabilité | bonne (API stateless, DB managée) |
| Maintenance | moyenne |
| Verdict | **non recommandé maintenant** : impose une migration de technologie sans
  besoin fonctionnel actuel (« ne migre pas uniquement pour être moderne »).
  Devient pertinent si : >1 instance API nécessaire, ou écritures > ~50/s soutenues,
  ou besoin PITR managé. |

### Recommandation

**Option 1** (VPS + Compose + Caddy) : la plus simple, durable, maîtrisable,
coût minimal, backups réels testables, aucune migration de stack.
**Option 2** si vous préférez zéro administration serveur. Les deux conservent
Fastify + SQLite + React/PWA sans changement de technologie.

---

## 3. BASE DE DONNÉES : VERDICT SQLite

**SQLite (libSQL) est adapté** aux options 1 et 2 SI et seulement si :
- [x] instance API unique (garanti par compose `replicas: 1` / 1 machine Fly) ;
- [x] volume persistant réel (nommé Docker / volume Fly), pas de filesystem éphémère ;
- [x] backups automatiques + **restauration testée** (runbook §6) ;
- [x] charge MVP (écritures utilisateur < quelques centaines/min — très loin des
      limites SQLite/WAL).

Procédures fournies : `scripts/backup-db.mjs` (VACUUM INTO horodaté + rétention 7 j
+ copie optionnelle), `docs/RUNBOOK.md` §restauration (copie froide + contrôle
d'intégrité `PRAGMA integrity_check`).

**Seuils déclenchant une migration Postgres** (drizzle = migration contrôlée,
schéma déjà abstracté) : besoin de >1 instance API, écritures soutenues >50/s,
exigence PITR managé, ou analytics lourds en concurrence des écritures.
Aucune perte de données : dump SQLite → restore Postgres via drizzle, testé en
staging avant bascule.

---

## 4. PLAN DNS (à exécuter quand vous fournissez le domaine)

Architecture cible demandée (sous-domaines) — records exacts à créer chez le
registrar (exemple avec `charbon.example` ; remplacer par votre domaine réel,
aucun domaine fictif configuré côté serveur tant que non fourni) :

| Type | Nom | Valeur | TTL | Rôle |
|---|---|---|---|---|
| A | `@` | IP_VPS | 3600 | ancre |
| AAAA | `@` | IP_V6 (optionnel) | 3600 | ancre v6 |
| CNAME | `www` | `charbon.example.` | 3600 | site (redirect → apex ou vhost site) |
| CNAME | `app` | `charbon.example.` | 3600 | application PWA |
| CNAME | `api` | `charbon.example.` | 3600 | API |

Caddy (Option 1) : un vhost par sous-domaine → `www.` sert `site/dist`,
`app.` sert `mobile/dist` (rebuild Vite `base:'/'` pour ce mode), `api.` proxy
vers le container API ; certificats Let's Encrypt automatiques par vhost.
Cookies de session : `COOKIE_DOMAIN=.charbon.example` (Secure, SameSite=Lax) pour
que `app.` et `api.` partagent la session ; CORS autorise explicitement
`https://app.charbon.example` (+ `www.`).
**Variante MVP zéro-DNS-supplémentaire** (déjà fonctionnelle en preview) : domaine
unique avec chemins `/`, `/app/`, `/api/` — mêmes fichiers, aucun cookie
cross-domain ; bascule sous-domaines possible ensuite sans migration de données.

---

## 5. STATUTS (rappel opératoire)

- **PREVIEW TEMPORAIRE** : état actuel (sandbox + trycloudflare). Ne pas annoncer publiquement.
- **STAGING** : déploiement Option 1/2 sur infra durable, domaine technique ou IP,
  destiné aux tests internes (données de test seulement).
- **PRODUCTION** : infra durable + volume DB + backups testés + domaine stable +
  HTTPS + monitoring + logs rotatifs + CI/CD. Interdit d'écrire PRODUCTION avant
  vérification publique complète (checklist §10 de votre message).
