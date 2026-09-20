# Charbon — Site officiel

Site officiel de **Charbon**, application mobile de discipline, accountability,
exécution et progression personnelle assistée par IA.

> « Tu as dit que tu le ferais. Prouve-le. »

Statut du produit : **en préparation / bêta**. Le site est orienté conversion
vers la waitlist (North Star : `visitor → waitlist signup`). Aucune fausse
promesse : pas de store links, pas de témoignages, pas de chiffres inventés.
Les scores affichés (84, 91, etc.) sont des **données illustratives**.

---

## Stack

| Couche     | Choix                                        |
| ---------- | -------------------------------------------- |
| Framework  | Next.js 15 (App Router, TypeScript strict)   |
| Styles     | Tailwind CSS 3.4 (design system tokenisé)    |
| Animations | CSS + IntersectionObserver (0 dépendance)    |
| Backend    | Route Handler `/api/waitlist` + Supabase     |
| Déploiement| Vercel                                       |
| Analytics  | Abstraction maison (`lib/analytics`), sans tracker |

Aucune dépendance superflue : `next`, `react`, `react-dom`, `@supabase/supabase-js`
(+ toolchain dev : TypeScript, Tailwind, ESLint).

---

## Prérequis

- Node.js ≥ 20
- npm (ou pnpm/yarn, adapter les commandes)
- Un projet Supabase (gratuit) pour la waitlist
- Un compte Vercel pour le déploiement

## Installation

```bash
cd charbon-web
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev                  # http://localhost:3000
```

Commandes :

```bash
npm run dev        # développement
npm run build      # build production
npm start          # servir le build
npm run lint       # ESLint (next/core-web-vitals + typescript)
npm run typecheck  # tsc --noEmit
```

> Sans Supabase configuré, en `NODE_ENV=development`, la waitlist utilise un
> store **en mémoire** (log console) pour tester tout le flow UI. En
> production sans Supabase, l'API renvoie proprement `503 backend_unavailable`
> et l'UI affiche un message humain — jamais d'erreur technique.

## Variables d'environnement

Voir `.env.example` :

```
NEXT_PUBLIC_SUPABASE_URL=          # Projet → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # clé anon (safe, soumise à la RLS)
NEXT_PUBLIC_SITE_URL=              # ex. https://charbon.app (canonical, OG, sitemap)
NEXT_PUBLIC_SUPPORT_EMAIL=         # affiché sur /support (placeholder sinon)
```

⚠️ **Ne jamais committer `.env*` rempli.** La clé `service_role` ne doit
**jamais** apparaître dans ce dépôt ni dans le frontend.

## Setup Supabase (waitlist)

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Ouvrir **SQL Editor** → coller le contenu de `supabase/schema.sql` → Run.
   - table `waitlist` (id, email unique, created_at, source, utm_*, locale, status)
   - index (email, lower(email), created_at, status)
   - RLS activée : **INSERT anonyme uniquement**, aucune lecture publique.
3. Récupérer `Project URL` et `anon key` → `.env.local`.
4. Redémarrer `npm run dev`.

Les doublons sont détectés par la contrainte unique (Postgres `23505`) →
l'UI affiche « Tu es déjà sur la liste. » sans exposer la table.

Exports / changements de statut (`waiting → invited → activated → unsubscribed`) :
depuis le Dashboard Supabase, ou côté serveur avec la clé `service_role`
(hors de ce dépôt).

## Déploiement Vercel

1. Pousser le repo sur GitHub/GitLab.
2. Vercel → **Import Project** → framework détecté : Next.js.
3. Ajouter les variables d'environnement (les 4 ci-dessus).
4. Deploy. Build command : `npm run build` — Output : `.next` (défaut).
5. Renseigner `NEXT_PUBLIC_SITE_URL` avec le domaine final puis redéployer
   (canonical, OG, sitemap).

Anti-spam : rate limiting en mémoire par IP (5 tentatives / 10 min) + honeypot
invisible + validation serveur. Suffisant au lancement ; pour durcir, brancher
Upstash sans toucher à l'API route.

