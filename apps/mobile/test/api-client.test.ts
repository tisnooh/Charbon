import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiClientError, setUnauthorizedHandler } from '../src/api/client.js';

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setUnauthorizedHandler(null);
  });

  it('requête GET : URL composée + payload JSON parsé', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const res = await apiRequest<{ ok: number }>('/today', { query: { a: 1, b: undefined } });
    expect(res).toEqual({ ok: 1 });
    const url = String(spy.mock.calls[0]?.[0]);
    expect(url).toContain('/api/v1/today');
    expect(url).toContain('a=1');
    expect(url).not.toContain('b=');
    const init = spy.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe('include');
  });

  it('erreur API → ApiClientError avec code + message + détails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'validation_error', message: 'Entrée invalide', details: [{ path: 'title' }] },
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );
    await expect(apiRequest('/tasks')).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 400,
      code: 'validation_error',
    });
  });

  it('401 → callback de session expirée déclenché une fois', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'Session expirée' } }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(apiRequest('/me')).rejects.toBeInstanceOf(ApiClientError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('réseau coupé → erreur lisible, pas de crash', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/today')).rejects.toMatchObject({ code: 'network_error' });
  });

  it('204 → undefined sans parsing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiRequest('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
