/**
 * Agrégat « Today » — le dashboard : tout ce qu'il faut savoir pour agir
 * aujourd'hui, en UN aller-retour réseau.
 */
import {
  computePerfectDayStreak,
  addDays,
  listDates,
  type GoalDTO,
  type TaskDTO,
  type TodayDTO,
} from '@charbon/shared';
import type { Db } from '../db/client.js';
import type { RequestUser } from '../plugins/auth.js';
import { listTasks } from './tasks.service.js';
import { listHabits, type HabitWithStreaks } from './habits.service.js';
import { routinesToday } from './routines.service.js';
import { listGoals } from './goals.service.js';
import { countDays } from './stats.service.js';
import { unreadCount } from './notifications.service.js';

export async function getToday(db: Db, user: RequestUser): Promise<TodayDTO> {
  const { id: userId, timezone: tz, today } = user;

  const [tasks, habits, routines, goals, dayCounts, unread, streakWindow] = await Promise.all([
    listTasks(db, userId, 'today', today, tz) as Promise<TaskDTO[]>,
    listHabits(db, userId, tz) as Promise<HabitWithStreaks[]>,
    routinesToday(db, userId, tz),
    listGoals(db, userId, 'active') as Promise<GoalDTO[]>,
    countDays(db, userId, tz, [today]),
    unreadCount(db, userId),
    countDays(db, userId, tz, listDates(addDays(today, -364), today)),
  ]);

  const c = dayCounts.get(today) ?? { expected: 0, completed: 0 };

  const days = new Map<string, { expected: number; completed: number }>();
  for (const [d, v] of streakWindow) if (v.expected > 0) days.set(d, v);
  const streak = computePerfectDayStreak({ days, today });

  return {
    date: today,
    progress: {
      expected: c.expected,
      completed: c.completed,
      rate: c.expected === 0 ? 0 : c.completed / c.expected,
    },
    tasks,
    habits,
    routines,
    goals,
    streak,
    unreadNotifications: unread,
  };
}

