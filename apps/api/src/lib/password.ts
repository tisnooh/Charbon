/**
 * Hachage de mots de passe — scrypt (node:crypto natif, zéro dépendance).
 * Format stocké : scrypt$N$r$p$<salt hex>$<hash hex>
 * Comparaison en temps constant.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize('NFKC'), salt, KEYLEN, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [pN, pr, pp, saltHex, hashHex] = parts.slice(1) as [string, string, string, string, string];
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  let actual: Buffer;
  try {
    actual = scryptSync(password.normalize('NFKC'), salt, expected.length, {
      N: Number(pN),
      r: Number(pr),
      p: Number(pp),
      maxmem: 64 * 1024 * 1024,
    });
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Hachage factice pour homogénéiser les temps de réponse (anti-énumération). */
export function dummyVerify(): void {
  scryptSync('dummy-password', Buffer.alloc(16), 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
}
