/**
 * Validation email — volontairement simple mais robuste.
 * RFC-lite : pas d'espace, un @, un point dans le domaine, longueurs bornées.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  const email = normalizeEmail(raw);
  if (email.length === 0 || email.length > 254) return false;
  const [local, domain] = email.split('@');
  if (!local || local.length > 64 || !domain || domain.length > 253) return false;
  return EMAIL_RE.test(email);
}
