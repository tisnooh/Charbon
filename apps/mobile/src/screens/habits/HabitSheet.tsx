/**
 * Sheet création/édition d'habitude : nom, couleur, planning (tous les jours
 * ou jours choisis), objectif lié. Validation via le schéma zod partagé.
 */
import { useEffect, useState } from 'react';
import type { HabitDTO } from '@charbon/shared';
import { habitCreateSchema, habitUpdateSchema } from '@charbon/shared';
import { useHabitMutations } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, DayPicker, Sheet, TextField } from '../../components/ui.js';
import { GoalSelect } from '../../components/GoalSelect.js';
import { useToast } from '../../components/Toast.js';

const COLORS = ['#F97316', '#F59E0B', '#34D399', '#38BDF8', '#8B5CF6', '#F472B6', '#F87171', '#A3E635'];

export function HabitSheet({
  open,
  habit,
  onClose,
}: {
  open: boolean;
  habit: HabitDTO | null;
  onClose: () => void;
}) {
  const muts = useHabitMutations();
  const toast = useToast();
  const editing = habit !== null;

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0] as string);
  const [scheduleType, setScheduleType] = useState<'daily' | 'days_of_week'>('daily');
  const [days, setDays] = useState<number[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? '');
    setColor(habit?.color ?? (COLORS[0] as string));
    setScheduleType(habit?.schedule.type ?? 'daily');
    setDays(habit?.schedule.days ?? []);
    setGoalId(habit?.goalId ?? null);
    setError(null);
  }, [open, habit]);

  const pending = muts.create.isPending || muts.update.isPending;

  async function save() {
    setError(null);
    const payload = {
      name,
      color,
      schedule: scheduleType === 'daily' ? { type: 'daily' as const, days: [] } : { type: 'days_of_week' as const, days },
      goalId,
    };
    try {
      if (editing && habit) {
        const parsed = habitUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
          return;
        }
        await muts.update.mutateAsync({ id: habit.id, patch: parsed.data });
        toast.push({ message: 'Habitude mise à jour' });
      } else {
        const parsed = habitCreateSchema.safeParse(payload);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
          return;
        }
        await muts.create.mutateAsync(parsed.data);
        toast.push({ message: 'Habitude créée — premier jour : aujourd’hui 🔥' });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Enregistrement impossible');
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifier l’habitude' : 'Nouvelle habitude'}>
      <div className="stack">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          label="Nom de l’habitude"
          placeholder="Ex. Lire 10 minutes"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="field">
          <span className="field__label">Couleur</span>
          <div className="chips" role="radiogroup" aria-label="Couleur de l’habitude">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Couleur ${c}`}
                onClick={() => setColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid var(--text)' : '3px solid transparent',
                  boxShadow: color === c ? '0 0 0 2px var(--ember)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field__label">Fréquence</span>
          <div className="segmented" role="tablist" aria-label="Fréquence">
            <button
              role="tab"
              aria-selected={scheduleType === 'daily'}
              className={`segmented__option ${scheduleType === 'daily' ? 'segmented__option--active' : ''}`}
              onClick={() => setScheduleType('daily')}
              type="button"
            >
              Tous les jours
            </button>
            <button
              role="tab"
              aria-selected={scheduleType === 'days_of_week'}
              className={`segmented__option ${scheduleType === 'days_of_week' ? 'segmented__option--active' : ''}`}
              onClick={() => {
                setScheduleType('days_of_week');
                if (days.length === 0) setDays([1, 2, 3, 4, 5]);
              }}
              type="button"
            >
              Certains jours
            </button>
          </div>
          {scheduleType === 'days_of_week' && <DayPicker days={days} onChange={setDays} />}
          {scheduleType === 'days_of_week' && days.length === 0 && (
            <span className="field__error">Choisissez au moins un jour</span>
          )}
        </div>
        <GoalSelect value={goalId} onChange={setGoalId} />
        <div className="row" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" block onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            block
            onClick={() => void save()}
            pending={pending}
            disabled={name.trim().length === 0 || (scheduleType === 'days_of_week' && days.length === 0)}
          >
            {editing ? 'Enregistrer' : 'Créer l’habitude'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
