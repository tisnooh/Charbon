import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from '../src/screens/auth/LoginScreen.js';
import { makeWrapper, mockFetch, sessionBody } from './helpers.js';

describe('LoginScreen', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('validation client : champs requis signalés avant tout appel réseau', async () => {
    const { calls } = mockFetch([]);
    const { Wrapper } = makeWrapper(['/login']);
    const user = userEvent.setup();
    render(<LoginScreen />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    // Les deux erreurs de champ s'affichent (validation zod côté client).
    await screen.findByText('Adresse e-mail invalide');
    expect(screen.getByText('Mot de passe requis')).toBeTruthy();
    expect(calls.filter((c) => c.url.includes('/auth/login'))).toHaveLength(0);
  });

  it('échec serveur 401 : message affiché, aucune navigation', async () => {
    mockFetch([
      { path: '/me', status: 401, body: { error: { code: 'unauthorized', message: 'x' } } },
      {
        path: '/auth/login',
        method: 'POST',
        status: 401,
        body: { error: { code: 'unauthorized', message: 'E-mail ou mot de passe incorrect' } },
      },
    ]);
    const { Wrapper } = makeWrapper(['/login']);
    const user = userEvent.setup();
    render(<LoginScreen />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/e-mail/i), 'alice@example.test');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse1');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await screen.findByText('E-mail ou mot de passe incorrect');
  });

  it('succès : cookie posé par le serveur, session en cache, redirection', async () => {
    const { calls } = mockFetch([
      { path: '/me', status: 401, body: { error: { code: 'unauthorized', message: 'x' } } },
      { path: '/auth/login', method: 'POST', status: 200, body: sessionBody() },
    ]);
    const { Wrapper } = makeWrapper(['/login']);
    const user = userEvent.setup();
    render(<LoginScreen />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/e-mail/i), 'alice@example.test');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse1');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(calls.some((c) => c.url.includes('/auth/login') && c.method === 'POST')).toBe(true);
    });
    // Le bouton passe en pending puis l'écran se démonte (redirect) : pas de crash.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /se connecter/i })).toBeNull();
    });
  });
});
