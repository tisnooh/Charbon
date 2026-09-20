import type { Content } from '@/types/content';

/**
 * CHARBON — English mirror of content/fr.ts.
 * Prepared for the future EN rollout. Not wired to routing yet (FR is default).
 */
export const en: Content = {
  meta: {
    locale: 'en',
    title: 'Charbon — Build your discipline',
    description:
      'Charbon turns your goals into daily commitments, measures your consistency with the Discipline Score, and uses AI to adapt your program.',
    siteName: 'Charbon',
  },
  header: {
    nav: [
      { id: 'fonctionnement', label: 'How it works' },
      { id: 'score', label: 'Discipline Score' },
      { id: 'ia', label: 'AI' },
      { id: 'pro', label: 'Pro' },
      { id: 'faq', label: 'FAQ' },
    ],
    cta: 'Join the beta',
  },
  hero: {
    label: 'CHARBON',
    titleLines: ['You said you', 'would do it.'],
    titleAccent: 'Prove it.',
    subtitle:
      'Charbon turns your goals into daily commitments, measures your consistency and adapts your program with AI.',
    ctaPrimary: 'Join the beta',
    ctaSecondary: 'See how it works',
    underCta: 'iOS · Android · Free to start',
    mockupNote: 'Charbon app preview — illustrative data.',
  },
  problem: {
    label: '01 — The problem',
    title: ['The problem is not', 'knowing what to do.'],
    accent: ['It is doing it.', 'Again.', 'And again.'],
    body: [
      'Goals are easy to write.',
      'Consistency is much harder.',
      'Charbon turns intentions into measurable commitments.',
    ],
  },
  score: {
    label: '02 — The measure',
    title: 'Your discipline becomes measurable.',
    value: 84,
    delta: '+6 this month',
    caption: 'DISCIPLINE SCORE',
    body: 'Your Discipline Score moves with your consistency: commitments kept, proofs provided, Focus sessions and regularity over time.',
    dailyTitle: 'Daily Score',
    dailyText: 'Your performance for the day.',
    disciplineTitle: 'Discipline Score',
    disciplineText: 'Your consistency over time.',
    headline: 'One good day is not enough.',
    subheadline: 'Charbon rewards consistency.',
    streak: '17-day streak',
    held: '87% commitments kept',
    illustrative: 'Illustrative data.',
  },
  how: {
    label: '03 — How it works',
    title: 'From goal to execution.',
    description: [
      'No endless list.',
      'One reframed goal.',
      'Three calibrated commitments.',
      'A day that starts.',
    ],
    steps: [
      {
        num: '01',
        title: 'You write your goal',
        text: 'One sentence, in your words. No forced structure.',
        quote: '"I want to grow my web agency"',
      },
      {
        num: '02',
        title: 'Charbon reframes your goal',
        text: 'The AI turns it into a clear, measurable, dated goal.',
        quote: '"Land 3 paying clients for your agency in the next 30 days."',
      },
      {
        num: '03',
        title: 'AI generates 3 commitments',
        text: 'Three max, calibrated to your available time. Not ten.',
        items: [
          'Contact 20 prospects — 1 h — Critical',
          '90-min deep work on the offer — 1 h 30 — High',
          'Improve your portfolio — 30 min — Medium',
        ],
      },
      {
        num: '04',
        title: 'You start your day',
        text: 'Your program is ready. Now keep it.',
        cta: 'Start day 1',
      },
    ],
  },
  proof: {
    label: '04 — The proof',
    title: ['This is not a list.', 'This is a proof line.'],
    states: [
      { id: 'planned', title: 'Planned commitment', text: 'What you meant to do.' },
      { id: 'held', title: 'Kept commitment', text: 'What you declare you did.' },
      { id: 'proven', title: 'Proven commitment', text: 'What you can actually prove.' },
      { id: 'pending', title: 'Pending', text: 'What is not done yet.' },
    ],
    body: 'Charbon separates what you planned, what you kept, and what you can actually prove.',
    signature: 'BUILD PROOF THAT YOU CAN TRUST YOURSELF.',
  },
  ai: {
    label: '05 — The intelligence',
    title: ['An AI that learns', 'how you operate.'],
    subtitle: [
      'Not just another chatbot.',
      'The Coach and the Daily Analysis work in the background on your real data.',
    ],
    features: [
      'Reframes your goals',
      'Builds your commitments',
      'Analyzes your performance',
      'Spots your patterns',
      'Adapts your schedule',
      'Adjusts your load',
      'Explains your Score',
    ],
  },
  focus: {
    label: '06 — Execution',
    title: ['When it is time,', 'you do the work.'],
    lines: ['Less organizing.', 'More executing.'],
    note: 'A Focus session can serve as proof tied to your commitment.',
  },
  progress: {
    label: '07 — Progress',
    title: 'Watch your consistency grow.',
    scoreLabel: 'DISCIPLINE SCORE',
    score: 84,
    delta: '+6 this month',
    stats: [
      { label: 'Current streak', value: '17-day streak' },
      { label: 'Commitments kept', value: '87%' },
      { label: 'Total Focus', value: '73 h' },
      { label: 'Active days', value: '28 / 30' },
    ],
    chartLabel: 'Last 30 days',
    illustrative: 'Illustrative data.',
    chart: [42, 55, 48, 61, 58, 66, 70, 64, 72, 69, 75, 78, 74, 80, 77, 82, 79, 84, 81, 85, 83, 86, 84, 88, 85, 87, 86, 84, 87, 84],
  },
  profile: {
    label: '08 — Your profile',
    title: ['Your discipline', 'identity card.'],
    text: 'Your profile gathers the proofs of your consistency over time.',
    disclaimer: 'The Discipline Score is a personal measurement tool. It is not an official certification.',
  },
  differentiation: {
    title: 'Not another to-do list.',
    items: [
      { name: 'A planner', text: 'organizes your time.' },
      { name: 'A habit tracker', text: 'lets you check boxes.' },
      { name: 'Charbon', text: 'measures whether you actually keep your commitments.', highlight: true },
    ],
    chain: ['Goal', 'Commitment', 'Execution', 'Proof', 'Score', 'Progress'],
  },
  pricing: {
    label: '09 — Pricing',
    title: 'Free to start.',
    free: {
      name: 'Charbon Free',
      price: '€0',
      baseline: 'The essentials to build your consistency.',
      features: [
        'Discipline Score',
        'Daily Score',
        'Streak',
        '1 active goal',
        'Up to 3 commitments / day',
        'Check-in',
        'Basic Focus',
        'Short history',
        'Score sharing',
      ],
      cta: 'Start for free',
    },
    pro: {
      name: 'Charbon Pro',
      price: '€9.99 / month',
      priceAlt: '€79.99 / year',
      baseline: 'The advanced AI Coach and your entire history.',
      features: [
        'Everything in Charbon Free',
        'Advanced AI Coach',
        'Multiple goals',
        'Advanced analysis',
        'Full history',
        'AI adaptation',
        'Weekly reports',
        'Detailed statistics',
        'Premium features',
      ],
      cta: 'Discover Charbon Pro',
    },
    note: 'Charbon is in preparation. No payment is requested before the beta opens.',
  },
  extensions: {
    label: 'Coming soon',
    title: 'Charbon grows with you.',
    items: [
      'Focus Guard',
      'Advanced integrations',
      'Long-term statistics',
      'Premium challenges',
      'Advanced accountability',
    ],
    note: 'These extensions are under consideration. Nothing is announced until it is ready.',
  },
  privacy: {
    label: '10 — Privacy',
    title: 'Your commitments stay yours.',
    body: 'Charbon is built on one principle: your data belongs to you. It serves your measurement, not profiling.',
    points: [
      'Goals private by default',
      'Proofs private',
      'No automatic sharing',
      'Proof deletion',
      'Data control',
      'Account deletion',
    ],
  },
  faq: {
    label: '11 — Questions',
    title: 'Frequently asked questions.',
    items: [
      {
        q: 'Is Charbon a to-do list?',
        a: 'No. A to-do list organizes tasks. Charbon measures whether you keep the commitments you make to yourself: proofs, consistency, a Discipline Score and a program that adapts to your real behavior.',
      },
      {
        q: 'How does the Discipline Score work?',
        a: 'Out of 100. It moves with your consistency: commitments kept, proofs provided, Focus sessions, regularity over time. One good day is not enough: repetition is what raises the score.',
      },
      {
        q: 'How does the AI work?',
        a: 'The Coach works on your real data: it reframes your goals, calibrates your commitments, analyzes your days and proposes schedule or load adjustments. Every proposal can be accepted or refused: you stay in control.',
      },
      {
        q: 'Is Charbon free?',
        a: 'Yes. Charbon Free includes the Discipline Score, the Daily Score, one active goal and up to 3 commitments per day. Charbon Pro (€9.99 / month or €79.99 / year) adds the advanced AI Coach, multiple goals and full analysis.',
      },
      {
        q: 'Are my proofs private?',
        a: 'Yes. Your goals, proofs and score are private by default. Nothing is shared without your explicit action. You can delete your proofs or your account at any time.',
      },
      {
        q: 'Is Charbon available on iPhone and Android?',
        a: 'Charbon is currently in preparation / beta. The app is not public on the App Store or Google Play yet. Join the beta to be notified of first access.',
      },
    ],
  },
  finalCta: {
    label: 'CHARBON',
    title: ['Stop negotiating', 'with yourself.'],
    sub: ['Make a commitment.', 'Keep it.', 'Build your discipline.'],
    cta: 'Join the beta',
    under: 'Free to start.',
  },
  footer: {
    tagline: 'Build proof. Not intentions.',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'How it works', href: '#fonctionnement', anchor: true },
          { label: 'Discipline Score', href: '#score', anchor: true },
          { label: 'AI', href: '#ia', anchor: true },
          { label: 'Pro', href: '#pro', anchor: true },
        ],
      },
      {
        title: 'Application',
        links: [
          { label: 'Focus', href: '#focus', anchor: true },
          { label: 'Progress', href: '#progression', anchor: true },
          { label: 'Profile', href: '#profil', anchor: true },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy', href: '/confidentialite' },
          { label: 'Terms', href: '/conditions' },
          { label: 'Legal notice', href: '/mentions-legales' },
          { label: 'Support', href: '/support' },
        ],
      },
    ],
    copyright: '© Charbon {year}',
    illustrative: 'Scores and statistics shown on this site are illustrative.',
    status: 'App in preparation — private beta opening progressively.',
  },
  waitlist: {
    title: 'Join the Charbon beta',
    text: 'Be among the first to test Charbon. We will email you only when access is available.',
    fieldLabel: 'Email',
    placeholder: 'you@email.com',
    cta: 'Join the list',
    loading: 'Sending…',
    successTitle: 'You are on the list.',
    successText: 'We will notify you when Charbon opens its first access.',
    close: 'Close',
    errors: {
      empty: 'Enter your email address.',
      invalid_email: 'This email address does not look valid.',
      duplicate: 'You are already on the list.',
      rate_limited: 'Too many attempts. Try again in a few minutes.',
      backend_unavailable: 'The service is temporarily unavailable. Please try again shortly.',
      unexpected: 'Something went wrong. Please try again shortly.',
    },
    legalNote: 'One email only, when access opens. Nothing else.',
  },
  cookie: {
    text: 'We only use strictly necessary cookies and, if you accept, anonymized audience measurement. No advertising cookies.',
    accept: 'Accept',
    refuse: 'Refuse',
    link: 'Learn more',
  },
  download: {
    label: 'Download',
    title: 'Charbon is coming soon.',
    text: 'The app is not public on the App Store or Google Play yet. Join the beta to be notified of first access.',
    cta: 'Join the beta',
    note: 'No download link is available for now.',
    statuses: [
      { label: 'Official website', note: 'online', current: true },
      { label: 'Charbon private beta', note: 'progressive opening', current: true },
      { label: 'App Store & Google Play', note: 'coming soon', current: false },
    ],
  },
  notFound: {
    code: '404',
    title: 'This page does not exist.',
    text: 'It moved, or it never existed. Like a commitment not kept.',
    cta: 'Back home',
  },
  support: {
    label: 'Support',
    title: 'Charbon Support',
    intro: 'Charbon is in preparation. If you are in the beta and something is blocking you, write to us: every message is read.',
    topics: [
      { title: 'Access issue', text: 'Beta invite, access code, unable to sign in.' },
      { title: 'Account', text: 'Email address, device change, account deletion.' },
      { title: 'Discipline Score', text: 'Understand a calculation, a score drop, a broken streak.' },
      { title: 'Payment / Pro', text: 'Subscription, billing, cancellation.' },
      { title: 'Data / privacy', text: 'Access your data, delete proofs, export.' },
      { title: 'Other', text: 'Everything else. Really.' },
    ],
    before: {
      title: 'Before writing',
      items: [
        'Check the beta status: access opens in waves.',
        'Read the FAQ: the answer may already be there.',
        'Include the email used for the beta, and a few screenshots if possible.',
      ],
    },
    contactTitle: 'Write to us',
    contactText: 'Describe your issue in a few lines, with the email used for the beta.',
    emailPlaceholder: '[SUPPORT EMAIL TO BE FILLED]',
    responseNote: 'We reply as soon as possible, in arrival order.',
  },
  legal: {
    mentions: {
      title: 'Legal notice',
      updated: 'Last updated: [DATE TO BE FILLED]',
      intro: [
        'This site is the official website of Charbon, a mobile app for discipline, accountability and AI-assisted execution.',
        'The legal information below will be completed as soon as the publishing entity is registered.',
      ],
      blocks: [
        {
          heading: 'Publisher',
          paragraphs: [
            'Company: [COMPANY NAME TO BE FILLED]',
            'Legal form and capital: [LEGAL FORM AND CAPITAL TO BE FILLED]',
            'Registered office: [ADDRESS TO BE FILLED]',
            'Publication director: [PUBLICATION DIRECTOR TO BE FILLED]',
            'Contact: [SUPPORT EMAIL TO BE FILLED]',
          ],
        },
        {
          heading: 'Hosting',
          paragraphs: [
            'This site is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.',
            'Waitlist data hosting: Supabase, [REGION TO BE FILLED].',
          ],
        },
        {
          heading: 'Intellectual property',
          paragraphs: [
            'All content on this site (texts, graphics, interface, Charbon brand) is protected by intellectual property law.',
            'Any reproduction or representation, in whole or in part, without prior written consent is prohibited.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'Charbon is a personal measurement and coaching tool. Scores displayed in the app are personal indicators: they are not a certification, nor medical, financial or legal advice.',
            'The site may contain illustrative examples: they do not represent real or guaranteed results.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy',
      updated: 'Last updated: [DATE TO BE FILLED]',
      intro: [
        'Your commitments stay yours. This page explains, without jargon, what data is processed on this site and in the app, and why.',
      ],
      blocks: [
        {
          heading: 'What we collect',
          bullets: [
            'Your email address, when you join the beta waitlist.',
            'Visit origin (utm parameters), to understand which channels work.',
            'Anonymized audience measurement (page views, scroll depth), with no advertising tracker.',
          ],
        },
        {
          heading: 'What we do not do',
          bullets: [
            'No data selling.',
            'No automatic sharing of your goals, proofs or scores.',
            'No third-party advertising trackers.',
          ],
        },
        {
          heading: 'In the app',
          bullets: [
            'Goals private by default.',
            'Proofs private, deletable at any time.',
            'Full control of your data, up to account deletion.',
          ],
        },
        {
          heading: 'Retention',
          paragraphs: [
            'Waitlist emails are kept until launch, then until you request deletion.',
            'You can request deletion at any time: [SUPPORT EMAIL TO BE FILLED].',
          ],
        },
        {
          heading: 'Cookies',
          paragraphs: [
            'Only strictly necessary cookies are set without your consent.',
            'Anonymized audience measurement and the memory of your choice activate only after acceptance.',
            'No advertising cookies, no third-party trackers.',
            'Your choice is stored for 6 months.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'Under GDPR, you have rights of access, rectification, erasure, restriction and portability over your data.',
            'Data controller: [COMPANY NAME TO BE FILLED], [ADDRESS TO BE FILLED].',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      updated: 'Last updated: [DATE TO BE FILLED]',
      intro: [
        'These terms govern the use of the Charbon website and, when available, the Charbon app.',
        'Charbon is currently in preparation / beta: some features described on this site are not public yet.',
      ],
      blocks: [
        {
          heading: 'Service status',
          paragraphs: [
            'Joining the waitlist grants no right of access and no commitment on a launch date.',
            'Beta access opens progressively, in waves.',
          ],
        },
        {
          heading: 'Acceptable use',
          bullets: [
            'Do not automate signups or bypass anti-spam protections.',
            'Do not attempt to access other users’ data.',
            'Do not use the Charbon brand without written authorization.',
          ],
        },
        {
          heading: 'Account and content',
          paragraphs: [
            'You remain the owner of the content you enter (goals, commitments, proofs).',
            'You can delete your proofs and your account at any time from the app.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'Charbon provides personal consistency indicators. They are informational: not a certification, not professional advice.',
            '[COMPANY NAME TO BE FILLED] cannot be held responsible for decisions taken on the basis of these indicators.',
          ],
        },
        {
          heading: 'Governing law',
          paragraphs: ['These terms are governed by the laws of [COUNTRY TO BE FILLED].'],
        },
      ],
    },
  },
  app: {
    today: {
      greeting: 'Hello, Samuel',
      date: 'Friday, Aug 21 — Day 18',
      coach: 'Coach',
      scoreLabel: 'Discipline Score',
      score: 84,
      delta: '+6 this month',
      insight: 'Commitments before 6 pm hold up better for you.',
      streak: '11-day streak',
      engagementsCount: '2/3 commitments',
      cta: 'Start',
      tabs: ['Today', 'Progress', 'Profile'],
      engagements: [
        { time: '07:00', title: 'Gym', priority: 'High', status: 'Verified · proof attached', state: 'verified' },
        { time: '09:30', title: 'Deep work 90 min: landing page', priority: 'Critical', status: 'Kept', state: 'held' },
        { time: '14:00', title: 'Contact 20 prospects', priority: 'High', status: 'Pending', state: 'pending' },
      ],
    },
    onboarding: {
      step: 'Step 5 / 5',
      quote: '"I want to grow my web agency"',
      objectiveLabel: '30-day goal',
      objective: 'Land 3 paying clients for your agency in the next 30 days',
      edit: 'Edit',
      commitmentsLabel: 'Your first commitments',
      commitmentsSub: 'Proposed by the Coach, calibrated to your available time',
      commitments: [
        { title: 'Contact 20 prospects', duration: '1 h', priority: 'Critical' },
        { title: '90-min deep work on the offer', duration: '1 h 30', priority: 'High' },
        { title: 'Improve your portfolio', duration: '30 min', priority: 'Medium' },
      ],
      note: 'Calibrated for 1–2 h per day, Monday to Friday.',
      cta: 'Start day 1',
    },
    coach: {
      label: 'Coach',
      title: 'Your program, in context',
      questions: [
        'Why is my Score dropping?',
        'Adapt my day',
        'I only have one hour today',
        'What should I prioritize?',
      ],
      paragraph:
        'Your score went from 79 to 84 thanks to regularity and 6 verified priorities this week. Your last 2 misses happened after 8 pm.',
      proposalLabel: 'Proposal',
      proposal: 'I moved your critical commitment to 4:30 pm tomorrow.',
      accept: 'Accept',
      reject: 'Refuse',
      placeholder: 'Ask about your program...',
    },
    analysis: {
      label: 'Daily analysis',
      title: 'Day completed',
      rows: [
        { title: 'Deep work 90 min', sub: 'Verified · Focus session 52 min', state: 'verified' },
        { title: 'Contact 20 prospects', sub: 'Kept · declared without proof', state: 'held' },
        { title: 'Gym 07:00', sub: 'Missed · scheduled at 9 pm', state: 'missed' },
      ],
      paragraph:
        '2 of 3 commitments kept. Your last two misses were commitments scheduled after 8 pm, where your success rate is lowest.',
      adjustLabel: 'Tomorrow’s adjustment',
      adjust1: 'Your critical commitment will be moved to 4:30 pm.',
      adjust2: 'Too early to conclude on the 3-commitment load — trend observed in 6 days.',
      cta: 'See tomorrow',
      share: 'Share the result',
    },
    focus: {
      label: 'Focus',
      elapsed: '52 min',
      total: '/ 90 min',
      task: 'Finalize the client landing page',
      priority: 'Critical',
      pause: 'Pause',
      finish: 'Finish',
      quit: 'Quit',
      proofNote: 'This session will be linked as proof.',
    },
    profile: {
      label: 'Profile',
      name: 'Samuel',
      scoreLabel: 'Discipline Score',
      score: 91,
      cta: 'Share my results',
      stats: [
        { label: 'Current streak', value: '43 days' },
        { label: 'Best streak', value: '51 days' },
        { label: 'Commitments kept', value: '87%' },
        { label: 'Commitments with proof', value: '112' },
        { label: 'Focus', value: '73 h' },
        { label: 'Active days', value: '28 / 30' },
      ],
    },
  },
};