## Structure des fichiers

```
charbon-web/
├── app/                      # App Router
│   ├── api/waitlist/route.ts # POST waitlist (validation, rate-limit, Supabase)
│   ├── confidentialite/ conditions/ mentions-legales/ support/ download/
│   ├── layout.tsx            # fonts, metadata, JSON-LD, providers
│   ├── page.tsx              # landing unique
│   ├── globals.css           # base styles, reveal, reduced-motion
│   ├── icon.svg              # favicon
│   ├── apple-touch-icon.png
│   ├── manifest.ts robots.ts sitemap.ts
│   └── not-found.tsx
├── components/
│   ├── layout/               # Header (sticky+blur), Footer, LegalPage
│   ├── sections/             # Hero, Problem, Score, HowItWorks, ProofLine,
│   │                         # AI, Focus, Progress, Profile, Differentiation,
│   │                         # Pricing, Extensions, Privacy, FAQ, FinalCTA
│   ├── product/              # PhoneFrame + écrans fidèles aux captures :
│   │                         # Today, Onboarding, Coach, Analysis, Focus, Profile
│   ├── ui/                   # Button, SectionHeading, icons (SVG inline)
│   ├── motion/               # Reveal, CountUp, ScoreArc, TrackOnView, Parallax
│   └── waitlist/             # WaitlistProvider, WaitlistModal, BetaCta
├── content/                  # fr.ts / en.ts — TOUT le texte du site
├── lib/
│   ├── analytics/            # track(), UTM, page_view/scroll events
│   ├── hooks/                # useInView, useReducedMotion, useParallax
│   ├── supabase/client.ts    # clients serveur/navigateur (clé anon)
│   ├── validation/email.ts
│   ├── waitlist/             # store (Supabase / dev mémoire), rate-limit
│   └── utils/cn.ts           # cn(), container, sectionPad
├── public/
│   ├── app/captures/         # captures officielles = source de vérité visuelle
│   ├── og/og.png             # image Open Graph / Twitter
│   └── icons/                # icônes manifest
├── supabase/schema.sql       # table waitlist + index + RLS + policies
├── types/                    # content.ts, index.ts (waitlist, analytics)
├── .env.example
└── README.md
```

## Modifier le contenu

Tout le texte (site + mockups + légal + emails) vit dans `content/fr.ts`
(miroir anglais prêt : `content/en.ts`), typé par `types/content.ts`.

- Changer une phrase → modifier `content/fr.ts`. Rien d'autre à toucher.
- Les composants ne contiennent **aucun texte en dur**.
- Les placeholders légal (`[RAISON SOCIALE À RENSEIGNER]`, …) sont dans
  `content/fr.ts → legal.*` : les remplacer quand les données existent.
- Email support : variable `NEXT_PUBLIC_SUPPORT_EMAIL` (sinon placeholder affiché).

### Ajouter la locale EN

1. Le contenu EN est déjà complet (`content/en.ts`).
2. Choisir la stratégie : sous-domaine `/en` (recommandé) ou bascule de locale.
3. Exemple minimal : créer `content/index.ts → copyFor(locale)` et passer la
   locale via middleware/cookie ; les composants lisent déjà `copy` via props
   ou directement — remplacer l'import de `copy` par un accès contextuel.
4. Ajouter `hreflang` dans `metadata.alternates.languages`.

## Remplacer les CTA bêta par les stores (au lancement)

Le composant central est `components/waitlist/BetaCta.tsx`.

1. Créer `components/ui/StoreBadges.tsx` avec les badges officiels
   App Store / Google Play (assets fournis par Apple/Google).
2. Dans `content/*`, les CTA hero/final/download pointent vers ces badges :
   remplacer `<BetaCta …>` par `<StoreBadges />` dans `Hero.tsx`,
   `FinalCTA.tsx`, `download/page.tsx`.
3. Mettre à jour `app/manifest.ts`, le JSON-LD (`layout.tsx`) et la FAQ
   (`content/fr.ts → faq.items`) avec les URLs réelles.
