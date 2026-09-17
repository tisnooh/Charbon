/**
 * Validation des entrées (body/query/params) via les schémas zod partagés.
 * Échec → AppError 400 'validation_error' avec le détail des problèmes.
 */
import type { ZodType } from 'zod';
import { badRequest, notFound } from './errors.js';

export function parseWith<T>(schema: ZodType<T>, data: unknown, label = 'Entrée invalide'): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest(
      label,
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return result.data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valide un paramètre d'ID : invalide = 404 (ne pas révéler le format attendu). */
export function parseUuidParam(value: string): string {
  if (!UUID_RE.test(value)) throw notFound('Ressource introuvable');
  return value;
}
