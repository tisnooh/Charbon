# VALIDATION & LIVRAISON — Charbon

> Dernière exécution : 2026-09-18. Toutes les affirmations ci-dessous proviennent
> de commandes réellement exécutées (sorties consignées) et de captures d'écran
> réelles (`docs/screenshots/`, `docs/screenshots/journey/`).

## 1. Lancer l'application et le site

### Depuis ce workspace (méthode recommandée si vous récupérez les fichiers)

```bash
cd Charbon
npm install          # Node ≥ 20.16 ; aucun compilateur requis
npm run dev
```

| Service | URL dev | Port |
|---|---|---|
| Application (PWA React) | http://localhost:5173 | 5173 |
| Site vitrine | http://localhost:5174 | 5174 |
| API | http://localhost:3000/api/v1/health | 3000 |

### Build production (un seul processus sert TOUT)

```bash
npm run build && npm start
# site  : http://localhost:3000/
# app   : http://localhost:3000/app/
# API   : http://localhost:3000/api/v1/*
```

### Preview depuis l'environnement de travail actuel

**Aucune URL publique n'est exposée par ce sandbox** (vérifié : aucune variable
d'environnement ni proxy public ; les ports écoutés sont internes au harness).
Les preuves visuelles sont donc fournies par :
- captures Chromium réelles : `docs/screenshots/journey/*.png` (25 vues) ;
- la commande `npm run demo` (rejoue le parcours complet et régénère les captures) ;
- l'archive téléchargeable `Charbon-v0.1.0.zip` (racine du workspace) pour
  exécuter chez vous en 2 commandes.

### Compte de démonstration (données réelles seedées via l'API)

