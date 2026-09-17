/**
 * Schéma de base de données Charbon (SQLite via libSQL + Drizzle ORM).
 * Source de vérité : ce fichier ; les migrations SQL sont générées
 * (drizzle-kit generate) et committées dans apps/api/drizzle/.
 *
 * Conventions :
 * - Clés primaires : TEXT UUID v4 (crypto.randomUUID).
 * - Instants : TEXT ISO-8601 UTC.
 * - Dates civiles (validations d'habitudes, etc.) : TEXT 'YYYY-MM-DD'
 *   dans le fuseau de l'utilisateur (voir packages/shared/src/time.ts).
 * - Isolation : TOUTES les tables enfants portent user_id (redondance
 *   volontaire pour requêter/indexer sans jointures) + FK en cascade.
 * - Suppressions : soft delete (deletedAt) pour tâches/habitudes/routines
 *   (annulation possible, historique préservé) ; hard delete en cascade
 *   pour la suppression de compte.
 */
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  remindersEnabled: integer('reminders_enabled', { mode: 'boolean' }).notNull().default(false),
  dailyReminderTime: text('daily_reminder_time').notNull().default('20:00'),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
    expiresAt: text('expires_at').notNull(),
    lastSeenAt: text('last_seen_at').notNull(),
    userAgent: text('user_agent'),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    id: text('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    usedAt: text('used_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('password_reset_user_idx').on(t.userId)],
);

export const goals = sqliteTable(
  'goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    targetDate: text('target_date'), // ISODate ou null
    status: text('status', { enum: ['active', 'completed', 'archived'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('goals_user_status_idx').on(t.userId, t.status)],
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    notes: text('notes'),
    dueAt: text('due_at'), // ISODateTime ou null
    status: text('status', { enum: ['pending', 'done'] }).notNull().default('pending'),
    completedAt: text('completed_at'),
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('tasks_user_deleted_idx').on(t.userId, t.deletedAt),
    index('tasks_user_due_idx').on(t.userId, t.dueAt),
    index('tasks_user_status_idx').on(t.userId, t.status),
  ],
);

export const habits = sqliteTable(
  'habits',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#F97316'),
    scheduleType: text('schedule_type', { enum: ['daily', 'days_of_week'] })
      .notNull()
      .default('daily'),
    /** JSON array de jours (0=dim..6=sam) — utilisé si scheduleType = days_of_week. */
    scheduleDays: text('schedule_days').notNull().default('[]'),
    startDate: text('start_date').notNull(), // ISODate (fuseau utilisateur)
    pausedAt: text('paused_at'), // ISODateTime de la suspension en cours, null sinon
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('habits_user_deleted_idx').on(t.userId, t.deletedAt)],
);

export const habitPauses = sqliteTable(
  'habit_pauses',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fromDate: text('from_date').notNull(), // ISODate incluse
    toDate: text('to_date'), // ISODate exclue, null = suspension en cours
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('habit_pauses_habit_idx').on(t.habitId)],
);

export const habitCompletions = sqliteTable(
  'habit_completions',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // ISODate (fuseau utilisateur)
    note: text('note'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('habit_completions_unique').on(t.habitId, t.date),
    index('habit_completions_user_date_idx').on(t.userId, t.date),
  ],
);

export const routines = sqliteTable(
  'routines',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    timeOfDay: text('time_of_day', { enum: ['morning', 'midday', 'evening', 'custom'] })
      .notNull()
      .default('custom'),
    scheduledTime: text('scheduled_time'), // 'HH:MM' ou null
    scheduleType: text('schedule_type', { enum: ['daily', 'days_of_week'] })
      .notNull()
      .default('daily'),
    scheduleDays: text('schedule_days').notNull().default('[]'),
    startDate: text('start_date').notNull(), // ISODate
    color: text('color').notNull().default('#38BDF8'),
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('routines_user_deleted_idx').on(t.userId, t.deletedAt)],
);

export const routineItems = sqliteTable(
  'routine_items',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    durationMinutes: integer('duration_minutes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('routine_items_routine_idx').on(t.routineId, t.sortOrder)],
);

export const routineItemCompletions = sqliteTable(
  'routine_item_completions',
  {
    id: text('id').primaryKey(),
    itemId: text('item_id')
      .notNull()
      .references(() => routineItems.id, { onDelete: 'cascade' }),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // ISODate
    completedAt: text('completed_at').notNull(),
  },
  (t) => [
    uniqueIndex('routine_item_completions_unique').on(t.itemId, t.date),
    index('routine_item_completions_user_date_idx').on(t.userId, t.date),
  ],
);

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: text('plan', { enum: ['free', 'premium'] }).notNull().default('free'),
    status: text('status', { enum: ['active', 'canceled', 'past_due'] })
      .notNull()
      .default('active'),
    provider: text('provider', { enum: ['none', 'dev', 'stripe'] }).notNull().default('none'),
    providerCustomerId: text('provider_customer_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    currentPeriodEnd: text('current_period_end'),
    cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('subscriptions_user_idx').on(t.userId)],
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'daily_reminder' | 'system' | ...
    title: text('title').notNull(),
    body: text('body'),
    data: text('data'), // JSON éventuel
    readAt: text('read_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
);

/**
 * Outbox e-mails — utilisé UNIQUEMENT quand aucun SMTP n'est configuré (dev).
 * Permet de tester réellement le flux « mot de passe oublié » sans service externe.
 * La route de lecture est désactivée en production.
 */
export const devOutboxEmails = sqliteTable(
  'dev_outbox_emails',
  {
    id: text('id').primaryKey(),
    toAddress: text('to_address').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('dev_outbox_to_idx').on(t.toAddress)],
);

/** Messages du formulaire de contact du site vitrine. */
export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = {
  users,
  sessions,
  passwordResetTokens,
  goals,
  tasks,
  habits,
  habitPauses,
  habitCompletions,
  routines,
  routineItems,
  routineItemCompletions,
  subscriptions,
  notifications,
  devOutboxEmails,
  contactMessages,
};

/** helper SQL réutilisable (ex. défauts) */
export const nowSql = sql`CURRENT_TIMESTAMP`;
