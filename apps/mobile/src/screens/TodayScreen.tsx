/**
 * Aujourd'hui — le dashboard : progression du jour, tâches, habitudes,
 * routines, objectifs, streak et constance, en un coup d'œil.
 * Chaque section a ses états réels : skeleton / vide (avec CTA) / erreur (retry).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { HabitDTO, TaskDTO } from '@charbon/shared';
import { useHabitMutations, useTaskMutations, useToday } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import {
  Button,
  CheckCircle,
  EmptyState,
  ErrorState,
  ProgressBar,
  ProgressRing,
  SkeletonRows,
} from '../components/ui.js';
import { BellIcon, ChartIcon, ChevronRightIcon, TargetIcon } from '../components/icons.js';
import { formatDueLabel, formatLongDate, formatPct, scheduleLabel } from '../lib/format.js';
import { useToast } from '../components/Toast.js';
import { TaskSheet } from './tasks/TaskSheet.js';

export function TodayScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const today = useToday();
  const taskMuts = useTaskMutations();
  const habitMuts = useHabitMutations();
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (today.isPending) {
    return (
      <div className="screen screen--with-tabbar">
        <div className="skeleton skeleton--ring" style={{ marginBottom: 'var(--space-5)' }} />
        <SkeletonRows count={5} />
      </div>
    );
  }

  if (today.isError) {
    const message =
      today.error instanceof ApiClientError ? today.error.message : 'Impossible de charger la journée.';
    return (
      <div className="screen screen--with-tabbar">
        <ErrorState message={message} onRetry={() => void today.refetch()} />
      </div>
    );
  }

  const data = today.data;
  if (!data) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  async function toggleTask(task: TaskDTO) {
    if (!data) return;
    try {
      if (task.status === 'done') await taskMuts.uncomplete.mutateAsync(task.id);
      else await taskMuts.complete.mutateAsync(task.id);
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Action impossible' });
    }
  }

  async function toggleHabit(habit: HabitDTO & { atRiskToday?: boolean }) {
    if (!data) return;
    try {
      if (habit.doneToday) await habitMuts.uncomplete.mutateAsync({ id: habit.id, date: data.date });
      else {
        const res = await habitMuts.complete.mutateAsync({ id: habit.id });
        if (res.streak.current > 0 && res.streak.current % 7 === 0) {
          toast.push({ message: `🔥 ${res.streak.current} jours d’affilée !` });
        }
      }
    } catch (err) {
      toast.push({
        message: err instanceof ApiClientError ? err.message : 'Validation impossible',
      });
    }
  }

  const allDone = data.progress.expected > 0 && data.progress.completed >= data.progress.expected;

  return (
    <div className="screen screen--with-tabbar">
      <header className="screen-header">
        <div className="screen-header__title">
          <span className="xsmall muted" style={{ textTransform: 'capitalize' }}>
            {formatLongDate(data.date)}
          </span>
          <h1 className="h-title">{greeting} 👋</h1>
        </div>
        <div className="screen-header__actions">
          <button
            className="btn btn--icon btn--sm"
            style={{ width: 44, height: 44, minHeight: 44, position: 'relative' }}
            onClick={() => void today.refetch()}
            aria-label="Actualiser"
          >
            ↻
          </button>
          <Link
            to="/notifications"
            className="btn btn--icon btn--sm"
            style={{ width: 44, height: 44, minHeight: 44, position: 'relative' }}
            aria-label={`Notifications${data.unreadNotifications > 0 ? ` (${data.unreadNotifications} non lues)` : ''}`}
          >
            <BellIcon width={18} height={18} />
            {data.unreadNotifications > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 9,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--ember)',
                }}
                aria-hidden="true"
              />
            )}
          </Link>
        </div>
      </header>

      {/* Hero : progression + streak */}
      <div className="today-hero">
        <ProgressRing pct={data.progress.rate} caption={allDone ? 'journée complète' : 'du jour'} />
        <div className="today-hero__side">
          <div className="strong">
            {data.progress.completed}/{data.progress.expected} actions
          </div>
          <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span className={`streak-badge ${data.streak.current > 0 ? '' : ''}`} title="Jours parfaits consécutifs">
              🔥 {data.streak.current} jour{data.streak.current > 1 ? 's' : ''}
            </span>
            <Link to="/stats" className="badge">
              <span className="row" style={{ gap: 4 }}>
                <ChartIcon width={12} height={12} /> Stats
              </span>
            </Link>
          </div>
          {allDone && <div className="xsmall" style={{ color: 'var(--success)' }}>Journée parfaite. Bravo.</div>}
          {data.progress.expected === 0 && (
            <div className="xsmall muted">Rien de planifié aujourd’hui.</div>
          )}
        </div>
      </div>

      {/* Tâches du jour */}
      <section className="section">
        <div className="section-head">
          <h2>Tâches</h2>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="badge"
              onClick={() => {
                setEditingTask(null);
                setSheetOpen(true);
              }}
            >
              + Ajouter
            </button>
            <Link to="/tasks" className="badge">
              Tout voir
            </Link>
          </div>
        </div>
        {data.tasks.length === 0 ? (
          <EmptyState
            icon="🗒️"
            title="Aucune tâche aujourd’hui"
            body="Ajoutez une première action pour votre journée."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingTask(null);
                  setSheetOpen(true);
                }}
              >
                Ajouter une tâche
              </Button>
            }
          />
        ) : (
          <div className="stack stack--tight">
            {data.tasks.map((task) => (
              <div className="list-row" key={task.id}>
                <CheckCircle
                  checked={task.status === 'done'}
                  onToggle={() => void toggleTask(task)}
                  label={task.status === 'done' ? `Marquer « ${task.title} » à faire` : `Terminer « ${task.title} »`}
                  square
                />
                <div
                  className="list-row__main"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setEditingTask(task);
                    setSheetOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setEditingTask(task);
                      setSheetOpen(true);
                    }
                  }}
                >
                  <div className={`list-row__title ${task.status === 'done' ? 'list-row__title--done' : ''}`}>
                    {task.title}
                  </div>
                  {task.dueAt && <div className="list-row__sub">{formatDueLabel(task.dueAt, data.date)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Habitudes */}
      <section className="section">
        <div className="section-head">
          <h2>Habitudes</h2>
          <Link to="/habits" className="badge">
            Tout voir
          </Link>
        </div>
        {data.habits.length === 0 ? (
          <EmptyState
            icon="🔁"
            title="Aucune habitude"
            body="Une petite action répétée chaque jour vaut mieux qu’un grand élan isolé."
            action={
              <Button size="sm" onClick={() => navigate('/habits')}>
                Créer une habitude
              </Button>
            }
          />
        ) : (
          <div className="stack stack--tight">
            {data.habits.map((habit) => {
              const paused = habit.pausedAt !== null;
              return (
                <div className="list-row" key={habit.id} style={paused ? { opacity: 0.55 } : undefined}>
                  <CheckCircle
                    checked={habit.doneToday}
                    disabled={paused || !habit.expectedToday}
                    onToggle={() => void toggleHabit(habit)}
                    label={habit.doneToday ? `Annuler « ${habit.name} »` : `Valider « ${habit.name} »`}
                  />
                  <div
                    className="list-row__main"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/habits/${habit.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/habits/${habit.id}`);
                      }
                    }}
                  >
                    <div className="list-row__title">{habit.name}</div>
                    <div className="list-row__sub">
                      {paused ? 'Suspendue' : scheduleLabel(habit.schedule)}
                      {habit.atRiskToday ? ' · à faire aujourd’hui' : ''}
                    </div>
                  </div>
                  {!paused && habit.currentStreak > 0 && (
                    <span className={`streak-badge ${habit.atRiskToday ? 'streak-badge--risk' : ''}`}>
                      🔥 {habit.currentStreak}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Routines */}
      <section className="section">
        <div className="section-head">
          <h2>Routines</h2>
          <Link to="/routines" className="badge">
            Tout voir
          </Link>
        </div>
        {data.routines.filter((r) => r.scheduledToday).length === 0 ? (
          <EmptyState
            icon="🧭"
            title="Aucune routine aujourd’hui"
            body="Les routines enchaînent plusieurs actions en pilote automatique."
            action={
              <Button size="sm" onClick={() => navigate('/routines')}>
                Créer une routine
              </Button>
            }
          />
        ) : (
          <div className="stack stack--tight">
            {data.routines
              .filter((r) => r.scheduledToday)
              .map((routine) => (
                <div
                  className="list-row"
                  key={routine.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/routines/${routine.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/routines/${routine.id}`);
                    }
                  }}
                >
                  <div className="list-row__main">
                    <div className="list-row__title">
                      {routine.name}{' '}
                      {routine.doneToday && <span className="badge badge--success">terminée</span>}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ProgressBar pct={routine.itemsTotal === 0 ? 0 : routine.itemsDoneToday / routine.itemsTotal} />
                    </div>
                    <div className="list-row__sub">
                      {routine.itemsDoneToday}/{routine.itemsTotal} actions
                      {routine.scheduledTime ? ` · ${routine.scheduledTime}` : ''}
                    </div>
                  </div>
                  <ChevronRightIcon width={18} height={18} className="faint" />
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Objectifs */}
      <section className="section">
        <div className="section-head">
          <h2>Objectifs</h2>
          <Link to="/goals" className="badge">
            Tout voir
          </Link>
        </div>
        {data.goals.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Aucun objectif actif"
            body="Donnez une direction à votre discipline."
            action={
              <Button size="sm" onClick={() => navigate('/goals')}>
                Définir un objectif
              </Button>
            }
          />
        ) : (
          <div className="stack stack--tight">
            {data.goals.slice(0, 3).map((goal) => (
              <Link key={goal.id} to="/goals" className="goal-pill">
                <span className="row" style={{ gap: 10, minWidth: 0 }}>
                  <TargetIcon width={18} height={18} style={{ color: 'var(--ember)', flexShrink: 0 }} />
                  <span className="list-row__title">{goal.title}</span>
                </span>
                <ChevronRightIcon width={16} height={16} className="faint" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="xsmall faint center">
        Régularité {formatPct(data.progress.rate)} aujourd’hui · streak record {data.streak.longest} j
      </p>

      <TaskSheet
        open={sheetOpen}
        task={editingTask}
        onClose={() => {
          setSheetOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}
