/**
 * Sheet d'édition/création de tâche — validation client (zod partagé),
 * échéance date+heure, suppression avec toast « Annuler » géré par l'écran parent.
 */
import { useEffect, useState } from 'react';
import type { TaskDTO } from '@charbon/shared';
import { taskCreateSchema } from '@charbon/shared';
import { useTaskMutations } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, Sheet, TextArea, TextField } from '../../components/ui.js';
import { GoalSelect } from '../../components/GoalSelect.js';
import { fromLocalInputValue, toLocalInputValue } from '../../lib/format.js';
import { useToast } from '../../components/Toast.js';

export function TaskSheet({
  open,
  task,
  onClose,
}: {
  open: boolean;
  task: TaskDTO | null;
  onClose: () => void;
}) {
  const muts = useTaskMutations();
  const toast = useToast();
  const editing = task !== null;

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueLocal, setDueLocal] = useState('');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setDueLocal(task?.dueAt ? toLocalInputValue(task.dueAt) : '');
    setGoalId(task?.goalId ?? null);
    setError(null);
    setTitleError(null);
  }, [open, task]);

  const pending = muts.create.isPending || muts.update.isPending;

  async function save() {
    setError(null);
    setTitleError(null);
    const dueAt = dueLocal ? fromLocalInputValue(dueLocal) : null;
    const parsed = taskCreateSchema.safeParse({
      title,
      notes: notes.trim() === '' ? null : notes,
      goalId,
      dueAt,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setTitleError(first?.path[0] === 'title' ? first.message : 'Entrée invalide');
      if (first && first.path[0] !== 'title') setError(first.message);
      return;
    }
    try {
      if (editing && task) {
        await muts.update.mutateAsync({ id: task.id, patch: parsed.data });
        toast.push({ message: 'Tâche mise à jour' });
      } else {
        await muts.create.mutateAsync(parsed.data);
        toast.push({ message: 'Tâche ajoutée' });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Enregistrement impossible');
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifier la tâche' : 'Nouvelle tâche'}>
      <div className="stack">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          label="Titre"
          placeholder="Ex. Préparer ma tenue de sport"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          error={titleError}
          autoFocus
        />
        <TextArea
          label="Notes (optionnel)"
          placeholder="Détails, contexte…"
          value={notes}
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="field">
          <label className="field__label" htmlFor="task-due">
            Échéance (optionnel)
          </label>
          <input
            className="field__input"
            id="task-due"
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
          />
        </div>
        <GoalSelect value={goalId} onChange={setGoalId} />
        <div className="row" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" block onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button block onClick={() => void save()} pending={pending} disabled={title.trim().length === 0}>
            {editing ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
