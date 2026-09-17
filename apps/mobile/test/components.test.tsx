import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CheckCircle, ProgressRing, SegmentedControl } from '../src/components/ui.js';
import { ToastProvider, useToast } from '../src/components/Toast.js';
import { formatDueLabel, formatPct, scheduleLabel } from '../src/lib/format.js';

describe('composants UI', () => {
  afterEach(cleanup);

  it('ProgressRing : pourcentage borné et affiché', () => {
    const { rerender } = render(<ProgressRing pct={0.3333} caption="test" />);
    expect(screen.getByText('33%')).toBeTruthy();
    rerender(<ProgressRing pct={2} />);
    expect(screen.getByText('100%')).toBeTruthy();
    rerender(<ProgressRing pct={-1} />);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('CheckCircle : toggle + état aria-pressed + disabled', async () => {
    const user = userEvent.setup();
    let state = false;
    const { rerender } = render(
      <CheckCircle checked={state} onToggle={() => (state = !state)} label="basculer" />,
    );
    const btn = screen.getByLabelText('basculer');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    await user.click(btn);
    expect(state).toBe(true);
    rerender(<CheckCircle checked disabled onToggle={() => (state = false)} label="basculer" />);
    expect((screen.getByLabelText('basculer') as HTMLButtonElement).disabled).toBe(true);
  });

  it('SegmentedControl : sélection + aria-selected', async () => {
    const user = userEvent.setup();
    let value = 'a';
    function Ctl() {
      return (
        <SegmentedControl
          ariaLabel="test"
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
          value={value}
          onChange={(v) => (value = v)}
        />
      );
    }
    render(<Ctl />);
    expect(screen.getByRole('tab', { name: 'Alpha' }).getAttribute('aria-selected')).toBe('true');
    await user.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(value).toBe('b');
  });
});

describe('ToastProvider', () => {
  afterEach(cleanup);

  function Demo() {
    const toast = useToast();
    return (
      <button onClick={() => toast.push({ message: 'Supprimée', actionLabel: 'Annuler', onAction: () => window.dispatchEvent(new Event('undo-test')) })}>
        déclencher
      </button>
    );
  }

  it('toast affiché, action exécutée une fois au clic', async () => {
    const user = userEvent.setup();
    let undone = 0;
    window.addEventListener('undo-test', () => {
      undone += 1;
    });
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await user.click(screen.getByText('déclencher'));
    const undo = await screen.findByRole('button', { name: 'Annuler' });
    await user.click(undo);
    expect(undone).toBe(1);
    // Le toast disparaît après l'action.
    expect(screen.queryByTestId('toast')).toBeNull();
  });
});

describe('formatage', () => {
  it('formatPct', () => {
    expect(formatPct(0)).toBe('0 %');
    expect(formatPct(0.5)).toBe('50 %');
    expect(formatPct(1)).toBe('100 %');
  });
  it('scheduleLabel', () => {
    expect(scheduleLabel({ type: 'daily', days: [] })).toBe('Tous les jours');
    expect(scheduleLabel({ type: 'days_of_week', days: [1, 3, 5] })).toBe('Lu · Me · Ve');
  });
  it('formatDueLabel : aujourd’hui / retard', () => {
    const today = '2026-09-18';
    expect(formatDueLabel('2026-09-18T14:30:00.000Z', today)).toMatch(/^aujourd’hui à/);
    expect(formatDueLabel('2026-09-16T08:00:00.000Z', today)).toMatch(/en retard/);
  });
});
