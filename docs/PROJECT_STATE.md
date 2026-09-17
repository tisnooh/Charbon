# PROJECT_STATE — Charbon

> État **réel** du projet, vérifié par commandes/tests/exécutions.
> Dernière mise à jour : 2026-09-18 (timezone utilisateur Asia/Shanghai).
> Dépôt officiel : https://github.com/tisnooh/Charbon (greenfield décidé par le
> propriétaire le 2026-09-18 ; historique local = source de vérité en attendant
> le push — voir « BLOCAGES EXTERNES »).

## 1. Architecture & stack (vérifiées : voir docs/ARCHITECTURE.md)

- Monorepo npm workspaces, TypeScript 5.9.3 strict, Node ≥ 20.16.
- `packages/shared` : zod v4, moteur de streaks, dates/fuseaux, plans Free/Premium.
- `apps/api` : Fastify 5 + Drizzle ORM + libSQL (SQLite fichier), sessions opaques
  scrypt/SHA-256, migrations SQL committées, static serving site+app.
- `apps/mobile` : PWA React 19 + Vite 8 + TanStack Query 5 + react-router 7
  (basename `/app` en prod), CSS maison iOS-like, dark/light, manifest + SW.
- `apps/site` : site statique Vite MPA (4 pages), pricing injecté depuis shared.
- Déploiement : 1 processus (`npm start`) ou Dockerfile multi-stage fourni.

## 2. Fonctionnalités TERMINÉES (prouvées par tests + runtime + navigateur)

### Auth & compte
- Inscription, connexion, déconnexion, session persistante (cookie httpOnly).
- Mot de passe oublié → e-mail réel (SMTP ou dev-outbox) → reset (token 30 min,
  usage unique, sessions révoquées). Changement de mot de passe (révoque les autres).
- Suppression de compte (confirmation mdp, cascade totale). Anti-énumération.
- Profil : nom, fuseau (détection + liste), thème système/clair/sombre persisté.

### Cœur produit
- Onboarding 3 étapes (objectifs, habitudes, routines) + « passer ».
- Dashboard « Aujourd'hui » : progression (anneau), tâches du jour/retard,
  habitudes (validation 1 tap, streak, sursis), routines (progression actions),
  objectifs, streak global, notifications non lues.
- Tâches : CRUD, échéance date+heure, complétion/décomplétion, corbeille +
  restauration (toast « Annuler » réel), vues Jour/À venir/Toutes/Faites/Corbeille.
- Habitudes : CRUD, planning daily/jours choisis, couleurs, pause/reprise
  (série gelée), historique calendrier 30 j (Free) / 90-365 j (Premium, gate serveur),
  validation antidatée bornée, idempotence.
- Routines : CRUD + actions (ajout/renom/suppression/réordonnancement API),
  exécution du jour (cocher/décocher), planification jours + heure.
- Objectifs : CRUD, statuts actif/atteint/archivé, liens tâches/habitudes (SET NULL).
- Streaks : moteur partagé testé (65 tests) — fuseaux, minuit, pauses, sursis,
  jours non planifiés transparents, record, « jours parfaits » global.
- Statistiques : today/7 j/30 j (Free), 90 j/365 j (Premium) ; attendu/complété/
  taux, tendance (points), streaks, graphique barres (agrégation hebdo > 40 j).
- Notifications in-app : centre, lu/tout lire, rappel quotidien créé par
  l'ordonnanceur serveur (heure locale user, 1/jour, contenu réel du jour).
- Abonnement : état réel, upgrade/cancel ; mode dev **labelisé** ; production
  sans prestataire → 501 honnête (jamais de faux paiement).
- Site vitrine : hero, problème, solution, fonctionnalités réelles, méthode,
  pricing (shared), FAQ, CTA, footer, contact **fonctionnel** (POST /contact),
  pages confidentialité/conditions réelles.

## 3. Fonctionnalités PARTIELLES / préparées (volontairement, documenté)

- **Push natifs (APNs/FCM)** : non câblés (clés externes). Rappels = in-app uniquement.
- **Paiement Stripe** : non câblé (clés externes). Modèle subscription prêt
  (provider/customer/period). Activation Premium possible en mode dev labelisé.
- **Accountability / challenges / coach IA** : annoncés « à venir » (site + app),
  aucune table morte créée.
- **Réordonnancement des actions de routine** : endpoint `PUT .../items/order`
  testé côté API ; pas encore d'UI drag-and-drop (P2).

## 4. Bugs trouvés & corrigés durant l'audit de construction

| # | Bug | Correctif + preuve |
|---|---|---|
| B1 | POST `Content-Type: application/json` + corps vide → 400 (Fastify) | parseur JSON tolérant (corps vide → `{}`), JSON malformé reste 400 ; test `validation.test.ts` + e2e runtime |
| B2 | SPA sous `/app/` : routes React non matchées (basename manquant) | `BrowserRouter basename=/app` en prod ; preuve browser-e2e |
| B3 | Build Vite avec `base:'/'` → assets 404 sous `/app/` | `base: command==='build' ? '/app/' : '/'` ; preuve browser-e2e |
| B4 | Sous-écrans Stats/Objectifs sans bouton retour (impasse mobile) | headers avec retour (`navigate(-1)`) ; preuve browser-e2e |
| B5 | Réordonnancement d'items par `sortOrder` PATCH = ex-aequo instables | endpoint dédié `PUT /routines/:id/items/order` (liste exacte, atomique) + tests |
| V1 | Cloche (lien) orange via règle globale `a{color:ember}` | `.btn--icon{color:var(--text)}` ; capture 06 régénérée |
| V2 | Tabbar trop translucide sans `backdrop-filter` | opacité 0.94 dark & light |
| V3 | Glyphe texte « ↻ » mal rendu | icône SVG inline |
| V4 | Stats : cellule « jours parfaits » dupliquée | 3ᵉ cellule → « jours actifs » |

