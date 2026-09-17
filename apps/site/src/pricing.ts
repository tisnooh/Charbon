/**
 * Ré-export des constantes partagées + formatage prix côté site.
 * (Le site n'importe que ce dont il a besoin ; le reste vient de
 * @charbon/shared, source de vérité commune app + site.)
 */
import { PLANS as SHARED_PLANS } from '@charbon/shared';

export const PLANS = SHARED_PLANS;

export function formatPriceShared(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}
