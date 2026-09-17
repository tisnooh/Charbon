/**
 * Utilitaires de dates « calendar-day » indépendants du runtime.
 *
 * Principe Charbon : une habitude / routine se valide par JOUR CIVIL dans le
 * fuseau horaire de l'utilisateur. Les dates calendaires sont représentées en
 * `ISODate` ('YYYY-MM-DD') et manipulées via l'horloge UTC pour être
 * déterministes (pas de DST, pas de décalage local du serveur).
 *
 * Les instants (création, échéance de tâche) sont des `ISODateTime` UTC.
 */

/** Date civile au format 'YYYY-MM-DD' (jour local utilisateur). */
export type ISODate = string;
/** Instant ISO-8601 (UTC en pratique, ex. '2026-09-18T22:30:00.000Z'). */
export type ISODateTime = string;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Instant UTC courant. */
export function isoUtcNow(): ISODateTime {
  return new Date().toISOString();
}

/** Le fuseau IANA est-il supporté par le runtime ? */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Date civile ('YYYY-MM-DD') d'un instant donné dans un fuseau donné. */
export function dateInTz(instant: Date, tz: string): ISODate {
  // 'en-CA' formate nativement en YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Aujourd'hui (date civile) dans le fuseau de l'utilisateur. */
export function todayInTz(tz: string): ISODate {
  return dateInTz(new Date(), tz);
}

/** Heures/minutes locales d'un instant dans un fuseau (pour les rappels). */
export function hmInTz(instant: Date, tz: string): { hh: number; mm: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hh, mm };
}

/**
 * Parse strict d'une date civile : format exact + date calendaire réelle
 * (rejette '2026-02-30'). Retourne un Date à minuit UTC, ou null.
 */
export function parseISODate(s: string): Date | null {
  if (!ISO_DATE_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Aller-retour : garantit que la date calendaire existe vraiment.
  return d.toISOString().slice(0, 10) === s ? d : null;
}

export function isISODate(s: string): boolean {
  return parseISODate(s) !== null;
}

/** Ajoute n jours (n peut être négatif) à une date civile. */
export function addDays(date: ISODate, n: number): ISODate {
  const d = parseISODate(date);
  if (!d) throw new Error(`addDays: date invalide "${date}"`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Nombre de jours de a à b (b - a). Négatif si b < a. */
export function diffDays(a: ISODate, b: ISODate): number {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (!da || !db) throw new Error(`diffDays: dates invalides "${a}" / "${b}"`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Liste inclusive des dates civiles de `from` à `to` ([] si from > to). */
export function listDates(from: ISODate, to: ISODate): ISODate[] {
  const n = diffDays(from, to);
  if (n < 0) return [];
  const out: ISODate[] = [];
  for (let i = 0; i <= n; i++) out.push(addDays(from, i));
  return out;
}

/** Jour de semaine d'une date civile : 0 = dimanche … 6 = samedi. */
export function weekdayOf(date: ISODate): number {
  const d = parseISODate(date);
  if (!d) throw new Error(`weekdayOf: date invalide "${date}"`);
  return d.getUTCDay();
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}

/** Convertit un instant ISO en date civile dans un fuseau. */
export function dateFromDateTime(iso: ISODateTime, tz: string): ISODate {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`dateFromDateTime: instant invalide "${iso}"`);
  return dateInTz(d, tz);
}
