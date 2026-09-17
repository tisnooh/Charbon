# PHASE NATIVE (iOS / Android) — préparation séparée

> Périmètre : une fois la version web/PWA stable en production (fait : voir
> `docs/VALIDATION.md` §production), transformer Charbon en véritable application
> iOS + Android. **Rien de cette phase n'est commencé** : pas de build natif,
> pas de compte développeur, aucune soumission. Statut actuel public :
> **APPLICATION STORE NON ENCORE CRÉÉE** (PWA installable uniquement).

## 1. État de départ (réel)

- PWA React 19 complète, installable iOS/Android via navigateur, offline shell OK.
- API REST documentée (OpenAPI de fait : routes Fastify + zod), auth par cookie
  de session httpOnly → **à faire évoluer pour le natif** : cookies non pratiques
  hors navigateur ⇒ ajouter un flux tokens (Bearer JWT ou sessions via
  `Authorization: Bearer <token>`, endpoint `/auth/login` renvoyant le token en
  JSON en plus du cookie).
- Backend 100 % réutilisable : aucune logique métier côté client (streaks, stats,
  gating servis par l'API).

## 2. Options techniques (recommandation : A)

| Option | Principe | Coût | Risque |
|---|---|---|---|
| **A. Capacitor** (recommandé) | Wrap de la PWA existante dans une WebView native + pont plugins (push, store, haptiques) | faible : même codebase React | UX = WebView (correcte ici, CSS natif-like déjà soigné) |
| B. Expo / React Native | Ré-écrire les écrans en RN | élevé : double codebase UI | moyen |
| C. Natif Swift / Kotlin | Deux apps natives | très élevé | faible mais délai incompatible phase de lancement |

Justification A : le design system est déjà « iOS-like » (safe areas, sheets,
tab bar), la PWA passe les checks Lighthouse-style ; Capacitor donne binaire
signable, accès APNs/FCM, deep links, sans réécriture.

## 3. Prérequis externes (BLOCAGES EXTERNES de la phase)

| Élément | Où l'obtenir | Coût |
|---|---|---|
| Compte Apple Developer | developer.apple.com (programme iOS) | 99 $/an |
| Mac avec Xcode (build/signature iOS) | machine locale ou CI macOS (GitHub Actions macos runner) | inclus/CI |
| Compte Google Play Console | play.google.com/console | 25 $ une fois |
| Clé APNs (.p8, Key ID, Team ID) | developer.apple.com → Keys | inclus compte Apple |
| Credentials FCM (service account) | console.firebase.google.com | gratuit |
| Certificats de signature Android (keystore) | généré localement (`keytool`) | gratuit |

## 4. Roadmap proposé (étapes vérifiables)

1. **API** : flux Bearer token (`/auth/login` JSON token, middleware accepte
   cookie OU Bearer) + tests d'isolation rejoués en Bearer.
2. **Capacitor** : `npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`,
   `npx cap init`, web dir = `apps/mobile/dist`, plugins : push-notifications,
   haptics, splash, status-bar.
3. **Push** : implémenter transport APNs/FCM côté API (table `push_tokens`,
   migration drizzle) branché sur l'ordonnanceur de rappels existant.
4. **Offline** : file de mutations locale (IndexedDB) + replay (P3 web devient P1 natif).
5. **CI signing** : GitHub Actions (ios: macos runner + secrets App Store Connect ;
   android: keystore en secret) → artifacts .ipa/.aab.
6. **Soumission** : fiches App Store / Play (captures déjà générées dans
   `docs/screenshots/`), privacy nutrition labels (données : compte + contenu
   utilisateur, rien d'autre), test Flight / internal testing puis review.
7. **Critères de fin de phase** : install réel depuis Test Flight + Play internal,
   parcours complet offline/online, push reçu device réel, crash-free ≥ 99,5 %.

## 5. Garde-fous

- Ne PAS annoncer « disponible sur l'App Store » avant approbation effective.
- La PWA reste le canal principal tant que les stores ne sont pas validés.
- Chaque étape ci-dessus aura ses tests (API Bearer : node:test ; natif : E2E
  Maestro/Detox sur émulateur) avant merge.
