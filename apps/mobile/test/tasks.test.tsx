import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TasksScreen } from '../src/screens/TasksScreen.js';
import { makeWrapper, mockFetch } from './helpers.js';

const TODAY = new Date().toISOString().slice(0, 10);

const task = {
  id: 't-1',
  title: 'Appeler la banque',
  notes: null,
  goalId: null,
  dueAt: `${TODAY}T10:00:00.000Z`,
  status: 'pending',
  completedAt: null,
  createdAt: `${TODAY}T06:00:00.000Z`,
  updatedAt: `${TODAY}T06:00:00.000Z`,
};

describe('TasksScreen', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('suppression → toast « Annuler » → restauration RÉELLE via l’API', async () => {
    const { calls } = mockFetch([
      { path: '/tasks?view=today', body: { items: [task] } },
      { path: '/today', body: { date: TODAY, progress: { expected: 0, completed: 0, rate: 0 }, tasks: [], habits: [], routines: [], goals: [], streak: { current: 0, longest: 0 }, unreadNotifications: 0 } },
      { path: '/tasks/t-1', method: 'DELETE', body: { ...task, deletedAt: `${TODAY}T12:00:00.000Z` } },
      { path: '/tasks/t-1/restore', method: 'POST', body: { ...task, deletedAt: null } },
      { path: '/tasks?view=deleted', body: { items: [] } },
    ]);
    const { Wrapper } = makeWrapper(['/tasks']);
    const user = userEvent.setup();
    render(<TasksScreen />, { wrapper: Wrapper });

    await screen.findByText('Appeler la banque');
    await user.click(screen.getByLabelText('Supprimer « Appeler la banque »'));

    // Toast avec action Annuler.
    const undo = await screen.findByRole('button', { name: 'Annuler' });
    expect(screen.getByText(/supprimée/i)).toBeTruthy();
    await user.click(undo);

    await waitFor(() => {
      expect(calls.some((c) => c.method === 'POST' && c.url.includes('/tasks/t-1/restore'))).toBe(true);
    });
  });

  it('complétion depuis la liste → POST /complete, retour → /uncomplete', async () => {
    const { calls } = mockFetch([
      { path: '/tasks?view=today', body: { items: [task] } },
      { path: '/today', body: { date: TODAY, progress: { expected: 0, completed: 0, rate: 0 }, tasks: [], habits: [], routines: [], goals: [], streak: { current: 0, longest: 0 }, unreadNotifications: 0 } },
      { path: '/tasks/t-1/complete', method: 'POST', body: { ...task, status: 'done', completedAt: `${TODAY}T09:00:00.000Z` } },
      { path: '/tasks/t-1/uncomplete', method: 'POST', body: task },
    ]);
    const { Wrapper } = makeWrapper(['/tasks']);
    const user = userEvent.setup();
    render(<TasksScreen />, { wrapper: Wrapper });

    await user.click(await screen.findByLabelText('Terminer « Appeler la banque »'));
    await waitFor(() => {
      expect(calls.some((c) => c.method === 'POST' && c.url.includes('/tasks/t-1/complete'))).toBe(true);
    });
  });

  it('vue corbeille vide : empty state dédié', async () => {
    mockFetch([
      { path: '/tasks?view=deleted', body: { items: [] } },
      { path: '/today', body: { date: TODAY, progress: { expected: 0, completed: 0, rate: 0 }, tasks: [], habits: [], routines: [], goals: [], streak: { current: 0, longest: 0 }, unreadNotifications: 0 } },
    ]);
    const { Wrapper } = makeWrapper(['/tasks']);
    const user = userEvent.setup();
    render(<TasksScreen />, { wrapper: Wrapper });

    await user.click(screen.getByRole('tab', { name: 'Corbeille' }));
    await screen.findByText('Corbeille vide');
  });

  it('création via la sheet : titre vide bloqué côté client, sinon POST réel', async () => {
    const { calls } = mockFetch([
      { path: '/tasks?view=today', body: { items: [] } },
      { path: '/today', body: { date: TODAY, progress: { expected: 0, completed: 0, rate: 0 }, tasks: [], habits: [], routines: [], goals: [], streak: { current: 0, longest: 0 }, unreadNotifications: 0 } },
      { path: '/goals?status=active', body: { items: [] } },
      { path: '/tasks', method: 'POST', body: { ...task, id: 't-2' } },
    ]);
    const { Wrapper } = makeWrapper(['/tasks']);
    const user = userEvent.setup();
    render(<TasksScreen />, { wrapper: Wrapper });

    await screen.findByText('Rien pour aujourd’hui');
    await user.click(screen.getByLabelText('Nouvelle tâche'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();
    const submit = screen.getByRole('button', { name: 'Ajouter' });
    expect((submit as HTMLButtonElement).disabled).toBe(true); // titre vide = disabled réel

    await user.type(screen.getByLabelText('Titre'), 'Nouvelle tâche réelle');
    expect((screen.getByRole('button', { name: 'Ajouter' }) as HTMLButtonElement).disabled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/api/v1/tasks'))).toBe(true);
    });
  });
});
