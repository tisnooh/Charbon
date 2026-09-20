import type { Content } from '@/types/content';

/**
 * CHARBON — contenu éditorial français (source unique de vérité).
 * Aucun texte de marketing n'est codé en dur dans les composants.
 */
export const fr: Content = {
  meta: {
    locale: 'fr',
    title: 'Charbon — Construis ta discipline',
    description:
      "Charbon transforme tes objectifs en engagements quotidiens, mesure ta constance avec le Discipline Score et utilise l'IA pour t'aider à progresser.",
    siteName: 'Charbon',
  },
  header: {
    nav: [
      { id: 'fonctionnement', label: 'Fonctionnement' },
      { id: 'score', label: 'Discipline Score' },
      { id: 'ia', label: 'IA' },
      { id: 'pro', label: 'Pro' },
      { id: 'faq', label: 'FAQ' },
    ],
    cta: 'Rejoindre la bêta',
  },
  hero: {
    label: 'CHARBON',
    titleLines: ['Tu as dit que', 'tu le ferais.'],
    titleAccent: 'Prouve-le.',
    subtitle:
      "Charbon transforme tes objectifs en engagements quotidiens, mesure ta constance et adapte ton programme grâce à l'IA.",
    ctaPrimary: 'Rejoindre la bêta',
    ctaSecondary: 'Voir comment ça marche',
    underCta: 'iOS · Android · Gratuit pour commencer',
    mockupNote: 'Aperçu de l’application Charbon — données illustratives.',
  },
  problem: {
    label: '01 — Le problème',
    title: ['Le problème n’est pas', 'de savoir quoi faire.'],
    accent: ['C’est de le faire.', 'Encore.', 'Et encore.'],
    body: [
      'Les objectifs sont faciles à écrire.',
      'La constance est beaucoup plus difficile.',
      'Charbon transforme les intentions en engagements mesurables.',
    ],
  },
  score: {
    label: '02 — La mesure',
    title: 'Ta discipline devient mesurable.',
    value: 84,
    delta: '+6 ce mois',
    caption: 'SCORE DE DISCIPLINE',
    body: 'Ton Discipline Score évolue selon ta constance, tes engagements tenus, les preuves apportées, ton Focus et ta régularité dans le temps.',
    dailyTitle: 'Daily Score',
    dailyText: 'Ta performance de la journée.',
    disciplineTitle: 'Discipline Score',
    disciplineText: 'Ta constance sur la durée.',
    headline: 'Une bonne journée ne suffit pas.',
    subheadline: 'Charbon récompense la constance.',
    streak: '17 jours de série',
    held: '87 % d’engagements tenus',
    illustrative: 'Données illustratives.',
  },
  how: {
    label: '03 — Le fonctionnement',
    title: 'De l’objectif à l’exécution.',
    description: [
      'Pas de liste infinie.',
      'Un objectif reformulé.',
      'Trois engagements calibrés.',
      'Une journée qui commence.',
    ],
    steps: [
      {
        num: '01',
        title: 'Tu écris ton objectif',
        text: 'Une phrase, dans tes mots. Sans structure imposée.',
        quote: '« Je veux développer mon agence web »',
      },
      {
        num: '02',
        title: 'Charbon reformule ton objectif',
        text: 'L’IA le transforme en objectif clair, mesurable, daté.',
        quote: '« Obtenir 3 clients payants pour ton agence dans les 30 prochains jours. »',
      },
      {
        num: '03',
        title: 'L’IA génère 3 engagements',
        text: 'Trois maximum, calibrés sur ton temps disponible. Pas dix.',
        items: [
          'Contacter 20 prospects — 1 h — Critique',
          'Deep work 90 min sur l’offre — 1 h 30 — Élevé',
          'Améliorer ton portfolio — 30 min — Moyen',
        ],
      },
      {
        num: '04',
        title: 'Tu commences ta journée',
        text: 'Ton programme du jour est prêt. À toi de le tenir.',
        cta: 'Commencer le jour 1',
      },
    ],
  },
  proof: {
    label: '04 — La preuve',
    title: ['Ce n’est pas une liste.', 'C’est une ligne de preuve.'],
    states: [
      { id: 'planned', title: 'Engagement planifié', text: 'Ce que tu avais prévu.' },
      { id: 'held', title: 'Engagement tenu', text: 'Ce que tu déclares avoir fait.' },
      { id: 'proven', title: 'Engagement prouvé', text: 'Ce que tu peux réellement prouver.' },
      { id: 'pending', title: 'En attente', text: 'Ce qui n’est pas encore fait.' },
    ],
    body: 'Charbon distingue ce que tu avais prévu, ce que tu as tenu et ce que tu peux réellement prouver.',
    signature: 'BUILD PROOF THAT YOU CAN TRUST YOURSELF.',
  },
  ai: {
    label: '05 — L’intelligence',
    title: ['Une IA qui apprend', 'comment tu fonctionnes.'],
    subtitle: [
      'Pas un chatbot de plus.',
      'Le Coach et l’Analyse du jour travaillent en arrière-plan sur tes données réelles.',
    ],
    features: [
      'Reformule tes objectifs',
      'Construit tes engagements',
      'Analyse tes performances',
      'Identifie tes schémas',
      'Adapte tes horaires',
      'Ajuste ta charge',
      'Explique l’évolution du Score',
    ],
  },
  focus: {
    label: '06 — L’exécution',
    title: ['Quand c’est l’heure,', 'tu fais le travail.'],
    lines: ['Moins d’organisation.', 'Plus d’exécution.'],
    note: 'Une session Focus peut servir de preuve liée à ton engagement.',
  },
  progress: {
    label: '07 — La progression',
    title: 'Regarde ta constance évoluer.',
    scoreLabel: 'SCORE DE DISCIPLINE',
    score: 84,
    delta: '+6 ce mois',
    stats: [
      { label: 'Série en cours', value: '17 jours de série' },
      { label: 'Engagements tenus', value: '87 %' },
      { label: 'Focus cumulé', value: '73 h' },
      { label: 'Jours actifs', value: '28 / 30' },
    ],
    chartLabel: '30 derniers jours',
    illustrative: 'Données illustratives.',
    chart: [42, 55, 48, 61, 58, 66, 70, 64, 72, 69, 75, 78, 74, 80, 77, 82, 79, 84, 81, 85, 83, 86, 84, 88, 85, 87, 86, 84, 87, 84],
  },
  profile: {
    label: '08 — Ton profil',
    title: ['Ta carte d’identité', 'de discipline.'],
    text: 'Ton profil rassemble les preuves de ta constance dans le temps.',
    disclaimer: 'Le Discipline Score est un outil personnel de mesure. Ce n’est pas une certification officielle.',
  },
  differentiation: {
    title: 'Pas une todo-list de plus.',
    items: [
      { name: 'Un planner', text: 'organise ton temps.' },
      { name: 'Un habit tracker', text: 'te permet de cocher.' },
      { name: 'Charbon', text: 'mesure si tu tiens réellement tes engagements.', highlight: true },
    ],
    chain: ['Objectif', 'Engagement', 'Exécution', 'Preuve', 'Score', 'Progression'],
  },
  pricing: {
    label: '09 — L’offre',
    title: 'Gratuit pour commencer.',
    free: {
      name: 'Charbon Free',
      price: '0 €',
      baseline: 'L’essentiel pour construire ta constance.',
      features: [
        'Discipline Score',
        'Daily Score',
        'Streak',
        '1 objectif actif',
        'Jusqu’à 3 engagements / jour',
        'Check-in',
        'Focus basique',
        'Historique court',
        'Partage du Score',
      ],
      cta: 'Commencer gratuitement',
    },
    pro: {
      name: 'Charbon Pro',
      price: '9,99 € / mois',
      priceAlt: '79,99 € / an',
      baseline: 'Le Coach IA avancé et tout ton historique.',
      features: [
        'Tout Charbon Free',
        'Coach IA avancé',
        'Plusieurs objectifs',
        'Analyses avancées',
        'Historique complet',
        'Adaptation IA',
        'Rapports hebdomadaires',
        'Statistiques détaillées',
        'Fonctions premium',
      ],
      cta: 'Découvrir Charbon Pro',
    },
    note: 'Charbon est en préparation. Aucun paiement n’est demandé avant l’ouverture de la bêta.',
  },
  extensions: {
    label: 'À venir',
    title: 'Charbon évolue avec toi.',
    items: [
      'Focus Guard',
      'Intégrations avancées',
      'Statistiques longue période',
      'Challenges premium',
      'Accountability avancée',
    ],
    note: 'Ces extensions sont en réflexion. Rien n’est annoncé avant d’être prêt.',
  },
  privacy: {
    label: '10 — La confidentialité',
    title: 'Tes engagements restent les tiens.',
    body: 'Charbon est construit sur un principe simple : tes données t’appartiennent. Elles servent à te mesurer, pas à te profiler.',
    points: [
      'Objectifs privés par défaut',
      'Preuves privées',
      'Aucun partage automatique',
      'Suppression des preuves',
      'Contrôle des données',
      'Suppression du compte',
    ],
  },
  faq: {
    label: '11 — Questions',
    title: 'Questions fréquentes.',
    items: [
      {
        q: 'Charbon est-il une todo-list ?',
        a: 'Non. Une todo-list organise des tâches. Charbon mesure si tu tiens les engagements que tu prends envers toi-même : preuves, constance, Discipline Score et un programme qui s’adapte à ton comportement réel.',
      },
      {
        q: 'Comment fonctionne le Discipline Score ?',
        a: 'Sur 100. Il évolue selon ta constance : engagements tenus, preuves apportées, sessions Focus, régularité dans le temps. Une bonne journée ne suffit pas : c’est la répétition qui fait monter le score.',
      },
      {
        q: 'Comment fonctionne l’IA ?',
        a: 'Le Coach travaille sur tes données réelles : il reformule tes objectifs, calibre tes engagements, analyse tes journées et propose des ajustements d’horaires ou de charge. Chaque proposition s’accepte ou se refuse : tu gardes le contrôle.',
      },
      {
        q: 'Charbon est-il gratuit ?',
        a: 'Oui. Charbon Free inclut le Discipline Score, le Daily Score, un objectif actif et jusqu’à 3 engagements par jour. Charbon Pro (9,99 € / mois ou 79,99 € / an) ajoute le Coach IA avancé, plusieurs objectifs et des analyses complètes.',
      },
      {
        q: 'Mes preuves sont-elles privées ?',
        a: 'Oui. Tes objectifs, tes preuves et ton score sont privés par défaut. Rien n’est partagé sans ton action explicite. Tu peux supprimer tes preuves ou ton compte à tout moment.',
      },
      {
        q: 'Charbon est-il disponible sur iPhone et Android ?',
        a: 'Charbon est actuellement en préparation / bêta. L’app n’est pas encore publique sur l’App Store ni sur Google Play. Rejoins la bêta pour être prévenu des premiers accès.',
      },
    ],
  },
  finalCta: {
    label: 'CHARBON',
    title: ['Arrête de négocier', 'avec toi-même.'],
    sub: ['Prends un engagement.', 'Tiens-le.', 'Construis ta discipline.'],
    cta: 'Rejoindre la bêta',
    under: 'Gratuit pour commencer.',
  },
  footer: {
    tagline: 'Construis des preuves. Pas des intentions.',
    columns: [
      {
        title: 'Produit',
        links: [
          { label: 'Fonctionnement', href: '#fonctionnement', anchor: true },
          { label: 'Discipline Score', href: '#score', anchor: true },
          { label: 'IA', href: '#ia', anchor: true },
          { label: 'Pro', href: '#pro', anchor: true },
        ],
      },
      {
        title: 'Application',
        links: [
          { label: 'Focus', href: '#focus', anchor: true },
          { label: 'Progression', href: '#progression', anchor: true },
          { label: 'Profil', href: '#profil', anchor: true },
        ],
      },
      {
        title: 'Légal',
        links: [
          { label: 'Confidentialité', href: '/confidentialite' },
          { label: 'Conditions', href: '/conditions' },
          { label: 'Mentions légales', href: '/mentions-legales' },
          { label: 'Support', href: '/support' },
        ],
      },
    ],
    copyright: '© Charbon {year}',
    illustrative: 'Les scores et statistiques présentés sur ce site sont illustratifs.',
    status: 'Application en préparation — bêta privée en cours d’ouverture.',
  },
  waitlist: {
    title: 'Rejoins la bêta Charbon',
    text: 'Sois parmi les premiers à tester Charbon. Nous t’écrirons uniquement lorsque l’accès sera disponible.',
    fieldLabel: 'Email',
    placeholder: 'ton@email.com',
    cta: 'Rejoindre la liste',
    loading: 'Envoi…',
    successTitle: 'Tu es sur la liste.',
    successText: 'On te préviendra lorsque Charbon ouvrira ses premiers accès.',
    close: 'Fermer',
    errors: {
      empty: 'Indique ton adresse email.',
      invalid_email: 'Cette adresse email ne semble pas valide.',
      duplicate: 'Tu es déjà sur la liste.',
      rate_limited: 'Trop de tentatives. Réessaie dans quelques minutes.',
      backend_unavailable: 'Le service est momentanément indisponible. Réessaie dans un instant.',
      unexpected: 'Quelque chose s’est mal passé. Réessaie dans un instant.',
    },
    legalNote: 'Un email uniquement, quand l’accès ouvre. Rien d’autre.',
  },
  cookie: {
    text: 'Nous utilisons uniquement des cookies strictement nécessaires et, si tu l’acceptes, une mesure d’audience anonymisée. Aucun cookie publicitaire.',
    accept: 'Accepter',
    refuse: 'Refuser',
    link: 'En savoir plus',
  },
  download: {
    label: 'Télécharger',
    title: 'Charbon arrive bientôt.',
    text: 'L’app n’est pas encore publique sur l’App Store ni sur Google Play. Rejoins la bêta pour être prévenu des premiers accès.',
    cta: 'Rejoindre la bêta',
    note: 'Aucun lien de téléchargement n’est disponible pour le moment.',
    statuses: [
      { label: 'Site officiel', note: 'en ligne', current: true },
      { label: 'Bêta privée Charbon', note: 'ouverture progressive', current: true },
      { label: 'App Store & Google Play', note: 'à venir', current: false },
    ],
  },
  notFound: {
    code: '404',
    title: 'Cette page n’existe pas.',
    text: 'Elle a été déplacée, ou elle n’a jamais existé. Comme un engagement non tenu.',
    cta: 'Retour à l’accueil',
  },
  support: {
    label: 'Support',
    title: 'Charbon Support',
    intro: 'Charbon est en préparation. Si tu es en bêta et que quelque chose bloque, écris-nous : chaque message est lu.',
    topics: [
      { title: 'Problème d’accès', text: 'Invitation bêta, code d’accès, connexion impossible.' },
      { title: 'Compte', text: 'Adresse email, changement d’appareil, suppression du compte.' },
      { title: 'Discipline Score', text: 'Comprendre un calcul, une baisse de score, une série interrompue.' },
      { title: 'Paiement / Pro', text: 'Abonnement, facturation, annulation.' },
      { title: 'Données / confidentialité', text: 'Accès à tes données, suppression des preuves, export.' },
      { title: 'Autre', text: 'Tout le reste. Vraiment.' },
    ],
    before: {
      title: 'Avant d’écrire',
      items: [
        'Vérifie le statut de la bêta : les accès ouvrent par vagues.',
        'Consulte la FAQ : la réponse s’y trouve peut-être déjà.',
        'Indique l’email utilisé pour la bêta, et quelques captures si possible.',
      ],
    },
    contactTitle: 'Nous écrire',
    contactText: 'Décris ton problème en quelques lignes, avec l’email utilisé pour la bêta.',
    emailPlaceholder: '[EMAIL SUPPORT À RENSEIGNER]',
    responseNote: 'Nous répondons dès que possible, dans l’ordre d’arrivée.',
  },
  legal: {
    mentions: {
      title: 'Mentions légales',
      updated: 'Dernière mise à jour : [DATE À RENSEIGNER]',
      intro: [
        'Ce site est le site officiel de Charbon, application mobile de discipline, accountability et exécution assistée par IA.',
        'Les informations légales ci-dessous seront complétées dès l’immatriculation de la structure éditrice.',
      ],
      blocks: [
        {
          heading: 'Éditeur du site',
          paragraphs: [
            'Raison sociale : [RAISON SOCIALE À RENSEIGNER]',
            'Forme juridique et capital : [FORME JURIDIQUE ET CAPITAL À RENSEIGNER]',
            'Siège social : [ADRESSE À RENSEIGNER]',
            'Directeur de la publication : [NOM DU DIRECTEUR DE LA PUBLICATION À RENSEIGNER]',
            'Contact : [EMAIL SUPPORT À RENSEIGNER]',
          ],
        },
        {
          heading: 'Hébergement',
          paragraphs: [
            'Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.',
            'Données d’hébergement de la waitlist : Supabase, [RÉGION À RENSEIGNER].',
          ],
        },
        {
          heading: 'Propriété intellectuelle',
          paragraphs: [
            'L’ensemble des contenus de ce site (textes, éléments graphiques, interface, marque Charbon) est protégé par le droit de la propriété intellectuelle.',
            'Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.',
          ],
        },
        {
          heading: 'Responsabilité',
          paragraphs: [
            'Charbon est un outil de mesure et d’accompagnement personnel. Les scores affichés dans l’application sont des indicateurs personnels : ils ne constituent ni une certification, ni un avis médical, financier ou juridique.',
            'Le site peut contenir des exemples illustratifs : ils ne représentent pas des résultats réels ou garantis.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Confidentialité',
      updated: 'Dernière mise à jour : [DATE À RENSEIGNER]',
      intro: [
        'Tes engagements restent les tiens. Cette page explique, sans jargon, quelles données sont traitées sur ce site et dans l’application, et pourquoi.',
      ],
      blocks: [
        {
          heading: 'Ce que nous collectons',
          bullets: [
            'Ton adresse email, lorsque tu rejoins la liste d’attente bêta.',
            'La provenance de ta visite (paramètres utm), pour comprendre quels canaux fonctionnent.',
            'Des mesures d’audience anonymisées (pages vues, profondeur de scroll), sans traceur publicitaire.',
          ],
        },
        {
          heading: 'Ce que nous ne faisons pas',
          bullets: [
            'Aucune vente de données.',
            'Aucun partage automatique de tes objectifs, preuves ou scores.',
            'Aucun traceur publicitaire tiers.',
          ],
        },
        {
          heading: 'Dans l’application',
          bullets: [
            'Objectifs privés par défaut.',
            'Preuves privées, supprimables à tout moment.',
            'Contrôle complet de tes données, jusqu’à la suppression du compte.',
          ],
        },
        {
          heading: 'Durées de conservation',
          paragraphs: [
            'Les adresses email de la liste d’attente sont conservées jusqu’au lancement, puis jusqu’à ta demande de suppression.',
            'Tu peux demander la suppression de tes données à tout moment : [EMAIL SUPPORT À RENSEIGNER].',
          ],
        },
        {
          heading: 'Cookies',
          paragraphs: [
            'Seuls des cookies strictement nécessaires au fonctionnement sont déposés sans ton accord.',
            'La mesure d’audience anonymisée et le souvenir de ton choix ne s’activent qu’après acceptation.',
            'Aucun cookie publicitaire, aucun traceur tiers.',
            'Durée de conservation de ton choix : 6 mois.',
          ],
        },
        {
          heading: 'Tes droits',
          paragraphs: [
            'Conformément au RGPD, tu disposes d’un droit d’accès, de rectification, d’effacement, de limitation et de portabilité de tes données.',
            'Responsable de traitement : [RAISON SOCIALE À RENSEIGNER], [ADRESSE À RENSEIGNER].',
          ],
        },
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      updated: 'Dernière mise à jour : [DATE À RENSEIGNER]',
      intro: [
        'Les présentes conditions régissent l’utilisation du site charbon et, le moment venu, de l’application Charbon.',
        'Charbon est actuellement en phase de préparation / bêta : certaines fonctionnalités décrites sur ce site ne sont pas encore publiques.',
      ],
      blocks: [
        {
          heading: 'Statut du service',
          paragraphs: [
            'L’inscription à la liste d’attente ne constitue ni un droit d’accès, ni un engagement de date de lancement.',
            'Les accès bêta sont ouverts progressivement, par vagues.',
          ],
        },
        {
          heading: 'Utilisation acceptable',
          bullets: [
            'Ne pas automatiser d’inscriptions ni contourner les protections anti-spam.',
            'Ne pas tenter d’accéder à des données d’autres utilisateurs.',
            'Ne pas utiliser la marque Charbon sans autorisation écrite.',
          ],
        },
        {
          heading: 'Compte et contenus',
          paragraphs: [
            'Tu restes propriétaire des contenus que tu saisies (objectifs, engagements, preuves).',
            'Tu peux supprimer tes preuves et ton compte à tout moment depuis l’application.',
          ],
        },
        {
          heading: 'Responsabilité',
          paragraphs: [
            'Charbon fournit des indicateurs personnels de constance. Ces indicateurs sont informatifs : ils ne constituent ni une certification, ni un conseil professionnel.',
            '[RAISON SOCIALE À RENSEIGNER] ne saurait être tenue responsable des décisions prises sur la base de ces indicateurs.',
          ],
        },
        {
          heading: 'Droit applicable',
          paragraphs: ['Les présentes conditions sont soumises au droit [PAYS À RENSEIGNER].'],
        },
      ],
    },
  },
  app: {
    today: {
      greeting: 'Bonjour, Samuel',
      date: 'Vendredi 21 août — Jour 18',
      coach: 'Coach',
      scoreLabel: 'Score de discipline',
      score: 84,
      delta: '+6 ce mois',
      insight: 'Tes engagements avant 18 h ont un meilleur taux de tenue.',
      streak: '11 jours de série',
      engagementsCount: '2/3 engagements',
      cta: 'Commencer',
      tabs: ['Aujourd’hui', 'Progrès', 'Profil'],
      engagements: [
        { time: '07:00', title: 'Salle de sport', priority: 'Élevé', status: 'Vérifiée · preuve jointe', state: 'verified' },
        { time: '09:30', title: 'Deep work 90 min : landing page', priority: 'Critique', status: 'Tenue', state: 'held' },
        { time: '14:00', title: 'Contacter 20 prospects', priority: 'Élevé', status: 'En attente', state: 'pending' },
      ],
    },
    onboarding: {
      step: 'Étape 5 / 5',
      quote: '« Je veux développer mon agence web »',
      objectiveLabel: 'Objectif 30 jours',
      objective: 'Obtenir 3 clients payants pour ton agence dans les 30 prochains jours',
      edit: 'Modifier',
      commitmentsLabel: 'Tes premiers engagements',
      commitmentsSub: 'Proposés par le Coach, calibrés sur ton temps disponible',
      commitments: [
        { title: 'Contacter 20 prospects', duration: '1 h', priority: 'Critique' },
        { title: 'Deep work 90 min sur l’offre', duration: '1 h 30', priority: 'Élevé' },
        { title: 'Améliorer ton portfolio', duration: '30 min', priority: 'Moyen' },
      ],
      note: 'Calibré pour 1–2 h par jour, du lundi au vendredi.',
      cta: 'Commencer le jour 1',
    },
    coach: {
      label: 'Coach',
      title: 'Ton programme, en contexte',
      questions: [
        'Pourquoi mon Score baisse ?',
        'Adapte ma journée',
        'Je n’ai qu’une heure aujourd’hui',
        'Que dois-je prioriser ?',
      ],
      paragraph:
        'Ton score est passé de 79 à 84 grâce à la régularité et à 6 priorités vérifiées cette semaine. Tes 2 derniers échecs concernent des créneaux après 20 h.',
      proposalLabel: 'Proposition',
      proposal: 'J’avance ton engagement critique à 16 h 30 demain.',
      accept: 'Accepter',
      reject: 'Refuser',
      placeholder: 'Pose ta question sur ton programme...',
    },
    analysis: {
      label: 'Analyse du jour',
      title: 'Journée terminée',
      rows: [
        { title: 'Deep work 90 min', sub: 'Vérifiée · session Focus 52 min', state: 'verified' },
        { title: 'Contacter 20 prospects', sub: 'Tenue · déclarée sans preuve', state: 'held' },
        { title: 'Gym 07:00', sub: 'Non tenue · programmée à 21 h', state: 'missed' },
      ],
      paragraph:
        '2 engagements sur 3 tenus. Tes deux derniers échecs portent sur des engagements programmés après 20 h, où ton taux de réussite est le plus faible.',
      adjustLabel: 'Ajustement de demain',
      adjust1: 'Ton engagement critique sera avancé à 16 h 30.',
      adjust2: 'Trop tôt pour conclure sur la charge à 3 engagements — tendance observée dans 6 jours.',
      cta: 'Voir demain',
      share: 'Partager le résultat',
    },
    focus: {
      label: 'Focus',
      elapsed: '52 min',
      total: '/ 90 min',
      task: 'Finaliser la landing page client',
      priority: 'Critique',
      pause: 'Pause',
      finish: 'Terminer',
      quit: 'Quitter',
      proofNote: 'Cette session sera liée comme preuve.',
    },
    profile: {
      label: 'Profil',
      name: 'Samuel',
      scoreLabel: 'Discipline Score',
      score: 91,
      cta: 'Partager mes résultats',
      stats: [
        { label: 'Série actuelle', value: '43 jours' },
        { label: 'Meilleure série', value: '51 jours' },
        { label: 'Engagements tenus', value: '87 %' },
        { label: 'Engagements avec preuve', value: '112' },
        { label: 'Focus', value: '73 h' },
        { label: 'Jours actifs', value: '28 / 30' },
      ],
    },
  },
};
