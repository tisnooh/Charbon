import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodayScreen } from '../src/screens/TodayScreen.js';
import { makeWrapper, mockFetch } from './helpers.js';

const TODAY = new Date().toISOString().slice(0, 10);

const todayBody = {
  date: TODAY,
  progress: { expected: 3, completed: 1, rate: 1 / 3 },
  tasks: [
    {
      id: 't-1',
      title: 'Préparer demain',
      notes: null,
      goalId: null,
      dueAt: `${TODAY}T17:00:00.000Z`,
      status: 'pending',
      completedAt: null,
      createdAt: `${TODAY}T06:00:00.000Z`,
      updatedAt: `${TODAY}T06:00:00.000Z`,
    },
  ],
  habits: [
    {
      id: 'h-1',
      name: 'Lire 10 minutes',
      color: '#F97316',
      schedule: { type: 'daily', days: [] },
      startDate: TODAY,
      pausedAt: null,
      goalId: null,
      currentStreak: 4,
      longestStreak: 6,
      doneToday: false,
      expectedToday: true,
      atRiskToday: true,
      createdAt: `${TODAY}T06:00:00.000Z`,
      updatedAt: `${TODAY}T06:00:00.000Z`,
    },
  ],
  routines: [
    {
      id: 'r-1',
      name: 'Routine matin',
      timeOfDay: 'morning',
      scheduledTime: '07:00',
      schedule: { type: 'daily', days: [] },
      items: [
        { id: 'i-1', title: 'Verre d’eau', durationMinutes: null, sortOrder: 0 },
        { id: 'i-2', title: 'Étirements', durationMinutes: 5, sortOrder: 1 },
      ],
      scheduledToday: true,
      itemsDoneToday: 1,
      itemsTotal: 2,
      doneToday: false,
      itemStates: [
        { itemId: 'i-1', done: true },
        { itemId: 'i-2', done: false },
      ],
      createdAt: `${TODAY}T06:00:00.000Z`,
      updatedAt: `${TODAY}T06:00:00.000Z`,
    },
  ],
  goals: [{ id: 'g-1', title: 'Être constant', description: null, targetDate: null, status: 'active', createdAt: '', updatedAt: '' }],
  streak: { current: 2, longest: 5 },
  unreadNotifications: 1,
};

describe('TodayScreen', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('affiche la progression, l’habitude, la routine et l’objectif réels', async () => {
    mockFetch([{ path: '/today', body: todayBody }]);
    const { Wrapper } = makeWrapper(['/']);
    render(<TodayScreen />, { wrapper: Wrapper });

    await screen.findByText('Lire 10 minutes');
    expect(screen.getByText('Routine matin')).toBeTruthy();
    expect(screen.getByText('Être constant')).toBeTruthy();
    expect(screen.getByText(/1\/3 actions/)).toBeTruthy();
    expect(screen.getByText(/🔥 2 jour/)).toBeTruthy();
    // Taux 33 %
    expect(screen.getByText('33%')).toBeTruthy();
  });

  it('état vide : messages réels + CTA, aucun contenu inventé', async () => {
    mockFetch([
      {
        path: '/today',
        body: { ...todayBody, tasks: [], habits: [], routines: [], goals: [], progress: { expected: 0, completed: 0, rate: 0 } },
      },
    ]);
    const { Wrapper } = makeWrapper(['/']);
    render(<TodayScreen />, { wrapper: Wrapper });

    await screen.findByText('Aucune tâche aujourd’hui');
    expect(screen.getByText('Aucune habitude')).toBeTruthy();
    expect(screen.getByText('Aucune routine aujourd’hui')).toBeTruthy();
    expect(screen.getByText('Aucun objectif actif')).toBeTruthy();
    expect(screen.getByText('Rien de planifié aujourd’hui.')).toBeTruthy();
  });

  it('valider une habitude appelle POST /habits/:id/completions (optimiste + serveur)', async () => {
    const { calls } = mockFetch([
      { path: '/today', body: todayBody },
      { path: '/habits/h-1/completions', method: 'POST', body: { done: true, date: TODAY, streak: { current: 5, longest: 6, atRiskToday: false } } },
    ]);
    const { Wrapper } = makeWrapper(['/']);
    const user = userEvent.setup();
    render(<TodayScreen />, { wrapper: Wrapper });

    const toggle = await screen.findByLabelText('Valider « Lire 10 minutes »');
    await user.click(toggle);

    await waitFor(() => {
      expect(calls.some((c) => c.method === 'POST' && c.url.includes('/habits/h-1/completions'))).toBe(true);
    });
  });

  it('erreur réseau : état d’erreur avec bouton Réessayer', async () => {
    mockFetch([
      {
        path: '/today',
        status: 500,
        body: { error: { code: 'internal_error', message: 'Erreur interne du serveur' } },
      },
    ]);
    const { Wrapper } = makeWrapper(['/']);
    render(<TodayScreen />, { wrapper: Wrapper });

    await screen.findByText('Erreur interne du serveur');
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeTruthy();
  });

  it('chargement : skeletons affichés (pas de contenu fantôme)', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/today')) {
        await gate;
        return new Response(JSON.stringify(todayBody), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('{}', { status: 404 });
    });
    const { Wrapper } = makeWrapper(['/']);
    render(<TodayScreen />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Chargement')).toBeTruthy();
    release();
    await screen.findByText('Lire 10 minutes');
  });
});
