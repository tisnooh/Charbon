/**
 * Schémas de validation zod — utilisés CÔTÉ SERVEUR sur chaque entrée
 * (registre, login, bodies, queries) et côté client pour les formulaires.
 * Zod v4.
 */
import { z } from 'zod';
import { isValidTimeZone, parseISODate } from './time.js';

// --- Primitives communes ---------------------------------------------------

/** E-mail normalisé : trim + minuscules AVANT validation. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Adresse e-mail invalide' }));

/** Date civile 'YYYY-MM-DD', calendairement valide. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Format de date attendu : YYYY-MM-DD' })
  .refine((s) => parseISODate(s) !== null, { error: 'Date calendaire invalide' });

/** Heure 'HH:MM' (24 h). */
export const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  error: 'Heure attendue au format HH:MM (24 h)',
});

/** Fuseau IANA valide (ex. 'Europe/Paris'). */
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((tz) => isValidTimeZone(tz), { error: 'Fuseau horaire IANA invalide' });

/** Instant ISO-8601 (avec offset/Z). */
export const isoDateTimeSchema = z.iso.datetime({ offset: true, error: 'Instant ISO-8601 invalide' });

export const passwordSchema = z
  .string()
  .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères' })
  .max(72, { error: 'Le mot de passe doit contenir au plus 72 caractères' });

/** Couleur d'accent hexadécimale (#rrggbb). */
export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: 'Couleur attendue : #RRGGBB' });

// --- Planning (habitudes & routines) ----------------------------------------

export const scheduleSchema = z
  .object({
    type: z.enum(['daily', 'days_of_week']),
    days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  })
  .superRefine((s, ctx) => {
    if (s.type === 'days_of_week') {
      if (s.days.length < 1 || s.days.length > 7) {
        ctx.addIssue({ code: 'custom', message: 'days_of_week requiert entre 1 et 7 jours' });
      }
      if (new Set(s.days).size !== s.days.length) {
        ctx.addIssue({ code: 'custom', message: 'Jours de semaine en doublon' });
      }
    }
  });
export type ScheduleInput = z.infer<typeof scheduleSchema>;

// --- Auth --------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(1, { error: 'Le nom est requis' }).max(80),
  email: emailSchema,
  password: passwordSchema,
  timezone: timeZoneSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Mot de passe requis' }).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  password: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, { error: 'Confirmez votre mot de passe' }).max(200),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// --- Profil ------------------------------------------------------------------

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    timezone: timeZoneSchema.optional(),
    remindersEnabled: z.boolean().optional(),
    dailyReminderTime: hhmmSchema.optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { error: 'Aucun champ à mettre à jour' });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- Objectifs ----------------------------------------------------------------

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1, { error: 'Le titre est requis' }).max(120),
  description: z.string().trim().max(1000).nullish(),
  targetDate: isoDateSchema.nullish(),
});
export type GoalCreateInput = z.infer<typeof goalCreateSchema>;

export const goalUpdateSchema = goalCreateSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, { error: 'Aucun champ à mettre à jour' });
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;

export const goalStatusSchema = z.enum(['active', 'completed', 'archived']);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

// --- Tâches --------------------------------------------------------------------

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, { error: 'Le titre est requis' }).max(200),
  notes: z.string().trim().max(2000).nullish(),
  goalId: z.uuid().nullish(),
  dueAt: isoDateTimeSchema.nullish(),
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = taskCreateSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, { error: 'Aucun champ à mettre à jour' });
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// --- Habitudes ------------------------------------------------------------------

export const habitCreateSchema = z.object({
  name: z.string().trim().min(1, { error: 'Le nom est requis' }).max(80),
  color: colorSchema.optional(),
  schedule: scheduleSchema.optional(),
  goalId: z.uuid().nullish(),
  startDate: isoDateSchema.optional(),
});
export type HabitCreateInput = z.infer<typeof habitCreateSchema>;

export const habitUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    color: colorSchema.optional(),
    schedule: scheduleSchema.optional(),
    goalId: z.uuid().nullish(),
  })
  .refine((o) => Object.keys(o).length > 0, { error: 'Aucun champ à mettre à jour' });
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>;

export const habitCompleteSchema = z.object({
  /** Date civile de la validation ; défaut = aujourd'hui (fuseau utilisateur), côté serveur. */
  date: isoDateSchema.optional(),
  note: z.string().trim().max(200).nullish(),
});
export type HabitCompleteInput = z.infer<typeof habitCompleteSchema>;

// --- Routines ---------------------------------------------------------------------

export const routineItemSchema = z.object({
  title: z.string().trim().min(1, { error: 'Titre d’action requis' }).max(120),
  durationMinutes: z.number().int().min(1).max(600).nullish(),
});
export type RoutineItemInput = z.infer<typeof routineItemSchema>;

export const routineCreateSchema = z.object({
  name: z.string().trim().min(1, { error: 'Le nom est requis' }).max(80),
  timeOfDay: z.enum(['morning', 'midday', 'evening', 'custom']).optional(),
  scheduledTime: hhmmSchema.nullish(),
  schedule: scheduleSchema.optional(),
  items: z.array(routineItemSchema).max(30).optional(),
});
export type RoutineCreateInput = z.infer<typeof routineCreateSchema>;

export const routineUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    timeOfDay: z.enum(['morning', 'midday', 'evening', 'custom']).optional(),
    scheduledTime: hhmmSchema.nullish(),
    schedule: scheduleSchema.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { error: 'Aucun champ à mettre à jour' });
export type RoutineUpdateInput = z.infer<typeof routineUpdateSchema>;

export const routineItemUpdateSchema = routineItemSchema
  .partial()
  .extend({ sortOrder: z.number().int().min(0).max(1000).optional() })
  .refine((o) => Object.keys(o).length > 0, { error: 'Aucun champ à mettre à jour' });
export type RoutineItemUpdateInput = z.infer<typeof routineItemUpdateSchema>;

export const routineItemCompleteSchema = z.object({
  date: isoDateSchema.optional(),
});
export type RoutineItemCompleteInput = z.infer<typeof routineItemCompleteSchema>;

// --- Onboarding ---------------------------------------------------------------------

export const onboardingSchema = z.object({
  goals: z.array(goalCreateSchema).max(6).default([]),
  habits: z.array(habitCreateSchema).max(8).default([]),
  routines: z.array(routineCreateSchema).max(4).default([]),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// --- Stats / divers ----------------------------------------------------------------------

export const statsRangeSchema = z.enum(['today', '7d', '30d', '90d', '365d']);
export type StatsRangeInput = z.infer<typeof statsRangeSchema>;

export const habitHistoryQuerySchema = z.object({
  /** Nombre de jours d'historique demandé (borné par le plan côté serveur). */
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type HabitHistoryQueryInput = z.infer<typeof habitHistoryQuerySchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
  message: z.string().trim().min(1).max(3000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
