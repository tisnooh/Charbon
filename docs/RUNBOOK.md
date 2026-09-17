# RUNBOOK — exploitation Charbon (logs, monitoring, backups, restauration)

## 1. Logs

- Format : JSON structuré (pino via Fastify), une ligne par événement HTTP +
  logs applicatifs (`req.log.error/info`).
- Container (Option 1) : rotation `json-file` max-size 10 Mo × 5 fichiers
  (docker-compose). Consultation : `docker compose logs -f app` / `docker compose logs --tail 200 app`.
- Hors Docker : redirection stdout → journald (`systemctl status charbon`) ou
  fichier avec logrotate.
- Erreurs critiques : `unhandledRejection` / `uncaughtException` = log JSON
  `error` + exit(1) → policy Docker `restart: unless-stopped` redémarre proprement
  (sessions conservées en DB ; aucune perte de données).

## 2. Monitoring

- `GET /api/v1/health` : vivant (processus).
- `GET /api/v1/healthz` : **deep** (processus + `SELECT 1` SQLite) → c'est CETTE
  URL que le monitoring externe doit sonder (docker healthcheck l'utilise déjà).
- Sonde externe recommandée : UptimeRobot / Healthchecks.org toutes les 5 min sur
  `https://<domaine>/api/v1/healthz` + alerte e-mail/Telegram.
- Métriques métier minimales (à ajouter si besoin, P2) : compteur d'inscriptions
  via requête SQL quotidienne sur `users.created_at`.

## 3. Backups (SQLite)

- Commande : `node scripts/backup-db.mjs`
  (env : `DB_PATH`, `BACKUP_DIR` défaut `/backups`, `BACKUP_RETENTION_DAYS` défaut 7).
- Mécanisme : `VACUUM INTO` (copie cohérente à chaud) + `PRAGMA integrity_check`
  du fichier produit + purge glissante de la rétention.
- Cron VPS (Option 1) :
  `0 3 * * * docker exec charbon-app-1 node scripts/backup-db.mjs && rclone copy /var/lib/docker/volumes/charbon-backups/_data remote:charbon-backups --transfers 4`
  (ou toute copie objet : S3/B2/Scaleway).
- Fréquence MVP : quotidienne + avant chaque déploiement de migration de schéma.

## 4. Restauration (testée : procédure, pas une promesse)

1. Stopper l'API : `docker compose stop app`.
2. Vérifier le backup : `node -e` ouvre le fichier + `PRAGMA integrity_check` = `ok`
   (le script de backup le fait déjà à la création).
3. Copier : `cp /backups/charbon-<stamp>.db /var/lib/docker/volumes/charbon-data/_data/charbon.db`
   (propriétaire/permissions du volume conservés).
4. Redémarrer : `docker compose up -d app` ; les migrations Drizzle sont
   idempotentes (journal interne) : aucun risque de rejeu destructeur.
5. Contrôle : `GET /api/v1/healthz` 200 + connexion d'un compte connu.
Exercice recommandé trimestriel : restauration sur un staging séparé
(`DB_PATH` différent) avant toute mise en production de backup.

## 5. Déploiement reproductible (depuis GitHub)

```bash
# sur le VPS, une fois :
git clone https://github.com/tisnooh/Charbon.git /opt/charbon && cd /opt/charbon
cp .env.production.example .env.production   # remplir (jamais committé)
docker compose up -d --build
# ensuite, à chaque release :
git pull --ff-only origin main && docker compose up -d --build
```
CI GitHub Actions (`.github/workflows/ci.yml`) : install → lint → typecheck →
tests → build → e2e runtime, sur chaque push/PR. Le volet deploy automatisé est
fourni commenté : à activer après ajout des secrets SSH dédiés et validation
staging (ne jamais activer une config non testée).

## 6. Incidents connus & réponses rapides

| Symptôme | Cause probable | Réponse |
|---|---|---|
| 502 sur le domaine | container app down | `docker compose ps` + `logs app` ; healthcheck relance auto |
| healthz 500 | DB illisible/volume démonté | vérifier mount `/data`, restaurer §4 |
| e-mails absents | SMTP non configuré | dev-outbox en dev ; en prod remplir SMTP_* puis restart |
| Premium non actif après paiement | webhook non reçu | vérifier endpoint Stripe = `https://<domaine>/api/v1/webhooks/stripe` + secret |
| tunnel preview mort | sandbox redémarré | relancer cloudflared + serveur (procédure VALIDATION §9) |
