/**
 * Types des DTO échangés entre l'API et les clients (app mobile, site).
 * Ces interfaces décrivent les RÉPONSES réelles de l'API (voir apps/api/src/routes).
 */
import type { ISODate, ISODateTime } from './time.js';
import type { PlanId, StatsRange } from './plans.js';
import type { Schedule } from './schedule.js';

// --- Erreurs -----------------------------------------------------------------

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const API_ERROR_CODES = {
  validationError: 'validation_error',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  notFound: 'not_found',
  conflict: 'conflict',
  emailTaken: 'email_taken',
  premiumRequired: 'premium_required',
  paymentProviderNotConfigured: 'payment_provider_not_configured',
  invalidToken: 'invalid_token',
  rateLimited: 'rate_limited',
  internal: 'internal_error',
} as const;

// --- Utilisateur / session -----------------------------------------------------

export interface UserMe {
  id: string;
  email: string;
  name: string;
  timezone: string;
  remindersEnabled: boolean;
  dailyReminderTime: string;
  onboardingCompleted: boolean;
  createdAt: ISODateTime;
}

export interface SessionResponse {
  user: UserMe;
  plan: PlanId;
}

// --- Objectifs -------------------------------------------------------------------

export type GoalStatusDTO = 'active' | 'completed' | 'archived';

export interface GoalDTO {
  id: string;
  title: string;
  description: string | null;
  targetDate: ISODate | null;
  status: GoalStatusDTO;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// --- Tâches ------------------------------------------------------------------------

export interface TaskDTO {
  id: string;
  title: string;
  notes: string | null;
  goalId: string | null;
  dueAt: ISODateTime | null;
  status: 'pending' | 'done';
  completedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// --- Habitudes ----------------------------------------------------------------------

export interface HabitDTO {
  id: string;
  name: string;
  color: string;
  schedule: Schedule;
  startDate: ISODate;
  pausedAt: ISODateTime | null;
  goalId: string | null;
  currentStreak: number;
  longestStreak: number;
  doneToday: boolean;
  expectedToday: boolean;
  /** Aujourd'hui est attendu mais pas encore complété (streak en sursis). */
  atRiskToday: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface HabitHistoryDayDTO {
  date: ISODate;
  expected: boolean;
  completed: boolean;
  note: string | null;
}

export interface HabitDetailDTO {
  habit: HabitDTO;
  history: HabitHistoryDayDTO[];
  completionRate: number;
  paused: boolean;
}

// --- Routines --------------------------------------------------------------------------

export interface RoutineItemDTO {
  id: string;
  title: string;
  durationMinutes: number | null;
  sortOrder: number;
}

export interface RoutineDTO {
  id: string;
  name: string;
  timeOfDay: 'morning' | 'midday' | 'evening' | 'custom';
  scheduledTime: string | null;
  schedule: Schedule;
  items: RoutineItemDTO[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Routine enrichie de l'état du jour (écran Today / exécution de routine). */
export interface RoutineTodayDTO extends RoutineDTO {
  scheduledToday: boolean;
  itemsDoneToday: number;
  itemsTotal: number;
  doneToday: boolean;
  itemStates: Array<{ itemId: string; done: boolean }>;
}

// --- Dashboard « Today » ------------------------------------------------------------------

export interface TodayProgressDTO {
  expected: number;
  completed: number;
  rate: number;
}

export interface TodayDTO {
  /** Date civile côté serveur, dans le fuseau de l'utilisateur. */
  date: ISODate;
  progress: TodayProgressDTO;
  tasks: TaskDTO[];
  habits: HabitDTO[];
  routines: RoutineTodayDTO[];
  goals: GoalDTO[];
  streak: {
    /** Jours parfaits consécutifs (tout ce qui était attendu a été fait). */
    current: number;
    longest: number;
  };
  unreadNotifications: number;
}

// --- Statistiques ----------------------------------------------------------------------------

export interface DayStatDTO {
  date: ISODate;
  expected: number;
  completed: number;
  rate: number;
}

export interface StatsSummaryDTO {
  range: StatsRange;
  serverToday: ISODate;
  days: DayStatDTO[];
  totals: {
    expected: number;
    completed: number;
    rate: number;
  };
  /** Évolution de la régularité : moyenne(2e moitié) - moyenne(1re moitié), en points. */
  trendPoints: number;
  streak: {
    current: number;
    longest: number;
  };
}

// --- Notifications ------------------------------------------------------------------------------

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: ISODateTime | null;
  createdAt: ISODateTime;
}

// --- Abonnement -------------------------------------------------------------------------------------

export interface SubscriptionDTO {
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due';
  provider: 'none' | 'dev' | 'stripe';
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: ISODateTime | null;
  /** true si un simulateur de paiement dev est actif (DEV_BILLING + non-production). */
  billingDevMode: boolean;
  /** true si un prestataire de paiement réel est configuré (Stripe en production). */
  paymentConfigured: boolean;
}
