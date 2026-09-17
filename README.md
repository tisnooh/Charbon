# Charbon

**La discipline qui tient.** Application de constance (habitudes, routines, tâches,
objectifs, streaks, statistiques) + site vitrine + backend API — monorepo TypeScript.

## Démarrage rapide

```bash
npm install          # workspaces : shared, api, mobile, site
cp .env.example .env # optionnel : tous les défauts dev fonctionnent sans .env
npm run dev          # API :3000 + app :5173 + site :5174 (proxy /api)
```

- Application (dev) : http://localhost:5173
- Site (dev) : http://localhost:5174
- API (dev) : http://localhost:3000/api/v1/health

Production (un seul processus) :

```bash
npm run build        # shared → api → mobile (/app/) → site (/)
npm start            # sert / (site), /app/* (PWA), /api/v1/* (API)
```

## Qualité

```bash
npm run lint          # ESLint 10 + typescript-eslint
npm run typecheck     # tsc strict sur les 4 workspaces (+ tests)
npm test              # 181 tests : shared 65 + api 92 + mobile 24
npm run e2e:runtime   # serveur réel buildé + parcours HTTP complet (27 checks)
npm run e2e:browser   # Chromium réel : UI mobile + site, console, screenshots
npm run verify        # lint + typecheck + test + build + e2e:runtime
```

## Structure

```
packages/shared   schémas zod, moteur de streaks, dates/fuseaux, plans Free/Premium
apps/api          Fastify 5 + Drizzle/libSQL : auth sessions, ressources, stats,
                  rappels, abonnement, static serving ; migrations SQL committées
apps/mobile       PWA React 19 (Vite 8) mobile-first : aujourd'hui, tâches,
                  habitudes, routines, objectifs, stats, profil, sécurité
apps/site         site vitrine statique 4 pages (pricing issu de shared)
docs/             ARCHITECTURE.md, DATABASE.md, PROJECT_STATE.md, screenshots/
scripts/          runtime-e2e.mjs, browser-e2e.mjs, gen-icons.mjs
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — choix techniques, flux, règles métier, sécurité
- [`docs/DATABASE.md`](docs/DATABASE.md) — schéma complet, conventions, migrations
- [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — état réel : terminé/partiel/bugs/P0-P3/prochaines tâches
- [`.env.example`](.env.example) — variables d'environnement documentées

## Principes produits (respectés dans le code)

- Le cœur (habitudes, routines, tâches, objectifs, stats 30 j) est **gratuit sans
  limite** ; le Premium ajoute stats 90/365 j — gating côté serveur, jamais de
  paywall artificiel.
- Rien de factice : pas de faux boutons, faux témoignages ou fausses stats ;
  les fonctionnalités futures sont labelisées « à venir ».
- Streaks et jours calculés dans le fuseau de l'utilisateur ; suspension = série
  gelée, pas cassée.
