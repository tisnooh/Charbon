# DÉPLOYEMENT & SERVICES EXTERNES — Charbon

> Checklist opérationnelle. Rien ici n'est hypothétique : les commandes sont
> celles du dépôt (`package.json`, `Dockerfile`), les variables celles de
> `.env.example` (validation zod au démarrage : variable manquante/incorrecte =
> refus de démarrer avec message précis).

---

## A. Ce qu'on héberge

Un **seul service** (monolithe délibéré en phase de lancement) :

| Composant | Servi par | Chemin |
|---|---|---|
| API REST | processus Node (Fastify) | `/api/v1/*` |
| Site vitrine (statique) | Fastify `@fastify/static` | `/` |
| Application PWA (statique SPA) | Fastify `@fastify/static` | `/app/*` |
| Base de données | fichier SQLite/libSQL | volume `/data/charbon.db` |

Options d'hébergement recommandées (coût croissant) :
1. **VPS + Docker** (OVH/Hetzner/Scaleway ~5 €/mois) — contrôle total, recommandé.
2. **Fly.io / Railway** (container + volume persistant) — zéro admin réseau.
3. Dénuagé sans Docker : `npm ci && npm run build && npm start` derrière Caddy/Nginx.

⚠️ Contraintes réelles :
- **Volume persistant OBLIGATOIRE** pour `/data` (SQLite = fichier). Sans volume →
  perte des données au redéploiement.
- **Une seule instance** (ordonnanceur de rappels in-process ; SQLite écriture
  unique). Scale ultérieur = migrer Postgres (voir ARCHITECTURE §8).
- **HTTPS obligatoire** en production (cookies `Secure`, PWA installable).

---

## B. Checklist déploiement pas à pas (VPS + Docker)

### B.1 Prérequis serveur
- [ ] VPS Ubuntu/Debian, Docker + plugin compose installés.
- [ ] Domaine DNS : `charbon.example` (A → IP) + `www` si souhaité.
- [ ] Compte GitHub avec accès au dépôt (voir VALIDATION §6).

### B.2 Récupérer le code
```bash
git clone https://github.com/tisnooh/Charbon.git && cd Charbon
```

### B.3 Variables d'environnement (fichier `.env` À LA RACINE du repo, jamais committé)
```ini
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DB_PATH=/data/charbon.db
SESSION_TTL_DAYS=30
APP_BASE_URL=https://charbon.example/app      # liens e-mails + CORS
SITE_BASE_URL=https://charbon.example         # CORS
CORS_ORIGINS=                                  # vide = app+site same-origin
DEV_BILLING=false                              # OBLIGATOIREMENT false en prod
SERVE_STATIC=true
RATE_LIMIT_AUTH_MAX=10
# SMTP (section D) — requis pour les e-mails réels
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Charbon <noreply@charbon.example>
```
Vérification : au démarrage, l'API refuse de booter si une variable est invalide
(message listant les champs fautifs) — aucun mode dégradé silencieux.

### B.4 Build & lancement
```bash
docker build -t charbon:latest .
docker run -d --name charbon --restart unless-stopped \
  -p 80:3000 -v charbon-data:/data --env-file .env charbon:latest
# ou sans Docker : npm ci && npm run build && npm start (systemd unit recommandée)
```

### B.5 HTTPS + reverse proxy (Caddy, auto-TLS)
```caddyfile
charbon.example {
    reverse_proxy localhost:3000
}
```
- [ ] Certificat émis automatiquement (Caddy) ou Let's Encrypt (nginx/certbot).
- [ ] Redirection HTTP→HTTPS active.
- [ ] Cookie `Secure` effectif (NODE_ENV=production).

### B.6 Post-déploiement (smoke tests)
```bash
curl -fsS https://charbon.example/api/v1/health          # {"status":"ok",…}
curl -fsS https://charbon.example/ | grep -q Charbon     # site
curl -fsS https://charbon.example/app/ | grep -q root    # app
npm run e2e:runtime   # en local pointé vers DEMO_BASE=https://charbon.example
```
- [ ] Inscription réelle depuis un navigateur mobile.
- [ ] PWA : Safari → « Sur l'écran d'accueil » fonctionne (HTTPS ok).

### B.7 Base de données — sauvegardes
- [ ] Cron quotidien : `docker exec charbon node -e "…VACUUM INTO '/data/backup-$(date).db'"`
  ou copie du fichier après `PRAGMA wal_checkpoint` ; externaliser (S3/B2/OVH).
