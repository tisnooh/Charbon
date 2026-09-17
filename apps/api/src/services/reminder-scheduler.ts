/**
 * Rappel quotidien in-app.
 *
 * Principe : un tick toutes les 30 s ; pour chaque utilisateur avec rappels
 * activés, si l'heure locale (son fuseau) correspond à dailyReminderTime et
 * qu'aucun rappel n'a encore été créé pour son jour local courant → création
 * d'une notification in-app avec le résumé du jour (restant à faire).
 *
 * C'est un ordonnanceur in-process (mono-instance). Le push APNs/FCM est une
 * extension documentée (nécessite des clés externes — BLOCAGE EXTERNE).
 */
import { and, desc, eq } from 'drizzle-orm';
import { dateInTz, hmInTz, type ISODate } from '@charbon/shared';
import type { Db } from '../db/client.js';
import { notifications, users } from '../db/schema.js';
import { countDays } from './stats.service.js';
import { createNotification } from './notifications.service.js';

export async function tickReminders(db: Db, now: Date): Promise<number> {
  const rows = await db
    .select({
      id: users.id,
      timezone: users.timezone,
      dailyReminderTime: users.dailyReminderTime,
    })
    .from(users)
    .where(eq(users.remindersEnabled, true))
    .all();

  let created = 0;
  for (const u of rows) {
    const { hh, mm } = hmInTz(now, u.timezone);
    const target = u.dailyReminderTime; // 'HH:MM'
    const [th, tm] = target.split(':').map(Number) as [number, number];
    if (hh !== th || mm !== tm) continue;

    const today: ISODate = dateInTz(now, u.timezone);

    // Un seul rappel par jour local : on regarde le dernier rappel créé.
    const last = await db
      .select({ data: notifications.data, createdAt: notifications.createdAt })
      .from(notifications)
      .where(and(eq(notifications.userId, u.id), eq(notifications.type, 'daily_reminder')))
      .orderBy(desc(notifications.createdAt))
      .limit(1)
      .get();
    if (last?.data) {
      try {
        const parsed = JSON.parse(last.data) as { date?: string };
        if (parsed.date === today) continue;
      } catch {
        // data illisible → on recrée un rappel (comportement sûr)
      }
    }

    const counts = await countDays(db, u.id, u.timezone, [today]);
    const c = counts.get(today) ?? { expected: 0, completed: 0 };
    const remaining = Math.max(0, c.expected - c.completed);
    const body =
      c.expected === 0
        ? 'Rien de planifié aujourd’hui — profite ou avance sur tes objectifs.'
        : remaining === 0
          ? 'Tout est fait aujourd’hui. Journée parfaite 🔥'
          : `Il te reste ${remaining} action${remaining > 1 ? 's' : ''} aujourd’hui.`;

    await createNotification(db, u.id, {
      type: 'daily_reminder',
      title: 'Ton point Charbon du jour',
      body,
      data: { date: today },
    });
    created += 1;
  }
  return created;
}

export function startReminderScheduler(db: Db, intervalMs = 30_000): { stop: () => void } {
  const timer = setInterval(() => {
    tickReminders(db, new Date()).catch((err) => {
      console.error('[reminders] tick en échec :', err);
    });
  }, intervalMs);
  // Ne retient pas le processus lors d'un arrêt propre.
  timer.unref?.();
  return {
    stop: () => clearInterval(timer),
  };
}
