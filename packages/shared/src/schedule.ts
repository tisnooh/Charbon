/**
 * Planification (habitudes & routines) : quels jours une action est « attendue ».
 *
 * - `daily`        : tous les jours à partir de la date de début.
 * - `days_of_week` : uniquement certains jours de semaine (0 = dimanche … 6 = samedi).
 *
 * Les fenêtres de suspension (pause) retirent des jours attendus :
 * `from` est INCLUS (le jour de la suspension n'est plus attendu),
 * `to` est EXCLUS (le jour de reprise redevient attendu), `to === null` = toujours suspendu.
 */
import { type ISODate, isISODate, listDates, weekdayOf } from './time.js';

export const SCHEDULE_TYPES = ['daily', 'days_of_week'] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export interface Schedule {
  type: ScheduleType;
  /** Jours de semaine (0=dim … 6=sam). Utilisé uniquement si type = 'days_of_week'. */
  days: number[];
}

export interface PauseWindow {
  /** Date civile de suspension (incluse). */
  from: ISODate;
  /** Date civile de reprise (exclue). null = suspension en cours. */
  to: ISODate | null;
}

export function normalizeSchedule(input: Partial<Schedule> | undefined): Schedule {
  if (!input || input.type === 'daily') return { type: 'daily', days: [] };
  const days = [...new Set(input.days ?? [])].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
  return { type: 'days_of_week', days };
}

export function isScheduledOn(schedule: Schedule, date: ISODate): boolean {
  if (!isISODate(date)) throw new Error(`isScheduledOn: date invalide "${date}"`);
  if (schedule.type === 'daily') return true;
  return schedule.days.includes(weekdayOf(date));
}

export function isPausedOn(pauses: PauseWindow[], date: ISODate): boolean {
  return pauses.some((p) => p.from <= date && (p.to === null || date < p.to));
}

/**
 * Jours « attendus » entre from et to (inclus), selon le planning,
 * hors fenêtres de suspension. Retour trié ascendant, sans doublon.
 */
export function expectedDatesBetween(
  schedule: Schedule,
  from: ISODate,
  to: ISODate,
  pauses: PauseWindow[] = [],
): ISODate[] {
  return listDates(from, to).filter((d) => isScheduledOn(schedule, d) && !isPausedOn(pauses, d));
}
