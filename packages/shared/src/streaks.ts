/**
 * Moteur de streaks Charbon — fonctions pures et déterministes.
 *
 * Définitions (documentées dans docs/ARCHITECTURE.md) :
 *
 * - **Jour attendu** : jour planifié (`daily` ou jours de semaine donnés) entre
 *   la date de début et aujourd'hui, hors fenêtres de suspension.
 * - **Streak courant** : nombre de jours attendus consécutifs complétés en
 *   remontant depuis le dernier jour attendu. Si aujourd'hui est attendu mais
 *   pas encore complété, le streak n'est PAS cassé : on compte jusqu'à la
 *   veille (il reste « à risque » jusqu'à minuit local → `atRiskToday`).
 * - **Streak le plus long** : plus longue série de jours attendus consécutifs
 *   complétés sur la fenêtre d'horizon (365 jours par défaut).
 * - Les jours non planifiés (ex. habitude lun/mer/ven, ou jour sans aucune
 *   action attendue pour le streak global) sont TRANSPARENTS : ils
 *   n'interrompent pas une série et ne sont pas comptés.
 * - Une complétion sur un jour non attendu (ex. après changement de planning)
 *   reste dans l'historique mais ne prolonge pas le streak.
 *
 * Les deux fonctions partagent la même sémantique ; `computeStreaks` l'applique
 * à une habitude (jours attendus dérivés du planning), `computePerfectDayStreak`
 * à l'agrégat quotidien de l'utilisateur (jours où tout l'attendu a été fait).
 */
import { expectedDatesBetween, type PauseWindow, type Schedule } from './schedule.js';
import { addDays, maxDate, type ISODate } from './time.js';

export const DEFAULT_STREAK_HORIZON_DAYS = 365;

export interface StreakInput {
  schedule: Schedule;
  /** Date de début de l'habitude (premier jour pouvant être attendu). */
  startDate: ISODate;
  /** Dates de complétion (les doublons sont ignorés). */
  completions: readonly ISODate[];
  /** Fenêtres de suspension (`from` incluse, `to` exclue, `null` = en cours). */
  pauses?: PauseWindow[];
  /** Aujourd'hui, date civile dans le fuseau de l'utilisateur. */
  today: ISODate;
  /** Profondeur maximale du calcul (jours). */
  horizonDays?: number;
}

export interface StreakResult {
  current: number;
  longest: number;
  expectedToday: boolean;
  completedToday: boolean;
  /** Aujourd'hui est attendu et pas encore complété : le streak est en sursis. */
  atRiskToday: boolean;
  /** Taux de réalisation sur les 30 derniers jours (0..1 ; 0 si aucun jour attendu). */
  completionRate30d: number;
}

/**
 * Cœur du calcul : à partir d'un prédicat « ce jour compte-t-il comme attendu ? »
 * et d'un ensemble de jours complétés, calcule les séries.
 *
 * `expected` doit être trié ascendant, sans doublon, et borné par `today`.
 */
function streakFromExpected(
  expected: readonly ISODate[],
  done: ReadonlySet<ISODate>,
  today: ISODate,
): { current: number; longest: number; expectedToday: boolean; completedToday: boolean } {
  const expectedToday = expected.length > 0 && expected[expected.length - 1] === today;
  const completedToday = done.has(today);

  let current = 0;
  let i = expected.length - 1;
  // Sursis : aujourd'hui attendu mais non complété → on part de la veille.
  if (i >= 0 && expected[i] === today && !completedToday) i -= 1;
  while (i >= 0 && done.has(expected[i] as ISODate)) {
    current += 1;
    i -= 1;
  }

  let longest = 0;
  let run = 0;
  for (const d of expected) {
    if (done.has(d)) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  return { current, longest, expectedToday, completedToday };
}

export function computeStreaks(input: StreakInput): StreakResult {
  const horizon = input.horizonDays ?? DEFAULT_STREAK_HORIZON_DAYS;
  const windowStart = maxDate(input.startDate, addDays(input.today, -(horizon - 1)));
  const pauses = input.pauses ?? [];

  const expected = expectedDatesBetween(input.schedule, windowStart, input.today, pauses);
  const done = new Set(input.completions);
  const base = streakFromExpected(expected, done, input.today);

  const start30 = maxDate(input.startDate, addDays(input.today, -29));
  const expected30 = expectedDatesBetween(input.schedule, start30, input.today, pauses);
  const completed30 = expected30.filter((d) => done.has(d)).length;

  return {
    ...base,
    atRiskToday: base.expectedToday && !base.completedToday,
    completionRate30d: expected30.length === 0 ? 0 : completed30 / expected30.length,
  };
}

/**
 * Streak global « jours parfaits » : jours consécutifs où TOUTES les actions
 * attendues ont été complétées.
 *
 * `days` ne contient que les jours où au moins une action était attendue ;
 * un jour absent (rien d'attendu) est transparent : il ne casse pas la série
 * et n'est pas compté.
 */
export function computePerfectDayStreak(params: {
  days: Map<ISODate, { expected: number; completed: number }>;
  today: ISODate;
  horizonDays?: number;
}): { current: number; longest: number } {
  const horizon = params.horizonDays ?? DEFAULT_STREAK_HORIZON_DAYS;
  const start = addDays(params.today, -(horizon - 1));

  const expected = [...params.days.keys()]
    .filter((d) => d >= start && d <= params.today)
    .filter((d) => {
      const s = params.days.get(d);
      return s !== undefined && s.expected > 0;
    })
    .sort();

  const done = new Set(
    expected.filter((d) => {
      const s = params.days.get(d);
      return s !== undefined && s.completed >= s.expected;
    }),
  );

  const { current, longest } = streakFromExpected(expected, done, params.today);
  return { current, longest };
}
