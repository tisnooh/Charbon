/**
 * Tâches — vues filtrées (jour, à venir, toutes, faites, corbeille),
 * complétion en un tap, suppression douce avec Annuler (restauration réelle).
 */
import { useState } from 'react';
import type { TaskDTO } from '@charbon/shared';
import { useTaskMutations, useTasks, useToday, type TaskView } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, CheckCircle, EmptyState, ErrorState, SegmentedControl, SkeletonRows } from '../components/ui.js';
import { PlusIcon, TrashIcon } from '../components/icons.js';
import { formatDueLabel } from '../lib/format.js';
import { useToast } from '../components/Toast.js';
import { TaskSheet } from './tasks/TaskSheet.js';

const VIEWS: Array<{ value: TaskView; label: string }> = [
  { value: 'today', label: 'Jour' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'all', label: 'Toutes' },
  { value: 'done', label: 'Faites' },
  { value: 'deleted', label: 'Corbeille' },
];

const EMPTY_COPY: Record<TaskView, { icon: string; title: string; body: string }> = {
  today: { icon: '🌤️', title: 'Rien pour aujourd’hui', body: 'Ajoutez une tâche ou profitez de l’instant.' },
  upcoming: { icon: '📅', title: 'Aucune échéance à venir', body: 'Planifiez vos prochains jours.' },
  all: { icon: '🗒️', title: 'Aucune tâche en attente', body: 'Votre liste est claire.' },
  done: { icon: '✅', title: 'Aucune tâche terminée', body: 'Vos réussites apparaîtront ici.' },
  deleted: { icon: '🗑️', title: 'Corbeille vide', body: 'Les tâches supprimées sont restaurables ici.' },
};

export function TasksScreen() {
  const [view, setView] = useState<TaskView>('today');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);
  const tasks = useTasks(view);
  const today = useToday();
  const muts = useTaskMutations();
  const toast = useToast();

  async function toggle(task: TaskDTO) {
    try {
      if (task.status === 'done') await muts.uncomplete.mutateAsync(task.id);
      else await muts.complete.mutateAsync(task.id);
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Action impossible' });
    }
  }

  function remove(task: TaskDTO) {
    muts.remove.mutate(task.id, {
      onSuccess: () => {
        toast.push({
          message: `« ${task.title} » supprimée`,
          actionLabel: 'Annuler',
          onAction: () => muts.restore.mutate(task.id),
        });
      },
      onError: (err) => {
        toast.push({ message: err instanceof ApiClientError ? err.message : 'Suppression impossible' });
      },
    });
  }

  return (
    <div className="screen screen--with-tabbar">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1 className="h-title">Tâches</h1>
        </div>
      </header>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <SegmentedControl options={VIEWS} value={view} onChange={setView} ariaLabel="Filtres de tâches" />
      </div>

      {tasks.isPending ? (
        <SkeletonRows count={4} />
      ) : tasks.isError ? (
        <ErrorState
          message={tasks.error instanceof ApiClientError ? tasks.error.message : 'Chargement impossible'}
          onRetry={() => void tasks.refetch()}
        />
      ) : tasks.data.items.length === 0 ? (
        <EmptyState {...EMPTY_COPY[view]} />
      ) : (
        <div className="stack stack--tight">
          {tasks.data.items.map((task) => {
            const todayIso = today.data?.date ?? new Date().toISOString().slice(0, 10);
            return (
              <div className="list-row" key={task.id}>
                {view === 'deleted' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      muts.restore.mutate(task.id, {
                        onSuccess: () => toast.push({ message: 'Tâche restaurée' }),
                      })
                    }
                    pending={muts.restore.isPending && muts.restore.variables === task.id}
                  >
                    Restaurer
                  </Button>
                ) : view === 'done' ? (
                  <CheckCircle
                    checked
                    square
                    onToggle={() => void toggle(task)}
                    label={`Remettre « ${task.title} » à faire`}
                  />
                ) : (
                  <CheckCircle
                    checked={task.status === 'done'}
                    square
                    onToggle={() => void toggle(task)}
                    label={task.status === 'done' ? `Annuler « ${task.title} »` : `Terminer « ${task.title} »`}
                  />
                )}
                <div
                  className="list-row__main"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (view === 'deleted') return;
                    setEditing(task);
                    setSheetOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && view !== 'deleted') {
                      e.preventDefault();
                      setEditing(task);
                      setSheetOpen(true);
                    }
                  }}
                >
                  <div className={`list-row__title ${task.status === 'done' ? 'list-row__title--done' : ''}`}>
                    {task.title}
                  </div>
                  <div className="list-row__sub">
                    {task.dueAt ? formatDueLabel(task.dueAt, todayIso) : 'Sans échéance'}
                  </div>
                </div>
                {view !== 'deleted' && (
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ width: 40, height: 40, minHeight: 40, color: 'var(--danger)' }}
                    onClick={() => remove(task)}
                    aria-label={`Supprimer « ${task.title} »`}
                  >
                    <TrashIcon width={17} height={17} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view !== 'deleted' && (
        <button
          className="fab"
          aria-label="Nouvelle tâche"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <PlusIcon width={24} height={24} />
        </button>
      )}

      <TaskSheet
        open={sheetOpen}
        task={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