4. Conserver la waitlist pour les régions non servies.

Aucun faux lien store n'existe aujourd'hui : c'est volontaire.

## Analytics

`lib/analytics` : `track(event, props)` + capture UTM (sessionStorage, premier
touch). Événements : `page_view`, `hero_beta_clicked`, `secondary_cta_clicked`,
`waitlist_modal_opened`, `waitlist_started`, `waitlist_completed`,
`waitlist_duplicate`, `pricing_viewed`, `pro_clicked`, `faq_opened`,
`scroll_50`, `scroll_90`.

En dev : `console.info`. En prod : poussés dans `window.charbonAnalytics`
+ événement DOM `charbon:analytics`. Brancher un provider (Plausible,
PostHog…) = un seul abonnement à cet événement, sans toucher aux composants.

## Accessibilité & performance (résumé)

- HTML sémantique, skip link, focus visible orange, focus trap modal, ESC,
  restauration du focus, `aria-expanded/controls` sur FAQ et menu,
  `prefers-reduced-motion` respecté (CSS + JS), cibles tactiles ≥ 44 px,
  contrastes AA sur fond noir, mockups exposés en `role="img"` + label.
- 0 image raster dans les pages (mockups 100 % CSS/SVG → poids minimal),
  animations CSS/IO uniquement, Inter en `display: swap` + fallback système,
  `compress: true`, headers sécurité, pas de vidéo ni tracker.

## Tests effectués (checklist)

Voir section « Contrôle final » du brief. Résumé :

- [x] `npm run build` sans erreur TypeScript ni lint bloquant
- [x] Modal : ouverture, fermeture (bouton, backdrop), ESC, focus trap, restore
- [x] Waitlist : email vide, invalide, doublon, succès, backend indisponible, rate limit, honeypot
- [x] Nav : ancres header/footer, scroll fluide, menu mobile, état actif
- [x] FAQ : clavier + ARIA + transition
- [x] Pages : /, /confidentialite, /conditions, /mentions-legales, /support, /download, 404
- [x] SEO : title, description, OG, Twitter, canonical, sitemap.xml, robots.txt, JSON-LD
- [x] Responsive : 320 → 1920 px (pas de scroll horizontal, mockups proportionnels en cqw)

## Licence & marque

Marque Charbon : tous droits réservés. Interface du site : code fourni tel
quel, propriété du commanditaire. Inter : SIL Open Font License 1.1.

## QA automatisée (scripts/)

```bash
# Tests HTTP : pages, assets, SEO, API waitlist (états 400/409/429/503/200, honeypot)
# Lancer un serveur d'abord (npm run start ou dev), puis :
BASE=http://localhost:3000 MODE=prod npm run qa:api     # MODE=dev si serveur dev

# QA visuelle : 8 breakpoints (320→1920), scroll horizontal, modal, focus trap,
# ESC, FAQ — nécessite `npm i -D playwright && npx playwright install chromium --only-shell`
BASE=http://localhost:3000 npm run qa:shots
BASE=http://localhost:3000 npm run qa:shots:mobile
```

`scripts/overflow.mjs` liste les éléments débordants à un breakpoint donné.

### Visualiser les états de la modal waitlist (dev uniquement)

En `npm run dev`, ajouter `?demo=` à l'URL pour prévisualiser chaque état UI
sans backend ni Supabase :

| URL                      | État affiché                        |
| ------------------------ | ----------------------------------- |
| `/?demo=success`         | succès (« Tu es sur la liste. »)    |
| `/?demo=duplicate`       | doublon (« Tu es déjà sur la liste. ») |
| `/?demo=invalid`         | email invalide                      |
| `/?demo=error`           | erreur backend générique            |
| `/?demo=loading`         | état de chargement                  |

Ce mode est désactivé en production par défaut. Pour un staging de prévisualisation :
`NEXT_PUBLIC_CHARBON_DEMO=1 npm run build` (variable inlinée au build).
"# charbon" 
