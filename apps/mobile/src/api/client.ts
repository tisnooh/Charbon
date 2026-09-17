/**
 * Client API — fetch typé avec cookies de session (same-origin en prod,
 * proxy Vite en dev). Toutes les erreurs sont normalisées en ApiClientError
 * { status, code, message, details } ; le 401 déclenche le callback global
 * de déconnexion (session expirée → retour à l'écran de connexion).
 */
import type { ApiError } from '@charbon/shared';

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
const API_PREFIX = `${API_BASE}/api/v1`;

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_PREFIX}${path}`, window.location.origin);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiClientError(0, 'network_error', 'Connexion au serveur impossible. Vérifiez votre réseau.');
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await res.json()) as unknown) : null;

  if (!res.ok) {
    const apiError = payload as ApiError | null;
    const code = apiError?.error?.code ?? 'internal_error';
    const message = apiError?.error?.message ?? `Erreur serveur (${res.status})`;
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiClientError(res.status, code, message, apiError?.error?.details);
  }

  return payload as T;
}
