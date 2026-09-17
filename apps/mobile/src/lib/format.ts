/** Formatage français (dates, heures, pourcentages) — sans dépendance. */

const WEEKDAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const WEEKDAYS_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** '2026-09-18' → 'jeudi 18 septembre' (fuseau local du navigateur). */
export function formatLongDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const wd = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()];
  return `${wd} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** '2026-09-18' → '18 sept.' */
export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${d.getDate()} ${MONTHS[d.getMonth()]!.slice(0, 4)}.`;
}

export function weekdayShort(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '?' : (WEEKDAYS_SHORT[d.getDay()] ?? '?');
}

export function weekdayLetter(dayIndex: number): string {
  return WEEKDAYS_LETTER[dayIndex] ?? '?';
}

export function dayNumber(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '?' : String(d.getDate());
}

/** 0.75 → '75 %' */
export function formatPct(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

/** Instant ISO → '14:30' (heure locale du navigateur). */
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Instant ISO → '18 sept. à 14:30' ou "aujourd'hui à 14:30". */
export function formatDueLabel(isoDateTime: string, todayIso: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const time = formatTime(isoDateTime);
  if (day === todayIso) return `aujourd’hui à ${time}`;
  const yesterday = new Date(`${todayIso}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yIso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (day === yIso) return `hier à ${time}`;
  if (day < todayIso) return `en retard · ${formatShortDate(day)} ${time}`;
  return `${formatShortDate(day)} à ${time}`;
}

/** Valeur pour <input type="datetime-local"> depuis un instant ISO. */
export function toLocalInputValue(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> → instant ISO (ou null si vide). */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Durée en minutes → '5 min' / '1 h 30'. */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** 'morning' → 'Matin', etc. */
export function timeOfDayLabel(v: string): string {
  switch (v) {
    case 'morning':
      return 'Matin';
    case 'midday':
      return 'Midi';
    case 'evening':
      return 'Soir';
    default:
      return 'Libre';
  }
}

/** Description lisible d'un planning. */
export function scheduleLabel(schedule: { type: string; days: number[] }): string {
  if (schedule.type === 'daily') return 'Tous les jours';
  const letters = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
  return schedule.days.map((d) => letters[d] ?? '?').join(' · ');
}

/** Fuseau IANA local du navigateur. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Prix formaté en EUR. */
export function formatPrice(amount: number): string {
  if (amount === 0) return 'Gratuit';
  return `${amount.toFixed(2).replace('.', ',')} €`;
}
