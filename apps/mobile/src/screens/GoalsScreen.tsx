/**
 * Objectifs — actifs / terminés / archivés, édition, archivage, suppression.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GoalDTO } from '@charbon/shared';
import { goalCreateSchema, goalUpdateSchema } from '@charbon/shared';
import { useGoalMutations, useGoals } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Sheet,
  SkeletonRows,
  TextArea,
  TextField,
} from '../components/ui.js';
import { ChevronLeftIcon, PlusIcon, TargetIcon } from '../components/icons.js';
import { formatShortDate } from '../lib/format.js';
import { useToast } from '../components/Toast.js';

type StatusFilter = 'active' | 'completed' | 'archived';

const EMPTY: Record<StatusFilter, { icon: string; title: string; body: string }> = {
  active: {
    icon: '🎯',
    title: 'Aucun objectif actif',
    body: 'Un objectif donne une direction ; les habitudes font le chemin.',
  },
  completed: { icon: '🏆', title: 'Aucun objectif atteint', body: 'Vos victoires s’afficheront ici.' },
  archived: { icon: '🗄️', title: 'Aucun objectif archivé', body: 'Archivez ce qui n’est plus d’actualité.' },
};

export function GoalsScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusFilter>('active');
  const goals = useGoals(status);
  const muts = useGoalMutations();
  const toast = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<GoalDTO | null>(null);
  const [deleting, setDeleting] = useState<GoalDTO | null>(null);

  return (
    <div className="screen">
      <header className="screen-header">
        <button
          className="btn btn--icon btn--sm"
          style={{ width: 44, height: 44, minHeight: 44 }}
          onClick={() => navigate(-1)}
          aria-label="Retour"
        >
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <div className="screen-header__title" style={{ alignItems: 'center' }}>
          <h1 className="h-section">Objectifs</h1>
        </div>
        <span style={{ width: 44 }} />
      </header>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <SegmentedControl
          ariaLabel="Filtre d’objectifs"
          options={[
            { value: 'active', label: 'Actifs' },
            { value: 'completed', label: 'Atteints' },
            { value: 'archived', label: 'Archivés' },
          ]}
          value={status}
          onChange={setStatus}
        />
      </div>

      {goals.isPending ? (
        <SkeletonRows count={3} />
      ) : goals.isError ? (
        <ErrorState
          message={goals.error instanceof ApiClientError ? goals.error.message : 'Chargement impossible'}
          onRetry={() => void goals.refetch()}
        />
      ) : goals.data.items.length === 0 ? (
        <EmptyState
          {...EMPTY[status]}
          action={status === 'active' ? <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>Définir un objectif</Button> : undefined}
        />
      ) : (
        <div className="stack stack--tight">
          {goals.data.items.map((goal) => (
            <div className="card card--flat" key={goal.id}>
              <div className="row row--between">
                <div className="row" style={{ minWidth: 0 }}>
                  <TargetIcon width={18} height={18} style={{ color: 'var(--ember)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="list-row__title">{goal.title}</div>
                    <div className="list-row__sub">
                      {goal.targetDate ? `Cible : ${formatShortDate(goal.targetDate)}` : 'Sans échéance'}
                      {goal.description ? ` · ${goal.description}` : ''}
                    </div>
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {goal.status === 'active' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      pending={muts.setStatus.isPending}
                      onClick={() =>
                        muts.setStatus.mutate(
                          { id: goal.id, status: 'completed' },
                          { onSuccess: () => toast.push({ message: 'Objectif atteint 🏆' }) },
                        )
                      }
                    >
                      Atteint ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => muts.setStatus.mutate({ id: goal.id, status: 'archived' })}
                    >
                      Archiver
                    </Button>
                  </>
                )}
                {goal.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => muts.setStatus.mutate({ id: goal.id, status: 'active' })}
                  >
                    Réactiver
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setEditing(goal); setSheetOpen(true); }}>
                  Modifier
                </Button>
                <Button size="sm" variant="ghost" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(goal)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="fab"
        aria-label="Nouvel objectif"
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      >
        <PlusIcon width={24} height={24} />
      </button>

      <GoalSheet open={sheetOpen} goal={editing} onClose={() => { setSheetOpen(false); setEditing(null); }} />

      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer cet objectif ?"
        body="Les tâches et habitudes liées seront conservées, mais détachées de cet objectif."
        confirmLabel="Supprimer"
        danger
        pending={muts.remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          muts.remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.push({ message: 'Objectif supprimé' });
            },
            onError: (err) => {
              setDeleting(null);
              toast.push({ message: err instanceof ApiClientError ? err.message : 'Suppression impossible' });
            },
          });
        }}
      />
    </div>
  );
}

function GoalSheet({ open, goal, onClose }: { open: boolean; goal: GoalDTO | null; onClose: () => void }) {
  const muts = useGoalMutations();
  const toast = useToast();
  const editing = goal !== null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Réinitialisation à l'ouverture (pas d'effet de bord hors mount).
  const [lastOpenKey, setLastOpenKey] = useState<string | null>(null);
  const openKey = open ? (goal?.id ?? 'new') : null;
  if (open && openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    setTitle(goal?.title ?? '');
    setDescription(goal?.description ?? '');
    setTargetDate(goal?.targetDate ?? '');
    setError(null);
  }
  if (!open && lastOpenKey !== null) setLastOpenKey(null);

  const pending = muts.create.isPending || muts.update.isPending;

  async function save() {
    setError(null);
    const payload = {
      title,
      description: description.trim() === '' ? null : description,
      targetDate: targetDate === '' ? null : targetDate,
    };
    try {
      if (editing && goal) {
        const parsed = goalUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
          return;
        }
        await muts.update.mutateAsync({ id: goal.id, patch: parsed.data });
        toast.push({ message: 'Objectif mis à jour' });
      } else {
        const parsed = goalCreateSchema.safeParse(payload);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
          return;
        }
        await muts.create.mutateAsync(parsed.data);
        toast.push({ message: 'Objectif créé' });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Enregistrement impossible');
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifier l’objectif' : 'Nouvel objectif'}>
      <div className="stack">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          label="Objectif"
          placeholder="Ex. Courir un semi-marathon"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <TextArea
          label="Pourquoi c’est important (optionnel)"
          value={description}
          maxLength={1000}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="field">
          <label className="field__label" htmlFor="goal-target">
            Date cible (optionnel)
          </label>
          <input
            className="field__input"
            id="goal-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Button variant="secondary" block onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button block onClick={() => void save()} pending={pending} disabled={title.trim().length === 0}>
            {editing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
