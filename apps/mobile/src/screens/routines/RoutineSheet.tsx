/**
 * Sheet création/édition de routine : nom, moment, heure, planning,
 * et liste d'actions (ajout/suppression/renommage en création comme en édition).
 */
import { useEffect, useState } from 'react';
import type { RoutineDTO } from '@charbon/shared';
import { routineCreateSchema, routineUpdateSchema } from '@charbon/shared';
import { useRoutineMutations } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, DayPicker, Sheet, TextField } from '../../components/ui.js';
import { PlusIcon, TrashIcon } from '../../components/icons.js';
import { useToast } from '../../components/Toast.js';
import { timeOfDayLabel } from '../../lib/format.js';

const TIMES = ['morning', 'midday', 'evening', 'custom'] as const;
type TimeOfDay = (typeof TIMES)[number];

interface DraftItem {
  id?: string; // présent en édition
  title: string;
}

export function RoutineSheet({
  open,
  routine,
  onClose,
}: {
  open: boolean;
  routine: RoutineDTO | null;
  onClose: () => void;
}) {
  const muts = useRoutineMutations();
  const toast = useToast();
  const editing = routine !== null;

  const [name, setName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'days_of_week'>('daily');
  const [days, setDays] = useState<number[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(routine?.name ?? '');
    setTimeOfDay((routine?.timeOfDay as TimeOfDay) ?? 'morning');
    setScheduledTime(routine?.scheduledTime ?? '');
    setScheduleType(routine?.schedule.type ?? 'daily');
    setDays(routine?.schedule.days ?? []);
    setItems(routine?.items.map((i) => ({ id: i.id, title: i.title })) ?? []);
    setNewItem('');
    setError(null);
  }, [open, routine]);

  const pending = muts.create.isPending || muts.update.isPending;

  function addItem() {
    const title = newItem.trim();
    if (!title) return;
    if (items.length >= 30) {
      setError('Maximum 30 actions par routine');
      return;
    }
    setItems((prev) => [...prev, { title }]);
    setNewItem('');
  }

  async function save() {
    setError(null);
    const payloadBase = {
      name,
      timeOfDay,
      scheduledTime: scheduledTime === '' ? null : scheduledTime,
      schedule:
        scheduleType === 'daily'
          ? { type: 'daily' as const, days: [] }
          : { type: 'days_of_week' as const, days },
    };

    try {
      if (editing && routine) {
        const parsed = routineUpdateSchema.safeParse(payloadBase);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
          return;
        }
        await muts.update.mutateAsync({ id: routine.id, patch: parsed.data });

        // 1) Suppressions des actions retirées du draft.
        const keptIds = new Set(items.map((i) => i.id).filter((x): x is string => !!x));
        for (const existing of routine.items) {
          if (!keptIds.has(existing.id)) {
            await muts.deleteItem.mutateAsync({ id: routine.id, itemId: existing.id });
          }
        }

        // 2) Renommages.
        for (const draft of items) {
          if (!draft.id) continue;
          const existing = routine.items.find((i) => i.id === draft.id);
          if (existing && existing.title !== draft.title) {
            await muts.updateItem.mutateAsync({
              id: routine.id,
              itemId: draft.id,
              patch: { title: draft.title },
            });
          }
        }

        // 3) Ajouts — la réponse de l'API contient la routine à jour :
        //    on identifie le nouvel item par différence d'ids (fiable, pas de
        //    correspondance par titre).
        const knownIds = new Set(routine.items.filter((i) => keptIds.has(i.id)).map((i) => i.id));
        const newIdByIndex = new Map<number, string>();
        for (let idx = 0; idx < items.length; idx++) {
          const draft = items[idx];
          if (!draft || draft.id) continue;
          const updated = await muts.addItem.mutateAsync({
            id: routine.id,
            item: { title: draft.title },
          });
          const created = updated.items.find((i) => !knownIds.has(i.id));
          if (created) {
            newIdByIndex.set(idx, created.id);
            knownIds.add(created.id);
          }
        }

        // 4) Réordonnancement final selon l'ordre exact du draft.
        const orderIds = items
          .map((d, idx) => d.id ?? newIdByIndex.get(idx) ?? '')
          .filter((x) => x !== '');
        if (orderIds.length === items.length && orderIds.length > 0) {
          await muts.reorderItems.mutateAsync({ id: routine.id, itemIds: orderIds });
        }

        toast.push({ message: 'Routine mise à jour' });
      } else {
        const parsed = routineCreateSchema.safeParse({
          ...payloadBase,
          items: items.map((i) => ({ title: i.title })),
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
          return;
        }
        await muts.create.mutateAsync(parsed.data);
        toast.push({ message: 'Routine créée' });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Enregistrement impossible');
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifier la routine' : 'Nouvelle routine'}>
      <div className="stack">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          label="Nom de la routine"
          placeholder="Ex. Routine matin"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="field">
          <span className="field__label">Moment</span>
          <div className="chips">
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${timeOfDay === t ? 'chip--active' : ''}`}
                onClick={() => setTimeOfDay(t)}
                aria-pressed={timeOfDay === t}
              >
                {timeOfDayLabel(t)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="routine-time">
            Heure prévue (optionnel)
          </label>
          <input
            className="field__input"
            id="routine-time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="field__label">Jours</span>
          <div className="segmented" role="tablist" aria-label="Fréquence de la routine">
            <button
              role="tab"
              type="button"
              aria-selected={scheduleType === 'daily'}
              className={`segmented__option ${scheduleType === 'daily' ? 'segmented__option--active' : ''}`}
              onClick={() => setScheduleType('daily')}
            >
              Tous les jours
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={scheduleType === 'days_of_week'}
              className={`segmented__option ${scheduleType === 'days_of_week' ? 'segmented__option--active' : ''}`}
              onClick={() => {
                setScheduleType('days_of_week');
                if (days.length === 0) setDays([1, 2, 3, 4, 5]);
              }}
            >
              Certains jours
            </button>
          </div>
          {scheduleType === 'days_of_week' && <DayPicker days={days} onChange={setDays} />}
        </div>

        <div className="field">
          <span className="field__label">Actions ({items.length}/30)</span>
          <div className="stack stack--tight">
            {items.map((item, idx) => (
              <div className="list-row" key={item.id ?? `draft-${idx}`} style={{ minHeight: 52 }}>
                <input
                  className="field__input"
                  style={{ minHeight: 40, background: 'transparent', border: 'none', padding: 0 }}
                  value={item.title}
                  maxLength={120}
                  aria-label={`Action ${idx + 1}`}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)),
                    )
                  }
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ width: 36, height: 36, minHeight: 36, color: 'var(--danger)' }}
                  aria-label={`Retirer l’action « ${item.title} »`}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <TrashIcon width={15} height={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <input
              className="field__input"
              placeholder="Ajouter une action…"
              value={newItem}
              maxLength={120}
              aria-label="Nouvelle action"
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <Button variant="secondary" onClick={addItem} disabled={newItem.trim().length === 0} aria-label="Ajouter l’action">
              <PlusIcon width={16} height={16} />
            </Button>
          </div>
        </div>

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
            {editing ? 'Enregistrer' : 'Créer la routine'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
