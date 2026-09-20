/**
 * Rate limiting léger, en mémoire, par adresse IP.
 * Fenêtre glissante : `max` tentatives sur `windowMs`.
 *
 * Note : en serverless, chaque instance a sa propre mémoire — ce garde-fou
 * suffit contre le spam basique ; pour un durcissement complet, ajouter
 * Upstash/Ratelimit plus tard sans changer l'API route.
 */

interface Bucket {
  hits: number[];
}

export class SlidingWindowRateLimit {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** true = autorisé, false = limite atteinte. */
  check(key: string, now = Date.now()): boolean {
    const bucket = this.buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((t) => now - t < this.windowMs);
    if (bucket.hits.length >= this.max) {
      this.buckets.set(key, bucket);
      return false;
    }
    bucket.hits.push(now);
    this.buckets.set(key, bucket);

    // Nettoyage opportuniste pour éviter toute fuite mémoire.
    if (this.buckets.size > 5000) {
      for (const [k, b] of this.buckets) {
        if (b.hits.length === 0 || now - b.hits[b.hits.length - 1] > this.windowMs) {
          this.buckets.delete(k);
        }
      }
    }
    return true;
  }
}

/** 5 tentatives / 10 minutes par IP pour la waitlist. */
export const waitlistRateLimit = new SlidingWindowRateLimit(5, 10 * 60 * 1000);

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
