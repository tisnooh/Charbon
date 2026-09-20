/**
 * CHARBON — schéma du contenu éditorial.
 * Tous les textes du site vivent dans content/fr.ts et content/en.ts.
 * Aucun texte n'est codé en dur dans les composants.
 */

export interface NavLink {
  id: string;
  label: string;
}

export interface StepCopy {
  num: string;
  title: string;
  text: string;
  quote?: string;
  items?: string[];
  cta?: string;
}

export interface ProofStateCopy {
  id: 'planned' | 'held' | 'proven' | 'pending';
  title: string;
  text: string;
}

export interface PricingPlanCopy {
  name: string;
  price: string;
  priceAlt?: string;
  baseline: string;
  features: string[];
  cta: string;
}

export interface FaqItemCopy {
  q: string;
  a: string;
}

export interface CookieCopy {
  text: string;
  accept: string;
  refuse: string;
  link: string;
}

export interface LegalBlock {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalPageCopy {
  title: string;
  updated: string;
  intro: string[];
  blocks: LegalBlock[];
}

export interface AppScreenCopy {
  today: {
    greeting: string;
    date: string;
    coach: string;
    scoreLabel: string;
    score: number;
    delta: string;
    insight: string;
    streak: string;
    engagementsCount: string;
    cta: string;
    tabs: [string, string, string];
    engagements: Array<{ time: string; title: string; priority: string; status: string; state: 'verified' | 'held' | 'pending' }>;
  };
  onboarding: {
    step: string;
    quote: string;
    objectiveLabel: string;
    objective: string;
    edit: string;
    commitmentsLabel: string;
    commitmentsSub: string;
    commitments: Array<{ title: string; duration: string; priority: string }>;
    note: string;
    cta: string;
  };
  coach: {
    label: string;
    title: string;
    questions: string[];
    paragraph: string;
    proposalLabel: string;
    proposal: string;
    accept: string;
    reject: string;
    placeholder: string;
  };
  analysis: {
    label: string;
    title: string;
    rows: Array<{ title: string; sub: string; state: 'verified' | 'held' | 'missed' }>;
    paragraph: string;
    adjustLabel: string;
    adjust1: string;
    adjust2: string;
    cta: string;
    share: string;
  };
  focus: {
    label: string;
    elapsed: string;
    total: string;
    task: string;
    priority: string;
    pause: string;
    finish: string;
    quit: string;
    proofNote: string;
  };
  profile: {
    label: string;
    name: string;
    scoreLabel: string;
    score: number;
    cta: string;
    stats: Array<{ label: string; value: string }>;
  };
}

export interface Content {
  meta: {
    locale: string;
    title: string;
    description: string;
    siteName: string;
  };
  header: { nav: NavLink[]; cta: string };
  hero: {
    label: string;
    titleLines: string[];
    titleAccent: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    underCta: string;
    mockupNote: string;
  };
  problem: {
    label: string;
    title: string[];
    accent: string[];
    body: string[];
  };
  score: {
    label: string;
    title: string;
    value: number;
    delta: string;
    caption: string;
    body: string;
    dailyTitle: string;
    dailyText: string;
    disciplineTitle: string;
    disciplineText: string;
    headline: string;
    subheadline: string;
    streak: string;
    held: string;
    illustrative: string;
  };
  how: {
    label: string;
    title: string;
    description: string[];
    steps: StepCopy[];
  };
  proof: {
    label: string;
    title: string[];
    states: ProofStateCopy[];
    body: string;
    signature: string;
  };
  ai: {
    label: string;
    title: string[];
    subtitle: string[];
    features: string[];
  };
  focus: {
    label: string;
    title: string[];
    lines: string[];
    note: string;
  };
  progress: {
    label: string;
    title: string;
    scoreLabel: string;
    score: number;
    delta: string;
    stats: Array<{ label: string; value: string }>;
    chartLabel: string;
    illustrative: string;
    chart: number[];
  };
  profile: {
    label: string;
    title: string[];
    text: string;
    disclaimer: string;
  };
  differentiation: {
    title: string;
    items: Array<{ name: string; text: string; highlight?: boolean }>;
    chain: string[];
  };
  pricing: {
    label: string;
    title: string;
    free: PricingPlanCopy;
    pro: PricingPlanCopy;
    note: string;
  };
  extensions: {
    label: string;
    title: string;
    items: string[];
    note: string;
  };
  privacy: {
    label: string;
    title: string;
    body: string;
    points: string[];
  };
  faq: {
    label: string;
    title: string;
    items: FaqItemCopy[];
  };
  finalCta: {
    label: string;
    title: string[];
    sub: string[];
    cta: string;
    under: string;
  };
  footer: {
    tagline: string;
    columns: Array<{ title: string; links: Array<{ label: string; href: string; anchor?: boolean }> }>;
    copyright: string;
    illustrative: string;
    status: string;
  };
  waitlist: {
    title: string;
    text: string;
    fieldLabel: string;
    placeholder: string;
    cta: string;
    loading: string;
    successTitle: string;
    successText: string;
    close: string;
    errors: Record<'empty' | 'invalid_email' | 'duplicate' | 'rate_limited' | 'backend_unavailable' | 'unexpected', string>;
    legalNote: string;
  };
  download: {
    label: string;
    title: string;
    text: string;
    cta: string;
    note: string;
    statuses: Array<{ label: string; note: string; current: boolean }>;
  };
  cookie: CookieCopy;
  notFound: {
    code: string;
    title: string;
    text: string;
    cta: string;
  };
  support: {
    label: string;
    title: string;
    intro: string;
    before: { title: string; items: string[] };
    topics: Array<{ title: string; text: string }>;
    contactTitle: string;
    contactText: string;
    emailPlaceholder: string;
    responseNote: string;
  };
  legal: {
    mentions: LegalPageCopy;
    privacy: LegalPageCopy;
    terms: LegalPageCopy;
  };
  app: AppScreenCopy;
}