- [ ] Test de restauration trimestriel (recopier le backup comme DB_PATH).
- [ ] Migrations : automatiques au boot (`apps/api/drizzle/*.sql`, idempotent).

---

## C. Checklist par composant (résumé)

| Composant | Quoi héberger | Où | Commandes | Variables | Domaine/config |
|---|---|---|---|---|---|
| API | container/node | VPS/Fly | `docker build/run` ou `npm ci&&build&&start` | §B.3 | proxy HTTPS → :3000 |
| Site | fichiers `apps/site/dist` | inclus dans l'API | inclus dans `npm run build` | `SITE_BASE_URL` | `/` |
| App | fichiers `apps/mobile/dist` | inclus dans l'API | inclus dans `npm run build` | `APP_BASE_URL` | `/app/` |
| DB | fichier SQLite | volume `/data` | migrations auto | `DB_PATH` | backups §B.7 |

---

## D. Services externes — checklist exacte (ne bloquent PAS le lancement)

### D.1 Stripe (paiements Premium) — actuel : 501 honnête + mode dev labelisé
| Élément | Où le récupérer | Où le configurer |
|---|---|---|
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys (mode **Test** d'abord : clé `sk_test_…`) | `.env` racine (prod : secret manager du PaaS) |
| `STRIPE_WEBHOOK_SECRET` | dashboard → Developers → Webhooks → Add endpoint `https://charbon.example/api/v1/webhooks/stripe` (événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) → clé `whsec_…` | `.env` |
| `STRIPE_PRICE_MONTHLY` | dashboard → Products → créer produit « Charbon Premium » 4,99 €/mois récurrent → copier `price_…` | `.env` |
| Checkout | à implémenter côté API (route + redirect) — code d'état 501 déjà en place | `apps/api/src/routes/subscription.routes.ts` |
| Webhook | à implémenter (signature + mise à jour `subscriptions`) | idem |
| Test mode | bascule « Test mode » dashboard ; cartes test `4242 4242 4242 4242` | — |
Étapes : 1) clés test dans `.env` ; 2) j'implémente checkout+webhook (tâche P2 planifiée) ;
3) `npm run e2e:runtime` avec Stripe test ; 4) bascule clés live.

### D.2 E-mails transactionnels (reset password) — actuel : dev-outbox fonctionnel
| Variable | Où la récupérer (exemples de fournisseurs) | Notes |
|---|---|---|
| `SMTP_HOST` | Infomaniak `mail.infomaniak.com` · OVH `ssl0.ovh.net` · Mailgun `smtp.mailgun.org` · SendGrid `smtp.sendgrid.net` · Brevo `smtp-relay.brevo.com` | port 587 STARTTLS |
| `SMTP_PORT` | panneau du fournisseur | 587 (ou 465 avec `SMTP_SECURE=true`) |
| `SMTP_SECURE` | — | `false` en 587, `true` en 465 |
| `SMTP_USER` | identifiant SMTP du fournisseur (souvent l'adresse complète) | |
| `SMTP_PASS` | mot de passe SMTP généré dans le panneau (PAS le mot de passe compte) | |
| `SMTP_FROM` | adresse déclarée chez le fournisseur (DKIM/SPF configurés) | ex. `Charbon <noreply@charbon.example>` |
Vérification : `npm run e2e:runtime` puis demander un reset → e-mail reçu en réel.
Sans SMTP : le flux reste testable (dev-outbox + `GET /api/v1/dev/emails`,
désactivé en production).

### D.3 Notifications push natives (optionnel, P2)
| Service | Credentials nécessaires | Où les récupérer |
|---|---|---|
| APNs (iOS) | clé `.p8` (APNs Key) + `Key ID` + `Team ID` | developer.apple.com → Account → Keys → créer clé APNs Services |
| FCM (Android) | clé de service account JSON Firebase | console.firebase.google.com → Project settings → Cloud Messaging → Service accounts |
Côté code : le modèle `notifications` + l'ordonnanceur existent ; ajouter un
transport push (ex. lib `web-push`/`apn`) et l'enregistrement des tokens device
(table `push_tokens` à créer via migration). Aucune donnée actuelle n'est perdue.

---

## E. Ordre de mise en production recommandé

1. Push GitHub (device flow) → CI minimale (lint/typecheck/tests/build).
2. VPS + Docker + HTTPS + volume → smoke tests §B.6.
3. SMTP réel → test reset password depuis mobile.
4. Sauvegardes cron + alerting uptime (UptimeRobot sur `/api/v1/health`).
5. Stripe test → checkout/webhook → Stripe live.
6. (Optionnel) push APNs/FCM.
