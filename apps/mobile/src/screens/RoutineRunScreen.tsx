/**
 * Exécution d'une routine aujourd'hui : progression, actions cochables
 * (aller-retour possible), édition et suppression de la routine.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutinesToday, useRoutineMutations, useToday } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, CheckCircle, ConfirmDialog, EmptyState, ErrorState, ProgressRing, SkeletonRows } from '../components/ui.js';
import { ChevronLeftIcon, PencilIcon, TrashIcon } from '../components/icons.js';
import { formatDuration, scheduleLabel, timeOfDayLabel } from '../lib/format.js';
import { useToast } from '../components/Toast.js';
import { RoutineSheet } from './routines/RoutineSheet.js';

export function RoutineRunScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const routinesToday = useRoutinesToday();
  const today = useToday();
  const muts = useRoutineMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const routine = routinesToday.data?.items.find((r) => r.id === id);
  const todayIso = today.data?.date ?? new Date().toISOString().slice(0, 10);

  if (routinesToday.isPending) {
    return (
      <div className="screen">
        <div className="skeleton skeleton--title" style={{ marginBottom: 16 }} />
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (routinesToday.isError) {
    return (
      <div className="screen">
        <ErrorState
          message={routinesToday.error instanceof ApiClientError ? routinesToday.error.message : 'Chargement impossible'}
          onRetry={() => void routinesToday.refetch()}
        />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="screen">
        <EmptyState
          icon="🧭"
          title="Routine introuvable"
          body="Elle a peut-être été supprimée depuis un autre appareil."
          action={<Button onClick={() => navigate('/routines')}>Retour aux routines</Button>}
        />
      </div>
    );
  }

  async function toggleItem(itemId: string, done: boolean) {
    try {
      if (done) await muts.uncompleteItem.mutateAsync({ id: routine!.id, itemId, date: todayIso });
      else await muts.completeItem.mutateAsync({ id: routine!.id, itemId });
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Action impossible' });
    }
  }

  const pct = routine.itemsTotal === 0 ? 0 : routine.itemsDoneToday / routine.itemsTotal;

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => navigate('/routines')} aria-label="Retour">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <div className="screen-header__title" style={{ alignItems: 'center' }}>
          <h1 className="h-section">{routine.name}</h1>
          <span className="xsmall muted">
            {timeOfDayLabel(routine.timeOfDay)} · {scheduleLabel(routine.schedule)}
            {routine.scheduledTime ? ` · ${routine.scheduledTime}` : ''}
          </span>
        </div>
        <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => setEditOpen(true)} aria-label="Modifier la routine">
          <PencilIcon width={16} height={16} />
        </button>
      </header>

      {!routine.scheduledToday && (
        <div className="form-success" style={{ marginBottom: 'var(--space-4)' }} role="status">
          Cette routine n’est pas planifiée aujourd’hui — vous pouvez quand même avancer sur ses
          actions (elles compteront pour aujourd’hui).
        </div>
      )}

      <div className="card center" style={{ marginBottom: 'var(--space-5)' }}>
        <ProgressRing
          pct={pct}
          size={120}
          caption={`${routine.itemsDoneToday}/${routine.itemsTotal}`}
        />
        <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
          {routine.doneToday
            ? 'Routine terminée. Tenir ce cap, c’est exactement ça, la discipline. 🔥'
            : routine.itemsDoneToday === 0
              ? 'Commencez par la première action — le reste suit.'
              : `Plus que ${routine.itemsTotal - routine.itemsDoneToday} action${routine.itemsTotal - routine.itemsDoneToday > 1 ? 's' : ''}.`}
        </p>
      </div>

      {routine.items.length === 0 ? (
        <EmptyState
          icon="🧩"
          title="Aucune action dans cette routine"
          body="Ajoutez des étapes courtes et concrètes pour la rendre automatique."
          action={<Button onClick={() => setEditOpen(true)}>Ajouter des actions</Button>}
        />
      ) : (
        <div className="stack stack--tight">
          {routine.items.map((item, idx) => {
            const state = routine.itemStates.find((s) => s.itemId === item.id);
            const done = state?.done ?? false;
            return (
              <div className="list-row" key={item.id}>
                <span className="xsmall faint" style={{ width: 20, textAlign: 'center' }} aria-hidden="true">
                  {idx + 1}
                </span>
                <div className="list-row__main">
                  <div className={`list-row__title ${done ? 'list-row__title--done' : ''}`}>{item.title}</div>
                  {item.durationMinutes ? (
                    <div className="list-row__sub">{formatDuration(item.durationMinutes)}</div>
                  ) : null}
                </div>
                <CheckCircle
                  checked={done}
                  square
                  onToggle={() => void toggleItem(item.id, done)}
                  label={done ? `Annuler « ${item.title} »` : `Faire « ${item.title} »`}
                />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-6)' }}>
        <Button block variant="danger-outline" onClick={() => setConfirmDelete(true)}>
          <TrashIcon width={16} height={16} /> Supprimer la routine
        </Button>
      </div>

      <RoutineSheet open={editOpen} routine={routine} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette routine ?"
        body="Ses actions et son suivi du jour disparaîtront de vos listes. Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        pending={muts.remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          muts.remove.mutate(routine!.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.push({ message: 'Routine supprimée' });
              navigate('/routines');
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
