/**
 * URL publique du site (canonical, Open Graph, sitemap).
 *
 * Tolère l'ABSENCE ou la VIDEUR de NEXT_PUBLIC_SITE_URL :
 * une variable vide («») ne doit jamais casser le build
 * (new URL('') lève ERR_INVALID_URL à la collecte des pages).
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  if (raw.length > 0) {
    try {
      return new URL(raw).origin;
    } catch {
      /* valeur invalide : on retombe sur le défaut */
    }
  }
  return 'http://localhost:3000';
}
