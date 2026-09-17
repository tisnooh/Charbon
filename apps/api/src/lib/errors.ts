/**
 * Erreurs applicatives : statut HTTP + code machine stable (voir API_ERROR_CODES
 * dans @charbon/shared). Le handler global (plugins/error-handler.ts) les sérialise.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'validation_error', message, details);
export const unauthorized = (message = 'Authentification requise') =>
  new AppError(401, 'unauthorized', message);
export const forbidden = (message = 'Action interdite') => new AppError(403, 'forbidden', message);
export const notFound = (message = 'Ressource introuvable') =>
  new AppError(404, 'not_found', message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);
export const premiumRequired = (message = 'Fonctionnalité réservée au plan Premium') =>
  new AppError(403, 'premium_required', message);