## 5. Tests & preuves d'exécution (commandes réelles)

- `npm test` : **181/181** — shared 65 (streaks/dates/schémas), api 92 (auth,
  isolation 24 cas, tâches, habitudes, routines, objectifs, stats, subscription,
  notifications/rappels, validation, journey Phase 9), mobile 24 (client API,
  login, today, tâches+undo, composants, toasts).
- `npm run lint` : 0 erreur. `npm run typecheck` : 0 erreur (4 workspaces + tests).
- `npm run build` : shared/api/mobile/site OK (app 143 KB gzip, site 27 KB gzip).
- `npm run e2e:runtime` : **27/27** checks (site 4 pages, PWA manifest/sw/fallback,
  contact, parcours complet inscription→reconnexion→persistance, gating premium).
- `npm run e2e:browser` : **15/15** checks Chromium réel (viewport iPhone 390×844 +
  desktop 1280×800), **0 erreur console/page**, 9 screenshots dans
  `docs/screenshots/` (app login/today/stats/profil/abonnement, site hero/pricing).
- `npm run demo` : **27/27** checks parcours complet en Chromium (17 étapes demandées
  : inscription→…→persistance) + **25 captures** `docs/screenshots/journey/`.
- `npm run seed:demo` : compte `demo@charbon.app` / `demo-12345` seedé via l'API
  (données réelles : série 3 jours, routine, tâches, stats).
- Audit visuel sur captures : 4 anomalies (V1-V4) trouvées, corrigées, re-capturées.
- Voir `docs/VALIDATION.md` (livraison, PWA/natif, méthodes GitHub) et
  `docs/DEPLOYMENT.md` (production + Stripe/SMTP/push).

## 6. Variables d'environnement (voir `.env.example`, validation zod au boot)

`NODE_ENV, PORT, HOST, DB_PATH, SESSION_TTL_DAYS, APP_BASE_URL, SITE_BASE_URL,
CORS_ORIGINS, SMTP_HOST/PORT/SECURE/USER/PASS/FROM, DEV_BILLING, SERVE_STATIC,
RATE_LIMIT_AUTH_MAX, STRIPE_SECRET_KEY (réservé)`.
Aucun secret committé (`.env` gitignoré).

## 7. Dépendances externes (réelles)

- npm registry (install) ; GitHub (dépôt officiel, vide côté remote).
- SMTP (optionnel dev : outbox) ; Stripe (non câblé) ; APNs/FCM (non câblés).
- Sandbox de travail : ~1 Go RAM cgroup (cause racine des crashs Chromium/spawn
  transitoires rencontrés — mitigé : contextes séquentiels + kill propre).

## 8. Priorisation actuelle

- **P0** : aucun ouvert (build, auth, sécurité, persistance : verts et prouvés).
- **P1** : aucun ouvert.
- **P2** : UI drag-and-drop réordonnancement routine ; push natifs ; Stripe
  checkout+webhook ; code-splitting du bundle app (1 seul chunk 143 KB gzip) ;
  Dockerfile testé en CI réelle.
- **P3** : offline-first des mutations (file d'attente SW) ; i18n ; analytics
  first-party optionnels ; rafraîchissement pull-to-refresh natif.

## 9. Production live & prochaines tâches

- Production live sandbox (tunnel Cloudflare HTTPS) : voir `docs/VALIDATION.md` §9
  (journey public 11/11, persistance post-restart 6/6, console 0 erreur).
- Phase native iOS/Android préparée séparément : `docs/NATIVE_PHASE.md`
  (recommandation Capacitor, prérequis comptes Apple/Google, roadmap 7 étapes).
  Statut stores : **APPLICATION STORE NON ENCORE CRÉÉE**.

### Prochaines tâches concrètes

1. Push du dépôt local vers GitHub (voir BLOCAGES EXTERNES) puis branch protection + CI.
2. Câbler Stripe (checkout + webhook) quand les clés seront fournies.
3. UI réordonnancement des actions de routine (drag-and-drop).
4. Push APNs/FCM quand clés fournies (modèle notifications prêt).
5. Tests de charge légers + backup automatisé du fichier SQLite (cron `VACUUM INTO`).

## 10. BLOCAGES EXTERNES

- **Push vers GitHub** : le remote `tisnooh/Charbon` est vide ; mes commits sont
  locaux. **Méthode la plus sûre disponible ici (aucun secret dans le chat) :**
  device flow `gh auth login` lancé par moi sous pseudo-TTY → code à usage unique
  affiché → saisi par vous sur https://github.com/login/device → push `main` par
  moi dans la foulée. Alternative : push depuis votre machine (archive fournie).
- **SMTP production** : hôtes/user/pass à mettre dans `.env` (SMTP_*) ; sinon les
  e-mails restent en dev-outbox (fonctionnel en dev, insuffisant en prod).
- **Stripe** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`
  à fournir pour activer le paiement réel (le code d'état 501 honnête est en place).
- **APNs/FCM** : certificats/clés push à fournir le moment venu.
