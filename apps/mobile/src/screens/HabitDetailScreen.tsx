/**
 * Détail d'habitude : streaks, taux, calendrier d'historique (30 j en Free,
 * jusqu'à 365 j en Premium — gating réel côté serveur), pause/reprise,
 * édition, suppression.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import type { HabitHistoryDayDTO } from '@charbon/shared';
import { useHabitHistory, useHabitMutations, useMe, useToday } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, CheckCircle, ConfirmDialog, ErrorState, SegmentedControl } from '../components/ui.js';
import { ChevronLeftIcon, PauseIcon, PencilIcon, PlayIcon, TrashIcon } from '../components/icons.js';
import { dayNumber, formatPct, scheduleLabel } from '../lib/format.js';
import { useToast } from '../components/Toast.js';
import { HabitSheet } from './habits/HabitSheet.js';

function CalendarGrid({
  history,
  todayIso,
  onToggleDay,
}: {
  history: HabitHistoryDayDTO[];
  todayIso: string;
  onToggleDay: (day: HabitHistoryDayDTO) => void;
}) {
  // En-têtes de colonnes alignés sur la grille (semaine commençant lundi).
  const heads = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const first = history[0];
  // Décalage pour aligner la première cellule sur un lundi.
  const firstWeekday = first ? new Date(`${first.date}T12:00:00`).getDay() : 1;
  const offset = (firstWeekday + 6) % 7;
  const cells: Array<HabitHistoryDayDTO | null> = [
    ...Array.from({ length: offset }, () => null),
    ...history,
  ];
  return (
    <div className="calendar" aria-label="Calendrier des validations">
      {heads.map((h, i) => (
        <div key={i} className="calendar__head">
          {h}
        </div>
      ))}
      {cells.map((day, i) =>
        day === null ? (
          <div key={`pad-${i}`} className="calendar__cell" style={{ visibility: 'hidden' }} />
        ) : (
          <button
            key={day.date}
            type="button"
            className={[
              'calendar__cell',
              day.expected ? 'calendar__cell--expected' : '',
              day.completed ? 'calendar__cell--done' : '',
              day.expected && !day.completed ? 'calendar__cell--missed' : '',
              day.date === todayIso ? 'calendar__cell--today' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onToggleDay(day)}
            disabled={!day.expected}
            aria-label={`${day.date} — ${day.completed ? 'fait' : day.expected ? 'manqué' : 'non planifié'}`}
          >
            {dayNumber(day.date)}
          </button>
        ),
      )}
    </div>
  );
}

export function HabitDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const today = useToday();
  const muts = useHabitMutations();
  const plan = me.data?.plan ?? 'free';
  const [days, setDays] = useState<'30' | '90' | '365'>('30');
  const history = useHabitHistory(id, Number(days));
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const detail = history.data;
  const habit = detail?.habit;
  const todayIso = today.data?.date ?? new Date().toISOString().slice(0, 10);
  const premiumLocked =
    history.isError &&
    history.error instanceof ApiClientError &&
    history.error.code === 'premium_required';

  async function toggleToday() {
    if (!habit) return;
    try {
      if (habit.doneToday) await muts.uncomplete.mutateAsync({ id: habit.id, date: todayIso });
      else await muts.complete.mutateAsync({ id: habit.id });
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Action impossible' });
    }
  }

  async function toggleDay(day: HabitHistoryDayDTO) {
    if (!habit || !day.expected) return;
    try {
      if (day.completed) await muts.uncomplete.mutateAsync({ id: habit.id, date: day.date });
      else await muts.complete.mutateAsync({ id: habit.id, date: day.date });
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Action impossible' });
    }
  }

  if (history.isPending) {
    return (
      <div className="screen">
        <div className="skeleton skeleton--title" style={{ marginBottom: 16 }} />
        <div className="skeleton skeleton--row" style={{ height: 200 }} />
      </div>
    );
  }

  if (premiumLocked) {
    return (
      <div className="screen">
        <header className="screen-header">
          <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => navigate(-1)} aria-label="Retour">
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <div className="screen-header__title">
            <h1 className="h-section">Historique Premium</h1>
          </div>
          <span style={{ width: 44 }} />
        </header>
        <div className="card center stack">
          <span style={{ fontSize: 34 }} aria-hidden="true">
            🔒
          </span>
          <h2 className="h-section">Historique {days} jours</h2>
          <p className="small muted">
            L’historique au-delà de 30 jours fait partie du plan Premium. L’essentiel reste
            entièrement gratuit.
          </p>
          <Link to="/profile/subscription">
            <Button block>Découvrir Premium</Button>
          </Link>
          <Button variant="ghost" onClick={() => setDays('30')}>
            Revenir à 30 jours (Free)
          </Button>
        </div>
      </div>
    );
  }

  if (history.isError || !detail || !habit) {
    return (
      <div className="screen">
        <ErrorState
          message={
            history.error instanceof ApiClientError
              ? history.error.message
              : 'Habitude introuvable (peut-être supprimée).'
          }
          onRetry={() => void history.refetch()}
        />
        <Button variant="secondary" block onClick={() => navigate('/habits')}>
          Retour aux habitudes
        </Button>
      </div>
    );
  }

  const paused = detail.paused;

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => navigate(-1)} aria-label="Retour">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <div className="screen-header__title" style={{ alignItems: 'center' }}>
          <h1 className="h-section">{habit.name}</h1>
          <span className="xsmall muted">{paused ? 'Suspendue' : scheduleLabel(habit.schedule)}</span>
        </div>
        <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => setEditOpen(true)} aria-label="Modifier l’habitude">
          <PencilIcon width={16} height={16} />
        </button>
      </header>

      <div className="stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-cell">
          <div className="stat-cell__value" style={{ color: 'var(--ember)' }}>
            {habit.currentStreak}
          </div>
          <div className="stat-cell__label">série en cours</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell__value">{habit.longestStreak}</div>
          <div className="stat-cell__label">record</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell__value">{formatPct(detail.completionRate)}</div>
          <div className="stat-cell__label">sur la période</div>
        </div>
      </div>

      <div className="card stack" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="row row--between">
          <h2 className="h-section">Historique</h2>
          <span className="xsmall faint">
            {plan === 'premium' ? 'Premium : 365 j max' : 'Free : 30 j'}
          </span>
        </div>
        <SegmentedControl
          ariaLabel="Période d’historique"
          options={
            plan === 'premium'
              ? [
                  { value: '30' as const, label: '30 j' },
                  { value: '90' as const, label: '90 j' },
                  { value: '365' as const, label: '365 j' },
                ]
              : [
                  { value: '30' as const, label: '30 j' },
                  { value: '90' as const, label: '90 j 🔒' },
                  { value: '365' as const, label: '365 j 🔒' },
                ]
          }
          value={days}
          onChange={(v) => setDays(v)}
        />
        {history.isPending ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : (
          <CalendarGrid history={detail.history} todayIso={todayIso} onToggleDay={(d) => void toggleDay(d)} />
        )}
        <div className="row" style={{ gap: 12 }} aria-hidden="true">
          <span className="xsmall muted">■ fait</span>
          <span className="xsmall muted" style={{ color: 'var(--danger)' }}>
            ■ manqué
          </span>
          <span className="xsmall muted">□ non planifié</span>
        </div>
      </div>

      <div className="stack">
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <div className="list-row" style={{ flex: 1 }}>
            <CheckCircle
              checked={habit.doneToday}
              disabled={paused || !habit.expectedToday}
              onToggle={() => void toggleToday()}
              label={habit.doneToday ? 'Annuler la validation du jour' : 'Valider aujourd’hui'}
            />
            <div className="list-row__main">
              <div className="list-row__title">
                {habit.doneToday ? 'Fait aujourd’hui ✓' : paused ? 'Habitude suspendue' : 'Aujourd’hui'}
              </div>
              <div className="list-row__sub">
                {habit.atRiskToday && !habit.doneToday ? 'Votre série est en sursis jusqu’à minuit' : weekdayHint(habit.expectedToday)}
              </div>
            </div>
          </div>
        </div>

        {paused ? (
          <Button
            block
            variant="secondary"
            pending={muts.resume.isPending}
            onClick={() =>
              muts.resume.mutate(habit.id, {
                onSuccess: () => toast.push({ message: 'Habitude reprise — la série est préservée' }),
                onError: (err) => toast.push({ message: err instanceof ApiClientError ? err.message : 'Reprise impossible' }),
              })
            }
          >
            <PlayIcon width={16} height={16} /> Reprendre l’habitude
          </Button>
        ) : (
          <Button
            block
            variant="secondary"
            pending={muts.pause.isPending}
            onClick={() =>
              muts.pause.mutate(habit.id, {
                onSuccess: () => toast.push({ message: 'Habitude suspendue — votre série est gelée, pas perdue' }),
                onError: (err) => toast.push({ message: err instanceof ApiClientError ? err.message : 'Suspension impossible' }),
              })
            }
          >
            <PauseIcon width={16} height={16} /> Suspendre (vacances, blessure…)
          </Button>
        )}

        <Button block variant="danger-outline" onClick={() => setConfirmDelete(true)}>
          <TrashIcon width={16} height={16} /> Supprimer l’habitude
        </Button>
      </div>

      <HabitSheet open={editOpen} habit={habit} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette habitude ?"
        body="Elle disparaîtra de vos listes. L’historique de validations est conservé en base pour vos statistiques passées, mais l’habitude ne sera plus restaurable depuis l’application."
        confirmLabel="Supprimer"
        danger
        pending={muts.remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          muts.remove.mutate(habit.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.push({ message: 'Habitude supprimée' });
              navigate('/habits');
            },
            onError: (err) => {
              setConfirmDelete(false);
              toast.push({ message: err instanceof ApiClientError ? err.message : 'Suppression impossible' });
            },
          })
        }
      />
    </div>
  );
}

function weekdayHint(expectedToday: boolean): string {
  return expectedToday ? 'Jour planifié — validez pour entretenir la flamme' : 'Rien de planifié aujourd’hui';
}
