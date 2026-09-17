/**
 * Habitudes — liste active du jour avec validation en un tap, streaks,
 * état suspendu, accès au détail (historique complet).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HabitDTO } from '@charbon/shared';
import { useHabitMutations, useHabits, useToday } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, CheckCircle, EmptyState, ErrorState, SkeletonRows } from '../components/ui.js';
import { ChevronRightIcon, PlayIcon, PlusIcon } from '../components/icons.js';
import { scheduleLabel } from '../lib/format.js';
import { useToast } from '../components/Toast.js';
import { HabitSheet } from './habits/HabitSheet.js';

export function HabitsScreen() {
  const navigate = useNavigate();
  const habits = useHabits();
  const today = useToday();
  const muts = useHabitMutations();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HabitDTO | null>(null);

  async function toggle(habit: HabitDTO) {
    const date = today.data?.date;
    try {
      if (habit.doneToday && date) {
        await muts.uncomplete.mutateAsync({ id: habit.id, date });
      } else {
        const res = await muts.complete.mutateAsync({ id: habit.id });
        if (res.streak.current > 1 && res.streak.current % 7 === 1) {
          toast.push({ message: `🔥 ${res.streak.current} jours d’affilée !` });
        }
      }
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Validation impossible' });
    }
  }

  return (
    <div className="screen screen--with-tabbar">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1 className="h-title">Habitudes</h1>
          <span className="xsmall muted">Petites actions, grands effets.</span>
        </div>
      </header>

      {habits.isPending ? (
        <SkeletonRows count={4} />
      ) : habits.isError ? (
        <ErrorState
          message={habits.error instanceof ApiClientError ? habits.error.message : 'Chargement impossible'}
          onRetry={() => void habits.refetch()}
        />
      ) : habits.data.items.length === 0 ? (
        <EmptyState
          icon="🔁"
          title="Aucune habitude pour l’instant"
          body="Choisissez UNE petite action que vous pouvez tenir chaque jour. C’est le meilleur point de départ."
          action={<Button onClick={() => setSheetOpen(true)}>Créer ma première habitude</Button>}
        />
      ) : (
        <div className="stack stack--tight">
          {habits.data.items.map((habit) => {
            const paused = habit.pausedAt !== null;
            return (
              <div className="list-row" key={habit.id} style={paused ? { opacity: 0.55 } : undefined}>
                <CheckCircle
                  checked={habit.doneToday}
                  disabled={paused}
                  onToggle={() => void toggle(habit)}
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
                  <div className="list-row__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{ width: 10, height: 10, borderRadius: '50%', background: habit.color, flexShrink: 0 }}
                      aria-hidden="true"
                    />
                    {habit.name}
                  </div>
                  <div className="list-row__sub">
                    {paused ? (
                      'Suspendue'
                    ) : (
                      <>
                        {scheduleLabel(habit.schedule)}
                        {habit.atRiskToday && !habit.doneToday ? ' · à faire aujourd’hui' : ''}
                      </>
                    )}
                  </div>
                </div>
                {!paused && habit.currentStreak > 0 && (
                  <span className={`streak-badge ${habit.atRiskToday && !habit.doneToday ? 'streak-badge--risk' : ''}`}>
                    🔥 {habit.currentStreak}
                  </span>
                )}
                {paused && (
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ width: 40, height: 40, minHeight: 40 }}
                    aria-label={`Reprendre « ${habit.name} »`}
                    onClick={() =>
                      muts.resume.mutate(habit.id, {
                        onError: (err) =>
                          toast.push({ message: err instanceof ApiClientError ? err.message : 'Reprise impossible' }),
                      })
                    }
                  >
                    <PlayIcon width={16} height={16} />
                  </button>
                )}
                <ChevronRightIcon width={16} height={16} className="faint" />
              </div>
            );
          })}
        </div>
      )}

      <button
        className="fab"
        aria-label="Nouvelle habitude"
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      >
        <PlusIcon width={24} height={24} />
      </button>

      <HabitSheet
        open={sheetOpen}
        habit={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
