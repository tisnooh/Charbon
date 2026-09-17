/**
 * Session + thème : contexte applicatif central.
 * - useMe() est la source de vérité (cookie httpOnly → /me) ;
 * - un 401 global (session expirée) vide le cache « me » → retour login ;
 * - le thème (système/clair/sombre) est appliqué au document et persisté.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SessionResponse } from '@charbon/shared';
import { qk, useMe } from '../api/hooks.js';
import { setUnauthorizedHandler } from '../api/client.js';
import { applyTheme, readThemeChoice } from '../lib/theme.js';

export type SessionStatus = 'loading' | 'authed' | 'anon';

export interface SessionState {
  status: SessionStatus;
  session: SessionResponse | null;
  /** Force un refetch de /me (ex. après mutation de profil). */
  refresh: () => void;
  /** Marque la session comme perdue (401) sans refetch immédiat. */
  clear: () => void;
}

export function useSessionState(): SessionState {
  const me = useMe();
  const qc = useQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      qc.setQueryData(qk.me, null);
    });
    return () => setUnauthorizedHandler(null);
  }, [qc]);

  useEffect(() => {
    applyTheme(readThemeChoice());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readThemeChoice() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return useMemo(
    () => ({
      status: me.isPending ? 'loading' : me.data ? 'authed' : 'anon',
      session: me.data ?? null,
      refresh: () => void me.refetch(),
      clear: () => qc.setQueryData(qk.me, null),
    }),
    [me.isPending, me.data, me.refetch, qc],
  );
}

/** Composant applicatif d'amorçage (thème + session) sans rendu propre. */
export function SessionBootstrap({ children }: { children: ReactNode }) {
  useSessionState();
  return <>{children}</>;
}
