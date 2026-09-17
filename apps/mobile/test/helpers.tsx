/** Helpers de test front : wrapper providers + fetch mock déterministe. */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ToastProvider } from '../src/components/Toast.js';

export function makeWrapper(initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

export interface MockRoute {
  method?: string;
  path: string; // correspond si l'URL CONTIENT cette sous-chaîne
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Mocke globalThis.fetch avec une table de routes (ordre = priorité). */
export function mockFetch(routes: MockRoute[]) {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ?? 'GET').toUpperCase();
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const route = routes.find((r) => (r.method ?? 'GET').toUpperCase() === method && url.includes(r.path));
    if (!route) {
      return new Response(JSON.stringify({ error: { code: 'not_found', message: `mock: ${method} ${url}` } }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    const status = route.status ?? 200;
    const body = typeof route.body === 'function' ? (route.body as () => unknown)() : route.body;
    return new Response(body === undefined ? undefined : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...(route.headers ?? {}) },
    });
  });
  return { calls, spy };
}

export function sessionBody(email = 'test@example.test') {
  return {
    user: {
      id: 'u-1',
      email,
      name: 'Test',
      timezone: 'UTC',
      remindersEnabled: false,
      dailyReminderTime: '20:00',
      onboardingCompleted: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    plan: 'free',
  };
}