```bash
npm run seed:demo     # serveur démarré au préalable
```
- e-mail : `demo@charbon.app`
- mot de passe : `demo-12345`
- contenu : 1 objectif, 2 habitudes (série de 3 jours), 1 routine matin (3 actions),
  2 tâches (1 à faire aujourd'hui, 1 terminée), statistiques non vides.
- Sinon : créez votre propre compte depuis l'écran d'inscription (2 minutes).

## 2. Parcours applicatif testé de bout en bout (Chromium réel, viewport iPhone 390×844)

`npm run demo` → **27/27 checks, 0 erreur console**. Étapes et captures :

| # | Étape | Capture | Résultat |
|---|---|---|---|
| 1 | Connexion (écran vide) | 01-login.png | ✓ |
| 2 | Inscription (formulaire rempli) | 02-register.png | ✓ |
| 3 | Onboarding objectifs | 03-onboarding-objectifs.png | ✓ |
| 4 | Onboarding habitudes | 04-onboarding-habitudes.png | ✓ |
| 5 | Onboarding routines | 05-onboarding-routines.png | ✓ |
| 6 | Dashboard | 06-dashboard.png | ✓ |
| 7 | Création tâche (sheet + échéance) | 07-tache-creation.png | ✓ |
| 8 | Tâche visible aujourd'hui | 08-tache-creee.png | ✓ |
| 9 | Validation tâche (barrée + cochée, 1/6) | 09-tache-validee.png | ✓ |
| 10 | Création habitude (jours choisis) | 10-habitude-creation.png | ✓ |
| 11 | Habitude créée | 11-habitude-creee.png | ✓ |
| 12 | Validation habitude (streak 🔥1) | 12-habitude-validee.png | ✓ |
| 13 | Création routine (2 actions) | 13-routine-creation.png | ✓ |
| 14 | Routine créée | 14-routine-creee.png | ✓ |
| 15 | Utilisation routine (actions cochées, terminée) | 15-routine-utilisation.png | ✓ |
| 16 | Objectifs | 16-objectifs.png | ✓ |
| 17 | Statistiques (taux, trend, barres) | 17-statistiques.png | ✓ |
| 18 | Profil | 18-profil.png | ✓ |
| 19 | Paramètres : thème clair appliqué | 19-parametres-clair.png | ✓ |
| 20 | Premium : état Free réel + simulateur labelisé | 20-premium.png | ✓ |
| 21 | Premium activé (mode dev) puis retour Free | 21-premium-actif-dev.png | ✓ |
| 22 | Déconnexion → login | 22-deconnexion.png | ✓ |
| 23 | Reconnexion + persistance (habitudes/routines intactes) | 23-reconnexion-persistance.png | ✓ |

Persistance vérifiée aussi côté API : `npm run e2e:runtime` **27/27** (logout →
login → données identiques, streaks conservés).

## 3. Site vitrine vérifié (desktop 1280×800 + mobile 390×844)

Sections présentes et rendues (checks automatisés + captures pleine page) :
hero ✓, problème ✓, solution ✓, fonctionnalités ✓, comment ça marche ✓,
pricing ✓ (Free « Gratuit » + Premium « 4,99 € » injectés depuis `@charbon/shared`,
mentions « à venir »), FAQ ✓, CTA final ✓, footer ✓ (légal + contact).
Responsive : `site-desktop-fullpage.png`, `site-mobile-fullpage.png` (colonnes
empilées, nav réduite au CTA, pricing empilé — aucun débordement).
Contact : POST réel `/api/v1/contact` testé (201) avec états succès/erreur côté page.

## 4. Audit visuel — anomalies trouvées puis corrigées (relance démo après correctifs)

| # | Anomalie constatée sur capture | Correctif |
|---|---|---|
| V1 | Cloche (lien) colorée orange par la règle globale `a{color:ember}` | `.btn--icon{color:var(--text)}` (components.css) |
| V2 | Tabbar trop translucide si `backdrop-filter` non supporté | opacité 0.82→0.94 (dark & light) |
| V3 | Glyphe texte « ↻ » mal rendu selon les polices | icône SVG inline (TodayScreen) |
| V4 | Statistiques : cellule « jours parfaits » dupliquée | 3ᵉ cellule → « jours actifs » (jours avec attendu>0) |

Revus et jugés conformes : espacements/alignements des sheets, hiérarchie
typographique, lisibilité dark & light, empty states iconisés + CTA, loading
skeletons, toasts, modales de confirmation, cohérence app/site (mêmes tokens,
mêmes icônes, pricing partagé).

## 5. État PWA / natif — VERBATIM

- **Est-ce une PWA ?** OUI : manifest (`/app/manifest.webmanifest`), icônes 192/512
  + maskable, service worker (`/app/sw.js` : shell cache-first, navigations
  network-first avec repli cache, `/api/*` jamais caché).
- **Installable ?** OUI sur Android/Chrome directement ; sur iPhone via Safari →
  « Sur l'écran d'accueil » (apple-touch-icon fourni). En production l'installation
  exige HTTPS (ou localhost en dev).
- **Hors ligne ?** PARTIEL : le shell et les assets sont servis hors ligne ; les
  données (API) nécessitent le réseau — pas de file de mutations offline (P3).
- **Build iOS natif (Xcode/.ipa) ?** NON.
- **Build Android natif (APK/AAB) ?** NON.

> **APPLICATION STORE NON ENCORE CRÉÉE.**
> Charbon n'est PAS prêt pour l'App Store / Google Play : aucun build natif,
> aucun compte développeur Apple/Google, aucune soumission. L'état réel est une
> PWA web installable. Ne pas communiquer « disponible sur l'App Store ».

## 6. GitHub — état et méthode d'authentification la plus sûre ici

- 6+ commits locaux sur `main`, arbre propre ; remote `origin` =
  `https://github.com/tisnooh/Charbon.git` (dépôt distant vérifié VIDE via API GitHub).
- **Méthode la plus sûre disponible dans ce sandbox : le device flow GitHub CLI
  (`gh`)** — aucun secret ne transite par le chat :
  1. Je lance `gh auth login` sous pseudo-TTY dans le sandbox ;
  2. Je vous affiche le **code à usage unique** (type `XXXX-XXXX`, valide ~15 min) ;
  3. Vous saisissez ce code sur https://github.com/login/device depuis VOTRE
     appareil (vous voyez exactement les permissions accordées : `repo`) ;
  4. `gh` reçoit un token stocké uniquement dans le keychain/config du sandbox,
     jamais dans l'historique de chat ; je pousse `main` et je vérifie le distant.
- Alternative sans rien exposer ici : télécharger `Charbon-v0.1.0.zip`,
  dézipper chez vous, `git remote add origin … && git push -u origin main`
  (l'historique complet est inclus via `.git` ? NON — le zip exclut `.git` par
  sécurité ; pour conserver l'historique, privilégiez le device flow ci-dessus,
  ou poussez depuis un clone que je peux générer en bundle : `git bundle`
  disponible sur demande).
- Vérifications pré-push faites : aucun secret committé (`.env` gitignoré, scan
  manuel des fichiers sensibles), `package-lock.json` committé, migrations
  committées, docs + screenshots inclus, `.gitignore`/`.dockerignore` cohérents.

## 7. Audit final (commandes + résultats réels)

| Commande | Résultat |
|---|---|
| `npm run lint` | 0 erreur |
| `npm run typecheck` | 0 erreur (shared, api, mobile, site + tests) |
| `npm test` | 181/181 (shared 65, api 92, mobile 24) |
| `npm run build` | 4/4 workspaces OK |
| `npm run e2e:runtime` | 27/27 checks HTTP réels |
| `npm run e2e:browser` | 15/15 checks Chromium + 0 erreur console |
| `npm run demo` | 27/27 checks parcours + 25 captures |

## 9. PRODUCTION LIVE (sandbox tunnélisée) — 2026-09-18

- **URL publique HTTPS** (Cloudflare quick tunnel, sans compte) :
  https://looks-fitting-virtually-dir.trycloudflare.com
  - site : `/` · app PWA : `/app/` · API : `/api/v1/*` (même processus, NODE_ENV=production).
- **Base** : `data/charbon.db` (SQLite/libSQL) dans le workspace persistant ;
  preuve de persistance : restart complet du serveur puis reconnexion + données
  intactes (`npm run check:prod -- persist` 6/6).
- **Tests production réels** : `npm run check:prod -- journey` 11/11 (site desktop
  + parcours mobile complet via l'URL publique, 0 erreur console) ; captures
  `docs/screenshots/prod/`.
- Config prod : DEV_BILLING=false (Premium → 501 honnête), cookies Secure,
  rate-limit auth 10/10 min, SERVE_STATIC=true.
- Incidents rencontrés & corrigés durant la mise en prod :
  1. chemin DB réécrit par la couche sandbox (`"$ARENA_WORKSPACE"` → `$ARENA_WORKSPACE`)
     → `.env` passé en chemins RELATIFS + fichier migré vers `data/charbon.db` ;
  2. double serveur (EADDRINUSE) → procédure restart propre documentée ci-dessous ;
  3. races de rendu dans prod-check (counts sans waitFor) → waits ajoutés.
- **Limites assumées (documentées, non bloquantes)** : l'URL quick-tunnel est
  aléatoire à chaque restart de cloudflared et l'hébergement vit dans ce sandbox
  → pour une production durable : VPS + Docker + domaine, checklist
  `docs/DEPLOYMENT.md` §B (blocage externe : infra/compte d'hébergement).
  SMTP absent → reset password non envoyable en prod (e-mails en dev-outbox
  illisibles en production par design) ; Stripe non câblé (501 honnête).
- Procédure de relance du service dans ce sandbox :
  `setsid nohup /tmp/cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate > /tmp/cf.log 2>&1 &`
  puis `setsid nohup node apps/api/dist/index.js > /tmp/prod-server.log 2>&1 &`
  (un seul serveur à la fois ; vérifier `tail /tmp/prod-server.log`).

## 8. Fichiers de livraison

- `Charbon-v0.1.0.zip` (racine workspace) : sources complètes hors node_modules/.git.
- `docs/screenshots/` + `docs/screenshots/journey/` : preuves visuelles.
- `docs/DEPLOYMENT.md` : checklist production + services externes (Stripe/SMTP/push).
- `scripts/seed-demo.mjs`, `scripts/demo-journey.mjs`, `scripts/runtime-e2e.mjs`,
  `scripts/browser-e2e.mjs` : reproductibilité des preuves.
